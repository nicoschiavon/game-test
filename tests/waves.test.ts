import { describe, expect, it } from 'vitest';
import { enemyDef, scaleAt, splitMinis } from '../src/enemies/defs';
import { mixAt, nextEvents, pickEnemyType, WAVES } from '../src/enemies/waves';

describe('WAVES', () => {
  it('calendario ordenado por t', () => {
    for (let i = 1; i < WAVES.length; i++) {
      expect(WAVES[i].t).toBeGreaterThanOrEqual(WAVES[i - 1].t);
    }
  });

  it('jefe a los 480 s con aviso 3 s antes, élites a 180/360', () => {
    expect(WAVES.some((e) => e.op === 'boss' && e.t === 480)).toBe(true);
    expect(WAVES.some((e) => e.op === 'banner' && e.t === 477)).toBe(true);
    expect(WAVES.filter((e) => e.op === 'elite').map((e) => e.t)).toEqual([180, 360]);
  });

  it('nextEvents dispara cada evento una vez y en orden', () => {
    const fired = new Set<number>();
    const first = nextEvents(-1, 45, fired);
    expect(first.length).toBeGreaterThan(0);
    expect(first.every((e) => e.t <= 45)).toBe(true);
    const again = nextEvents(-1, 45, fired);
    expect(again).toEqual([]);
    const later = nextEvents(45, 1000, fired);
    expect(later.length).toBe(WAVES.length - first.length);
  });
});

describe('mixAt', () => {
  it('al inicio solo slime', () => {
    expect(mixAt(0)).toEqual([{ id: 'slime', w: 1 }]);
  });

  it('desbloquea por tiempo y suma 1', () => {
    const ids100 = mixAt(100).map((m) => m.id);
    expect(ids100).toEqual(['slime', 'bat', 'spider']);
    for (const t of [0, 45, 200, 480, 999]) {
      const sum = mixAt(t).reduce((s, m) => s + m.w, 0);
      expect(sum).toBeCloseTo(1, 9);
    }
  });

  it('pickEnemyType determinista con RNG', () => {
    const mix = mixAt(100);
    expect(pickEnemyType(mix, () => 0)).toBe('slime');
    expect(pickEnemyType(mix, () => 0.999)).toBe(mix[mix.length - 1].id);
  });
});

describe('scaleAt', () => {
  it('monótona con valores esperados', () => {
    expect(scaleAt(0)).toEqual({ hp: 1, dmg: 1 });
    expect(scaleAt(60)).toEqual({ hp: 1.25, dmg: 1.08 });
    expect(scaleAt(480).hp).toBeCloseTo(3, 9);
  });
});

describe('enemigos', () => {
  it('9 defs con sprite y stats positivos', () => {
    for (const id of ['slime', 'bat', 'spider', 'ghost', 'skeleton', 'brute', 'mini', 'elite', 'demon']) {
      const d = enemyDef(id);
      expect(d.tex.length).toBeGreaterThan(0);
      expect(d.hp).toBeGreaterThan(0);
      expect(d.xp).toBeGreaterThan(0);
    }
  });

  it('splitMinis devuelve 2 minis laterales', () => {
    expect(splitMinis()).toEqual([
      { id: 'mini', dx: -18, dy: 0 },
      { id: 'mini', dx: 18, dy: 0 },
    ]);
  });
});
