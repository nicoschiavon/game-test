import { describe, expect, it } from 'vitest';
import { applyDamage, findNearestEnemyIndex, shouldTakeDamage } from '../src/systems/combat';

describe('findNearestEnemyIndex', () => {
  it('devuelve el más cercano en rango', () => {
    const enemies = [
      { x: 100, y: 0, hp: 50 },
      { x: 30, y: 0, hp: 50 },
      { x: 10, y: 0, hp: 50 },
    ];
    expect(findNearestEnemyIndex(0, 0, enemies, 420)).toBe(2);
  });

  it('devuelve -1 si no hay ninguno en rango', () => {
    const enemies = [{ x: 500, y: 0, hp: 50 }];
    expect(findNearestEnemyIndex(0, 0, enemies, 420)).toBe(-1);
  });

  it('ignora enemigos muertos', () => {
    const enemies = [
      { x: 5, y: 0, hp: 0 },
      { x: 40, y: 0, hp: 20 },
    ];
    expect(findNearestEnemyIndex(0, 0, enemies, 420)).toBe(1);
  });
});

describe('applyDamage + i-frames', () => {
  it('resta daño sin bajar de 0', () => {
    expect(applyDamage(100, 10)).toBe(90);
    expect(applyDamage(5, 25)).toBe(0);
  });

  it('bloquea el segundo golpe dentro de la ventana de invulnerabilidad', () => {
    const invuln = 0.6;
    expect(shouldTakeDamage(10.0, -1, invuln)).toBe(true); // primer golpe
    expect(shouldTakeDamage(10.3, 10.0, invuln)).toBe(false); // dentro
    expect(shouldTakeDamage(10.6, 10.0, invuln)).toBe(true); // fuera
  });
});
