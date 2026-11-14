/**
 * What did the candidate just say? Distinguishes a real answer from a request to repeat,
 * a request to explain, a question back to the examiner, a "thinking" filler or silence.
 * Fast rules first; an optional sentence-embedding model (ai/embed.ts) refines short,
 * ambiguous utterances.
 */
import { words } from './text';

export type Intent = 'answer' | 'repeat' | 'clarify' | 'ask-examiner' | 'thinking' | 'silence';

const REPEAT = /\b(could|can|would) you (please )?(repeat|say (it|that) again)|\b(say (it|that) again|one more time|repeat (the|that|your) question|didn'?t (catch|hear|get) (that|it|the question)|come again)\b|^(sorry|pardon|excuse me|what)\??[.!]?$|^(sorry|pardon)[,.]? (what|i didn'?t)/i;
const CLARIFY = /\bwhat (does|do|did) (the word |the phrase )?["'“]?[\w -]{1,25}["'”]? mean\b|\bwhat do you mean( by)?\b|\bmeaning of\b|\bi don'?t (understand|get) (the|your|that) (question|word)\b|\b(can|could) you (explain|rephrase|clarify)\b|\bwhat is (a|an|the) [\w -]{1,20}\?$/i;
const ASK_BACK = /^(and )?(what about you|how about you|and you|what do you think|do you (like|think|agree|have)|have you (ever)?|what'?s your (opinion|view|favourite)|which do you prefer|where are you from)\b.*\??$/i;
const THINKING = /^(um+|uh+|er+m*|hmm+|well|so|let me (think|see)|that'?s a (good|difficult|tough|interesting) question|good question|i need to think|give me a (second|moment))[\s,.!…]*((let me (think|see))|(about (it|that)))?[\s,.!…]*$/i;

export function classifyIntent(text: string): Intent {
  const t = text.trim().replace(/\s+/g, ' ');
  const n = words(t).length;
  if (n === 0) return 'silence';
  if (n <= 14 && REPEAT.test(t)) return 'repeat';
  if (n <= 18 && CLARIFY.test(t)) return 'clarify';
  if (n <= 10 && ASK_BACK.test(t)) return 'ask-examiner';
  if (n <= 10 && THINKING.test(t)) return 'thinking';
  return 'answer';
}

/** Word the candidate asked about in "what does X mean?" (for the Part 3 rephrase). */
export function clarifiedWord(text: string) {
  return /what (?:does|do|did) (?:the word |the phrase )?["'“]?([\w -]{1,25}?)["'”]? mean/i.exec(text)?.[1]?.trim();
}

/** Prototype sentences for the embedding-based refinement. */
export const INTENT_PROTOTYPES: Record<Exclude<Intent, 'answer' | 'silence'>, string[]> = {
  repeat: ['Sorry, could you repeat the question?', 'Pardon?', 'I did not hear you, say it again please', 'Can you say that one more time?'],
  clarify: ['What does that word mean?', 'I do not understand the question', 'Could you explain what you mean?', 'Can you rephrase the question?'],
  'ask-examiner': ['What about you?', 'What do you think?', 'Do you like it too?', 'And what is your opinion?'],
  thinking: ['Hmm, let me think about that', 'That is a difficult question', 'Give me a moment to think', 'Well, let me see'],
};

/** Is the answer about the question at all? Cosine similarity of sentence embeddings. */
export function relevanceLabel(sim: number): 'on-topic' | 'loosely related' | 'off-topic' {
  return sim >= 0.35 ? 'on-topic' : sim >= 0.18 ? 'loosely related' : 'off-topic';
}

export const cosine = (a: ArrayLike<number>, b: ArrayLike<number>) => {
  let d = 0, na = 0, nb = 0;
  for (let i = 0; i < a.length; i++) { d += a[i] * b[i]; na += a[i] * a[i]; nb += b[i] * b[i]; }
  return na && nb ? d / Math.sqrt(na * nb) : 0;
};

const DANGLING = new Set(['and', 'but', 'because', 'so', 'or', 'the', 'a', 'an', 'to', 'of', 'with', 'which', 'that', 'if', 'when', 'um', 'uh', 'er', 'erm', 'like', 'my', 'is', 'was', 'very', 'really', 'for', 'in', 'on', 'at', 'about', 'also', 'although', 'while', 'then', 'such', 'as', 'than', 'their', 'our', 'your', 'i', 'we', 'it', 'its']);

/**
 * Does the utterance sound finished? Used for early end-of-turn: if the candidate paused after a
 * complete sentence we can reply quickly; if they stopped on "and…" or "because…" we wait.
 */
export function isCompleteUtterance(text: string): boolean {
  const t = text.trim();
  const ws = words(t);
  if (!ws.length) return false;
  const intent = classifyIntent(t);
  if (intent === 'repeat' || intent === 'clarify' || intent === 'ask-examiner') return true;
  if (intent === 'thinking') return false;
  if (/(,|\.\.\.|…|-)$/.test(t)) return false;
  if (DANGLING.has(ws[ws.length - 1])) return false;
  return ws.length >= 2 || /^(yes|no|yeah|nope|sure|definitely|absolutely|maybe)\b/i.test(t);
}
