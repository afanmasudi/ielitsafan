import { LiveMic } from '../../lib/vad';
import { examReducer, initExam, current, type ExamState, type Step } from '../../lib/speakingMachine';
import { decideTurn, POLICIES, say, type TurnContext } from '../../lib/turnTaking';
import { audioStats, type AudioStats, type Turn } from '../../lib/speakingAnalysis';
import { clarifiedWord, isCompleteUtterance, type Intent } from '../../lib/intent';
import { words } from '../../lib/text';
import { prefetch, speak, speechLevel, stopSpeaking, warmPhrases, type VoiceKey } from '../../ai/tts';
import { transcribe } from '../../ai/stt';
import { classifyIntentML, relevance } from '../../ai/embed';
import { chat, isLlmReady } from '../../ai/llm';

export type Phase = 'connecting' | 'examiner' | 'listening' | 'thinking' | 'prep' | 'ended';

export interface LiveEvent { at: number; kind: 'covered' | 'barge-in' | 'nudge' | 'interrupt' | 'repeat' | 'clarify' | 'ask-examiner' | 'thinking' | 'silence' | 'follow-up' | 'off-topic' | 'give-up'; detail?: string }

export interface LiveTurn extends Turn { latencyMs?: number; relevance?: number | null; intentVia?: string }

export interface LiveView { phase: Phase; caption: string; who: 'examiner' | 'you' | ''; part: number; progress: number; prepLeft?: number; cue?: Step; talkLeft?: number }

export interface LiveCallbacks {
  onView: (v: Partial<LiveView>) => void;
  onTurn: (t: LiveTurn) => void;
  onEvent: (e: LiveEvent) => void;
  onEnd: (r: { turns: LiveTurn[]; events: LiveEvent[] }) => void;
  /** True when the webcam sees the candidate's face but their mouth is not moving (likely background noise). */
  mouthStill?: () => boolean;
}

export interface LiveOptions { voice: VoiceKey; context: 'exam' | 'interview'; bargeIn: boolean; followUps: boolean; cvSummary?: string }

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
// Whisper sometimes "hears" these in silence or noise.
const HALLUCINATION = /^(\s*(thank you\.?|thanks for watching\.?|you|bye\.?|\[.*?\]|\(.*?\))\s*)+$/i;

export class LiveEngine {
  mic = new LiveMic();
  private s: ExamState;
  private stopped = false;
  private turns: LiveTurn[] = [];
  private events: LiveEvent[] = [];
  private typed: string | null = null;
  private skipPrep = false;
  private warmed = false;
  constructor(steps: Step[], private opts: LiveOptions, private cb: LiveCallbacks) { this.s = examReducer(initExam(steps), { type: 'start' }); }

  async start(stream?: MediaStream) {
    await this.mic.open(stream);
    this.mic.examinerLevel = speechLevel;
    await this.loop();
  }

  /** Submit a typed answer instead of speaking (works at any point while listening). */
  type(text: string) { this.typed = text; }
  readyToSpeak() { this.skipPrep = true; }
  mute(m: boolean) { this.mic.muted = m; }

  stop() {
    this.stopped = true;
    stopSpeaking();
    this.mic.close();
  }

  private log(kind: LiveEvent['kind'], detail?: string) { const e = { at: Date.now(), kind, detail }; this.events.push(e); this.cb.onEvent(e); }
  private dispatch(a: Parameters<typeof examReducer>[1]) { this.s = examReducer(this.s, a); this.cb.onView({ progress: this.s.steps.length ? this.s.index / this.s.steps.length : 0 }); }

  private ctxFor(step: Step): TurnContext {
    if (this.opts.context === 'interview') return 'interview';
    return step.kind === 'talk' ? 'part2' : step.part === 3 ? 'part3' : 'part1';
  }

