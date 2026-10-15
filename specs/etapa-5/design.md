# Etapa 5 — Enemigos, oleadas y jefes · DESIGN

## 1. Datos (`src/enemies/defs.ts` + `waves.ts`, todo configurable)
```ts
EnemyKind = 'chaser'|'runner'|'dasher'|'splitter'|'ranged'|'tank'|'mini'|'elite'|'boss';
EnemyDef { id, name, tile: number, scale, kind, hp, speed, dmg, radius(display),
  xp, behavior?: { orbitR?, dashPeriod?, dashSpeed?, keepRange?, firePeriod?, shotSpeed?, shotDmg? } }
ENEMIES: slime(108) chaser 50/110/10/xp10 · bat(123) runner 25/175/6/xp6 ·
  spider(122) dasher 40/140/12/xp12 {orbitR 200, dashPeriod 2.6, dashSpeed 360} ·
  ghost(121) splitter 60/95/10/xp15 · skeleton(111) ranged 35/90/8/xp15
  {keepRange 280, firePeriod 2.4, shotSpeed 210, shotDmg 8} ·
  brute(109) tank 160/70/20/xp25 · mini-ghost splitter-child 15/130/5/xp5 ·
  elite brute×1.8 550/80/25/xp60 · demon(110) boss 2500/65/30/xp300
```
- Sprites: PNGs individuales `tile_XXXX.png` → `public/assets/e-<id>.png`
  (slime existente se renombra a `e-slime.png` o se mantiene `enemy.png`;
  DECISIÓN: mantener `enemy.png` = slime para no tocar BootScene de más…
  mejor renombrar coherente `e-*.png` y actualizar BootScene; documentar).
- `scaleAt(elapsed) = { hp: 1 + 0.25·min, dmg: 1 + 0.08·min }` con `min = elapsed/60`.
- `WAVES`: `{ t, op: 'unlock'|'burst'|'elite'|'boss'|'banner', enemy?, count?, text? }`
  ordenado por `t` (validado en test): 0 slime · 45 bat (+burst 8) · 90 spider ·
  150 ghost · 180 elite+brute · 240 skeleton (+burst 6) · 300 burst mixto ·
  360 elite · 480 boss+jefe.
- `mixAt(t)`: pesos entre desbloqueados (slime decae, resto crece; suma 1).

## 2. Arquitectura
```
src/
  enemies/
    defs.ts    # NUEVO: EnemyDef[] + scaleAt + splitMinis (puro)
    waves.ts   # NUEVO puro: WAVES, mixAt, pickEnemyType(mix, rand), nextEvents
    engine.ts  # NUEVO: EnemyEngine (spawn por especie, steering por kind,
               #   proyectiles enemigos, ticks de boss, banners)
  scenes/GameScene.ts  # delega; conserva armas/XP/HUD + estados +victory
```
- `EnemyEngine(scene, group, fx { dropGem, damageNumber, burst, killEnemy? })`:
  la muerte sigue en la escena (`killEnemy` existente + gancho `onDeath(species)`
  para splitter→minis y boss→victory y recompensas extra).
- Instancia enemiga: `data { species, hp, maxHp, dying, phase, fireAt, dashAt,
  dashVx, dashVy, telegraphUntil }`; hitbox vía `scaledCircle(radius, scale, 16)`.
- Steering por frame (O(n), sin asignaciones): chaser/runner/tank/mini →
  `moveTo(player, speed)`; dasher → órbita (pos angular por `phase`) salvo
  ventana de embestida (velocidad fija `dashV` 0.5 s, telegrafiado 0.3 s con
  tinte); ranged → acercar/alejar hasta `keepRange` + disparo con cooldown
  (`fireAt`); splitter → como chaser.
- Proyectiles enemigos: grupo `epool` (64, textura `eshot` procedural roja),
  overlap único vs jugador ⇒ `hurtPlayer(dmg)` en la escena (reutiliza
  i-frames/tinte/shake). TTL + bounds como las del jugador.
- Boss: especie con `boss: true`; timers `radialAt/summonAt/chargeAt` en data;
  radial = 12 eshots en círculo; summon = 4 slimes alrededor (vía engine.spawn);
  charge = telegrafiado + velocidad 380 hacia el jugador 0.9 s. Barra HP global
  (HUD) + `victory` al morir.

## 3. Spawner
- El tick de spawn existente usa `spawnParams(elapsed)` (intervalo/tope) +
  `pickEnemyType(mixAt(elapsed), rand)`; `nextEvents(elapsed, firedSet)` consume
  `WAVES` (bursts y jefes spawnean en borde como el trickle; el jefe con aviso
  previo: banner 3 s antes vía evento `banner` separado en t-3).
- `restartRun` resetea `firedSet`, kills, boss/barra y proyectiles enemigos.

## 4. HUD/overlays
- Banner central reutilizable (1 texto, tween fade) para oleadas/avisos.
- Barra de HP del jefe (arriba-centro, solo con boss vivo).
- Overlay ¡VICTORIA! (contenedor propio, depth 120): tiempo, nivel, kills +
  Reiniciar (misma lección T9: `scrollFactor(0)` en el botón).
- Estado `victory` como `gameover` (física en pausa, R reinicia).

## 5. Rendimiento
- 1 overlap balas×enemigos (existente) + 1 orbes×enemigos + 1 jugador×enemigos +
  1 eshots×jugador: 4 overlaps totales, sin N×M por arma/tipo.
- Proyectiles con TTL; minis comparten pool de enemigos (tope +20 → 340).

## 6. Tests
- `tests/waves.test.ts`: schedule ordenado y único, `mixAt` suma 1 y respeta
  desbloqueos, `scaleAt` monótona con valores (min1: 1.25/1.08).
- `tests/enemies.test.ts`: `splitMinis` (2 minis con stats), `pickEnemyType`
  determinista con RNG, `scaledCircle` reutilizado para hitboxes de élite.
- Escenas: capturas + consola.

## 7. Dependencias
- Ninguna nueva. PNGs `e-*.png` del pack + `eshot` procedural en `BootScene`.

## 8. Lección aprendida (bug T9): orden de args en overlaps
`overlap(A, B, cb)`: si A es grupo y B sprite, el callback recibe
**(B-sprite, hijo-de-A)** (`World.collideSpriteVsGroup`, líneas 1971/2115),
NO (hijo, sprite). Registrar siempre en orden (sprite, grupo) y nombrar los
params (`playerObj, shotObj`) para que el orden sea explícito. Un handler
con el orden invertido puede deshabilitar al jugador en vez del proyectil.
