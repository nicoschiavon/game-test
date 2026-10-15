import { describe, expect, it } from 'vitest';
import { DEFAULT_BINDS, defaultSettings, migrateSettings } from '../src/meta/settings';
import { canPlay, SFX } from '../src/audio/synth';
import { phaserKeyName, prettyKey } from '../src/systems/keycodes';
import { readPad } from '../src/systems/gamepad';

describe('migrateSettings', () => {
  it('null/corrupto → defaults', () => {
    expect(migrateSettings(null)).toEqual(defaultSettings());
    expect(migrateSettings('x')).toEqual(defaultSettings());
  });

  it('conserva volúmenes válidos y recorta el resto', () => {
    const s = migrateSettings({ master: 50, music: 200, sfx: -5 });
    expect(s.master).toBe(50);
    expect(s.music).toBe(100);
    expect(s.sfx).toBe(0);
  });

  it('teclas válidas se aceptan, Escape y basura no', () => {
    const s = migrateSettings({ keys: { up: 'KeyW', pause: 'Escape', down: '¡' } });
    expect(s.keys.up).toBe('KeyW');
    expect(s.keys.pause).toBe(DEFAULT_BINDS.pause);
    expect(s.keys.down).toBe(DEFAULT_BINDS.down);
  });

  it('rechaza códigos sin mapeo Phaser', () => {
    const s = migrateSettings({ keys: { up: 'XYZ' } });
    expect(s.keys.up).toBe(DEFAULT_BINDS.up);
  });
});

describe('canPlay (throttle)', () => {
  it('respeta la ventana por efecto', () => {
    const last: Record<string, number> = {};
    expect(canPlay(last, 'shoot', 1000)).toBe(true);
    last['shoot'] = 1000;
    expect(canPlay(last, 'shoot', 1030)).toBe(false);
    expect(canPlay(last, 'shoot', 1071)).toBe(true);
  });

  it('sin throttle y nombres desconocidos', () => {
    expect(canPlay({}, 'die', 0)).toBe(true);
    expect(canPlay({}, 'nope', 0)).toBe(false);
  });

  it('todos los SFX referenciables existen', () => {
    for (const n of ['shoot', 'hit', 'die', 'gem', 'level', 'buy', 'ui', 'hurt', 'evolve', 'boss', 'victory', 'defeat']) {
      expect(SFX[n]).toBeDefined();
    }
  });
});

describe('readPad', () => {  it('null sin pad', () => {
    expect(readPad(null)).toBeNull();
    expect(readPad(undefined)).toBeNull();
  });

  it('deadzone 0.25', () => {
    const p = readPad({ axes: [0.2, -0.1], buttons: [] });
    // ejes bajo deadzone pero sin botones: se considera idle → null
    expect(p).toBeNull();
    const q = readPad({ axes: [0.5, -0.6], buttons: [] })!;
    expect(q.mx).toBeCloseTo(0.5);
    expect(q.my).toBeCloseTo(-0.6);
  });

  it('botones start y A', () => {
    const btn = (pressed: boolean) => ({ pressed });
    const p = readPad({ axes: [0, 0], buttons: [btn(true), null, null, null, null, null, null, null, null, btn(false)] })!;
    expect(p.a).toBe(true);
    expect(p.start).toBe(false);
  });
});

describe('phaserKeyName', () => {
  it('mapea e.code al nombre Phaser', () => {
    expect(phaserKeyName('KeyT')).toBe('T');
    expect(phaserKeyName('KeyI')).toBe('I');
    expect(phaserKeyName('Digit1')).toBe('ONE');
    expect(phaserKeyName('Digit0')).toBe('ZERO');
    expect(phaserKeyName('ArrowUp')).toBe('UP');
    expect(phaserKeyName('Space')).toBe('SPACE');
    expect(phaserKeyName('UP')).toBe('UP');
  });
});

describe('prettyKey', () => {
  it('acorta para mostrar', () => {
    expect(prettyKey('KeyT')).toBe('T');
    expect(prettyKey('Digit1')).toBe('1');
    expect(prettyKey('ArrowUp')).toBe('Up');
  });
});
