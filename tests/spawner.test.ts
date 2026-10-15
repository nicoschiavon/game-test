import { describe, expect, it } from 'vitest';
import { nextSpawnPoint, spawnParams } from '../src/systems/spawner';

describe('nextSpawnPoint', () => {
  it('genera el punto en el borde pedido con margin', () => {
    const view = { x: 100, y: 100, w: 1280, h: 720 };
    // rand: primero elige borde top (0.0 * 4 = 0), luego posición x (0.5)
    const seq = [0.0, 0.5];
    let i = 0;
    const p = nextSpawnPoint(view, 2000, 2000, 40, () => seq[i++ % seq.length]);
    expect(p.edge).toBe('top');
    expect(p.y).toBe(140);
    expect(p.x).toBeCloseTo(100 + 0.5 * 1280);
  });

  it('clampea al interior del mundo si la cámara está pegada al límite', () => {
    const view = { x: -500, y: -500, w: 1280, h: 720 };
    const p = nextSpawnPoint(view, 2000, 2000, 40, () => 0.99);
    expect(p.x).toBeGreaterThanOrEqual(40);
    expect(p.y).toBeGreaterThanOrEqual(40);
    expect(p.x).toBeLessThanOrEqual(1960);
    expect(p.y).toBeLessThanOrEqual(1960);
  });
});

describe('spawnParams (rampa)', () => {
  it('empieza en 1.2 s / 80 y termina en 0.35 s / 300 a los 300 s', () => {
    expect(spawnParams(0)).toEqual({ interval: 1.2, max: 80 });
    const end = spawnParams(300);
    expect(end.interval).toBeCloseTo(0.35, 9);
    expect(end.max).toBe(300);
  });

  it('interpola a mitad de rampa', () => {
    const mid = spawnParams(150);
    expect(mid.interval).toBeCloseTo((1.2 + 0.35) / 2, 9);
    expect(mid.max).toBe(190);
  });

  it('se mantiene constante tras la rampa', () => {
    expect(spawnParams(9999)).toEqual(spawnParams(300));
  });
});
