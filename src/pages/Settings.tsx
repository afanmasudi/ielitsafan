import { useEffect, useRef, useState } from 'react';
import { Settings as Cog, Cpu, Download, Trash2, Play, Square, HardDrive, Upload, ShieldCheck, Loader2, CheckCircle2, AlertTriangle, Volume2, KeyRound, Gauge } from 'lucide-react';
import { MODELS, type ModelInfo } from '../ai/models';
import { compatibility, fmtBytes, getDevice, requestPersistence, type DeviceInfo } from '../ai/device';
import { useAllModelStates, modelStore } from '../ai/store';
import { loadStt, unloadStt } from '../ai/stt';
import { loadTts, unloadTts, speak, TTS_ID } from '../ai/tts';
import { loadLlm, unloadLlm, deleteLlm, isLlmCached, loadedLlm } from '../ai/llm';
import { deleteRepo, isRepoCached } from '../ai/cache';
import { loadEmbed, unloadEmbed, EMBED_ID } from '../ai/embed';
import { loadFace, unloadFace, FACE_ID } from '../ai/face';
import { getSetting, setSetting } from '../lib/db';
import { useActiveProfile, useProfile } from '../lib/profile';
import { deleteEverything, deleteProfile, downloadJson, exportData, hashPin, importData } from '../lib/backup';
import { Badge, Button, Confirm, cx, inputCls, Notice, PageHeader, Progress, Tabs } from '../components/ui';
import { navigate } from '../lib/router';

export default function Settings() {
  const [tab, setTab] = useState<'models' | 'data' | 'prefs'>('models');
  return (
    <div>
      <PageHeader title="Settings" subtitle="Local AI models, your data and preferences." icon={Cog} />
      <Tabs className="mb-5" value={tab} onChange={setTab} options={[{ value: 'models', label: 'Model manager' }, { value: 'data', label: 'Data & privacy' }, { value: 'prefs', label: 'Preferences' }]} />
      {tab === 'models' && <ModelManager />}
      {tab === 'data' && <DataPanel />}
      {tab === 'prefs' && <Prefs />}
    </div>
  );
}

