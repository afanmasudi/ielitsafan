import { criteriaBand, floorHalf } from './scoring';
import { findIssues, findLinkers, mattr, sentences, SUBORDINATORS, topRepeated, words, type Issue } from './text';

export interface AudioStats {
  /** Seconds of the recording. */
  duration: number;
  /** Seconds the voice was active (energy above the noise floor). */
  voiced: number;
  /** Silent gaps longer than 1.5 s, measured from the waveform. */
  longPauses: number;
}

export interface Turn {
  part: 1 | 2 | 3;
  question: string;
  answer: string;
  audio?: AudioStats;
  typed?: boolean;
}

export interface SpeakingCriterion { name: string; band: number | null; reasons: string[]; evidence: string[] }

export interface SpeakingReport {
  criteria: SpeakingCriterion[];
  band: number;
  provisional: boolean;
  issues: Issue[];
  repeated: [string, number][];
  fillers: Record<string, number>;
  wpm: number | null;
  exercise: string;
}

const FILLERS = ['um', 'uh', 'erm', 'er', 'hmm', 'like', 'you know', 'i mean', 'kind of', 'sort of', 'basically', 'actually'];
const clamp = (x: number) => Math.max(1, Math.min(9, floorHalf(x)));

/**
 * Transcript + waveform features mapped to the public Speaking descriptors.
 * Pronunciation is deliberately NOT estimated: a transcript cannot show it, and we have no
 * validated acoustic model. See RESEARCH.md (Witt & Young 2000; Koenecke et al. 2020).
 */
