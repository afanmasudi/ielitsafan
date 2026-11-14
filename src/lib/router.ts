import { useSyncExternalStore } from 'react';

/** Minimal hash router: "#/writing?task=2" → { path: "/writing", query }. Works on static hosting. */
const read = () => {
  const raw = location.hash.replace(/^#/, '') || '/';
  const [path, qs] = raw.split('?');
  return { path, query: new URLSearchParams(qs ?? '') };
};
let snap = read();
let key = location.hash;
const subscribe = (f: () => void) => {
  const h = () => { if (location.hash !== key) { key = location.hash; snap = read(); } f(); };
  window.addEventListener('hashchange', h);
  return () => window.removeEventListener('hashchange', h);
};

export const useRoute = () => useSyncExternalStore(subscribe, () => snap);
export const navigate = (to: string) => { location.hash = to; window.scrollTo({ top: 0 }); };
