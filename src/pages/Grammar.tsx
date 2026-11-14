import { useEffect, useState } from 'react';
import { SpellCheck, ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import { GRAMMAR, type GrammarLesson } from '../content/grammar';
import { db, logStudy, recordMistakes } from '../lib/db';
import { useActiveProfile } from '../lib/profile';
import { Badge, Button, Card, cx, PageHeader } from '../components/ui';

export default function Grammar() {
  const p = useActiveProfile();
  const [lesson, setLesson] = useState<GrammarLesson | null>(null);
  const [best, setBest] = useState<Record<string, number>>({});
  useEffect(() => {
    void db.attempts.where('[profileId+kind]').equals([p.id, 'grammar']).toArray().then((rows) => {
      const b: Record<string, number> = {};
      rows.forEach((r) => { b[r.refId] = Math.max(b[r.refId] ?? 0, (r.raw ?? 0) / (r.total ?? 1)); });
      setBest(b);
    });
  }, [p.id, lesson]);
  if (lesson) return <><Button variant="ghost" size="sm" icon={ArrowLeft} className="mb-4" onClick={() => setLesson(null)}>All lessons</Button><Lesson lesson={lesson} /></>;
  return (
    <div>
      <PageHeader title="Grammar" subtitle="Short lessons on the errors that most often lower Grammatical Range and Accuracy, each with a quiz." icon={SpellCheck} grad="grad-writing" />
      {(['Foundation', 'Intermediate', 'Advanced'] as const).map((lvl) => (
        <section key={lvl} className="mb-6">
          <h2 className="mb-3 text-lg font-semibold">{lvl}</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GRAMMAR.filter((g) => g.level === lvl).map((g) => (
              <Card key={g.id} onClick={() => setLesson(g)}>
                <div className="flex items-center justify-between"><h3 className="font-semibold">{g.title}</h3>{best[g.id] !== undefined && <Badge tone={best[g.id] >= 0.75 ? 'good' : 'warn'}>{Math.round(best[g.id] * 100)}%</Badge>}</div>
                <p className="text-muted mt-1 text-sm">{g.summary}</p>
              </Card>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function Lesson({ lesson }: { lesson: GrammarLesson }) {
  const p = useActiveProfile();
  const [ans, setAns] = useState<(number | null)[]>(lesson.quiz.map(() => null));
  const [checked, setChecked] = useState(false);
  const score = ans.filter((a, i) => a === lesson.quiz[i].answer).length;
  const check = async () => {
    setChecked(true);
    await db.attempts.add({ profileId: p.id, kind: 'grammar', refId: lesson.id, title: lesson.title, at: Date.now(), durationSec: 0, raw: score, total: lesson.quiz.length });
    await recordMistakes(p.id, 'grammar', lesson.quiz.filter((q, i) => ans[i] !== q.answer).map((q) => ({ type: lesson.id, example: q.q })));
    await logStudy(p.id, 0, `${new Date().toISOString().slice(0, 10)}:grammar`);
  };
  return (
    <div className="space-y-4">
      <PageHeader title={lesson.title} subtitle={lesson.summary} icon={SpellCheck} grad="grad-writing" />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface rounded-2xl p-5"><h3 className="mb-2 font-semibold">Key points</h3><ul className="list-disc space-y-1.5 pl-5 text-sm">{lesson.points.map((x) => <li key={x}>{x}</li>)}</ul></div>
        <div className="surface rounded-2xl p-5"><h3 className="mb-2 font-semibold">Examples</h3><ul className="space-y-1.5 text-sm">{lesson.examples.map((x) => <li key={x} className="surface-2 rounded-lg p-2">{x}</li>)}</ul></div>
      </div>
      <div className="surface space-y-4 rounded-2xl p-5">
        <h3 className="font-semibold">Quiz</h3>
        {lesson.quiz.map((q, i) => (
          <div key={i}>
            <p className="text-sm font-medium">{i + 1}. {q.q}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {q.options.map((o, j) => (
                <button key={j} disabled={checked} onClick={() => setAns(ans.map((a, k) => (k === i ? j : a)))}
                  className={cx('min-h-10 rounded-xl border px-3 text-sm', ans[i] === j ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-soft', checked && j === q.answer && 'border-emerald-500 bg-emerald-500/10', checked && ans[i] === j && j !== q.answer && 'border-rose-500 bg-rose-500/10')}>{o}</button>
              ))}
            </div>
            {checked && <p className="mt-1 flex items-center gap-1.5 text-xs">{ans[i] === q.answer ? <CheckCircle2 className="size-3.5 text-emerald-500" /> : <XCircle className="size-3.5 text-rose-500" />}{q.why}</p>}
          </div>
        ))}
        {!checked ? <Button disabled={ans.some((a) => a === null)} onClick={check}>Check answers</Button> : <div className="flex items-center gap-3"><b>{score}/{lesson.quiz.length}</b><Button variant="secondary" onClick={() => { setAns(lesson.quiz.map(() => null)); setChecked(false); }}>Try again</Button></div>}
      </div>
    </div>
  );
}
