# Etapa 4 — Armas y pasivos · TASKS

> Aprobada por el usuario el 2026-10-14. Implementación completada y verificada.

- [x] T1 — Datos: `src/weapons/defs.ts` (`WeaponDef`×5 + 2 evo, tablas 1–8;
  `PassiveDef`×4, 1–5; `EvolutionDef`×2) + texturas `orb/spear/ring/zone` en
  `BootScene` + `ASSETS.md`.
- [x] T2 — `systems/loadout.ts` + `tick.ts` + `tests/loadout.test.ts` (8),
  `tests/tick.test.ts` (2). Verificación: CA-3, CA-4.
- [x] T3 — `weapons/engine.ts` (pools + dispatch por kind) + refactor Daga
  (comportamiento idéntico a Etapa 3 a nv1). Verificación: regresión.
- [x] T4 — Orbes + Nova (pools, FX, ticks por enemigo). Verificación: CA-1.
- [x] T5 — Lanza perforante (set de impactados por proyectil) + Hoguera
  (ticks, duración, radio visible).
- [x] T6 — Pasivos con `composeStats`, overlay de ofertas mixtas + fallback
  Sanar (+30), evoluciones MegaDaga/GranOrbe (runtime verificado).
  Correcciones: sin doble "EVOLUCIÓN:"; la base evolucionada no se re-oferta.
- [x] T7 — Boosts de Etapa 3 retirados del pool (`upgrades.ts` + su test
  eliminados; `WEAPON` de config eliminado); HUD de loadout mínimo.
- [x] T8 — VERIFY: CA-1…CA-6, 210 enemigos + 3 armas a 60 FPS (CA-5),
  39/39 tests, build, consola limpia, regresión con clic (T9 de Etapa 3).
  Nota: un "atasco" aparente con clics sintéticos `PointerEvent` resultó ser
  artefacto del harness (los managers de Phaser escuchan `mousedown`/`touch*`,
  no `pointer*`; con `MouseEvent` reales 4/4 clics consumen). Sin bug en el juego.
