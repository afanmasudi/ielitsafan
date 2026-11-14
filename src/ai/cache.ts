/** Helpers for model files cached by Transformers.js (Cache API, "transformers-cache"). */
const CACHE = 'transformers-cache';

export async function isRepoCached(repo: string) {
  try {
    if (!('caches' in window) || !(await caches.has(CACHE))) return false;
    const keys = await (await caches.open(CACHE)).keys();
    return keys.some((r) => r.url.includes(repo) && r.url.includes('.onnx'));
  } catch { return false; }
}

export async function deleteRepo(repo: string) {
  if (!('caches' in window)) return 0;
  const c = await caches.open(CACHE);
  let n = 0;
  for (const r of await c.keys()) if (r.url.includes(repo)) { await c.delete(r); n++; }
  return n;
}
