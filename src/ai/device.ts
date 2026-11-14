export interface DeviceInfo {
  webgpu: boolean;
  gpuName?: string;
  shaderF16: boolean;
  memoryGB?: number;
  cores?: number;
  mobile: boolean;
  storage?: { usage: number; quota: number; persisted: boolean };
  mic: boolean;
  speechSynthesis: boolean;
}

let cached: Promise<DeviceInfo> | null = null;

export function getDevice(force = false): Promise<DeviceInfo> {
  if (cached && !force) return cached;
  cached = (async () => {
    const nav = navigator as Navigator & { deviceMemory?: number; gpu?: { requestAdapter(): Promise<{ features: Set<string>; info?: { description?: string; vendor?: string } } | null> } };
    let webgpu = false, shaderF16 = false, gpuName: string | undefined;
    try {
      const adapter = await nav.gpu?.requestAdapter();
      if (adapter) { webgpu = true; shaderF16 = adapter.features.has('shader-f16'); gpuName = adapter.info?.description || adapter.info?.vendor; }
    } catch { /* no WebGPU */ }
    let storage: DeviceInfo['storage'];
    try {
      const e = await navigator.storage?.estimate();
      if (e) storage = { usage: e.usage ?? 0, quota: e.quota ?? 0, persisted: (await navigator.storage.persisted?.()) ?? false };
    } catch { /* unsupported */ }
    return {
      webgpu, shaderF16, gpuName,
      memoryGB: nav.deviceMemory, cores: navigator.hardwareConcurrency,
      mobile: /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent),
      storage, mic: !!navigator.mediaDevices?.getUserMedia, speechSynthesis: 'speechSynthesis' in window,
    };
  })();
  return cached;
}

export async function requestPersistence() {
  try { return (await navigator.storage?.persist?.()) ?? false; } catch { return false; }
}

export const fmtBytes = (n: number) => (n > 1e9 ? `${(n / 1e9).toFixed(1)} GB` : `${Math.round(n / 1e6)} MB`);

/** Rough suitability check used by the Model Manager. Never blocks the user, only warns. */
export function compatibility(d: DeviceInfo, m: { needsWebGPU: boolean; vramMB?: number; sizeMB: number; tier: string }) {
  const problems: string[] = [];
  if (m.needsWebGPU && !d.webgpu) problems.push('Needs WebGPU, which this browser does not provide. Try desktop Chrome or Edge.');
  if (m.vramMB && d.memoryGB && d.memoryGB * 1024 < m.vramMB * 1.5) problems.push(`Needs about ${(m.vramMB / 1024).toFixed(1)} GB of GPU memory; this device reports ${d.memoryGB} GB RAM.`);
  if (m.tier === 'advanced' && d.mobile) problems.push('Too large for most phones.');
  if (d.storage && d.storage.quota - d.storage.usage < m.sizeMB * 1.2e6) problems.push('Not enough free browser storage.');
  return { ok: problems.length === 0, problems };
}
