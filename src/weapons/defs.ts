// Definiciones de armas, pasivos y evoluciones — DATOS, sin Phaser.
// La escena/engine solo leen estas tablas (balance centralizado aquí).

export type WeaponKind = 'bolt' | 'orbital' | 'nova' | 'pierce' | 'zone';

export interface WeaponLevel {
  dmg: number;
  count: number;
  interval: number; // s entre activaciones (orb: ignorado, usa rotSpeed)
  speed?: number; // proyectiles (bolt/pierce)
  range?: number; // alcance de target (bolt/pierce) / radio (nova) / órbita (orbital) / zona
  rotSpeed?: number; // orbital: rad/s
  duration?: number; // zone: s activa
  tick?: number; // orbital/zone: ventana de daño por enemigo (s)
  pierce?: boolean; // bolt con perforación (evoluciones)
}

export interface WeaponDef {
  id: string;
  name: string;
  desc: string;
  kind: WeaponKind;
  maxLevel: number;
  levels: WeaponLevel[]; // índice 0 = nivel 1
}

export interface PassiveLevel {
  desc: string;
}

export interface PassiveDef {
  id: string;
  name: string;
  desc: string;
  maxLevel: number;
  levels: PassiveLevel[];
}

export interface EvolutionDef {
  weaponId: string;
  passiveId: string;
  evoId: string;
}

/** Límites de carga (Etapa 4). */
export const LOADOUT_LIMITS = { weapons: 3, passives: 3 } as const;

const L = (partial: WeaponLevel[]): WeaponLevel[] => partial;

export const WEAPONS: WeaponDef[] = [
  {
    id: 'daga',
    name: 'Daga',
    desc: 'Proyectil dirigido al enemigo más cercano',
    kind: 'bolt',
    maxLevel: 8,
    levels: L([
      { dmg: 25, count: 1, interval: 0.9, speed: 420, range: 420 },
      { dmg: 28, count: 1, interval: 0.88, speed: 420, range: 420 },
      { dmg: 31, count: 1, interval: 0.85, speed: 430, range: 430 },
      { dmg: 34, count: 2, interval: 0.85, speed: 430, range: 430 },
      { dmg: 38, count: 2, interval: 0.82, speed: 440, range: 440 },
      { dmg: 42, count: 2, interval: 0.8, speed: 440, range: 450 },
      { dmg: 46, count: 3, interval: 0.8, speed: 450, range: 460 },
      { dmg: 52, count: 3, interval: 0.75, speed: 460, range: 470 },
    ]),
  },
  {
    id: 'orbes',
    name: 'Orbes',
    desc: 'Orbes que orbitan y queman al contacto',
    kind: 'orbital',
    maxLevel: 8,
    levels: L([
      { dmg: 15, count: 1, interval: 0, range: 90, rotSpeed: 2.2, tick: 0.45 },
      { dmg: 18, count: 2, interval: 0, range: 95, rotSpeed: 2.3, tick: 0.45 },
      { dmg: 22, count: 2, interval: 0, range: 100, rotSpeed: 2.4, tick: 0.4 },
      { dmg: 26, count: 3, interval: 0, range: 105, rotSpeed: 2.5, tick: 0.4 },
      { dmg: 30, count: 3, interval: 0, range: 112, rotSpeed: 2.6, tick: 0.4 },
      { dmg: 35, count: 4, interval: 0, range: 118, rotSpeed: 2.7, tick: 0.35 },
      { dmg: 40, count: 4, interval: 0, range: 124, rotSpeed: 2.8, tick: 0.35 },
      { dmg: 48, count: 5, interval: 0, range: 130, rotSpeed: 3.0, tick: 0.35 },
    ]),
  },
  {
    id: 'nova',
    name: 'Nova',
    desc: 'Pulso radial que golpea a todo lo cercano',
    kind: 'nova',
    maxLevel: 8,
    levels: L([
      { dmg: 22, count: 1, interval: 2.5, range: 110 },
      { dmg: 24, count: 1, interval: 2.4, range: 120 },
      { dmg: 28, count: 1, interval: 2.3, range: 130 },
      { dmg: 33, count: 1, interval: 2.2, range: 145 },
      { dmg: 38, count: 1, interval: 2.1, range: 160 },
      { dmg: 44, count: 1, interval: 2.0, range: 175 },
      { dmg: 52, count: 1, interval: 1.8, range: 195 },
      { dmg: 60, count: 1, interval: 1.6, range: 220 },
    ]),
  },
  {
    id: 'lanza',
    name: 'Lanza',
    desc: 'Proyectil pesado que atraviesa enemigos',
    kind: 'pierce',
    maxLevel: 8,
    levels: L([
      { dmg: 35, count: 1, interval: 1.4, speed: 380, range: 460 },
      { dmg: 40, count: 1, interval: 1.35, speed: 380, range: 460 },
      { dmg: 45, count: 1, interval: 1.3, speed: 390, range: 470 },
      { dmg: 52, count: 2, interval: 1.3, speed: 390, range: 470 },
      { dmg: 60, count: 2, interval: 1.2, speed: 400, range: 480 },
      { dmg: 68, count: 2, interval: 1.15, speed: 400, range: 490 },
      { dmg: 78, count: 2, interval: 1.1, speed: 410, range: 500 },
      { dmg: 90, count: 2, interval: 1.0, speed: 420, range: 520 },
    ]),
  },
  {
    id: 'hoguera',
    name: 'Hoguera',
    desc: 'Zona de fuego persistente con daño por ticks',
    kind: 'zone',
    maxLevel: 8,
    levels: L([
      { dmg: 12, count: 1, interval: 3.5, range: 70, duration: 3, tick: 0.5 },
      { dmg: 14, count: 1, interval: 3.4, range: 75, duration: 3.2, tick: 0.5 },
      { dmg: 16, count: 1, interval: 3.2, range: 82, duration: 3.4, tick: 0.5 },
      { dmg: 19, count: 1, interval: 3.0, range: 90, duration: 3.6, tick: 0.5 },
      { dmg: 22, count: 1, interval: 2.9, range: 98, duration: 4, tick: 0.45 },
      { dmg: 25, count: 1, interval: 2.7, range: 108, duration: 4.3, tick: 0.45 },
      { dmg: 28, count: 1, interval: 2.6, range: 118, duration: 4.6, tick: 0.45 },
      { dmg: 32, count: 2, interval: 2.5, range: 130, duration: 5, tick: 0.4 },
    ]),
  },
  {
    id: 'megadaga',
    name: 'MegaDaga',
    desc: 'EVOLUCIÓN: abanico de 5 dagas perforantes',
    kind: 'bolt',
    maxLevel: 1,
    levels: L([{ dmg: 90, count: 5, interval: 0.6, speed: 470, range: 500, pierce: true }]),
  },
  {
    id: 'granorbe',
    name: 'GranOrbe',
    desc: 'EVOLUCIÓN: 8 orbes con estela',
    kind: 'orbital',
    maxLevel: 1,
    levels: L([{ dmg: 70, count: 8, interval: 0, range: 150, rotSpeed: 3.2, tick: 0.3 }]),
  },
];

