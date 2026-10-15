# ASSETS — fuentes y licencias

Todos los assets visuales de este proyecto son o bien del pack CC0 citado
abajo o bien generados por código en tiempo de ejecución (sin ficheros).

## Pack principal: Kenney Tiny Dungeon

- **Autor:** Kenney (https://kenney.nl)
- **Página del asset:** https://kenney.nl/assets/tiny-dungeon
- **Zip oficial descargado:** https://kenney.nl/media/pages/assets/tiny-dungeon/f8422efb44-1674742415/kenney_tiny-dungeon.zip
- **Versión:** 1.0 (2022-07-05)
- **Licencia:** Creative Commons CC0 1.0 Universal
  (http://creativecommons.org/publicdomain/zero/1.0/) — dominio público;
  uso libre en proyectos personales, educativos y comerciales sin permiso.
  Se acredita al autor por cortesía aunque no es obligatorio.
- **Copia de la licencia:** el zip original incluye `License.txt` con el texto
  CC0 (no versionado aquí; ver URL anterior).

### Ficheros usados (copiados a `public/assets/`)

Nota: Vite solo sirve ficheros estáticos desde `public/` (en dev) y los copia
a `dist/` en el build; por eso los PNG viven en `public/assets/` y Phaser los
carga por URL (`assets/player.png`, …). Sin dependencias nuevas.

| Fichero          | Origen en el pack              | Uso en el juego                  |
|------------------|--------------------------------|----------------------------------|
| `player.png`     | `Tiles/tile_0085.png` (caballero) | Sprite del jugador (×3, NEAREST) |
| `player-mage.png` | `Tiles/tile_0084.png` (maga) | Personaje Maga (Etapa 6) |
| `player-barbaro.png` | `Tiles/tile_0088.png` (bárbaro) | Personaje Bárbaro (Etapa 6) |
| `e-slime.png`    | `Tiles/tile_0108.png` (slime verde) | Enemigo base + invocaciones del jefe |
| `e-bat.png`      | `Tiles/tile_0123.png` (murciélago) | Enemigo rápido y frágil |
| `e-spider.png`   | `Tiles/tile_0122.png` (araña) | Enemigo que orbita y embiste |
| `e-ghost.png`    | `Tiles/tile_0121.png` (fantasma) | Enemigo que se divide (+ minis a ×2) |
| `e-skeleton.png` | `Tiles/tile_0111.png` (esqueleto) | Enemigo a distancia |
| `e-brute.png`    | `Tiles/tile_0109.png` (bruto) | Tanque + base del mini-jefe élite (×1.8) |
| `e-demon.png`    | `Tiles/tile_0110.png` (demonio) | Jefe final Rey Demonio (×5) |
| `tileset.png`    | `Tilemap/tilemap_packed.png` (12×11 tiles de 16×16, sin espaciado) | Tilemap de suelo, decoración y muros |

### Índices del tileset (row-major, 12 columnas)

- Arena — suelo: `48` (base), `49`, `50`, `51`, `52`, `53` (variantes).
  Decoración: `62` (grietas), `73` (guijarros), `101` (mancha), `124` (calavera).
  Muro: `40` (bloque).
- Mazmorra (Etapa 6) — suelo: `40` (base), `57`, `58`, `59` (ladrillo).
  Decoración: `124` (calavera), `101` (trampa), `125`/`126` (antorchas),
  `62` (grietas). Muro: `28` (reja).

## Generado por código (sin licencia aplicable)

- `spark`: chispa de 6×6 px para el burst de partículas al matar.
- `bullet`: proyectil pixel-art 10×6 px amarillo/blanco (el pack no incluye
  proyectiles; se dibuja procedural para mantener la estética pixel).
- `gem`: gema de XP, diamante 10×12 px verde con brillo (el pack no incluye
  gemas; procedural con la misma estética).
- `orb`: orbe orbital 12×12 cian (arma Orbes/GranOrbe).
- `spear`: lanza perforante 18×6 (arma Lanza).
- `ring`: anillo 64×64 para la Nova (se tiñe naranja en runtime).
- `zone`: círculo 64×64 para la Hoguera (se tiñe y escala en runtime).
- `eshot`: proyectil enemigo 8×8 rojo (esqueleto y Rey Demonio).
- Audio Etapa 7: 12 SFX + bucle musical (bajo/arpegio/hat) 100 % sintetizados
  con WebAudio en `src/audio/` — sin ficheros, sin licencias.
- `shadow`: elipse semitransparente bajo jugador/enemigos (opcional).
