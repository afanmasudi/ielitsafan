import { criteriaBand, floorHalf } from './scoring';
import {
  countWords, findIssues, findLinkers, INFORMAL, LINKERS, mattr, paragraphs, PASSIVE, CONDITIONAL,
  sentences, sentenceVariety, SUBORDINATORS, topRepeated, words, isStop, type Issue,
} from './text';

export type WritingTaskKind = 'academic-task1' | 'general-task1' | 'task2';

export interface WritingPromptMeta {
  kind: WritingTaskKind;
  prompt: string;
  /** Words or short phrases a full response would naturally mention. */
  keywords: string[];
  /** GT letters: content points (each a list of alternative keywords). */
  bullets?: string[][];
  tone?: 'formal' | 'semi-formal' | 'informal';
  parts?: number;
  essayType?: 'opinion' | 'discussion' | 'advantages' | 'problem-solution' | 'two-part';
  chart?: { type: string };
}

export interface CriterionResult { name: string; band: number; reasons: string[]; evidence: string[] }

export interface WritingReport {
  wordCount: number;
  minWords: number;
  paragraphs: number;
  criteria: CriterionResult[];
  band: number;
  issues: Issue[];
  repeated: [string, number][];
  linkers: Record<string, number>;
  paragraphNotes: string[];
  stats: { mattr: number; avgWordLen: number; avgSentence: number; complexRatio: number; errorsPer100: number };
}

const clamp = (x: number) => Math.max(1, Math.min(9, floorHalf(x)));

export function criterionNames(kind: WritingTaskKind) {
  return [kind === 'task2' ? 'Task Response' : 'Task Achievement', 'Coherence and Cohesion', 'Lexical Resource', 'Grammatical Range and Accuracy'];
}

/** A sentence counts as complex if it has a subordinate clause, a relative clause or a participle clause. */
const PARTICIPLE = /,\s+(\w+ing|\w+ed)\b/i;
export const isComplex = (s: string) => (s.match(SUBORDINATORS) ?? []).length > 0 || PARTICIPLE.test(s) || /\b(after|before|until|whereas|while)\b/i.test(s);

/**
 * Feature-based estimate aligned to the public band descriptors. Each criterion starts at 6
 * and moves up or down for observable evidence. Thresholds were calibrated on the sample
 * essays in analysis.test.ts; see RESEARCH.md for the method and its limits (it measures
 * observable features, not meaning or the accuracy of ideas).
 */
