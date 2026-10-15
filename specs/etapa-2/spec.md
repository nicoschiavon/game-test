# Etapa 2 — Mejora gráfica · SPEC

## 1. Objetivo
Reemplazar todos los placeholders geométricos por sprites pixel-art con
animaciones y vestir el juego con efectos (partículas, números de daño,
screen shake) y un HUD coherente, sin perder rendimiento ni legibilidad.

## 2. Alcance
1. Sprites CC0 de **Kenney Tiny Dungeon** (verificado: 16×16, 130 ficheros,
   licencia CC0, https://kenney.nl/assets/tiny-dungeon) para jugador, enemigo,
   balas (o FX procedural si el pack no trae proyectil adecuado) y tiles de suelo.
   Ficheros necesarios copiados a `assets/` del repo; fuente y licencia en `ASSETS.md`.
2. Animaciones: caminar del jugador (2 frames o bob procedural si el pack no
   trae frames), parpadeo/tinte al recibir daño, muerte del enemigo
   (escala + fade + partículas) y del jugador.
3. Fondo: tilemap 16×16 con 2–3 variantes de suelo + capa de decoración
   dispersa (pesos configurables); bordes del mundo visibles y temáticos.
4. Efectos: burst de partículas al matar, parpadeo al recibir daño, números de
   daño flotantes (pool), screen shake leve **solo** al dañar al jugador.
5. HUD pulido: panel oscuro semitransparente, barra de HP con borde y cambio de
   color, cronómetro con formato MM:SS, pulso visual con HP bajo.
6. Contador de FPS visible **solo en DEV** (`import.meta.env.DEV`) como
   herramienta de verificación de rendimiento.

## 3. Fuera de alcance (explícito)
- XP, gemas, niveles, mejoras (Etapa 3).
- Nuevas armas / enemigos / personajes (Etapas 4–6). El enemigo y el arma son
  los mismos en comportamiento; solo cambian de aspecto.
- Sonido y música (Etapa 7).
- Cambio de balance (velocidades, daños, cadencias idénticos a Etapa 1 salvo
  ajustes mínimos de legibilidad justificados en design.md).
- Menús nuevos (Etapa 6). Game Over se reestiliza pero no cambia de flujo.

## 4. Requisitos funcionales
- **RF-1 Assets:** el juego carga sprites desde `public/assets/` (no placeholders
  generados para jugador/enemigo/suelo). `ASSETS.md` documenta cada fichero:
  origen, URL, licencia CC0 y autor (Kenney).
- **RF-2 Walk:** el jugador muestra animación de caminar mientras se mueve y
  frame idle al estar quieto. El enemigo muestra animación/bob de persecución.
- **RF-3 Hurt:** al recibir daño el jugador parpadea (visible ≥ 200 ms) además
  del tinte actual; al morir hay animación de muerte antes del overlay
  (retraso ≤ 600 ms, sin bloquear el flujo de Game Over).
- **RF-4 Kill FX:** cada muerte de enemigo emite un burst de partículas del
  color del enemigo + número de daño flotante en el punto del último impacto.
- **RF-5 Daño flotante:** cada impacto de proyectil muestra el daño infligido
  como texto que sube y se desvanece (~600 ms); pool máximo 24, reutilizado.
- **RF-6 Shake:** daño al jugador ⇒ `shake` leve (≤ 100 ms, intensidad ≤ 0.005);
  las muertes de enemigos NO provocan shake.
- **RF-7 Suelo:** tilemap con ≥ 2 variantes de suelo + decoración dispersa
  (≤ 8 % de tiles) elegida con RNG con pesos configurables en `config.ts`.
- **RF-8 HUD:** barra de HP con borde y 3 estados de color, panel de fondo,
  cronómetro legible; con HP ≤ 25 % la barra pulsa.
- **RF-9 Rendimiento:** sin asignaciones en el hot-loop por encima de lo
  existente en Etapa 1 (emisores y pools reutilizados); FPS DEV visible.
- **RF-10 Sin regresiones:** todo CA-1…CA-8 de la Etapa 1 sigue cumpliéndose
  (movimiento, arma auto, spawner, i-frames, Game Over, bordes).

## 5. Criterios de aceptación verificables
- **CA-1:** `ASSETS.md` existe con URL, licencia CC0 y lista de ficheros; los
  ficheros están en `public/assets/` y el juego los carga (pestaña Network, 0 404).
- **CA-2:** inspección: `GameScene.makeTextures` ya no genera `player/enemy/grid`;
  solo texturas procedurales menores (chispa de partícula, sombra) si acaso.
- **CA-3:** manual: moverse ⇒ se aprecia animación; quedarse quieto ⇒ idle.
- **CA-4:** manual: matar un enemigo ⇒ burst + número de daño; ser golpeado ⇒
  parpadeo + shake leve.
- **CA-5:** test unitario de `pickGroundVariant`/`pickDecorTile`: distribución
  respeta pesos con RNG inyectado y nunca devuelve tiles fuera de rango.
- **CA-6:** `npm run test` y `npm run build` en verde; 0 errores en consola.
- **CA-7:** manual con 80 enemigos: el juego se ve fluido (FPS DEV ≥ 50 en
  máquina de desarrollo) y cada tipo de entidad se distingue a simple vista
  (jugador / enemigo / bala / decoración).

## 6. Preguntas abiertas
1. ¿Kenney Tiny Dungeon como pack único (propuesto) o prefieres otro estilo?
2. ¿Shake también al matar enemigos (más juice) o solo al recibir daño (propuesto)?

## 7. Riesgos
- El pack puede no traer frames de caminar ni proyectil ⇒ mitigación: bob
  procedural (tween de escala/rotación) y bala como chispa procedural con estilo
  coherente; documentado en design.md.
- Sprites 16×16 demasiado pequeños a 1280×720 ⇒ mitigación: escalado ×2–×3 con
  `NEAREST`, hitboxes ajustadas a `config.ts`.
- Tilemap 125×125 estático ⇒ sin coste por frame; culling automático de Phaser.
