import { getDevice } from './device';
import { modelStore, progressTracker } from './store';
import { getSetting } from '../lib/db';

export const TTS_ID = 'kokoro-82m';

/** Kokoro voices used for examiners and Listening speakers. */
export const VOICES = {
  examinerF: { kokoro: 'bf_emma', lang: 'en-GB', label: 'British female' },
  examinerM: { kokoro: 'bm_george', lang: 'en-GB', label: 'British male' },
  usF: { kokoro: 'af_heart', lang: 'en-US', label: 'American female' },
  usM: { kokoro: 'am_michael', lang: 'en-US', label: 'American male' },
  ukF2: { kokoro: 'bf_isabella', lang: 'en-GB', label: 'British female 2' },
  ukM2: { kokoro: 'bm_lewis', lang: 'en-GB', label: 'British male 2' },
} as const;
export type VoiceKey = keyof typeof VOICES;

let worker: Worker | null = null;
let ready = false;
let seq = 0;
const pending = new Map<number, { resolve: (v: { pcm?: Float32Array; rate?: number }) => void; reject: (e: Error) => void }>();
let onProgress: ((p: { status: string; file?: string; loaded?: number; total?: number }) => void) | null = null;

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./tts.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const m = e.data;
      const p = pending.get(m.id);
      if (m.type === 'audio') { p?.resolve({ pcm: m.pcm, rate: m.rate }); pending.delete(m.id); }
      else if (m.type === 'ready' || m.type === 'unloaded') { p?.resolve({}); pending.delete(m.id); }
      else if (m.type === 'error') { p?.reject(new Error(m.error)); pending.delete(m.id); }
      else if (m.type === 'progress') onProgress?.(m.p);
    };
  }
  return worker;
}
function call(msg: Record<string, unknown>) {
  const id = ++seq;
  return new Promise<{ pcm?: Float32Array; rate?: number }>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ ...msg, id });
  });
}

let loading: Promise<void> | null = null;
export function loadTts() {
  if (ready) return Promise.resolve();
  if (loading) return loading;
  modelStore.set(TTS_ID, { status: 'loading', progress: 0, error: undefined });
  onProgress = progressTracker((pct) => modelStore.set(TTS_ID, { progress: pct }));
  loading = (async () => {
    try {
      const d = await getDevice();
      // The GPU voice needs the full-precision model (326 MB), so it is opt-in (Settings → Preferences).
      await call({ type: 'load', webgpu: d.webgpu && !d.mobile && (await getSetting('ttsGpu', false)) });
      ready = true;
      modelStore.set(TTS_ID, { status: 'ready', progress: 1, cached: true });
    } catch (e) {
      modelStore.set(TTS_ID, { status: 'error', error: (e as Error).message });
      worker?.terminate(); worker = null;
      throw e;
    } finally { loading = null; }
  })();
  return loading;
}
export const isTtsReady = () => ready;

export function unloadTts() {
  worker?.terminate(); worker = null; ready = false;
  modelStore.set(TTS_ID, { status: 'idle', progress: 0 });
}

/** Synthesise to PCM with Kokoro (null if Kokoro is not loaded). */
let synthRatio = 0; // synthesis time ÷ audio duration (lower is faster; < 1 is faster than real time)
export const voiceSpeedRatio = () => synthRatio;

export async function synth(text: string, voice: VoiceKey, speed = 1) {
  if (!ready) return null;
  const t0 = performance.now();
  const r = await call({ type: 'speak', text, voice: VOICES[voice].kokoro, speed });
  if (r.pcm && r.rate) {
    const ratio = (performance.now() - t0) / 1000 / (r.pcm.length / r.rate);
    synthRatio = synthRatio ? synthRatio * 0.7 + ratio * 0.3 : ratio;
  }
  return r.pcm && r.rate ? { pcm: r.pcm, rate: r.rate } : null;
}

let ctx: AudioContext | null = null;
let out: AnalyserNode | null = null;
let currentSource: AudioBufferSourceNode | null = null;
let token = 0;
let browserSpeaking = false;
const clipCache = new Map<string, { pcm: Float32Array; rate: number }>();

export const audioCtx = () => (ctx ??= new AudioContext());
/** Call from a click handler so later audio is allowed to play. */
export function unlockAudio() { void audioCtx().resume(); if ('speechSynthesis' in window) speechSynthesis.getVoices(); }

/** All examiner audio passes through one analyser so the avatar can lip-sync to it. */
function output() {
  const c = audioCtx();
  if (!out) { out = c.createAnalyser(); out.fftSize = 512; out.connect(c.destination); }
  return out;
}

/** Current loudness of the examiner's voice (0–1), used to animate the avatar's mouth. */
export function speechLevel(): number {
  if (browserSpeaking) return 0.25 + 0.35 * Math.abs(Math.sin(performance.now() / 95)) * (0.6 + 0.4 * Math.sin(performance.now() / 410));
  if (!out || !currentSource) return 0;
  const d = new Uint8Array(out.fftSize);
  out.getByteTimeDomainData(d);
  let s = 0;
  for (const v of d) s += ((v - 128) / 128) ** 2;
  return Math.min(1, Math.sqrt(s / d.length) * 5);
}
export const isSpeaking = () => browserSpeaking || !!currentSource;

