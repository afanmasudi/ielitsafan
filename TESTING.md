# Testing report

Date: 14 November 2026 · Environment: Windows 11, Node 24.15, Chrome (desktop, WebGPU available), `vite preview` (production build) and `vite` (dev).

## Automated tests: `npm test`

**118 tests, all passing** (Vitest).

| File | What it covers |
|---|---|
| `src/lib/scoring.test.ts` | Official overall rounding (.25 → .5, .75 → next band) including IELTS.org worked examples; Task 2 double weighting; cautious criterion rounding; Listening, Academic Reading and GT Reading tables (spot checks, monotonic over 0–40, sources present); scaling of short practice sets; CEFR mapping; Life Skills Pass/Fail; range clamping. |
| `src/lib/analysis.test.ts` | Writing analyser ranks a weak, a mid-level and a model essay in the right order and in plausible ranges; **all 15 model answers ≥ 6.5**; Task Achievement vs Task Response naming; a missing overview is penalised; informal tone in a formal letter is penalised; **rare-word stuffing is not rewarded**; error checker finds and fixes common errors without false positives on correct text; MATTR is length-robust. Speaking analyser ranks a developed performance above a minimal one, **never produces a pronunciation band**, penalises phrases recycled across answers, and uses audio timing only when audio exists. Waveform statistics detect voiced time and long pauses; read-aloud intelligibility alignment. |
| `src/lib/logic.test.ts` | Speaking state machine: runs Parts 1→2→3 in order with no repeated question, official 60 s / 120 s Part 2 timings, questions can't be skipped, follow-ups are limited and de-duplicated. SM-2 intervals. Study plan stops at the exam date, weights weak skills, includes mocks, and Life Skills plans contain only Speaking and Listening. Backup validation. Placement levels. |
| `src/lib/data.test.ts` | IndexedDB flows (fake-indexeddb): per-profile isolation, study-time logging, **export → delete → import round-trip**, re-import doesn't duplicate, deleting one profile leaves others intact, non-backup files rejected, PIN hash verification. |
| `src/lib/live.test.ts` | Voice activity detection (start/end, click rejection, noisy-room adaptation, barge-in threshold); turn-taking policy (wait → nudge → give up, end-of-turn, extra time after thinking fillers, interrupting long answers, Part 2 pauses); intent classification (13 utterances: repeat, clarify, ask-examiner, thinking, silence, answers); utterance completeness; non-repeating question selection; skipping covered questions; Bayesian mastery, regression, band projection, error patterns, weakest-first recommendation; webcam session summary. |
| `src/content/content.test.ts` | **Answer-key validation:** every Reading and Listening answer's evidence appears verbatim in its passage or script; completion answers appear in the evidence and pass their own marking and word limits; option answers are valid options; questions are numbered 1–40 for each full test; all 12 Reading and 9 Listening question types are present; more than one English variety; grammar keys valid; all Task 1 visual types, letter tones and Task 2 essay types exist; the knowledge-base search returns the right entries. |

Other checks: `npm run lint` (ESLint, 0 errors) · `npx tsc -b` (strict TypeScript, 0 errors) · `npm run build` (success).

## Manual / browser verification

Done in Chrome via browser automation on the production build, unless noted.

| # | Check | Result |
|---|---|---|
| 1 | Create profile → onboarding (5 steps incl. placement) → dashboard | ✅ Placement stored, plan generated |
| 2 | Data persists after refresh | ✅ Profile session and writing draft both restored after a reload |
| 3 | Writing autosave | ✅ Draft (849 chars) restored after a reload; deleted on submit |
| 4 | Reading marking | ✅ "Bees in the City": 12/13 with one deliberate error; "Thyme" (capitalised) accepted; scaled band 8.5 |
| 5 | Listening marking | ✅ Mock Listening 4/40 → band 2.5 per table; spaced phone number "07700 954318" accepted |
| 6 | Timers | ✅ Reading/Listening/Writing countdowns; Part 2 60 s prep + 120 s talk (unit-tested; prep skipped manually in the UI run) |
| 7 | Speaking flow | ✅ Part 1: 8 questions in order, no repeats, feedback only at the end; the full mock Speaking ran Parts 1–3 to completion |
| 8 | Microphone denied | ✅ Simulated `NotAllowedError`: clear message, automatic switch to typing, the test continues |
| 9 | Transcription (Whisper Tiny, WASM) | ✅ Model downloaded on request (cold load ~6 min at ~0.6 MB/s); Kokoro audio transcribed **word-for-word**; warm transcription of a 6 s clip took **~1.0 s** |
| 10 | TTS (Kokoro q8, WASM) | ✅ British and American voices; warm synthesis of 6.2 s of audio in 3.6 s (faster than real time) |
| 11 | Model download & loading | ✅ Whisper, Kokoro and WebLLM **Qwen3 0.6B** (WebGPU, loaded in 70 s). Tutor answer, Part 3 follow-up and JSON vocabulary list all generated; warm responses ~2 s, first response ~35 s (shader compilation). The 0.6B model's follow-up echoed the examiner's question, so a guard now rejects echoes (the exam then simply continues); **Qwen3 1.7B is the recommended default** for quality. 1.7B and 4B were not downloaded in this session because of slow bandwidth (~0.6 MB/s). |
| 12 | Model fallback | ✅ With no models: browser voice used, typing offered, tutor in offline knowledge-base mode, every module usable |
| 13 | CV parsing | ⚠️ Section extraction tested through the parser logic; PDF/DOCX upload needs a real file chosen by the user, so it wasn't automated. pdf.js and mammoth load lazily (separate chunks). |
| 14 | Mock calculation | ✅ Full Academic mock: L 2.5, R 1.0, W 5.5 (Task 2 double-weighted), S 5.5 → mean 3.625 → **3.5** (correct official rounding). Resuming mid-Writing restores Task 1. |
| 15 | Mobile layout | ✅ All 13 pages at 360 px and 390 px: no horizontal overflow, bottom navigation shown, sidebar hidden (two overflows found and fixed) |
| 16 | PWA | ✅ Service worker active and controlling the page, manifest valid (standalone, 4 icons), shell and asset caches populated |
| 17 | Export / import | ✅ Round-trip unit-tested in IndexedDB; buttons produce a JSON download in the browser |
| 18 | Data deletion | ✅ Profile delete and delete-all unit-tested; in-app confirmation dialogs (no blocking browser dialogs) |
| 19 | Production build | ✅ Initial load ≈ 115 KB gzip (index + UI + CSS); every page, the AI runtimes, pdf.js and mammoth are lazy chunks |
| 20 | Console errors | ✅ None during the page sweep |

