# Etapa 6 — Personajes, meta-progresión y mapas · DESIGN

## 1. Datos
```ts
// src/meta/characters.ts
CharacterDef { id, name, title, tex, dmgMul, speedMul, maxHp, startWeapon }
CHARACTERS: caballero {85, 1, 1, 100, daga} · maga {84, 1.2, 1, 80, orbes} ·
  barbaro {88, 1.1, 0.92, 140, hoguera}
// src/meta/maps.ts
MapDef { id, name, desc, ground: WeightedTile[], decorChance, decor: WeightedTile[],
  wall: number, mods: { spawnIntervalMul, enemyHpMul, xpMul } }
MAPS: arena (TILES actuales, mods 1/1/1) · mazmorra (ladrillo oscuro,
  mods 0.87/1.15/1.25)
// src/meta/shop.ts
ShopDef { id, name, desc, maxLevel: 5, baseCost, costGrowth, effect }
SHOP: filo(+4 % dmg) · botas(+3 % vel) · corazon(+10 maxHp) · avaricia(+5 % almas)
shopCost(def, level) = floor(baseCost * growth^level)
// src/meta/save.ts
SaveV1 { version: 1, souls, shop: Record<id, level>, runs, victories, bestTimeSec }
migrate(raw): SaveV1  // v0/desconocido → default conservando souls si es número
soulsForRun({ kills, level, seconds, victory, greedMul }): number
applyMeta(base: RunStats, save, char): RunStats
```

## 2. Arquitectura
```
src/
  meta/            # NUEVO: characters.ts, maps.ts, shop.ts, save.ts (puros salvo IO)
  ui.ts            # NUEVO: makeButton(scene, x, y, w, h, label, cb), panel()
  scenes/
    MenuScene.ts   # NUEVO: título, selectores, tienda, almas, Jugar
    GameScene.ts   # init(data) { characterId, mapId }; overlay fin += almas + Menú
```
- `main.ts`: `scene: [BootScene, MenuScene, GameScene]` (boot → menú).
- Stats: `base = applyMeta(baseRunStats(), save, char)` → luego `composeStats`
  con pasivos de la run. Velocidad/daño/vida del personaje fluyen sin tocar
  engines (leen `stats`).
- Mapa: `buildGround(mapDef)` generalizado (firma actual con `TILES` pasa a
  aceptar el def); mods: `spawnParams(elapsed).interval × mods.spawnIntervalMul`
  (en `EnemyEngine.handleTrickle` vía ctx), `scaleAt` HP × `mods.enemyHpMul`
  (vía ctx), `collectXp(amount × mods.xpMul)`.
- `EnemyCtx/WeaponCtx += mods: MapMods`. Sin cambios en `WeaponEngine`.
- Monedas: `GameScene` calcula al terminar (`beginPlayerDeath→enterGameOver`,
  `enterVictory`), acredita vía `save.souls += n` + `persist()`, muestra en
  overlay. Bandera `soulsGranted` para acreditar una sola vez (reintentar no
  duplica: el flag vive por run y se resetea en `restartRun`… reintentar desde
  fin SÍ es run nueva y otorga de nuevo: correcto y simple).
- `localStorage` solo en `save.ts` (`load()`/`persist()` con try/catch).

## 3. Menú (una escena, 3 bloques)
- Cabecera: título + almas (icono texto "◈").
- Personaje: sprite ×4 + nombre + líneas de stats + ◀ ▶ (cíclico).
- Mapa: 2 tarjetas lado a lado (nombre + desc + mods en texto).
- Tienda: 4 filas (nombre, nivel ●●○○○, efecto, botón coste o MAX).
- Jugar: botón grande → `scene.start('game', { characterId, mapId })`.
- Todo con `ui.ts`; botones con `scrollFactor` n/a (escena propia sin scroll…
  la cámara no se desplaza: los botones funcionan sin el apaño T9, pero se
  pone `scrollFactor(0)` igualmente por coherencia).

## 4. Sprites nuevos
- `player-mage.png` (tile_0084), `player-barbaro.png` (tile_0088) en
  `BootScene` + `ASSETS.md`. `player.png` (85) = caballero.
- Mazmorra: reutiliza `tileset.png` con otros índices (a verificar en
  implementación: suelo ladrillo oscuro + decor huesos/antorchas + muro).

## 5. Tests
- `tests/meta.test.ts`: `soulsForRun` (0 kills, victoria), `shopCost`
  creciente, `migrate` (null/corrupto/v0), `applyMeta` (base×tienda×pj),
  defs válidos (arma inicial existe, mods > 0, sprites en lista de BootScene).
- Menú: manual + consola.

## 6. Dependencias
- Ninguna nueva.
