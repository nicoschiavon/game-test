# Etapa 2 — Mejora gráfica · TASKS

> Aprobada por el usuario el 2026-10-14. Implementación completada y verificada.

- [x] T1 — Descargar zip oficial Tiny Dungeon, elegir sprites (jugador 85, enemigo
  108, tileset completo), copiar a `public/assets/` y escribir `ASSETS.md`
  (origen, URL, licencia CC0, lista de ficheros). Desvío doc.: `assets/` →
  `public/assets/` (requisito de Vite para servir estáticos).
- [x] T2 — `src/systems/tiles.ts` (pickers puros con RNG inyectable) +
  `tests/tiles.test.ts` en verde. Verificación: CA-5.
- [x] T3 — `BootScene` (preload PNGs + `spark`/`bullet` procedurales) y alta en
  `main.ts` (`pixelArt: true`); `config.ts` += `SPRITES`/`TILES`. Network sin 404.
- [x] T4 — Jugador/enemigo con sprites + bob/squash procedural + flipX +
  hitboxes idénticas a Etapa 1 (`hitbox.ts` + test; body 28×28 verificado en runtime).
- [x] T5 — Tilemap 125×125 con variantes + decoración (ajustada a 4 % por
  claridad) + anillo de muros. Captura verificada.
- [x] T6 — Kill FX (burst + número de daño con pool de 24) + hurt FX (parpadeo +
  shake 90 ms solo al jugador) + muerte del jugador con animación 400 ms.
  Verificación: CA-4 + flujo dying→gameover→R.
- [x] T7 — HUD pulido (paneles, barra con borde y 3 estados, pulso HP bajo,
  cronómetro) + FPS solo en DEV (60 FPS medidos). Verificación: RF-8/RF-9.
- [x] T8 — VERIFY: CA-1…CA-7 + regresión Etapa 1 (jugar→morir→reiniciar),
  `npm run test` (21/21), `npm run build`, 0 errores en consola.
