import Phaser from 'phaser';
import { GAME } from '../config';
import { characterDef, CHARACTERS } from '../meta/characters';
import { mapDef, MAPS } from '../meta/maps';
import { weaponDef } from '../weapons/defs';
import { loadSettings } from '../meta/settings';
import { audio } from '../audio/player';
import { fadeAndGo } from '../ui';
import { shopCost, shopDef, SHOP } from '../meta/shop';
import { defaultSave, loadSave, persistSave, SaveV1 } from '../meta/save';
import { label, makeButton, panel } from '../ui';

export interface MenuSelection {
  characterId: string;
  mapId: string;
}

/**
 * MenuScene: título, selector de personaje y mapa, tienda permanente y Jugar.
 * Lee/escribe el guardado versionado (localStorage) sin lógica de partida.
 */
export class MenuScene extends Phaser.Scene {
  private charIdx = 0;
  private mapId = 'arena';
  private save: SaveV1 = defaultSave();

  private charSprite!: Phaser.GameObjects.Image;
  private charName!: Phaser.GameObjects.Text;
  private charStats!: Phaser.GameObjects.Text;
  private soulsText!: Phaser.GameObjects.Text;
  private mapCards: Phaser.GameObjects.Rectangle[] = [];
  private shopLevels: Phaser.GameObjects.Text[] = [];
  private shopButtons: ReturnType<typeof makeButton>[] = [];
  private muteKey!: Phaser.Input.Keyboard.Key;

  constructor() {
    super('menu');
  }

  create(): void {
    this.save = loadSave(localStorage);
    const settings = loadSettings(localStorage);
    audio.setVolumes(settings.master, settings.music, settings.sfx);
    this.charIdx = 0;
    this.mapId = 'arena';
    this.mapCards = [];
    this.shopLevels = [];
    this.shopButtons = [];
    this.muteKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.input.once('pointerdown', () => {
      audio.unlock();
      audio.musicStart();
    });
    this.input.keyboard?.once('keydown', () => {
      audio.unlock();
      audio.musicStart();
    });

    this.cameras.main.setBackgroundColor('#0b0e14');
    label(this, GAME.width / 2 - 260, 26, 'SUPERVIVIENTES VS02', 44, '#4ade80').setOrigin(0, 0);
    this.soulsText = label(this, GAME.width - 220, 40, '', 24, '#a5f3fc');
    this.refreshSouls();

    this.buildCharacterBlock();
    this.buildMapBlock();
    this.buildShopBlock();

    makeButton(this, GAME.width / 2, 648, 320, 56, '▶  JUGAR', () => {
      audio.sfx('ui');
      fadeAndGo(this, 'game', {
        characterId: CHARACTERS[this.charIdx].id,
        mapId: this.mapId,
      } as MenuSelection);
    });
    makeButton(this, 180, 648, 220, 56, '?  AYUDA', () => {
      audio.sfx('ui');
      this.helpOverlay.setVisible(true);
    });
    this.makeHelpOverlay();
    this.cameras.main.fadeIn(250);
  }

  override update(): void {
    if (Phaser.Input.Keyboard.JustDown(this.muteKey)) audio.toggleMute();
  }

  private refreshSouls(): void {
    this.soulsText.setText(`◈ ${this.save.souls}`);
  }

  private helpOverlay!: Phaser.GameObjects.Container;

