import { useEffect, useRef, useState } from 'react';
import { BriefcaseBusiness, Upload, ShieldCheck, Play, User, Loader2, Trash2, Save, FileText, Video } from 'lucide-react';
import { LiveSession } from '../features/live/LiveSession';
import type { Step } from '../lib/speakingMachine';
import { db } from '../lib/db';
import { useActiveProfile } from '../lib/profile';
import { extractSections, readCvFile, templateQuestions, type CvSections } from '../lib/cv';
import { analyseSpeaking, type Turn } from '../lib/speakingAnalysis';
import { chat, chatJson, isLlmReady } from '../ai/llm';
import { speak } from '../ai/tts';
import { RecordAnswer } from '../components/RecordAnswer';
import { ModelStatus } from '../components/ModelStatus';
import { Badge, Button, Confirm, Notice, PageHeader, Progress } from '../components/ui';
import { CriteriaReport } from '../components/CriteriaReport';

const LABELS: Record<keyof CvSections, string> = { education: 'Education', experience: 'Work experience', projects: 'Projects', skills: 'Skills', achievements: 'Achievements', hobbies: 'Hobbies & interests', goals: 'Career goals / profile' };

export default function Interview() {
  const p = useActiveProfile();
  const [sections, setSections] = useState<CvSections | null>(null);
  const [fileName, setFileName] = useState('');
  const [savedCv, setSavedCv] = useState(false);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [askSave, setAskSave] = useState(false);
  const [run, setRun] = useState<string[] | null>(null);
  const [live, setLive] = useState<Step[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => { void db.cvs.get(p.id).then((c) => { if (c) { setSections(c.sections as CvSections); setFileName(c.fileName); setSavedCv(true); } }); }, [p.id]);

  const onFile = async (f: File) => {
    setErr(''); setBusy(true);
    try {
      const s = extractSections(await readCvFile(f));
      if (!Object.values(s).some((v) => v.length)) throw new Error('No CV sections were found. Make sure the file uses headings such as Education, Experience and Skills, or paste your details into a TXT file.');
      setSections(s); setFileName(f.name); setSavedCv(false); setAskSave(true);
    } catch (e) { setErr((e as Error).message); }
    setBusy(false);
  };

  const questionsFor = async () => {
    if (!sections) return [];
    setBusy(true);
    let qs = templateQuestions(sections);
    if (isLlmReady()) {
      const r = await chatJson<{ questions: string[] }>([
        { role: 'system', content: 'You are a friendly professional interviewer helping someone practise spoken English. Using the CV details, write 7 open interview questions that ask about specific items in the CV (studies, roles, projects, skills, hobbies, goals). Reply only with JSON {"questions":[...]}' },
        { role: 'user', content: JSON.stringify(sections).slice(0, 3000) },
      ]).catch(() => null);
      if (r?.questions?.length && r.questions.every((q) => typeof q === 'string')) qs = ['Could you start by telling me a little about yourself?', ...r.questions.slice(0, 7)];
    }
    setBusy(false);
    return qs;
  };
  const start = async () => setRun(await questionsFor());
  const startLive = async () => {
    const qs = await questionsFor();
    setLive([
      { id: 'i0', part: 0, kind: 'say', text: 'Hello, thanks for joining the call today. I’ve had a look at your CV, and I’d like to ask you a few questions about your background and experience.' },
      ...qs.map((q, i) => ({ id: `q${i}`, part: 3 as const, kind: 'question' as const, text: q })),
      { id: 'end', part: 3, kind: 'say', text: 'That’s all my questions. Thank you very much for your time today.' },
    ]);
  };

  if (live && sections) return <LiveSession kind="interview" title="Live CV interview" interviewSteps={live} cvSummary={JSON.stringify(sections)} onExit={() => setLive(null)} />;
  if (run && sections) return <InterviewSession questions={run} sections={sections} onExit={() => setRun(null)} />;

  return (
    <div className="space-y-5">
      <PageHeader title="Personal Interview Practice" subtitle="Practise a job or study interview in English, with questions built from your own CV." icon={BriefcaseBusiness} grad="grad-gold" actions={<ModelStatus />} />
      <Notice tone="warn">This is a customised English interview exercise. It is <b>not</b> the IELTS Speaking test, which never uses your CV and follows a fixed three-part format. Use the Speaking Lab for exam practice.</Notice>
      <div className="surface rounded-2xl p-6 text-center">
        <div className="grad-gold mx-auto mb-3 grid size-14 place-items-center rounded-2xl text-white"><Upload className="size-7" /></div>
        <h2 className="font-semibold">{fileName ? `Loaded: ${fileName}` : 'Upload your CV'}</h2>
        <p className="text-muted mx-auto mt-1 max-w-md text-sm">PDF, DOCX or TXT. The file is read inside your browser and is never uploaded. It is only saved if you agree.</p>
        <Button className="mt-4" icon={busy ? Loader2 : FileText} disabled={busy} onClick={() => fileRef.current?.click()}>{busy ? 'Reading…' : fileName ? 'Choose another file' : 'Choose file'}</Button>
        <input ref={fileRef} type="file" hidden accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        {err && <Notice tone="warn" className="mt-4 text-left">{err}</Notice>}
        <p className="text-muted mt-4 flex items-center justify-center gap-1.5 text-xs"><ShieldCheck className="size-4 text-emerald-500" />Processed locally. {savedCv ? 'Saved on this device.' : 'Not saved.'}</p>
      </div>

      {sections && (
        <>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(LABELS) as (keyof CvSections)[]).filter((k) => sections[k].length).map((k) => (
              <div key={k} className="surface rounded-2xl p-4"><h3 className="mb-2 text-sm font-semibold">{LABELS[k]}</h3><ul className="text-muted list-disc space-y-0.5 pl-4 text-sm">{sections[k].slice(0, 5).map((l, i) => <li key={i} className="truncate">{l}</li>)}</ul></div>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button size="lg" icon={busy ? Loader2 : Video} disabled={busy} onClick={startLive} className="grad-gold">Live video interview</Button>
            <Button size="lg" variant="secondary" icon={busy ? Loader2 : Play} disabled={busy} onClick={start}>Step-by-step interview</Button>
            {!savedCv && <Button variant="secondary" icon={Save} onClick={() => setAskSave(true)}>Save CV details</Button>}
            {savedCv && <Button variant="ghost" icon={Trash2} onClick={async () => { await db.cvs.delete(p.id); setSavedCv(false); setSections(null); setFileName(''); }}>Delete saved CV</Button>}
          </div>
        </>
      )}
      <Confirm open={askSave} title="Save your CV details on this device?" message="Saving lets you practise again without re-uploading. Only the extracted sections are stored, in this browser, for this profile. Nothing is sent anywhere. Choose Cancel to keep them for this session only." confirmLabel="Save" onClose={() => setAskSave(false)} onConfirm={async () => { if (sections) { await db.cvs.put({ profileId: p.id, fileName, savedAt: Date.now(), sections }); setSavedCv(true); } }} />
    </div>
  );
}

function InterviewSession({ questions, sections, onExit }: { questions: string[]; sections: CvSections; onExit: () => void }) {
  const p = useActiveProfile();
  const [qs, setQs] = useState(questions);
  const [i, setI] = useState(0);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [ready, setReady] = useState(false);
  const [fuCount, setFuCount] = useState(0);
  const done = i >= qs.length;

  useEffect(() => { if (done) return; setReady(false); void speak(qs[i], 'examinerM').then(() => setReady(true)); }, [i, qs]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!done || !turns.length) return;
    const r = analyseSpeaking(turns.map((t) => ({ ...t, part: 3 })));
    void db.attempts.add({ profileId: p.id, kind: 'interview', refId: 'cv', title: 'CV interview', at: Date.now(), durationSec: 0, band: r.band, data: { turns } });
  }, [done]); // eslint-disable-line react-hooks/exhaustive-deps

  const answer = async (a: { text: string; audio?: Turn['audio']; typed: boolean }) => {
    const t: Turn = { part: 3, question: qs[i], answer: a.text, audio: a.audio, typed: a.typed };
    setTurns((x) => [...x, t]);
    if (isLlmReady() && fuCount < 3 && a.text.split(/\s+/).length > 8) {
      const fu = await chat([
        { role: 'system', content: 'You are a professional interviewer. Ask ONE natural follow-up question (under 20 words) about the candidate\'s answer, referring to a specific detail they mentioned. Output only the question.' },
        { role: 'user', content: `Question: ${qs[i]}\nAnswer: ${a.text.slice(0, 800)}\nCV summary: ${JSON.stringify(sections).slice(0, 800)}` },
      ], { maxTokens: 50 }).catch(() => '');
      const line = fu.split('\n').find((l) => l.trim().endsWith('?'))?.trim();
      if (line) { setQs((x) => [...x.slice(0, i + 1), line, ...x.slice(i + 1)]); setFuCount(fuCount + 1); }
    }
    setI((n) => n + 1);
  };

  if (done) {
    const r = analyseSpeaking(turns.map((t) => ({ ...t, part: 3 })));
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={onExit}>← Back</Button>
        <h2 className="text-xl font-bold">How naturally did you communicate?</h2>
        <CriteriaReport criteria={r.criteria} band={r.band} label="Interview" note="Interview practice estimate using the same speaking features. Not an IELTS score." />
        <div className="surface rounded-2xl p-5 text-sm"><h3 className="mb-2 font-semibold">Try this next</h3><p>{r.exercise}</p><p className="text-muted mt-2">Interview tip: structure answers with STAR (Situation, Task, Action, Result) and finish with what you learned.</p></div>
      </div>
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3"><Badge tone="brand">Question {i + 1} of {qs.length}</Badge><Progress value={i / qs.length} className="flex-1" grad="grad-gold" /><Button size="sm" variant="ghost" onClick={() => setI(qs.length)}>Finish</Button></div>
      <div className="surface flex gap-4 rounded-3xl p-6"><div className="grad-gold grid size-12 shrink-0 place-items-center rounded-2xl text-white"><User className="size-6" /></div><div><div className="text-muted text-xs font-semibold uppercase">Interviewer</div><p className="mt-1 text-lg font-medium">{qs[i]}</p></div></div>
      {ready ? <RecordAnswer key={i} onSubmit={answer} maxSeconds={120} /> : <p className="text-muted text-sm">Interviewer speaking…</p>}
    </div>
  );
}
