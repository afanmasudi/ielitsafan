/// <reference lib="webworker" />
import { pipeline, env, type AutomaticSpeechRecognitionPipeline } from '@huggingface/transformers';

env.allowLocalModels = false;

let asr: AutomaticSpeechRecognitionPipeline | null = null;
let loadedId = '';

self.onmessage = async (e: MessageEvent) => {
  const { type, id, repo, audio, webgpu } = e.data;
  try {
    if (type === 'load') {
      if (asr && loadedId === repo) return post({ type: 'ready', id });
      await asr?.dispose();
      const load = async (gpu: boolean) => (await pipeline('automatic-speech-recognition', repo, {
        device: gpu ? 'webgpu' : 'wasm',
        dtype: gpu ? { encoder_model: 'fp32', decoder_model_merged: 'q4' } : { encoder_model: 'fp32', decoder_model_merged: 'q8' },
        progress_callback: (p: unknown) => post({ type: 'progress', id, p }),
      })) as AutomaticSpeechRecognitionPipeline;
      asr = webgpu ? await load(true).catch(() => load(false)) : await load(false);
      loadedId = repo;
      post({ type: 'ready', id });
    } else if (type === 'transcribe') {
      if (!asr) throw new Error('Speech model not loaded');
      const out = await asr(audio as Float32Array, { chunk_length_s: 30, stride_length_s: 5 });
      const text = Array.isArray(out) ? out.map((o) => o.text).join(' ') : out.text;
      post({ type: 'result', id, text: text.trim() });
    } else if (type === 'unload') {
      await asr?.dispose(); asr = null; loadedId = '';
      post({ type: 'unloaded', id });
    }
  } catch (err) {
    post({ type: 'error', id, error: err instanceof Error ? err.message : String(err) });
  }
};

const post = (m: unknown) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(m);
