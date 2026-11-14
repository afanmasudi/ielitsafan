import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Captions, Keyboard, Send, Loader2, Download, CheckCircle2, Timer, ScanFace, Eye, EyeOff, Activity, Sparkles } from 'lucide-react';
import { LiveEngine, type LiveEvent, type LiveTurn, type LiveView } from './engine';
import { LiveMic } from '../../lib/vad';
import { micErrorMessage } from '../../lib/recorder';
import type { Step } from '../../lib/speakingMachine';
import { ExaminerAvatar, PERSONAS, type Persona } from '../../components/ExaminerAvatar';
import { FaceSession, type FaceSummary } from '../../lib/faceMetrics';
import { analyseSpeaking, type SpeakingReport } from '../../lib/speakingAnalysis';
import { words } from '../../lib/text';
import { db, recordMistakes } from '../../lib/db';
import { remember } from '../../lib/questionHistory';
import { useActiveProfile } from '../../lib/profile';
import { relevanceLabel } from '../../lib/intent';
import { useAllModelStates } from '../../ai/store';
import { DEFAULT_STT } from '../../ai/models';
import { loadStt, isSttReady } from '../../ai/stt';
import { loadTts, isTtsReady, TTS_ID, unlockAudio, unloadTts, voiceSpeedRatio } from '../../ai/tts';
import { getDevice } from '../../ai/device';
import { getSetting, setSetting } from '../../lib/db';
import { loadEmbed, isEmbedReady, EMBED_ID } from '../../ai/embed';
import { loadFace, readFace, FACE_ID, isFaceReady } from '../../ai/face';
import { isLlmReady } from '../../ai/llm';
import { CriteriaReport } from '../../components/CriteriaReport';
import { Badge, Button, cx, inputCls, Notice, Progress } from '../../components/ui';

export interface LiveConfig { persona: Persona; camera: boolean; bargeIn: boolean; followUps: boolean }

/* ------------------------------------------------------------------ Lobby */

