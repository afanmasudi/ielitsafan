export type ModelKind = 'stt' | 'tts' | 'llm' | 'embed' | 'face';

export interface ModelInfo {
  id: string;
  kind: ModelKind;
  name: string;
  repo: string;
  sizeMB: number;
  vramMB?: number;
  needsWebGPU: boolean;
  tier: 'light' | 'standard' | 'advanced';
  note: string;
  licence: string;
}

/** Only models that were checked against their runtime (see MODEL_GUIDE.md). */
export const MODELS: ModelInfo[] = [
  { id: 'whisper-tiny.en', kind: 'stt', name: 'Whisper Tiny (English)', repo: 'onnx-community/whisper-tiny.en', sizeMB: 41, needsWebGPU: false, tier: 'light', licence: 'Apache-2.0', note: 'Recommended. Fast, works on most phones (WASM). Less accurate on noisy audio and strong accents.' },
  { id: 'whisper-base.en', kind: 'stt', name: 'Whisper Base (English)', repo: 'onnx-community/whisper-base.en', sizeMB: 77, needsWebGPU: false, tier: 'standard', licence: 'Apache-2.0', note: 'More accurate, about twice as slow. Better for desktops.' },
  { id: 'kokoro-82m', kind: 'tts', name: 'Kokoro 82M (neural voices)', repo: 'onnx-community/Kokoro-82M-v1.0-ONNX', sizeMB: 92, needsWebGPU: false, tier: 'standard', licence: 'Apache-2.0', note: 'Natural British and American voices for the examiner and Listening audio. The browser voice is used until it is downloaded.' },
  { id: 'minilm-embed', kind: 'embed', name: 'MiniLM sentence embeddings', repo: 'Xenova/all-MiniLM-L6-v2', sizeMB: 23, needsWebGPU: false, tier: 'light', licence: 'Apache-2.0', note: 'Understands meaning: tells answers from “can you repeat?”, checks answers are on-topic, and stops AI questions repeating.' },
  { id: 'face-landmarker', kind: 'face', name: 'MediaPipe Face Landmarker', repo: 'google/mediapipe face_landmarker (float16)', sizeMB: 4, needsWebGPU: false, tier: 'light', licence: 'Apache-2.0', note: 'Webcam feedback in live calls: face in view, eye contact, mouth movement. Video never leaves the device.' },
  { id: 'Qwen3-0.6B-q4f16_1-MLC', kind: 'llm', name: 'Qwen3 0.6B (light)', repo: 'mlc-ai/Qwen3-0.6B-q4f16_1-MLC', sizeMB: 350, vramMB: 1403, needsWebGPU: true, tier: 'light', licence: 'Apache-2.0', note: 'Smallest tutor. Good for short explanations; weaker reasoning.' },
  { id: 'Qwen3-1.7B-q4f16_1-MLC', kind: 'llm', name: 'Qwen3 1.7B (recommended)', repo: 'mlc-ai/Qwen3-1.7B-q4f16_1-MLC', sizeMB: 980, vramMB: 2037, needsWebGPU: true, tier: 'standard', licence: 'Apache-2.0', note: 'Best balance of quality and speed on laptops with WebGPU.' },
  { id: 'Qwen3-4B-q4f16_1-MLC', kind: 'llm', name: 'Qwen3 4B (advanced desktop)', repo: 'mlc-ai/Qwen3-4B-q4f16_1-MLC', sizeMB: 2300, vramMB: 3432, needsWebGPU: true, tier: 'advanced', licence: 'Apache-2.0', note: 'Highest quality. Needs a dedicated or recent integrated GPU with 4 GB+.' },
  { id: 'Llama-3.2-1B-Instruct-q4f16_1-MLC', kind: 'llm', name: 'Llama 3.2 1B Instruct', repo: 'mlc-ai/Llama-3.2-1B-Instruct-q4f16_1-MLC', sizeMB: 700, vramMB: 879, needsWebGPU: true, tier: 'light', licence: 'Llama 3.2 Community Licence', note: 'Alternative light model; lower memory use than Qwen3 0.6B.' },
];

export const modelById = (id: string) => MODELS.find((m) => m.id === id);
export const DEFAULT_STT = 'whisper-tiny.en';
export const DEFAULT_LLM = 'Qwen3-1.7B-q4f16_1-MLC';
