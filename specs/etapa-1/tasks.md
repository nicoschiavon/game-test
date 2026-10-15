# Etapa 1 — Fundamentos jugables · TASKS

> Aprobada por el usuario el 2026-10-14. Implementación completada y verificada.

- [x] T1 — Scaffold: `package.json` (scripts `dev/build/test`), `vite.config.ts`,
  `tsconfig.json`, `index.html`, `src/main.ts`, `src/config.ts`. Verificación: `npm run dev` abre lienzo vacío 1280×720.
- [x] T2 — Sistemas puros: `src/systems/movement.ts`, `combat.ts`, `spawner.ts` según design §3.
- [x] T3 — Tests: `tests/movement.test.ts`, `tests/combat.test.ts`, `tests/spawner.test.ts`; `npm run test` en verde (13/13).
- [x] T4 — GameScene: mundo 2000×2000, rejilla, muros, jugador placeholder, cámara follow, input WASD+flechas.
- [x] T5 — Arma auto + pool de proyectiles + overlap bala-enemigo.
- [x] T6 — Spawner de enemigos + persecución + pool, cap `maxEnemies`.
- [x] T7 — Daño por contacto + i-frames + feedback de tinte + muerte de enemigos.
- [x] T8 — HUD (barra HP + `MM:SS`) + Game Over con tiempo + botón Reiniciar + tecla R.
- [x] T9 — README.md (instalar, comandos, controles) + `npm run build` limpio.
- [x] T10 — VERIFY: checklist CA-1…CA-8 (ver informe de parada). Desvíos menores
  documentados: círculo físico con offset de 2 px en bordes (CA-7, tolerable),
  épsilon 1e-9 en `shouldTakeDamage` por borde de punto flotante, hook
  `window.__vs02` solo en DEV (design §10), favicon inline para consola limpia.
