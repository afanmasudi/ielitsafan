/**
 * Webcam face analysis with MediaPipe Face Landmarker (Apache-2.0), fully on-device.
 * Frames are analysed in memory and never stored or uploaded.
 */
import type { FaceLandmarker } from '@mediapipe/tasks-vision';
import { modelStore } from './store';

export const FACE_ID = 'face-landmarker';
const MODEL_URL = 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task';

let lm: FaceLandmarker | null = null;
let loading: Promise<FaceLandmarker> | null = null;

export const isFaceReady = () => !!lm;

export function loadFace() {
  if (lm) return Promise.resolve(lm);
  if (loading) return loading;
  modelStore.set(FACE_ID, { status: 'loading', progress: 0.1, error: undefined });
  loading = (async () => {
    try {
      const vision = await import('@mediapipe/tasks-vision');
      const files = await vision.FilesetResolver.forVisionTasks('/mediapipe');
      modelStore.set(FACE_ID, { progress: 0.4 });
      const make = (delegate: 'GPU' | 'CPU') => vision.FaceLandmarker.createFromOptions(files, {
        baseOptions: { modelAssetPath: MODEL_URL, delegate },
        runningMode: 'VIDEO', numFaces: 1, outputFaceBlendshapes: true, outputFacialTransformationMatrixes: true,
      });
      lm = await make('GPU').catch(() => make('CPU'));
      modelStore.set(FACE_ID, { status: 'ready', progress: 1, cached: true });
      return lm;
    } catch (e) {
      modelStore.set(FACE_ID, { status: 'error', error: (e as Error).message });
      throw e;
    } finally { loading = null; }
  })();
  return loading;
}

export function unloadFace() { lm?.close(); lm = null; modelStore.set(FACE_ID, { status: 'idle', progress: 0 }); }

export interface FaceReading { present: boolean; jawOpen: number; smile: number; gazeAway: number; yaw: number; pitch: number; blink: number }

const EMPTY: FaceReading = { present: false, jawOpen: 0, smile: 0, gazeAway: 0, yaw: 0, pitch: 0, blink: 0 };

/** Analyse the current video frame. */
export function readFace(video: HTMLVideoElement, t = performance.now()): FaceReading {
  if (!lm || video.readyState < 2) return EMPTY;
  const r = lm.detectForVideo(video, t);
  const bs = r.faceBlendshapes?.[0]?.categories;
  if (!bs) return EMPTY;
  const g = (n: string) => bs.find((c) => c.categoryName === n)?.score ?? 0;
  const gazeAway = Math.max(
    (g('eyeLookOutLeft') + g('eyeLookInRight')) / 2, (g('eyeLookInLeft') + g('eyeLookOutRight')) / 2,
    (g('eyeLookUpLeft') + g('eyeLookUpRight')) / 2, (g('eyeLookDownLeft') + g('eyeLookDownRight')) / 2,
  );
  // Head pose from the facial transformation matrix (column-major 4×4).
  let yaw = 0, pitch = 0;
  const m = r.facialTransformationMatrixes?.[0]?.data;
  if (m) { yaw = (Math.atan2(m[8], m[10]) * 180) / Math.PI; pitch = (Math.asin(-Math.max(-1, Math.min(1, m[9]))) * 180) / Math.PI; }
  return { present: true, jawOpen: g('jawOpen'), smile: (g('mouthSmileLeft') + g('mouthSmileRight')) / 2, gazeAway, yaw, pitch, blink: (g('eyeBlinkLeft') + g('eyeBlinkRight')) / 2 };
}
