# Etapa 4 — Armas y pasivos · DESIGN

## 1. Datos (`config.ts` + `src/weapons/defs.ts` si crece)
```ts
WeaponDef { id, name, desc, maxLevel: 8, kind: 'bolt'|'orbital'|'nova'|'pierce'|'zone',
  levels: WeaponLevel[] }  // [lvl1..8]: { dmg, count, interval, radius?, speed?, duration? }
PassiveDef { id, name, desc, maxLevel: 5, levels: { stat, factor|add }[] }
EvolutionDef { weaponId, passiveId, evoId, evoName }
```
- Tablas crecientes en daño; `count`/`radius` suben en hitos (nv 2/4/6/8).
- EVO: `daga8 + fuerza` → `megadaga`; `orbes8 + reloj` → `granorbe`
  (stats ≈ ×1.6 del nv8 + FX propio: proyectil triple / orbes ×2 con estela).

## 2. Arquitectura
```
src/
  systems/
    loadout.ts   # NUEVO puro: Loadout, buildOffers(loadout, rand), canEvolve(loadout)
    tick.ts      # NUEVO puro: canTick(lastAt, now, window) para orbes/zona
  weapons/
    defs.ts      # NUEVO: tablas WeaponDef×5 (+2 evo), PassiveDef×4, EvolutionDef×2
    engine.ts    # NUEVO: pools + updaters por kind (bolt/orbital/nova/pierce/zone)
  scenes/GameScene.ts  # delega armas al engine; conserva movimiento/XP/HUD
```
- `WeaponCtx { scene, enemies, groups, stats, elapsed, fx: { damageNumber, burst } }`.
- Daño efectivo = `tabla × stats.dmgMul`; intervalo = `tabla / stats.rateMul`.
- Orbes: N imágenes en pool por arma, ángulo global por arma en `data`;
  daño con `canTick(data 'orbLast', now, 0.4 s)` por enemigo.
- Nova: imagen-círculo procedural que escala 0→radio con alpha→0 (tween en pool)
  + daño único a enemigos en radio al activarse.
- Lanza: como Daga pero `pierce`: `data 'hitIds'` (Set por proyectil; pool
  limitado ⇒ memoria acotada) y no se destruye al impactar (muere por rango/tiempo).
- Hoguera: zona en la posición del enemigo más cercano al lanzarla (fallback:
  sobre el jugador); ticks cada 0.5 s durante `duration`; radio visible
  (círculo naranja α 0.35).
- Ofertas: `buildOffers` devuelve 3 de `{ type: 'weapon-new'|'weapon-up'|
  'passive-new'|'passive-up'|'evolve'|'heal' }`; la escena mapea a
  cartas (mismo overlay, re-etiquetado; iconos texto por ahora).
- Fallback con todo al máximo: `heal` (cura 30 HP, sin XP para evitar bucles).

## 3. Pasivos (sustituyen boosts de Etapa 3 si se aprueba RF-6)
| id | efecto por nivel |
|----|------------------|
| fuerza | daño +8 % (×1.08ⁿ) |
| reloj | cadencia +6 % (rate ×1.06ⁿ) |
| botas | velocidad +5 % |
| imán | radio +20 % |
| (corazón) | solo fallback: cura 30 |
- `RunStats` se calcula como `base × pasivos × boosts`… si se retiran boosts:
  `stats = compose(base, passives)`. `upgrades.ts` de Etapa 3 se conserva para
  compatibilidad de tests pero deja de ofertarse (o se elimina; decidir en
  implementación y documentar).

## 4. Rendimiento
- Nova/zona: 1 check de distancia por enemigo por tick (O(n) esporádico, no
  por frame). Orbes: overlap Arcade contra grupo pequeño (≤ 8 orbes).
- Topes: balas 128, orbes 8, zonas 4, gemas 400, enemigos 320.

## 5. Tests
- `tests/loadout.test.ts`: límites (no arma nueva con 3), evolución prioritaria
  y requisitos, fallback con todo max, 3 distintas con semillas.
- `tests/weapons.test.ts`: tablas monótonas, `canTick` ventana.
- Escenas: capturas + consola limpia.

## 6. Dependencias
- Ninguna nueva. Texturas `orb/spear/flame/ring` procedurales en `BootScene`.
