/// <reference lib="webworker" />
import { KokoroTTS } from 'kokoro-js';

let tts: KokoroTTS | null = null;

self.onmessage = async (e: MessageEvent) => {
  const { type, id, text, voice, speed, webgpu } = e.data;
  try {
    if (type === 'load') {
      if (!tts) {
        const load = (gpu: boolean) => KokoroTTS.from_pretrained('onnx-community/Kokoro-82M-v1.0-ONNX', {
          dtype: gpu ? 'fp32' : 'q8',
          device: gpu ? 'webgpu' : 'wasm',
          progress_callback: (p: unknown) => post({ type: 'progress', id, p }),
        });
        // WebGPU is several times faster; fall back to WASM if the GPU path fails.
        tts = webgpu ? await load(true).catch(() => load(false)) : await load(false);
      }
      post({ type: 'ready', id });
    } else if (type === 'speak') {
      if (!tts) throw new Error('Voice model not loaded');
      const audio = await tts.generate(text, { voice, speed: speed ?? 1 });
      const pcm = audio.audio as Float32Array;
      (self as unknown as DedicatedWorkerGlobalScope).postMessage({ type: 'audio', id, pcm, rate: audio.sampling_rate }, [pcm.buffer]);
    } else if (type === 'unload') {
      tts = null;
      post({ type: 'unloaded', id });
    }
  } catch (err) {
    post({ type: 'error', id, error: err instanceof Error ? err.message : String(err) });
  }
};

const post = (m: unknown) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(m);
