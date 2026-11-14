import { useEffect, useMemo, useRef, useState } from 'react';
import { Play, Pause, RotateCcw, Send, Headphones, Loader2, Eye, EyeOff, Volume2 } from 'lucide-react';
import type { ListeningPart } from '../content/listening';
import { markGroups } from '../lib/marking';
import { LISTENING_TABLE, rawToBand } from '../lib/scoring';
import { db, recordMistakes } from '../lib/db';
import { useActiveProfile } from '../lib/profile';
import { isTtsReady, playPcm, speak, stopSpeaking, synth } from '../ai/tts';
import { QuestionGroups, QuestionNav, highlight } from '../components/Questions';
import { Button, Confirm, cx, Notice, Progress, Tabs } from '../components/ui';
import { TestResult } from './TestResult';
import type { SectionResult } from './ReadingTest';

type Clip = { pcm: Float32Array; rate: number };
const cache = new Map<string, Clip>();

/** Plays the script line by line with the right voice per speaker. */
function usePlayer(part: ListeningPart, speed: number) {
  const [line, setLine] = useState(-1);
  const [playing, setPlaying] = useState(false);
  const [preparing, setPreparing] = useState(0);
  const [finished, setFinished] = useState(false);
  const token = useRef(0);

  useEffect(() => () => { token.current++; stopSpeaking(); }, []);
  useEffect(() => { token.current++; stopSpeaking(); setLine(-1); setPlaying(false); setFinished(false); }, [part.id]);

  const prepare = async () => {
    if (!isTtsReady()) return;
    for (let i = 0; i < part.lines.length; i++) {
      const l = part.lines[i];
      const key = `${l.voice}|${speed}|${l.say ?? l.text}`;
      if (!cache.has(key)) { const c = await synth(l.say ?? l.text, l.voice, speed); if (c) cache.set(key, c); }
      setPreparing((i + 1) / part.lines.length);
    }
  };

  const play = async (from = 0) => {
    const my = ++token.current;
    setPlaying(true); setFinished(false);
    await prepare();
    for (let i = from; i < part.lines.length; i++) {
      if (token.current !== my) return;
      setLine(i);
      const l = part.lines[i];
      const clip = cache.get(`${l.voice}|${speed}|${l.say ?? l.text}`);
      if (clip) await playPcm(clip.pcm, clip.rate); else await speak(l.say ?? l.text, l.voice, speed);
      await new Promise((r) => setTimeout(r, 350));
    }
    if (token.current === my) { setPlaying(false); setFinished(true); setLine(-1); }
  };
  const pause = () => { token.current++; stopSpeaking(); setPlaying(false); };
  return { line, playing, preparing, finished, play, pause };
}

