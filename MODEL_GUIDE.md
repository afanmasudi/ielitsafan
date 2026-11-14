# Model guide

IELTS Studio runs every AI model **inside your browser**. Nothing is downloaded until you press **Download & load** in **Settings → Model manager**. Model files come directly from Hugging Face (and the WebLLM model library on GitHub/Hugging Face) to your browser and are cached there. Your essays, recordings and CV are never sent to any server.

## What each model does

| Engine | Model | Download | Runs on | Used for | If unavailable |
|---|---|---|---|---|---|
| Speech recognition | Whisper Tiny English (`onnx-community/whisper-tiny.en`) | ~41 MB | WASM (all browsers); WebGPU on desktop | Transcribing spoken answers | Type your answer |
| Speech recognition | Whisper Base English (`onnx-community/whisper-base.en`) | ~77 MB | Same | More accurate transcripts (desktop) | Use Tiny |
| Voice | Kokoro 82M (`onnx-community/Kokoro-82M-v1.0-ONNX`, q8) | ~92 MB | WASM; WebGPU on desktop | Examiner voice and Listening audio | Browser’s built-in voice |
| Meaning | MiniLM sentence embeddings (`Xenova/all-MiniLM-L6-v2`, q8) | ~23 MB | WASM | Live examiner: intent ("repeat?" vs answer), answer relevance, skipping covered questions, de-duplicating AI questions | Rule-based intent only |
| Vision | MediaPipe Face Landmarker (float16) | ~4 MB (+ WASM runtime served by the app) | GPU or CPU | Webcam presence feedback in live calls | Camera feedback off |
| Language model | Qwen3 0.6B (`Qwen3-0.6B-q4f16_1-MLC`) | ~350 MB | **WebGPU only** | Light tutor | Offline knowledge base |
| Language model | **Qwen3 1.7B** (`Qwen3-1.7B-q4f16_1-MLC`), default | ~1 GB | WebGPU only | Tutor, commentary, follow-up questions | Offline knowledge base |
| Language model | Qwen3 4B (`Qwen3-4B-q4f16_1-MLC`) | ~2.3 GB | WebGPU, ~3.4 GB GPU memory | Best quality on strong desktops | Use 1.7B |
| Language model | Llama 3.2 1B Instruct (`Llama-3.2-1B-Instruct-q4f16_1-MLC`) | ~0.7 GB | WebGPU | Low-memory alternative | – |

## Modes
- **Recommended:** Whisper Tiny + Kokoro + Qwen3 1.7B.
- **Lightweight:** Whisper Tiny + Qwen3 0.6B. For older laptops and high-end phones with WebGPU.
- **Advanced desktop:** Whisper Base + Qwen3 4B.
- **Manual (no AI):** unloads everything. You type answers and hear the browser voice. All tests, marking, writing analysis and the study plan still work, because none of them depends on an AI model.

## Compatibility
- **Desktop Chrome / Edge (recent):** everything works, including WebGPU models.
- **Firefox / Safari:** Whisper and Kokoro work on WASM. WebGPU support varies by version and operating system; if it's missing, the tutor uses offline mode.
- **Phones:** Whisper Tiny and Kokoro usually work (they take a few seconds per answer). Most phones can't run the WebLLM models reliably, so the tutor stays in offline mode. We don't claim every model works on every device.
- The Model manager checks WebGPU, `shader-f16` support, reported memory (`navigator.deviceMemory`, if the browser exposes it), and storage quota, and warns you before a download that is likely to fail.

## Performance
- The app is served **cross-origin isolated** (COOP/COEP headers), which lets ONNX Runtime use multiple threads.
- Kokoro on CPU (q8) runs at about 1.5× real time on a 16-thread laptop. The live examiner hides this: it pre-voices the opening lines in the lobby, the next question while you answer, and short phrases ("Thank you.", "Certainly.") ahead of time. The opt-in **GPU voice** (Settings → Preferences, 326 MB fp32 model) is much faster on WebGPU desktops and falls back to CPU automatically.
- Measured live-call reply time (simulated candidate, 60% speaker echo): **1.5–2.7 s** after the candidate stops talking.
- All inference runs in Web Workers (`src/ai/*.worker.ts`), so the interface stays responsive.
- Whisper transcribes after you stop recording (turn-based). **It is not real-time streaming.**
- Listening audio is synthesised once per part and cached in memory for replay.
- WebLLM's "thinking" mode is switched off (`enable_thinking: false`) for faster answers.

## Storage
- Transformers.js models: Cache Storage `transformers-cache`. WebLLM models: Cache Storage `webllm/*`.
- **Delete files** in the Model manager removes a model's cached files. "Delete all personal data" in Settings → Data removes your study data but leaves models, so you don't have to re-download them.
- The app asks for persistent storage so the browser is less likely to evict data. Browsers may still clear storage, so export backups.

## Licences
Whisper (MIT weights / Apache-2.0 ONNX conversion), Kokoro-82M (Apache-2.0), Qwen3 (Apache-2.0), Llama 3.2 (Llama 3.2 Community Licence; check its terms for your use), Transformers.js (Apache-2.0), WebLLM (Apache-2.0), kokoro-js (Apache-2.0), ONNX Runtime Web (MIT).

## Troubleshooting
| Symptom | Fix |
|---|---|
| "WebGPU is not available" | Use desktop Chrome/Edge and update the graphics drivers. Everything except the AI tutor still works. |
| Download stops or fails | Check free disk space and the storage figure in the Model manager, then try again (finished files are reused). |
| "Not enough GPU memory" | Choose a smaller model (Qwen3 0.6B or Llama 3.2 1B) and close other GPU-heavy tabs. |
| Transcripts are poor | Move closer to the microphone, reduce background noise, or switch to Whisper Base on desktop. You can always edit the transcript before submitting. |
| No sound | Check that the examiner voice is on in Settings → Preferences, and the device volume. |