function ModelManager() {
  const [dev, setDev] = useState<DeviceInfo | null>(null);
  const states = useAllModelStates();
  const [cached, setCached] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [mode, setMode] = useState('auto');

  const refresh = async () => {
    setDev(await getDevice(true));
    const c: Record<string, boolean> = {};
    for (const m of MODELS) c[m.id] = m.kind === 'llm' ? await isLlmCached(m.id) : m.kind === 'face' ? false : await isRepoCached(m.repo);
    setCached(c);
    setSelected({ stt: await getSetting('sttModel', 'whisper-tiny.en'), llm: await getSetting('llmModel', 'Qwen3-1.7B-q4f16_1-MLC') });
    setMode(await getSetting('aiMode', 'auto'));
  };
  useEffect(() => { void refresh(); }, []);

  const applyMode = async (m: string) => {
    setMode(m); await setSetting('aiMode', m);
    if (m === 'light') { await setSetting('llmModel', 'Qwen3-0.6B-q4f16_1-MLC'); await setSetting('sttModel', 'whisper-tiny.en'); }
    if (m === 'advanced') { await setSetting('llmModel', 'Qwen3-4B-q4f16_1-MLC'); await setSetting('sttModel', 'whisper-base.en'); }
    if (m === 'manual') { await unloadLlm(); await unloadStt(); unloadTts(); }
    await refresh();
  };

  const load = async (m: ModelInfo) => {
    try {
      if (m.kind === 'stt') { await setSetting('sttModel', m.id); await unloadStt(); await loadStt(m.id); }
      else if (m.kind === 'tts') await loadTts();
      else if (m.id === EMBED_ID) await loadEmbed();
      else if (m.id === FACE_ID) await loadFace();
      else { await setSetting('llmModel', m.id); await loadLlm(m.id); }
    } catch (e) { modelStore.set(m.id, { status: 'error', error: (e as Error).message }); }
    void refresh();
  };
  const unload = async (m: ModelInfo) => { if (m.kind === 'stt') await unloadStt(); else if (m.kind === 'tts') unloadTts(); else if (m.kind === 'embed') unloadEmbed(); else if (m.kind === 'face') unloadFace(); else await unloadLlm(); };
  const remove = async (m: ModelInfo) => {
    await unload(m);
    if (m.kind === 'llm') await deleteLlm(m.id); else if (m.kind !== 'face') await deleteRepo(m.repo);
    modelStore.set(m.id, { status: 'idle', progress: 0 });
    void refresh();
  };

  const isLoaded = (m: ModelInfo) => states[m.id]?.status === 'ready' && (m.kind !== 'llm' || loadedLlm() === m.id);
  const groups: [ModelInfo['kind'], string, string][] = [['stt', 'Speech recognition', 'Turns your spoken answers into text. Runs on WASM, so it works on most phones.'], ['tts', 'Examiner and Listening voices', 'Neural voices for the examiner and Listening tests. Without it, your browser’s built-in voice is used.'], ['embed', 'Meaning (sentence embeddings)', 'Small model used by the live examiner to understand intent and relevance.'], ['face', 'Webcam face tracking', 'Optional, for on-camera feedback in live calls.'], ['llm', 'AI tutor language model', 'Written commentary, follow-up questions, the tutor chat and AI-generated lists. Needs WebGPU.']];

  return (
    <div className="space-y-5">
      <div className="surface grid gap-4 rounded-2xl p-5 md:grid-cols-2">
        <div>
          <h2 className="mb-2 flex items-center gap-2 font-semibold"><Cpu className="size-4" />Your device</h2>
          {!dev ? <Loader2 className="size-5 animate-spin" /> : (
            <ul className="space-y-1 text-sm">
              <li className="flex items-center gap-2">{dev.webgpu ? <CheckCircle2 className="size-4 text-emerald-500" /> : <AlertTriangle className="size-4 text-amber-500" />}WebGPU: {dev.webgpu ? `available${dev.gpuName ? ` (${dev.gpuName})` : ''}${dev.shaderF16 ? ', f16' : ''}` : 'not available (AI tutor disabled; everything else works)'}</li>
              <li>Memory: {dev.memoryGB ? `about ${dev.memoryGB} GB reported` : 'not reported by this browser'} · CPU threads: {dev.cores ?? '?'}</li>
              <li>Device: {dev.mobile ? 'mobile' : 'desktop'} · Microphone API: {dev.mic ? 'yes' : 'no'} · Speech synthesis: {dev.speechSynthesis ? 'yes' : 'no'}</li>
            </ul>
          )}
        </div>
        <div>
          <h2 className="mb-2 flex items-center gap-2 font-semibold"><HardDrive className="size-4" />Browser storage</h2>
          {dev?.storage ? (
            <>
              <div className="text-sm">{fmtBytes(dev.storage.usage)} used of about {fmtBytes(dev.storage.quota)}</div>
              <Progress className="mt-2" value={dev.storage.usage / Math.max(1, dev.storage.quota)} />
              <div className="mt-2 flex items-center gap-2 text-sm">{dev.storage.persisted ? <><ShieldCheck className="size-4 text-emerald-500" />Persistent storage granted</> : <><Button size="sm" variant="soft" onClick={async () => { await requestPersistence(); void refresh(); }}>Ask the browser to keep data</Button></>}</div>
            </>
          ) : <p className="text-muted text-sm">Storage information is unavailable.</p>}
        </div>
      </div>

      <div className="surface rounded-2xl p-5">
        <h2 className="mb-3 flex items-center gap-2 font-semibold"><Gauge className="size-4" />Mode</h2>
        <div className="grid gap-2 sm:grid-cols-4">
          {[['auto', 'Recommended', 'Whisper Tiny + Qwen3 1.7B'], ['light', 'Lightweight', 'Smallest models, for phones and older laptops'], ['advanced', 'Advanced desktop', 'Whisper Base + Qwen3 4B (needs a strong GPU)'], ['manual', 'Manual (no AI)', 'Typing and built-in voices only; unloads models']].map(([k, l, d]) => (
            <button key={k} onClick={() => applyMode(k)} className={cx('rounded-xl border p-3 text-left text-sm', mode === k ? 'border-[var(--accent)] bg-[var(--accent)]/10' : 'border-soft')}><b>{l}</b><div className="text-muted text-xs">{d}</div></button>
          ))}
        </div>
      </div>

      <Notice><b>Nothing downloads automatically.</b> When you press Download, the model files come straight from Hugging Face (and the runtime from a public CDN) to your browser, where they are cached. Your recordings, essays and CV are never sent anywhere. Model failure never blocks the study modules.</Notice>

      {groups.map(([kind, title, desc]) => (
        <section key={kind}>
          <h2 className="font-semibold">{title}</h2>
          <p className="text-muted mb-3 text-sm">{desc}</p>
          <div className="grid gap-3 md:grid-cols-2">
            {MODELS.filter((m) => m.kind === kind).map((m) => {
              const st = states[m.id] ?? { status: 'idle', progress: 0 };
              const comp = dev ? compatibility(dev, m) : { ok: true, problems: [] };
              const active = (kind === 'stt' && selected.stt === m.id) || (kind === 'llm' && selected.llm === m.id) || kind === 'tts';
              return (
                <div key={m.id} className={cx('surface rounded-2xl p-4', isLoaded(m) && 'ring-2 ring-emerald-500/60')}>
                  <div className="flex flex-wrap items-center gap-2"><b>{m.name}</b>{active && <Badge tone="brand">selected</Badge>}{isLoaded(m) && <Badge tone="good">loaded</Badge>}{cached[m.id] && !isLoaded(m) && <Badge tone="info">downloaded</Badge>}</div>
                  <div className="text-muted mt-1 text-xs">{m.repo} · ~{m.sizeMB >= 1000 ? `${(m.sizeMB / 1000).toFixed(1)} GB` : `${m.sizeMB} MB`}{m.vramMB ? ` · ~${(m.vramMB / 1024).toFixed(1)} GB GPU memory` : ''} · {m.licence}</div>
                  <p className="mt-2 text-sm">{m.note}</p>
                  {!comp.ok && <div className="mt-2 space-y-1">{comp.problems.map((p) => <p key={p} className="flex gap-1.5 text-xs text-amber-600 dark:text-amber-300"><AlertTriangle className="size-3.5 shrink-0" />{p}</p>)}</div>}
                  {st.status === 'loading' && <div className="mt-3"><Progress value={st.progress} /><p className="text-muted mt-1 truncate text-xs">{Math.round(st.progress * 100)}% {st.text ?? ''}</p></div>}
                  {st.status === 'error' && <Notice tone="warn" className="mt-3 text-xs">{st.error}</Notice>}
                  <div className="mt-3 flex flex-wrap gap-2">
                    {!isLoaded(m) && <Button size="sm" icon={st.status === 'loading' ? Loader2 : cached[m.id] ? Play : Download} disabled={st.status === 'loading' || (m.needsWebGPU && !dev?.webgpu)} onClick={() => load(m)}>{st.status === 'loading' ? 'Loading…' : cached[m.id] ? 'Load' : 'Download & load'}</Button>}
                    {isLoaded(m) && <Button size="sm" variant="secondary" icon={Square} onClick={() => unload(m)}>Unload</Button>}
                    {isLoaded(m) && m.id === TTS_ID && <Button size="sm" variant="ghost" icon={Volume2} onClick={() => void speak('Hello. This is your IELTS Studio examiner. Shall we begin?', 'examinerF')}>Test voice</Button>}
                    {cached[m.id] && <Button size="sm" variant="ghost" icon={Trash2} onClick={() => remove(m)}>Delete files</Button>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}

function DataPanel() {
  const p = useActiveProfile();
  const { setProfileId } = useProfile();
  const [msg, setMsg] = useState('');
  const [confirm, setConfirm] = useState<'profile' | 'all' | null>(null);
  const file = useRef<HTMLInputElement>(null);
  const stamp = new Date().toISOString().slice(0, 10);
  return (
    <div className="space-y-4">
      <Notice tone="good"><b>Where is my data?</b> Only in this browser on this device (IndexedDB). Profiles do not sync between devices. Clearing browser data, or private browsing, can delete it, so export a backup regularly.</Notice>
      <div className="surface grid gap-3 rounded-2xl p-5 sm:grid-cols-2">
        <Button variant="secondary" icon={Download} onClick={async () => downloadJson(await exportData(p.id), `ielts-studio-${p.name.replace(/\W+/g, '-')}-${stamp}.json`)}>Export this profile</Button>
        <Button variant="secondary" icon={Download} onClick={async () => downloadJson(await exportData(), `ielts-studio-all-${stamp}.json`)}>Export all profiles</Button>
        <Button variant="secondary" icon={Upload} onClick={() => file.current?.click()}>Import a backup</Button>
        <input ref={file} type="file" accept=".json,application/json" hidden onChange={async (e) => { const f = e.target.files?.[0]; if (!f) return; try { setMsg(`Imported ${await importData(JSON.parse(await f.text()))} profile(s). Reloading…`); setTimeout(() => location.reload(), 800); } catch (err) { setMsg((err as Error).message); } }} />
      </div>
      {msg && <Notice>{msg}</Notice>}
      <PinPanel />
      <div className="surface space-y-3 rounded-2xl border-rose-500/30 p-5">
        <h3 className="font-semibold text-rose-600 dark:text-rose-400">Danger zone</h3>
        <div className="flex flex-wrap gap-2">
          <Button variant="danger" icon={Trash2} onClick={() => setConfirm('profile')}>Delete this profile</Button>
          <Button variant="danger" icon={Trash2} onClick={() => setConfirm('all')}>Delete all personal data</Button>
        </div>
        <p className="text-muted text-xs">“Delete all” removes every profile, attempt, draft, recording transcript, CV and setting from this browser. Downloaded AI models can be removed separately in the Model manager.</p>
      </div>
      <Confirm open={confirm === 'profile'} title="Delete this profile?" message={`All progress for ${p.name} will be permanently removed from this browser.`} onClose={() => setConfirm(null)} onConfirm={async () => { await deleteProfile(p.id); setProfileId(null); navigate('/'); }} />
      <Confirm open={confirm === 'all'} title="Delete all personal data?" message="Every profile and all study data in this browser will be permanently erased. This cannot be undone." confirmLabel="Delete everything" onClose={() => setConfirm(null)} onConfirm={async () => { await deleteEverything(); location.hash = ''; location.reload(); }} />
    </div>
  );
}

function PinPanel() {
  const p = useActiveProfile();
  const { update } = useProfile();
  const [pin, setPin] = useState('');
  return (
    <div className="surface space-y-3 rounded-2xl p-5">
      <h3 className="flex items-center gap-2 font-semibold"><KeyRound className="size-4" />Profile lock</h3>
      <p className="text-muted text-sm">A PIN stops casual access on a shared device. It is not encryption and does not protect against someone with technical access to this browser.</p>
      <div className="flex flex-wrap gap-2">
        <input className={cx(inputCls, 'max-w-48')} type="password" inputMode="numeric" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 8))} placeholder={p.pinHash ? 'New PIN' : '4–8 digits'} />
        <Button disabled={pin.length < 4} onClick={async () => { const h = await hashPin(pin); await update({ pinHash: h.hash, pinSalt: h.salt }); setPin(''); }}>{p.pinHash ? 'Change PIN' : 'Set PIN'}</Button>
        {p.pinHash && <Button variant="ghost" onClick={() => update({ pinHash: undefined, pinSalt: undefined })}>Remove PIN</Button>}
      </div>
    </div>
  );
}

function Prefs() {
  const [voice, setVoice] = useState(true);
  const [gpuVoice, setGpuVoice] = useState(false);
  useEffect(() => { void getSetting('voiceOn', true).then(setVoice); void getSetting('ttsGpu', false).then(setGpuVoice); }, []);
  const p = useActiveProfile();
  return (
    <div className="space-y-4">
      <label className="surface flex items-center justify-between gap-4 rounded-2xl p-5">
        <span><b>Examiner voice</b><span className="text-muted block text-sm">Read questions aloud. Turn off to read only.</span></span>
        <input type="checkbox" className="size-6 accent-[var(--accent)]" checked={voice} onChange={async (e) => { setVoice(e.target.checked); await setSetting('voiceOn', e.target.checked); }} />
      </label>
      <label className="surface flex items-center justify-between gap-4 rounded-2xl p-5">
        <span><b>Faster examiner voice (GPU)</b><span className="text-muted block text-sm">Runs Kokoro on WebGPU for much quicker replies in live calls. Needs a one-off 326 MB download; takes effect the next time the voice loads.</span></span>
        <input type="checkbox" className="size-6 accent-[var(--accent)]" checked={gpuVoice} onChange={async (e) => { setGpuVoice(e.target.checked); await setSetting('ttsGpu', e.target.checked); }} />
      </label>
      <div className="surface rounded-2xl p-5 text-sm">
        <b>Study profile</b>
        <p className="text-muted mt-1">To change your test type, target or exam date, open the study plan and choose “Change plan”, or redo the setup.</p>
        <div className="mt-3 flex gap-2"><a href="#/plan"><Button size="sm" variant="secondary">Change plan</Button></a><RedoSetup id={p.id} /></div>
      </div>
      <div className="surface rounded-2xl p-5 text-sm">
        <b>About</b>
        <p className="mt-1">Made by <b>Afan Abdullah Masoodi</b>.</p>
        <p className="text-muted mt-1">IELTS Studio is an independent practice tool and is not affiliated with, or endorsed by, the British Council, IDP or Cambridge University Press & Assessment. All estimates are for practice only. See README, RESEARCH.md and MODEL_GUIDE.md for sources, models and licences.</p>
      </div>
    </div>
  );
}

function RedoSetup({ id }: { id: string }) {
  const { update } = useProfile();
  const [open, setOpen] = useState(false);
  return <><Button size="sm" variant="ghost" onClick={() => setOpen(true)}>Redo setup</Button><Confirm open={open} title="Redo setup?" message="You will go through onboarding again and get a new plan. Your history is kept." confirmLabel="Redo" onClose={() => setOpen(false)} onConfirm={() => update({ onboarded: false })} />{id && null}</>;
}