export const EVOLUTIONS: EvolutionDef[] = [
  { weaponId: 'daga', passiveId: 'fuerza', evoId: 'megadaga' },
  { weaponId: 'orbes', passiveId: 'reloj', evoId: 'granorbe' },
];

export const PASSIVES: PassiveDef[] = [
  { id: 'fuerza', name: 'Fuerza', desc: 'Daño +8 % por nivel', maxLevel: 5, levels: [{ desc: '+8 %' }, { desc: '+8 %' }, { desc: '+8 %' }, { desc: '+8 %' }, { desc: '+8 %' }] },
  { id: 'reloj', name: 'Reloj', desc: 'Cadencia +6 % por nivel', maxLevel: 5, levels: [{ desc: '+6 %' }, { desc: '+6 %' }, { desc: '+6 %' }, { desc: '+6 %' }, { desc: '+6 %' }] },
  { id: 'botas', name: 'Botas', desc: 'Velocidad +5 % por nivel', maxLevel: 5, levels: [{ desc: '+5 %' }, { desc: '+5 %' }, { desc: '+5 %' }, { desc: '+5 %' }, { desc: '+5 %' }] },
  { id: 'iman', name: 'Imán', desc: 'Recogida +20 % por nivel', maxLevel: 5, levels: [{ desc: '+20 %' }, { desc: '+20 %' }, { desc: '+20 %' }, { desc: '+20 %' }, { desc: '+20 %' }] },
];

/** Pasivos iniciales que sustituyen a los boosts de Etapa 3 (RF-6). */
export const PASSIVE_FACTORS = {
  fuerza: 1.08,
  reloj: 1.06,
  botas: 1.05,
  iman: 1.2,
} as const;

export function weaponDef(id: string): WeaponDef {
  const def = WEAPONS.find((w) => w.id === id);
  if (!def) throw new Error(`Arma desconocida: ${id}`);
  return def;
}

export function passiveDef(id: string): PassiveDef {
  const def = PASSIVES.find((p) => p.id === id);
  if (!def) throw new Error(`Pasivo desconocido: ${id}`);
  return def;
}

/** ¿Es un id de evolución (no ofertable como arma nueva)? */
export function isEvolution(id: string): boolean {
  return EVOLUTIONS.some((e) => e.evoId === id);
}

/** Armas ofertables como nuevas (excluye evoluciones). */
export function baseWeapons(): WeaponDef[] {
  return WEAPONS.filter((w) => !isEvolution(w.id));
}
