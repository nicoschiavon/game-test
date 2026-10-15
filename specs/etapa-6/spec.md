# Etapa 6 — Personajes, meta-progresión y mapas · SPEC

## 1. Objetivo
Dar motivo para rejugar: menú principal con selección de personaje y mapa,
3 personajes diferenciados, moneda por partida con tienda permanente y
progreso que persiste al recargar.

## 2. Alcance
1. `MenuScene`: título, selector de personaje (◀ ▶ con sprite + stats),
   selector de mapa (2 tarjetas), tienda (4 vías de mejora con coste),
   monedas disponibles y botón Jugar.
2. 3 personajes (sprites del pack, verificados en Etapa 5: 84/85/88):
   - **Caballero** (85): equilibrado, arma inicial Daga.
   - **Maga** (84): +20 % daño, −20 vida máx., arma inicial Orbes.
   - **Bárbaro** (88): +40 vida máx., +10 % daño, −8 % velocidad, Hoguera.
3. 2 mapas con ambientación y reglas (mismo tileset, índices por datos):
   - **Arena** (el actual: arena + restos): sin modificadores.
   - **Mazmorra** (ladrillo oscuro + huesos/antorchas): enemigos +15 % HP,
     +25 % XP, spawns +15 % rápidos.
4. Moneda "almas": al terminar una partida (muerte o victoria):
   `kills·1 + nivel·5 + minutos·10 (+100 victoria)`. Visible en fin de partida.
5. Tienda permanente (4 vías, 5 niveles cada una, coste creciente):
   Filo +4 % daño/nv, Botas +3 % velocidad/nv, Corazón +10 vida máx./nv,
   Avaricia +5 % almas/nv. Se aplican siempre (base de stats).
6. Guardado `localStorage` clave `vs02-save-v1`: `{ version, almas,
   shop: {...}, runs, victories, bestTimeSec }` con migración versionada
   (versiones futuras conservan almas como mínimo).

## 3. Fuera de alcance (explícito)
- Más personajes/mapas, skins, logros, rankings (futuro).
- Respec/devoluciones en tienda (compra final).
- Sonido del menú (Etapa 7). Guardado en la nube.

## 4. Requisitos funcionales
- **RF-1 Flujo:** Boot → Menú → (Jugar) → partida con `{ characterId, mapId }`;
  Game Over/Victoria muestran almas ganadas + botones Reintentar y Menú.
- **RF-2 Personajes:** stats y arma inicial por datos; el arma inicial ocupa
  hueco y no se puede quitar (sí mejorar/evolucionar).
- **RF-3 Mapas:** suelo/decor/muros por índices del mapa + modificadores
  (spawn, HP enemiga, XP); el banner muestra el nombre al empezar.
- **RF-4 Almas:** cálculo puro `soulsForRun`; se acreditan una sola vez por
  partida (ni en pausa de nivel ni en reinicios intermedios).
- **RF-5 Tienda:** compra solo con saldo; niveles y costes por datos;
  Insuficiente ⇒ feedback (botón deshabilitado + shake del texto de almas).
- **RF-6 Persistencia:** carga al arrancar el menú (si corrupto ⇒ valores por
  defecto + aviso en consola, sin crash); guarda en cada compra y fin de partida.
- **RF-7 Sin regresiones:** CA de Etapas 1–5 (incluidos T9 de clic y orden de
  overlaps). El flujo rápido (Jugar con defaults) no añade más de 2 clics.

## 5. Criterios de aceptación verificables
- **CA-1:** manual: cambiar personaje/mapa se refleja en partida (sprite,
  stats, arma inicial, suelo y banner del mapa).
- **CA-2:** manual: terminar partida ⇒ almas acreditadas; recargar página ⇒
  almas y tienda intactas.
- **CA-3:** unit: `soulsForRun` con valores borde (0 kills, victoria sí/no);
  `shopCost` creciente; `migrate` v0→v1 conserva almas; `applyMeta` compone
  base×tienda×personaje.
- **CA-4:** unit: defs de personajes/mapas válidos (sprites existen, arma
  inicial válida, modificadores > 0).
- **CA-5:** manual: comprar sin saldo no descuenta; comprar con saldo sube
  nivel y persiste tras recargar.
- **CA-6:** tests + build verdes; consola limpia en menú→tienda→partida→fin→menú.

## 6. Preguntas abiertas
1. ¿Fórmula de almas y costes propuestos bien?
2. ¿Mazmorra con +HP/+XP/+spawn como twist (u otro: p. ej. mapa pequeño)?

## 7. Riesgos
- `MenuScene` duplica UI de cartas ⇒ mitigación: helper `ui.ts` (botón,
  tarjeta) reutilizado por menú y tienda.
- Cambiar de personaje/mapa a mitad de refactors de escena ⇒ mitigación:
  `GameScene.init(data)` recibe `{ characterId, mapId }`; restart conserva.
