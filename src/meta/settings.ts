// Ajustes persistentes — IO aislada, resto puro. Clave: vs02-settings-v1.

import { phaserKeyName } from '../systems/keycodes';

export const SETTINGS_KEY = 'vs02-settings-v1';
export const SETTINGS_VERSION = 1;

export interface KeyBinds {
  up: string;
  down: string;
  left: string;
  right: string;
  pause: string;
}

export interface Settings {
  version: number;
  master: number; // 0-100
  music: number; // 0-100
  sfx: number; // 0-100
  keys: KeyBinds;
}

export const DEFAULT_BINDS: KeyBinds = {
  up: 'KeyI',
  down: 'KeyK',
  left: 'KeyJ',
  right: 'KeyL',
  pause: 'KeyP',
};

export function defaultSettings(): Settings {
  return { version: SETTINGS_VERSION, master: 80, music: 70, sfx: 80, keys: { ...DEFAULT_BINDS } };
}

function clampVol(v: unknown): number {
  return typeof v === 'number' && Number.isFinite(v) ? Math.min(100, Math.max(0, Math.round(v))) : -1;
}

/** Migra cualquier cosa a Settings sin lanzar. Teclas inválidas → default. */
export function migrateSettings(raw: unknown): Settings {
  const out = defaultSettings();
  if (!raw || typeof raw !== 'object') return out;
  const r = raw as Partial<Settings>;
  const m = clampVol(r.master);
  if (m >= 0) out.master = m;
  const mu = clampVol(r.music);
  if (mu >= 0) out.music = mu;
  const s = clampVol(r.sfx);
  if (s >= 0) out.sfx = s;
  if (r.keys && typeof r.keys === 'object') {
    (Object.keys(DEFAULT_BINDS) as (keyof KeyBinds)[]).forEach((k) => {
      const v = (r.keys as Partial<KeyBinds>)[k];
      if (typeof v === 'string' && v.length <= 12 && v !== 'Escape' && phaserKeyName(v)) {
        out.keys[k] = v;
      }
    });
  }
  return out;
}

export function loadSettings(storage: Pick<Storage, 'getItem'>): Settings {
  try {
    const raw = storage.getItem(SETTINGS_KEY);
    if (!raw) return defaultSettings();
    return migrateSettings(JSON.parse(raw));
  } catch {
    return defaultSettings();
  }
}

export function persistSettings(storage: Pick<Storage, 'setItem'>, s: Settings): void {
  try {
    storage.setItem(SETTINGS_KEY, JSON.stringify({ ...s, version: SETTINGS_VERSION }));
  } catch {
    /* sin almacenamiento: sigue sin persistir */
  }
}