  /** Examiner speaks. Returns 'barged' if the candidate clearly starts talking over a question. */
  private async examinerSays(text: string, allowBarge = false): Promise<'done' | 'barged'> {
    if (this.stopped) return 'done';
    this.trace(`say: ${text.slice(0, 40)}`);
    this.cb.onView({ phase: 'examiner', caption: text, who: 'examiner' });
    this.mic.setExaminerTalking(true);
    let barged = false;
    const off = allowBarge && this.opts.bargeIn ? this.mic.on((e) => {
      if (e.type === 'barge' && !barged && !this.cb.mouthStill?.()) { barged = true; this.mic.startTurn(); stopSpeaking(); }
    }) : () => undefined;
    await speak(text, this.opts.voice);
    off();
    this.mic.setExaminerTalking(false, barged);
    if (barged) { this.log('barge-in', text.slice(0, 60)); return 'barged'; }
    return 'done';
  }

  /** Development timing trace (window.__liveTrace). */
  private trace(label: string) {
    if (!import.meta.env.DEV) return;
    const w = window as unknown as { __liveTrace?: string[] };
    (w.__liveTrace ??= []).push(`${Math.round(performance.now())} ${label}`);
  }

  private async loop() {
    while (!this.stopped && this.s.status === 'running') {
      const step = current(this.s)!;
      this.cb.onView({ part: step.part || 1 });
      if (step.kind === 'say') { await this.examinerSays(step.text); await sleep(350); this.dispatch({ type: 'advance' }); continue; }
      if (step.kind === 'cue') {
        this.cb.onView({ cue: step });
        await this.examinerSays(`Here is your topic. ${step.text}`);
        this.dispatch({ type: 'advance' });
        continue;
      }
      if (step.kind === 'prep') { await this.prep(step.seconds ?? 60); this.dispatch({ type: 'advance' }); continue; }
      await this.askAndListen(step);
    }
    if (!this.stopped) {
      this.cb.onView({ phase: 'ended', caption: '', who: '' });
      this.cb.onEnd({ turns: this.turns, events: this.events });
    }
  }

  private async prep(seconds: number) {
    this.skipPrep = false;
    this.cb.onView({ phase: 'prep', caption: 'Preparation time. Make notes if you like.', who: '' });
    for (let left = seconds; left > 0 && !this.skipPrep && !this.stopped; left--) { this.cb.onView({ prepLeft: left }); await sleep(1000); }
    this.cb.onView({ prepLeft: 0 });
    await this.examinerSays('Alright. Remember, you have one to two minutes for this, so don’t worry if I stop you. I’ll tell you when the time is up.');
  }

