// Definiciones de enemigos — DATOS + funciones puras, sin Phaser.

export type EnemyKind =
  | 'chaser'
  | 'runner'
  | 'dasher'
  | 'splitter'
  | 'ranged'
  | 'tank'
  | 'mini'
  | 'elite'
  | 'boss';

export interface EnemyBehavior {
  orbitR?: number; // dasher: radio de órbita
  dashPeriod?: number; // dasher: s entre embestidas
  dashSpeed?: number; // dasher: velocidad de embestida
  dashTime?: number; // dasher: duración de la embestida
  keepRange?: number; // ranged: distancia preferida
  firePeriod?: number; // ranged: s entre disparos
  shotSpeed?: number; // ranged/boss: velocidad de proyectil
  shotDmg?: number; // ranged/boss: daño de proyectil
}

export interface EnemyDef {
  id: string;
  name: string;
  tex: string;
  scale: number;
  kind: EnemyKind;
  hp: number;
  speed: number;
  dmg: number;
  /** Radio del cuerpo en píxeles de pantalla (Etapa 1: slime 12). */
  radius: number;
  xp: number;
  behavior?: EnemyBehavior;
  boss?: boolean;
}

export const ENEMIES: EnemyDef[] = [
  { id: 'slime', name: 'Slime', tex: 'e-slime', scale: 3, kind: 'chaser', hp: 50, speed: 110, dmg: 10, radius: 12, xp: 10 },
  { id: 'bat', name: 'Murciélago', tex: 'e-bat', scale: 3, kind: 'runner', hp: 25, speed: 175, dmg: 6, radius: 10, xp: 6 },
  { id: 'spider', name: 'Araña', tex: 'e-spider', scale: 3, kind: 'dasher', hp: 40, speed: 140, dmg: 10, radius: 11, xp: 12,
    behavior: { orbitR: 200, dashPeriod: 2.6, dashSpeed: 360, dashTime: 0.5 } },
  { id: 'ghost', name: 'Fantasma', tex: 'e-ghost', scale: 3, kind: 'splitter', hp: 60, speed: 95, dmg: 10, radius: 12, xp: 15 },
  { id: 'skeleton', name: 'Esqueleto', tex: 'e-skeleton', scale: 3, kind: 'ranged', hp: 35, speed: 90, dmg: 8, radius: 11, xp: 15,
    behavior: { keepRange: 280, firePeriod: 2.8, shotSpeed: 190, shotDmg: 8 } },
  { id: 'brute', name: 'Bruto', tex: 'e-brute', scale: 3, kind: 'tank', hp: 160, speed: 75, dmg: 20, radius: 15, xp: 25 },
  { id: 'mini', name: 'Mini', tex: 'e-ghost', scale: 2, kind: 'mini', hp: 15, speed: 130, dmg: 5, radius: 8, xp: 5 },
  { id: 'elite', name: 'Bruto de élite', tex: 'e-brute', scale: 5, kind: 'elite', hp: 500, speed: 80, dmg: 25, radius: 24, xp: 60 },
  { id: 'demon', name: 'Rey Demonio', tex: 'e-demon', scale: 5, kind: 'boss', hp: 2200, speed: 65, dmg: 30, radius: 26, xp: 300,
    boss: true, behavior: { shotSpeed: 190, shotDmg: 12 } },
];

export function enemyDef(id: string): EnemyDef {
  const def = ENEMIES.find((e) => e.id === id);
  if (!def) throw new Error(`Enemigo desconocido: ${id}`);
  return def;
}

export interface ScaleAt {
  hp: number;
  dmg: number;
}

/** Escalado con el tiempo: +25 % HP/min, +8 % daño/min (lineal, min 1). */
export function scaleAt(elapsed: number): ScaleAt {
  const min = Math.max(0, elapsed / 60);
  return { hp: 1 + 0.25 * min, dmg: 1 + 0.08 * min };
}

export interface MiniDesc {
  id: string;
  dx: number;
  dy: number;
}

/** El fantasma se divide en 2 minis a los lados. Puro: la escena instancia. */
export function splitMinis(): MiniDesc[] {
  return [
    { id: 'mini', dx: -18, dy: 0 },
    { id: 'mini', dx: 18, dy: 0 },
  ];
}