export function ListeningTest({ parts, exam, mockId, onDone }: { parts: ListeningPart[]; exam?: boolean; mockId?: string; onDone?: (r: SectionResult) => void }) {
  const profile = useActiveProfile();
  const [idx, setIdx] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [result, setResult] = useState<SectionResult | null>(null);
  const [showScript, setShowScript] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [played, setPlayed] = useState<Record<string, boolean>>({});
  const [evidence, setEvidence] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [startedAt] = useState(Date.now());
  const part = parts[idx];
  const player = usePlayer(part, speed);
  const groups = useMemo(() => parts.flatMap((p) => p.groups), [parts]);
  const numbers = groups.flatMap((g) => g.items.map((i) => i.n));
  const locked = exam && !result && (played[part.id] || player.playing); // audio plays once in exam mode

  useEffect(() => { if (player.finished) setPlayed((p) => ({ ...p, [part.id]: true })); }, [player.finished, part.id]);

  async function submit() {
    player.pause();
    const mark = markGroups(groups, answers);
    const band = rawToBand(mark.correct, LISTENING_TABLE, mark.total);
    const attemptId = await db.attempts.add({ profileId: profile.id, kind: 'listening', refId: parts.map((p) => p.id).join('+'), title: parts.length > 1 ? 'Listening test (4 parts)' : part.title, at: Date.now(), durationSec: Math.round((Date.now() - startedAt) / 1000), band, raw: mark.correct, total: mark.total, data: { answers, byType: mark.byType }, mockId });
    await recordMistakes(profile.id, 'listening', groups.flatMap((g) => g.items.filter((i) => !mark.byItem[i.n]).map((i) => ({ type: g.type, example: i.text }))));
    const r = { raw: mark.correct, total: mark.total, band, attemptId, mark };
    setResult(r); setShowScript(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    onDone?.(r);
  }

  const canSeeScript = !exam || !!result;
  return (
    <div className="space-y-4">
      {result && <TestResult kind="Listening" raw={result.raw} total={result.total} band={result.band} byType={result.mark.byType} scaled={result.total !== 40} />}
      <div className="surface sticky top-14 z-20 flex flex-wrap items-center gap-2 rounded-2xl p-2 lg:top-2">
        {parts.length > 1 && <Tabs value={String(idx)} onChange={(v) => { if (!player.playing) setIdx(Number(v)); }} options={parts.map((p, i) => ({ value: String(i), label: `Part ${p.part}` }))} />}
        <div className="ml-auto flex items-center gap-2">{!result && <Button size="sm" icon={Send} onClick={() => setConfirm(true)}>Submit</Button>}</div>
      </div>

      <div className="grad-listening relative overflow-hidden rounded-2xl p-5 text-white">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider opacity-90"><Headphones className="size-4" />Part {part.part}</div>
        <h2 className="mt-1 text-xl font-bold">{part.title}</h2>
        <p className="mt-1 text-sm opacity-90">{part.context}</p>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {!player.playing
            ? <Button variant="secondary" icon={played[part.id] && !exam ? RotateCcw : Play} disabled={!!locked} onClick={() => player.play(0)} className="!bg-white !text-[#0a8ff0]">{locked ? 'Audio already played' : played[part.id] ? 'Replay' : 'Play recording'}</Button>
            : !exam && <Button variant="secondary" icon={Pause} onClick={player.pause} className="!bg-white !text-[#0a8ff0]">Pause</Button>}
          {!exam && !player.playing && player.line > 0 && <Button variant="ghost" className="text-white" onClick={() => player.play(player.line)}>Resume</Button>}
          {!exam && (
            <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="h-9 rounded-lg bg-white/20 px-2 text-sm" aria-label="Playback speed">
              {[0.8, 0.9, 1, 1.1].map((s) => <option key={s} value={s} className="text-black">{s}×</option>)}
            </select>
          )}
          {player.playing && <span className="flex items-center gap-2 text-sm"><Volume2 className="size-4 animate-pulse" />{player.preparing > 0 && player.preparing < 1 ? <><Loader2 className="size-4 animate-spin" />Preparing audio {Math.round(player.preparing * 100)}%</> : `Playing… line ${player.line + 1} of ${part.lines.length}`}</span>}
        </div>
        {player.playing && <Progress value={(player.line + 1) / part.lines.length} className="mt-3 bg-white/20" grad="bg-white" />}
      </div>
      {exam && !result && <Notice>Exam mode: each recording plays once and cannot be paused, as in the real test. Transcripts are shown after you submit.</Notice>}
      {!isTtsReady() && <Notice tone="info">Using your browser’s built-in voice. For more natural British and American voices, download Kokoro in <a className="underline" href="#/settings">Settings → Models</a>.</Notice>}

      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <QuestionGroups groups={part.groups} guideSkill={exam ? undefined : 'listening'} answers={answers} onAnswer={(n, v) => setAnswers((a) => ({ ...a, [n]: v }))} review={!!result} onEvidence={(e) => { setEvidence(e); setShowScript(true); }} />
          {!result && idx < parts.length - 1 && <Button className="w-full" variant="secondary" disabled={player.playing} onClick={() => { setIdx(idx + 1); window.scrollTo({ top: 0 }); }}>Next part →</Button>}
        </div>
        <aside className="space-y-3">
          <div className="surface rounded-2xl p-3"><QuestionNav numbers={numbers} answers={answers} review={!!result} correct={result?.mark.byItem} onJump={(n) => { const i = parts.findIndex((p) => p.groups.some((g) => g.items.some((it) => it.n === n))); if (i >= 0 && !player.playing) setIdx(i); }} /></div>
          {canSeeScript && (
            <div className="surface rounded-2xl p-3">
              <button className="flex w-full items-center justify-between text-sm font-semibold" onClick={() => setShowScript(!showScript)}>Transcript {showScript ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</button>
              {showScript && (
                <div className="mt-3 max-h-[60vh] space-y-2 overflow-y-auto text-sm">
                  {part.lines.map((l, i) => <p key={i} className={cx('rounded-lg p-1.5', player.line === i && 'bg-[var(--accent)]/10')}><b>{l.speaker}:</b> {highlight(l.text, evidence ? [{ text: evidence, cls: 'ev' }] : [])}</p>)}
                </div>
              )}
            </div>
          )}
        </aside>
      </div>
      <Confirm open={confirm} title="Submit Listening answers?" message={`You have answered ${Object.values(answers).filter(Boolean).length} of ${numbers.length} questions.`} confirmLabel="Submit" onClose={() => setConfirm(false)} onConfirm={submit} />
    </div>
  );
}
