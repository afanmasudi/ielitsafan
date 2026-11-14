import { Trophy } from 'lucide-react';
import { BandRing } from '../components/Charts';
import { Progress } from '../components/ui';
import { TYPE_LABEL } from '../lib/marking';
import { SCORING_SOURCES, UNCERTAINTY } from '../lib/scoring';

export function TestResult({ kind, raw, total, band, byType, scaled }: { kind: 'Reading' | 'Listening'; raw: number; total: number; band: number; byType: Record<string, { correct: number; total: number }>; scaled?: boolean }) {
  return (
    <div className="surface grid gap-5 rounded-2xl p-5 animate-fade-up md:grid-cols-[auto_1fr]">
      <div className="flex flex-col items-center gap-2">
        <BandRing band={band} label="Band" size={130} grad={kind === 'Reading' ? ['#10b981', '#0ea5e9'] : ['#0ea5e9', '#6366f1']} />
        <div className="text-sm font-semibold"><Trophy className="mr-1 inline size-4 text-amber-500" />{raw} / {total} correct</div>
      </div>
      <div>
        <h2 className="text-lg font-semibold">{kind} result</h2>
        <p className="text-muted text-sm">
          {scaled ? `Practice set: ${total} questions, scaled to the 40-question table for an indicative band only.` : 'Raw score converted with the approximate published table.'} Real tests vary slightly between versions (±{UNCERTAINTY.reading} band).
        </p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {Object.entries(byType).map(([t, v]) => (
            <div key={t} className="surface-2 rounded-xl p-3">
              <div className="flex justify-between text-sm"><span>{TYPE_LABEL[t]}</span><b>{v.correct}/{v.total}</b></div>
              <Progress value={v.correct / v.total} className="mt-2" grad={v.correct / v.total >= 0.7 ? 'grad-reading' : v.correct / v.total >= 0.4 ? 'grad-gold' : 'grad-speaking'} />
            </div>
          ))}
        </div>
        <p className="text-muted mt-3 text-xs">Scroll down to review each answer with the supporting text. Source: {SCORING_SOURCES.rawScores.source}.</p>
      </div>
    </div>
  );
}
