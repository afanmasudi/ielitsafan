/**
 * Real-time voice activity detection (VAD) and a persistent microphone for live conversation.
 * Energy-based with an adaptive noise floor: robust, tiny and fast enough to run every 30 ms.
 */
import { decodeTo16k, type Recording } from './recorder';

export type VadEvent = 'start' | 'end' | null;

export interface VadOptions {
  /** Speech must stay above the threshold this long before it counts (filters clicks and coughs). */
  startMs?: number;
  /** Silence needed before a speech segment is considered finished. */
  hangMs?: number;
  /** Multiplier applied to the threshold while the examiner is talking (echo/bleed protection). */
  bargeFactor?: number;
}

/** Pure, frame-by-frame VAD. Feed RMS energy values; it reports speech start and end. */
export class VadCore {
  floor = 0.004;
  speaking = false;
  speechMs = 0; // length of the current/last speech segment
  silenceMs = 0; // silence since the last speech
  private above = 0;
  private elapsed = 0;
  private recent: number[] = []; // ~2 s of RMS values for minimum-statistics noise tracking
  private opts: Required<VadOptions>;
  constructor(opts: VadOptions = {}) { this.opts = { startMs: 180, hangMs: 450, bargeFactor: 1, ...opts }; }

  threshold(factor = 1) { return Math.max(0.008, this.floor * 3) * factor; }

  push(rms: number, frameMs: number, factor = this.opts.bargeFactor): VadEvent {
    this.elapsed += frameMs;
    this.recent.push(rms);
    if (this.recent.length > Math.round(2000 / frameMs)) this.recent.shift();
    // Noise floor = rolling minimum (speech always has short gaps; steady noise does not).
    const min = Math.min(...this.recent);
    if (this.elapsed <= 500) { this.floor = Math.max(0.002, min); return null; } // warm-up calibration
    this.floor += (min - this.floor) * (this.speaking ? 0.005 : 0.05);
    const thr = this.threshold(factor);
    if (rms >= thr) {
      this.above += frameMs;
      this.silenceMs = 0;
      if (this.speaking) this.speechMs += frameMs;
      else if (this.above >= this.opts.startMs) { this.speaking = true; this.speechMs = this.above; return 'start'; }
    } else {
      this.above = 0;
      this.silenceMs += frameMs;
      if (this.speaking && this.silenceMs >= this.opts.hangMs) { this.speaking = false; return 'end'; }
    }
    return null;
  }
}

type Listener = (e: { type: 'start' | 'end' | 'barge'; at: number }) => void;

/** One microphone stream for a whole live session: level metering, VAD events and per-turn recording. */
export class LiveMic {
  stream?: MediaStream;
  private ctx?: AudioContext;
  private analyser?: AnalyserNode;
  private timer?: number;
  private rec?: MediaRecorder;
  private chunks: Blob[] = [];
  private listeners = new Set<Listener>();
  vad = new VadCore();
  level = 0;
  rms = 0;
  muted = false;
  turnStartedAt = 0;
  lastSpeechAt = 0;
  firstSpeechAt = 0;
  /** Loudness of the examiner's own voice (0–1), used to tell echo from a real interruption. */
  examinerLevel: () => number = () => 0;
  private examinerTalking = false;
  private holdUntil = 0;
  /** Learned ratio between examiner output level and what leaks back into the microphone. */
  echoGain = 0.05;
  private bargeMs = 0;