  private makeHelpOverlay(): void {
    const cx = GAME.width / 2;
    const dim = this.add.rectangle(cx, 360, GAME.width, GAME.height, 0x000000, 0.78);
    const bg = this.add.rectangle(cx, 360, 860, 540, 0x111827, 1).setScrollFactor(0);
    bg.setStrokeStyle(3, 0x4ade80, 1);
    const title = this.add
      .text(cx, 130, 'CÓMO JUGAR', { fontSize: '34px', color: '#4ade80', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setScrollFactor(0);
    const body = this.add
      .text(
        cx - 390,
        180,
        [
          'Muévete con WASD / flechas (o joystick en táctil). El arma dispara sola.',
          '',
          'Los enemigos sueltan gemas: recógelas para subir de nivel y elegir',
          '1 de 3 mejoras. Con 3 armas y 3 pasivos como máximo.',
          '',
          'Aguanta las oleadas. A los 3:00 y 6:00 llegan élites; a los 8:00,',
          'el REY DEMONIO. Mátalo para ganar.',
          '',
          'Gasta almas en la tienda: mejoras permanentes para la próxima run.',
          '',
          'Esc/P pausa · M silencia · R reinicia · Mando: stick + start.',
        ].join('\n'),
        { fontSize: '17px', color: '#e5e7eb', lineSpacing: 5, wordWrap: { width: 780 } },
      )
      .setScrollFactor(0);
    const closeBg = this.add.rectangle(cx, 590, 220, 48, 0x2563eb, 1).setScrollFactor(0);
    const closeT = this.add
      .text(cx, 590, 'Cerrar', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5)
      .setScrollFactor(0);
    closeBg.setInteractive({ useHandCursor: true });
    closeBg.on('pointerdown', () => {
      audio.sfx('ui');
      this.helpOverlay.setVisible(false);
    });
    this.helpOverlay = this.add.container(0, 0, [dim, bg, title, body, closeBg, closeT]);
    this.helpOverlay.setScrollFactor(0).setDepth(60).setVisible(false);
  }

  // ---------- Personaje ----------

  private buildCharacterBlock(): void {
    const x = 40;
    panel(this, x, 110, 360, 470);
    label(this, x + 20, 122, 'PERSONAJE', 20, '#9ca3af');
    this.charSprite = this.add
      .image(x + 180, 250, CHARACTERS[0].tex)
      .setScale(4)
      .setScrollFactor(0)
      .setDepth(1);
    this.charName = label(this, x + 20, 330, '', 26, '#f8fafc');
    this.charStats = this.add
      .text(x + 20, 372, '', { fontSize: '17px', color: '#d1d5db', lineSpacing: 6 })
      .setScrollFactor(0)
      .setDepth(1);
    makeButton(this, x + 80, 530, 120, 44, '◀', () => this.stepChar(-1));
    makeButton(this, x + 280, 530, 120, 44, '▶', () => this.stepChar(1));
    this.refreshChar();
  }

  private stepChar(d: number): void {
    audio.sfx('ui');
    this.charIdx = (this.charIdx + d + CHARACTERS.length) % CHARACTERS.length;
    this.refreshChar();
  }

  private refreshChar(): void {
    const c = characterDef(CHARACTERS[this.charIdx].id);
    this.charSprite.setTexture(c.tex);
    this.charName.setText(`${c.name} · ${c.title}`);
    this.charStats.setText(
      [
        `Vida ${c.maxHp}`,
        `Daño ×${c.dmgMul}`,
        `Velocidad ×${c.speedMul}`,
        `Arma: ${weaponDef(c.startWeapon).name}`,
      ].join('\n'),
    );
  }

  // ---------- Mapa ----------

  private buildMapBlock(): void {
    const x = 440;
    panel(this, x, 110, 400, 470);
    label(this, x + 20, 122, 'MAPA', 20, '#9ca3af');
    this.mapCards = [];
    MAPS.forEach((m, i) => {
      const y = 170 + i * 210;
      const bg = this.add
        .rectangle(x + 200, y + 85, 360, 170, 0x1f2937, 1)
        .setScrollFactor(0)
        .setDepth(1);
      bg.setStrokeStyle(3, m.id === this.mapId ? 0x4ade80 : 0x374151, 1);
      bg.setInteractive({ useHandCursor: true });
      bg.on('pointerdown', () => {
        audio.sfx('ui');
        this.mapId = m.id;
        this.refreshMaps();
      });
      label(this, x + 40, y + 18, m.name, 24, '#f8fafc');
      this.add
        .text(x + 40, y + 52, m.desc, { fontSize: '15px', color: '#a5f3fc', wordWrap: { width: 320 } })
        .setScrollFactor(0)
        .setDepth(2);
      this.mapCards.push(bg);
    });
  }

  private refreshMaps(): void {
    MAPS.forEach((m, i) => {
      this.mapCards[i].setStrokeStyle(3, m.id === this.mapId ? 0x4ade80 : 0x374151, 1);
    });
  }

  // ---------- Tienda ----------

  private buildShopBlock(): void {
    const x = 880;
    panel(this, x, 110, 360, 470);
    label(this, x + 20, 122, 'TIENDA (permanente)', 20, '#9ca3af');
    this.shopLevels = [];
    this.shopButtons = [];
    SHOP.forEach((s, i) => {
      const y = 168 + i * 102;
      label(this, x + 20, y, s.name, 20, '#f8fafc');
      this.add
        .text(x + 20, y + 26, s.desc, { fontSize: '14px', color: '#a5f3fc' })
        .setScrollFactor(0)
        .setDepth(2);
      const lvl = this.add
        .text(x + 20, y + 48, '', { fontSize: '14px', color: '#6b7280' })
        .setScrollFactor(0)
        .setDepth(2);
      this.shopLevels.push(lvl);
      const btn = makeButton(this, x + 268, y + 34, 130, 44, '', () => this.buy(s.id));
      this.shopButtons.push(btn);
    });
    this.refreshShop();
  }

  private refreshShop(): void {
    SHOP.forEach((s, i) => {
      const lvl = this.save.shop[s.id] ?? 0;
      this.shopLevels[i].setText(`Nv ${lvl}/${s.maxLevel} ` + '●'.repeat(lvl) + '○'.repeat(s.maxLevel - lvl));
      const btn = this.shopButtons[i];
      if (lvl >= s.maxLevel) {
        btn.setLabel('MAX');
        btn.setEnabled(false);
      } else {
        const cost = shopCost(shopDef(s.id), lvl);
        btn.setLabel(`◈ ${cost}`);
        btn.setEnabled(this.save.souls >= cost);
      }
    });
    this.refreshSouls();
  }

  private buy(id: string): void {
    const def = shopDef(id);
    const lvl = this.save.shop[id] ?? 0;
    if (lvl >= def.maxLevel) return;
    const cost = shopCost(def, lvl);
    if (this.save.souls < cost) {
      this.tweens.add({ targets: this.soulsText, scaleX: 1.25, scaleY: 1.25, duration: 90, yoyo: true, repeat: 1 });
      return;
    }
    this.save.souls -= cost;
    this.save.shop[id] = lvl + 1;
    persistSave(localStorage, this.save);
    audio.sfx('buy');
    this.refreshShop();
  }
}
