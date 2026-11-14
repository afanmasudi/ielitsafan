/// <reference lib="webworker" />
import { pipeline, env, type FeatureExtractionPipeline } from '@huggingface/transformers';

env.allowLocalModels = false;
let fe: FeatureExtractionPipeline | null = null;

self.onmessage = async (e: MessageEvent) => {
  const { type, id, texts } = e.data;
  try {
    if (type === 'load') {
      fe ??= (await pipeline('feature-extraction', 'Xenova/all-MiniLM-L6-v2', { dtype: 'q8', device: 'wasm', progress_callback: (p: unknown) => post({ type: 'progress', id, p }) })) as FeatureExtractionPipeline;
      post({ type: 'ready', id });
    } else if (type === 'embed') {
      if (!fe) throw new Error('Embedding model not loaded');
      const out = await fe(texts as string[], { pooling: 'mean', normalize: true });
      post({ type: 'result', id, vectors: out.tolist() });
    }
  } catch (err) {
    post({ type: 'error', id, error: err instanceof Error ? err.message : String(err) });
  }
};

const post = (m: unknown) => (self as unknown as DedicatedWorkerGlobalScope).postMessage(m);
