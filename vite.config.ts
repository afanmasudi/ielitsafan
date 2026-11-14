import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  worker: { format: 'es' },
  // Cross-origin isolation enables SharedArrayBuffer, so ONNX Runtime can use all CPU cores.
  server: { headers: { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' } },
  preview: { headers: { 'Cross-Origin-Opener-Policy': 'same-origin', 'Cross-Origin-Embedder-Policy': 'require-corp' } },
  optimizeDeps: { exclude: ['@huggingface/transformers', 'kokoro-js', '@mlc-ai/web-llm'] },
  build: { target: 'es2022', chunkSizeWarningLimit: 6000 },
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
} as never);
