import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import { App } from './App';

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);

if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => undefined));
}

// Development-only hook used by TESTING.md to exercise the local models end to end.
if (import.meta.env.DEV) {
  void Promise.all([import('./ai/stt'), import('./ai/tts'), import('./ai/llm')]).then(([stt, tts, llm]) => {
    (window as unknown as { __studio: unknown }).__studio = { stt, tts, llm };
  });
}
