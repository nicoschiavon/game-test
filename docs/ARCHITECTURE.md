# Arquitectura — vs02 Survivors (v1.0.0)

## Capas

```
BootScene → MenuScene → GameScene
                             ├─ WeaponEngine (armas del jugador)
                             ├─ EnemyEngine (oleadas, enemigos, jefe)
                             └─ AudioSys (singleton WebAudio)
src/systems/   lógica pura testeable (sin Phaser salvo tipos)
src/meta/      datos + persistencia (personajes, mapas, tienda, save, settings)
src/audio/     síntesis WebAudio (synth puros + player + secuenciador)
src/ui.ts      helpers de UI (botón, panel, fadeAndGo)
```

## Reglas del proyecto

- La escena orquesta; la lógica vive en sistemas/engines. Nada de números
  hard-codeados en escenas: todo balance está en `config.ts`, `weapons/defs.ts`,
  `enemies/defs.ts`, `enemies/waves.ts`, `meta/*`.
- Sistemas puros (`movement, combat, spawner, tiles, hitbox, tick, xp,
  upgrades→retirado, loadout, gamepad, touch, keycodes`) con RNG inyectable
  y tests en `tests/`.
- Pools con tope en todos los grupos (enemigos 340, gemas 400, balas 128,
  eshots 64, partículas 240, números de daño 24). Sin `destroy` en runtime
  salvo limpieza de grupos en reinicio.
- Estados de `GameScene`: `playing | dying | gameover | levelup | victory |
  paused`. `update` retorna pronto por estado; el timer solo avanza en `playing`.
- Overlays con botones: los hijos interactivos de contenedores con
  `scrollFactor(0)` necesitan `scrollFactor(0)` propio (T9 Etapa 3), o los
  clics fallan con la cámara desplazada.
- Orden de args en overlaps: con `(grupo, sprite)` el callback recibe
  `(sprite, hijo)` (`World.collideSpriteVsGroup`). Registrar siempre como
  `(sprite, grupo)` y nombrar params (T9 Etapa 5: un orden invertido
  deshabilitó al jugador en vez del proyectil).
- Guardados: `vs02-save-v1` (progreso), `vs02-settings-v1` (opciones), ambos
  versionados con migración tolerante. Nunca lanzar por storage corrupto.
- Audio: singleton perezoso (autoplay), throttle por efecto, 8 voces máx.

## Flujo de un frame (playing)

1. Input (teclado + binds + gamepad + joystick) → velocidad del jugador.
2. `EnemyEngine.update`: eventos de oleada, trickle con rampa, steering por
   kind, proyectiles enemigos.
3. `WeaponEngine.update`: cada arma del loadout según su tabla y stats.
4. Gemas (imán + recogida), HUD (throttle por cambio), barra de jefe.
5. `elapsed += dt` (clamp 0.1 s).

## Dónde vive cada cosa

| Cosa | Fichero |
|------|---------|
| Tuning global, mundo, HUD | `src/config.ts` |
| Armas/pasivos/evoluciones | `src/weapons/defs.ts`, `engine.ts` |
| Enemigos/oleadas/jefe | `src/enemies/defs.ts`, `waves.ts`, `engine.ts` |
| XP/niveles/upgrades→loadout | `src/systems/xp.ts`, `loadout.ts` |
| Personajes/mapas/tienda/save | `src/meta/*` |
| Escenas | `src/scenes/{Boot,Menu,Game}Scene.ts` |
