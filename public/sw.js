// IELTS Studio service worker: caches the app shell and built assets so the app works offline.
// Model files are cached separately by Transformers.js / WebLLM and are never touched here.
const SHELL = 'ielts-studio-shell-v1';
const ASSETS = 'ielts-studio-assets-v1';

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(SHELL).then((c) => c.addAll(['/', '/index.html', '/manifest.webmanifest', '/icon.svg'])).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k.startsWith('ielts-studio-') && k !== SHELL && k !== ASSETS).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return; // model downloads and CDNs are handled by their libraries
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then((r) => { caches.open(SHELL).then((c) => c.put('/index.html', r.clone())); return r; }).catch(() => caches.match('/index.html')));
    return;
  }
  if (url.pathname.startsWith('/assets/') || url.pathname.match(/\.(svg|png|woff2|webmanifest)$/)) {
    e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => { if (r.ok) { const copy = r.clone(); caches.open(ASSETS).then((c) => c.put(req, copy)); } return r; })));
  }
});
