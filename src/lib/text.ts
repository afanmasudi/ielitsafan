/** Small, dependency-free text utilities shared by the writing and speaking analysers. */

export const words = (t: string) => t.toLowerCase().match(/[a-z]+(?:['’-][a-z]+)*/g) ?? [];

export const sentences = (t: string) =>
  t.replace(/\s+/g, ' ').split(/(?<=[.!?])\s+(?=[A-Z0-9"“(])/).map((s) => s.trim()).filter((s) => words(s).length > 0);

export const paragraphs = (t: string) => t.split(/\n\s*\n|\r\n\s*\r\n/).map((p) => p.trim()).filter(Boolean);

export const countWords = (t: string) => (t.trim().match(/\S+/g) ?? []).length;

const STOP = new Set('a an the and or but if of to in on at by for with from as is are was were be been being it its this that these those there their they them he she his her we our you your i me my not no do does did have has had will would can could should may might must so than then very also just which who whom what when where why how all any some such into about over more most other only own same too s t'.split(' '));
export const isStop = (w: string) => STOP.has(w);

/** Moving-average type-token ratio — length-robust lexical diversity (Covington & McFall 2010). */
export function mattr(ws: string[], window = 50): number {
  if (ws.length === 0) return 0;
  if (ws.length <= window) return new Set(ws).size / ws.length;
  let total = 0;
  const counts = new Map<string, number>();
  for (let i = 0; i < window; i++) counts.set(ws[i], (counts.get(ws[i]) ?? 0) + 1);
  total += counts.size / window;
  for (let i = window; i < ws.length; i++) {
    const out = ws[i - window];
    const c = counts.get(out)! - 1;
    if (c === 0) counts.delete(out); else counts.set(out, c);
    counts.set(ws[i], (counts.get(ws[i]) ?? 0) + 1);
    total += counts.size / window;
  }
  return total / (ws.length - window + 1);
}

export const LINKERS = {
  addition: ['furthermore', 'moreover', 'in addition', 'additionally', 'also', 'besides', 'what is more'],
  contrast: ['however', 'nevertheless', 'on the other hand', 'whereas', 'while', 'although', 'despite', 'in contrast', 'yet', 'even though', 'nonetheless'],
  cause: ['because', 'since', 'as a result', 'therefore', 'consequently', 'thus', 'due to', 'owing to', 'hence', 'this means'],
  example: ['for example', 'for instance', 'such as', 'in particular', 'namely', 'to illustrate'],
  sequence: ['firstly', 'secondly', 'finally', 'first of all', 'then', 'next', 'subsequently', 'lastly'],
  conclusion: ['in conclusion', 'to conclude', 'to sum up', 'overall', 'in summary', 'all things considered'],
  opinion: ['in my opinion', 'i believe', 'i think', 'in my view', 'from my perspective', 'i would argue', 'personally'],
};

export function findLinkers(text: string) {
  const lower = ' ' + text.toLowerCase().replace(/[^a-z\s']/g, ' ').replace(/\s+/g, ' ') + ' ';
  const found: Record<string, number> = {};
  for (const group of Object.values(LINKERS))
    for (const l of group) {
      const n = lower.split(' ' + l + ' ').length - 1;
      if (n) found[l] = n;
    }
  return found;
}

export const SUBORDINATORS = /\b(because|although|though|while|whereas|if|unless|when|whenever|since|which|who|whom|whose|that|where|so that|in order to|even though|provided that)\b/gi;
export const PASSIVE = /\b(is|are|was|were|be|been|being|has been|have been)\s+(\w+ed|built|made|done|given|taken|seen|known|shown|grown|written|sold|paid|kept|held|spent|brought|found)\b/gi;
export const CONDITIONAL = /\b(if|unless|provided that|as long as)\b[^.]*\b(will|would|could|might|can)\b/gi;

export interface Issue { type: string; message: string; match: string; suggestion?: string; index: number }

/** Common learner errors. Patterns are conservative to keep false positives low. */
const RULES: { re: RegExp; type: string; message: string; fix?: (m: RegExpExecArray) => string }[] = [
  { re: /\ba ([aeiou]\w+)/gi, type: 'article', message: 'Use "an" before a vowel sound.', fix: (m) => `an ${m[1]}` },
  { re: /\ban ([bcdfgjklmnpqrstvwxyz]\w+)/gi, type: 'article', message: 'Use "a" before a consonant sound.', fix: (m) => `a ${m[1]}` },
  { re: /\b(informations|advices|furnitures|equipments|knowledges|researches|homeworks|evidences|feedbacks)\b/gi, type: 'uncountable', message: 'This noun is uncountable in standard English.', fix: (m) => m[1].replace(/s$/i, '') },
  { re: /\bpeople (is|was|has)\b/gi, type: 'agreement', message: '"People" is plural.', fix: (m) => `people ${({ is: 'are', was: 'were', has: 'have' } as Record<string, string>)[m[1].toLowerCase()]}` },
  { re: /\b(he|she|it) (have|do|go|make|want|need|think)\b/gi, type: 'agreement', message: 'Third-person singular needs an -s verb form.', fix: (m) => `${m[1]} ${m[2] === 'have' ? 'has' : m[2] === 'do' ? 'does' : m[2] === 'go' ? 'goes' : m[2] + 's'}` },
  { re: /\b(they|we|you|i) (has|does|goes|makes|wants|needs)\b/gi, type: 'agreement', message: 'Verb does not agree with the subject.', fix: (m) => `${m[1]} ${m[2] === 'has' ? 'have' : m[2] === 'does' ? 'do' : m[2] === 'goes' ? 'go' : m[2].replace(/s$/, '')}` },
  { re: /\b(more|most) (better|worse|easier|bigger|smaller|faster|cheaper|best|worst)\b/gi, type: 'comparative', message: 'Double comparative.', fix: (m) => m[2] },
  { re: /\bdiscuss about\b/gi, type: 'preposition', message: '"Discuss" takes a direct object.', fix: () => 'discuss' },
  { re: /\bin nowadays\b/gi, type: 'expression', message: 'Say "nowadays" or "these days".', fix: () => 'nowadays' },
  { re: /\baccording to me\b/gi, type: 'expression', message: 'Use "in my opinion" or "I believe".', fix: () => 'in my opinion' },
  { re: /\b(?:could|should|would|must) of\b/gi, type: 'verb form', message: 'Use "have", not "of".', fix: (m) => m[0].replace(/of$/i, 'have') },
  { re: /\bcan not\b/gi, type: 'spelling', message: 'Write "cannot" as one word.', fix: () => 'cannot' },
  { re: /\bdepend of\b/gi, type: 'preposition', message: 'Use "depend on".', fix: () => 'depend on' },
  { re: /\b(married|interested) (with|on)\b/gi, type: 'preposition', message: 'Check the preposition.', fix: (m) => `${m[1]} ${m[1].toLowerCase() === 'married' ? 'to' : 'in'}` },
  { re: /\bthe (society|nature) (is|has|should)\b/gi, type: 'article', message: 'General abstract nouns usually take no article.', fix: (m) => `${m[1]} ${m[2]}` },
  { re: /\b(\w+) \1\b/gi, type: 'repetition', message: 'Repeated word.', fix: (m) => m[1] },
  { re: /(^|[.!?]\s+)([a-z])/g, type: 'capitalisation', message: 'Start sentences with a capital letter.', fix: (m) => m[1] + m[2].toUpperCase() },
  { re: /\bi\b(?!['’.-])/g, type: 'capitalisation', message: 'The pronoun "I" is always capitalised.', fix: () => 'I' },
  { re: /\b(alot|untill|becuase|recieve|beleive|goverment|enviroment|wich|thier|definately|occured|seperate|tommorow|responsability|neccessary|accomodation|begining|developement|occassion)\b/gi, type: 'spelling', message: 'Spelling.', fix: (m) => ({ alot: 'a lot', untill: 'until', becuase: 'because', recieve: 'receive', beleive: 'believe', goverment: 'government', enviroment: 'environment', wich: 'which', thier: 'their', definately: 'definitely', occured: 'occurred', seperate: 'separate', tommorow: 'tomorrow', responsability: 'responsibility', neccessary: 'necessary', accomodation: 'accommodation', begining: 'beginning', developement: 'development', occassion: 'occasion' } as Record<string, string>)[m[1].toLowerCase()] },
  { re: /\s+([,.;:!?])/g, type: 'punctuation', message: 'No space before punctuation.', fix: (m) => m[1] },
  { re: /\b(make|do) (a )?(mistake|homework|research|decision|effort|progress)\b/gi, type: 'collocation', message: 'Check the verb collocation (make a decision / make progress / do research / do homework / make an effort / make a mistake).', fix: (m) => { const n = m[3].toLowerCase(); const v = ['homework', 'research'].includes(n) ? 'do' : 'make'; const art = ['mistake', 'decision', 'effort'].includes(n) ? (n === 'effort' ? 'an ' : 'a ') : ''; return `${v} ${art}${n}`; } },
];

export function findIssues(text: string): Issue[] {
  const out: Issue[] = [];
  for (const r of RULES) {
    r.re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = r.re.exec(text))) {
      const suggestion = r.fix?.(m);
      // Skip no-op suggestions (e.g. collocation already correct, "an hour").
      if (suggestion !== undefined && suggestion.toLowerCase() === m[0].toLowerCase() && r.type !== 'capitalisation') continue;
      if (suggestion === m[0]) continue;
      if (r.type === 'article' && /^an? (h|u|one|eu)/i.test(m[0])) continue; // an hour, a university, a one-off
      if (r.type === 'repetition' && /^(that|had|very) /i.test(m[0])) continue;
      out.push({ type: r.type, message: r.message, match: m[0], suggestion, index: m.index });
      if (m[0].length === 0) r.re.lastIndex++;
    }
  }
  return out.sort((a, b) => a.index - b.index);
}

export function applyFixes(text: string, issues: Issue[]): string {
  let res = '';
  let pos = 0;
  for (const i of [...issues].sort((a, b) => a.index - b.index)) {
    if (i.index < pos || i.suggestion === undefined) continue;
    const fix = /^[A-Z]/.test(i.match) && i.suggestion ? i.suggestion[0].toUpperCase() + i.suggestion.slice(1) : i.suggestion;
    res += text.slice(pos, i.index) + fix;
    pos = i.index + i.match.length;
  }
  return res + text.slice(pos);
}

export function topRepeated(ws: string[], min = 4, limit = 6) {
  const c = new Map<string, number>();
  for (const w of ws) if (!isStop(w) && w.length > 3) c.set(w, (c.get(w) ?? 0) + 1);
  return [...c.entries()].filter(([, n]) => n >= min).sort((a, b) => b[1] - a[1]).slice(0, limit);
}

export const INFORMAL = ['gonna', 'wanna', 'kids', 'stuff', 'things', 'lots of', 'a lot of', 'really', 'pretty', 'ok', 'okay', 'get', 'got', 'nice', 'bad', 'good', 'big'];

/** Coefficient of variation of sentence lengths — a rough signal for structural variety. */
export function sentenceVariety(ss: string[]) {
  const lens = ss.map((s) => words(s).length);
  if (lens.length < 2) return { mean: lens[0] ?? 0, cv: 0 };
  const mean = lens.reduce((a, b) => a + b, 0) / lens.length;
  const sd = Math.sqrt(lens.reduce((a, b) => a + (b - mean) ** 2, 0) / lens.length);
  return { mean, cv: sd / mean };
}
