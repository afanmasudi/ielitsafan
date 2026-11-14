import { useEffect, useState } from 'react';
import { Mic, ArrowLeft, AudioLines, Shuffle, Video } from 'lucide-react';
import { LiveSession } from '../features/live/LiveSession';
import { loadHistory, type History as QHistory } from '../lib/questionHistory';
import { useActiveProfile } from '../lib/profile';
import { buildSpeakingExam, CUE_CARDS, READ_ALOUD } from '../content/speaking';
import { SpeakingExam } from '../features/SpeakingExam';
import { intelligibility } from '../lib/speakingAnalysis';
import { RecordAnswer } from '../components/RecordAnswer';
import { ModelStatus } from '../components/ModelStatus';
import { Badge, Button, Card, Notice, PageHeader, Progress } from '../components/ui';
import { speak } from '../ai/tts';
import { History } from './shared';

type Mode = null | { parts: (1 | 2 | 3)[]; title: string; cardId?: string; seed: number; live?: boolean } | 'readaloud';

export default function Speaking() {
  const p = useActiveProfile();
  const [mode, setMode] = useState<Mode>(null);
  const [history, setHistory] = useState<QHistory>({});
  useEffect(() => { void loadHistory(p.id).then(setHistory); }, [p.id, mode]);
  if (mode === 'readaloud') return <><Back onClick={() => setMode(null)} /><ReadAloud /></>;
  if (mode?.live) return <LiveSession key={mode.seed} kind="exam" title={mode.title} parts={mode.parts} cardId={mode.cardId} onExit={() => setMode(null)} />;
  if (mode) return <><Back onClick={() => setMode(null)} /><SpeakingExam key={mode.seed} steps={buildSpeakingExam(mode.seed, { parts: mode.parts, cardId: mode.cardId, history })} title={mode.title} /></>;
  const seed = () => Date.now();
  return (
    <div>
      <PageHeader title="Speaking Lab" subtitle="A turn-by-turn examiner with local speech recognition. Your voice never leaves this device." icon={Mic} grad="grad-speaking" actions={<ModelStatus />} />
      <section className="grad-speaking relative mb-6 overflow-hidden rounded-3xl p-6 text-white">
        <div className="absolute -right-12 -top-12 size-56 rounded-full bg-white/10 blur-2xl" />
        <div className="flex items-center gap-2 text-sm font-semibold opacity-90"><Video className="size-4" />New · Live video-call examiner</div>
        <h2 className="mt-1 text-2xl font-extrabold">Talk to an examiner, as if it were real</h2>
        <p className="mt-1 max-w-2xl text-sm opacity-90">Hands-free conversation: the examiner speaks, waits for you, knows when you’ve finished, lets you interrupt, handles “Sorry, can you repeat?”, and asks follow-ups. Optional webcam feedback. Questions you’ve already practised are avoided.</p>
        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" className="!border-0 !bg-white !text-[#ff6a00]" onClick={() => setMode({ parts: [1, 2, 3], title: 'Live Speaking test', seed: seed(), live: true })}>Start full live test</Button>
          <Button variant="ghost" className="!text-white hover:!bg-white/15" onClick={() => setMode({ parts: [1], title: 'Live Part 1', seed: seed(), live: true })}>Part 1 only</Button>
          <Button variant="ghost" className="!text-white hover:!bg-white/15" onClick={() => setMode({ parts: [2, 3], title: 'Live Parts 2 & 3', seed: seed(), live: true })}>Parts 2 & 3</Button>
        </div>
      </section>
      <h2 className="mb-3 text-lg font-semibold">Step-by-step practice</h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card onClick={() => setMode({ parts: [1, 2, 3], title: 'Full Speaking test', seed: seed() })}>
          <div className="grad-speaking mb-3 grid size-10 place-items-center rounded-xl text-white"><Mic className="size-5" /></div>
          <h3 className="font-semibold">Full test (11–14 min)</h3><p className="text-muted mt-1 text-sm">Parts 1, 2 and 3 in order, with feedback at the end.</p>
        </Card>
        <Card onClick={() => setMode({ parts: [1], title: 'Part 1 practice', seed: seed() })}><Badge tone="brand">Part 1</Badge><h3 className="mt-2 font-semibold">Introduction & familiar topics</h3><p className="text-muted mt-1 text-sm">Home, work, hobbies, food, travel, technology and more.</p></Card>
        <Card onClick={() => setMode({ parts: [2], title: 'Part 2 cue card', seed: seed() })}><Badge tone="brand">Part 2</Badge><h3 className="mt-2 font-semibold">Random cue card</h3><p className="text-muted mt-1 text-sm">1 minute to prepare, 2 minutes to speak, then a rounding-off question.</p></Card>
        <Card onClick={() => setMode({ parts: [2, 3], title: 'Parts 2 & 3', seed: seed() })}><Badge tone="brand">Part 3</Badge><h3 className="mt-2 font-semibold">Long turn + discussion</h3><p className="text-muted mt-1 text-sm">Abstract questions on society, education, the environment and the future.</p></Card>
        <Card onClick={() => setMode('readaloud')}><div className="grad-listening mb-3 grid size-10 place-items-center rounded-xl text-white"><AudioLines className="size-5" /></div><h3 className="font-semibold">Read-aloud intelligibility drill</h3><p className="text-muted mt-1 text-sm">See which words speech recognition understood. A rough clarity check, not a band.</p></Card>
      </div>
      <h2 className="mb-3 mt-8 text-lg font-semibold">Choose a cue card</h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {CUE_CARDS.map((c) => <button key={c.id} onClick={() => setMode({ parts: [2, 3], title: c.title, cardId: c.id, seed: seed() })} className="surface rounded-xl p-3 text-left text-sm hover:surface-2"><Badge>{c.theme}</Badge><div className="mt-1 font-medium">{c.title}</div></button>)}
      </div>
      <History kind="speaking" title="Speaking history" />
    </div>
  );
}

const Back = ({ onClick }: { onClick: () => void }) => <Button variant="ghost" size="sm" icon={ArrowLeft} className="mb-4" onClick={onClick}>Back</Button>;

function ReadAloud() {
  const [i, setI] = useState(0);
  const [res, setRes] = useState<ReturnType<typeof intelligibility> | null>(null);
  const [heard, setHeard] = useState('');
  const target = READ_ALOUD[i];
  return (
    <div className="space-y-4">
      <PageHeader title="Read-aloud intelligibility" subtitle="Read the sentence aloud. Speech recognition shows which words it understood." icon={AudioLines} grad="grad-listening" />
      <Notice tone="warn">This is a rough clarity check, not a pronunciation band. Speech recognition is less accurate for some accents and in noisy rooms (Koenecke et al., 2020), so a missed word may not be your fault. IELTS assesses intelligibility, never accent.</Notice>
      <div className="surface rounded-2xl p-6">
        <p className="text-xl font-medium leading-relaxed">{target}</p>
        <div className="mt-3 flex gap-2"><Button size="sm" variant="secondary" onClick={() => void speak(target, 'examinerF')}>Hear it</Button><Button size="sm" variant="ghost" icon={Shuffle} onClick={() => { setI((i + 1) % READ_ALOUD.length); setRes(null); }}>Next sentence</Button></div>
      </div>
      {!res ? <RecordAnswer key={i} maxSeconds={20} allowEdit={false} submitLabel="Check" onSubmit={(a) => { if (a.typed) return; setHeard(a.text); setRes(intelligibility(target, a.text)); }} /> : (
        <div className="surface space-y-3 rounded-2xl p-5">
          <div className="flex items-center justify-between"><b>Recognised words</b><span className="text-2xl font-bold">{Math.round(res.ratio * 100)}%</span></div>
          <Progress value={res.ratio} grad="grad-reading" />
          <p className="text-sm"><b>Heard:</b> “{heard}”</p>
          {res.missed.length > 0 && <p className="text-sm"><b>Not recognised:</b> {res.missed.join(', ')}. Try these words slowly and clearly, stressing the right syllable.</p>}
          <Button variant="secondary" onClick={() => setRes(null)}>Try again</Button>
        </div>
      )}
      <p className="text-muted text-xs">Typed answers cannot be checked here; this drill needs a recording.</p>
    </div>
  );
}