export function LiveLobby({ kind, onJoin, title, onPersona }: { kind: 'exam' | 'interview'; title: string; onJoin: (c: LiveConfig) => void; onPersona?: (p: Persona) => void }) {
  const all = useAllModelStates();
  const [cfg, setCfg] = useState<LiveConfig>({ persona: kind === 'interview' ? 'george' : 'emma', camera: false, bargeIn: false, followUps: true });
  const [preview, setPreview] = useState<MediaStream | null>(null);
  const [camErr, setCamErr] = useState('');
  const vid = useRef<HTMLVideoElement>(null);
  useEffect(() => { if (vid.current && preview) vid.current.srcObject = preview; }, [preview]);
  useEffect(() => () => preview?.getTracks().forEach((t) => t.stop()), [preview]);

  const toggleCam = async () => {
    if (cfg.camera) { preview?.getTracks().forEach((t) => t.stop()); setPreview(null); setCfg({ ...cfg, camera: false }); return; }
    try { setCamErr(''); setPreview(await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } })); setCfg({ ...cfg, camera: true }); void loadFace().catch(() => undefined); }
    catch { setCamErr('Camera not available or permission denied. You can join without video.'); }
  };

  const rows: { id: string; label: string; size: string; need: string; ready: boolean; load: () => Promise<unknown> }[] = [
    { id: DEFAULT_STT, label: 'Speech recognition (Whisper Tiny)', size: '41 MB', need: 'Required', ready: isSttReady(), load: () => loadStt() },
    { id: TTS_ID, label: 'Natural examiner voice (Kokoro)', size: '92 MB', need: 'Recommended', ready: isTtsReady(), load: loadTts },
    { id: EMBED_ID, label: 'Meaning model for intent & relevance (MiniLM)', size: '23 MB', need: 'Recommended', ready: isEmbedReady(), load: loadEmbed },
    ...(cfg.camera ? [{ id: FACE_ID, label: 'Face tracking (MediaPipe)', size: '4 MB', need: 'For webcam feedback', ready: isFaceReady(), load: loadFace }] : []),
  ];
  const sttOk = isSttReady();
  return (
    <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
      <div className="relative aspect-video overflow-hidden rounded-3xl bg-zinc-900">
        {cfg.camera && preview ? <video ref={vid} autoPlay muted playsInline className="h-full w-full -scale-x-100 object-cover" /> : (
          <div className="grid h-full place-items-center text-white/70"><div className="text-center"><VideoOff className="mx-auto size-10" /><p className="mt-2 text-sm">Camera off</p></div></div>
        )}
        <div className="absolute bottom-3 left-3 flex gap-2">
          <button onClick={toggleCam} className={cx('grid size-12 place-items-center rounded-full text-white', cfg.camera ? 'bg-white/20' : 'bg-rose-600')} aria-label="Toggle camera">{cfg.camera ? <Video className="size-5" /> : <VideoOff className="size-5" />}</button>
        </div>
      </div>
      <div className="surface space-y-4 rounded-3xl p-5">
        <div><h2 className="text-lg font-bold">{title}</h2><p className="text-muted text-sm">A live, turn-by-turn call. Speak naturally: the {kind === 'exam' ? 'examiner' : 'interviewer'} waits for you to finish, can be interrupted, and asks follow-up questions.</p></div>
        <div>
          <span className="mb-2 block text-sm font-medium">{kind === 'exam' ? 'Examiner' : 'Interviewer'}</span>
          <div className="grid grid-cols-2 gap-2">{(Object.keys(PERSONAS) as Persona[]).map((p) => (
            <button key={p} onClick={() => { setCfg({ ...cfg, persona: p }); onPersona?.(p); }} className={cx('flex items-center gap-2 rounded-2xl border p-2 text-left text-sm', cfg.persona === p ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-soft')}>
              <div className="size-12 overflow-hidden rounded-xl"><ExaminerAvatar persona={p} mood="idle" userSpeaking={false} /></div><div><b>{PERSONAS[p].name}</b><div className="text-muted text-xs">British {p === 'emma' ? 'female' : 'male'} voice</div></div>
            </button>
          ))}</div>
        </div>
        <div className="space-y-2">
          {rows.map((r) => {
            const st = all[r.id];
            const ready = r.ready || st?.status === 'ready';
            return (
              <div key={r.id} className="surface-2 flex items-center gap-3 rounded-xl p-2.5 text-sm">
                {ready ? <CheckCircle2 className="size-5 shrink-0 text-emerald-500" /> : st?.status === 'loading' ? <Loader2 className="size-5 shrink-0 animate-spin text-[var(--accent)]" /> : <Download className="text-muted size-5 shrink-0" />}
                <div className="min-w-0 flex-1"><div className="truncate font-medium">{r.label}</div><div className="text-muted text-xs">{r.need} · {r.size}{st?.status === 'loading' && ` · ${Math.round(st.progress * 100)}%`}{st?.status === 'error' && ` · ${st.error}`}</div></div>
                {!ready && st?.status !== 'loading' && <Button size="sm" variant="soft" onClick={() => void r.load().catch(() => undefined)}>Download</Button>}
              </div>
            );
          })}
          <p className="text-muted text-xs">AI follow-up questions {isLlmReady() ? 'are on (local language model loaded).' : 'use the built-in bank. Load a language model in Settings for open follow-ups.'}</p>
        </div>
        <label className="flex items-center justify-between gap-3 text-sm"><span>Let me interrupt the {kind === 'exam' ? 'examiner' : 'interviewer'} <span className="text-muted block text-xs">Best with headphones. On speakers, the {kind === 'exam' ? 'examiner' : 'interviewer'}’s own voice can be mistaken for you.</span></span><input type="checkbox" className="size-5 accent-[var(--accent)]" checked={cfg.bargeIn} onChange={(e) => setCfg({ ...cfg, bargeIn: e.target.checked })} /></label>
        <label className="flex items-center justify-between gap-3 text-sm"><span>Follow-up questions</span><input type="checkbox" className="size-5 accent-[var(--accent)]" checked={cfg.followUps} onChange={(e) => setCfg({ ...cfg, followUps: e.target.checked })} /></label>
        <MicCheck />
        <VoiceSpeedHint />
        {camErr && <Notice tone="warn">{camErr}</Notice>}
        <Notice><span className="text-xs">Use headphones for the best turn-taking. Audio and video are analysed on this device and never recorded or uploaded. {cfg.camera && 'Webcam feedback is about on-camera presence only; IELTS does not mark body language.'}</span></Notice>
        <Button size="lg" className="w-full grad-speaking" disabled={!sttOk && all[DEFAULT_STT]?.status !== 'ready'} onClick={() => { unlockAudio(); preview?.getTracks().forEach((t) => t.stop()); onJoin(cfg); }}>{sttOk || all[DEFAULT_STT]?.status === 'ready' ? 'Join call' : 'Download speech recognition to join'}</Button>
      </div>
    </div>
  );
}

/** If the neural voice runs slower than real time on this device, suggest the GPU voice. */
function VoiceSpeedHint() {
  const [ratio, setRatio] = useState(0);
  const [gpu, setGpu] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setRatio(voiceSpeedRatio()), 1500);
    void getDevice().then((d) => setGpu(d.webgpu && !d.mobile));
    void getSetting('ttsGpu', false).then((v) => v && setGpu(false));
    return () => clearInterval(t);
  }, []);
  if (!gpu || ratio < 0.9) return null;
  return (
    <Notice tone="warn">
      <span className="text-xs">The examiner voice is running on your CPU ({ratio.toFixed(1)}× slower than speech), so replies may lag. Your device supports a faster GPU voice (one-off 326 MB download).</span>
      <Button size="sm" variant="soft" className="mt-2" onClick={async () => { await setSetting('ttsGpu', true); unloadTts(); await loadTts().catch(() => undefined); setGpu(false); }}>Switch to GPU voice</Button>
    </Notice>
  );
}

