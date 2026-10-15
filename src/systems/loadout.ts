// Loadout (armas + pasivos equipados) y generación de ofertas — puro.
// La escena aplica las ofertas; aquí solo decisión con RNG inyectable.

import { EVOLUTIONS, LOADOUT_LIMITS, PASSIVES, baseWeapons, passiveDef, weaponDef } from '../weapons/defs';

export interface OwnedWeapon {
  id: string;
  level: number;
}

export interface OwnedPassive {
  id: string;
  level: number;
}

export interface Loadout {
  weapons: OwnedWeapon[];
  passives: OwnedPassive[];
}

export function emptyLoadout(startWeapon = 'daga'): Loadout {
  return { weapons: [{ id: startWeapon, level: 1 }], passives: [] };
}

export type OfferKind = 'weapon-new' | 'weapon-up' | 'passive-new' | 'passive-up' | 'evolve' | 'heal';

export interface Offer {
  kind: OfferKind;
  /** Arma implicada (nueva, subida o base de evolución). */
  weaponId?: string;
  /** Pasivo implicado (nuevo o subida). */
  passiveId?: string;
  /** Id del arma evolucionada (solo kind 'evolve'). */
  evoId?: string;
  title: string;
  desc: string;
}

export interface EvolveCandidate {
  weaponId: string;
  evoId: string;
}

/** Evoluciones disponibles: arma al máximo + pasivo requerido (nv ≥ 1). */
export function canEvolve(loadout: Loadout): EvolveCandidate[] {
  const out: EvolveCandidate[] = [];
  for (const evo of EVOLUTIONS) {
    const w = loadout.weapons.find((w) => w.id === evo.weaponId);
    const p = loadout.passives.find((p) => p.id === evo.passiveId);
    const already = loadout.weapons.some((w) => w.id === evo.evoId);
    if (!w || !p || already) continue;
    if (w.level >= weaponDef(evo.weaponId).maxLevel) {
      out.push({ weaponId: evo.weaponId, evoId: evo.evoId });
    }
  }
  return out;
}

function shuffled<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Construye 3 ofertas: evoluciones con prioridad, luego mezcla de arma
 * nueva (con hueco), subir arma, pasivo nuevo (con hueco) y subir pasivo.
 * Rellena con curación si no hay opciones.
 */
export function buildOffers(loadout: Loadout, rand: () => number = Math.random): Offer[] {
  const offers: Offer[] = [];

  for (const c of shuffled(canEvolve(loadout), rand)) {
    if (offers.length >= 3) break;
    const evo = weaponDef(c.evoId);
    offers.push({
      kind: 'evolve',
      weaponId: c.weaponId,
      evoId: c.evoId,
      title: evo.name,
      desc: evo.desc,
    });
  }

  const pool: Offer[] = [];
  if (loadout.weapons.length < LOADOUT_LIMITS.weapons) {
    const owned = new Set(loadout.weapons.map((w) => w.id));
    // La base de una evolución ya obtenida no vuelve a ofertarse.
    for (const evo of EVOLUTIONS) {
      if (owned.has(evo.evoId)) owned.add(evo.weaponId);
    }
    for (const w of baseWeapons()) {
      if (owned.has(w.id)) continue;
      pool.push({ kind: 'weapon-new', weaponId: w.id, title: w.name, desc: `${w.desc} (nv 1)` });
    }
  }
  for (const w of loadout.weapons) {
    const def = weaponDef(w.id);
    if (w.level < def.maxLevel) {
      pool.push({
        kind: 'weapon-up',
        weaponId: w.id,
        title: `${def.name} nv ${w.level + 1}`,
        desc: `Mejora ${def.name} al nivel ${w.level + 1}`,
      });
    }
  }
  if (loadout.passives.length < LOADOUT_LIMITS.passives) {
    const owned = new Set(loadout.passives.map((p) => p.id));
    for (const p of PASSIVES) {
      if (owned.has(p.id)) continue;
      pool.push({ kind: 'passive-new', passiveId: p.id, title: p.name, desc: `${p.desc} (nv 1)` });
    }
  }
  for (const p of loadout.passives) {
    const def = passiveDef(p.id);
    if (p.level < def.maxLevel) {
      pool.push({
        kind: 'passive-up',
        passiveId: p.id,
        title: `${def.name} nv ${p.level + 1}`,
        desc: `${def.desc} (nv ${p.level + 1})`,
      });
    }
  }

  for (const o of shuffled(pool, rand)) {
    if (offers.length >= 3) break;
    offers.push(o);
  }
  while (offers.length < 3) {
    offers.push({ kind: 'heal', title: 'Sanar', desc: 'Recupera 30 HP' });
  }
  return offers;
}
