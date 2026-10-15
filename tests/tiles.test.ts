import { describe, expect, it } from 'vitest';
import { TILES } from '../src/config';
import { pickDecorTile, pickGroundVariant, pickWeighted, shouldPlaceDecor } from '../src/systems/tiles';

const seq = (vals: number[]) => {
  let i = 0;
  return () => vals[i++ % vals.length];
};

describe('pickWeighted', () => {
  it('respeta los pesos con RNG inyectado', () => {
    const opts = [
      { index: 48, weight: 0.6 },
      { index: 49, weight: 0.4 },
    ];
    expect(pickWeighted(opts, seq([0]))).toBe(48); // inicio del rango
    expect(pickWeighted(opts, seq([0.59]))).toBe(48);
    expect(pickWeighted(opts, seq([0.61]))).toBe(49);
    expect(pickWeighted(opts, seq([0.999]))).toBe(49);
  });
});

describe('pickGroundVariant', () => {
  it('solo devuelve índices de suelo válidos', () => {
    const valid = new Set(TILES.ground.map((g) => g.index));
    for (let k = 0; k < 200; k++) {
      expect(valid.has(pickGroundVariant())).toBe(true);
    }
  });

  it('la base (48) domina en muestra grande', () => {
    let base = 0;
    const N = 2000;
    for (let k = 0; k < N; k++) if (pickGroundVariant() === 48) base++;
    expect(base / N).toBeGreaterThan(0.5); // peso 0.6 ± margen
  });
});

describe('decoración', () => {
  it('shouldPlaceDecor respeta el umbral de config', () => {
    const c = TILES.decorChance;
    expect(shouldPlaceDecor(seq([c - 0.001]))).toBe(true);
    expect(shouldPlaceDecor(seq([c]))).toBe(false);
    expect(shouldPlaceDecor(seq([0.9]))).toBe(false);
  });

  it('pickDecorTile solo devuelve índices de decoración válidos', () => {
    const valid = new Set(TILES.decor.map((d) => d.index));
    for (let k = 0; k < 200; k++) {
      expect(valid.has(pickDecorTile())).toBe(true);
    }
  });
});
