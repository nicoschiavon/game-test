# Etapa 1 — Fundamentos jugables · SPEC

## 1. Objetivo
Dejar un ciclo de juego mínimo y jugable: moverse por un mapa cerrado,
sobrevivir a enemigos que persiguen, atacar de forma automática,
morir y reiniciar sin errores ni consola con excepciones.

## 2. Alcance
1. Proyecto base: Vite + Phaser 3 + TypeScript estricto, scripts `dev`, `build`, `test`.
2. Mapa de tamaño fijo con límites visibles y colisión contra bordes; cámara que sigue al jugador.
3. Jugador: cuadrado/círculo placeholder, movimiento con WASD + flechas,
   velocidad constante, diagonal normalizada, sin aceleración compleja.
4. Arma básica: dispara automáticamente un proyectil hacia el enemigo más
   cercano dentro de rango, con cadencia fija. Sin apuntado manual.
5. Un tipo de enemigo: aparece en los bordes visibles de la cámara a intervalos
   regulares, persigue al jugador con steering directo, muere con N impactos.
6. Combate: proyectiles dañan enemigos; contacto enemigo-jugador daña al jugador
   con invulnerabilidad breve (i-frames). Muerte del enemigo = desaparece.
7. Game Over: al llegar a 0 HP se muestra pantalla de fin con tiempo
   sobrevivido y botón de reinicio que vuelve a partida limpia.
8. HUD mínimo: barra de vida del jugador y cronómetro de supervivencia.
9. Placeholders geométricos generados por código (sin assets externos).
10. `README.md` con instalación, comandos y controles.

## 3. Fuera de alcance (explícito)
- XP, gemas, niveles, mejoras (Etapa 3).
- Más de 1 arma / 1 enemigo / mapas / personajes (Etapas 4–6).
- Sonido, música (Etapa 7).
- Sprites finales, animaciones, partículas (Etapa 2; solo placeholders aquí).
- Backend, multijugador, guardado persistente (no hay; Etapa 6).
- Soporte táctil / gamepad (Etapas 7–8).
- Despliegue público (Etapa 8).

## 4. Requisitos funcionales
- **RF-1 Proyecto:** `npm install && npm run dev` levanta la demo; `npm run build`
  genera `dist/`; `npm run test` ejecuta tests unitarios (vitest) en verde.
- **RF-2 Movimiento:** WASD y flechas mueven al jugador en 8 direcciones;
  la velocidad diagonal es igual a la ortogonal (±5 % tolerancia);
  el jugador no sale de los límites del mundo.
- **RF-3 Cámara:** la cámara sigue al jugador con lerp suave; el fondo muestra
  una rejilla para percibir el movimiento.
- **RF-4 Arma auto:** cada `fireInterval` segundos, si hay enemigo en `range`,
  se dispara 1 proyectil hacia el enemigo más cercano; el proyectil viaja en
  línea recta, daña al primer enemigo que toca y desaparece.
- **RF-5 Spawner:** cada `spawnInterval` segundos aparece 1 enemigo en un punto
  aleatorio del borde de la vista de la cámara (dentro de los límites del mundo),
  hasta un `maxEnemies` configurable.
- **RF-6 Persecución:** cada enemigo se mueve hacia la posición actual del
  jugador cada frame; si lo alcanza (contacto), inflige `contactDamage`.
- **RF-7 Daño al jugador:** al recibir daño se restan HP y se activan i-frames
  de `invulnSeconds` (ignora daño durante ese tiempo) + feedback visual mínimo
  (tinte/parpadeo del placeholder).
- **RF-8 Muerte:** enemigo con HP ≤ 0 se destruye; jugador con HP ≤ 0 entra en
  estado Game Over: se detienen spawns/ataques, se muestra overlay con
  "GAME OVER", tiempo sobrevivido y botón "Reiniciar".
- **RF-9 Reinicio:** pulsar "Reiniciar" (o tecla R) restablece HP, posición,
  tiempo, enemigos y proyectiles a estado inicial sin recargar la página.
- **RF-10 HUD:** barra de vida proporcional a HP actual y texto de tiempo `MM:SS`
  siempre visibles durante la partida.
- **RF-11 Limpieza:** sin errores ni warnings fatales en consola durante
  jugar → morir → reiniciar; el juego mantiene ≥ 50 FPS con ≤ 100 enemigos
  (objetivo laxo de Etapa 1; el objetivo de 300+ es de Etapa 3).

## 5. Criterios de aceptación verificables
- **CA-1:** `npm run build` y `npm run test` pasan en una máquina limpia tras `npm install`.
- **CA-2:** Con el juego abierto, el jugador se mueve con WASD y con flechas;
  medir con test unitario de `normalizeMoveVector` que la magnitud diagonal = 1 (±0.05).
- **CA-3:** Test unitario de `findNearestEnemy` devuelve el enemigo más cercano en
  rango y `null` si no hay ninguno en rango.
- **CA-4:** Test unitario de `applyDamage` + i-frames: el segundo golpe dentro de
  la ventana de invulnerabilidad no reduce HP; fuera de la ventana sí.
- **CA-5:** Manual: dejar al jugador quieto 60 s → aparecen enemigos, el arma
  dispara sola, algún enemigo muere, el HUD de tiempo avanza.
- **CA-6:** Manual: dejarse matar → aparece Game Over con tiempo y botón;
  pulsar Reiniciar → partida nueva funcional sin recargar ni errores en consola.
- **CA-7:** Manual: intentar salir del mapa en las 4 direcciones → el jugador
  queda bloqueado en el borde.
- **CA-8:** Sin XP/gemas/niveles/sonido en el código ni en la UI (verificación por inspección).

## 6. Preguntas abiertas para el usuario
1. ¿Mapa fijo de 2000×2000 con muros (propuesto) o suelo infinito? Por defecto: fijo.
2. ¿Resolución base 1280×720 con escalado FIT? Por defecto: sí.
3. ¿Stack tal cual (Phaser 3.80 + Vite 6 + vitest) o propones cambios? Por defecto: tal cual, sin dependencias extra salvo `vitest`.

## 7. Riesgos
- Spawner en bordes de cámara puede generar dentro de muros si la cámara está
  pegada al límite → mitigación: clampear el punto al interior del mundo.
- Tests de lógica acoplada a Phaser → mitigación: lógica pura en `src/systems/`
  sin importar Phaser, testeable con vitest.
