# vs02 — Survivors-like · v1.0.0 final

Juego 2D de supervivencia con vista cenital (Phaser 3 + Vite + TypeScript).
El jugador se mueve, las armas disparan solas, hordas crecientes lo persiguen,
sube de nivel eligiendo mejoras y puede ganar al Rey Demonio (8:00).

## Requisitos

- Node.js 20+ y npm.

## Instalación y ejecución

```bash
npm install
npm run dev
```

Abrir la URL que muestra Vite (por defecto http://localhost:5173).

## Comandos

| Comando        | Descripción                              |
|----------------|------------------------------------------|
| `npm run dev`  | Demo en desarrollo (HMR)                 |
| `npm run build`| Compila TypeScript y genera `dist/`      |
| `npm run test` | Tests unitarios con vitest               |

## Controles

- Moverse: **WASD** o **flechas** (diagonal normalizada; + teclas alternas
  reasignables en pausa, por defecto IJKL).
- Ataque automático. Elegir mejora: clic o **1/2/3**.
- **Esc** o **P**: pausa (volumen, controles, salir). **M**: silenciar.
- **R**: reiniciar tras el fin. Mando: stick + start (pausa) + A (confirmar).

## Estado (Etapa 8 · v1.0.0 final)

- Juego completo: menú/personajes/mapas/tienda, 5 armas, 6 enemigos + jefes,
  XP/niveles/evoluciones, audio generado, pausa/opciones/mando, ayuda y táctil.
- Ver `specs/ROADMAP.md` (8/8), `docs/ARCHITECTURE.md` y `docs/ADDING_CONTENT.md`.

## Despliegue

El build es portable (`base: './'`): sirve desde cualquier ruta o iframe.

```bash
npm run build   # genera dist/ autocontenido
```

**Vercel:** ver `docs/DEPLOY.md`. Resumen: subir el repo a GitHub, importar en
https://vercel.com/new (preset Vite autodetectado: `npm run build` → `dist/`)
y **Deploy** → `https://<proyecto>.vercel.app`. Alternativa sin GitHub:
`vercel login && vercel deploy --prod`.

**itch.io:** crea un proyecto HTML, sube un `.zip` con el contenido de `dist/`,
viewport 1280×720, marca "This file will be played in the browser".

**GitHub Pages:** sube `dist/` (rama `gh-pages` o Actions); al ser rutas
relativas funciona en `usuario.github.io/repo/` sin cambios.

**Probar el build local:** `npx vite preview` y abrir la URL indicada.
