import { describe, expect, it } from 'vitest';
import { grantXp, xpForLevel, XpState } from '../src/systems/xp';

describe('xpForLevel', () => {
  it('es creciente y con valores esperados (base 30, growth 1.35)', () => {
    expect(xpForLevel(1)).toBe(30);
    expect(xpForLevel(2)).toBe(40); // floor(30*1.35)=40
    expect(xpForLevel(3)).toBe(54); // floor(30*1.35^2)=54
    expect(xpForLevel(5)).toBeGreaterThan(xpForLevel(4));
  });

  it('nivel 99 computable sin overflow', () => {
    const v = xpForLevel(99);
    expect(Number.isFinite(v)).toBe(true);
    expect(v).toBeGreaterThan(0);
  });
});

describe('grantXp', () => {
  it('sube de nivel conservando el exceso', () => {
    const s: XpState = { level: 1, xp: 25 };
    expect(grantXp(s, 10)).toBe(1); // 35 >= 30
    expect(s.level).toBe(2);
    expect(s.xp).toBe(5);
  });

  it('no sube si no llega al umbral', () => {
    const s: XpState = { level: 1, xp: 0 };
    expect(grantXp(s, 10)).toBe(0);
    expect(s).toEqual({ level: 1, xp: 10 });
  });

  it('encadena N subidas con una entrega grande', () => {
    const s: XpState = { level: 1, xp: 0 };
    const gained = grantXp(s, 1000);
    expect(gained).toBeGreaterThanOrEqual(3);
    expect(s.xp).toBeLessThan(xpForLevel(s.level));
  });
});
