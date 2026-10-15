import { describe, expect, it } from 'vitest';
import { scaledCircle } from '../src/systems/hitbox';

describe('scaledCircle', () => {
  it('conserva el diámetro en pantalla con sprite ×3', () => {
    const p = scaledCircle(14, 3, 16); // jugador Etapa 1: cuerpo 28px
    expect(p.radius * 2 * 3).toBeCloseTo(28, 6);
    const e = scaledCircle(12, 3, 16); // enemigo Etapa 1: cuerpo 24px
    expect(e.radius).toBe(4);
    expect(e.offset).toBe(4);
    expect(e.radius * 2 * 3).toBeCloseTo(24, 6);
  });

  it('centra el cuerpo en el frame', () => {
    const h = scaledCircle(14, 3, 16);
    expect(h.offset * 2 + h.radius * 2).toBeCloseTo(16, 6);
  });

  it('escala 1 = identidad', () => {
    expect(scaledCircle(14, 1, 32)).toEqual({ radius: 14, offset: 2 });
  });
});
