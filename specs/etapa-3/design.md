# Etapa 3 — Experiencia y niveles · DESIGN

## 1. Datos (`config.ts`, todo configurable)
```ts
XP_GEM  { value: 10, collectRadius: 20, magnetMinSpeed: 140, magnetAccel: 900 }
XP_CURVE { base: 30, growth: 1.35 }   // xpForLevel(n) = floor(base * growth^(n-1))
UPGRADES: UpgradeDef[]  // 5 entradas (ver §3)
SPAWNER += { minInterval: 0.35, rampSeconds: 300, startMax: 80, endMax: 300 }
GEMS { maxActive: 400 }
```
- `xpForLevel(1) = 30` (3 gemas), L2→3 ≈ 40, L5→6 ≈ 67: ritmo rápido al inicio,
  exigente después. Gema única de 10 XP (sin tiers hasta futuro).

## 2. Arquitectura
```
src/
  config.ts        # + XP_GEM, XP_CURVE, UPGRADES, GEMS, rampa en SPAWNER
  systems/
    xp.ts          # NUEVO puro: xpForLevel, grantXp(state, amount) -> { levels }
    upgrades.ts    # NUEVO puro: UPGRADE_IDS, applyUpgrade(stats, id), rollUpgrades(n, rand)
    spawner.ts     # + spawnParams(elapsed) puro: { interval, max } con rampa lineal
  scenes/
    GameScene.ts   # grupo de gemas + RunStats + overlay de nivel + estados
```
- `RunStats { dmgMul, rateMul, speedMul, maxHp, pickupRadius }` inicial desde
  `PLAYER`/`WEAPON`; la escena lo lee cada frame (velocidad) / disparo (daño,
  intervalo) y el HUD (vida máx.).
- Estados: `playing | dying | gameover | levelup`. `levelup` ⇒ `physics.pause()`,
  overlay visible; al elegir ⇒ `physics.resume()` o siguiente oferta si
  `pendingLevels > 0`. El timer (`elapsed`) no avanza en `levelup` (está en
  `update`, que retorna antes).
- Teclas 1/2/3 registradas en `create` (`addKey`), evaluadas en `update` solo
  en estado `levelup`.

## 3. Mejoras (defs de datos, efectos puros)
| id | nombre | efecto (`applyUpgrade`) |
|----|--------|--------------------------|
| `dmg` | Filo | `dmgMul ×= 1.15` |
| `rate` | Cadencia | `rateMul ×= 1.12` (intervalo efectivo = `fireInterval / rateMul`) |
| `speed` | Botas | `speedMul ×= 1.08` |
| `hp` | Corazón | `maxHp += 20` y la escena cura +20 |
| `magnet` | Imán | `pickupRadius ×= 1.30` |
- `rollUpgrades(rand)`: baraja los 5 ids (Fisher-Yates con RNG inyectado) y
  toma 3 ⇒ siempre distintos. Sin vetos en Etapa 3 (los límites de Etapa 4
  añadirán filtrado aquí).
- La cura de `hp` vive en la escena (efecto colateral), el resto es puro.

## 4. Gemas (rendimiento)
- Grupo Arcade `gems` (`maxSize: GEMS.maxActive`), textura `gem` procedural
  (diamante 10×12 verde, documentada en `ASSETS.md`). Sin gravedad,
  `immovable`, sin colisión entre ellas.
- Drop: en `killEnemy`, `gems.get(x, y)`; si pool lleno (`null`) se ignora el
  drop (nunca excepción). `setData('vx'...)` no necesario: se usa velocidad
  física directa.
- Imán por gema activa (bucle en `update`, O(n), sin asignaciones):
  `d ≤ pickupRadius` ⇒ `physics.moveToObject(gema, player, max(minSpeed, k·(1/d)))`;
  `d ≤ collectRadius` ⇒ recoger: `killAndHide` + `grantXp`.
- Overlap jugador-gemas innecesario (chequeo por distancia en el mismo bucle).

## 5. Overlay de nivel
- Contenedor `depth 110`: dim + título `¡NIVEL X!` + 3 cartas (290×210,
  fondo `#1f2937`, borde `#4ade80`, nombre + efecto + `1/2/3`) con hover y
  `pointerdown`. Las cartas se redibujan por oferta (textos reutilizados, sin
  crear objetos por oferta salvo que sea más simple: 3 cartas fijas
  re-etiquetadas — elegido).
- Al elegir: `applyUpgrade` + (si `hp`: `maxHp` y cura) ⇒ `pendingLevels--` ⇒
  reanudar o re-ofertar.

## 6. HUD XP
- Barra fina superior (8, 76, 300, 10) + texto `Nv X` a su derecha; se redibuja
  solo al cambiar el XP visible (mismo patrón throttle que HP).

## 7. Tests (vitest, puros)
- `tests/xp.test.ts`: curva creciente y valores (`30, 40, 54…`), `grantXp`
  conserva exceso y cuenta N subidas, tope sensato (nivel 99 computable).
- `tests/upgrades.test.ts`: cada id modifica solo su stat en el % exacto;
  `rollUpgrades` siempre 3 distintos (100 semillas); inmutabilidad del input.
- `tests/spawner.test.ts` (+): `spawnParams` interpola 1.2 s/80 ⇒ 0.35 s/300
  en 300 s y se mantiene constante después.

## 8. Dependencias
- Ninguna nueva. Textura `gem` procedural en `BootScene`.
