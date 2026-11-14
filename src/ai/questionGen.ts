import type { Step } from '../lib/speakingMachine';
import type { History } from '../lib/questionHistory';
import { chatJson, isLlmReady } from './llm';
import { dedupeSemantic } from './embed';
import { words } from '../lib/text';

/**
 * Adds up to two freshly generated Part 3 questions on the cue-card theme when a local LLM is
 * loaded. Candidates are validated (single question, length) and semantically de-duplicated
 * against the learner's question history and the existing exam, so they never repeat.
 */
export async function freshPart3Questions(steps: Step[], history: History): Promise<Step[]> {
  if (!isLlmReady()) return steps;
  const cue = steps.find((s) => s.kind === 'cue');
  const p3 = steps.filter((s) => s.part === 3 && s.kind === 'question');
  if (!cue || !p3.length) return steps;
  const r = await chatJson<{ questions: string[] }>([
    { role: 'system', content: 'You write IELTS Speaking Part 3 questions: abstract, discussion-style, about society in general (not personal). Reply only with JSON {"questions":["...","...","..."]}.' },
    { role: 'user', content: `Part 2 topic: ${cue.text}\nExisting questions: ${p3.map((q) => q.text).join(' | ')}\nWrite 3 different new questions.` },
  ], 300);
  const valid = (r?.questions ?? []).filter((q) => typeof q === 'string' && q.trim().endsWith('?') && words(q).length >= 6 && words(q).length <= 25 && (q.match(/\?/g) ?? []).length === 1);
  const fresh = (await dedupeSemantic(valid, [...Object.keys(history), ...steps.map((s) => s.text)])).slice(0, 2);
  if (!fresh.length) return steps;
  const last = steps.map((s) => s.part === 3 && s.kind === 'question').lastIndexOf(true);
  const added = fresh.map((q, i) => ({ id: `ai${i}`, part: 3 as const, kind: 'question' as const, text: q.trim() }));
  return [...steps.slice(0, last + 1), ...added, ...steps.slice(last + 1)];
}
