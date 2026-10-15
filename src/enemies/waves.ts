// Oleadas por datos: calendario de eventos + mezcla continua — puro.

export type WaveOp = 'unlock' | 'burst' | 'elite' | 'boss' | 'banner';

export interface WaveEvent {
  t: number; // segundos de partida
  op: WaveOp;
  enemy?: string;
  count?: number;
  text?: string;
}

/** Calendario ordenado por t. El jefe sale a los 8:00 con aviso previo. */
export const WAVES: WaveEvent[] = [
  { t: 0, op: 'unlock', enemy: 'slime' },
  { t: 45, op: 'unlock', enemy: 'bat' },
  { t: 45, op: 'burst', enemy: 'bat', count: 8 },
  { t: 45, op: 'banner', text: '¡Murciélagos!' },
  { t: 90, op: 'unlock', enemy: 'spider' },
  { t: 90, op: 'banner', text: '¡Arañas!' },
  { t: 150, op: 'unlock', enemy: 'ghost' },
  { t: 150, op: 'banner', text: '¡Fantasmas!' },
  { t: 177, op: 'banner', text: '¡Un bruto de élite se acerca!' },
  { t: 180, op: 'unlock', enemy: 'brute' },
  { t: 180, op: 'elite' },
  { t: 240, op: 'unlock', enemy: 'skeleton' },
  { t: 240, op: 'burst', enemy: 'skeleton', count: 6 },
  { t: 240, op: 'banner', text: '¡Esqueletos arqueros!' },
  { t: 300, op: 'burst', enemy: 'spider', count: 10 },
  { t: 300, op: 'burst', enemy: 'ghost', count: 8 },
  { t: 300, op: 'banner', text: '¡Oleada!' },
  { t: 357, op: 'banner', text: '¡Otro bruto de élite!' },
  { t: 360, op: 'elite' },
  { t: 477, op: 'banner', text: '¡EL REY DEMONIO SE ACERCA!' },
  { t: 480, op: 'boss' },
];

/** Pesos de mezcla entre desbloqueados (el slime decae con el tiempo). */
const MIX: { id: string; from: number; w0: number; w1: number }[] = [
  { id: 'slime', from: 0, w0: 1, w1: 0.3 },
  { id: 'bat', from: 45, w0: 0.35, w1: 0.2 },
  { id: 'spider', from: 90, w0: 0.2, w1: 0.2 },
  { id: 'ghost', from: 150, w0: 0.15, w1: 0.15 },
  { id: 'brute', from: 180, w0: 0.1, w1: 0.12 },
  { id: 'skeleton', from: 240, w0: 0.2, w1: 0.18 },
];

const MIX_HORIZON = 480;

/** Pesos normalizados (suman 1) solo con tipos desbloqueados a tiempo `t`. */
export function mixAt(t: number): { id: string; w: number }[] {
  const k = Math.min(Math.max(t / MIX_HORIZON, 0), 1);
  const rows = MIX.filter((m) => t >= m.from).map((m) => ({ id: m.id, w: m.w0 + (m.w1 - m.w0) * k }));
  const total = rows.reduce((s, r) => s + r.w, 0);
  return rows.map((r) => ({ id: r.id, w: total > 0 ? r.w / total : 0 }));
}

/** Elige especie según pesos con RNG inyectado. */
export function pickEnemyType(mix: { id: string; w: number }[], rand: () => number = Math.random): string {
  let r = rand();
  for (const m of mix) {
    r -= m.w;
    if (r < 0) return m.id;
  }
  return mix[mix.length - 1].id;
}

/** Eventos con t en (prev, now] aún no disparados. */
export function nextEvents(prev: number, now: number, fired: Set<number>): WaveEvent[] {
  const out: WaveEvent[] = [];
  WAVES.forEach((ev, i) => {
    if (!fired.has(i) && ev.t > prev && ev.t <= now) {
      fired.add(i);
      out.push(ev);
    }
  });
  return out;
}
