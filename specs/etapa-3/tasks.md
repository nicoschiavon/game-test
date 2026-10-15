# Etapa 3 — Experiencia y niveles · TASKS

> Aprobada por el usuario el 2026-10-14. Implementación completada y verificada.

- [x] T1 — `config.ts`: `XP_GEM`, `XP_CURVE`, `UPGRADES` (5), `GEMS`, rampa en `SPAWNER`.
- [x] T2 — `src/systems/xp.ts` + `upgrades.ts` + `spawnParams` en `spawner.ts`;
  `tests/xp.test.ts`, `tests/upgrades.test.ts`, ampliación de `spawner.test.ts`.
- [x] T3 — `BootScene`: textura `gem` procedural + `ASSETS.md`. Grupo de gemas,
  drop en `killEnemy` (100 %, pool 400 con tope).
- [x] T4 — Imán + recogida en `update` (sin asignaciones) + `RunStats` aplicado
  a movimiento/arma/HUD.
- [x] T5 — Barra XP + `Nv` en HUD (throttle por clave nivel:xp).
- [x] T6 — Overlay de nivel (3 cartas reutilizadas, clic + 1/2/3), estado
  `levelup`, cola de subidas, pausa total (física congelada verificada).
- [x] T7 — Rampa de spawn 1.2 s/80 ⇒ 0.35 s/300 en 300 s + reinicio total.
- [x] T8 — VERIFY: CA-1…CA-6 + regresión Etapas 1–2, 38/38 tests, build,
  consola limpia, 284 enemigos a 60 FPS estables (CA-5).
- [x] T9 (bugfix post-entrega) — clic en cartas/botones no respondía: los hijos
  interactivos de overlays con `scrollFactor(0)` necesitan `scrollFactor(0)`
  propio (el hit-test usa el del hijo; con cámara desplazada fallaba).
  Solo las teclas 1/2/3 funcionaban. Fix en `bg` (nivel) y `btnBg` (Game Over),
  verificado con clics sintéticos en navegador (carta aplica + reanuda;
  Reiniciar reanuda con HP 100).
