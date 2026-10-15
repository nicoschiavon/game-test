# Etapa 5 — Enemigos, oleadas y jefes · SPEC

## 1. Objetivo
Dar a la partida un arco de dificultad (de calmada a caótica) y un final:
reparto de enemigos con IAs distintas dirigido por datos, oleadas, mini-jefes,
jefe final con patrones y pantalla de victoria.

## 2. Alcance
1. 6 tipos + variantes, todos del pack Tiny Dungeon (verificados visualmente
   el 2026-10-14; CC0, ver `ASSETS.md`):
   - **Slime** (108): perseguidor equilibrado (el actual).
   - **Murciélago** (123): rápido y frágil, acosa en enjambre.
   - **Araña** (122): orbita a ~200 px y embiste cada ~2.5 s.
   - **Fantasma** (121): lento; al morir se divide en 2 minis (mismo sprite,
     escala ×2, poco HP).
   - **Esqueleto** (111): a distancia; mantiene ~280 px y dispara proyectiles.
   - **Bruto** (109): tanque lento con mucho HP y contacto fuerte.
2. Proyectiles enemigos (pool, textura procedural) con daño por contacto;
   respetan los i-frames del jugador.
3. Oleadas por datos (`WAVES`): desbloqueos progresivos, bursts puntuales,
   mezcla de spawn continua según tiempo + rampa de intervalo/tope existente.
4. Escalado con el tiempo (HP/daño por datos, función pura testeable).
5. Mini-jefes (bruto élite ×1.8, 550 HP) a los 3:00 y 6:00 + jefe final
   **Rey Demonio** (110) a los 8:00 con aviso, barra de HP y 3 patrones
   (abanico radial, invocar slimes, carga).
6. Victoria al derrotar al jefe final: overlay propio con stats (tiempo, nivel,
   kills) + Reiniciar. La muerte sigue como hasta ahora.

## 3. Fuera de alcance (explícito)
- Armas/pasivos nuevos (Etapa 4 cerrada; solo ajustes de balance menores).
- Más de 1 mapa / personajes / meta-progresión (Etapa 6).
- Sonido de jefes (Etapa 7). Múltiples jefes finales o fases con cinemática.

## 4. Requisitos funcionales
- **RF-1 Datos:** cada enemigo en `src/enemies/defs.ts` (stats base, sprite,
  escala, comportamiento, XP); oleadas en `WAVES`; escalado en `scaleAt`.
- **RF-2 Comportamientos:** persecución, enjambre rápido, órbita+embestida,
  división al morir, kite+disparo, tanque. Embiste y disparos con telegrafiado
  mínimo (parpadeo/tinte 300 ms antes — legibilidad, no one-shots injustos).
- **RF-3 Oleadas:** eventos una sola vez (desbloqueo, burst, élite, jefe) +
  mezcla continua `mixAt(t)`; nada hard-codeado en la escena.
- **RF-4 Jefe:** no despawnea ni sale del pool normal; barra de HP superior;
  aviso 3 s antes; al morir ⇒ estado `victory` (física en pausa, overlay).
- **RF-5 Kills:** contador de muertes para la pantalla de victoria.
- **RF-6 Recompensas:** XP por tipo (débil 5–8, medio 10–15, bruto 25,
  élite 60, jefe 300); élite suelta 5 gemas, jefe 20 en abanico.
- **RF-7 Sin regresiones:** CA de Etapas 1–4 (clic incluido).

## 5. Criterios de aceptación verificables
- **CA-1:** manual: antes del min 1 solo slimes/murciélagos; al min 5 se ven
  ≥ 5 tipos con comportamientos distinguibles (capturas).
- **CA-2:** unit: `mixAt` solo desbloqueados por tiempo y pesos que suman 1;
  `waveEvents` dispara cada evento una vez y en orden; `scaleAt` monótona.
- **CA-3:** manual: élites a 3:00/6:00 con banner; jefe a 8:00 con aviso,
  barra de HP y los 3 patrones visibles.
- **CA-4:** manual: matar al jefe ⇒ overlay ¡VICTORIA! con stats; morir ⇒
  Game Over normal; reiniciar resetea oleadas/jefe/kills.
- **CA-5:** unit: `splitMinis` devuelve 2 descriptores; `canTick` reutilizado
  para ticks de zona/orbe sin cambios.
- **CA-6:** 250+ enemigos mixtos + proyectiles a ≥ 50 FPS (contador DEV).
- **CA-7:** tests + build verdes; consola limpia en ciclo completo.

## 6. Preguntas abiertas
1. ¿Jefe a los 8:00 y victoria solo por matarlo (propuesto), o también victoria
   por sobrevivir 10:00?
2. ¿Nombres y cast propuestos bien?

## 7. Riesgos
- Proyectiles enemigos + 300 overlaps ⇒ mitigación: 1 pool de 64, overlap
  único contra el jugador (no N×M), i-frames existentes.
- El jefe puede morir fuera de pantalla sin que el jugador lo vea ⇒
  mitigación: el jefe persigue siempre (lento) y su barra es global.
