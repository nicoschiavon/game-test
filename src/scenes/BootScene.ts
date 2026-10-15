import Phaser from 'phaser';

/**
 * BootScene: precarga PNGs de public/assets + genera las 2 texturas
 * procedurales (chispa de partícula, proyectil pixel-art) y cede a GameScene.
 */
export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload(): void {
    this.load.image('player', 'assets/player.png');
    this.load.image('player-mage', 'assets/player-mage.png');
    this.load.image('player-barbaro', 'assets/player-barbaro.png');
    for (const key of ['e-slime', 'e-bat', 'e-spider', 'e-ghost', 'e-skeleton', 'e-brute', 'e-demon']) {
      this.load.image(key, `assets/${key}.png`);
    }
    this.load.image('tileset', 'assets/tileset.png');
  }

  create(): void {
    this.makeSpark();
    this.makeBullet();
    this.makeGem();
    this.makeOrb();
    this.makeSpear();
    this.makeRing();
    this.makeZone();
    this.makeEshot();
    this.scene.start('menu');
  }

  /** Chispa 6×6 para el burst de partículas (se tiñe por emisor). */
  private makeSpark(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillRect(2, 0, 2, 6);
    g.fillRect(0, 2, 6, 2);
    g.fillRect(1, 1, 4, 4);
    g.generateTexture('spark', 6, 6);
    g.destroy();
  }

  /** Proyectil pixel-art 10×6 (el pack no trae proyectiles). */
  private makeBullet(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xfacc15, 1);
    g.fillRoundedRect(0, 1, 10, 4, 2);
    g.fillStyle(0xffffff, 1);
    g.fillRoundedRect(1, 2, 5, 2, 1);
    g.generateTexture('bullet', 10, 6);
    g.destroy();
  }

  /** Gema de XP: diamante 10×12 verde (el pack no trae gemas). */
  private makeGem(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x4ade80, 1);
    g.fillTriangle(5, 0, 0, 5, 10, 5);
    g.fillTriangle(0, 5, 10, 5, 5, 12);
    g.fillStyle(0xbbf7d0, 1);
    g.fillTriangle(5, 1, 3, 5, 7, 5);
    g.fillStyle(0x16a34a, 1);
    g.fillTriangle(3, 5, 7, 5, 5, 11);
    g.generateTexture('gem', 10, 12);
    g.destroy();
  }

  /** Orbe orbital 12×12 cian. */
  private makeOrb(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x22d3ee, 1);
    g.fillCircle(6, 6, 5);
    g.fillStyle(0xa5f3fc, 1);
    g.fillCircle(6, 6, 2);
    g.generateTexture('orb', 12, 12);
    g.destroy();
  }

  /** Lanza perforante 18×6. */
  private makeSpear(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0x67e8f9, 1);
    g.fillTriangle(18, 3, 10, 0, 10, 6);
    g.fillRect(0, 2, 11, 2);
    g.fillStyle(0xffffff, 1);
    g.fillRect(1, 2, 8, 1);
    g.generateTexture('spear', 18, 6);
    g.destroy();
  }

  /** Anillo 64×64 para la Nova (se tiñe en runtime). */
  private makeRing(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.lineStyle(6, 0xffffff, 1);
    g.strokeCircle(32, 32, 26);
    g.generateTexture('ring', 64, 64);
    g.destroy();
  }

  /** Círculo 64×64 para la Hoguera (se tiñe y escala en runtime). */
  private makeZone(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xffffff, 1);
    g.fillCircle(32, 32, 30);
    g.lineStyle(3, 0xffffff, 0.9);
    g.strokeCircle(32, 32, 28);
    g.generateTexture('zone', 64, 64);
    g.destroy();
  }

  /** Proyectil enemigo 8×8 rojo. */
  private makeEshot(): void {
    const g = this.make.graphics({ x: 0, y: 0 }, false);
    g.fillStyle(0xef4444, 1);
    g.fillCircle(4, 4, 4);
    g.fillStyle(0xfca5a5, 1);
    g.fillCircle(4, 4, 1);
    g.generateTexture('eshot', 8, 8);
    g.destroy();
  }
}
