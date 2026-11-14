import { useEffect, useRef, useState } from 'react';
import { Sparkles, Send, Square, BookMarked, BadgeCheck, Trash2 } from 'lucide-react';
import { abortLlm, chat, isLlmReady, type Msg } from '../ai/llm';
import { searchKb, type KbEntry } from '../content/knowledge';
import { useActiveProfile, TEST_LABEL } from '../lib/profile';
import { getSetting, setSetting } from '../lib/db';
import { Badge, Button, cx, inputCls, Notice, PageHeader } from '../components/ui';

interface ChatMsg { role: 'user' | 'assistant'; content: string; sources?: KbEntry[] }

const QUICK = [
  'Explain the difference between "affect" and "effect" with examples.',
  'Correct this sentence: "Nowadays people is more depend of technology than before."',
  'Give me 3 original Task 2 questions about the environment.',
  'How should I structure a discussion essay?',
  'Give me a Part 1 question about hobbies and a strong sample answer.',
  'Explain why "NOT GIVEN" is different from "FALSE".',
  'Make a vocabulary list for the topic of urban transport.',
  'Suggest a revision plan for my weakest skill this week.',
  'How should I answer Speaking Part 3 questions about artificial intelligence?',
  'Give me 3 original Task 2 questions about AI and social media, with essay ideas.',
];

export default function Tutor() {
  const p = useActiveProfile();
  const [msgs, setMsgs] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const end = useRef<HTMLDivElement>(null);
  const key = `tutor:${p.id}`;
  useEffect(() => { void getSetting<ChatMsg[]>(key, []).then(setMsgs); }, [key]);
  useEffect(() => { end.current?.scrollIntoView({ behavior: 'smooth' }); }, [msgs]);
  const ready = isLlmReady();

  const send = async (text: string) => {
    if (!text.trim() || busy) return;
    const sources = searchKb(text, 3);
    const next: ChatMsg[] = [...msgs, { role: 'user', content: text }];
    setMsgs([...next, { role: 'assistant', content: '', sources }]);
    setInput('');
    if (!ready) {
      const offline = sources.length ? sources.map((s) => `**${s.title}**\n${s.body}`).join('\n\n') : 'No matching entry in the offline knowledge base. Load a local AI model in Settings → Models for open questions.';
      const done = [...next, { role: 'assistant' as const, content: offline, sources }];
      setMsgs(done); void setSetting(key, done.slice(-40));
      return;
    }
    setBusy(true);
    const system: Msg = { role: 'system', content: `You are a patient, accurate IELTS tutor for a ${TEST_LABEL[p.testType]} learner (level ${p.currentLevel}, target ${p.testType === 'lifeskills' ? 'Pass' : 'Band ' + p.target}). Use British English. Be concise and use short examples. When you state facts about the IELTS test format or scoring, rely only on the reference notes below; if unsure, say so. Never claim to give official scores. Any practice questions you write must be original.\n\nReference notes:\n${sources.map((s) => `- ${s.title}: ${s.body}`).join('\n')}` };
    const history: Msg[] = next.slice(-8).map((m) => ({ role: m.role, content: m.content }));
    let out: string;
    try {
      out = await chat([system, ...history], { onToken: (t) => setMsgs([...next, { role: 'assistant', content: t, sources }]), maxTokens: 800 });
    } catch (e) { out = `⚠️ ${(e as Error).message}`; }
    const done = [...next, { role: 'assistant' as const, content: out, sources }];
    setMsgs(done); setBusy(false);
    void setSetting(key, done.slice(-40));
  };

  return (
    <div className="flex min-h-[calc(100vh-12rem)] flex-col">
      <PageHeader title="AI Tutor" subtitle="Grammar, vocabulary, essay structure and practice questions, generated on your device." icon={Sparkles}
        actions={msgs.length > 0 && <Button size="sm" variant="ghost" icon={Trash2} onClick={() => { setMsgs([]); void setSetting(key, []); }}>Clear</Button>} />
      {!ready && <Notice tone="warn" className="mb-4">No local AI model is loaded, so the tutor is in <b>offline mode</b> and answers from the built-in knowledge base only. <a href="#/settings" className="underline">Load a model</a> (needs WebGPU) for full conversations.</Notice>}
      <div className="flex-1 space-y-4">
        {!msgs.length && (
          <div className="grid gap-2 sm:grid-cols-2">{QUICK.map((q) => <button key={q} onClick={() => send(q)} className="surface rounded-xl p-3 text-left text-sm hover:surface-2">{q}</button>)}</div>
        )}
        {msgs.map((m, i) => (
          <div key={i} className={cx('flex', m.role === 'user' ? 'justify-end' : 'justify-start')}>
            <div className={cx('max-w-[90%] rounded-2xl px-4 py-3 text-sm sm:max-w-[75%]', m.role === 'user' ? 'grad-brand text-white' : 'surface')}>
              <div className="whitespace-pre-wrap leading-6">{m.content || (busy && i === msgs.length - 1 ? '…' : '')}</div>
              {m.role === 'assistant' && m.sources && m.sources.length > 0 && (
                <div className="mt-3 space-y-1 border-t border-soft pt-2">
                  {m.sources.map((s) => <div key={s.id} className="text-muted flex items-center gap-1.5 text-xs">{s.verified ? <BadgeCheck className="size-3.5 text-emerald-500" /> : <BookMarked className="size-3.5" />}<span>{s.title}</span><Badge tone={s.verified ? 'good' : 'neutral'}>{s.verified ? 'official info' : 'teaching advice'}</Badge></div>)}
                  {ready && <div className="text-muted text-[11px]">AI-generated answer. Check important facts against the official IELTS website.</div>}
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={end} />
      </div>
      <form onSubmit={(e) => { e.preventDefault(); void send(input); }} className="sticky bottom-20 mt-4 flex gap-2 lg:bottom-4">
        <input className={cx(inputCls, 'shadow-lg')} value={input} onChange={(e) => setInput(e.target.value)} placeholder={ready ? 'Ask anything about IELTS English…' : 'Search the offline knowledge base…'} />
        {busy ? <Button type="button" variant="danger" icon={Square} onClick={() => void abortLlm()} aria-label="Stop" /> : <Button type="submit" icon={Send} disabled={!input.trim()} aria-label="Send" />}
      </form>
    </div>
  );
}
