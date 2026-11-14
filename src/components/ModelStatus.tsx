import { useEffect, useState } from 'react';
import { Mic, Volume2, Sparkles } from 'lucide-react';
import { useAllModelStates } from '../ai/store';
import { DEFAULT_STT } from '../ai/models';
import { TTS_ID } from '../ai/tts';
import { llmModelId } from '../ai/llm';
import { cx } from './ui';

/** Compact status of the three local AI engines, linking to the Model Manager. */
export function ModelStatus({ show = ['stt', 'tts', 'llm'] }: { show?: ('stt' | 'tts' | 'llm')[] }) {
  const all = useAllModelStates();
  const [llmId, setLlmId] = useState('');
  useEffect(() => { void llmModelId().then(setLlmId); }, []);
  const items = [
    { k: 'stt', icon: Mic, label: 'Speech recognition', s: all[DEFAULT_STT], off: 'Not loaded' },
    { k: 'tts', icon: Volume2, label: 'Examiner voice', s: all[TTS_ID], off: 'Browser voice' },
    { k: 'llm', icon: Sparkles, label: 'AI tutor', s: all[llmId], off: 'Offline rules only' },
  ].filter((i) => show.includes(i.k as 'stt'));
  return (
    <a href="#/settings" className="flex flex-wrap gap-2" title="Open the Model Manager">
      {items.map(({ k, icon: Icon, label, s, off }) => {
        const st = s?.status ?? 'idle';
        return (
          <span key={k} className="surface inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs">
            <span className={cx('size-2 rounded-full', st === 'ready' ? 'bg-emerald-500' : st === 'loading' ? 'animate-pulse bg-amber-500' : st === 'error' ? 'bg-rose-500' : 'bg-zinc-400')} />
            <Icon className="size-3.5" /><span className="hidden sm:inline">{label}:</span>
            <span className="text-muted">{st === 'ready' ? 'Ready' : st === 'loading' ? `${Math.round((s?.progress ?? 0) * 100)}%` : st === 'error' ? 'Error' : off}</span>
          </span>
        );
      })}
    </a>
  );
}