  private async askAndListen(step: Step) {
    if (await this.alreadyCovered(step)) return;
    let repeats = 0, deflects = 0, nudged = false;
    let prompt = step.text;
    for (let attempt = 0; attempt < 5 && !this.stopped; attempt++) {
      const barged = (await this.examinerSays(prompt, step.kind === 'question')) === 'barged';
      const r = await this.listen(step, barged, nudged);
      if (this.stopped) return;
      if (r.kind === 'unclear') {
        // We heard a voice but could not make out words: ask again naturally, not the whole question.
        repeats++;
        prompt = repeats > 2 ? `${say('giveUp')}` : 'Sorry, I didn’t quite catch that. Could you say it again?';
        if (repeats > 2) { await this.examinerSays(prompt); this.dispatch({ type: 'answer', text: '', typed: false }); return; }
        continue;
      }
      if (r.kind === 'none') {
        if (!nudged && step.kind !== 'talk') { nudged = true; this.log('nudge'); prompt = `${say('nudge')} ${step.text}`; continue; }
        this.log('give-up');
        await this.examinerSays(say('giveUp'));
        this.dispatch({ type: 'answer', text: '', typed: false });
        return;
      }
      const { intent, via } = r.typedText ? { intent: 'answer' as Intent, via: 'typed' } : await classifyIntentML(r.text);
      if (intent === 'repeat' && repeats < 2) { repeats++; this.log('repeat'); prompt = `${say('repeat')} ${step.text}`; continue; }
      if (intent === 'clarify') {
        this.log('clarify', clarifiedWord(r.text));
        if (step.part === 1 && this.opts.context === 'exam') { prompt = `${say('noExplainPart1')} ${step.text}`; continue; }
        prompt = `${say('rephrase')} ${await this.rephrase(step.text, clarifiedWord(r.text))}`;
        continue;
      }
      if (intent === 'ask-examiner' && deflects < 2) { deflects++; this.log('ask-examiner'); prompt = say(this.opts.context === 'interview' ? 'interviewerOpinion' : 'ownOpinion'); continue; }
      if (intent === 'thinking') { this.log('thinking'); prompt = say('thinkingOk'); continue; }
      // A real answer. Relevance is computed in the background so it never delays the reply.
      const turn: LiveTurn = { part: step.part === 0 ? 1 : step.part, question: step.kind === 'talk' ? this.s.steps.find((x) => x.kind === 'cue')?.text ?? step.text : step.text, answer: r.text, audio: r.audio, typed: !!r.typedText, latencyMs: r.latencyMs, relevance: null, intentVia: via };
      void relevance(step.text, r.text).then((rel) => {
        turn.relevance = rel;
        if (rel !== null && rel < 0.15 && words(r.text).length > 6) this.log('off-topic', r.text.slice(0, 60));
      }).catch(() => undefined);
      this.turns.push(turn);
      this.cb.onTurn(turn);
      this.dispatch({ type: 'answer', text: r.text, audio: r.audio, typed: !!r.typedText });
      if (r.interrupted) await this.examinerSays(step.kind === 'talk' ? say('interruptPart2') : say('interrupt'));
      else await this.acknowledge(step, r.text, r.acked);
      return;
    }
    this.dispatch({ type: 'answer', text: '', typed: false });
  }

  /** Voice the next scripted line in the background while the candidate is answering. */
  private prefetchNext() {
    const next = this.s.steps.slice(this.s.index + 1).find((x) => x.kind === 'question' || x.kind === 'say' || x.kind === 'cue');
    if (next) prefetch(next.kind === 'cue' ? `Here is your topic. ${next.text}` : next.text, this.opts.voice);
  }

