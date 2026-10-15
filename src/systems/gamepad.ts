// Lectura de gamepad — pura y testeable (el pad se inyecta; admite fakes).

export interface PadState {
  mx: number; // -1..1
  my: number; // -1..1
  start: boolean; // botón 9 (edge lo gestiona la escena)
  a: boolean; // botón 0
}

export interface FakePad {
  axes: (number | null)[];
  buttons: ({ pressed: boolean } | null)[];
}

const DEADZONE = 0.25;

function dz(v: number): number {
  return Math.abs(v) < DEADZONE ? 0 : v;
}

/** Normaliza el primer gamepad (o null si no hay input efectivo). */
export function readPad(pad: FakePad | null | undefined): PadState | null {
  if (!pad) return null;
  const mx = dz(pad.axes[0] ?? 0);
  const my = dz(pad.axes[1] ?? 0);
  const start = pad.buttons[9]?.pressed ?? false;
  const a = pad.buttons[0]?.pressed ?? false;
  if (mx === 0 && my === 0 && !start && !a) return null;
  return { mx, my, start, a };
}
