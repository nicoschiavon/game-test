// Secuenciador musical: patrones puros + reproductor con lookahead.
// 8 pasos por compás, 112 BPM. Capas: bajo, arpegio, hat de ruido.

export const BPM = 112;
export const STEPS = 8;

/** Hz. 0 = silencio. */
export const BASS: number[] = [110, 0, 110, 0, 130.8, 0, 98, 0];
export const ARP: number[] = [220, 261.6, 329.6, 261.6, 220, 261.6, 329.6, 392];
export const HAT: boolean[] = [true, false, true, false, true, false, true, true];

export function stepDur(): number {
  return 60 / BPM / 2; // corcheas
}