  /** If an earlier answer already covered this question, acknowledge it and move on instead of asking again. */
  private async alreadyCovered(step: Step): Promise<boolean> {
    if (step.kind !== 'question' || step.followUp || !this.turns.length) return false;
    const prev = this.turns.slice(-4).map((t) => t.answer).filter((a) => words(a).length >= 4);
    if (!prev.length) return false;
    let covered = /work or are you a student|do you work or study/i.test(step.text) && prev.some((a) => /\b(i am|i'm|i work|i study)\b.*\b(student|study|studying|work|job|engineer|teacher|developer|manager|university|college)\b/i.test(a));
    if (!covered) {
      const sims = await Promise.all(prev.map((a) => relevance(step.text, a).catch(() => null)));
      covered = sims.some((x) => x !== null && x >= (this.opts.context === 'interview' ? 0.55 : 0.62));
    }
    if (!covered) return false;
    this.log('covered', step.text);
    await this.examinerSays(this.opts.context === 'interview' ? 'You’ve already told me about that, thank you.' : 'You’ve already mentioned that, so let’s move on.');
    this.dispatch({ type: 'skip' });
    return true;
  }

  /** Short, natural acknowledgement, plus an optional follow-up question within the same part. */
  private async acknowledge(step: Step, answer: string, acked = false) {
    if (step.kind === 'talk') return;
    const fu = this.opts.followUps && !step.followUp ? await this.followUp(step, answer) : null;
    if (fu) { this.log('follow-up', fu); this.dispatch({ type: 'followUp', text: fu }); return; }
    if (!acked && Math.random() < 0.5) { await this.examinerSays(say(this.opts.context === 'interview' ? 'ackInterview' : 'ack')); await sleep(200); }
  }

  private async followUp(step: Step, answer: string): Promise<string | null> {
    const n = words(answer).length;
    if (this.opts.context === 'exam' && step.part === 1) {
      // Examiners only probe yes/no or preference questions, never the identity questions.
      const probe = /^(do|does|did|is|are|was|were|would|have|has|can)\b/i.test(step.text) && !/\b(name|from|work or are you a student)\b/i.test(step.text);
      return probe && n < 8 && Math.random() < 0.7 ? (Math.random() < 0.5 ? 'Why is that?' : 'Can you tell me a bit more about that?') : null;
    }
    if (!isLlmReady() || n < 8 || Math.random() < 0.35) return null;
    this.cb.onView({ phase: 'thinking', caption: '', who: '' });
    const sys = this.opts.context === 'interview'
      ? 'You are a professional interviewer. Ask ONE natural follow-up question (under 20 words) about a specific detail in the candidate\'s answer. Output only the question.'
      : 'You are an IELTS Speaking examiner in Part 3. Ask exactly ONE short follow-up question (under 20 words) that develops the topic in a more general or abstract direction. Never comment on or praise the answer. Output only the question.';
    try {
      const q = await chat([{ role: 'system', content: sys }, { role: 'user', content: `Question: ${step.text}\nAnswer: ${answer.slice(0, 700)}${this.opts.cvSummary ? `\nCV: ${this.opts.cvSummary.slice(0, 600)}` : ''}` }], { maxTokens: 60, temperature: 0.8 });
      const line = q.split('\n').map((x) => x.trim().replace(/^["“]|["”]$/g, '')).find((x) => x.endsWith('?'));
      if (!line || words(line).length > 25 || line.toLowerCase().includes(step.text.toLowerCase().replace(/\?$/, ''))) return null;
      return line;
    } catch { return null; }
  }

  private async rephrase(q: string, word?: string) {
    if (!isLlmReady()) return q;
    try {
      const out = await chat([{ role: 'system', content: 'Rephrase the exam question in simpler English with the same meaning. Output only the rephrased question.' }, { role: 'user', content: `${q}${word ? ` (the candidate did not understand "${word}")` : ''}` }], { maxTokens: 50, temperature: 0.3 });
      return out.split('\n').find((x) => x.trim().endsWith('?'))?.trim() ?? q;
    } catch { return q; }
  }

  /**
   * Records the candidate's turn and decides when it is over. After a short pause the audio so far
   * is transcribed: a complete sentence ends the turn quickly (and that transcript is reused);
   * a sentence left hanging ("…because") earns extra waiting time.
   */
  private async listen(step: Step, alreadySpeaking: boolean, nudged: boolean): Promise<{ kind: 'none' } | { kind: 'unclear' } | { kind: 'speech'; text: string; audio?: AudioStats; latencyMs?: number; interrupted: boolean; typedText?: boolean; acked?: boolean }> {
    const policy = POLICIES[this.ctxFor(step)];
    const isTalk = step.kind === 'talk';
    this.typed = null;
    this.mic.startTurn();
    const asked = performance.now();
    let speechMs = alreadySpeaking ? 300 : 0, segStart = alreadySpeaking ? asked : 0, lastEnd = asked, firstSpeech = alreadySpeaking ? asked : 0;
    let talkNudged = false;
    const part: { v: { text: string; speechMs: number } | null } = { v: null };
    let partialBusy = false;
    const off = this.mic.on((e) => {
      if (e.type === 'start') { segStart = e.at; if (!firstSpeech) firstSpeech = e.at; }
      else { if (segStart) speechMs += e.at - segStart; segStart = 0; lastEnd = e.at; }
    });
    this.cb.onView({ phase: 'listening', caption: isTalk ? 'Speak for up to two minutes.' : '', who: 'you' });
    // The voice engine is idle while the candidate talks: prepare what the examiner will say next.
    if (!this.warmed) { this.warmed = true; void warmPhrases(['Thank you.', 'Okay.', 'Right.', 'Alright.', 'Of course.', 'Certainly.', 'Sure, I’ll repeat that.', 'Sorry, I didn’t quite catch that.', 'Could you say it again?', 'Take your time.'], this.opts.voice); }
    this.prefetchNext();
    let interrupted = false;
    try {
      for (;;) {
        await sleep(80);
        if (this.stopped) return { kind: 'none' };
        if (this.typed !== null) { const text = this.typed; await this.mic.stopTurn(); return { kind: 'speech', text, interrupted: false, typedText: true }; }
        const now = performance.now();
        const speaking = this.mic.vad.speaking;
        const live = speechMs + (speaking && segStart ? now - segStart : 0);
        const silence = speaking ? 0 : now - lastEnd;
        if (isTalk) {
          const left = Math.max(0, 120 - (now - asked) / 1000);
          this.cb.onView({ talkLeft: Math.ceil(left) });
          if (left <= 0) { interrupted = true; break; }
          if (!speaking && live > policy.minSpeechMs && silence > policy.endSilenceMs) {
            if (!talkNudged && now - asked < 90_000) { talkNudged = true; this.log('nudge'); await this.examinerSays(say('nudgePart2')); lastEnd = performance.now(); this.cb.onView({ phase: 'listening', who: 'you' }); continue; }
            break;
          }
          if (!live && now - asked > policy.nudgeAfterMs + policy.giveUpAfterMs) break;
          continue;
        }
        // Early transcription during a pause.
        if (!speaking && live >= policy.minSpeechMs && silence >= 550 && !partialBusy && part.v?.speechMs !== live) {
          partialBusy = true;
          const at = live;
          void this.mic.snapshot().then(async (pcm) => {
            if (pcm && audioStats(pcm).voiced >= 0.4) part.v = { text: clean(await transcribe(pcm).catch(() => '')), speechMs: at };
          }).finally(() => { partialBusy = false; });
        }
        const p = part.v;
        const fresh = !!p && p.speechMs === live && !speaking;
        if (fresh && p!.text && !HALLUCINATION.test(p!.text) && isCompleteUtterance(p!.text)) break;
        const d = decideTurn({ sinceAsked: now - asked, speaking, speechMs: live, silenceMs: silence, nudged, thinking: fresh && !isCompleteUtterance(p!.text) }, policy);
        if (d === 'wait') continue;
        if (d === 'interrupt') { interrupted = true; this.log('interrupt'); break; }
        if (d === 'end-turn') break;
        if (d === 'nudge' || d === 'give-up') { await this.mic.stopTurn(); return { kind: 'none' }; }
      }
    } finally { off(); }
    const finalSpeech = speechMs;
    this.trace(`turn end (speech ${Math.round(finalSpeech)} ms, partial ${part.v ? 'yes' : 'no'})`);
    this.cb.onView({ phase: 'thinking', caption: '', who: '' });
    // A long answer is almost certainly an answer: react straight away while it is processed.
    const ackP = !isTalk && !interrupted && finalSpeech > 5000 ? this.examinerSays(say(this.opts.context === 'interview' ? 'ackInterview' : 'ack')) : null;
    const rec = await this.mic.stopTurn();
    if (!rec) { await ackP; return { kind: 'none' }; }
    const audio = audioStats(rec.pcm);
    if (audio.voiced < 0.4) { await ackP; return { kind: 'none' }; }
    const p = part.v;
    const reuse = p && p.speechMs === finalSpeech && p.text ? p.text : null;
    const text = reuse ?? clean(await transcribe(rec.pcm).catch(() => ''));
    this.trace(`transcribed${reuse ? ' (reused partial)' : ''}: ${text.slice(0, 30)}`);
    await ackP;
    if (!text || HALLUCINATION.test(text)) { this.log('silence'); return audio.voiced >= 1 ? { kind: 'unclear' } : { kind: 'none' }; }
    this.cb.onView({ caption: text, who: 'you' });
    return { kind: 'speech', text, audio, latencyMs: firstSpeech ? Math.round(firstSpeech - asked) : undefined, interrupted, acked: !!ackP };
  }
}

const clean = (t: string) => t.replace(/\[[^\]]*\]|\([^)]*\)/g, '').replace(/\s+/g, ' ').trim();