export function analyseWriting(text: string, meta: WritingPromptMeta): WritingReport {
  const minWords = meta.kind === 'task2' ? 250 : 150;
  const wc = countWords(text);
  const ws = words(text);
  const ss = sentences(text);
  const ps = paragraphs(text);
  const issues = findIssues(text);
  const linkers = findLinkers(text);
  const repeated = topRepeated(ws, wc > 200 ? 5 : 4);
  const lex = mattr(ws);
  const content = ws.filter((w) => !isStop(w));
  const avgWordLen = content.length ? content.reduce((s, w) => s + w.length, 0) / content.length : 0;
  const { mean: avgSentence, cv } = sentenceVariety(ss);
  const complexRatio = ss.length ? ss.filter(isComplex).length / ss.length : 0;
  const passives = (text.match(PASSIVE) ?? []).length;
  const conditionals = (text.match(CONDITIONAL) ?? []).length;
  const errs = issues.filter((i) => i.type !== 'repetition').length;
  const errorsPer100 = wc ? (errs / wc) * 100 : 0;
  const lower = text.toLowerCase();
  const stats = { mattr: lex, avgWordLen, avgSentence, complexRatio, errorsPer100 };

  if (wc < 20) {
    const crit = criterionNames(meta.kind).map((name) => ({ name, band: wc ? 1 : 0, reasons: ['The response is too short to assess.'], evidence: [] }));
    return { wordCount: wc, minWords, paragraphs: ps.length, criteria: crit, band: wc ? 1 : 0, issues, repeated, linkers, paragraphNotes: [], stats };
  }

  // ---- Task Achievement / Task Response
  const ta: CriterionResult = { name: criterionNames(meta.kind)[0], band: 6, reasons: [], evidence: [] };
  const up = (n: number, why: string) => { ta.band += n; ta.reasons.push(why); };
  const covered = meta.keywords.filter((k) => lower.includes(k.toLowerCase()));
  const coverage = meta.keywords.length ? covered.length / meta.keywords.length : 1;
  if (coverage >= 0.75) up(1, `Covers the main elements of the question (${covered.slice(0, 6).join(', ')}).`);
  else if (coverage >= 0.55) up(0.5, 'Covers most elements of the question.');
  else if (coverage >= 0.3) up(-0.5, 'Some parts of the question are not clearly addressed.');
  else up(-2, 'Few key ideas from the question are mentioned; the response may be off-topic.');

  if (wc < minWords) {
    const short = (minWords - wc) / minWords;
    up(short > 0.4 ? -2.5 : short > 0.15 ? -1.5 : -0.5, `Under the minimum length (${wc}/${minWords} words). Short answers lose marks for task fulfilment.`);
  }

  if (meta.kind === 'academic-task1') {
    const visual = meta.chart?.type ?? 'line';
    const overview = /\b(overall|in general|it is (clear|evident|noticeable)|generally|the most (striking|noticeable))\b/i.exec(text);
    if (overview) { ta.evidence.push(snippet(text, overview.index)); up(1, 'Contains an overview of the main features, which is essential for Band 6+.'); }
    else up(-1.5, 'No clear overview. Band 6+ requires a summary of the main trends or features.');
    if (visual === 'process') {
      const seq = (lower.match(/\b(first|then|next|after|once|finally|subsequently|at the next stage|following this)\b/g) ?? []).length;
      if (seq >= 4) up(0.5, 'Stages are described in a clear sequence.');
      else up(-0.5, 'Use sequencing language (first, next, after this, finally) to show each stage.');
    } else if (visual === 'map') {
      const change = (lower.match(/\b(replaced|built|demolished|converted|constructed|extended|removed|added|remains|unchanged)\b/g) ?? []).length;
      if (change >= 4) up(0.5, 'Changes between the maps are clearly identified.');
      else up(-0.5, 'Describe the changes using words such as replaced, built, demolished, converted.');
    } else {
      const numbers = (text.match(/\d+(\.\d+)?/g) ?? []).length;
      if (numbers >= 6) up(0.5, `${numbers} figures support the description.`);
      else if (numbers < 3) up(-1, 'Very few figures are quoted to support the description.');
      const comparisons = (lower.match(/\b(higher|lower|more|less|fewer|greater|than|compared|whereas|while|similar|the same|doubled|halved|twice)\b/g) ?? []).length;
      if (comparisons < 3) up(-0.5, 'Make more comparisons between the data.');
    }
    if (/\b(i think|i believe|in my opinion)\b/i.test(text)) up(-0.5, 'Task 1 should report the information, not give personal opinions.');
  }

  if (meta.kind === 'general-task1') {
    const bullets = meta.bullets ?? [];
    const hit = bullets.filter((alts) => alts.some((k) => lower.includes(k.toLowerCase())));
    if (bullets.length) {
      if (hit.length === bullets.length) up(1, 'All bullet points appear to be covered.');
      else up(-(bullets.length - hit.length), `Only ${hit.length} of ${bullets.length} bullet points seem to be covered. Every bullet point must be addressed.`);
    }
    const firstLine = (ps[0] ?? '').split('\n')[0];
    const opening = /^dear\s+\w+/i.test(firstLine) ? 'ok' : /^(hi|hello|hey)\b/i.test(firstLine) ? 'casual' : 'none';
    const close = /(yours faithfully|yours sincerely|kind regards|best regards|best wishes|all the best|love|take care|see you|cheers)/i.exec(text.slice(-220))?.[1]?.toLowerCase();
    if (opening === 'none') up(-0.5, 'Begin with an appropriate salutation (e.g. "Dear Sir or Madam," / "Dear Ms Patel," / "Dear Sam,").');
    if (!close) up(-0.5, 'End with an appropriate sign-off.');
    const purpose = /\b(i am writing|i'm writing|i’m writing|i wanted to|i want to let you know|just a quick|i've got some|i’ve got some)\b/i.exec(text.slice(0, 400));
    if (purpose) up(0.5, 'The purpose of the letter is clear from the start.');
    else up(-0.5, 'State the purpose of the letter in the opening lines.');
    if (meta.tone === 'formal') {
      if (opening === 'casual' || /\b(gonna|wanna|cheers|hey)\b/i.test(text)) up(-1.5, 'The tone is too informal for a formal letter.');
      else if (opening === 'ok' && close && /faithfully|sincerely|regards/.test(close)) up(0.5, 'Formal salutation and sign-off are used consistently.');
      if ((text.match(/\b\w+['’](m|re|s|ve|ll|d|t)\b/gi) ?? []).length > 3) up(-0.5, 'Frequent contractions make the letter less formal.');
    }
    if (meta.tone === 'informal' && /yours faithfully|yours sincerely/i.test(text)) up(-0.5, 'This sign-off is too formal for a letter to a friend.');
  }

  if (meta.kind === 'task2') {
    const pos = /\b(i (strongly )?(believe|think|feel|agree|disagree)|i largely agree|in my (opinion|view)|this essay (will|argues)|i would argue|from my perspective|personally)\b/i.exec(text);
    if (meta.essayType !== 'problem-solution') {
      if (pos) { ta.evidence.push(snippet(text, pos.index)); up(0.5, 'A clear position is stated.'); }
      else up(-1, 'No clear position. State your view and keep it consistent throughout.');
    }
    if (meta.essayType === 'problem-solution' && !/\b(solution|solve|tackle|address|measure|could|should)\b/i.test(text)) up(-1, 'Solutions are not clearly proposed.');
    if (meta.essayType === 'discussion' && !/(on the other hand|others (argue|believe|say)|some people|opponents|supporters)/i.test(text)) up(-0.5, 'A discussion essay must present both views.');
    if (meta.essayType === 'advantages' && !(/advantage|benefit/i.test(text) && /disadvantage|drawback|downside|problem/i.test(text))) up(-0.5, 'Discuss both advantages and disadvantages.');
    const examples = (lower.match(/\b(for example|for instance|such as|to illustrate|a case in point|as .{1,20} has done|when [A-Z]?\w+ introduced)\b/g) ?? []).length;
    if (examples) up(0.5, `${examples} supporting example(s) extend the ideas.`);
    else up(-0.5, 'Ideas need supporting examples to be fully extended.');
    if (/\b(in conclusion|to conclude|to sum up|in summary)\b/i.test(text)) up(0.5, 'The essay reaches a clear conclusion.');
    else up(-0.5, 'The essay has no clear conclusion.');
  }

  // ---- Coherence and Cohesion
  const cc: CriterionResult = { name: 'Coherence and Cohesion', band: 6, reasons: [], evidence: [] };
  const needParas = meta.kind === 'task2' ? 4 : 3;
  if (ps.length <= 1) { cc.band -= 2; cc.reasons.push('No paragraphing. Paragraphs are essential for Band 6+.'); }
  else if (ps.length < needParas) { cc.band -= 0.5; cc.reasons.push(`Only ${ps.length} paragraphs; ${needParas}+ would organise the ideas more clearly.`); }
  else { cc.band += 0.5; cc.reasons.push(`${ps.length} paragraphs give a logical structure.`); }
  const linkerTypes = Object.entries(LINKERS).filter(([, ls]) => ls.some((l) => linkers[l])).length;
  const linkerTotal = Object.values(linkers).reduce((a, b) => a + b, 0);
  if (linkerTypes >= 4) { cc.band += 1; cc.reasons.push(`A range of cohesive devices (${Object.keys(linkers).slice(0, 6).join(', ')}).`); }
  else if (linkerTypes >= 3) { cc.band += 0.5; cc.reasons.push(`Some range of linking devices (${Object.keys(linkers).join(', ')}).`); }
  else if (linkerTypes <= 1) { cc.band -= 1; cc.reasons.push('Very few linking words; ideas are not clearly connected.'); }
  if ((linkerTotal / wc) * 100 > 5) { cc.band -= 0.5; cc.reasons.push('Linking words are overused or mechanical. Use them only where they add meaning.'); }
  const startsWithLinker = ss.filter((s) => /^(firstly|secondly|thirdly|furthermore|moreover|in addition|additionally|however|also)\b/i.test(s)).length;
  if (ss.length > 4 && startsWithLinker / ss.length > 0.4) { cc.band -= 0.5; cc.reasons.push('Too many sentences begin with a connector.'); }
  const refs = (lower.match(/\b(this|these|such|which|its|their|those)\b/g) ?? []).length;
  if (refs / Math.max(1, ss.length) > 0.6) { cc.band += 0.5; cc.reasons.push('Referencing words (this, these, which, their) link ideas without repetition.'); }
  const paragraphNotes = ps.map((p, i) => {
    const n = countWords(p);
    const first = sentences(p)[0] ?? '';
    if (n < 25 && i > 0 && i < ps.length - 1) return `Paragraph ${i + 1} is short (${n} words). Develop the idea with an explanation or example.`;
    if (n > 170) return `Paragraph ${i + 1} is long (${n} words). Consider splitting it.`;
    return `Paragraph ${i + 1} (${n} words) opens with: "${first.slice(0, 90)}${first.length > 90 ? '…' : ''}"`;
  });

  // ---- Lexical Resource
  const lr: CriterionResult = { name: 'Lexical Resource', band: 6, reasons: [], evidence: [] };
  if (lex >= 0.8) { lr.band += 1.5; lr.reasons.push('Wide vocabulary range with little repetition.'); }
  else if (lex >= 0.74) { lr.band += 1; lr.reasons.push('Good vocabulary range.'); }
  else if (lex >= 0.68) { lr.band += 0.5; lr.reasons.push('Sufficient range of vocabulary for the task.'); }
  else if (lex >= 0.6) lr.reasons.push('Adequate but limited range; some words are repeated.');
  else if (lex >= 0.54) { lr.band -= 1; lr.reasons.push('Limited range; many words are repeated.'); }
  else { lr.band -= 2; lr.reasons.push('Very limited vocabulary with frequent repetition.'); }
  if (avgWordLen >= 6.2) lr.band += 0.5;
  else if (avgWordLen < 5 && meta.tone !== 'informal') { lr.band -= 0.5; lr.reasons.push('Mostly short, everyday words. Try more precise topic vocabulary.'); }
  if (repeated.length) lr.reasons.push(`Repeated words: ${repeated.map(([w, n]) => `${w} ×${n}`).join(', ')}.`);
  const informal = meta.tone === 'informal' ? [] : INFORMAL.filter((w) => new RegExp(`\\b${w}\\b`, 'i').test(text));
  if (informal.length > 3) { lr.band -= 0.5; lr.reasons.push(`Informal or vague words: ${informal.slice(0, 6).join(', ')}.`); }
  const wordErrors = issues.filter((i) => ['spelling', 'collocation', 'uncountable', 'expression'].includes(i.type));
  if (wordErrors.length > 2) { lr.band -= 1; lr.reasons.push(`${wordErrors.length} spelling, word-form or collocation errors.`); }
  else if (wordErrors.length) lr.reasons.push(`${wordErrors.length} word choice/spelling error(s).`);
  lr.evidence = wordErrors.slice(0, 4).map((i) => `"${i.match}" → "${i.suggestion}"`);
  // Sentences that do not make sense still score low even with rare words: if the text is
  // mostly unconnected noun phrases (few verbs), cap the lexical estimate.
  const verbs = (lower.match(/\b(is|are|was|were|be|been|has|have|had|do|does|did|can|could|will|would|should|may|might|must|\w+ed|\w+s)\b/g) ?? []).length;
  if (verbs / Math.max(1, ss.length) < 1) { lr.band = Math.min(lr.band, 5); lr.reasons.push('Words are not used in meaningful sentences, so range cannot be credited.'); }

  // ---- Grammatical Range and Accuracy
  const gra: CriterionResult = { name: 'Grammatical Range and Accuracy', band: 6, reasons: [], evidence: [] };
  if (complexRatio >= 0.55) { gra.band += 1; gra.reasons.push('Frequent complex sentences (subordinate, relative and participle clauses).'); }
  else if (complexRatio >= 0.3) { gra.band += 0.5; gra.reasons.push('A mix of simple and complex sentences.'); }
  else { gra.band -= 1; gra.reasons.push('Mostly simple sentences. Band 6+ needs a mix of complex structures.'); }
  if (passives + conditionals >= 2) { gra.band += 0.5; gra.reasons.push('Uses passive and/or conditional forms.'); }
  if (cv > 0.35 && ss.length > 4) gra.band += 0.25;
  if (avgSentence > 32) { gra.band -= 0.5; gra.reasons.push('Some very long sentences may be run-ons. Check punctuation.'); }
  if (errorsPer100 === 0) { gra.band += 0.5; gra.reasons.push('No common errors were detected (the checker cannot catch every error).'); }
  else if (errorsPer100 < 1) gra.reasons.push('A few errors, but they rarely reduce communication.');
  else if (errorsPer100 < 2.5) { gra.band -= 1; gra.reasons.push('Errors are noticeable.'); }
  else { gra.band -= 2; gra.reasons.push('Frequent errors that may cause difficulty for the reader.'); }
  gra.evidence = issues.filter((i) => ['agreement', 'article', 'verb form', 'comparative', 'preposition', 'punctuation', 'capitalisation'].includes(i.type)).slice(0, 5).map((i) => `"${i.match}" → "${i.suggestion}" (${i.message})`);

  // Under-length responses also limit the other criteria.
  const cap = wc < minWords * 0.5 ? 4.5 : wc < minWords * 0.8 ? 5.5 : 9;
  const criteria = [ta, cc, lr, gra].map((c) => ({ ...c, band: Math.min(cap, clamp(c.band)) }));
  return { wordCount: wc, minWords, paragraphs: ps.length, criteria, band: criteriaBand(criteria.map((c) => c.band)), issues, repeated, linkers, paragraphNotes, stats };
}

function snippet(text: string, index: number) {
  const s = Math.max(0, text.lastIndexOf('.', index) + 1);
  const e = text.indexOf('.', index);
  return text.slice(s, e === -1 ? undefined : e + 1).trim().slice(0, 160);
}
