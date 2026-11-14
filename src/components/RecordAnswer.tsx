import { useEffect, useRef, useState } from 'react';
import { Mic, Square, Keyboard, Loader2, Send, Download, RotateCcw } from 'lucide-react';
import { Recorder, micErrorMessage, type Recording } from '../lib/recorder';
import { audioStats, type AudioStats } from '../lib/speakingAnalysis';
import { isSttReady, loadStt, transcribe } from '../ai/stt';
import { useModelState } from '../ai/store';
import { DEFAULT_STT } from '../ai/models';
import { Button, cx, inputCls, Notice, Progress } from './ui';
import { fmtTime } from './Timer';

export interface Answer { text: string; audio?: AudioStats; typed: boolean; blob?: Blob }

/**
 * Turn-based answer capture: record → local Whisper transcription → confirm.
 * Typing is always available. Nothing is uploaded.
 */
export function RecordAnswer({ onSubmit, maxSeconds = 90, autoStart = false, submitLabel = 'Submit answer', allowEdit = true }: { onSubmit: (a: Answer) => void; maxSeconds?: number; autoStart?: boolean; submitLabel?: string; allowEdit?: boolean }) {
  const [mode, setMode] = useState<'idle' | 'recording' | 'processing' | 'review' | 'typing' | 'needModel'>('idle');
  const [text, setText] = useState('');
  const [err, setErr] = useState('');
  const [level, setLevel] = useState(0);
  const [elapsed, setElapsed] = useState(0);
  const rec = useRef<Recorder | null>(null);
  const pending = useRef<Recording | null>(null);
  const stats = useRef<AudioStats | undefined>(undefined);
  const stt = useModelState(DEFAULT_STT);

  const start = async () => {
    setErr('');
    try {
      const r = new Recorder();
      await r.start();
      rec.current = r;
      setMode('recording');
    } catch (e) { setErr(micErrorMessage(e)); setMode('typing'); }
  };

  const process = async (r: Recording) => {
    stats.current = audioStats(r.pcm);
    if (!isSttReady()) { pending.current = r; setMode('needModel'); return; }
    setMode('processing');
    try {
      const t = await transcribe(r.pcm);
      setText(t || '');
      setMode('review');
      if (!t) setErr('No speech was recognised. Try again closer to the microphone, or type your answer.');
    } catch (e) { setErr(`Transcription failed: ${(e as Error).message}. You can type your answer instead.`); setMode('typing'); }
  };

  const stop = async () => {
    const r = rec.current;
    if (!r) return;
    rec.current = null;
    try { await process(await r.stop()); } catch (e) { setErr((e as Error).message); setMode('typing'); }
  };

  useEffect(() => {
    if (mode !== 'recording') return;
    const t0 = performance.now();
    let raf = 0;
    const tick = () => {
      const s = (performance.now() - t0) / 1000;
      setElapsed(s);
      setLevel(rec.current?.level() ?? 0);
      if (s >= maxSeconds) void stop(); else raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  useEffect(() => {
    if (autoStart) void start();
    return () => rec.current?.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submit = () => {
    onSubmit({ text: text.trim(), audio: mode === 'review' ? stats.current : undefined, typed: mode !== 'review', blob: undefined });
    setText(''); setMode('idle'); setErr(''); stats.current = undefined;
  };

  return (
    <div className="space-y-3">
      {err && <Notice tone="warn">{err}</Notice>}
      {mode === 'idle' && (
        <div className="flex flex-wrap gap-2">
          <Button size="lg" icon={Mic} onClick={start} className="grad-speaking">Record answer</Button>
          <Button size="lg" variant="secondary" icon={Keyboard} onClick={() => setMode('typing')}>Type instead</Button>
        </div>
      )}
      {mode === 'recording' && (
        <div className="surface flex items-center gap-4 rounded-2xl p-4">
          <button onClick={stop} className="grad-speaking grid size-14 shrink-0 place-items-center rounded-full text-white animate-pulse-ring" aria-label="Stop recording"><Square className="size-5 fill-current" /></button>
          <div className="flex-1">
            <div className="flex justify-between text-sm"><span className="font-medium">Recording… speak naturally</span><span className="font-mono tabular-nums">{fmtTime(Math.floor(elapsed))} / {fmtTime(maxSeconds)}</span></div>
            <div className="mt-2 flex h-6 items-end gap-0.5" aria-hidden>{Array.from({ length: 24 }, (_, i) => <span key={i} className="grad-speaking flex-1 rounded-sm transition-all" style={{ height: `${Math.max(8, Math.min(100, level * 100 * (0.6 + 0.4 * Math.sin(i + elapsed * 6))))}%` }} />)}</div>
          </div>
        </div>
      )}
      {mode === 'processing' && <div className="surface flex items-center gap-3 rounded-2xl p-4 text-sm"><Loader2 className="size-5 animate-spin text-[var(--accent)]" />Transcribing on your device…</div>}
      {mode === 'needModel' && (
        <div className="surface space-y-3 rounded-2xl p-4">
          <p className="text-sm">Your recording is ready. To turn it into text, download the speech model (Whisper Tiny, about 41 MB, stored in this browser). Or type what you said.</p>
          {stt.status === 'loading' && <Progress value={stt.progress} />}
          {stt.status === 'error' && <Notice tone="warn">{stt.error}</Notice>}
          <div className="flex flex-wrap gap-2">
            <Button icon={stt.status === 'loading' ? Loader2 : Download} disabled={stt.status === 'loading'} onClick={async () => { try { await loadStt(); if (pending.current) await process(pending.current); } catch { /* shown via store */ } }}>{stt.status === 'loading' ? `Downloading ${Math.round(stt.progress * 100)}%` : 'Download & transcribe'}</Button>
            <Button variant="secondary" icon={Keyboard} onClick={() => setMode('typing')}>Type instead</Button>
          </div>
        </div>
      )}
      {(mode === 'review' || mode === 'typing') && (
        <div className="space-y-2">
          <label className="text-muted text-xs font-medium">{mode === 'review' ? 'Transcript (check it and fix any recognition errors)' : 'Type your answer'}</label>
          <textarea className={cx(inputCls, 'min-h-28')} value={text} onChange={(e) => setText(e.target.value)} readOnly={mode === 'review' && !allowEdit} autoFocus={mode === 'typing'} placeholder="Your answer…" />
          <div className="flex flex-wrap gap-2">
            <Button icon={Send} disabled={!text.trim()} onClick={submit}>{submitLabel}</Button>
            <Button variant="ghost" icon={RotateCcw} onClick={() => { setText(''); setErr(''); setMode('idle'); }}>Start again</Button>
          </div>
        </div>
      )}
    </div>
  );
}
