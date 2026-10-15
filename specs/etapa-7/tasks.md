# Etapa 7 — Audio, game feel y opciones · TASKS

> Implementación completada y verificada (con 2 notas).

- [x] T0 (spike mazmorra) — BLOQUEADO sin datos del usuario (FPS DEV en
  arena vs mazmorra + captura/clip). Análisis estático: el render es idéntico
  en ambos mapas (mismo tileset/capas/cámara con roundPixels); hipótesis:
  shimmer en ladrillo de alto contraste o micro-stutter por +15 % de presión.
  Sin cambios a ciegas.
- [x] T1 — `src/audio/` (synth 12 SFX, player con throttle y 8 voces,
  secuenciador 112 BPM) + integración en armas/enemigos/gemas/nivel/tienda/
  fin/jefe + `ASSETS.md` (generado). Música arranca en primer input.
- [x] T2 — `src/meta/settings.ts` + `tests/settings.test.ts` (migrate,
  throttle, gamepad). `src/systems/keycodes.ts` (mapeo e.code→Phaser) tras
  cazar bug real: `KeyCodes['KeyT']` no existe (es `T`); los binds usaban
  fallback erróneo. Verificación: remap Arriba→T mueve −216 px en runtime.
- [x] T3 — Pausa (estado, overlay sin tweens, `physics+tweens+time` pausados,
  Esc/P) + volúmenes −/+ persistidos. Timer congelado verificado.
  Corrección: textos de remap quedaban tras el botón (orden en contenedor).
- [x] T4 — Remap de 4 dirs + pausa (captura, validación, persistencia,
  `applyBinds`). Movimiento con T verificado en runtime.
- [x] T5 — Hit-stop (élite 50/jefe 60/evolución 40), destello+sonido en gema,
  pop de XP, fades menú↔partida (`fadeAndGo`).
- [x] T6 — `src/systems/gamepad.ts` + polling (stick con deadzone 0.25,
  start=pausa, A=confirmar/nivel-opción-1). Sin hardware: CA-5 delegada.
- [x] T7 — Balance aplicado (tablas): esqueleto 2.4 s→2.8 s y 210→190,
  araña 12→10, élite 550→500, demonio 2500→2200, bruto 70→75, nova L1 20→22.
- [x] T8 — VERIFY: 74/74 tests, tsc + build verdes (36 módulos), menú y pausa
  en navegador con 0 errores de consola, pausa/reanudar/remap/volumen/mute
  verificados en runtime, captura de pausa. CA-5 (gamepad) pendiente del
  usuario. Limpieza de `.verify-*.png` pendiente al entregar.
