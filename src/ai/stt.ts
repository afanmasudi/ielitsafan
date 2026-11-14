import { getDevice } from './device';
import { modelById, DEFAULT_STT } from './models';
import { modelStore, progressTracker } from './store';
import { getSetting } from '../lib/db';

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<number, { resolve: (v: string) => void; reject: (e: Error) => void }>();
let loading: Promise<void> | null = null;
let loadedId = '';

function getWorker() {
  if (!worker) {
    worker = new Worker(new URL('./stt.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e) => {
      const m = e.data;
      const p = pending.get(m.id);
      if (m.type === 'result') { p?.resolve(m.text); pending.delete(m.id); }
      else if (m.type === 'ready' || m.type === 'unloaded') { p?.resolve(''); pending.delete(m.id); }
      else if (m.type === 'error') { p?.reject(new Error(m.error)); pending.delete(m.id); }
      else if (m.type === 'progress') onProgress?.(m.p);
    };
    worker.onerror = (e) => pending.forEach((p) => p.reject(new Error(e.message || 'Speech worker crashed')));
  }
  return worker;
}
let onProgress: ((p: { status: string; file?: string; loaded?: number; total?: number }) => void) | null = null;

function call(msg: Record<string, unknown>, transfer: Transferable[] = []) {
  const id = ++seq;
  return new Promise<string>((resolve, reject) => {
    pending.set(id, { resolve, reject });
    getWorker().postMessage({ ...msg, id }, transfer);
  });
}

export const sttModelId = () => getSetting('sttModel', DEFAULT_STT);

export async function loadStt(modelId?: string) {
  const id = modelId ?? (await sttModelId());
  if (loadedId === id) return;
  if (loading) return loading;
  const info = modelById(id)!;
  modelStore.set(id, { status: 'loading', progress: 0, error: undefined, text: 'Downloading…' });
  onProgress = progressTracker((pct) => modelStore.set(id, { progress: pct }));
  loading = (async () => {
    try {
      const d = await getDevice();
      // WebGPU Whisper is less stable on mobile; WASM is the safe default there.
      await call({ type: 'load', repo: info.repo, webgpu: d.webgpu && !d.mobile && d.shaderF16 });
      loadedId = id;
      modelStore.set(id, { status: 'ready', progress: 1, text: 'Ready', cached: true });
    } catch (e) {
      modelStore.set(id, { status: 'error', error: (e as Error).message });
      worker?.terminate(); worker = null;
      throw e;
    } finally { loading = null; }
  })();
  return loading;
}

export const isSttReady = () => !!loadedId;

export async function transcribe(pcm16k: Float32Array): Promise<string> {
  if (!loadedId) await loadStt();
  const copy = pcm16k.slice();
  return call({ type: 'transcribe', audio: copy }, [copy.buffer]);
}

export async function unloadStt() {
  if (!worker) return;
  const id = loadedId;
  await call({ type: 'unload' }).catch(() => undefined);
  worker.terminate(); worker = null; loadedId = '';
  if (id) modelStore.set(id, { status: 'idle', progress: 0, text: undefined });
}
