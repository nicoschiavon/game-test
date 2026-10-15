// Guardado versionado en localStorage — IO aislada aquí, resto puro.
// Clave: vs02-save-v1. Si el contenido es corrupto o de otra versión,
// se migra a default conservando las almas cuando sean un número.

import { RunStats, baseRunStats } from '../config';
import { CharacterDef } from './characters';
import { shopDef } from './shop';

export const SAVE_KEY = 'vs02-save-v1';
export const SAVE_VERSION = 1;

export interface RunReward {
  kills: number;
  level: number;
  seconds: number;
  victory: boolean;
}

export interface SaveV1 {
  version: number;
  souls: number;
  shop: Record<string, number>;
  runs: number;
  victories: number;
  bestTimeSec: number;
  tutorialSeen: boolean;
}

export function defaultSave(): SaveV1 {
  return { version: SAVE_VERSION, souls: 0, shop: {}, runs: 0, victories: 0, bestTimeSec: 0, tutorialSeen: false };
}

/** Migra cualquier cosa a SaveV1 sin lanzar excepciones. */
export function migrate(raw: unknown): SaveV1 {
  const base = defaultSave();
  if (!raw || typeof raw !== 'object') return base;
  const r = raw as Partial<SaveV1>;
  const souls = typeof r.souls === 'number' && Number.isFinite(r.souls) && r.souls >= 0 ? Math.floor(r.souls) : 0;
  const shop: Record<string, number> = {};
  if (r.shop && typeof r.shop === 'object') {
    for (const [k, v] of Object.entries(r.shop)) {
      if (typeof v === 'number' && Number.isFinite(v) && v > 0) {
        try {
          shop[k] = Math.min(Math.floor(v), shopDef(k).maxLevel);
        } catch {
          /* id desconocido: se descarta */
        }
      }
    }
  }
  return {
    version: SAVE_VERSION,
    souls,
    shop,
    runs: typeof r.runs === 'number' && r.runs > 0 ? Math.floor(r.runs) : 0,
    victories: typeof r.victories === 'number' && r.victories > 0 ? Math.floor(r.victories) : 0,
    bestTimeSec:
      typeof r.bestTimeSec === 'number' && r.bestTimeSec > 0 ? Math.floor(r.bestTimeSec) : 0,
    tutorialSeen: r.tutorialSeen === true,
  };
}

export function loadSave(storage: Pick<Storage, 'getItem'>): SaveV1 {
  try {
    const raw = storage.getItem(SAVE_KEY);
    if (!raw) return defaultSave();
    return migrate(JSON.parse(raw));
  } catch {
    return defaultSave();
  }
}

export function persistSave(storage: Pick<Storage, 'setItem'>, save: SaveV1): void {
  try {
    storage.setItem(SAVE_KEY, JSON.stringify({ ...save, version: SAVE_VERSION }));
  } catch {
    /* almacenamiento no disponible: la partida sigue sin persistir */
  }
}

/** Almas por partida: kills + nivel·5 + minutos·10 (+100 victoria), ×avaricia. */
export function soulsForRun(r: RunReward, greedMul = 1): number {
  const base = r.kills + r.level * 5 + Math.floor(r.seconds / 60) * 10 + (r.victory ? 100 : 0);
  return Math.floor(base * greedMul);
}

/** Stats base = run base × tienda × personaje (antes de pasivos de la run). */
export function applyMeta(base: RunStats, save: SaveV1, char: CharacterDef): RunStats {
  const shopLvl = (id: string) => save.shop[id] ?? 0;
  return {
    dmgMul: base.dmgMul * Math.pow(1.04, shopLvl('filo')) * char.dmgMul,
    rateMul: base.rateMul,
    speedMul: base.speedMul * Math.pow(1.03, shopLvl('botas')) * char.speedMul,
    maxHp: base.maxHp + 10 * shopLvl('corazon') + (char.maxHp - 100),
    pickupRadius: base.pickupRadius,
  };
}

/** Multiplicador de almas por tienda. */
export function greedMul(save: SaveV1): number {
  return Math.pow(1.05, save.shop['avaricia'] ?? 0);
}
