import type { AudioStats, Turn } from './speakingAnalysis';

export type StepKind = 'say' | 'question' | 'cue' | 'prep' | 'talk';
export interface Step { id: string; part: 0 | 1 | 2 | 3; kind: StepKind; text: string; seconds?: number; bullets?: string[]; followUp?: boolean }

export interface ExamState {
  steps: Step[];
  index: number;
  turns: Turn[];
  status: 'ready' | 'running' | 'finished';
  followUpsAdded: number;
}

export type ExamAction =
  | { type: 'start' }
  | { type: 'advance' } // finish a 'say', 'cue' or 'prep' step
  | { type: 'answer'; text: string; audio?: AudioStats; typed?: boolean }
  | { type: 'followUp'; text: string }
  | { type: 'skip' } // the candidate already covered this question
  | { type: 'reset'; steps: Step[] };

export const MAX_FOLLOWUPS_PER_PART = 2;

export const initExam = (steps: Step[]): ExamState => ({ steps, index: 0, turns: [], status: 'ready', followUpsAdded: 0 });

export const current = (s: ExamState): Step | undefined => (s.status === 'running' ? s.steps[s.index] : undefined);

const norm = (t: string) => t.toLowerCase().replace(/[^a-z ]/g, '').trim();

function next(s: ExamState): ExamState {
  const index = s.index + 1;
  return index >= s.steps.length ? { ...s, index, status: 'finished' } : { ...s, index };
}

/**
 * Pure reducer for the three-part examiner. It only moves forward one step at a time,
 * so a part can never be skipped and a question is never asked twice.
 */
export function examReducer(s: ExamState, a: ExamAction): ExamState {
  if (a.type === 'reset') return initExam(a.steps);
  if (a.type === 'start') return s.status === 'ready' ? { ...s, status: 'running' } : s;
  if (s.status !== 'running') return s;
  const step = s.steps[s.index];
  switch (a.type) {
    case 'advance':
      return step.kind === 'say' || step.kind === 'cue' || step.kind === 'prep' ? next(s) : s;
    case 'answer': {
      if (step.kind !== 'question' && step.kind !== 'talk') return s;
      const turn: Turn = { part: step.part === 0 ? 1 : step.part, question: step.kind === 'talk' ? s.steps.find((x) => x.kind === 'cue')?.text ?? step.text : step.text, answer: a.text.trim(), audio: a.audio, typed: a.typed };
      return next({ ...s, turns: [...s.turns, turn] });
    }
    case 'skip':
      return step.kind === 'question' && step.part !== 0 ? next(s) : s;
    case 'followUp': {
      // Follow-ups are inserted right after the current position, within the same part only.
      const prev = s.steps[s.index - 1];
      if (!prev || (prev.kind !== 'question' && prev.kind !== 'talk') || prev.part === 0) return s;
      const part = prev.part;
      const usedInPart = s.steps.filter((x) => x.followUp && x.part === part).length;
      if (usedInPart >= MAX_FOLLOWUPS_PER_PART) return s;
      if (s.steps.some((x) => norm(x.text) === norm(a.text))) return s;
      if (step && step.part !== part && step.kind !== 'say') return s; // never spill into the next part
      const fu: Step = { id: `fu-${s.followUpsAdded}`, part, kind: 'question', text: a.text, followUp: true };
      const steps = [...s.steps.slice(0, s.index), fu, ...s.steps.slice(s.index)];
      return { ...s, steps, followUpsAdded: s.followUpsAdded + 1 };
    }
  }
  return s;
}

export function partProgress(s: ExamState) {
  const step = s.steps[Math.min(s.index, s.steps.length - 1)];
  const part = s.status === 'finished' ? 3 : step?.part ?? 0;
  const inPart = s.steps.filter((x) => x.part === part && (x.kind === 'question' || x.kind === 'talk'));
  const done = s.turns.filter((t) => t.part === part).length;
  return { part, done, total: inPart.length, overall: s.steps.length ? Math.min(1, s.index / s.steps.length) : 0 };
}
