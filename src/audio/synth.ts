// Síntesis de audio: descriptores puros nota→oscilador. Sin assets.
// El reproductor (player.ts) los interpreta con WebAudio.

export type OscKind = 'square' | 'triangle' | 'sine' | 'sawtooth';

export interface ToneSpec {
  freq: number;
  end?: number; // slide hasta esta freq (portamento lineal)
  dur: number; // segundos
  type: OscKind;
  vol: number; // 0-1 (antes del gain de SFX)
  delay?: number; // offset en segundos dentro del efecto
}

export interface NoiseSpec {
  dur: number;
  vol: number;
  delay?: number;
  lowpass?: number;
}

export interface SfxSpec {
  tones: ToneSpec[];
  noises: NoiseSpec[];
  /** Ventana mínima entre disparos del mismo efecto (ms). 0 = sin límite. */
  throttleMs: number;
}

/** freq en Hz directos (sin teoría musical: valores afinados a oído). */
export const SFX: Record<string, SfxSpec> = {
  shoot: { throttleMs: 70, tones: [{ freq: 660, end: 220, dur: 0.08, type: 'square', vol: 0.25 }], noises: [] },
  hit: { throttleMs: 60, tones: [], noises: [{ dur: 0.05, vol: 0.3, lowpass: 3000 }] },
  die: { throttleMs: 0, tones: [{ freq: 300, end: 60, dur: 0.18, type: 'triangle', vol: 0.4 }], noises: [] },
  gem: { throttleMs: 70, tones: [{ freq: 880, end: 1320, dur: 0.09, type: 'sine', vol: 0.3 }], noises: [] },
  level: {
    throttleMs: 0,
    tones: [
      { freq: 523, dur: 0.09, type: 'square', vol: 0.3 },
      { freq: 659, dur: 0.09, type: 'square', vol: 0.3, delay: 0.09 },
      { freq: 784, dur: 0.16, type: 'square', vol: 0.3, delay: 0.18 },
    ],
    noises: [],
  },
  buy: {
    throttleMs: 0,
    tones: [
      { freq: 660, dur: 0.07, type: 'sine', vol: 0.35 },
      { freq: 990, dur: 0.12, type: 'sine', vol: 0.35, delay: 0.07 },
    ],
    noises: [],
  },
  ui: { throttleMs: 40, tones: [{ freq: 440, dur: 0.05, type: 'square', vol: 0.2 }], noises: [] },
  hurt: { throttleMs: 0, tones: [{ freq: 160, end: 70, dur: 0.2, type: 'sawtooth', vol: 0.4 }], noises: [] },
  evolve: {
    throttleMs: 0,
    tones: [
      { freq: 392, dur: 0.1, type: 'triangle', vol: 0.35 },
      { freq: 523, dur: 0.1, type: 'triangle', vol: 0.35, delay: 0.1 },
      { freq: 659, dur: 0.1, type: 'triangle', vol: 0.35, delay: 0.2 },
      { freq: 1046, dur: 0.25, type: 'triangle', vol: 0.35, delay: 0.3 },
    ],
    noises: [],
  },
  boss: {
    throttleMs: 0,
    tones: [
      { freq: 110, dur: 0.25, type: 'sawtooth', vol: 0.45 },
      { freq: 110, dur: 0.25, type: 'sawtooth', vol: 0.45, delay: 0.3 },
      { freq: 110, dur: 0.4, type: 'sawtooth', vol: 0.45, delay: 0.6 },
    ],
    noises: [],
  },
  victory: {
    throttleMs: 0,
    tones: [
      { freq: 523, dur: 0.12, type: 'square', vol: 0.3 },
      { freq: 659, dur: 0.12, type: 'square', vol: 0.3, delay: 0.12 },
      { freq: 784, dur: 0.12, type: 'square', vol: 0.3, delay: 0.24 },
      { freq: 1046, dur: 0.3, type: 'square', vol: 0.3, delay: 0.36 },
    ],
    noises: [],
  },
  defeat: {
    throttleMs: 0,
    tones: [
      { freq: 392, dur: 0.2, type: 'triangle', vol: 0.35 },
      { freq: 330, dur: 0.2, type: 'triangle', vol: 0.35, delay: 0.2 },
      { freq: 262, dur: 0.4, type: 'triangle', vol: 0.35, delay: 0.4 },
    ],
    noises: [],
  },
};

/** ¿Puede sonar `name` en `now` (ms)? Puro y testeable. */
export function canPlay(last: Record<string, number>, name: string, now: number): boolean {
  const spec = SFX[name];
  if (!spec) return false;
  if (spec.throttleMs <= 0) return true;
  return now - (last[name] ?? -Infinity) >= spec.throttleMs;
}
