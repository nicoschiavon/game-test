# Añadir contenido — recetas paso a paso

## Nueva arma

1. Añade su tabla en `src/weapons/defs.ts` (`WEAPONS`): `id, name, desc, kind`
   (`bolt|orbital|nova|pierce|zone`), `maxLevel: 8` y `levels[8]` con
   `{ dmg, count, interval, ... }` (daño monótono; `count`/`range` en hitos).
2. Si usa textura nueva: dibújala en `BootScene` (procedural) o pon el PNG en
   `public/assets/` y documenta en `ASSETS.md`.
3. Si el `kind` es nuevo, implementa su updater en `src/weapons/engine.ts`
   (`update()`, pools con tope, `ctx.fx` para daño/números/muertes).
4. Aparece sola en ofertas (lee `baseWeapons()` + límites en
   `src/systems/loadout.ts`). Añade test en `tests/loadout.test.ts` si cambia
   la lógica de ofertas.
5. Verifica: `npm run test`, `npm run build`, partida con el arma (fuerza
   ofertas vía nivel o suerte), 0 errores en consola.

## Nuevo pasivo

1. Entrada en `PASSIVES` (`src/weapons/defs.ts`) + factor en `PASSIVE_FACTORS`.
2. Aplica el factor en `composeStats` (`GameScene.ts`).
3. Ofertas y límites ya lo incluyen. Test: `tests/loadout.test.ts`.

## Nueva evolución

1. `WeaponDef` con `maxLevel: 1` + entrada en `EVOLUTIONS`
   (`{ weaponId, passiveId, evoId }`).
2. `canEvolve` la prioriza sola; la base evolucionada no se re-oferta
   (test en `tests/loadout.test.ts`).

## Nuevo enemigo

1. Sprite 16×16 en `public/assets/e-<id>.png` (pack CC0 o procedural) +
   preload en `BootScene` + fila en `ASSETS.md`.
2. `EnemyDef` en `src/enemies/defs.ts` (`kind` existente o nuevo steering en
   `src/enemies/engine.ts`), XP y stats base.
3. Añádelo a `MIX` (`waves.ts`, con `from` de desbloqueo) y, si toca, a `WAVES`.
4. Ojo pools: `Group.get()` reutiliza sin cambiar textura → `setTexture`
   obligatoria en `spawn` (bug T9 Etapa 5).
5. Test: defs válidos + pesos en `tests/waves.test.ts`.

## Nueva oleada / jefe

1. Eventos en `WAVES` (`unlock|burst|elite|boss|banner`) ordenados por `t`.
2. El jefe es una especie con `boss: true` + timers en `steerBoss`.
3. Victoria: `handleDeath` → `fx.onBossDeath` → `enterVictory`.

## Nuevo mapa

1. `MapDef` en `src/meta/maps.ts`: variantes de suelo/decor del tileset
   (índices 0–131, verifica en la hoja de contacto), muro y `mods`.
2. `buildGround(map)` lo pinta solo; test de índices en `tests/meta.test.ts`.

## Nuevo personaje

1. PNG 16×16 + preload + `CharacterDef` (`tex, dmgMul, speedMul, maxHp,
   startWeapon` existente). Test en `tests/meta.test.ts`.

## Nueva vía de tienda

1. `ShopDef` en `src/meta/shop.ts` + efecto en `applyMeta` (`save.ts`).
2. Aparece sola en el menú. Migración: los saves viejos la inician a 0.
