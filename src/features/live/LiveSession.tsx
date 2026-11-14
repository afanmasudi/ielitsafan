import { useEffect, useState } from 'react';
import type { Step } from '../../lib/speakingMachine';
import { LiveLobby, LiveReport, LiveRoom, type LiveConfig, type LiveResult } from './LiveCall';
import { PERSONAS } from '../../components/ExaminerAvatar';
import { buildSpeakingExam } from '../../content/speaking';
import { loadHistory } from '../../lib/questionHistory';
import { useActiveProfile } from '../../lib/profile';
import { freshPart3Questions } from '../../ai/questionGen';
import { Button } from '../../components/ui';
import { prefetch } from '../../ai/tts';

/** Lobby → live call → report. For the exam, questions the learner has met recently are avoided. */
export function LiveSession({ kind, title, parts, cardId, interviewSteps, cvSummary, onExit }: { kind: 'exam' | 'interview'; title: string; parts?: (1 | 2 | 3)[]; cardId?: string; interviewSteps?: Step[]; cvSummary?: string; onExit: () => void }) {
  const p = useActiveProfile();
  const [stage, setStage] = useState<'lobby' | 'call' | 'report'>('lobby');
  const [cfg, setCfg] = useState<LiveConfig | null>(null);
  const [steps, setSteps] = useState<Step[] | null>(null);
  const [result, setResult] = useState<LiveResult | null>(null);

  // Build the script as soon as the lobby opens (and when the persona changes), and voice the
  // opening lines in the background so the call starts without a pause.
  const prepare = async (persona: LiveConfig['persona']) => {
    let s = interviewSteps;
    if (!s) {
      const history = await loadHistory(p.id);
      s = buildSpeakingExam(Date.now(), { parts, cardId, history, examiner: PERSONAS[persona].name });
    }
    setSteps(s);
    for (const st of s.slice(0, 3)) if (st.kind === 'say' || st.kind === 'question') prefetch(st.text, PERSONAS[persona].voice);
    return s;
  };
  useEffect(() => { void prepare(kind === 'interview' ? 'george' : 'emma'); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const join = async (c: LiveConfig) => {
    let s = steps && (interviewSteps || steps[0]?.text.includes(PERSONAS[c.persona].name)) ? steps : await prepare(c.persona);
    if (!interviewSteps) s = await freshPart3Questions(s, await loadHistory(p.id)).catch(() => s);
    setSteps(s); setCfg(c); setStage('call');
  };
  useEffect(() => { window.scrollTo({ top: 0 }); }, [stage]);

  return (
    <div className="space-y-4">
      <Button variant="ghost" size="sm" onClick={onExit}>← Back</Button>
      {stage === 'lobby' && <LiveLobby kind={kind} title={title} onJoin={(c) => void join(c)} onPersona={(x) => void prepare(x)} />}
      {stage === 'call' && steps && cfg && <LiveRoom steps={steps} config={cfg} kind={kind} title={title} cvSummary={cvSummary} onDone={(r) => { setResult(r); setStage('report'); }} />}
      {stage === 'report' && result && <><LiveReport r={result} kind={kind} /><div className="flex gap-2"><Button onClick={() => { setResult(null); setStage('lobby'); }}>New call</Button><Button variant="secondary" onClick={onExit}>Done</Button></div></>}
    </div>
  );
}
