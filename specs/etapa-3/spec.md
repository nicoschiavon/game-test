# Etapa 3 — Experiencia y niveles · SPEC

## 1. Objetivo
Dar a la partida una progresión interna que se sienta: matar ⇒ gemas ⇒ XP ⇒
niveles ⇒ elegir 1 de 3 mejoras, con el juego pausado y sin bugs, y sostener
60 FPS con 300+ enemigos (objetivo de rendimiento fijado para esta etapa).

## 2. Alcance
1. Gemas de XP: cada enemigo muerto suelta 1 gema (valor fijo configurable).
   Gema procedural con estética pixel (el pack no trae gema; se documenta en
   `ASSETS.md`). Pool con tope configurable.
2. Imán: las gemas dentro de `pickupRadius` aceleran hacia el jugador; al
   tocarlo (~20 px) se recogen y suman XP.
3. Barra de XP (HUD) + nivel actual + curva de progresión configurable en
   `config.ts` (`XP_CURVE`).
4. Al subir de nivel: el juego se pausa (física + timer + spawns detenidos) y
   muestra overlay con **3 mejoras aleatorias distintas**; clic o teclas 1/2/3
   para elegir. Subidas múltiples encoladas (se resuelven en cadena).
5. Mejoras iniciales (repetibles, sin tope en esta etapa): daño +15 %,
   cadencia +12 % (menos intervalo), velocidad +8 %, vida máx. +20 (y cura +20),
   radio de recogida +30 %.
6. Rampa de presión sencilla (sin oleadas: las oleadas son Etapa 5): intervalo
   de spawn y tope de enemigos escalan con el tiempo hasta 300 enemigos para
   verificar el objetivo de rendimiento.

## 3. Fuera de alcance (explícito)
- Niveles de arma / armas nuevas / pasivos / evoluciones (Etapa 4).
- Tipos de enemigo nuevos, jefes, oleadas por datos, victoria (Etapa 5).
- Sonido (Etapa 7). Rarezas/tiers de gema (futuro; aquí 1 tipo).
- Guardado entre partidas (Etapa 6). Tienda/meta-progresión (Etapa 6).

## 4. Requisitos funcionales
- **RF-1 Drop:** todo enemigo muerto deja 1 gema en su posición (pool; si el
  pool está lleno se pierde la gema más vieja, nunca se crashea).
- **RF-2 Imán:** gema a distancia ≤ `pickupRadius` ⇒ velocidad hacia el
  jugador (mínimo configurable, crece al acercarse); a ≤ 20 px se recoge.
- **RF-3 XP/nivel:** `xpForLevel(n)` en `config.ts` (`base` + `growth`
  exponencial). Al alcanzar el umbral: `level+1`, exceso de XP conservado.
- **RF-4 Pausa:** con subida pendiente el estado pasa a `levelup`: física en
  pausa, timer detenido, input de movimiento ignorado, overlay visible.
- **RF-5 Opciones:** 3 mejoras distintas por oferta (RNG inyectable en la
  lógica); elegir aplica el efecto y reanuda; si hay más subidas pendientes se
  abre la siguiente oferta inmediatamente.
- **RF-6 Stats centrales:** un objeto `RunStats` (multiplicadores de daño,
  cadencia, velocidad + vida máx. + radio) alimenta a jugador/arma/HUD; las
  mejoras son funciones puras sobre él.
- **RF-7 HUD:** barra de XP fina arriba + texto `Nv X`; la barra de HP usa la
  vida máx. vigente.
- **RF-8 Rampa:** `spawnInterval` y `maxEnemies` en función del tiempo
  (tope 300) definidos por datos; la escena no hard-codea números.
- **RF-9 Sin regresiones:** CA de Etapas 1–2 siguen cumpliéndose.

## 5. Criterios de aceptación verificables
- **CA-1:** manual: matar ⇒ gema verde; acercarse ⇒ vuela al jugador; al
  tocarla la barra de XP sube.
- **CA-2:** manual: llenar la barra ⇒ overlay con 3 cartas, juego congelado
  (timer parado, enemigos quietos); elegir con clic y con teclas 1/2/3.
- **CA-3:** unit: `grantXp` conserva el exceso y encadena N subidas;
  `rollUpgrades` devuelve 3 ids distintos; `xpForLevel` es creciente.
- **CA-4:** unit: cada mejora (`applyUpgrade`) modifica su stat en el % exacto;
  manual: daño y cadencia se notan al subirlas 2–3 veces.
- **CA-5:** manual 5 min: el nº de enemigos crece hasta ~300 y el contador DEV
  marca ≥ 50 FPS sostenidos.
- **CA-6:** `npm run test`, `npm run build` en verde; 0 errores en consola en
  jugar → subir 3 niveles → morir → reiniciar (el reinicio resetea stats/XP/gemas).

## 6. Preguntas abiertas
1. ¿Números propuestos bien (gema 10 XP, curva 30·1.35ⁿ⁻¹, rampa a 300 en ~5 min)?
2. ¿Mejoras repetibles sin tope en Etapa 3 (los límites llegan en Etapa 4)?

## 7. Riesgos
- Overlay de cartas con texto largo en 1280×720 ⇒ mitigación: 3 cartas fijas
  300×220 con nombre + % + descripción corta.
- 300 overlaps jugador-enemigo + gemas por frame ⇒ mitigación: overlap nativo
  Arcade (ya usado), gemas con `physics.velocity` solo dentro del radio,
  pools con tope; verificación CA-5.
