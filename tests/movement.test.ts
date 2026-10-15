import { describe, expect, it } from 'vitest';
import { clampToWorld, formatTime, normalizeMoveVector } from '../src/systems/movement';

describe('normalizeMoveVector', () => {
  it('vector nulo se queda en cero', () => {
    expect(normalizeMoveVector(0, 0)).toEqual({ x: 0, y: 0 });
  });

  it('vector ortogonal conserva magnitud 1', () => {
    expect(normalizeMoveVector(1, 0)).toEqual({ x: 1, y: 0 });
  });

  it('diagonal (1,1) se normaliza a magnitud 1 ±0.05', () => {
    const v = normalizeMoveVector(1, 1);
    expect(Math.hypot(v.x, v.y)).toBeCloseTo(1, 2);
    expect(Math.abs(v.x - v.y)).toBeLessThan(1e-9);
  });

  it('vector pequeño no se amplifica', () => {
    const v = normalizeMoveVector(0.3, 0.4);
    expect(v.x).toBeCloseTo(0.3);
    expect(v.y).toBeCloseTo(0.4);
  });
});

describe('clampToWorld', () => {
  it('limita fuera de bordes al interior', () => {
    expect(clampToWorld({ x: -50, y: 5000 }, 2000, 2000, 14)).toEqual({ x: 14, y: 1986 });
  });
});

describe('formatTime', () => {
  it('formatea MM:SS', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(65)).toBe('01:05');
    expect(formatTime(599)).toBe('09:59');
  });
});
