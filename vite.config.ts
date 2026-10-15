import { defineConfig } from 'vite';

export default defineConfig({
  base: './', // build portable: itch.io (iframe) y subpaths (GitHub Pages)
  server: {
    port: 5173,
    open: false,
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});
