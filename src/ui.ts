// Helpers de UI compartidos (menú y overlays) — Phaser puro, sin lógica.
// Los interactivos llevan scrollFactor(0) propio (lección T9 Etapa 3).

import Phaser from 'phaser';

export function panel(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  depth = 0,
): Phaser.GameObjects.Rectangle {
  return scene.add
    .rectangle(x, y, w, h, 0x000000, 0.55)
    .setOrigin(0, 0)
    .setScrollFactor(0)
    .setDepth(depth);
}

export function label(
  scene: Phaser.Scene,
  x: number,
  y: number,
  text: string,
  size: number,
  color = '#f8fafc',
  depth = 1,
): Phaser.GameObjects.Text {
  return scene.add
    .text(x, y, text, { fontSize: `${size}px`, color, fontStyle: 'bold' })
    .setScrollFactor(0)
    .setDepth(depth);
}

export function fadeAndGo(scene: Phaser.Scene, target: string, data?: object): void {
  scene.cameras.main.fadeOut(180);
  scene.cameras.main.once(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    scene.scene.start(target, data);
  });
}

export interface Button {
  bg: Phaser.GameObjects.Rectangle;
  text: Phaser.GameObjects.Text;
  setLabel(s: string): void;
  setEnabled(on: boolean): void;
}

export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  w: number,
  h: number,
  text: string,
  cb: () => void,
  depth = 2,
): Button {
  const bg = scene.add.rectangle(x, y, w, h, 0x2563eb, 1).setScrollFactor(0).setDepth(depth);
  const t = scene.add
    .text(x, y, text, { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' })
    .setOrigin(0.5)
    .setScrollFactor(0)
    .setDepth(depth + 1);
  let enabled = true;
  bg.setInteractive({ useHandCursor: true });
  bg.on('pointerdown', () => {
    if (enabled) cb();
  });
  bg.on('pointerover', () => {
    if (enabled) bg.setFillStyle(0x1d4ed8, 1);
  });
  bg.on('pointerout', () => {
    if (enabled) bg.setFillStyle(0x2563eb, 1);
  });
  return {
    bg,
    text: t,
    setLabel(s: string) {
      t.setText(s);
    },
    setEnabled(on: boolean) {
      enabled = on;
      bg.setFillStyle(on ? 0x2563eb : 0x4b5563, 1);
      bg.disableInteractive();
      if (on) bg.setInteractive({ useHandCursor: true });
    },
  };
}
