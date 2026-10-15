import { describe, expect, it } from 'vitest';
import { canTick } from '../src/systems/tick';

describe('canTick', () => {
  it('permite el primer tick', () => {
    expect(canTick(-1, 10, 0.4)).toBe(true);
  });

  it('bloquea dentro de la ventana y permite fuera', () => {
    expect(canTick(10, 10.2, 0.4)).toBe(false);
    expect(canTick(10, 10.4, 0.4)).toBe(true);
    expect(canTick(10, 11, 0.4)).toBe(true);
  });
});
