import { useEffect, useRef } from 'react';
import { speechLevel } from '../ai/tts';

export type AvatarMood = 'idle' | 'speaking' | 'listening' | 'thinking';
export type Persona = 'emma' | 'george';

export const PERSONAS: Record<Persona, { name: string; voice: 'examinerF' | 'examinerM'; skin: string; hair: string; suit: string; shirt: string; lips: string; iris: string }> = {
  emma: { name: 'Emma', voice: 'examinerF', skin: '#f1c7a5', hair: '#4a2c1d', suit: '#2f3a64', shirt: '#f4f1ea', lips: '#c46a6a', iris: '#3b6e4f' },
  george: { name: 'George', voice: 'examinerM', skin: '#c99068', hair: '#1f1a17', suit: '#3a3a3f', shirt: '#dfe8f5', lips: '#a85d52', iris: '#4a3423' },
};

/**
 * Animated examiner. Mouth opening follows the loudness of the examiner's voice; blinking,
 * breathing and small head movements run continuously; it nods while the candidate speaks.
 * Animation writes SVG attributes directly (no React re-render per frame).
 */
export function ExaminerAvatar({ persona = 'emma', mood, userSpeaking }: { persona?: Persona; mood: AvatarMood; userSpeaking: boolean }) {
  const p = PERSONAS[persona];
  const head = useRef<SVGGElement>(null);
  const body = useRef<SVGGElement>(null);
  const mouth = useRef<SVGEllipseElement>(null);
  const lowerLip = useRef<SVGPathElement>(null);
  const lids = useRef<SVGGElement>(null);
  const brows = useRef<SVGGElement>(null);
  const pupils = useRef<SVGGElement>(null);
  const state = useRef({ mood, userSpeaking });
  state.current = { mood, userSpeaking };

  useEffect(() => {
    let raf = 0, open = 0, nextBlink = performance.now() + 2000, blinkUntil = 0, gx = 0, gy = 0, tgx = 0, tgy = 0, nextGaze = 0;
    const tick = (t: number) => {
      const { mood: m, userSpeaking: us } = state.current;
      const target = m === 'speaking' ? speechLevel() : 0;
      open += (target - open) * 0.45;
      const o = Math.min(1, open * 1.3);
      mouth.current?.setAttribute('ry', String(0.6 + o * 10));
      mouth.current?.setAttribute('rx', String(13 - o * 2.5));
      lowerLip.current?.setAttribute('transform', `translate(0 ${o * 9})`);
      // Blink every 2–6 s (quick, ~140 ms).
      if (t > nextBlink) { blinkUntil = t + 140; nextBlink = t + 2000 + Math.random() * 4000; }
      lids.current?.setAttribute('transform', `translate(0 ${t < blinkUntil ? 0 : -12})`);
      // Gaze: mostly at the candidate (camera), with small glances; looks up-left when thinking.
      if (t > nextGaze) { const think = m === 'thinking'; tgx = think ? -3 : (Math.random() - 0.5) * 2.4; tgy = think ? -2.5 : (Math.random() - 0.5) * 1.2; nextGaze = t + 900 + Math.random() * 2200; }
      gx += (tgx - gx) * 0.08; gy += (tgy - gy) * 0.08;
      pupils.current?.setAttribute('transform', `translate(${gx} ${gy})`);
      // Head: breathing sway, nodding while listening to speech, slight tilt when thinking.
      const sway = Math.sin(t / 1700) * 1.2;
      const nod = m === 'listening' && us ? Math.sin(t / 260) * 2.2 : 0;
      const talk = m === 'speaking' ? Math.sin(t / 330) * 1.6 * o : 0;
      const tilt = m === 'thinking' ? -5 : m === 'listening' ? 2.5 : 0;
      head.current?.setAttribute('transform', `rotate(${sway + tilt + talk} 200 250) translate(0 ${nod})`);
      body.current?.setAttribute('transform', `translate(0 ${Math.sin(t / 1300) * 1.5})`);
      brows.current?.setAttribute('transform', `translate(0 ${m === 'thinking' ? -3 : m === 'speaking' ? -o * 2.5 : us ? -1.5 : 0})`);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  const female = persona === 'emma';
  return (
    <svg viewBox="0 0 400 400" className="h-full w-full" role="img" aria-label={`${p.name}, your examiner, is ${mood}`}>
      <defs>
        <linearGradient id="room" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#e9e6f5" /><stop offset="1" stopColor="#cfd8ea" /></linearGradient>
        <linearGradient id="win" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#bfe3ff" /><stop offset="1" stopColor="#eef7ff" /></linearGradient>
        <radialGradient id="skinShade" cx="0.45" cy="0.4" r="0.7"><stop offset="0.6" stopColor={p.skin} /><stop offset="1" stopColor="#000" stopOpacity="0.18" /></radialGradient>
        <filter id="soft"><feGaussianBlur stdDeviation="6" /></filter>
      </defs>
      {/* Office background */}
      <rect width="400" height="400" fill="url(#room)" />
      <rect x="250" y="40" width="120" height="150" rx="6" fill="url(#win)" stroke="#fff" strokeWidth="6" />
      <path d="M310 40 V190 M250 115 H370" stroke="#fff" strokeWidth="5" />
      <rect x="22" y="70" width="70" height="120" rx="4" fill="#b9a68c" opacity="0.55" />
      {[0, 1, 2].map((i) => <rect key={i} x={28} y={80 + i * 36} width={58} height={8} rx={2} fill="#7a5f45" opacity={0.5} />)}
      <ellipse cx="60" cy="300" rx="32" ry="60" fill="#5f9d6c" opacity="0.5" filter="url(#soft)" />

      <g ref={body}>
        {/* Shoulders and suit */}
        <path d="M70 400 C80 320 130 300 200 296 C270 300 320 320 330 400 Z" fill={p.suit} />
        <path d="M168 300 L200 352 L232 300 L222 296 L200 330 L178 296 Z" fill={p.shirt} />
        <path d="M150 304 L200 372 L170 400 L130 400 Z" fill="#000" opacity="0.12" />
        <path d="M250 304 L200 372 L230 400 L270 400 Z" fill="#000" opacity="0.12" />
        {!female && <path d="M193 330 L200 322 L207 330 L203 376 L200 382 L197 376 Z" fill="#7c2d3a" />}
        {female && <circle cx="200" cy="318" r="3.5" fill="#e8d9a8" />}
        {/* Neck */}
        <path d="M178 250 L178 300 Q200 316 222 300 L222 250 Z" fill={p.skin} />
        <path d="M178 286 Q200 300 222 286 L222 300 Q200 314 178 300 Z" fill="#000" opacity="0.08" />

        <g ref={head}>
          {/* Back hair */}
          {female ? <path d="M128 175 C120 90 280 80 272 175 C276 225 268 262 252 280 L148 280 C132 262 124 225 128 175 Z" fill={p.hair} /> : null}
          {/* Ears */}
          <ellipse cx="136" cy="200" rx="10" ry="16" fill={p.skin} />
          <ellipse cx="264" cy="200" rx="10" ry="16" fill={p.skin} />
          {/* Face */}
          <path d="M140 170 C140 110 260 110 260 170 L260 210 C260 255 230 285 200 285 C170 285 140 255 140 210 Z" fill="url(#skinShade)" />
          {/* Front hair */}
          {female
            ? <path d="M136 172 C132 112 190 92 232 104 C262 114 270 150 264 178 C250 150 226 130 196 128 C176 140 156 152 136 172 Z" fill={p.hair} />
            : <path d="M138 168 C134 112 196 96 236 108 C262 118 266 148 262 170 C254 146 236 132 204 132 C180 132 156 144 138 168 Z" fill={p.hair} />}
          {!female && <path d="M160 248 C170 276 230 276 240 248 C236 262 222 276 200 278 C178 276 164 262 160 248 Z" fill={p.hair} opacity="0.35" />}
          {/* Eyebrows */}
          <g ref={brows} fill="none" stroke={p.hair} strokeWidth={female ? 4 : 5.5} strokeLinecap="round">
            <path d="M158 168 Q172 160 186 166" /><path d="M214 166 Q228 160 242 168" />
          </g>
          {/* Eyes */}
          <g>
            <ellipse cx="172" cy="186" rx="12" ry="8" fill="#fff" />
            <ellipse cx="228" cy="186" rx="12" ry="8" fill="#fff" />
            <g ref={pupils}>
              <circle cx="172" cy="186" r="5.6" fill={p.iris} /><circle cx="172" cy="186" r="2.6" fill="#111" /><circle cx="174" cy="184" r="1.3" fill="#fff" />
              <circle cx="228" cy="186" r="5.6" fill={p.iris} /><circle cx="228" cy="186" r="2.6" fill="#111" /><circle cx="230" cy="184" r="1.3" fill="#fff" />
            </g>
            <g ref={lids} fill={p.skin}>
              <rect x="158" y="176" width="28" height="12" /><rect x="214" y="176" width="28" height="12" />
            </g>
            <path d="M160 181 Q172 174 184 181 M216 181 Q228 174 240 181" fill="none" stroke="#3a2a22" strokeWidth="1.6" opacity="0.6" />
          </g>
          {/* Nose */}
          <path d="M200 192 Q196 214 192 222 Q200 228 208 222" fill="none" stroke="#000" strokeOpacity="0.18" strokeWidth="2.4" strokeLinecap="round" />
          {/* Cheeks */}
          <ellipse cx="162" cy="222" rx="12" ry="7" fill="#e88" opacity="0.15" />
          <ellipse cx="238" cy="222" rx="12" ry="7" fill="#e88" opacity="0.15" />
          {/* Mouth */}
          <g>
            <ellipse ref={mouth} cx="200" cy="246" rx="13" ry="1" fill="#5a1f24" />
            <path d="M184 244 Q192 239 200 242 Q208 239 216 244 Q200 246 184 244 Z" fill={p.lips} />
            <path ref={lowerLip} d="M185 246 Q200 255 215 246 Q200 249 185 246 Z" fill={p.lips} />
          </g>
          {female && <><circle cx="136" cy="214" r="2.6" fill="#e8d9a8" /><circle cx="264" cy="214" r="2.6" fill="#e8d9a8" /></>}
        </g>
      </g>
    </svg>
  );
}
