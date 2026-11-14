import { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { cx } from './ui';

/** Countdown that survives re-renders; calls onEnd once. Uses wall-clock time so it stays accurate in background tabs. */
export function useCountdown(seconds: number, running: boolean, onEnd?: () => void) {
  const [left, setLeft] = useState(seconds);
  const endAt = useRef<number | null>(null);
  const ended = useRef(false);
  const cb = useRef(onEnd);
  cb.current = onEnd;
  useEffect(() => { setLeft(seconds); endAt.current = null; ended.current = false; }, [seconds]);
  useEffect(() => {
    if (!running) { endAt.current = null; return; }
    endAt.current = Date.now() + left * 1000;
    const t = setInterval(() => {
      const l = Math.max(0, Math.round((endAt.current! - Date.now()) / 1000));
      setLeft(l);
      if (l === 0 && !ended.current) { ended.current = true; clearInterval(t); cb.current?.(); }
    }, 250);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);
  return left;
}

/** Elapsed-time counter. */
export function useElapsed(running: boolean) {
  const [s, setS] = useState(0);
  useEffect(() => {
    if (!running) return;
    const start = Date.now() - s * 1000;
    const t = setInterval(() => setS(Math.round((Date.now() - start) / 1000)), 500);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);
  return s;
}

export const fmtTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export function TimerChip({ left, total, label }: { left: number; total: number; label?: string }) {
  const warn = left <= Math.min(300, total * 0.1);
  return (
    <span className={cx('inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-mono text-sm font-semibold tabular-nums', warn ? 'bg-rose-500/15 text-rose-600 dark:text-rose-300' : 'surface')} role="timer" aria-live={warn ? 'polite' : 'off'}>
      <Clock className="size-4" /> {label && <span className="font-sans font-medium">{label}</span>} {fmtTime(left)}
    </span>
  );
}
