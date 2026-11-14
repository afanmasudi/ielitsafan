import { useSyncExternalStore } from 'react';

export type Status = 'idle' | 'loading' | 'ready' | 'error';
export interface ModelState { status: Status; progress: number; text?: string; error?: string; cached?: boolean }

type Map = Record<string, ModelState>;
let state: Map = {};
const subs = new Set<() => void>();

export const modelStore = {
  get: () => state,
  set(id: string, patch: Partial<ModelState>) {
    state = { ...state, [id]: { ...(state[id] ?? { status: 'idle', progress: 0 }), ...patch } };
    subs.forEach((f) => f());
  },
  subscribe(f: () => void) { subs.add(f); return () => { subs.delete(f); }; },
};

export const useModelState = (id: string): ModelState =>
  useSyncExternalStore(modelStore.subscribe, () => modelStore.get()[id] ?? IDLE);

export const useAllModelStates = () => useSyncExternalStore(modelStore.subscribe, modelStore.get);

const IDLE: ModelState = { status: 'idle', progress: 0 };

/** Aggregates per-file progress events from Transformers.js into one percentage. */
export function progressTracker(onPct: (pct: number, file?: string) => void) {
  const files = new Map<string, { loaded: number; total: number }>();
  return (e: { status: string; file?: string; loaded?: number; total?: number }) => {
    if (e.status === 'progress' && e.file && e.total) {
      files.set(e.file, { loaded: e.loaded ?? 0, total: e.total });
      let l = 0, t = 0;
      files.forEach((f) => { l += f.loaded; t += f.total; });
      onPct(t ? l / t : 0, e.file);
    }
  };
}
