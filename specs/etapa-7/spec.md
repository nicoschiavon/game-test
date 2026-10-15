# Etapa 7 — Audio, game feel y opciones · SPEC

## 1. Objetivo
Que el juego se sienta pulido y cómodo en sesiones largas: sonido completo,
pausa y opciones, mejor feedback y balance revisado con datos.

## 2. Alcance
1. Audio 100 % generado por código (WebAudio, sin assets ni licencias que
   gestionar; se documenta en `ASSETS.md`): SFX de disparo, impacto, muerte,
   gema, subida de nivel, compra, clic UI, daño, victoria/derrota + bucle
   musical sencillo (arpegio por secuenciador propio, 2–3 capas).
2. Menú de pausa (Esc/P): continuar, volumen, controles y salir al menú.
   La pausa congela física, timer, spawns y tweens de gameplay.
3. Opciones: volumen master/música/SFX (botones −/+ persistidos) y remapeo
   de teclas de movimiento + pausa (clic en acción → pulsar tecla).
   Guardado en `vs02-settings-v1` (versionado como el de Etapa 6).
4. Game feel: hit-stop breve en muertes de élite/jefe (40–60 ms), destello +
   sonidito al recoger gema, pop en barra XP al subir, transiciones fade
   menú↔partida.
5. Pase de balance con datos medidos (TTK, DPS esperado, presión): ajustes
   solo en tablas (`defs.ts`, `waves.ts`, `config.ts`), justificados en design.
6. Gamepad: stick izquierdo para moverse + botón A/Esc-equivalente para
   confirmar/pausa (polling por frame, sin dependencias).

## 3. Fuera de alcance (explícito)
- Voces, música por pistas externas, audio posicional/HRTF.
- Remapeo del gamepad o de ratón. Multitouch (Etapa 8).
- Nuevos contenidos (armas/enemigos/mapas). Cambios de API de guardado.

## 4. Requisitos funcionales
- **RF-1 Audio:** `AudioSys` central (`sfx(nombre)`, `music(start/stop)`,
  `setVolumes`); desbloqueo en primer input (política de autoplay);
  todo suena también con 300 enemigos sin petar (voces limitadas, throttle).
- **RF-2 Pausa:** estado `paused` con overlay propio; reanuda exacto
  (física, tweens de gameplay pausados vía `tweens.pauseAll`? — solo los de
  gameplay: usar `physics.pause()` + flag que congele `update` + `time.paused`).
  Esc/P alterna; el overlay respeta T9 (scrollFactor en botones).
- **RF-3 Settings:** volúmenes 0–100 (paso 10) y bindings persistidos;
  el juego los aplica al arrancar (menú y partida).
- **RF-4 Hit-stop:** `hitStop(ms)` congela mundo (timeScale 0.05) 40–60 ms en
  élite/jefe/evolución; sin tocar el reloj de la run.
- **RF-5 Transiciones:** fadeIn al entrar en partida/menú, fadeOut al salir.
- **RF-6 Balance:** tabla de cambios con motivo y métrica (TTK slime nv1,
  DPS jefe a 8 min, etc.).
- **RF-7 Gamepad:** si hay gamepad, el stick mueve (deadzone 0.25) y el botón
  9 (start) pausa; botón 0 confirma en overlays simples. Sin gamepad físico
  para probar: marcado como verificado por el usuario (ver T8).
- **RF-8 Sin regresiones:** CA 1–6 + T9 de clic y orden de overlaps.

## 5. Criterios de aceptación verificables
- **CA-1:** manual: todo suena (disparo/impacto/muerte/gema/nivel/compra/
  clic/daño/fin) y el mute total funciona.
- **CA-2:** manual: Esc pausa y reanuda sin teleports ni muertes injustas;
  volumen y teclas persisten tras recargar.
- **CA-3:** manual: matar élite/jefe congela 1 instante; recoger gemas tintinea
  con destello; fade al entrar/salir.
- **CA-4:** unit: settings migrate + audio throttle (`canPlay(now)` ventana);
  bindings por defecto válidos.
- **CA-5:** manual usuario con gamepad: moverse + pausar (reporte).
- **CA-6:** tests + build verdes; consola limpia en ciclo completo con audio.

## 6. Preguntas abiertas
1. ¿Audio generado (propuesto, 0 dependencias) o prefieres pack CC0 descargado?
2. ¿Balance propuesto en design §6 bien como punto de partida?

## 7. Riesgos
- Autoplay bloquea audio hasta input ⇒ mitigación: init diferido al primer
  pointer/keydown; icono de mute visible si falla.
- Remapeo puede romper teclas de nivel (1/2/3) y R ⇒ mitigación: solo
  reasignables movimiento + pausa; el resto fijo y documentado.
- Gamepad sin hardware para probar ⇒ mitigación: código mínimo y estándar,
  verificación delegada al usuario (CA-5).
