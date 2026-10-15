# Despliegue en Vercel

El proyecto ya está preparado: preset Vite autodetectable, `vercel.json` con
build fijado (`npm ci` → `npm run build` → `dist/`), sin backend ni rutas SPA
que requieran rewrites, y `.gitignore` excluyendo `node_modules/` y `dist/`.

## Opción A — Desde el dashboard (recomendada)

1. Subir el código a GitHub:
   ```bash
   git init
   git add .
   git commit -m "feat: vs02 Survivors v1.0.0 (8 etapas)"
   git remote add origin https://github.com/<tu-usuario>/vs02-survivors.git
   git push -u origin main
   ```
2. Abrir https://vercel.com/new → **Add New… → Project** → **Import** el repo.
3. Verificar que Vercel detecta: Framework Preset **Vite**, Build Command
   `npm run build`, Output Directory `dist`, Install Command `npm ci`
   (todo viene fijado en `vercel.json`; no hay que cambiar nada).
4. Pulsar **Deploy**. En ~1 min queda publicado en
   `https://<proyecto>.vercel.app`.
5. Opcional: **Settings → Domains** para un dominio propio;
   **Settings → Git** para conectar ramas y auto-deploys por push.

## Opción B — Con la CLI (sin GitHub, 30 s)

```bash
npm install -g vercel   # solo la primera vez
vercel login            # completa el login en el navegador
vercel deploy --prod    # publica dist/ en producción
```

Para previews sin tocar producción: `vercel deploy` (sin `--prod`).

## Probar el build local antes de subir

```bash
npm run build
npx vite preview   # abrir la URL indicada y jugar una partida
```

Si el menú carga sin errores de consola, el deploy saldrá verde.
