# Etapa 4 — Armas y pasivos · SPEC

## 1. Objetivo
Pasar de "un arma + 5 boosts" a builds diferenciables: arsenal y pasivos
equipables definidos por datos, con niveles, límites de carga y evoluciones.

## 2. Alcance
1. 5 armas con comportamientos distintos:
   - **Daga** (la actual, dirigida al más cercano).
   - **Orbes**: N orbes orbitan al jugador y dañan al contacto.
   - **Nova**: pulso radial periódico que daña a todo lo cercano.
   - **Lanza**: proyectil que atraviesa enemigos (1 vez por enemigo).
   - **Hoguera**: zona persistente que hace ticks de daño donde cae.
2. Cada arma con niveles 1–8 por tablas de datos (daño, cantidad, cadencia,
   área/velocidad según arma).
3. 4 pasivos equipables con niveles 1–5 que modifican stats (Fuerza, Reloj,
   Botas, Imán; Corazón queda como boost de nivel, no pasivo).
4. Límites: **3 armas + 3 pasivos** simultáneos. Las ofertas respetan límites
   (arma nueva solo con hueco; mejoras solo de lo equipado).
5. Evolución de 2 armas: Daga nv8 + Fuerza ⇒ **MegaDaga**; Orbes nv8 + Reloj
   ⇒ **GranOrbe**. Se ofrece con prioridad cuando cumple requisitos;
   la evolución sustituye al arma base sin ocupar hueco extra.
6. Arma inicial: Daga nv1 (continuidad con Etapas 1–3).

## 3. Fuera de alcance (explícito)
- Enemigos/oleadas/jefes nuevos (Etapa 5). Cambios de balance del resto (Etapa 7).
- Cofres (la evolución se ofrece en el overlay de nivel, no requiere cofre).
- Más de 5 armas / 4 pasivos / rarezas / reroll / skip (futuro).
- Sonido de armas (Etapa 7).

## 4. Requisitos funcionales
- **RF-1 Datos:** cada arma/pasivo/evolución se define en `config.ts`
  (o `src/weapons/*.ts` si el volumen lo pide); la escena no hard-codea números.
- **RF-2 Loadout:** estado `{ weapons: [{id, level} | {evo}], passives: [...] }`;
  funciones puras para ofertas y elegibilidad de evolución.
- **RF-3 Ofertas:** 3 opciones por subida: mezcla de arma nueva (hueco libre),
  subir arma, pasivo nuevo (hueco libre), subir pasivo, evolución (prioritaria).
  Si todo está al máximo, ofrecer curación/oro-simbólico (fallback: +XP directo).
- **RF-4 Comportamientos:** órbitas con daño por contacto limitado por tick por
  enemigo; nova con radio visible; lanza con set de impactados por proyectil;
  hoguera con duración + ticks + radio visible.
- **RF-5 Pools:** proyectiles/orbes/zonas reutilizados con topes; texturas
  procedurales en `BootScene` (+ `ASSETS.md`).
- **RF-6 Compatibilidad:** los boosts de Etapa 3 (dmg/rate/speed/hp/magnet)
  siguen existiendo como mejoras genéricas si hay hueco en la oferta… o se
  retiran. DECISIÓN PROPUESTA: se retiran del pool (los pasivos los sustituyen;
  Corazón queda como fallback/curación). Confirmar en aprobación.
- **RF-7 Sin regresiones:** CA de Etapas 1–3 (incluido clic en cartas, T9).

## 5. Criterios de aceptación verificables
- **CA-1:** manual: en una partida se pueden ver las 5 armas en acción
  (forzando ofertas o con suerte) y 2 evoluciones con su FX diferenciado.
- **CA-2:** manual: con 3 armas no se ofrece arma nueva; con todo al máximo
  sale fallback sin errores.
- **CA-3:** unit: `buildOffers` respeta límites y prioriza evolución;
  `canEvolve` exige arma nv8 + pasivo; tablas de nivel monótonas en daño.
- **CA-4:** unit: ticks orbitales/zona no dañan 2 veces al mismo enemigo en la
  misma ventana (lógica pura de `canTick`).
- **CA-5:** 200+ enemigos + 3 armas activas a ≥ 50 FPS (contador DEV).
- **CA-6:** tests + build verdes; consola limpia en jugar → 5 niveles → morir → reiniciar.

## 6. Preguntas abiertas
1. ¿Retirar los boosts de Etapa 3 del pool (propuesto) o mantenerlos mezclados?
2. ¿Límites 3+3 bien, o 4+4 / 6+6 estilo VS?
3. ¿Nombres/temas de armas bien (Daga, Orbes, Nova, Lanza, Hoguera)?

## 7. Riesgos
- 5 sistemas de arma bajo un engine con dispatch por `kind` (`src/weapons/`,
  ver §2): la escena solo itera el loadout; cada comportamiento vive en su
  updater con pools propios.
- Overlaps ×N armas con 300 enemigos ⇒ mitigación: ticks con ventana por
  enemigo (menos checks efectivos), pools, CA-5 manda.
