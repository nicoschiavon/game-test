# Etapa 8 — Pulido final y entrega · SPEC

## 1. Objetivo
Cerrar el proyecto: versión final estable, sin fugas en sesiones largas,
jugable con táctil, documentada y desplegable con instrucciones.

## 2. Alcance
1. Rendimiento/memoria: medir FPS con 300 enemigos + heap snapshots (inicio vs
   +5 min) sin crecimiento anómalo; pase ligero anti-asignaciones en hot loops;
   tope de tweens/partículas bajo control.
2. Pase de bugs y casos límite: regresión completa de CA 1–7, T9 de clic,
   orden de overlaps, doble pausa, pausa durante levelup/muerte, reintentos
   encadenados, localStorage corrupto/lleno, resize de ventana, tab oculta.
3. Ayuda: botón "Ayuda" en el menú (controles, objetivo, consejos) + pista de
   movimiento los primeros 10 s de la primera partida (flag en save).
4. Táctil + responsive: joystick virtual (mitad izquierda, solo si hay touch),
   botones de menús ya táctiles (pointer); FIT verificado en 16:9, 4:3 y móvil
   vertical (capturas); sin zoom ni scroll de página.
5. Deploy: `base: './'` en Vite (build portable para itch.io y subpaths);
   versión `1.0.0`; README con despliegue en itch.io (zip de `dist/`) y
   GitHub Pages (pasos + `base` si es subpath).
6. Docs finales: `docs/ARCHITECTURE.md` (capas, flujo de datos, estados),
   `docs/ADDING_CONTENT.md` (arma, enemigo, mapa, personaje paso a paso),
   `ASSETS.md` y README al día, ROADMAP todo aprobado.

## 3. Fuera de alcance (explícito)
- Contenido nuevo (ya cerrado en 1–7). Cambios de balance salvo bug crítico.
- Multitouch avanzado (pellizco), haptics, PWA/offline.
- T0 mazmorra: sigue bloqueado sin FPS/clip del usuario; si llega evidencia
  se ataca aquí, si no queda como issue conocido documentado.

## 4. Requisitos funcionales
- **RF-1 Perf:** ≥ 50 FPS con 300 enemigos + 3 armas + eshots (medido);
  heap estable (±5 % ruido) entre min 1 y min 6 de la misma sesión.
- **RF-2 Cero errores:** consola limpia en matriz: menú↔partida↔pausa↔fin ×
  personaje/mapa, resize, tab oculta 30 s, localStorage corrupto.
- **RF-3 Ayuda:** overlay en menú + pista inicial una sola vez (persistida).
- **RF-4 Táctil:** joystick aparece solo con touch; mover con él equivale a
  teclado (mismo `normalizeMoveVector`); sin interferir con ratón.
- **RF-5 Deploy:** `npm run build` genera `dist/` autocontenido y portable;
  instrucciones verificadas (zip válido, `index.html` + assets relativos).
- **RF-6 Docs:** arquitectura + guías paso a paso + licencias + controles.

## 5. Criterios de aceptación verificables
- **CA-1:** heap snapshots t0/t+5min sin crecimiento de listeners/tweens/
  GameObjects (comparativa documentada en tasks).
- **CA-2:** matriz de regresión pasada (tabla en tasks con ✓/✗ por caso).
- **CA-3:** ayuda visible desde menú; pista inicial solo la primera vez.
- **CA-4:** capturas 1280×720, 1024×768 y 390×844 (móvil, emulado) correctas;
  joystick visible y funcional con touch emulado.
- **CA-5:** `dist/` desplegable: zip para itch.io + pasos Pages en README.
- **CA-6:** tests + build verdes; versión 1.0.0; ROADMAP 8/8 aprobada tras demo.

## 6. Preguntas abiertas
1. ¿Destino de despliegue preferido (itch.io, Pages, ambos)? Propuesto: ambos
   documentados, `base: './'` sirve a los dos.
2. ¿Versión 1.0.0 bien para cerrar?

## 7. Riesgos
- Heap: los tweens con onComplete y delayedCalls huérfanos son la fuga típica
  ⇒ mitigación: `killTweensOf` sistemático (ya existe) + comparativa de snapshots.
- Touch sin hardware ⇒ mitigación: emulación de viewport+touch en DevTools.
