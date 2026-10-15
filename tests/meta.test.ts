import { describe, expect, it } from 'vitest';
import { baseRunStats } from '../src/config';
import { characterDef, CHARACTERS } from '../src/meta/characters';
import { mapDef, MAPS } from '../src/meta/maps';
import { shopCost, shopDef, SHOP } from '../src/meta/shop';
import { applyMeta, defaultSave, greedMul, migrate, soulsForRun } from '../src/meta/save';
import { weaponDef } from '../src/weapons/defs';

const BOOT_TEX = ['player', 'player-mage', 'player-barbaro'];

describe('soulsForRun', () => {
  it('cero con partida vacía', () => {
    expect(soulsForRun({ kills: 0, level: 1, seconds: 30, victory: false })).toBe(5);
  });

  it('suma victoria y minutos', () => {
    expect(soulsForRun({ kills: 100, level: 10, seconds: 480, victory: true })).toBe(
      100 + 50 + 80 + 100,
    );
  });

  it('aplica avaricia', () => {
    expect(soulsForRun({ kills: 100, level: 1, seconds: 0, victory: false }, 1.05)).toBe(110);
  });
});

describe('shop', () => {
  it('coste creciente y MAX en 5', () => {
    const def = shopDef('filo');
    const costs = [0, 1, 2, 3, 4].map((l) => shopCost(def, l));
    for (let i = 1; i < costs.length; i++) expect(costs[i]).toBeGreaterThan(costs[i - 1]);
    expect(def.maxLevel).toBe(5);
  });
});

describe('migrate', () => {
  it('null/corrupto → default', () => {
    expect(migrate(null)).toEqual(defaultSave());
    expect(migrate('basura')).toEqual(defaultSave());
    expect(migrate(42)).toEqual(defaultSave());
  });

  it('v0 conserva almas y descarta ids inválidos', () => {
    const s = migrate({ souls: 137, shop: { filo: 2, fake: 9, botas: -1 }, runs: 3 });
    expect(s.souls).toBe(137);
    expect(s.shop).toEqual({ filo: 2 });
    expect(s.runs).toBe(3);
    expect(s.version).toBe(1);
  });

  it('recorta niveles al máximo', () => {
    expect(migrate({ shop: { filo: 99 } }).shop).toEqual({ filo: 5 });
  });

  it('tutorialSeen false por defecto, true si viene marcado', () => {
    expect(migrate({}).tutorialSeen).toBe(false);
    expect(migrate({ tutorialSeen: true }).tutorialSeen).toBe(true);
    expect(migrate({ tutorialSeen: 1 }).tutorialSeen).toBe(false);
  });
});

describe('applyMeta', () => {
  it('sin tienda ni personaje especial = base', () => {
    const s = applyMeta(baseRunStats(), defaultSave(), characterDef('caballero'));
    expect(s).toEqual(baseRunStats());
  });

  it('compone tienda × personaje', () => {
    const save = { ...defaultSave(), shop: { filo: 1, botas: 2, corazon: 1 } };
    const s = applyMeta(baseRunStats(), save, characterDef('barbaro'));
    expect(s.dmgMul).toBeCloseTo(1.04 * 1.1, 9);
    expect(s.speedMul).toBeCloseTo(1.03 * 1.03 * 0.92, 9);
    expect(s.maxHp).toBe(100 + 10 + 40);
  });

  it('maga: menos vida, más daño', () => {
    const s = applyMeta(baseRunStats(), defaultSave(), characterDef('maga'));
    expect(s.maxHp).toBe(80);
    expect(s.dmgMul).toBeCloseTo(1.2, 9);
  });
});

describe('greedMul', () => {
  it('1 sin avaricia, 1.05^n con ella', () => {
    expect(greedMul(defaultSave())).toBe(1);
    expect(greedMul({ ...defaultSave(), shop: { avaricia: 2 } })).toBeCloseTo(1.1025, 9);
  });
});

describe('defs válidos', () => {
  it('3 personajes con sprite y arma inicial existentes', () => {
    expect(CHARACTERS).toHaveLength(3);
    for (const c of CHARACTERS) {
      expect(BOOT_TEX).toContain(c.tex);
      expect(weaponDef(c.startWeapon).maxLevel).toBeGreaterThan(0);
    }
  });

  it('2 mapas con mods positivos y tiles válidos (0–131)', () => {
    expect(MAPS).toHaveLength(2);
    for (const m of MAPS) {
      const def = mapDef(m.id);
      expect(def.mods.spawnIntervalMul).toBeGreaterThan(0);
      expect(def.mods.enemyHpMul).toBeGreaterThan(0);
      expect(def.mods.xpMul).toBeGreaterThan(0);
      const idx = [...def.ground.map((g) => g.index), ...def.decor.map((d) => d.index), def.wall];
      expect(idx.every((i) => i >= 0 && i < 132)).toBe(true);
    }
  });

  it('4 vías de tienda', () => {
    expect(SHOP.map((s) => s.id).sort()).toEqual(['avaricia', 'botas', 'corazon', 'filo']);
  });
});
