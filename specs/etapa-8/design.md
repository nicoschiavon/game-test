# Etapa 8 — Pulido final y entrega · DESIGN

## 1. Rendimiento y memoria
- Medición: `take_heapsnapshot` (t0 tras 60 s de juego, t1 tras 6 min con
  250+ enemigos) + FPS DEV. Criterio: objetos Phaser estables, sin crecimiento
  lineal de Tween/DelayedCall/Listener.
- Pase anti-asignaciones (solo si el perfil lo pide; hoy 60 FPS):
  - `WeaponEngine.updateShooter`: `foes.map()` por descarga solo al disparar
    (ya es así); `liveEnemies()` crea 1 array por frame en nova/zona — aceptado
    (≤ 4/frame). Sin cambios salvo que el heap muestre lo contrario.
  - `updateGems`/`steerAll`: ya sin asignaciones.
- `vite.config.ts`: `base: './'` (portable). Nada de code-split: Phaser debe ir
  en un chunk (el warning >500 KB se documenta, no se "arregla" partiendo).

## 2. Matriz de regresión (casos límite a probar en T8)
- Pausa durante levelup (Esc no hace nada: solo playing/paused alternan ✓ por
  diseño — verificar), pausa durante dying, R durante levelup (ignorado),
  reintentar ×3 seguidos, menú→jugar→menú→jugar (pools/cartas reseteados),
  localStorage corrupto (`'{'` a mano) y lleno (excepción silenciada),
  resize a mitad de partida, tab oculta 30 s (delta clamp 0.1 s), victoria y
  derrota seguidas, comprar con saldo exacto.

## 3. Ayuda y primera partida
- Botón "Ayuda" en `MenuScene` (junto a JUGAR): overlay con controles,
  objetivo, enemigos/armas y consejos; cierra con clic/Escape.
- `save.seenHelp`? No: flag aparte `vs02-settings-v1`… mejor en save:
  `SaveV1.tutorialSeen: boolean` (migrate lo pone false). En `GameScene.create`,
  si false: banner largo "WASD/flechas o joystick para moverse · sobrevive"
  6 s + persistir true. migrate/save.test cubren el campo nuevo.

## 4. Táctil (`src/systems/touch.ts` puro + zona en escena)
- `touchState(activeId, originX, originY, x, y): {mx, my} | null` puro:
  vector/56 px clamp, deadzone 8 px, normalizado por la escena.
- `GameScene`: si `'ontouchstart' in window`, zona izquierda (invisible,
  `setInteractive` en rect de 1/2 pantalla, depth 200, scrollFactor 0):
  pointerdown/move/up con pointerId de touch ⇒ stick visual (2 círculos) +
  `ix/iy` del stick (prioridad menor que teclado). Tap en cartas/botones ya
  funciona (pointer events). Joystick solo visible mientras se toca.
- Responsive: FIT ya adapta; verificar capturas; `index.html` ya bloquea
  scroll (`height:100vh`, sin overflow). Añadir `touch-action: none` al CSS
  para evitar gestos del navegador.

## 5. Deploy
- `package.json` → `1.0.0`. README: itch.io (zip de `dist/`, proyecto HTML,
  viewport 1280×720) + Pages (subir `dist/`, nota de `base './'`).
- Verificación: servir `dist/` con `vite preview` y smoke test (boot sin
  errores, assets 200 relativos).

## 6. Docs
- `docs/ARCHITECTURE.md`: capas (scenes/engines/systems/meta/audio/ui),
  estados de GameScene, flujo update, pools, decisiones (T9 clic, overlaps).
- `docs/ADDING_CONTENT.md`: recetas numeradas (arma/pasivo/enemigo/oleada/
  mapa/personaje/tienda) con ficheros a tocar y tests a añadir.
- README: controles + deploy + estado final. ROADMAP: 8/8.

## 7. Dependencias
- Ninguna nueva.
