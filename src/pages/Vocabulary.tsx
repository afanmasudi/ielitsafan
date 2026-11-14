import { useEffect, useState } from 'react';
import { Layers, Plus, Volume2, RotateCcw, Check, Trash2, Sparkles, Loader2 } from 'lucide-react';
import { db, logStudy, type VocabCard } from '../lib/db';
import { useActiveProfile } from '../lib/profile';
import { VOCAB } from '../content/vocab';
import { review, newSrs, isLearned, type Grade } from '../lib/srs';
import { speak } from '../ai/tts';
import { chatJson, isLlmReady } from '../ai/llm';
import { Badge, Button, Empty, Field, inputCls, Modal, Notice, PageHeader, Stat, Tabs } from '../components/ui';

export default function Vocabulary() {
  const p = useActiveProfile();
  const [cards, setCards] = useState<VocabCard[]>([]);
  const [tab, setTab] = useState<'review' | 'topics' | 'mine'>('review');
  const [adding, setAdding] = useState(false);
  const load = () => db.vocab.where('profileId').equals(p.id).toArray().then(setCards);
  useEffect(() => { void load(); }, [p.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const due = cards.filter((c) => c.due <= Date.now()).sort((a, b) => a.due - b.due);
  const has = new Set(cards.map((c) => c.word.toLowerCase()));
  const add = async (word: string, meaning: string, example: string, topic: string) => {
    if (has.has(word.toLowerCase())) return;
    await db.vocab.add({ profileId: p.id, word, meaning, example, topic, addedAt: Date.now(), ...newSrs() });
    await load();
  };

  return (
    <div>
      <PageHeader title="Vocabulary" subtitle="Topic word lists with spaced-repetition review, so words come back just before you forget them." icon={Layers} grad="grad-reading"
        actions={<Button icon={Plus} onClick={() => setAdding(true)}>Add word</Button>} />
      <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-3">
        <Stat label="Due now" value={due.length} icon={RotateCcw} />
        <Stat label="In deck" value={cards.length} icon={Layers} grad="grad-reading" />
        <Stat label="Learned" value={cards.filter(isLearned).length} sub="21+ day interval" icon={Check} grad="grad-gold" />
      </div>
      <Tabs className="mb-4" value={tab} onChange={setTab} options={[{ value: 'review', label: `Review (${due.length})` }, { value: 'topics', label: 'Topic lists' }, { value: 'mine', label: 'My deck' }]} />
      {tab === 'review' && <Review due={due} onDone={load} profileId={p.id} />}
      {tab === 'topics' && <Topics has={has} add={add} />}
      {tab === 'mine' && (cards.length ? (
        <div className="surface divide-y divide-[var(--border)] rounded-2xl">
          {cards.sort((a, b) => a.word.localeCompare(b.word)).map((c) => (
            <div key={c.id} className="flex items-center gap-3 p-3 text-sm">
              <div className="min-w-0 flex-1"><b>{c.word}</b> <span className="text-muted">· {c.meaning}</span><div className="text-muted text-xs">Next review {new Date(c.due).toLocaleDateString()} · interval {c.interval} d</div></div>
              <Badge>{c.topic}</Badge>
              <button className="text-muted p-2 hover:text-rose-500" aria-label={`Remove ${c.word}`} onClick={async () => { await db.vocab.delete(c.id!); await load(); }}><Trash2 className="size-4" /></button>
            </div>
          ))}
        </div>
      ) : <Empty icon={Layers} title="Your deck is empty" text="Add words from the topic lists, or your own words." action={<Button onClick={() => setTab('topics')}>Browse topics</Button>} />)}
      <AddWord open={adding} onClose={() => setAdding(false)} onAdd={async (w, m, e) => { await add(w, m, e, 'My words'); setAdding(false); }} />
    </div>
  );
}

function Review({ due, onDone, profileId }: { due: VocabCard[]; onDone: () => void; profileId: string }) {
  const [flip, setFlip] = useState(false);
  const c = due[0];
  if (!c) return <Empty icon={Check} title="All caught up" text="No cards are due. Add words from the topic lists to build your deck." />;
  const grade = async (g: Grade) => {
    const s = review(c, g);
    await db.vocab.update(c.id!, s);
    if (g > 0) await logStudy(profileId, 0, `vocab-${new Date().toISOString().slice(0, 10)}`);
    setFlip(false); onDone();
  };
  return (
    <div className="mx-auto max-w-xl">
      <button onClick={() => setFlip(true)} className="surface relative block min-h-64 w-full rounded-3xl p-8 text-center">
        <Badge className="absolute left-4 top-4">{c.topic}</Badge>
        <div className="mt-8 text-3xl font-bold">{c.word}</div>
        {!flip ? <p className="text-muted mt-6 text-sm">Try to recall the meaning, then tap to reveal.</p> : (
          <div className="mt-6 space-y-3 animate-fade-up"><p className="text-lg">{c.meaning}</p><p className="text-muted italic">“{c.example}”</p></div>
        )}
      </button>
      <div className="mt-3 flex justify-center"><Button size="sm" variant="ghost" icon={Volume2} onClick={() => void speak(`${c.word}. ${c.example}`, 'examinerF')}>Listen</Button></div>
      {flip && (
        <div className="mt-4 grid grid-cols-4 gap-2">
          {(['Again', 'Hard', 'Good', 'Easy'] as const).map((l, i) => <Button key={l} variant={i === 0 ? 'danger' : i === 2 ? 'primary' : 'secondary'} onClick={() => grade(i as Grade)}>{l}</Button>)}
        </div>
      )}
      <p className="text-muted mt-3 text-center text-xs">{due.length} card(s) due</p>
    </div>
  );
}

function Topics({ has, add }: { has: Set<string>; add: (w: string, m: string, e: string, t: string) => Promise<void> }) {
  const [topic, setTopic] = useState(Object.keys(VOCAB)[0]);
  const [aiTopic, setAiTopic] = useState('');
  const [aiList, setAiList] = useState<{ word: string; meaning: string; example: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const gen = async () => {
    setBusy(true);
    const r = await chatJson<{ words: { word: string; meaning: string; example: string }[] }>([
      { role: 'system', content: 'You create IELTS vocabulary lists. Reply only with JSON: {"words":[{"word":"","meaning":"","example":""}]}. 8 useful, accurate B2–C1 words or collocations with simple definitions and natural example sentences.' },
      { role: 'user', content: `Topic: ${aiTopic}` },
    ]).catch(() => null);
    setAiList(r?.words?.filter((w) => w.word && w.meaning).slice(0, 10) ?? []);
    setBusy(false);
  };
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">{Object.keys(VOCAB).map((t) => <button key={t} onClick={() => setTopic(t)} className={`rounded-xl px-3 py-1.5 text-sm ${t === topic ? 'grad-brand text-white' : 'surface'}`}>{t}</button>)}</div>
      <div className="grid gap-3 sm:grid-cols-2">
        {VOCAB[topic].map((v) => (
          <div key={v.word} className="surface rounded-2xl p-4">
            <div className="flex items-start justify-between gap-2"><b className="text-lg">{v.word}</b><Button size="sm" variant={has.has(v.word.toLowerCase()) ? 'ghost' : 'soft'} disabled={has.has(v.word.toLowerCase())} icon={has.has(v.word.toLowerCase()) ? Check : Plus} onClick={() => add(v.word, v.meaning, v.example, topic)}>{has.has(v.word.toLowerCase()) ? 'In deck' : 'Add'}</Button></div>
            <p className="text-sm">{v.meaning}</p>
            <p className="text-muted mt-1 text-sm italic">“{v.example}”</p>
            {v.collocations && <p className="mt-1 text-xs"><b>Collocations:</b> {v.collocations}</p>}
          </div>
        ))}
      </div>
      <div className="surface space-y-3 rounded-2xl p-4">
        <h3 className="flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-[var(--accent)]" />Generate a list for any topic (local AI)</h3>
        {!isLlmReady() ? <p className="text-muted text-sm">Load a model in Settings → Models to generate topic lists.</p> : (
          <>
            <div className="flex gap-2"><input className={inputCls} value={aiTopic} onChange={(e) => setAiTopic(e.target.value)} placeholder="e.g. space exploration" /><Button disabled={!aiTopic || busy} icon={busy ? Loader2 : Sparkles} onClick={gen}>Generate</Button></div>
            <Notice tone="warn">AI-generated words can contain mistakes. Check them before you learn them.</Notice>
            {aiList.map((v) => <div key={v.word} className="surface-2 flex items-start justify-between gap-2 rounded-xl p-3 text-sm"><div><b>{v.word}</b> · {v.meaning}<div className="text-muted italic">{v.example}</div></div><Button size="sm" variant="soft" icon={Plus} disabled={has.has(v.word.toLowerCase())} onClick={() => add(v.word, v.meaning, v.example, aiTopic)}>Add</Button></div>)}
          </>
        )}
      </div>
    </div>
  );
}

function AddWord({ open, onClose, onAdd }: { open: boolean; onClose: () => void; onAdd: (w: string, m: string, e: string) => void }) {
  const [w, setW] = useState(''); const [m, setM] = useState(''); const [e, setE] = useState('');
  return (
    <Modal open={open} onClose={onClose} title="Add your own word">
      <div className="space-y-3">
        <Field label="Word or phrase"><input className={inputCls} value={w} onChange={(x) => setW(x.target.value)} /></Field>
        <Field label="Meaning"><input className={inputCls} value={m} onChange={(x) => setM(x.target.value)} /></Field>
        <Field label="Example sentence"><input className={inputCls} value={e} onChange={(x) => setE(x.target.value)} /></Field>
        <Button className="w-full" disabled={!w.trim() || !m.trim()} onClick={() => { onAdd(w.trim(), m.trim(), e.trim()); setW(''); setM(''); setE(''); }}>Add to deck</Button>
      </div>
    </Modal>
  );
}
