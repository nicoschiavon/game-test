import { describe, expect, it } from 'vitest';
import { WEAPONS } from '../src/weapons/defs';
import { buildOffers, canEvolve, emptyLoadout, Loadout } from '../src/systems/loadout';

describe('tablas de armas', () => {
  it('5 base + 2 evoluciones, niveles 1–8 y daño monótono', () => {
    const base = WEAPONS.filter((w) => w.maxLevel === 8);
    expect(base).toHaveLength(5);
    for (const w of WEAPONS) {
      expect(w.levels.length).toBe(w.maxLevel);
      for (let i = 1; i < w.levels.length; i++) {
        expect(w.levels[i].dmg).toBeGreaterThanOrEqual(w.levels[i - 1].dmg);
      }
    }
  });
});

describe('canEvolve', () => {
  it('exige arma al máximo + pasivo', () => {
    const l: Loadout = { weapons: [{ id: 'daga', level: 8 }], passives: [] };
    expect(canEvolve(l)).toEqual([]);
    l.passives.push({ id: 'fuerza', level: 1 });
    expect(canEvolve(l)).toEqual([{ weaponId: 'daga', evoId: 'megadaga' }]);
  });

  it('no repite evolución ya obtenida', () => {
    const l: Loadout = {
      weapons: [{ id: 'megadaga', level: 1 }],
      passives: [{ id: 'fuerza', level: 3 }],
    };
    expect(canEvolve(l)).toEqual([]);
  });
});

describe('buildOffers', () => {
  it('al inicio ofrece mezclas sin evolución y 3 distintas', () => {
    const offers = buildOffers(emptyLoadout(), () => 0.5);
    expect(offers).toHaveLength(3);
    const kinds = new Set(offers.map((o) => `${o.kind}:${o.weaponId ?? o.passiveId ?? ''}`));
    expect(kinds.size).toBe(3);
    expect(offers.some((o) => o.kind === 'evolve')).toBe(false);
  });

  it('prioriza la evolución cuando está disponible', () => {
    const l: Loadout = {
      weapons: [{ id: 'daga', level: 8 }],
      passives: [{ id: 'fuerza', level: 2 }],
    };
    const offers = buildOffers(l, () => 0.1);
    expect(offers[0].kind).toBe('evolve');
    expect(offers[0].evoId).toBe('megadaga');
  });

  it('no ofrece arma nueva con 3 armas', () => {
    const l: Loadout = {
      weapons: [
        { id: 'daga', level: 2 },
        { id: 'orbes', level: 2 },
        { id: 'nova', level: 2 },
      ],
      passives: [],
    };
    const offers = buildOffers(l, () => 0.7);
    expect(offers.some((o) => o.kind === 'weapon-new')).toBe(false);
  });

  it('no re-oferta la base de una evolución ya obtenida', () => {
    const l: Loadout = {
      weapons: [{ id: 'megadaga', level: 1 }],
      passives: [{ id: 'fuerza', level: 1 }],
    };
    for (let k = 0; k < 20; k++) {
      const offers = buildOffers(l, Math.random);
      expect(offers.some((o) => o.kind === 'weapon-new' && o.weaponId === 'daga')).toBe(false);
    }
  });

  it('fallback a curación con todo al máximo', () => {
    const l: Loadout = {
      weapons: [
        { id: 'megadaga', level: 1 },
        { id: 'granorbe', level: 1 },
        { id: 'nova', level: 8 },
      ],
      passives: [
        { id: 'fuerza', level: 5 },
        { id: 'reloj', level: 5 },
        { id: 'botas', level: 5 },
      ],
    };
    const offers = buildOffers(l, () => 0.3);
    expect(offers.every((o) => o.kind === 'heal')).toBe(true);
  });
});