  async open(stream?: MediaStream) {
    this.stream = stream ?? await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true, channelCount: 1 } });
    this.ctx = new AudioContext();
    await this.ctx.resume().catch(() => undefined);
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 1024;
    this.ctx.createMediaStreamSource(this.stream).connect(this.analyser);
    const buf = new Float32Array(this.analyser.fftSize);
    this.timer = window.setInterval(() => {
      if (!this.analyser) return;
      if (this.ctx?.state === 'suspended') void this.ctx.resume();
      this.analyser.getFloatTimeDomainData(buf);
      let s = 0;
      for (const v of buf) s += v * v;
      const rms = this.muted ? 0 : Math.sqrt(s / buf.length);
      this.rms = rms;
      this.level = Math.min(1, rms * 8);
      const now = performance.now();
      if (this.examinerTalking || now < this.holdUntil) {
        // The examiner is talking (or its echo is still dying away): never start a candidate turn.
        // Learn how much of the examiner leaks into the mic, and flag only clearly louder speech.
        const ref = this.examinerLevel();
        if (this.examinerTalking && ref > 0.05) {
          const ratio = rms / ref;
          if (this.bargeMs === 0) this.echoGain = this.echoGain * 0.97 + Math.min(1, ratio) * 0.03;
          const loud = rms > Math.max(this.vad.threshold() * 2.5, this.echoGain * ref * 3 + 0.015);
          this.bargeMs = loud ? this.bargeMs + 30 : 0;
        } else if (this.examinerTalking) {
          // Pause between examiner sentences: only clear, sustained speech counts.
          this.bargeMs = rms > this.vad.threshold() * 2.5 ? this.bargeMs + 30 : 0;
        }
        if (this.bargeMs >= 420) { this.bargeMs = 0; this.listeners.forEach((l) => l({ type: 'barge', at: now })); }
        // Do not feed the VAD here: the examiner's echo would raise the noise floor above the candidate's voice.
        return;
      }
      const ev = this.vad.push(rms, 30, 1);
      if (this.vad.speaking) { this.lastSpeechAt = now; if (!this.firstSpeechAt) this.firstSpeechAt = now; }
      if (ev) this.listeners.forEach((l) => l({ type: ev, at: now }));
    }, 30);
  }

  /** Call when the examiner starts/stops speaking. A short hold afterwards ignores room echo. */
  setExaminerTalking(on: boolean, bargedIn = false) {
    this.examinerTalking = on;
    this.bargeMs = 0;
    if (!on) {
      this.holdUntil = bargedIn ? 0 : performance.now() + 350;
      this.vad.speaking = bargedIn;
      this.vad.silenceMs = 0;
      this.vad.speechMs = bargedIn ? 400 : 0;
    }
  }

  on(l: Listener) { this.listeners.add(l); return () => { this.listeners.delete(l); }; }

  startTurn() {
    if (!this.stream) throw new Error('Microphone not open');
    if (this.rec?.state === 'recording') return;
    const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((t) => MediaRecorder.isTypeSupported?.(t));
    this.rec = new MediaRecorder(this.stream, type ? { mimeType: type } : undefined);
    this.chunks = [];
    this.rec.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.rec.start(250);
    this.turnStartedAt = performance.now();
    this.firstSpeechAt = 0;
    this.lastSpeechAt = 0;
  }

  async stopTurn(): Promise<Recording | null> {
    const rec = this.rec;
    if (!rec || rec.state !== 'recording') return null;
    const done = new Promise<void>((r) => (rec.onstop = () => r()));
    rec.stop();
    await done;
    const blob = new Blob(this.chunks, { type: rec.mimeType });
    if (blob.size < 1000) return null;
    const pcm = await decodeTo16k(blob);
    return { blob, pcm, seconds: pcm.length / 16000 };
  }

  get recording() { return this.rec?.state === 'recording'; }

  /** Decodes what has been recorded so far in this turn, without stopping (for early transcription). */
  async snapshot(): Promise<Float32Array | null> {
    if (!this.rec || this.rec.state !== 'recording') return null;
    this.rec.requestData();
    await new Promise((r) => setTimeout(r, 60));
    const blob = new Blob(this.chunks, { type: this.rec.mimeType });
    if (blob.size < 1000) return null;
    try { return await decodeTo16k(blob); } catch { return null; }
  }

  close() {
    clearInterval(this.timer);
    try { this.rec?.stop(); } catch { /* ignore */ }
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.ctx?.close();
    this.listeners.clear();
  }
}
