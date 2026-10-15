import { describe, expect, it } from 'vitest';
import { STICK_RADIUS, stickVector } from '../src/systems/touch';

describe('stickVector', () => {
  it('cero en el origen y dentro de la deadzone', () => {
    expect(stickVector(0, 0, 0, 0)).toEqual({ mx: 0, my: 0 });
    expect(stickVector(0, 0, 5, 0)).toEqual({ mx: 0, my: 0 });
  });

  it('proporcional dentro del radio', () => {
    const v = stickVector(0, 0, STICK_RADIUS / 2, 0);
    expect(v.mx).toBeCloseTo(0.5, 9);
    expect(v.my).toBe(0);
  });

  it('clamp en el borde', () => {
    const v = stickVector(0, 0, STICK_RADIUS * 3, STICK_RADIUS * 4);
    expect(Math.hypot(v.mx, v.my)).toBeCloseTo(1, 9);
    expect(v.mx).toBeCloseTo(0.6, 9);
    expect(v.my).toBeCloseTo(0.8, 9);
  });
});
