# Etapa 5 — Enemigos, oleadas y jefes · TASKS

> Aprobada por el usuario el 2026-10-14 (implícita en "Siguiente etapa").
> Implementación completada y verificada. Sin código pendiente.

- [x] T1 — Tiles 109/110/111/121/122/123 → `public/assets/e-*.png` (+ `e-slime`),
  `ASSETS.md`, `eshot` en `BootScene`, `SPRITES.enemy.key='e-slime'`.
- [x] T2 — `src/enemies/defs.ts` (9 defs + `scaleAt` + `splitMinis`) y
  `src/enemies/waves.ts` (`WAVES`, `mixAt`, `pickEnemyType`, `nextEvents`) +
  `tests/waves.test.ts` (9). Verificación: CA-2, CA-5.
- [x] T3 — `src/enemies/engine.ts`: spawn por especie + steering de 6 kinds +
  telegrafiados (embestida, carga). Hitboxes vía `scaledCircle` (runtime OK).
- [x] T4 — Proyectiles enemigos (pool 64, overlap único, i-frames) + kite 280 px.
- [x] T5 — Fantasma → 2 minis (runtime: 2); élite 5 gemas, jefe 20 (runtime: 21).
- [x] T6 — Élites 3:00/6:00 con banner; Rey Demonio 8:00 con aviso, radial×12,
  invocación, carga y barra HP (runtime: 40 eshots, 34 slimes, barra visible).
- [x] T7 — Estado `victory` + overlay (tiempo/nivel/kills) + R/botón;
  reinicio total (oleadas, jefe, kills, barra).
- [x] T8 — VERIFY: CA-1…CA-7; 281 mixtos + 47 eshots a 60 FPS ×5 (CA-6);
  48/48 tests, build, consola limpia, regresión muerte→Game Over intacta.
  Nota: medición de `body.width` en el mismo tick del spawn sale sin escalar
  (`_sx` se sincroniza en el siguiente paso físico); verificado que al cabo de
  1 frame los cuerpos son correctos (bruto 32×28 con wobble). Sin bug.
- [x] T9 (bugfix post-entrega, reporte de playtest) —
  BUG-VISUAL: enemigos con modelo equivocado al reutilizar el pool
  (`Group.get()` no cambia la textura del miembro reciclado). Fix:
  `setTexture(def.tex)` en `EnemyEngine.spawn`. Verificado: 5 especies
  re-spawneadas sobre pool de ex-slimes, todas con su textura.
  BUG-JUGABILIDAD: un proyectil enemigo hacía desaparecer al jugador
  (invisible, inmóvil, sin daño; partida "rota" pero viva). Causa:
  `overlap(eshots, player, cb)` invoca el callback como (player, eshot)
  (World.collideSpriteVsGroup, líneas 1971/2115) y el handler tomaba el
  primer arg como proyectil → `player.disableBody(true,true)` + daño 8
  (fallback `?? 8`). Fix: registro (player, eshots) + handler
  `(playerObj, shotObj)`. Verificado: eshot quita 8, jugador visible,
  activo y móvil. Auditoría: el resto de overlaps usan orden correcto.
