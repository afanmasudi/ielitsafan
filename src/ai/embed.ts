/**
 * Sentence embeddings (all-MiniLM-L6-v2, ~23 MB, WASM) for:
 *  - refining intent detection on short, ambiguous utterances,
 *  - checking whether an answer is on-topic,
 *  - rejecting AI-generated questions that are near-duplicates of ones already asked.
 */
import { modelStore, progressTracker } from './store';
import { classifyIntent, cosine, INTENT_PROTOTYPES, type Intent } from '../lib/intent';
import { words } from '../lib/text';

export const EMBED_ID = 'minilm-embed';
let worker: Worker | null = null;
let ready = false;
let seq = 0;
const pending = new Map<number, { resolve: (v: number[][]) => void; reject: (e: Error) => void }>();
let onProgress: ((p: { status: string; file?: string; loaded?: number; total?: number }) => void) | null = null;

function call(msg: Record<string, unknown>) {
  if (!worker) {
    worker = new Worker(new URL('./embed.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const m = e.data, p = pending.get(m.id);
      if (m.type === 'result') { p?.resolve(m.vectors); pending.delete(m.id); }
      else if (m.type === 'ready') { p?.resolve([]); pending.delete(m.id); }
      else if (m.type === 'error') { p?.reject(new Error(m.error)); pending.delete(m.id); }
      else if (m.type === 'progress') onProgress?.(m.p);
    };
  }
  const id = ++seq;
  return new Promise<number[][]>((resolve, reject) => { pending.set(id, { resolve, reject }); worker!.postMessage({ ...msg, id }); });
}

export const isEmbedReady = () => ready;

export async function loadEmbed() {
  if (ready) return;
  modelStore.set(EMBED_ID, { status: 'loading', progress: 0, error: undefined });
  onProgress = progressTracker((pct) => modelStore.set(EMBED_ID, { progress: pct }));
  try { await call({ type: 'load' }); ready = true; modelStore.set(EMBED_ID, { status: 'ready', progress: 1, cached: true }); }
  catch (e) { modelStore.set(EMBED_ID, { status: 'error', error: (e as Error).message }); worker?.terminate(); worker = null; throw e; }
}

export function unloadEmbed() { worker?.terminate(); worker = null; ready = false; modelStore.set(EMBED_ID, { status: 'idle', progress: 0 }); }

export const embed = (texts: string[]) => call({ type: 'embed', texts });

let protoCache: { intent: Intent; v: number[] }[] | null = null;

/** Rules first; for short utterances the rules call "answer", ask the embedding model for a second opinion. */
export async function classifyIntentML(text: string): Promise<{ intent: Intent; via: 'rules' | 'embedding'; score?: number }> {
  const rule = classifyIntent(text);
  if (rule !== 'answer' || !ready || words(text).length > 9) return { intent: rule, via: 'rules' };
  if (!protoCache) {
    const entries = Object.entries(INTENT_PROTOTYPES).flatMap(([intent, ss]) => ss.map((s) => ({ intent: intent as Intent, s })));
    const vs = await embed(entries.map((e) => e.s));
    protoCache = entries.map((e, i) => ({ intent: e.intent, v: vs[i] }));
  }
  const [v] = await embed([text]);
  let best = { intent: 'answer' as Intent, score: 0 };
  for (const p of protoCache) { const s = cosine(v, p.v); if (s > best.score) best = { intent: p.intent, score: s }; }
  return best.score >= 0.72 ? { intent: best.intent, via: 'embedding', score: best.score } : { intent: 'answer', via: 'rules', score: best.score };
}

/** Semantic similarity between a question and an answer (0–1). */
export async function relevance(question: string, answer: string) {
  if (!ready || words(answer).length < 4) return null;
  const [a, b] = await embed([question, answer]);
  return cosine(a, b);
}

/** Keeps only candidates that are not near-duplicates of each other or of the history. */
export async function dedupeSemantic(candidates: string[], history: string[], threshold = 0.82) {
  if (!ready || !candidates.length) return candidates;
  const vs = await embed([...candidates, ...history.slice(0, 200)]);
  const cand = vs.slice(0, candidates.length), hist = vs.slice(candidates.length);
  const kept: number[] = [];
  candidates.forEach((_, i) => {
    const dup = hist.some((h) => cosine(cand[i], h) > threshold) || kept.some((k) => cosine(cand[i], cand[k]) > threshold);
    if (!dup) kept.push(i);
  });
  return kept.map((i) => candidates[i]);
}
