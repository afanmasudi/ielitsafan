# IELTS Studio

*Made by Afan Abdullah Masoodi* · Live at https://ielitsafan.vercel.app

A private, local-first IELTS preparation platform. It covers Academic, General Training, UKVI and Life Skills, with full mock exams, a turn-by-turn voice examiner, writing feedback, a personalised study plan and a local AI tutor. It all runs in the browser: no account, no backend, no paid AI APIs.

> IELTS Studio is an independent practice tool. It is not affiliated with or endorsed by the British Council, IDP or Cambridge University Press & Assessment. All scores are practice estimates, not official results.

## Features

| Area | What you get |
|---|---|
| **Onboarding & plan** | Test type (Academic / GT / UKVI / Life Skills A1-B1), level, target, exam date, daily time, strong and weak skills, a 12-question placement check. Generates a week-by-week Foundation → Intermediate → Advanced plan, with extra time for weak skills, review days and spaced mock exams. Editable. |
| **Band 8.5 Strategy Guide** | One short card per paper and question type: how to look at it, 3 to 5 steps, do and don't, a memory trick (A-R-E, O-R-E-O, PEEL, I-O-B-B, the contradiction test) and an original worked example. Also covers what Band 8.5 looks like, time plans and an exam-day checklist. Tips appear inline next to every practice question group (hidden in mock exams), plus a Tip of the day on the Dashboard. Sourced from the public band descriptors and IDP/IELTS pages, summarised in our own words. |
| **Trending topics** | AI, social media, online learning, change and recycling: 4 new Part 1 topics, 4 cue cards with Part 3 questions, 3 Task 2 prompts with model answers (AI in schools, AI and jobs, misinformation), an AI essay-marking reading passage, AI and Digital life vocabulary, and guide cards ("Benefit, Risk, Rule" and "Who gains, who loses, who should act?"). All original, based on themes reported by prep sites. |
| **Speaking Lab** | Three-part examiner run by a state machine (it can't skip or repeat questions): Part 1 topics, a Part 2 cue card with a 1-minute prep and 2-minute talk timer, and Part 3 discussion. Optional LLM follow-ups in Part 3. Recording, local Whisper transcription and an editable transcript. Feedback only at the end. Fluency is measured from the audio. Pronunciation is deliberately not scored; a read-aloud intelligibility drill is offered instead. |
| **Live video-call examiner** | Hands-free conversation with an animated examiner (two personas, lip-synced to the voice). Continuous voice-activity detection decides when you start and finish. Before replying, it transcribes your pause to check whether your sentence is complete. It nudges after long silences, politely interrupts over-long answers, can be interrupted (opt-in, best with headphones), and handles "Sorry, can you repeat?", "What does X mean?" and "What about you?" the way an examiner would. It skips questions you've already answered and asks follow-ups. Optional webcam analysis covers face in view, eye contact, look-away episodes and mouth-movement versus audio. The report adds response time, interruptions, repeats and on-topic checks. Questions you've practised before are avoided, and AI-generated questions are de-duplicated by meaning. Also available for CV interviews. |
| **Writing Lab** | Academic Task 1 (line, bar, pie, table, map, process, mixed: all rendered as live SVG), GT letters (formal, semi-formal, informal), and Task 2 (opinion, discussion, advantages/disadvantages, problem/solution, two-part). Timer, word count, autosave, paper/handwriting mode, four-criterion estimate with reasons and evidence, highlighted errors, automatic corrections, paragraph and vocabulary analysis, a model answer, and optional AI commentary. |
| **Reading Lab** | A full Academic test and a full GT test (40 questions each) covering all 12 question types, with timer, navigator, highlighting, marking, explanations, and the supporting passage text highlighted after submission. |
| **Listening Lab** | A 4-part, 40-question test (form, table, map, multiple choice, matching, notes, flow chart, sentence and short answer) voiced on-device with British and American speakers. Exam mode plays each part once with no pausing and hides transcripts until you submit. |
| **Mock Exam Centre** | Academic, GT, UKVI Academic and UKVI GT full mocks (L → R → W → S), resumable, with the overall band and its uncertainty. Life Skills A1/A2/B1 with an examiner and a simulated partner, giving a Pass/Fail practice estimate. |
| **Vocabulary** | Eight topic lists with collocations, SM-2 spaced repetition, your own words, and AI-generated lists. |
| **Grammar** | Ten lessons with quizzes, aimed at errors that lower GRA. |
| **AI Tutor** | WebLLM chat grounded in a local knowledge base (official information is labelled separately from teaching advice). Works offline as knowledge-base search when no model is loaded. |
| **Interview Practice** | Upload a PDF/DOCX/TXT CV. It's parsed in the browser into education, experience, projects, skills, achievements, hobbies and goals, and turned into personalised interview questions with a voiced interviewer. You're asked before anything is saved. Clearly separate from IELTS Speaking. |
| **Progress** | Pattern insights (Bayesian mastery per question type with likely range and trend, speaking fluency trends, rising and falling error patterns, band projection to your exam date), study minutes, streak, accuracy, skill trends, the last five mocks compared, most common mistakes, and weekly recommendations. |
| **Settings** | Model manager (device check, sizes, download progress, load/unload/delete, modes), JSON export/import, profile PIN, delete a profile or all data, voice toggle. |
| **PWA** | Installable; the app shell and learning content work offline after the first visit. |

## Quick start

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # 122 unit tests (scoring, analysers, content validation, data flows)
npm run lint
npm run build      # type-check + production build into dist/
npm run preview    # serve the production build (service worker active)
```

Requires Node 20+ (tested on Node 24).

## Deploying to Vercel

The app is a static Vite site. `vercel.json` already sets the build command, output directory, SPA rewrite, caching and security headers.

1. Push the folder to a Git repository and import it at [vercel.com/new](https://vercel.com/new), **or** run `npm i -g vercel && vercel` and then `vercel --prod`.
2. Framework preset: **Vite** (detected). Build command `npm run build`, output `dist`.
3. You don't need any environment variables, and there are no server functions.
4. `vercel.json` sends `Cross-Origin-Opener-Policy`/`Cross-Origin-Embedder-Policy` headers. These make the page cross-origin isolated, so the in-browser AI can use every CPU core.

Notes:
- The ONNX Runtime WebAssembly files (~48 MB in total) ship in `dist/assets` and are served from your own domain. WebLLM loads its WebGPU kernels and model weights from its public model library when a user chooses to download a model.
- Microphone access requires HTTPS, which Vercel provides.

## Privacy model

- All data lives in IndexedDB in the user's browser (Dexie). Profiles don't sync between devices or browsers.
- The PIN is a convenience lock, not security. It's stored as a salted PBKDF2 hash, but anyone with access to the browser profile can read IndexedDB.
- CVs, recordings, essays and learning records are never transmitted. Recordings are processed in memory and only the transcript and timing statistics are kept.
- The only network requests after first load are optional model downloads from Hugging Face and the WebLLM library, made when the user presses Download.
- The app requests persistent storage and reminds users to export backups.

## Project structure

```
src/
  ai/          Whisper, Kokoro and WebLLM wrappers + their Web Workers, model catalogue, device checks
  lib/         scoring engine, writing & speaking analysers, text rules, marking, plan, SRS, DB, backup, CV parser, recorder
  content/     original passages, scripts, prompts, cue cards, vocabulary, grammar, Life Skills tasks, knowledge base
  features/    test runners reused by labs and mocks (Reading, Listening, Writing, Speaking, Life Skills)
  components/  UI kit, layout, charts (SVG), question renderer, recorder UI, criteria report
  pages/       one file per section
```

## Known limitations

- Estimates aren't validated against examiners. Writing and Speaking estimates come from transparent feature rules, calibrated only on a small set of sample essays. Expect ±1 band.
- Pronunciation isn't scored. Whisper transcripts can't show it, and there's no validated in-browser acoustic model. The read-aloud drill measures ASR intelligibility only, and ASR is less accurate for some accents.
- The grammar checker catches common learner errors (agreement, articles, prepositions, uncountables, spelling, collocations). It doesn't catch every error or check meaning.
- Content volume: one full Academic Reading test, one GT Reading test and one Listening test, plus 15 writing prompts and 12 cue cards. All original. More tests can be added in `src/content/` (the validation test checks any new keys automatically).
- Listening accents: Kokoro provides British and American English only.
- Life Skills partner turns are scripted. They can't react to everything you say, so this can't reproduce a real paired test.
- The local LLM needs WebGPU and 1-4 GB of GPU memory. It's usually unavailable on phones; there the tutor runs in offline mode.
- Speech recognition is turn-based (each answer is transcribed in short pauses and at the end), not word-by-word streaming.
- The examiner avatar is an illustrated, animated character, not a photorealistic human. Webcam feedback is about on-camera presence only; IELTS does not mark body language.
- On CPU the neural voice is about 1.5× slower than speech. The app pre-voices upcoming lines to hide this; the optional GPU voice (326 MB) makes it fast.
- Raw-to-band tables are the approximate published ones. Real tests vary by version.

## Licence acknowledgements

Dependencies: React (MIT), Vite (MIT), Tailwind CSS (MIT), Dexie (Apache-2.0), lucide-react (ISC), @huggingface/transformers (Apache-2.0), @mlc-ai/web-llm (Apache-2.0), kokoro-js (Apache-2.0), pdf.js (Apache-2.0), mammoth (BSD-2-Clause), Inter and Plus Jakarta Sans fonts (SIL OFL 1.1). Models: see [MODEL_GUIDE.md](MODEL_GUIDE.md). Repositories that informed the design are listed in [RESEARCH.md](RESEARCH.md); no code was copied from them.

All passages, scripts, prompts, model answers, questions and lessons were written for IELTS Studio. No commercial IELTS materials are reproduced.

See also: [RESEARCH.md](RESEARCH.md) · [MODEL_GUIDE.md](MODEL_GUIDE.md) · [TESTING.md](TESTING.md)
