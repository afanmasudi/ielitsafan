/** Microphone recording with a live level meter and 16 kHz mono decoding for Whisper. */
export interface Recording { blob: Blob; pcm: Float32Array; seconds: number }

export class Recorder {
  private stream?: MediaStream;
  private rec?: MediaRecorder;
  private chunks: Blob[] = [];
  private analyser?: AnalyserNode;
  private ctx?: AudioContext;
  startedAt = 0;

  async start() {
    this.stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, channelCount: 1 } });
    const type = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg'].find((t) => MediaRecorder.isTypeSupported?.(t));
    this.rec = new MediaRecorder(this.stream, type ? { mimeType: type } : undefined);
    this.chunks = [];
    this.rec.ondataavailable = (e) => e.data.size && this.chunks.push(e.data);
    this.rec.start(250);
    this.startedAt = performance.now();
    this.ctx = new AudioContext();
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 512;
    this.ctx.createMediaStreamSource(this.stream).connect(this.analyser);
  }

  level() {
    if (!this.analyser) return 0;
    const d = new Uint8Array(this.analyser.fftSize);
    this.analyser.getByteTimeDomainData(d);
    let s = 0;
    for (const v of d) s += ((v - 128) / 128) ** 2;
    return Math.min(1, Math.sqrt(s / d.length) * 4);
  }

  async stop(): Promise<Recording> {
    const rec = this.rec;
    if (!rec) throw new Error('Not recording');
    const done = new Promise<void>((r) => (rec.onstop = () => r()));
    rec.stop();
    await done;
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.ctx?.close();
    const blob = new Blob(this.chunks, { type: rec.mimeType });
    const pcm = await decodeTo16k(blob);
    return { blob, pcm, seconds: pcm.length / 16000 };
  }

  cancel() {
    try { this.rec?.stop(); } catch { /* ignore */ }
    this.stream?.getTracks().forEach((t) => t.stop());
    void this.ctx?.close();
  }
}

export async function decodeTo16k(blob: Blob): Promise<Float32Array> {
  const buf = await blob.arrayBuffer();
  const tmp = new AudioContext();
  const decoded = await tmp.decodeAudioData(buf);
  void tmp.close();
  const off = new OfflineAudioContext(1, Math.ceil(decoded.duration * 16000), 16000);
  const src = off.createBufferSource();
  src.buffer = decoded;
  src.connect(off.destination);
  src.start();
  return (await off.startRendering()).getChannelData(0);
}

export function micErrorMessage(e: unknown) {
  const n = (e as DOMException)?.name;
  if (n === 'NotAllowedError') return 'Microphone permission was denied. Allow it in your browser settings, or type your answer instead.';
  if (n === 'NotFoundError') return 'No microphone was found. You can type your answer instead.';
  if (!window.isSecureContext) return 'Recording needs HTTPS (or localhost).';
  return `Could not start the microphone: ${(e as Error)?.message ?? e}`;
}
