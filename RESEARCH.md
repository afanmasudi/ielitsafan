# IELTS Studio research notes

These notes record what was investigated before and during the build, what was adopted, and why. Checked: 14 November 2026.

## 1. Repositories inspected

| Repository | Last push (at check) | Licence | What we took | What we didn't |
|---|---|---|---|---|
| [huggingface/transformers.js](https://github.com/huggingface/transformers.js) | 2026-11-13 | Apache-2.0 | Used as a dependency (`@huggingface/transformers` 4.3.2) for Whisper speech recognition in a Web Worker. | Nothing copied. |
| [mlc-ai/web-llm](https://github.com/mlc-ai/web-llm) | 2026-11-10 | Apache-2.0 | Used as a dependency (`@mlc-ai/web-llm` 0.2.88) for local LLM inference in a Web Worker. Read `src/config.ts` to get the real prebuilt model IDs and VRAM figures. Confirmed `extra_body.enable_thinking` support, used to switch off Qwen3 "thinking" for speed. | Nothing copied. |
| [TuuuuTuu/ielts-speaking-practice](https://github.com/TuuuuTuu/ielts-speaking-practice) | 2026-06-11 | **None declared** | Ideas only: offline-first structure, a separate question bank, a reusable timer, export/import of local data. | No code or questions copied (with no licence, all rights are reserved). It also depends on cloud LLM providers (Claude, Gemini, OpenAI-compatible), which we avoid. |
| [Luxshan2000/ielts-prep (BandReady)](https://github.com/Luxshan2000/ielts-prep) | 2026-11-08 | MIT | Ideas: feature error boundaries so one broken module can't take down the app, an "accent notice" component, a no-horizontal-overflow test, and an attempt history per module. | Its Electron/Python sidecar architecture doesn't suit a static Vercel deployment. No code copied. |
| [met4citizen/HeadTTS](https://github.com/met4citizen/HeadTTS) | 2026-10-24 | MIT | Confirmed that Kokoro runs in the browser on WebGPU and WASM in a worker. We use `kokoro-js` (Apache-2.0) directly because we don't need visemes or lip-sync. | Avatar and lip-sync features (not needed). |
| [lengvietcuong/examinai](https://github.com/lengvietcuong/examinai) | 2026-11-03 | **None declared** | Ideas: showing writing assessment per criterion, and an examiner that runs as a session. | Cloud API routes (`/api/stt`, `/api/tts`, `/api/writing/assess`) and the database. No code copied. |

### Dependency and security notes

- `npm audit` reports `sharp` (high) and `minimatch` (moderate) advisories. **`sharp` is a Node-only image library pulled in by `kokoro-js` → `@huggingface/transformers@3`. It is never bundled into the browser build** (Vite resolves the browser entry), so it doesn't affect users. `minimatch` is a dev-tool dependency. Neither is reachable from the deployed site.
- `kokoro-js` bundles its own Transformers.js v3. This adds weight only to the lazy-loaded TTS worker (about 2.2 MB JS), not to the initial page.
- No paid or cloud AI APIs are used anywhere.

## 2. Model investigation

### Speech recognition
| Model | Files used (q8 decoder, fp32 encoder) | Notes |
|---|---|---|
| `onnx-community/whisper-tiny.en` | encoder 33 MB + merged decoder 31 MB (WASM); smaller on WebGPU (q4 decoder) | Default. English-only, fast enough on mid-range phones via WASM. |
| `onnx-community/whisper-base.en` | encoder 82 MB + decoder 54 MB | Better accuracy, about 2× slower; offered for desktops. |
| `openai/whisper-small` | PyTorch/safetensors only in that repo | Not offered: too large for phones, and the official repo isn't in the ONNX layout Transformers.js needs. |

Whisper produces text only. **It is not a pronunciation assessor** (see §3).

### Text-to-speech
`onnx-community/Kokoro-82M-v1.0-ONNX` through `kokoro-js` 1.2.1. We load the `q8` variant (~92 MB) on WASM, or `fp32` on WebGPU desktops. It has British (bf_emma, bf_isabella, bm_george, bm_lewis) and American (af_heart, am_michael) voices. Kokoro offers no Australian, Canadian, Indian or other accents, which is a limitation for Listening variety (see Known limitations in the README). The browser's `speechSynthesis` is the fallback.

### Local LLM
- `Qwen/Qwen3-4B` on Hugging Face is a full-precision safetensors checkpoint (~8 GB). **It does not run in WebLLM as-is.** WebLLM needs MLC-compiled weights plus a WebGPU kernel library, which it provides as `Qwen3-4B-q4f16_1-MLC` (~3.4 GB VRAM).
- `onnx-community/Qwen3-0.6B-Instruct-ONNX` (the name in the brief) doesn't exist; the actual repo is `onnx-community/Qwen3-0.6B-ONNX`. Its q4f16 file alone is 570 MB, and ONNX generation of a decoder LLM in Transformers.js is slower than WebLLM's compiled kernels.
- **Decision: one runtime (WebLLM) with prebuilt MLC models**, picked from WebLLM's own `config.ts`:
  - `Qwen3-0.6B-q4f16_1-MLC` (1.4 GB VRAM): light
  - `Qwen3-1.7B-q4f16_1-MLC` (2.0 GB VRAM): **default**
  - `Qwen3-4B-q4f16_1-MLC` (3.4 GB VRAM): advanced desktop
  - `Llama-3.2-1B-Instruct-q4f16_1-MLC` (0.9 GB VRAM): low-memory alternative
- WebLLM requires WebGPU. Most phones (and Firefox/Safari in some configurations) don't provide it, so the app shows a text-only "manual mode" and keeps every study module working.
- No fine-tuning: there is no legally usable, examiner-marked IELTS dataset to train on, and no validation set to show that it helps.

## 3. Academic literature

All DOIs were verified against the Crossref API on 2026-11-14. arXiv items were checked against the arXiv API.

1. **Ke, Z., & Ng, V. (2019). Automated essay scoring: A survey of the state of the art.** *Proceedings of IJCAI-19*, 6300–6308. https://doi.org/10.24963/ijcai.2019/879
   *Finding:* feature-based and neural AES systems correlate with human raters on holistic scores but are weaker on individual traits such as organisation and argument strength, and can be fooled by length and vocabulary manipulation.
   *Used for:* per-criterion features with explicit reasons; caps for under-length answers; a test that rare-word stuffing is **not** rewarded.
2. **Mizumoto, A., & Eguchi, M. (2023). Exploring the potential of using an AI language model for automated essay scoring.** *Research Methods in Applied Linguistics, 2*(2), 100050. https://doi.org/10.1016/j.rmal.2023.100050
   *Finding:* GPT scores on learner essays agreed only moderately with benchmark levels, and improved when combined with linguistic features.
   *Used for:* keeping numerical estimates in a deterministic module, with the LLM writing commentary only.
3. **Zechner, K., Higgins, D., Xi, X., & Williamson, D. M. (2009). Automatic scoring of non-native spontaneous speech in tests of spoken English.** *Speech Communication, 51*(10), 883–895. https://doi.org/10.1016/j.specom.2009.04.009
   *Finding:* fluency features (speech rate, pause frequency and length) are among the most predictive and robust signals for spontaneous speech, but the overall agreement with humans is moderate.
   *Used for:* waveform-measured speech rate and long-pause counts in Fluency and Coherence.
4. **Witt, S. M., & Young, S. J. (2000). Phone-level pronunciation scoring and assessment for interactive language learning.** *Speech Communication, 30*(2–3), 95–108. https://doi.org/10.1016/S0167-6393(99)00044-8
   *Finding:* reliable pronunciation scoring needs phone-level acoustic models and forced alignment (Goodness of Pronunciation), not word transcripts.
   *Used for:* the decision **not** to give a Pronunciation band, plus a clearly labelled read-aloud "intelligibility" drill instead.
5. **Koenecke, A., et al. (2020). Racial disparities in automated speech recognition.** *PNAS, 117*(14), 7684–7689. https://doi.org/10.1073/pnas.1915768117
   *Finding:* commercial ASR word-error rates were almost twice as high for Black speakers as for white speakers.
   *Used for:* the accent notice, the editable transcript before submission, and never treating ASR misses as pronunciation errors.
6. **Radford, A., et al. (2022). Robust speech recognition via large-scale weak supervision.** arXiv:2212.04356.
   *Finding:* Whisper is robust across accents and noise, but small models have noticeably higher WER, and it can hallucinate on silence.
   *Used for:* defaulting to Tiny for speed and offering Base on desktops; empty-transcript handling.
7. **Settles, B., & Meeder, B. (2016). A trainable spaced repetition model for language learning.** *Proceedings of ACL 2016*, 1848–1858. https://doi.org/10.18653/v1/P16-1174
   *Used for:* spaced repetition in the Vocabulary module. We use SM-2-style scheduling, because a trained half-life model needs review logs we don't have.
8. **Cepeda, N. J., Pashler, H., Vul, E., Wixted, J. T., & Rohrer, D. (2006). Distributed practice in verbal recall tasks: A review and quantitative synthesis.** *Psychological Bulletin, 132*(3), 354–380. https://doi.org/10.1037/0033-2909.132.3.354
   *Used for:* the study plan spreads practice across days, with weekly review days, rather than cramming.
9. **Kasneci, E., et al. (2023). ChatGPT for good? On opportunities and challenges of large language models for education.** *Learning and Individual Differences, 103*, 102274. https://doi.org/10.1016/j.lindif.2023.102274
   *Used for:* labelling AI output, showing source references, and warning that LLMs can be wrong.
10. **Lewis, P., et al. (2020). Retrieval-augmented generation for knowledge-intensive NLP tasks.** arXiv:2005.11401.
    *Used for:* the AI Tutor retrieves from a local knowledge base (`src/content/knowledge.ts`) and puts those notes in the prompt. Entries are labelled "official info" or "teaching advice".

Papers were read via publisher landing pages and abstracts, plus open-access versions where available. No paper text is redistributed in this repository.

## 4. Official exam information used

From public IELTS.org pages (test format, "IELTS scoring in detail", public band descriptors, Life Skills pages), checked 2026-11-14:
- Listening: 4 recordings, 40 questions, heard once. Reading: 40 questions, 60 minutes. Academic and General Training Reading and Writing differ; Listening and Speaking are shared.
- Writing: Task 2 is worth twice Task 1. Four criteria per task.
- Speaking: four equally weighted criteria; Part 2 has 1 minute of preparation and up to 2 minutes of speaking.
- Overall band: the mean of four skills; .25 rounds up to the next half band and .75 rounds up to the next whole band.
- Raw-to-band tables: approximate published tables for Listening, Academic Reading and General Training Reading. Real test versions vary, so the tables are versioned (`SCORING_RULES_VERSION`) and shown with ±0.5 band.
- Life Skills: Speaking & Listening only, A1/A2/B1, taken with another candidate, Pass/Fail.
- UKVI: same content and scoring, different test-day procedures.
- Delivery: computer-delivered and, in some locations, paper-based. IELTS Studio is computer-first with an optional paper/handwriting practice mode.

**Assumption (documented in code):** IELTS doesn't publish how criterion averages within a task are rounded. IELTS Studio rounds them **down** to the nearest half band so estimates err on the cautious side.

## 5. How the scoring estimate works

- **Reading and Listening:** marked against fixed, validated keys. Every answer must be supported by verbatim evidence in the passage or script, which `content.test.ts` checks automatically.
- **Writing:** `src/lib/writingAnalysis.ts` derives observable features (keyword coverage of the prompt, overview presence, data references, bullet coverage and letter tone, position and conclusion, paragraphing, cohesive-device range and overuse, MATTR lexical diversity, word-form errors, complex-sentence ratio, error density) and maps them onto the four criteria. Each criterion lists its reasons and evidence. Calibration: all 15 model answers score ≥ 6.5 (most 7–7.5), a mid-level learner essay scores 5–6.5, and a weak essay scores ≤ 4.5 (`analysis.test.ts`).
- **Speaking:** the same lexical and grammatical features, plus fluency from the **waveform** (voiced time, long pauses, speech rate). Pronunciation is **not scored**. The band is labelled provisional (3 of 4 criteria).
- **The LLM never produces a band.** It only writes commentary, follow-up questions and practice material.

This is not a validated scoring engine. It hasn't been compared with certified examiners on a representative sample, so all estimates are shown as ranges (±1 band for Writing and Speaking).
