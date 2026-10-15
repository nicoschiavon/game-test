# Etapa 1 — Fundamentos jugables · DESIGN

## 1. Decisión técnica principal
Stack tal cual pide el prompt, sin cambios: **Phaser 3.80 + Vite 6 + TypeScript
estricto + Vitest**. Sin dependencias de juego extra. Phaser solo en la capa de
presentación (escenas); toda regla jugable vive en módulos puros testeables.

## 2. Arquitectura
```
src/
  main.ts            # boot de Phaser, config de juego (resolución, escala, física arcade)
  config.ts          # tuning data-driven Etapa 1: player, weapon, enemy, spawner, world
  systems/
    movement.ts      # normalizeMoveVector, clampToWorld (puro, sin Phaser)
    combat.ts        # findNearestEnemy, applyDamage, shouldTakeDamage (i-frames) (puro)
    spawner.ts       # nextSpawnPoint en borde de cámara + clamp al mundo (puro)
  scenes/
    GameScene.ts     # Phaser: jugador, pools de enemigos/proyectiles, colisiones, HUD, Game Over
```

- Física: **Arcade Physics** (simple, suficiente para persecución + contacto).
- UI: HUD con `setScrollFactor(0)`; overlay de Game Over con DOM de Phaser o
  contenedor + botón; tecla R como atajo de reinicio.
- Estado de partida: máquina mínima en `GameScene`: `playing | gameover`.
  Reinicio = `scene.restart()` + reset de reloj interno (sin `location.reload`).

## 3. Estructuras de datos
```ts
// config.ts
PlayerConfig  { speed: 220, maxHp: 100, radius: 14, invulnSeconds: 0.6 }
WeaponConfig  { damage: 25, fireInterval: 0.9, projectileSpeed: 420, range: 420 }
EnemyConfig   { hp: 50, speed: 110, contactDamage: 10, radius: 12, xpUnused: 0 }
SpawnerConfig { spawnInterval: 1.2, maxEnemies: 80, margin: 40 }
WorldConfig   { width: 2000, height: 2000 }
```

- Enemigo runtime: `{ hp: number, lastHitAt?: number }` guardado en `GameObject.getData`.
- Proyectil runtime: `{ damage: number, vx, vy }`; pool con `physics.add.group({ maxSize })`.
- Tiempo de supervivencia: acumulado propio (`elapsed += delta/1000` en `update`),
  no atado al clock de Phaser para que el reinicio sea determinista.

## 4. Flujos clave
- **update(time, delta):** leer input → `normalizeMoveVector` → `setVelocity` →
  mover enemigos hacia jugador (`physics.moveToObject`) → arma: si
  `time - lastShot > fireInterval`, `findNearestEnemy` → disparar desde pool →
  actualizar HUD (barra HP, `MM:SS`).
- **Colisiones:** `overlap(bullets, enemies)` → `applyDamage` → si muere, destruir;
  `overlap(player, enemies)` → si `shouldTakeDamage(now, lastDamageAt)` aplica
  daño, tiñe jugador 120 ms, actualiza `lastDamageAt`; si HP ≤ 0 → gameOver().
- **Spawn:** acumulador con `spawnInterval`; `nextSpawnPoint(cameraBounds, world)`
  elige un borde aleatorio + offset `margin`; clamp al mundo.
- **Game Over:** `physics.pause()`, overlay visible, botón Reiniciar → reset total.

## 5. Render / placeholders
- Jugador: rectángulo/círculo verde generado por `Graphics.generateTexture`.
- Enemigo: círculo rojo. Proyectil: rectángulo amarillo pequeño.
- Fondo: tile de rejilla 64 px generado por código, `add.tileSprite` cubriendo el mundo.
- Bordes del mundo: rectángulo de línea + `setBoundsCollision`.

## 6. Tests (vitest, solo lógica pura)
- `movement.test.ts`: diagonal normalizada, vector nulo, clamp al mundo.
- `combat.test.ts`: nearest en/fuera de rango, daño letal/no letal, i-frames.
- `spawner.test.ts`: punto en borde pedido, clamp dentro del mundo.
- Rateo: sin tests de Phaser (escenas no se testean en Etapa 1).

## 7. Rendimiento
- Pools Arcade para balas y enemigos desde el día 1 (prepara el objetivo de 300+
  de la Etapa 3 aunque aquí el cap sea 80).
- Sin partículas físicas; colisiones solo vía overlap de grupos.

## 8. Justificación de dependencias
- Solo `devDependencies`: `vite`, `typescript`, `phaser` (runtime), `vitest`.
  Nada más. Cualquier añadido futuro se justificará aquí.

## 9. Alternativas consideradas
- Suelo infinito + chunks: descartado en Etapa 1 por complejidad; el mapa fijo
  da límites verificables (CA-7) y prepara los mapas cerrados de la Etapa 6.
- Matter physics: innecesaria; Arcade es más rápida y simple.
- `scene.restart` vs `location.reload`: elegida `restart` para reinicio limpio
  y rápido verificable en CA-6.

## 10. Hook de verificación (solo DEV)
`src/main.ts` expone la instancia en `window.__vs02` cuando
`import.meta.env.DEV` es true (eliminado en `npm run build`). Permite leer
`scene.player` / `scene.hp` / `scene.state` desde la consola del navegador
para verificar movimiento, daño y Game Over sin instrumentar la escena.