export function playPcm(pcm: Float32Array, rate: number): Promise<void> {
  const c = audioCtx();
  const buf = c.createBuffer(1, pcm.length, rate);
  buf.copyToChannel(pcm as Float32Array<ArrayBuffer>, 0);
  const src = c.createBufferSource();
  src.buffer = buf;
  src.connect(output());
  currentSource = src;
  return new Promise((res) => {
    let settled = false;
    const done = () => { if (settled) return; settled = true; clearTimeout(guard); if (currentSource === src) currentSource = null; res(); };
    // If the browser keeps the audio context suspended (autoplay rules), "ended" never fires:
    // never wait longer than the clip itself.
    const guard = setTimeout(done, (pcm.length / rate) * 1000 + 600);
    src.onended = done;
    void c.resume();
    src.start();
  });
}

function browserVoice(lang: string, female: boolean) {
  const vs = speechSynthesis.getVoices().filter((v) => v.lang.replace('_', '-').startsWith(lang));
  const pick = vs.find((v) => (female ? /female|woman|libby|sonia|hazel|susan|zira|samantha|serena|kate/i : /male|man|ryan|george|daniel|david|guy|thomas/i).test(v.name));
  return pick ?? vs[0];
}

function speakBrowser(text: string, voice: VoiceKey, rate = 1): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) return resolve();
    const u = new SpeechSynthesisUtterance(text);
    const v = VOICES[voice];
    u.lang = v.lang;
    const bv = browserVoice(v.lang, v.label.includes('female'));
    if (bv) u.voice = bv;
    u.rate = rate * 0.95;
    // Some browsers never fire "end" (e.g. background tabs), so never wait longer than the speech could take.
    const done = () => { clearTimeout(timer); browserSpeaking = false; resolve(); };
    const timer = setTimeout(done, 1500 + (text.split(/\s+/).length / 2.2) * 1000 / rate);
    u.onend = done;
    u.onerror = done;
    browserSpeaking = true;
    speechSynthesis.speak(u);
  });
}

/** Splits text into sentences so the first can play while the next is being synthesised. */
export const splitSentences = (t: string) => t.match(/[^.!?]+[.!?]+["”’)]*\s*|[^.!?]+$/g)?.map((x) => x.trim()).filter(Boolean) ?? [t];

async function clip(text: string, voice: VoiceKey, rate: number) {
  const key = `${voice}|${rate}|${text}`;
  const hit = clipCache.get(key);
  if (hit) return hit;
  const pre = prefetched.get(key);
  if (pre) { prefetched.delete(key); const c = await pre; if (c) { if (text.length < 90) clipCache.set(key, c); return c; } }
  const c = await synth(text, voice, rate);
  if (c && text.length < 90) { clipCache.set(key, c); if (clipCache.size > 80) clipCache.delete(clipCache.keys().next().value!); }
  return c;
}

const prefetched = new Map<string, Promise<{ pcm: Float32Array; rate: number } | null>>();
/** Synthesise text in the background (e.g. the next question while the candidate is talking). */
export function prefetch(text: string, voice: VoiceKey) {
  if (!ready) return;
  for (const part of splitSentences(text)) {
    const key = `${voice}|1|${part}`;
    if (!clipCache.has(key) && !prefetched.has(key)) prefetched.set(key, synth(part, voice, 1).catch(() => null));
  }
  if (prefetched.size > 40) prefetched.delete(prefetched.keys().next().value!);
}

/** Pre-synthesises short phrases (e.g. "Thank you.") so the examiner can respond instantly. */
export async function warmPhrases(phrases: string[], voice: VoiceKey) {
  if (!ready) return;
  for (const p of phrases) await clip(p, voice, 1).catch(() => undefined);
}

/**
 * Speak with Kokoro when loaded (sentence by sentence, with natural pauses), otherwise the
 * browser voice. Resolves true if it finished, false if it was interrupted.
 */
export async function speak(text: string, voice: VoiceKey = 'examinerF', rate = 1): Promise<boolean> {
  if (!(await getSetting('voiceOn', true))) return true;
  stopSpeaking();
  const my = ++token;
  if (ready) {
    try {
      const parts = splitSentences(text);
      let next = clip(parts[0], voice, rate);
      for (let i = 0; i < parts.length; i++) {
        const c = await next;
        if (token !== my) return false;
        next = i + 1 < parts.length ? clip(parts[i + 1], voice, rate) : Promise.resolve(null);
        if (c) await playPcm(c.pcm, c.rate);
        if (token !== my) return false;
        if (i + 1 < parts.length) await new Promise((r) => setTimeout(r, 160 + Math.random() * 180));
      }
      return token === my;
    } catch { /* fall back to the browser voice */ }
  }
  await speakBrowser(text, voice, rate);
  return token === my;
}

export function stopSpeaking() {
  token++;
  try { currentSource?.stop(); } catch { /* already stopped */ }
  currentSource = null;
  browserSpeaking = false;
  if ('speechSynthesis' in window) speechSynthesis.cancel();
}

/** Test hook: the analyser all examiner audio passes through (used to simulate speaker echo). */
export const outputNodeForTests = () => output();