/** Live microphone test: level meter plus confirmation that speech is detected. */
function MicCheck() {
  const [on, setOn] = useState(false);
  const [level, setLevel] = useState(0);
  const [heard, setHeard] = useState(false);
  const [err, setErr] = useState('');
  const mic = useRef<LiveMic | null>(null);
  useEffect(() => () => mic.current?.close(), []);
  const start = async () => {
    try {
      setErr('');
      const m = new LiveMic();
      await m.open();
      mic.current = m;
      m.on((e) => { if (e.type === 'start') setHeard(true); });
      setOn(true);
      const t = setInterval(() => { if (!mic.current) return clearInterval(t); setLevel(m.level); }, 80);
    } catch (e) { setErr(micErrorMessage(e)); }
  };
  const stop = () => { mic.current?.close(); mic.current = null; setOn(false); setLevel(0); };
  return (
    <div className="surface-2 space-y-2 rounded-xl p-3 text-sm">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium">Microphone check</span>
        {on ? <Button size="sm" variant="ghost" onClick={stop}>Stop</Button> : <Button size="sm" variant="soft" icon={Mic} onClick={start}>Test mic</Button>}
      </div>
      {on && <>
        <div className="h-2 overflow-hidden rounded-full bg-black/10"><div className="h-full bg-emerald-500 transition-all" style={{ width: `${Math.min(100, level * 100)}%` }} /></div>
        <p className={cx('text-xs', heard ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted')}>{heard ? '✓ Speech detected. Your microphone works.' : 'Say a sentence, e.g. “Hello, my name is…”'}</p>
      </>}
      {err && <p className="text-xs text-rose-500">{err}</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ Room */

export interface LiveResult { turns: LiveTurn[]; events: LiveEvent[]; face: FaceSummary | null; report: SpeakingReport; attemptId: number }

export function LiveRoom({ steps, config, kind, title, cvSummary, mockId, onDone }: { steps: Step[]; config: LiveConfig; kind: 'exam' | 'interview'; title: string; cvSummary?: string; mockId?: string; onDone: (r: LiveResult) => void }) {
  const profile = useActiveProfile();
  const persona = PERSONAS[config.persona];
  const [view, setView] = useState<LiveView>({ phase: 'connecting', caption: 'Connecting…', who: '', part: 1, progress: 0 });
  const [turns, setTurns] = useState<LiveTurn[]>([]);
  const [lastEvent, setLastEvent] = useState<LiveEvent | null>(null);
  const [muted, setMuted] = useState(false);
  const [cc, setCc] = useState(true);
  const [typing, setTyping] = useState(false);
  const [typed, setTyped] = useState('');
  const [notes, setNotes] = useState('');
  const [camOn, setCamOn] = useState(config.camera);
  const [face, setFace] = useState({ present: false, looking: true, mouth: false });
  const [userLevel, setUserLevel] = useState(0);
  const [err, setErr] = useState('');
  const engine = useRef<LiveEngine | null>(null);
  const video = useRef<HTMLVideoElement>(null);
  const camStream = useRef<MediaStream | null>(null);
  const faceSession = useRef(new FaceSession());
  const faceNow = useRef({ present: false, moving: false, stillSince: 0 });
  const started = useRef(Date.now());

  // Start the conversation engine.
  useEffect(() => {
    const e = new LiveEngine(steps, { voice: persona.voice, context: kind, bargeIn: config.bargeIn, followUps: config.followUps, cvSummary }, {
      onView: (v) => setView((x) => ({ ...x, ...v })),
      onTurn: (t) => setTurns((x) => [...x, t]),
      onEvent: setLastEvent,
      onEnd: (r) => void finish(r.turns, r.events),
      mouthStill: () => camOnRef.current && faceNow.current.present && !faceNow.current.moving && performance.now() - faceNow.current.stillSince > 600,
    });
    engine.current = e;
    e.start().catch((x) => setErr(`Microphone problem: ${(x as Error).message}. Allow microphone access, or use the typed Speaking Lab.`));
    const lv = setInterval(() => setUserLevel(e.mic.level), 120);
    return () => { clearInterval(lv); e.stop(); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const camOnRef = useRef(camOn);
  camOnRef.current = camOn;

  // Webcam + face tracking loop (~8 fps).
  useEffect(() => {
    if (!camOn) { camStream.current?.getTracks().forEach((t) => t.stop()); camStream.current = null; return; }
    let raf = 0, last = 0, lastUi = 0, alive = true;
    void (async () => {
      try {
        camStream.current = await navigator.mediaDevices.getUserMedia({ video: { width: 640, height: 480, facingMode: 'user' } });
        if (!alive) return;
        if (video.current) { video.current.srcObject = camStream.current; await video.current.play().catch(() => undefined); }
        await loadFace().catch(() => undefined);
      } catch { setCamOn(false); return; }
      const loop = (t: number) => {
        raf = requestAnimationFrame(loop);
        if (t - last < 120 || !video.current || !isFaceReady()) return;
        last = t;
        const r = readFace(video.current, t);
        const moving = faceSession.current.mouthMoving(r.jawOpen);
        if (moving || !faceNow.current.moving) faceNow.current.stillSince = moving ? 0 : faceNow.current.stillSince || t;
        faceNow.current = { present: r.present, moving, stillSince: moving ? 0 : faceNow.current.stillSince || t };
        faceSession.current.add({ t, present: r.present, jawOpen: r.jawOpen, smile: r.smile, gazeAway: r.gazeAway, yaw: r.yaw, pitch: r.pitch, audioSpeaking: !!engine.current?.mic.vad.speaking });
        if (t - lastUi > 400) { lastUi = t; setFace({ present: r.present, looking: r.present && r.gazeAway < 0.45 && Math.abs(r.yaw) < 22 && r.pitch < 20, mouth: moving }); }
      };
      raf = requestAnimationFrame(loop);
    })();
    return () => { alive = false; cancelAnimationFrame(raf); camStream.current?.getTracks().forEach((t) => t.stop()); };
  }, [camOn]);

  const done = useRef(false);
  async function finish(allTurns: LiveTurn[], events: LiveEvent[]) {
    if (done.current) return;
    done.current = true;
    const report = analyseSpeaking(allTurns.length ? allTurns : [{ part: 1, question: '', answer: '' }]);
    const faceSummary = faceSession.current.frames.length > 20 ? faceSession.current.summary() : null;
    const totalWords = allTurns.reduce((s, t) => s + words(t.answer).length, 0);
    const fillerCount = Object.values(report.fillers).reduce((a, b) => a + b, 0);
    const voiced = allTurns.reduce((s, t) => s + (t.audio?.voiced ?? 0), 0);
    const pauses = allTurns.reduce((s, t) => s + (t.audio?.longPauses ?? 0), 0);
    const lat = allTurns.map((t) => t.latencyMs).filter((x): x is number => typeof x === 'number');
    const metrics = { wpm: report.wpm, fillersPer100: totalWords ? (fillerCount / totalWords) * 100 : 0, avgAnswerWords: allTurns.length ? totalWords / allTurns.length : 0, pausesPerMin: voiced > 10 ? pauses / (voiced / 60) : null, band: report.band, latencyMs: lat.length ? lat.reduce((a, b) => a + b, 0) / lat.length : null };
    const attemptId = await db.attempts.add({ profileId: profile.id, kind: kind === 'exam' ? 'speaking' : 'interview', refId: 'live', title: `${title} (live call)`, at: Date.now(), durationSec: Math.round((Date.now() - started.current) / 1000), band: report.band, mockId, data: { turns: allTurns, events, face: faceSummary, metrics, live: true, criteria: report.criteria.map((c) => ({ name: c.name, band: c.band })) } });
    await recordMistakes(profile.id, 'speaking', report.issues.map((i) => ({ type: i.type, example: `${i.match} → ${i.suggestion ?? ''}` })));
    await remember(profile.id, steps.filter((s) => s.kind === 'question' || s.kind === 'cue').map((s) => s.text));
    onDone({ turns: allTurns, events, face: faceSummary, report, attemptId });
  }

  const mood = view.phase === 'examiner' ? 'speaking' : view.phase === 'thinking' ? 'thinking' : view.phase === 'listening' ? 'listening' : 'idle';
  const status = { connecting: 'Connecting', examiner: `${persona.name} is speaking`, listening: 'Listening to you', thinking: 'Thinking…', prep: 'Preparation', ended: 'Call ended' }[view.phase];
  const youSpeaking = !!engine.current?.mic.vad.speaking && !muted;
  const sendTyped = () => { if (typed.trim()) { engine.current?.type(typed.trim()); setTyped(''); setTyping(false); } };

  return (
    <div className="space-y-3">
      {err && <Notice tone="warn">{err}</Notice>}
      <div className="relative overflow-hidden rounded-3xl bg-zinc-950">
        {/* Top bar */}
        <div className="absolute inset-x-0 top-0 z-10 flex items-center gap-2 bg-gradient-to-b from-black/60 to-transparent p-3 text-white">
          <span className="flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur"><span className={cx('size-2 rounded-full', view.phase === 'listening' ? 'animate-pulse bg-emerald-400' : view.phase === 'examiner' ? 'bg-sky-400' : 'bg-amber-400')} />{status}</span>
          {kind === 'exam' && <span className="rounded-full bg-white/15 px-2.5 py-1 text-xs backdrop-blur">Part {view.part}</span>}
          {view.talkLeft !== undefined && view.phase === 'listening' && view.talkLeft > 0 && view.talkLeft < 120 && <span className="flex items-center gap-1 rounded-full bg-rose-500/80 px-2.5 py-1 text-xs font-semibold"><Timer className="size-3.5" />{Math.floor(view.talkLeft / 60)}:{String(view.talkLeft % 60).padStart(2, '0')}</span>}
          <div className="ml-auto w-24"><Progress value={view.progress} className="bg-white/20" grad="bg-white" /></div>
        </div>

        {/* Examiner tile */}
        <div className="relative mx-auto aspect-[4/3] max-h-[68vh] w-full sm:aspect-video">
          <ExaminerAvatar persona={config.persona} mood={mood} userSpeaking={youSpeaking} />
          <span className="absolute bottom-3 left-3 rounded-lg bg-black/55 px-2 py-1 text-xs text-white backdrop-blur">{persona.name} · {kind === 'exam' ? 'IELTS examiner (simulated)' : 'Interviewer (simulated)'}</span>
          {lastEvent && Date.now() - lastEvent.at < 4000 && <span className="absolute left-3 top-14 rounded-lg bg-[var(--accent)]/80 px-2 py-1 text-xs text-white">{({ 'barge-in': 'You interrupted', nudge: 'Encouraging you', interrupt: 'Examiner interrupted', repeat: 'Repeating the question', clarify: 'Clarification requested', 'ask-examiner': 'Question to the examiner detected', thinking: 'Thinking time', silence: 'Nothing heard', 'follow-up': 'Follow-up question', 'off-topic': 'Answer seems off-topic', 'give-up': 'Moving on' } as Record<string, string>)[lastEvent.kind]}</span>}
        </div>

        {/* Self view */}
        <div className="absolute bottom-24 right-3 w-28 overflow-hidden rounded-2xl border-2 border-white/20 bg-zinc-800 sm:bottom-24 sm:w-44">
          {camOn ? <video ref={video} autoPlay muted playsInline className="aspect-[4/3] w-full -scale-x-100 object-cover" /> : <div className="grid aspect-[4/3] place-items-center text-white/60"><VideoOff className="size-6" /></div>}
          <div className={cx('absolute inset-0 rounded-2xl ring-4 transition', youSpeaking ? 'ring-emerald-400/80' : 'ring-transparent')} />
          {camOn && <div className="absolute inset-x-1 bottom-1 flex flex-wrap gap-1 text-[10px] text-white">
            <span className="flex items-center gap-0.5 rounded bg-black/60 px-1"><ScanFace className="size-3" />{face.present ? 'Face' : 'No face'}</span>
            {face.present && <span className="flex items-center gap-0.5 rounded bg-black/60 px-1">{face.looking ? <Eye className="size-3" /> : <EyeOff className="size-3" />}{face.looking ? 'Eye contact' : 'Looking away'}</span>}
            {face.present && face.mouth && <span className="flex items-center gap-0.5 rounded bg-black/60 px-1"><Activity className="size-3" />Talking</span>}
          </div>}
          <div className="absolute left-1 top-1 h-1.5 w-12 overflow-hidden rounded bg-black/50"><div className="h-full bg-emerald-400 transition-all" style={{ width: `${muted ? 0 : userLevel * 100}%` }} /></div>
        </div>

        {/* Captions */}
        {cc && view.caption && <div className="absolute inset-x-3 bottom-24 z-10 mr-32 sm:mr-48"><p className={cx('inline-block rounded-xl px-3 py-2 text-sm text-white backdrop-blur', view.who === 'you' ? 'bg-emerald-700/70' : 'bg-black/65')}>{view.who === 'you' ? 'You: ' : view.who === 'examiner' ? `${persona.name}: ` : ''}{view.caption}</p></div>}

        {/* Controls */}
        <div className="flex items-center justify-center gap-3 bg-zinc-900 p-4">
          <button onClick={() => { setMuted(!muted); engine.current?.mute(!muted); }} className={cx('grid size-12 place-items-center rounded-full text-white', muted ? 'bg-rose-600' : 'bg-white/15 hover:bg-white/25')} aria-label={muted ? 'Unmute' : 'Mute'}>{muted ? <MicOff className="size-5" /> : <Mic className="size-5" />}</button>
          <button onClick={() => setCamOn(!camOn)} className={cx('grid size-12 place-items-center rounded-full text-white', camOn ? 'bg-white/15 hover:bg-white/25' : 'bg-white/10')} aria-label="Toggle camera">{camOn ? <Video className="size-5" /> : <VideoOff className="size-5" />}</button>
          <button onClick={() => setCc(!cc)} className={cx('grid size-12 place-items-center rounded-full text-white', cc ? 'bg-white/25' : 'bg-white/10')} aria-label="Toggle captions"><Captions className="size-5" /></button>
          <button onClick={() => setTyping(!typing)} className="grid size-12 place-items-center rounded-full bg-white/15 text-white hover:bg-white/25" aria-label="Type an answer"><Keyboard className="size-5" /></button>
          <button onClick={() => { engine.current?.stop(); void finish(turns, []); }} className="grid h-12 w-16 place-items-center rounded-full bg-rose-600 text-white hover:bg-rose-500" aria-label="End call"><PhoneOff className="size-5" /></button>
        </div>
      </div>

      {(view.phase === 'prep' || (view.cue && view.part === 2 && view.phase !== 'ended')) && view.cue && (
        <div className="rounded-2xl border-2 border-dashed border-orange-400/60 bg-orange-500/5 p-4">
          <div className="flex items-center justify-between"><span className="text-xs font-semibold uppercase text-orange-600 dark:text-orange-300">Task card</span>{view.phase === 'prep' && <span className="flex items-center gap-2"><Badge tone="warn"><Timer className="size-3" />{view.prepLeft}s</Badge><Button size="sm" variant="secondary" onClick={() => engine.current?.readyToSpeak()}>I’m ready</Button></span>}</div>
          <p className="mt-1 font-semibold">{view.cue.text}</p>
          <ul className="mt-1 list-disc pl-5 text-sm">{view.cue.bullets?.map((b) => <li key={b}>{b}</li>)}</ul>
          {view.phase === 'prep' && <textarea className={cx(inputCls, 'mt-2 min-h-20')} placeholder="Notes (keywords)…" value={notes} onChange={(e) => setNotes(e.target.value)} />}
        </div>
      )}
      {typing && <div className="flex gap-2"><input className={inputCls} value={typed} onChange={(e) => setTyped(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && sendTyped()} placeholder="Type your answer and press Enter…" autoFocus /><Button icon={Send} onClick={sendTyped} aria-label="Send" /></div>}
      {turns.length > 0 && <p className="text-muted text-xs">{turns.length} answer(s) so far · feedback appears when the call ends.</p>}
    </div>
  );
}

/* ------------------------------------------------------------------ Report */

export function LiveReport({ r, kind }: { r: LiveResult; kind: 'exam' | 'interview' }) {
  const count = (k: LiveEvent['kind']) => r.events.filter((e) => e.kind === k).length;
  const lat = r.turns.map((t) => t.latencyMs).filter((x): x is number => typeof x === 'number');
  const avgLat = lat.length ? lat.reduce((a, b) => a + b, 0) / lat.length / 1000 : null;
  return (
    <div className="space-y-4 animate-fade-up">
      <CriteriaReport criteria={r.report.criteria} band={r.report.band} label={kind === 'exam' ? 'Speaking' : 'Interview'} note="Provisional: 3 of 4 criteria. Pronunciation is not scored automatically." />
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="surface space-y-2 rounded-2xl p-5 text-sm">
          <h3 className="flex items-center gap-2 font-semibold"><Activity className="size-4 text-[var(--accent)]" />Conversation analytics</h3>
          <div className="grid grid-cols-2 gap-2">
            <Mini label="Response time" value={avgLat !== null ? `${avgLat.toFixed(1)} s` : '–'} hint="Question end → you start speaking" />
            <Mini label="Speech rate" value={r.report.wpm ? `${r.report.wpm} wpm` : '–'} hint="Words per minute of voiced speech" />
            <Mini label="Interruptions by you" value={count('barge-in')} hint="Times you spoke over the examiner" />
            <Mini label="Examiner interruptions" value={count('interrupt')} hint="Answers that ran too long" />
            <Mini label="Repeats / clarifications" value={`${count('repeat')} / ${count('clarify')}`} hint="Requests to repeat or explain" />
            <Mini label="Nudges needed" value={count('nudge')} hint="Long silences before answering" />
          </div>
          {avgLat !== null && <p className="text-muted text-xs">{avgLat < 1.5 ? 'You responded promptly, which helps fluency.' : avgLat < 3.5 ? 'Natural response time. Fillers like “Well, let me think…” can cover longer pauses.' : 'Long pauses before answering. Practise starting with a short opener while you think.'}</p>}
          {count('ask-examiner') > 0 && <p className="text-muted text-xs">You asked the examiner a question {count('ask-examiner')} time(s). In IELTS the examiner won’t give opinions, so keep the focus on your own view.</p>}
        </div>
        <div className="surface space-y-2 rounded-2xl p-5 text-sm">
          <h3 className="flex items-center gap-2 font-semibold"><ScanFace className="size-4 text-[var(--accent)]" />On-camera presence</h3>
          {!r.face ? <p className="text-muted">The camera was off, so there is no video analysis.</p> : (
            <>
              <div className="grid grid-cols-2 gap-2">
                <Mini label="In view" value={`${r.face.presencePct}%`} />
                <Mini label="Eye contact while speaking" value={`${r.face.eyeContactPct}%`} />
                <Mini label="Look-away episodes" value={r.face.lookAwayEpisodes} />
                <Mini label="Smiling" value={`${r.face.smilePct}%`} />
              </div>
              <ul className="list-disc space-y-1 pl-5">{r.face.notes.map((n) => <li key={n}>{n}</li>)}</ul>
              <p className="text-muted text-xs">Estimated from facial landmarks on your device. IELTS does not mark body language; this is interview-confidence feedback only.</p>
            </>
          )}
        </div>
      </div>
      <div className="surface rounded-2xl p-5">
        <h3 className="mb-3 flex items-center gap-2 font-semibold"><Sparkles className="size-4 text-[var(--accent)]" />Your practice exercise</h3>
        <p className="text-sm">{r.report.exercise}</p>
      </div>
      <div className="surface rounded-2xl p-5">
        <h3 className="mb-3 font-semibold">Transcript</h3>
        <div className="space-y-3 text-sm">
          {r.turns.map((t, i) => (
            <div key={i}>
              <div className="text-muted flex flex-wrap items-center gap-2 text-xs">Part {t.part} · {t.question}{typeof t.latencyMs === 'number' && <Badge>{(t.latencyMs / 1000).toFixed(1)} s to start</Badge>}{typeof t.relevance === 'number' && <Badge tone={relevanceLabel(t.relevance) === 'on-topic' ? 'good' : relevanceLabel(t.relevance) === 'off-topic' ? 'bad' : 'warn'}>{relevanceLabel(t.relevance)}</Badge>}{t.typed && <Badge>typed</Badge>}</div>
              <p className="mt-0.5">{t.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const Mini = ({ label, value, hint }: { label: string; value: ReactNode; hint?: string }) => (
  <div className="surface-2 rounded-xl p-2.5" title={hint}><div className="text-muted text-[11px]">{label}</div><div className="text-base font-bold">{value}</div></div>
);