### Bugs found by testing and fixed
1. Mock Writing Task 2 inherited the "submitted" state of Task 1 (React reused the component), so there was no text box. Fixed with per-task keys, and Task 1 is now restored when resuming.
2. Browser speech synthesis sometimes never fires `end` in background tabs, which could stall the examiner. Fixed with a duration-based timeout.
3. Speaking Lexical Resource over-rewarded phrases recycled across answers (MATTR only sees a 40-word window). Fixed with a cross-answer repetition penalty and a test.
4. Whisper writes numbers as digits, so the read-aloud sentence "Thirty-three thousand…" would count as missed words. The sentence was replaced.
5. Two mobile overflows (stat tiles, mistake cards). Fixed with `min-w-0` and truncation.
6. Writing calibration: map and process tasks were penalised for having no numbers, and participle clauses weren't counted as complex. Task-specific checks were added.

## Feedback quality vs the public band descriptors

| Sample | Estimate | Comment |
|---|---|---|
| Weak opinion essay (≈90 words, one paragraph, frequent errors) | ≤ 4.5 | Matches the descriptors: under-length, no paragraphing, errors impede. |
| Mid-level essay (≈150 words, clear position, simple linking, some errors) | 5.5 | Under-length cap applied; the descriptors would put it around 5–5.5. |
| Model answers (15) | 6.5–7.5 | Strong texts land in the Band 7 region. The analyser can't reliably separate 7.5 from 8.5, because that depends on precision and nuance it doesn't measure. |
| Typed speaking with recycled phrases | LR penalised after the fix | Verified in the browser and the unit test. |

**This is not examiner-level reliability.** There was no comparison with certified examiners on a representative marked sample, so the interface shows every estimate as a range with a disclaimer.

## Not verified
- iOS Safari and Android Chrome on real devices (layout was checked in phone-width viewports only).
- PWA install prompt UI (installability criteria checked: manifest, icons, active service worker).
- Real microphone recording with a human voice in automation (the recorder, decoding and transcription paths were exercised with synthesised audio).

## Live video-call examiner (added later)

Tested end to end in Chrome on the dev build. A fake microphone carried a simulated candidate (Kokoro American voice) **plus the examiner's own voice fed back at 60% volume**, to reproduce laptop-speaker echo with barge-in enabled.

| Check | Result |
|---|---|
| Examiner asks, then reliably hears the answer (no ask-again loop) | ✅ every answer heard. **Bug found and fixed:** echo during examiner speech raised the VAD noise floor above the candidate's voice; the floor is now frozen while the examiner talks, with a 350 ms echo hold afterwards |
| No false self-interruption with speaker echo | ✅ echo-aware barge-in (learned echo gain vs examiner output level); barge-in off by default |
| "Sorry, could you repeat the question?" | ✅ "Certainly. What kind of food do you like?" |
| "What about you?" | ✅ "That’s a good question, but I’m here to listen to you. What’s your view?" |
| Name answer no longer triggers "Why is that?" | ✅ Part 1 probes only yes/no and preference questions |
| Reply latency after the candidate stops | **1.5–2.7 s** (was 8.7 s) via early pause transcription, pre-voiced phrases, next-question prefetch, cross-origin isolation |
| Call start | Opening lines pre-voiced in the lobby; first words within ~1 s of joining (was ~58 s cold) |
| Whisper (cross-origin isolated) | 0.78 s for a 3.4 s clip, transcript exact |
| Face tracking under COEP | ✅ model loads; blank frame → "no face" |
| Lobby | ✅ mic check (level + "speech detected"), model readiness, GPU-voice suggestion when the CPU voice is slow |

Not verified automatically: a real human voice and face (needs your microphone and camera), and the GPU voice (326 MB download skipped on this connection).
