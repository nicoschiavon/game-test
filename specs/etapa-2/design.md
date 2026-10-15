# Etapa 2 — Mejora gráfica · DESIGN

## 1. Assets (verificado 2026-10-14)
- Pack: **Kenney Tiny Dungeon** — https://kenney.nl/assets/tiny-dungeon
- Licencia: **CC0 1.0 Universal** (dominio público, sin atribución obligatoria;
  se atribuye igualmente en `ASSETS.md`).
- Descarga: zip oficial de kenney.nl (se descarga durante la implementación).
- Formato: PNG 16×16, estilo pixel-art coherente (héroes, monstruos, tiles, props).
- Solo se versionan en `public/assets/` los ficheros usados (jugador ×1,
  enemigo ×1, tileset completo para índices por tilemap). El zip original NO
  se versiona; servido vía `public/` (requisito de Vite, sin dependencias nuevas).
- Escalado: sprites ×3 con filtro `NEAREST` (pixel nítido). Hitboxes en
  `config.ts` (radios equivalentes a Etapa 1 para no alterar el balance).

## 2. Arquitectura (cambios sobre Etapa 1)
```
assets/
  player-0.png, player-1.png   # frames caminar (o 1 + bob procedural)
  enemy-0.png, enemy-1.png
  tiles.png                    # tileset suelo (por índices)
  decor-*.png  (o dentro del tileset)
src/
  config.ts        # + SPRITES (claves, escala, hitbox) y TILES (variantes, pesos decor)
  scenes/
    BootScene.ts   # NUEVA: preload de PNGs + texturas procedurales (chispa, sombra)
    GameScene.ts   # misma lógica; cambia render, anims, FX, HUD
  systems/
    tiles.ts       # NUEVO puro: pickGroundVariant / shouldPlaceDecor (RNG inyectable)
ASSETS.md          # NUEVO: inventario + licencia
```

- `main.ts`: `scene: [BootScene, GameScene]`; el hook `window.__vs02` se mantiene.
- Física y sistemas (`movement/combat/spawner`) **sin cambios** (RF-10).

## 3. Animaciones y FX
- **Caminar (decisión final):** el pack no trae ciclos de caminar, así que se
  usa 1 frame + **bob procedural por seno en `update`** (sin tweens, O(1) por
  entidad): jugador `scaleY/scaleX` ±5 % a 12 Hz + `flipX` según dirección;
  slime con squash & stretch desfasado por enemigo (`data 'phase'`). Idle:
  escala base. Verificado visualmente por captura.
- **Hitboxes invariantes (Etapa 1):** `setCircle` trabaja en píxeles fuente y
  multiplica por la escala (verificado en `node_modules/phaser/.../Body.js`,
  `setCircle`/`setSize`). Con sprite 16 px a ×3, `src/systems/hitbox.ts`
  (`scaledCircle`, testeado) calcula radio fuente = radioEtapa1 / 3 con offset
  de centrado: cuerpos de 28/24 px en pantalla, idénticos a la Etapa 1.
- **Hurt jugador:** `blink` por tween de `alpha` 1↔0.25 (3 ciclos, ~300 ms) +
  tint rojo existente + `cameras.main.shake(80, 0.004)`.
- **Muerte enemigo:** tween de `scale` → 0 + `alpha` → 0 (180 ms) y después
  `killAndHide` (no `destroy`, se conserva el pool); burst de partículas
  `particles.explode(10, x, y)` con textura `spark` procedural.
- **Muerte jugador:** `angle` 90° + fade 400 ms ⇒ luego `enterGameOver()`
  (retraso total ≤ 600 ms).
- **Números de daño:** pool propio de 24 `Text` (12 px, borde negro, `depth 50`);
  `spawnDamageNumber(x, y, dmg)`: setea texto/posición/alpha y tween
  `y -= 28, alpha → 0` (600 ms) con `onComplete` que lo oculta. Sin asignaciones
  en vuelo salvo el tween (reutilizable vía `tween.restart` no aplica; se crean
  tweens bajo demanda pero son ≤ 24 concurrentes y de vida corta — aceptado).

## 4. Suelo y decoración
- Tilemap estático: `this.make.tilemap({ tileWidth: 16, tileHeight: 16,
  width: 125, height: 125 })` + `addTilesetImage`; capa base con variantes por
  `pickGroundVariant(rand)` (p. ej. 80/12/8 %) y capa de decoración con
  `shouldPlaceDecor(rand)` (≤ 8 %).
- `src/systems/tiles.ts` puro y testeado con RNG inyectado; la escena solo itera
  una vez en `create` (15 k tiles, coste único ~ms).
- Muros: marco de tiles sólidos visuales + `world.setBoundsCollision` existente.

## 5. HUD
- Panel: rectángulo `0x000000 α0.45` + barra con borde (`strokeRoundedRect` vía
  Graphics fijo, redibujado solo al cambiar el % en >1 punto para no redibujar
  por frame).
- Colores: >50 % verde, 25–50 % ámbar, ≤25 % rojo + tween de pulso (alpha del
  borde) activado/desactivado por umbral.
- Cronómetro sobre panel a la derecha; FPS (DEV) pequeño abajo a la derecha.

## 6. Rendimiento
- Partículas: 1 emisor global con `spark` (sin textura por kill), `explode`
  reutiliza partículas del pool del emisor — coste O(1) amortizado.
- Damage numbers: pool fijo, sin `add.text` en runtime.
- Tilemap: 1 draw call por capa, culling por cámara.
- Sin cambios en pools de balas/enemigos (Etapa 1).

## 7. Tests
- `tests/tiles.test.ts`: pesos de variantes, decoración ≤ 8 % en muestra grande
  con RNG en secuencia, índices siempre válidos.
- Escenas/FX: verificación manual + capturas (como en Etapa 1).

## 8. Dependencias
- Ninguna nueva. Descarga del zip vía red solo en tiempo de desarrollo (no es
  dependencia de runtime ni de build).
