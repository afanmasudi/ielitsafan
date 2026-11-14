/**
 * Aggregates per-frame webcam signals into session feedback. Video is analysed locally and
 * never recorded. IELTS does not mark body language; this is for interview confidence only.
 */
export interface FaceFrame {
  t: number; // ms
  present: boolean;
  jawOpen: number; // 0–1 (blendshape)
  smile: number; // 0–1
  gazeAway: number; // 0–1: how far the eyes look away from the camera
  yaw: number; // degrees, + = turned right
  pitch: number; // degrees, + = looking down
  audioSpeaking: boolean;
}

export interface FaceSummary {
  seconds: number;
  presencePct: number;
  eyeContactPct: number; // of frames with a face, while the candidate is speaking
  lookAwayEpisodes: number; // ≥ 1.5 s looking away while speaking
  lookingDownPct: number; // possibly reading notes
  smilePct: number;
  mouthAudioAgreement: number; // how often "audio speaking" and "mouth moving" agree
  headStillness: number; // 0–1 (1 = very still)
  notes: string[];
}

const LOOK_AWAY = (f: FaceFrame) => f.gazeAway > 0.45 || Math.abs(f.yaw) > 22 || f.pitch > 20;

export class FaceSession {
  frames: FaceFrame[] = [];
  private mouthWindow: number[] = [];
  add(f: FaceFrame) { this.frames.push(f); if (this.frames.length > 20000) this.frames.shift(); }

  /** Mouth is moving if jaw opening varies over the last ~0.5 s (speaking produces variation). */
  mouthMoving(jawOpen: number) {
    this.mouthWindow.push(jawOpen);
    if (this.mouthWindow.length > 6) this.mouthWindow.shift();
    const mx = Math.max(...this.mouthWindow), mn = Math.min(...this.mouthWindow);
    return mx - mn > 0.08 || mx > 0.25;
  }

  summary(): FaceSummary {
    const fr = this.frames;
    const seconds = fr.length > 1 ? (fr[fr.length - 1].t - fr[0].t) / 1000 : 0;
    const present = fr.filter((f) => f.present);
    const speaking = present.filter((f) => f.audioSpeaking);
    const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);
    let episodes = 0, run = 0;
    for (let i = 1; i < fr.length; i++) {
      const f = fr[i];
      if (f.present && f.audioSpeaking && LOOK_AWAY(f)) { run += f.t - fr[i - 1].t; if (run >= 1500 && run - (f.t - fr[i - 1].t) < 1500) episodes++; }
      else run = 0;
    }
    let agree = 0;
    const win: number[] = [];
    for (const f of present) {
      win.push(f.jawOpen); if (win.length > 6) win.shift();
      const moving = Math.max(...win) - Math.min(...win) > 0.08 || Math.max(...win) > 0.25;
      if (moving === f.audioSpeaking) agree++;
    }
    const yaws = present.map((f) => f.yaw);
    const mean = yaws.reduce((a, b) => a + b, 0) / Math.max(1, yaws.length);
    const sdYaw = Math.sqrt(yaws.reduce((s, y) => s + (y - mean) ** 2, 0) / Math.max(1, yaws.length));
    const s: FaceSummary = {
      seconds,
      presencePct: pct(present.length, fr.length),
      eyeContactPct: pct(speaking.filter((f) => !LOOK_AWAY(f)).length, speaking.length),
      lookAwayEpisodes: episodes,
      lookingDownPct: pct(speaking.filter((f) => f.pitch > 20).length, speaking.length),
      smilePct: pct(present.filter((f) => f.smile > 0.4).length, present.length),
      mouthAudioAgreement: pct(agree, present.length),
      headStillness: Math.max(0, Math.min(1, 1 - sdYaw / 20)),
      notes: [],
    };
    if (s.presencePct < 70) s.notes.push('Your face was out of view for much of the call. Sit centred, about an arm’s length from the camera.');
    if (speaking.length > 30 && s.eyeContactPct < 55) s.notes.push('You often looked away while speaking. In interviews, looking at the camera reads as eye contact.');
    if (s.lookingDownPct > 30) s.notes.push('You looked down a lot while speaking, which can look like reading notes.');
    if (s.smilePct < 5 && present.length > 100) s.notes.push('Your expression stayed quite neutral. A relaxed, friendly expression helps in interviews (it is not marked in IELTS).');
    if (s.headStillness < 0.3) s.notes.push('Lots of head movement was detected; try to keep a steady posture.');
    if (present.length > 100 && s.mouthAudioAgreement < 60) s.notes.push('Audio and mouth movement often disagreed. Background noise or another voice may have been picked up.');
    if (!s.notes.length && present.length > 50) s.notes.push('Good on-camera presence: you stayed in view and kept steady eye contact.');
    return s;
  }
}
