import type { MLCEngineInterface, ChatCompletionMessageParam } from '@mlc-ai/web-llm';
import { modelStore } from './store';
import { DEFAULT_LLM } from './models';
import { getSetting } from '../lib/db';

let engine: MLCEngineInterface | null = null;
let loadedId = '';
let loading: Promise<void> | null = null;

export type Msg = ChatCompletionMessageParam;
export const llmModelId = () => getSetting('llmModel', DEFAULT_LLM);
export const isLlmReady = () => !!engine;
export const loadedLlm = () => loadedId;

export async function loadLlm(modelId?: string) {
  const id = modelId ?? (await llmModelId());
  if (engine && loadedId === id) return;
  if (loading) return loading;
  if (!('gpu' in navigator)) throw new Error('WebGPU is not available in this browser. The AI tutor needs WebGPU (desktop Chrome or Edge). All study modules still work without it.');
  modelStore.set(id, { status: 'loading', progress: 0, error: undefined, text: 'Preparing…' });
  loading = (async () => {
    try {
      await unloadLlm();
      const web = await import('@mlc-ai/web-llm');
      engine = await web.CreateWebWorkerMLCEngine(
        new Worker(new URL('./llm.worker.ts', import.meta.url), { type: 'module' }),
        id,
        { initProgressCallback: (r) => modelStore.set(id, { progress: r.progress, text: r.text }) },
      );
      loadedId = id;
      modelStore.set(id, { status: 'ready', progress: 1, text: 'Ready', cached: true });
    } catch (e) {
      engine = null; loadedId = '';
      const msg = (e as Error).message ?? String(e);
      modelStore.set(id, { status: 'error', error: /memory|OOM|allocation/i.test(msg) ? `Not enough GPU memory for this model. Try a smaller one. (${msg})` : msg });
      throw e;
    } finally { loading = null; }
  })();
  return loading;
}

export async function unloadLlm() {
  if (!engine) return;
  const id = loadedId;
  try { await engine.unload(); } catch { /* ignore */ }
  engine = null; loadedId = '';
  modelStore.set(id, { status: 'idle', progress: 0, text: undefined });
}

export async function isLlmCached(id: string) {
  try { return await (await import('@mlc-ai/web-llm')).hasModelInCache(id); } catch { return false; }
}
export async function deleteLlm(id: string) {
  if (loadedId === id) await unloadLlm();
  await (await import('@mlc-ai/web-llm')).deleteModelAllInfoInCache(id);
  modelStore.set(id, { status: 'idle', progress: 0, cached: false });
}

const stripThink = (t: string) => t.replace(/<think>[\s\S]*?(<\/think>|$)/g, '').trim();

/** Streams a chat completion. Thinking mode is disabled for speed. */
export async function chat(messages: Msg[], opts: { onToken?: (full: string) => void; maxTokens?: number; temperature?: number; json?: boolean } = {}) {
  if (!engine) throw new Error('No AI model is loaded. Open Settings → Models to download one.');
  const stream = await engine.chat.completions.create({
    messages,
    stream: true,
    temperature: opts.temperature ?? 0.6,
    max_tokens: opts.maxTokens ?? 700,
    extra_body: { enable_thinking: false },
    ...(opts.json ? { response_format: { type: 'json_object' as const } } : {}),
  });
  let full = '';
  for await (const chunk of stream) {
    full += chunk.choices[0]?.delta?.content ?? '';
    opts.onToken?.(stripThink(full));
  }
  return stripThink(full);
}

/** Asks for JSON and parses it leniently. Returns null when the model output is unusable. */
export async function chatJson<T>(messages: Msg[], maxTokens = 900): Promise<T | null> {
  const text = await chat(messages, { maxTokens, temperature: 0.3 });
  const m = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (!m) return null;
  try { return JSON.parse(m[0]) as T; } catch { return null; }
}

export async function abortLlm() { try { engine?.interruptGenerate(); } catch { /* ignore */ } }
