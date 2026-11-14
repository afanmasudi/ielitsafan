// Copies the MediaPipe vision WASM runtime into public/ so it is served from our own origin.
import { cpSync, existsSync, mkdirSync } from 'node:fs';
const src = 'node_modules/@mediapipe/tasks-vision/wasm';
const dst = 'public/mediapipe';
if (existsSync(src)) {
  mkdirSync(dst, { recursive: true });
  for (const f of ['vision_wasm_internal.js', 'vision_wasm_internal.wasm']) cpSync(`${src}/${f}`, `${dst}/${f}`);
  console.log('MediaPipe runtime copied to public/mediapipe');
}
