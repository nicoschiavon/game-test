# Etapa 8 — Pulido final y entrega · TASKS

> Implementación completada y verificada.

- [x] T1 — `base: './'`, versión 1.0.0, `touch-action: none` + overscroll;
  heap t0 (60 s) vs t1 (+4 min churn, ~2900 kills): pools acotados por diseño
  (enemigos 340, gemas 400, balas 128, eshots 64, daño 24); tweens y timers a 0
  tras churn; único crecimiento: pool de partículas a pico concurrente →
  acotado con `maxParticles: 240`. Resto del delta = ruido de DevTools
  (strings/numbers del propio harness). Sin fugas del juego.
- [x] T2 — Matriz de regresión pasada: Esc/R en levelup ignorados, drenaje de
  ofertas, reintentos ×3 (gameover→playing:100), menú→jugar→menú→jugar limpio,
  victoria→R, storage corrupto→defaults sin crash, resize sin errores, compra
  con saldo exacto (50→0, nv1, persiste). Tab oculta 30 s: delegada (existe
  clamp de delta 0.1 s por diseño). 0 errores de consola en todo.
- [x] T3 — Ayuda en menú (overlay verificado con captura) + banner de primera
  partida (`tutorialSeen` en save + migrate + test, banner y persistencia
  verificados en runtime).
- [x] T4 — `src/systems/touch.ts` + joystick flotante (mitad izquierda, solo
  con touch, sin interferir UI) + `tests/touch.test.ts`. Verificado en runtime
  con touch simulado: start→stick visible, move→+326 px, end→release.
  Capturas 1280×720, 1024×768 y 390×844 correctas (FIT con letterbox).
- [x] T5 — Deploy: `dist/` servido (200 en /, index, 5 PNGs; sin refs
  absolutas), boot en build de producción sin errores (captura del menú),
  bundle con strings de Etapa 7/8, README con itch.io + Pages + preview.
- [x] T6 — `docs/ARCHITECTURE.md` + `docs/ADDING_CONTENT.md` + README/ASSETS
  finales.
- [x] T7 — VERIFY final: 78/78 tests, tsc + build verdes (37 módulos),
  ROADMAP 8/8, informe de entrega.
- Nota T0 mazmorra: sigue sin evidencia del usuario → issue conocido
  documentado abajo, no reproducido con datos.
