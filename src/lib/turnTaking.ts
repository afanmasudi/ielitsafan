/**
 * Turn-taking policy for the live examiner. Times follow what IELTS examiners do in practice:
 * Part 1 answers are short and may be cut off, Part 2 runs up to two minutes, Part 3 is longer
 * discussion. Pure functions so the behaviour is unit-tested.
 */
export type TurnContext = 'part1' | 'part2' | 'part3' | 'interview' | 'lifeskills';

export interface TurnPolicy {
  /** Silence after speech that ends the candidate's turn. */
  endSilenceMs: number;
  /** Speaking time after which the examiner politely interrupts. */
  maxSpeechMs: number;
  /** Silence after the question before the examiner encourages the candidate. */
  nudgeAfterMs: number;
  /** Silence after the nudge before the examiner moves on. */
  giveUpAfterMs: number;
  /** Shorter speech than this (e.g. "um") does not end a turn on its own. */
  minSpeechMs: number;
}

export const POLICIES: Record<TurnContext, TurnPolicy> = {
  part1: { endSilenceMs: 1500, maxSpeechMs: 45_000, nudgeAfterMs: 7_000, giveUpAfterMs: 15_000, minSpeechMs: 600 },
  part2: { endSilenceMs: 7_000, maxSpeechMs: 120_000, nudgeAfterMs: 10_000, giveUpAfterMs: 25_000, minSpeechMs: 1500 },
  part3: { endSilenceMs: 2_200, maxSpeechMs: 80_000, nudgeAfterMs: 8_000, giveUpAfterMs: 18_000, minSpeechMs: 800 },
  interview: { endSilenceMs: 2_400, maxSpeechMs: 120_000, nudgeAfterMs: 9_000, giveUpAfterMs: 20_000, minSpeechMs: 800 },
  lifeskills: { endSilenceMs: 2_000, maxSpeechMs: 60_000, nudgeAfterMs: 8_000, giveUpAfterMs: 18_000, minSpeechMs: 600 },
};

export interface TurnState {
  /** ms since the examiner finished asking. */
  sinceAsked: number;
  /** Is the candidate speaking right now (VAD)? */
  speaking: boolean;
  /** Total ms of detected speech in this turn. */
  speechMs: number;
  /** ms of silence since the candidate last spoke (0 while speaking). */
  silenceMs: number;
  /** Has the examiner already nudged in this turn? */
  nudged: boolean;
  /** "Thinking aloud" fillers only so far (e.g. "hmm, let me think"). */
  thinking?: boolean;
}

export type TurnDecision = 'wait' | 'end-turn' | 'interrupt' | 'nudge' | 'give-up';

export function decideTurn(s: TurnState, p: TurnPolicy): TurnDecision {
  const hasSpoken = s.speechMs >= p.minSpeechMs;
  if (s.speaking) return s.speechMs >= p.maxSpeechMs ? 'interrupt' : 'wait';
  if (hasSpoken) {
    // A thinking filler earns extra time before we decide the answer is finished.
    const need = s.thinking ? p.endSilenceMs * 2.5 : p.endSilenceMs;
    if (s.speechMs >= p.maxSpeechMs) return 'interrupt';
    return s.silenceMs >= need ? 'end-turn' : 'wait';
  }
  if (!s.nudged) return s.sinceAsked >= p.nudgeAfterMs ? 'nudge' : 'wait';
  return s.sinceAsked >= p.nudgeAfterMs + p.giveUpAfterMs ? 'give-up' : 'wait';
}

const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];

/** What the examiner says in each situation (neutral, as IELTS examiners are trained to be). */
export const LINES = {
  ack: ['Thank you.', 'Okay.', 'Right.', 'Thank you.', 'Alright.'],
  ackInterview: ['I see.', 'That’s interesting.', 'Okay, thank you.', 'Right.', 'Great, thanks.'],
  nudge: ['Take your time.', 'Would you like me to repeat the question?', 'Is there anything you can tell me about that?'],
  nudgePart2: ['Can you tell me any more about it?', 'Please continue if you can.'],
  interrupt: ['Thank you. Let’s move on.', 'Okay, thank you, that’s fine.', 'Thank you. I’d like to ask you something else.'],
  interruptPart2: ['Thank you. Can I stop you there?'],
  giveUp: ['That’s fine. Let’s move on.', 'Okay, let’s try another question.'],
  repeat: ['Of course.', 'Sure, I’ll repeat that.', 'Certainly.'],
  noExplainPart1: ['I’m afraid I can’t explain that, but please answer as well as you can.'],
  rephrase: ['Let me put it another way.'],
  ownOpinion: ['I’m afraid I can’t give my own opinion in the test. What do you think?', 'That’s a good question, but I’m here to listen to you. What’s your view?'],
  interviewerOpinion: ['Good question. We can talk about that at the end. For now, I’d like to hear your view.'],
  thinkingOk: ['Sure, take a moment.'],
};
export const say = (k: keyof typeof LINES) => pick(LINES[k]);