export function analyseSpeaking(turns: Turn[]): SpeakingReport {
  const all = turns.map((t) => t.answer).join(' ');
  const ws = words(all);
  const ss = sentences(all.replace(/([a-z])\s*$/i, '$1.'));
  const issues = findIssues(all).filter((i) => !['capitalisation', 'punctuation', 'spelling'].includes(i.type));
  const repeated = topRepeated(ws, 4);
  const lower = ' ' + ws.join(' ') + ' ';
  const fillers: Record<string, number> = {};
  for (const f of FILLERS) { const n = lower.split(` ${f} `).length - 1; if (n) fillers[f] = n; }
  const fillerTotal = Object.values(fillers).reduce((a, b) => a + b, 0);

  const answered = turns.filter((t) => words(t.answer).length > 0);
  const avgLen = answered.length ? ws.length / answered.length : 0;
  const p2 = turns.find((t) => t.part === 2);
  const p2words = p2 ? words(p2.answer).length : 0;

  const withAudio = turns.filter((t) => t.audio && t.audio.voiced > 2);
  const voiced = withAudio.reduce((s, t) => s + t.audio!.voiced, 0);
  const audioWords = withAudio.reduce((s, t) => s + words(t.answer).length, 0);
  const wpm = voiced > 5 ? Math.round((audioWords / voiced) * 60) : null;
  const pauses = withAudio.reduce((s, t) => s + t.audio!.longPauses, 0);

  // Fluency and Coherence
  const fc: SpeakingCriterion = { name: 'Fluency and Coherence', band: 6, reasons: [], evidence: [] };
  if (avgLen >= 45) { fc.band! += 1; fc.reasons.push('Answers are well extended.'); }
  else if (avgLen >= 25) fc.reasons.push('Answers are of reasonable length.');
  else if (avgLen >= 12) { fc.band! -= 1; fc.reasons.push('Answers are short. Extend them with reasons and examples.'); }
  else { fc.band! -= 2; fc.reasons.push('Most answers are very short.'); }
  if (p2) {
    if (p2words >= 180) { fc.band! += 0.5; fc.reasons.push(`Part 2 long turn: ${p2words} words. You kept going for the full time.`); }
    else if (p2words < 90) { fc.band! -= 1; fc.reasons.push(`Part 2 long turn was only ${p2words} words. Aim to speak for the full 2 minutes.`); }
  }
  if (wpm !== null) {
    fc.evidence.push(`Speech rate ≈ ${wpm} words per minute of voiced speech (measured from your recordings).`);
    if (wpm < 80) { fc.band! -= 1; fc.reasons.push('Speech rate is slow, which suggests frequent hesitation.'); }
    else if (wpm > 115) fc.band! += 0.5;
    const perMin = pauses / Math.max(1, voiced / 60);
    if (perMin > 3) { fc.band! -= 0.5; fc.reasons.push(`${pauses} long pauses (over 1.5 s) were detected in the audio.`); }
  } else fc.reasons.push('Some answers were typed, so speech rate and pauses could not be measured.');
  const fillerRate = ws.length ? fillerTotal / ws.length : 0;
  if (fillerRate > 0.06) { fc.band! -= 0.5; fc.reasons.push(`Frequent fillers (${Object.keys(fillers).join(', ')}).`); }
  const linkers = findLinkers(all);
  const linkTypes = Object.keys(linkers).length;
  if (linkTypes >= 5) { fc.band! += 0.5; fc.reasons.push(`Uses a range of discourse markers (${Object.keys(linkers).slice(0, 5).join(', ')}).`); }
  else if (linkTypes <= 1) { fc.band! -= 0.5; fc.reasons.push('Few connectives, so ideas are not clearly linked.'); }

  // Lexical Resource
  const lr: SpeakingCriterion = { name: 'Lexical Resource', band: 6, reasons: [], evidence: [] };
  const lex = mattr(ws, 40);
  if (lex >= 0.75) { lr.band! += 1.5; lr.reasons.push('Wide, flexible vocabulary.'); }
  else if (lex >= 0.68) { lr.band! += 0.5; lr.reasons.push('Good range of vocabulary.'); }
  else if (lex >= 0.6) lr.reasons.push('Adequate vocabulary for familiar topics.');
  else { lr.band! -= 1; lr.reasons.push('Limited range; many words are repeated.'); }
  if (repeated.length) lr.evidence.push(`Repeated: ${repeated.map(([w, n]) => `${w} ×${n}`).join(', ')}`);
  // MATTR works inside a 40-word window, so it misses phrases recycled across answers.
  const repShare = repeated.reduce((sum, [, n]) => sum + n, 0) / Math.max(1, ws.length);
  if (repShare > 0.1) { lr.band! -= 1.5; lr.reasons.push('The same words and phrases are recycled across many answers.'); }
  else if (repShare > 0.06) { lr.band! -= 0.5; lr.reasons.push('Some words are repeated across answers; vary your vocabulary.'); }
  const idioms = (all.match(/\b(to be honest|on the whole|by and large|it depends|as far as i'm concerned|from time to time|keep in touch|make ends meet|in the long run|a great deal of)\b/gi) ?? []);
  if (idioms.length >= 2) { lr.band! += 0.5; lr.reasons.push(`Natural phrases: ${[...new Set(idioms.map((x) => x.toLowerCase()))].slice(0, 4).join(', ')}.`); }
  if (ws.length < 80) { lr.band = Math.min(lr.band!, 5); lr.reasons.push('Not enough speech to show a wide range.'); }

  // Grammatical Range and Accuracy
  const gra: SpeakingCriterion = { name: 'Grammatical Range and Accuracy', band: 6, reasons: [], evidence: [] };
  const complex = ss.filter((s) => (s.match(SUBORDINATORS) ?? []).length > 0).length / Math.max(1, ss.length);
  if (complex >= 0.5) { gra.band! += 1; gra.reasons.push('Frequent complex structures.'); }
  else if (complex >= 0.3) gra.reasons.push('Some complex sentences.');
  else { gra.band! -= 1; gra.reasons.push('Mostly simple sentences.'); }
  const tenses = [/\b(was|were|did|went|had)\b/i, /\b(will|going to)\b/i, /\b(have|has) (been|\w+ed)\b/i, /\b(would|could)\b/i].filter((r) => r.test(all)).length;
  if (tenses >= 3) { gra.band! += 0.5; gra.reasons.push('A range of tenses and modal forms.'); }
  const errRate = ws.length ? (issues.length / ws.length) * 100 : 0;
  if (errRate > 2) { gra.band! -= 1; gra.reasons.push('Grammar errors are frequent.'); }
  gra.evidence = issues.slice(0, 5).map((i) => `"${i.match}" → "${i.suggestion}"`);
  gra.reasons.push('Note: transcription can add or remove small words, so treat grammar flags as hints.');

  const pron: SpeakingCriterion = {
    name: 'Pronunciation', band: null,
    reasons: [
      'Not scored. A transcript cannot show pronunciation, and IELTS Studio has no validated acoustic pronunciation model.',
      'Try the Read-Aloud Intelligibility drill. It checks whether speech recognition understood each word, which is a rough proxy, not a band.',
      'Accent is never penalised. IELTS assesses intelligibility, not a British or American accent.',
    ],
    evidence: [],
  };

  const scored = [fc, lr, gra].map((c) => ({ ...c, band: clamp(c.band!) }));
  const weakest = [...scored].sort((a, b) => a.band - b.band)[0];
  const exercise = weakest.name === 'Fluency and Coherence'
    ? 'Fluency drill: pick any Part 1 question and answer for 45 seconds without stopping, using the A-R-E pattern: Answer → Reason → Example. Repeat it three times and try to reduce pauses each time.'
    : weakest.name === 'Lexical Resource'
      ? `Vocabulary drill: for each repeated word (${repeated.map((r) => r[0]).slice(0, 3).join(', ') || 'good, very, thing'}), list two precise alternatives, then re-answer the same question using them.`
      : 'Grammar drill: answer a Part 3 question using one conditional ("If…, …would…"), one relative clause ("…, which…") and one contrast ("Although…").';

  return {
    criteria: [...scored, pron],
    band: criteriaBand(scored.map((c) => c.band)),
    provisional: true,
    issues, repeated, fillers, wpm, exercise,
  };
}

/** Energy-based voice-activity statistics from 16 kHz mono PCM. */
export function audioStats(pcm: Float32Array, rate = 16000): AudioStats {
  const frame = Math.round(rate * 0.03);
  const energies: number[] = [];
  for (let i = 0; i + frame <= pcm.length; i += frame) {
    let s = 0;
    for (let j = i; j < i + frame; j++) s += pcm[j] * pcm[j];
    energies.push(Math.sqrt(s / frame));
  }
  if (!energies.length) return { duration: 0, voiced: 0, longPauses: 0 };
  const sorted = [...energies].sort((a, b) => a - b);
  const floor = sorted[Math.floor(sorted.length * 0.1)];
  const peak = sorted[Math.floor(sorted.length * 0.95)];
  const thr = floor + (peak - floor) * 0.15;
  let voicedFrames = 0, silentRun = 0, longPauses = 0, started = false;
  const pauseFrames = Math.round(1.5 / 0.03);
  for (const e of energies) {
    if (e > thr) {
      voicedFrames++;
      if (started && silentRun >= pauseFrames) longPauses++;
      silentRun = 0; started = true;
    } else silentRun++;
  }
  return { duration: pcm.length / rate, voiced: (voicedFrames * frame) / rate, longPauses };
}

/** Read-aloud intelligibility: share of target words recognised by ASR, in order (LCS). */
export function intelligibility(target: string, heard: string) {
  const a = words(target), b = words(heard);
  const dp = Array.from({ length: a.length + 1 }, () => new Array<number>(b.length + 1).fill(0));
  for (let i = 1; i <= a.length; i++)
    for (let j = 1; j <= b.length; j++)
      dp[i][j] = a[i - 1] === b[j - 1] ? dp[i - 1][j - 1] + 1 : Math.max(dp[i - 1][j], dp[i][j - 1]);
  // Backtrack to find missed words.
  const matched = new Set<number>();
  for (let i = a.length, j = b.length; i > 0 && j > 0;) {
    if (a[i - 1] === b[j - 1]) { matched.add(i - 1); i--; j--; }
    else if (dp[i - 1][j] >= dp[i][j - 1]) i--; else j--;
  }
  return { ratio: a.length ? dp[a.length][b.length] / a.length : 0, missed: a.filter((_, i) => !matched.has(i)) };
}
