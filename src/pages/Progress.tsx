import { useEffect, useMemo, useState } from 'react';
import { LineChart, Lightbulb, AlertTriangle } from 'lucide-react';
import { db, type Mistake, type Mock, type StudyDay, type VocabCard } from '../lib/db';
import { useActiveProfile, TEST_LABEL } from '../lib/profile';
import { isLearned } from '../lib/srs';
import { TYPE_LABEL } from '../lib/marking';
import { Bars, TrendChart } from '../components/Charts';
import { Badge, Empty, fmtBand, PageHeader, Stat } from '../components/ui';
import { useAttempts } from './shared';
import { latestBands, streak, weekRecommendations } from './progressData';
import { Insights } from './Insights';

export default function Progress() {
  const p = useActiveProfile();
  const attempts = useAttempts();
  const [days, setDays] = useState<StudyDay[]>([]);
  const [mocks, setMocks] = useState<Mock[]>([]);
  const [mistakes, setMistakes] = useState<Mistake[]>([]);
  const [vocab, setVocab] = useState<VocabCard[]>([]);
  useEffect(() => {
    void db.days.where('profileId').equals(p.id).toArray().then(setDays);
    void db.mocks.where('profileId').equals(p.id).toArray().then((m) => setMocks(m.filter((x) => x.finishedAt && x.overall !== undefined).sort((a, b) => a.startedAt - b.startedAt)));
    void db.mistakes.where('profileId').equals(p.id).toArray().then(setMistakes);
    void db.vocab.where('profileId').equals(p.id).toArray().then(setVocab);
  }, [p.id]);

  const last14 = useMemo(() => Array.from({ length: 14 }, (_, i) => {
    const d = new Date(Date.now() - (13 - i) * 86_400_000).toISOString().slice(0, 10);
    return { label: d.slice(8), value: Math.round((days.find((x) => x.date === d)?.seconds ?? 0) / 60) };
  }), [days]);

  const series = (['listening', 'reading', 'writing', 'speaking'] as const).map((k) => ({
    name: k[0].toUpperCase() + k.slice(1),
    points: attempts.filter((a) => a.kind === k && a.band !== undefined).sort((a, b) => a.at - b.at).slice(-10).map((a) => ({ label: new Date(a.at).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), value: a.band! })),
  })).filter((s) => s.points.length);

  const accuracy = (k: 'reading' | 'listening') => {
    const r = attempts.filter((a) => a.kind === k && a.total);
    const c = r.reduce((s, a) => s + (a.raw ?? 0), 0), t = r.reduce((s, a) => s + (a.total ?? 0), 0);
    return t ? `${Math.round((c / t) * 100)}%` : '–';
  };
  const commonMistakes = Object.entries(mistakes.reduce<Record<string, number>>((m, x) => ({ ...m, [`${x.skill}|${x.type}`]: (m[`${x.skill}|${x.type}`] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1]).slice(0, 8);
  const bands = latestBands(attempts);
  const totalMin = Math.round(days.reduce((s, d) => s + d.seconds, 0) / 60);
  const lastFive = mocks.slice(-5);

  if (!attempts.length && !days.length) return <><PageHeader title="Progress" icon={LineChart} /><Empty icon={LineChart} title="No activity yet" text="Your charts appear here after your first practice session." /></>;

  return (
    <div className="space-y-6">
      <PageHeader title="Progress & analytics" subtitle="Everything is calculated from your own attempts on this device." icon={LineChart} />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Total study" value={`${Math.floor(totalMin / 60)}h ${totalMin % 60}m`} />
        <Stat label="Streak" value={`${streak(days)} d`} grad="grad-gold" />
        <Stat label="Reading accuracy" value={accuracy('reading')} grad="grad-reading" />
        <Stat label="Listening accuracy" value={accuracy('listening')} grad="grad-listening" />
        <Stat label="Words learned" value={vocab.filter(isLearned).length} sub={`${vocab.length} in deck`} grad="grad-reading" />
        <Stat label="Lessons & quizzes" value={attempts.filter((a) => a.kind === 'grammar').length} grad="grad-writing" />
        <Stat label="Speaking sessions" value={attempts.filter((a) => a.kind === 'speaking').length} grad="grad-speaking" />
        <Stat label="Essays & letters" value={attempts.filter((a) => a.kind === 'writing').length} grad="grad-writing" />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface rounded-2xl p-5"><h2 className="mb-3 font-semibold">Study minutes, last 14 days</h2><Bars data={last14} unit=" min" /></div>
        <div className="surface rounded-2xl p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold"><Lightbulb className="size-4 text-amber-500" />This week’s recommendations</h2>
          <ul className="list-disc space-y-2 pl-5 text-sm">{weekRecommendations(attempts, p.target || 6).map((r) => <li key={r}>{r}</li>)}</ul>
          <div className="mt-4 flex flex-wrap gap-2">{(Object.entries(bands) as [string, number][]).map(([k, b]) => <Badge key={k} tone={p.target && b < p.target ? 'warn' : 'good'}>{k} {fmtBand(b)}</Badge>)}</div>
        </div>
      </div>

      <Insights attempts={attempts} mistakes={mistakes} examDate={p.examDate} target={p.target} />

      {series.length > 0 && <div className="surface rounded-2xl p-5"><h2 className="mb-3 font-semibold">Skill estimates over time</h2><TrendChart series={series} /></div>}

      <div className="surface rounded-2xl p-5">
        <h2 className="mb-3 font-semibold">Last five mock examinations</h2>
        {!lastFive.length ? <p className="text-muted text-sm">Complete a full mock exam to compare results here.</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-muted text-left"><th className="py-2">Date</th><th>Test</th><th>L</th><th>R</th><th>W</th><th>S</th><th>Overall</th></tr></thead>
              <tbody>{lastFive.map((m) => <tr key={m.id} className="border-t border-soft"><td className="py-2">{new Date(m.startedAt).toLocaleDateString()}</td><td>{TEST_LABEL[m.testType]}</td>{(['listening', 'reading', 'writing', 'speaking'] as const).map((k) => <td key={k}>{fmtBand(m.sections[k]?.band)}</td>)}<td className="font-bold">{fmtBand(m.overall)}</td></tr>)}</tbody>
            </table>
            {lastFive.length > 1 && <div className="mt-4"><TrendChart series={[{ name: 'Overall', points: lastFive.map((m) => ({ label: new Date(m.startedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' }), value: m.overall! })) }]} /></div>}
          </div>
        )}
      </div>

      <div className="surface rounded-2xl p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><AlertTriangle className="size-4 text-rose-500" />Most common mistakes</h2>
        {!commonMistakes.length ? <p className="text-muted text-sm">None recorded yet.</p> : (
          <div className="grid gap-2 sm:grid-cols-2">{commonMistakes.map(([k, n]) => { const [skill, type] = k.split('|'); const ex = mistakes.filter((m) => m.skill === skill && m.type === type).at(-1); return <div key={k} className="surface-2 min-w-0 rounded-xl p-3 text-sm"><div className="flex justify-between gap-2"><b className="min-w-0 truncate capitalize">{skill}: {TYPE_LABEL[type] ?? type}</b><Badge tone="bad">×{n}</Badge></div>{ex && <div className="text-muted mt-1 truncate text-xs">e.g. {ex.example}</div>}</div>; })}</div>
        )}
      </div>
    </div>
  );
}
