import { Brain, TrendingUp, TrendingDown, Minus, Sparkles } from 'lucide-react';
import type { Attempt, Mistake } from '../lib/db';
import { errorPatterns, masteryByType, projectBand, speakingSeries } from '../lib/insights';
import { TYPE_LABEL } from '../lib/marking';
import { TrendChart } from '../components/Charts';
import { Badge, cx, fmtBand } from '../components/ui';

/** Pattern analysis over the learner's own history. All calculations are local and explained. */
export function Insights({ attempts, mistakes, examDate, target }: { attempts: Attempt[]; mistakes: Mistake[]; examDate?: string; target: number }) {
  const mastery = masteryByType(attempts);
  const speech = speakingSeries(attempts);
  const patterns = errorPatterns(mistakes).slice(0, 8);
  const when = examDate ? new Date(examDate + 'T00:00:00').getTime() : Date.now() + 28 * 86_400_000;
  const projections = (['listening', 'reading', 'writing', 'speaking'] as const).map((k) => ({ k, p: projectBand(attempts, k, when) })).filter((x) => x.p);
  const label = (d: number) => new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short' });
  const arrow = (v: number) => (v > 0.02 ? <TrendingUp className="size-3.5 text-emerald-500" /> : v < -0.02 ? <TrendingDown className="size-3.5 text-rose-500" /> : <Minus className="text-muted size-3.5" />);
  const empty = !mastery.length && speech.length < 2 && !patterns.length && !projections.length;

  return (
    <section className="surface space-y-5 rounded-2xl p-5">
      <h2 className="flex items-center gap-2 font-semibold"><Brain className="size-5 text-[var(--accent)]" />Pattern insights</h2>
      {empty && <p className="text-muted text-sm">Insights appear after a few Reading/Listening sets and Speaking sessions.</p>}

      {mastery.length > 0 && (
        <div>
          <h3 className="mb-1 text-sm font-semibold">Question-type mastery</h3>
          <p className="text-muted mb-3 text-xs">Estimated with a Bayesian model of your answers (recent work counts more). The bar is your likely range; the arrow is your weekly trend.</p>
          <div className="space-y-2">
            {mastery.map((m) => (
              <div key={m.type} className="grid grid-cols-[minmax(0,9rem)_1fr_auto] items-center gap-3 text-sm">
                <span className="truncate">{TYPE_LABEL[m.type] ?? m.type}</span>
                <div className="surface-2 relative h-3 rounded-full">
                  <div className="absolute inset-y-0 rounded-full bg-[var(--accent)]/25" style={{ left: `${m.low * 100}%`, width: `${(m.high - m.low) * 100}%` }} />
                  <div className={cx('absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full', m.mean >= 0.75 ? 'bg-emerald-500' : m.mean >= 0.55 ? 'bg-amber-500' : 'bg-rose-500')} style={{ left: `${m.mean * 100}%` }} />
                </div>
                <span className="flex items-center gap-1 tabular-nums">{Math.round(m.mean * 100)}%{arrow(m.trend)}</span>
              </div>
            ))}
          </div>
          {mastery[0].mean < 0.6 && <p className="mt-3 text-sm"><Sparkles className="mr-1 inline size-4 text-[var(--accent)]" />Focus next on <b>{TYPE_LABEL[mastery[0].type] ?? mastery[0].type}</b>: it is your weakest question type. The Reading Lab now recommends passages that practise it.</p>}
        </div>
      )}

      {speech.length >= 2 && (
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <h3 className="mb-1 text-sm font-semibold">Speaking fluency over time</h3>
            <TrendChart max={Math.max(160, ...speech.map((s) => s.wpm ?? 0))} height={150} series={[{ name: 'Words per minute', points: speech.filter((s) => s.wpm).map((s) => ({ label: label(s.at), value: s.wpm! })) }]} />
          </div>
          <div>
            <h3 className="mb-1 text-sm font-semibold">Fillers and answer length</h3>
            <TrendChart max={Math.max(60, ...speech.map((s) => s.avgAnswerWords))} height={150} series={[{ name: 'Words per answer', points: speech.map((s) => ({ label: label(s.at), value: Math.round(s.avgAnswerWords) })) }, { name: 'Fillers per 100 words', points: speech.map((s) => ({ label: label(s.at), value: Math.round(s.fillersPer100 * 10) / 10 })) }]} />
          </div>
        </div>
      )}

      {patterns.length > 0 && (
        <div>
          <h3 className="mb-2 text-sm font-semibold">Error patterns (last 14 days vs the 14 before)</h3>
          <div className="flex flex-wrap gap-2">
            {patterns.map((p) => <Badge key={p.key} tone={p.direction === 'rising' || p.direction === 'new' ? 'bad' : p.direction === 'falling' ? 'good' : 'neutral'}>{p.skill}: {TYPE_LABEL[p.type] ?? p.type} · {p.recent} {p.direction === 'rising' ? '↑' : p.direction === 'falling' ? '↓' : p.direction === 'new' ? 'new' : '→'}</Badge>)}
          </div>
        </div>
      )}

      {projections.length > 0 && (
        <div>
          <h3 className="mb-1 text-sm font-semibold">Projection to {examDate ? 'your exam date' : 'four weeks from now'}</h3>
          <p className="text-muted mb-2 text-xs">A linear trend through your estimates, with weekly gains capped. A rough guide, not a prediction.</p>
          <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {projections.map(({ k, p }) => (
              <div key={k} className="surface-2 rounded-xl p-3 text-sm">
                <div className="text-muted text-xs capitalize">{k}</div>
                <div className="text-lg font-bold">{fmtBand(Math.round(p!.now * 2) / 2)} → {fmtBand(Math.round(p!.projected * 2) / 2)}</div>
                <div className="text-muted text-xs">range {fmtBand(Math.round(p!.low * 2) / 2)}–{fmtBand(Math.round(p!.high * 2) / 2)} · {p!.perWeek >= 0 ? '+' : ''}{p!.perWeek.toFixed(2)}/week</div>
                {target > 0 && <div className={cx('mt-1 text-xs font-medium', p!.projected >= target ? 'text-emerald-600' : 'text-amber-600')}>{p!.projected >= target ? 'On track for your target' : `Below target ${target.toFixed(1)}`}</div>}
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
