# Etapa 7 — Audio, game feel y opciones · DESIGN

## 1. Audio (`src/audio/`, WebAudio directo, sin assets)
```
src/audio/
  synth.ts   # NUEVO puro: descriptores nota→osc (freq, dur, tipo, vol, slide)
  player.ts  # NUEVO: AudioSys (ctx lazy, master/music/sfx gains, throttle por nombre)
  music.ts   # NUEVO: secuenciador de 8 pasos (bajo + arpegio + hat de ruido), 112 BPM
```
- SFX por síntesis (square/triangle/sine + pitch slide + noise buffer):
  shoot (sq 660→220, 0.08 s), hit (ruido 0.05), die (tri 300→60, 0.18),
  gem (sine 880→1320, 0.09), level (arpegio 3 notas), buy (2 notas),
  ui (sq 440, 0.05), hurt (saw 160→70, 0.2), victory (4 notas), defeat (3 desc).
- Throttle: `canPlay(nombre, now)`: shoot/hit/gem ≤ 1 cada 60 ms (con 300
  enemigos no se saturan las voces; máx 8 osciladores concurrentes).
- Música: loop con `setInterval`-like por `lookahead` simple en update
  (nextNoteTime); volúmenes desde settings; `M` = mute rápido (fijo, no
  reasignable). Todo documentado como generado en `ASSETS.md`.

## 2. Settings (`src/meta/settings.ts`)
```ts
Settings { version, master, music, sfx, keys: { up, down, left, right, pause } }
KEYS por defecto: WASD+flechas (fijo, siempre activas) + alternas reasignables.
```
- Hmm, simplificación: movimiento = flechas fijas + WASD fijas (ya existen);
  reasignables: 4 direcciones alternativas (defecto IJKL) + pausa (defecto
  Esc/P). La escena combina: `down = cursors || wasd || bind`.
- Clave `vs02-settings-v1`, migrate tolerante (reutiliza patrón de save.ts).

## 3. Pausa
- Estado `paused` en `GameScene`: `physics.world.pause()` + `time.paused = true`
  (congela delayedCalls/tweens basados en reloj? — los tweens usan su propio
  reloj: `this.tweens.paused = true` global de la escena; al reanudar, todo
  sigue. Los overlays de pausa usan tweens… se crean DESPUÉS de pausar tweens:
  usar solo alpha/set sin tween en el overlay de pausa, o `tweens.timeScale`).
  DECISIÓN: `physics.pause() + tweens.pauseAll() + time.paused = true`; overlay
  de pausa sin tweens (aparición instantánea + fade por alpha directo).
- Overlay: Continuar / Volumen −/+ (master) / Controles (lista + reasignar) /
  Salir al menú. Esc/P alterna (JustDown en update).
- `dt` en update: con pausa retornamos antes de acumular ⇒ timer intacto.

## 4. Game feel
- `hitStop(ms)`: `physics.world.timeScale = 0.05; tweens.timeScale = 0.05` y
  `delayedCall(ms real)` que restaura a 1. En élite (50 ms), jefe (60 ms) y
  evolución (40 ms). El `elapsed` usa `dt` del frame (timeScale afecta a delta?
  no: delta es real; el mundo se congela pero el timer corre 50 ms — despreciable).
- Gema: al recoger, `burst` blanco 3 + `sfx('gem')` (throttle 60 ms).
- XP bar pop: `setScale` 1→1.15→1 en `refreshXpHud` cuando hay subida (tween
  corto, pool nulo: 1 tween por subida, aceptado).
- Transiciones: `cameras.main.fadeIn(250)` en create de menú/partida;
  `fadeOut(200)` + `delayedCall` al salir al menú o empezar partida.

## 5. Gamepad (`src/systems/gamepad.ts` puro + polling en escena)
- `readPad(navigator.getGamepads?.()[0]) → { mx, my, start, a } | null`
  (deadzone 0.25, puro y testeable con gamepad falso).
- Escena: `mx/my` se suman al input si no hay teclas; `start` = JustDown→pausa;
  `a` confirma en gameover/victory/levelup (mapeado a chooseUpgrade(0)? no:
  solo gameover/victory para no elegir mejoras sin querer; en nivel solo 1/2/3).
- Sin hardware aquí: CA-5 delegada al usuario.

## 6. Balance (propuesto; validar en playtest T7)
| Cambio | Motivo |
|--------|--------|
| eshot skeleton 210→190, firePeriod 2.4→2.8 | esquiva justa a pie |
| dasher dmg 12→10 | embestida + contacto encadenado dolía 22 |
| elite hp 550→500 | TTK con build media ~6 s → ~5 s |
| demon hp 2500→2200 | fin de run ~8 min no debe eternizarse |
| brute speed 70→75 | que no se le ignore andando |
| nova L1 20→22 | hacerla elegible frente a daga |
- Solo tablas; ningún cambio de arquitectura.

## 7. Tests
- `tests/settings.test.ts`: migrate (null/corrupto), defaults, persistencia
  de niveles; `tests/audio.test.ts`: throttle por nombre y límites;
  `tests/gamepad.test.ts`: deadzone, botones con pad falso.
- Manual: CA-1/2/3/5 + ciclo con audio.

## 8. Dependencias
- Ninguna. (WebAudio nativo; gamepad nativo.)
