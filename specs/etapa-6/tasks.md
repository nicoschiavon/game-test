# Etapa 6 — Personajes, meta-progresión y mapas · TASKS

> Implementación completada. Verificación parcial (ver T8).

- [x] T1 — Sprites `player-mage` (84)/`player-barbaro` (88) + `ASSETS.md`;
  mazmorra: suelo 40/57/58/59, decor 124/101/125/126/62, muro 28 (verificados
  en hoja de contacto).
- [x] T2 — `src/meta/` (characters, maps, shop, save) + `tests/meta.test.ts`
  (14). Verificación: CA-3, CA-4.
- [x] T3 — `src/ui.ts` + `MenuScene` + `main.ts` boot→menú. Captura headless
  del menú OK, 0 errores de consola.
- [x] T4 — `GameScene.init({characterId, mapId})`: sprite/stats/arma inicial
  por personaje; `buildGround(map)`; banner del mapa; mods por ctx en engines.
  Corrección en revisión: resets completos en `create()` (xpState, kills,
  pools de textos/cartas) para 2ª+ partidas vía menú.
- [x] T5 — Almas por partida (muerte y victoria) con `soulsGranted` único;
  overlays con total + botones Reintentar/Menú.
- [x] T6 — Tienda (compra, niveles, persistencia, shake sin saldo).
- [x] T7 — Stats = base×tienda×personaje y luego pasivos; arma inicial en
  loadout (mejorable/evolucionable, cuenta para el límite 3).
- [x] T8 — VERIFY PARCIAL: 62/62 tests, build, 11/11 assets 200 en el build de
  producción, menú headless sin errores. PENDIENTE (sin automatización de
  navegador este turno): clics en menú/tienda, persistencia tras recarga,
  partida con maga/barbaro y mazmorra → delegar checklist manual al usuario.
