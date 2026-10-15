import Phaser from 'phaser';
import {
  GAME,
  GEMS,
  PLAYER,
  SPAWNER_RAMP,
  SPRITES,
  TILES,
  WORLD,
  XP_GEM,
  RunStats,
  baseRunStats,
} from '../config';
import { applyDamage, shouldTakeDamage } from '../systems/combat';
import { scaledCircle } from '../systems/hitbox';
import { formatTime, normalizeMoveVector } from '../systems/movement';
import { spawnParams } from '../systems/spawner';
import { pickDecorFrom, pickGroundFrom, shouldPlaceDecorChance } from '../systems/tiles';
import { buildOffers, emptyLoadout, Loadout, Offer, OwnedPassive } from '../systems/loadout';
import { grantXp, xpForLevel, XpState } from '../systems/xp';
import { PASSIVE_FACTORS, passiveDef, weaponDef } from '../weapons/defs';
import { WeaponEngine, WeaponFx } from '../weapons/engine';
import { EnemyEngine, EnemyFx } from '../enemies/engine';
import { characterDef, CharacterDef } from '../meta/characters';
import { mapDef, MapDef } from '../meta/maps';
import {
  applyMeta,
  defaultSave,
  greedMul,
  loadSave,
  persistSave,
  SaveV1,
  soulsForRun,
} from '../meta/save';
import {
  defaultSettings,
  KeyBinds,
  loadSettings,
  persistSettings,
  Settings,
} from '../meta/settings';
import { audio } from '../audio/player';
import { FakePad, readPad } from '../systems/gamepad';
import { phaserKeyName, prettyKey } from '../systems/keycodes';
import { STICK_RADIUS, stickVector } from '../systems/touch';
import { fadeAndGo } from '../ui';

type GameState = 'playing' | 'dying' | 'gameover' | 'levelup' | 'victory' | 'paused';

const DMG_POOL = 24;

/** Stats vigentes = base(meta) × pasivos de la run. */
function composeStats(passives: OwnedPassive[], base: RunStats): RunStats {  const s = { ...base };
  const lv = (id: string) => passives.find((p) => p.id === id)?.level ?? 0;
  s.dmgMul = base.dmgMul * Math.pow(PASSIVE_FACTORS.fuerza, lv('fuerza'));
  s.rateMul = base.rateMul * Math.pow(PASSIVE_FACTORS.reloj, lv('reloj'));
  s.speedMul = base.speedMul * Math.pow(PASSIVE_FACTORS.botas, lv('botas'));
  s.pickupRadius = base.pickupRadius * Math.pow(PASSIVE_FACTORS.iman, lv('iman'));
  s.maxHp = base.maxHp;
  return s;
}

export class GameScene extends Phaser.Scene {
  private player!: Phaser.Physics.Arcade.Image;
  private enemies!: Phaser.Physics.Arcade.Group;
  private gems!: Phaser.Physics.Arcade.Group;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasd!: Record<'W' | 'A' | 'S' | 'D', Phaser.Input.Keyboard.Key>;
  private keyR!: Phaser.Input.Keyboard.Key;
  private numKeys: Phaser.Input.Keyboard.Key[] = [];

  private engine!: WeaponEngine;
  private weaponFx!: WeaponFx;
  private enemyEngine!: EnemyEngine;
  private enemyFx!: EnemyFx;
  private loadout: Loadout = emptyLoadout();
  private stats: RunStats = baseRunStats();
  private metaBase: RunStats = baseRunStats();
  private xpState: XpState = { level: 1, xp: 0 };
  private pendingLevels = 0;
  private offered: Offer[] = [];
  private kills = 0;
  private runChar: CharacterDef = characterDef('caballero');
  private runMap: MapDef = mapDef('arena');
  private save: SaveV1 = defaultSave();
  private settings: Settings = defaultSettings();
  private soulsGranted = false;
  private soulsEarned = 0;
  private bindKeys!: Record<'up' | 'down' | 'left' | 'right', Phaser.Input.Keyboard.Key>;
  private pauseKey!: Phaser.Input.Keyboard.Key;
  private escKey!: Phaser.Input.Keyboard.Key;
  private muteKey!: Phaser.Input.Keyboard.Key;
  private pauseOverlay!: Phaser.GameObjects.Container;
  private volLabels: Record<'master' | 'music' | 'sfx', Phaser.GameObjects.Text> = {} as Record<
    'master' | 'music' | 'sfx',
    Phaser.GameObjects.Text
  >;
  private remapLabels: Record<keyof KeyBinds, Phaser.GameObjects.Text> = {} as Record<
    keyof KeyBinds,
    Phaser.GameObjects.Text
  >;
  private capturingBind: keyof KeyBinds | null = null;
  private prevPadStart = false;
  private prevPadA = false;
  // Joystick táctil flotante (solo si hay touch)
  private touchId: number | null = null;
  private stickOX = 0;
  private stickOY = 0;
  private stickBase!: Phaser.GameObjects.Image;
  private stickKnob!: Phaser.GameObjects.Image;
  private stickVec = { mx: 0, my: 0 };

  private hp = PLAYER.maxHp;
  private elapsed = 0;
  private spawnAcc = 0;
  private lastDamageAt = -1;
  private state: GameState = 'playing';

  // HUD
  private hpGfx!: Phaser.GameObjects.Graphics;
  private hpLabel!: Phaser.GameObjects.Text;
  private timeText!: Phaser.GameObjects.Text;
  private fpsText?: Phaser.GameObjects.Text;
  private lastHpShown = -1;
  private lastSecShown = -1;
  private lowHpPulsing = false;

  // XP
  private xpGfx!: Phaser.GameObjects.Graphics;
  private xpLabel!: Phaser.GameObjects.Text;
  private lastXpKey = '';

  // FX
  private killFx!: Phaser.GameObjects.Particles.ParticleEmitter;
  private dmgPool: Phaser.GameObjects.Text[] = [];
  private dmgIdx = 0;

  private overlay!: Phaser.GameObjects.Container;
  private overlayTimeText!: Phaser.GameObjects.Text;

  // Overlay de nivel (3 cartas fijas re-etiquetadas por oferta)
  private levelOverlay!: Phaser.GameObjects.Container;
  private levelTitle!: Phaser.GameObjects.Text;
  private cardName: Phaser.GameObjects.Text[] = [];
  private cardDesc: Phaser.GameObjects.Text[] = [];
  private loadoutText!: Phaser.GameObjects.Text;
  private overlaySoulsText!: Phaser.GameObjects.Text;

  // Etapa 5: banner, barra de jefe y victoria
  private bannerText!: Phaser.GameObjects.Text;
  private bossGfx!: Phaser.GameObjects.Graphics;
  private bossLabel!: Phaser.GameObjects.Text;
  private victoryOverlay!: Phaser.GameObjects.Container;
  private victoryStats!: Phaser.GameObjects.Text;

  constructor() {
    super('game');
  }

  init(data: { characterId?: string; mapId?: string }): void {
    this.runChar = characterDef(data.characterId ?? 'caballero');
    this.runMap = mapDef(data.mapId ?? 'arena');
  }

  create(): void {
    this.save = loadSave(localStorage);
    this.settings = loadSettings(localStorage);
    audio.setVolumes(this.settings.master, this.settings.music, this.settings.sfx);
    this.metaBase = applyMeta(baseRunStats(), this.save, this.runChar);
    this.stats = composeStats([], this.metaBase);
    this.loadout = emptyLoadout(this.runChar.startWeapon);
    this.xpState = { level: 1, xp: 0 };
    this.pendingLevels = 0;
    this.offered = [];
    this.kills = 0;
    this.dmgPool = [];
    this.cardName = [];
    this.cardDesc = [];
    this.lastXpKey = '';
    this.lastHpShown = -1;
    this.lastSecShown = -1;
    this.lowHpPulsing = false;
    this.dmgIdx = 0;
    this.soulsGranted = false;
    this.soulsEarned = 0;
    this.resetRunState();
    this.physics.world.setBounds(0, 0, WORLD.width, WORLD.height);
    this.cameras.main.setBounds(0, 0, WORLD.width, WORLD.height);

    this.buildGround(this.runMap);

    // Jugador (sprite del personaje ×3, hitbox equivalente a Etapa 1)
    this.player = this.physics.add.image(WORLD.width / 2, WORLD.height / 2, this.runChar.tex);
    this.player.setScale(SPRITES.player.scale);
    const ph = scaledCircle(PLAYER.radius, SPRITES.player.scale, 16);
    this.player.setCircle(ph.radius, ph.offset, ph.offset);
    this.player.setCollideWorldBounds(true);
    this.player.setDepth(10);

    // Grupos con pooling (tope de rampa + margen para minis/muertes en animación)
    this.enemies = this.physics.add.group({ maxSize: SPAWNER_RAMP.endMax + 40 });
    this.gems = this.physics.add.group({ maxSize: GEMS.maxActive });
    this.engine = new WeaponEngine(this, this.enemies);
    this.enemyEngine = new EnemyEngine(this, this.enemies, this.player);
    this.weaponFx = {
      damageNumber: (x, y, n) => this.spawnDamageNumber(x, y, n),
      burst: (x, y, n) => this.killFx.emitParticleAt(x, y, n),
      killEnemy: (e) => this.killEnemy(e),
      sfx: (n) => audio.sfx(n),
    };
    this.enemyFx = {
      dropGem: (x, y, v) => this.dropGem(x, y, v),
      damageNumber: (x, y, n) => this.spawnDamageNumber(x, y, n),
      burst: (x, y, n) => this.killFx.emitParticleAt(x, y, n),
      banner: (t) => this.showBanner(t),
      hurtPlayer: (d) => this.hurtPlayer(d),
      onBossDeath: () => this.enterVictory(),
      sfx: (n) => audio.sfx(n),
    };

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);

    // Input
    this.cursors = this.input.keyboard!.createCursorKeys();
    const kb = this.input.keyboard!;
    this.wasd = {
      W: kb.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: kb.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: kb.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: kb.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };
    this.keyR = kb.addKey(Phaser.Input.Keyboard.KeyCodes.R);
    this.escKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.ESC);
    this.muteKey = kb.addKey(Phaser.Input.Keyboard.KeyCodes.M);
    this.applyBinds();
    this.numKeys = [
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.ONE),
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.TWO),
      kb.addKey(Phaser.Input.Keyboard.KeyCodes.THREE),
    ];
    this.input.once('pointerdown', () => {
      audio.unlock();
      audio.musicStart();
    });
    kb.once('keydown', () => {
      audio.unlock();
      audio.musicStart();
    });

    // Colisiones (proyectiles/orbes los registra el engine)
    this.physics.add.overlap(this.player, this.enemies, this.onPlayerContact, undefined, this);
    this.setupTouch();

    // FX: 1 emisor reutilizado para muertes + pool de números de daño.
    // maxParticles acota el pool (sin tope crecía con picos de matanza).
    this.killFx = this.add.particles(0, 0, 'spark', {
      speed: { min: 60, max: 190 },
      lifespan: 380,
      scale: { start: 2, end: 0 },
      quantity: 0,
      emitting: false,
      maxParticles: 240,
      tint: [0xbbf7d0, 0x4ade80, 0x16a34a, 0xffffff],
    });
    this.killFx.setDepth(20);
    for (let i = 0; i < DMG_POOL; i++) {
      const t = this.add
        .text(0, 0, '', {
          fontSize: '13px',
          color: '#fde047',
          stroke: '#000000',
          strokeThickness: 3,
          fontStyle: 'bold',
        })
        .setOrigin(0.5)
        .setDepth(50)
        .setActive(false)
        .setVisible(false);
      this.dmgPool.push(t);
    }

    this.makeHud();
    this.makeXpHud();
    this.loadoutText = this.add
      .text(12, GAME.height - 26, '', { fontSize: '13px', color: '#d1d5db', fontStyle: 'bold' })
      .setScrollFactor(0)
      .setDepth(91);
    this.makeGameOverOverlay();
    this.makeLevelupOverlay();
    this.makeVictoryOverlay();
    this.makePauseOverlay();
    this.makeBanner();
    this.makeBossBar();
    this.refreshLoadoutHud();
    if (!this.save.tutorialSeen) {
      this.save.tutorialSeen = true;
      persistSave(localStorage, this.save);
      this.showBanner('WASD / flechas o joystick para moverse · el arma dispara sola · ¡sobrevive!', 5000);
    } else {
      this.showBanner(this.runMap.name);
    }
    this.cameras.main.fadeIn(250);
  }

  override update(_time: number, delta: number): void {
    if (Phaser.Input.Keyboard.JustDown(this.muteKey)) audio.toggleMute();
    const pad = this.readPadState();
    if (Phaser.Input.Keyboard.JustDown(this.escKey) || Phaser.Input.Keyboard.JustDown(this.pauseKey)) {
      if (this.state === 'playing') this.pauseGame();
      else if (this.state === 'paused') this.resumeGame();
    }
    if (pad?.start && !this.prevPadStart && (this.state === 'playing' || this.state === 'paused')) {
      if (this.state === 'playing') this.pauseGame();
      else this.resumeGame();
    }
    if (this.state === 'gameover' || this.state === 'victory') {
      if (this.keyR.isDown) this.restartRun();
      if (pad?.a && !this.prevPadA) this.restartRun();
      this.prevPadA = pad?.a ?? false;
      this.prevPadStart = pad?.start ?? false;
      return;
    }
    if (this.state === 'levelup') {
      this.numKeys.forEach((k, i) => {
        if (Phaser.Input.Keyboard.JustDown(k)) this.chooseUpgrade(i);
      });
      if (pad?.a && !this.prevPadA) this.chooseUpgrade(0);
      this.prevPadA = pad?.a ?? false;
      this.prevPadStart = pad?.start ?? false;
      return;
    }
    if (this.state !== 'playing') {
      this.prevPadA = pad?.a ?? false;
      this.prevPadStart = pad?.start ?? false;
      return; // 'dying' o 'paused': la animación manda / todo congelado
    }
    this.prevPadA = pad?.a ?? false;
    this.prevPadStart = pad?.start ?? false;
    const dt = Math.min(delta / 1000, 0.1);

    this.elapsed += dt;

    // --- Movimiento (diagonal normalizada) + bob procedural ---
    let ix = 0;
    let iy = 0;
    if (this.cursors.left.isDown || this.wasd.A.isDown || this.bindKeys.left.isDown) ix -= 1;
    if (this.cursors.right.isDown || this.wasd.D.isDown || this.bindKeys.right.isDown) ix += 1;
    if (this.cursors.up.isDown || this.wasd.W.isDown || this.bindKeys.up.isDown) iy -= 1;
    if (this.cursors.down.isDown || this.wasd.S.isDown || this.bindKeys.down.isDown) iy += 1;
    if (ix === 0 && iy === 0 && pad) {
      ix = pad.mx;
      iy = pad.my;
    }
    if (ix === 0 && iy === 0 && this.touchId !== null) {
      ix = this.stickVec.mx;
      iy = this.stickVec.my;
    }
    const v = normalizeMoveVector(ix, iy);
    this.player.setVelocity(v.x * PLAYER.speed * this.stats.speedMul, v.y * PLAYER.speed * this.stats.speedMul);
    const S = SPRITES.player.scale;
    if (ix !== 0 || iy !== 0) {
      const b = Math.sin(this.elapsed * 12);
      this.player.setScale(S * (1 - 0.04 * b), S * (1 + 0.05 * b));
      if (ix < 0) this.player.setFlipX(true);
      else if (ix > 0) this.player.setFlipX(false);
    } else {
      this.player.setScale(S, S);
    }

    // --- Enemigos (oleadas + steering por kind, en el engine) ---
    this.enemyEngine.update({
      player: this.player,
      elapsed: this.elapsed,
      dt,
      fx: this.enemyFx,
      mods: this.runMap.mods,
    });

    // --- Armas (engine dirigido por loadout) ---
    this.engine.update(
      { player: this.player, stats: this.stats, elapsed: this.elapsed, dt, fx: this.weaponFx },
      this.loadout,
    );

    this.updateGems();
    this.refreshHud();
    this.refreshBossBar();
  }

  // ---------- Gemas (imán + recogida, sin asignaciones en el bucle) ----------

  private dropGem(x: number, y: number, value: number = XP_GEM.value): void {
    const gem = this.gems.get(x, y, 'gem') as Phaser.Physics.Arcade.Image | null;
    if (!gem) return; // pool lleno: se pierde la gema, nunca excepción
    gem.setActive(true).setVisible(true);
    if (gem.body) this.physics.world.enable(gem);
    gem.setVelocity(0, 0);
    gem.setDepth(4);
    gem.setData('value', value);
  }

  private updateGems(): void {
    const px = this.player.x;
    const py = this.player.y;
    const magnetR = this.stats.pickupRadius;
    const collectR = XP_GEM.collectRadius;
    for (const g of this.gems.getChildren()) {
      const img = g as Phaser.Physics.Arcade.Image;
      if (!img.active) continue;
      const dx = px - img.x;
      const dy = py - img.y;
      const d = Math.sqrt(dx * dx + dy * dy);
      if (d <= collectR) {
        this.gems.killAndHide(img);
        img.body?.stop();
        audio.sfx('gem');
        this.killFx.emitParticleAt(img.x, img.y, 3);
        this.collectXp((img.getData('value') as number) ?? XP_GEM.value);
      } else if (d <= magnetR) {
        const speed = XP_GEM.magnetMinSpeed + (1 - d / magnetR) * 500;
        img.setVelocity((dx / d) * speed, (dy / d) * speed);
      } else {
        img.body?.stop();
      }
    }
  }

  private collectXp(amount: number): void {
    const gained = grantXp(this.xpState, Math.round(amount * this.runMap.mods.xpMul));
    this.refreshXpHud();
    if (gained > 0) {
      this.pendingLevels += gained;
      this.openLevelup();
    }
  }

  // ---------- Suelo ----------

  private buildGround(map: MapDef = mapDef('arena')): void {
    const tw = Math.floor(WORLD.width / TILES.size);
    const th = Math.floor(WORLD.height / TILES.size);
    const tilemap = this.make.tilemap({ tileWidth: TILES.size, tileHeight: TILES.size, width: tw, height: th });
    const ts = tilemap.addTilesetImage('ground', 'tileset', TILES.size, TILES.size, 0, 0);
    if (!ts) throw new Error('[Etapa2] tileset "tileset" no cargado (revisar BootScene)');
    const ground = tilemap.createBlankLayer('ground', ts);
    const decor = tilemap.createBlankLayer('decor', ts);
    if (!ground || !decor) throw new Error('[Etapa2] no se pudieron crear las capas del tilemap');
    for (let y = 0; y < th; y++) {
      for (let x = 0; x < tw; x++) {
        ground.putTileAt(pickGroundFrom(map.ground), x, y);
        if (shouldPlaceDecorChance(map.decorChance)) decor.putTileAt(pickDecorFrom(map.decor), x, y);
      }
    }
    for (let i = 0; i < tw; i++) {
      ground.putTileAt(map.wall, i, 0);
      ground.putTileAt(map.wall, i, th - 1);
      ground.putTileAt(map.wall, 0, i);
      ground.putTileAt(map.wall, tw - 1, i);
    }
    ground.setDepth(-10);
    decor.setDepth(-9);
  }

  // ---------- Colisiones ----------

  private killEnemy(enemy: Phaser.Physics.Arcade.Image): void {
    enemy.setData('dying', true);
    enemy.setVelocity(0, 0);
    if (enemy.body) enemy.body.enable = false;
    this.kills += 1;
    const species = (enemy.getData('species') as string) ?? 'slime';
    audio.sfx('die');
    if (species === 'elite') this.hitStop(50);
    if (species === 'demon') this.hitStop(60);
    this.killFx.emitParticleAt(enemy.x, enemy.y, 12);
    this.dropGem(enemy.x, enemy.y, (enemy.getData('xp') as number) ?? XP_GEM.value);
    this.enemyEngine.handleDeath(
      { player: this.player, elapsed: this.elapsed, dt: 0, fx: this.enemyFx, mods: this.runMap.mods },
      enemy,
    );
    this.tweens.add({
      targets: enemy,
      scaleX: 0.1,
      scaleY: 0.1,
      alpha: 0,
      duration: 180,
      ease: 'Quad.easeIn',
      onComplete: () => {
        this.enemies.killAndHide(enemy);
        enemy.body?.stop();
      },
    });
  }

  private onPlayerContact(playerObj: object, enemyObj: object): void {
    void playerObj;
    const enemy = enemyObj as Phaser.Physics.Arcade.Image;
    if (!enemy.active || enemy.getData('dying')) return;
    this.hurtPlayer((enemy.getData('dmg') as number) ?? 10);
  }

  /** Daño al jugador con i-frames + feedback (contacto y proyectiles). */
  hurtPlayer(dmg: number): void {
    if (this.state !== 'playing') return;
    if (!shouldTakeDamage(this.elapsed, this.lastDamageAt, PLAYER.invulnSeconds)) return;
    this.hp = applyDamage(this.hp, dmg);
    this.lastDamageAt = this.elapsed;
    audio.sfx('hurt');
    // Feedback: tinte + parpadeo + shake leve (sin shake en muertes enemigas)
    this.player.setTintFill(0xef4444);
    this.tweens.killTweensOf(this.player);
    this.player.setAlpha(1);
    this.tweens.add({ targets: this.player, alpha: 0.25, duration: 60, yoyo: true, repeat: 3 });
    this.cameras.main.shake(90, 0.0045);
    this.time.delayedCall(200, () => {
      if (this.scene.isActive()) this.player.clearTint();
    });
    this.refreshHud();
    if (this.hp <= 0) this.beginPlayerDeath();
  }

  private spawnDamageNumber(x: number, y: number, amount: number): void {
    const t = this.dmgPool[this.dmgIdx];
    this.dmgIdx = (this.dmgIdx + 1) % this.dmgPool.length;
    audio.sfx('hit');
    this.tweens.killTweensOf(t);
    t.setText(String(amount)).setPosition(x, y).setAlpha(1).setScale(1);
    t.setActive(true).setVisible(true);
    this.tweens.add({
      targets: t,
      y: y - 28,
      alpha: 0,
      duration: 600,
      ease: 'Cubic.easeOut',
      onComplete: () => t.setActive(false).setVisible(false),
    });
  }

  // ---------- HUD ----------

  private makeHud(): void {
    // Panel vida (izquierda)
    this.add.rectangle(8, 8, 300, 64, 0x000000, 0.5).setOrigin(0, 0).setScrollFactor(0).setDepth(90);
    this.hpLabel = this.add
      .text(20, 11, '', { fontSize: '14px', color: '#e5e7eb', fontStyle: 'bold' })
      .setScrollFactor(0)
      .setDepth(91);
    this.hpGfx = this.add.graphics().setScrollFactor(0).setDepth(91);
    // Panel tiempo (derecha)
    this.add
      .rectangle(GAME.width - 148, 8, 140, 44, 0x000000, 0.5)
      .setOrigin(0, 0)
      .setScrollFactor(0)
      .setDepth(90);
    this.timeText = this.add
      .text(GAME.width - 78, 16, '00:00', { fontSize: '22px', color: '#f8fafc', fontStyle: 'bold' })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(91);
    if (import.meta.env.DEV) {
      this.fpsText = this.add
        .text(GAME.width - 12, GAME.height - 28, '', { fontSize: '12px', color: '#4ade80' })
        .setOrigin(1, 0)
        .setScrollFactor(0)
        .setDepth(91);
    }
    this.lastHpShown = -1;
    this.lastSecShown = -1;
    this.refreshHud(true);
  }

  private refreshHud(force = false): void {
    const hpInt = Math.ceil(this.hp);
    if (force || hpInt !== this.lastHpShown) {
      this.lastHpShown = hpInt;
      const frac = Phaser.Math.Clamp(this.hp / this.stats.maxHp, 0, 1);
      this.hpLabel.setText(`HP ${hpInt}/${this.stats.maxHp}`);
      this.drawHpBar(frac);
      const low = frac <= 0.25 && this.hp > 0;
      if (low && !this.lowHpPulsing) {
        this.lowHpPulsing = true;
        this.tweens.add({ targets: this.hpGfx, alpha: 0.45, duration: 350, yoyo: true, repeat: -1 });
      } else if (!low && this.lowHpPulsing) {
        this.lowHpPulsing = false;
        this.tweens.killTweensOf(this.hpGfx);
        this.hpGfx.setAlpha(1);
      }
    }
    const sec = Math.floor(this.elapsed);
    if (force || sec !== this.lastSecShown) {
      this.lastSecShown = sec;
      this.timeText.setText(formatTime(this.elapsed));
    }
    if (this.fpsText && (force || sec !== this.lastSecShown)) {
      this.fpsText.setText(`${Math.round(this.game.loop.actualFps)} FPS`);
    }
  }

  private drawHpBar(frac: number): void {
    const x = 20;
    const y = 36;
    const w = 240;
    const h = 16;
    const color = frac > 0.5 ? 0x22c55e : frac > 0.25 ? 0xf59e0b : 0xef4444;
    this.hpGfx.clear();
    this.hpGfx.fillStyle(0x111827, 1);
    this.hpGfx.fillRoundedRect(x, y, w, h, 4);
    this.hpGfx.fillStyle(color, 1);
    if (frac > 0) this.hpGfx.fillRoundedRect(x + 2, y + 2, Math.max(4, (w - 4) * frac), h - 4, 3);
    this.hpGfx.lineStyle(2, 0x6b7280, 1);
    this.hpGfx.strokeRoundedRect(x, y, w, h, 4);
  }

  // ---------- HUD XP ----------

  private makeXpHud(): void {
    this.add.rectangle(8, 76, 300, 30, 0x000000, 0.5).setOrigin(0, 0).setScrollFactor(0).setDepth(90);
    this.xpLabel = this.add
      .text(20, 79, '', { fontSize: '12px', color: '#a5f3fc', fontStyle: 'bold' })
      .setScrollFactor(0)
      .setDepth(91);
    this.xpGfx = this.add.graphics().setScrollFactor(0).setDepth(91);
    this.lastXpKey = '';
    this.refreshXpHud();
  }

  private refreshLoadoutHud(): void {
    const w = this.loadout.weapons.map((w) => `${weaponDef(w.id).name} ${w.level}`).join(' · ');
    const p = this.loadout.passives.map((p) => `${passiveDef(p.id).name} ${p.level}`).join(' · ');
    this.loadoutText.setText(p ? `${w}\n${p}` : w);
  }

  private refreshXpHud(): void {
    const key = `${this.xpState.level}:${this.xpState.xp}`;
    if (key === this.lastXpKey) return;
    const leveled = this.lastXpKey !== '' && this.xpState.level > Number(this.lastXpKey.split(':')[0]);
    this.lastXpKey = key;
    const need = xpForLevel(this.xpState.level);
    const frac = Phaser.Math.Clamp(this.xpState.xp / need, 0, 1);
    this.xpLabel.setText(`Nv ${this.xpState.level}   XP ${this.xpState.xp}/${need}`);
    const x = 20;
    const y = 96;
    const w = 276;
    const h = 6;
    this.xpGfx.clear();
    this.xpGfx.fillStyle(0x111827, 1);
    this.xpGfx.fillRoundedRect(x, y, w, h, 3);
    this.xpGfx.fillStyle(0x06b6d4, 1);
    if (frac > 0) this.xpGfx.fillRoundedRect(x, y, Math.max(4, w * frac), h, 3);
    if (leveled) {
      this.tweens.killTweensOf(this.xpLabel);
      this.xpLabel.setScale(1);
      this.tweens.add({ targets: this.xpLabel, scaleX: 1.25, scaleY: 1.25, duration: 120, yoyo: true });
    }
  }

  // ---------- Overlay de nivel ----------
  private makeLevelupOverlay(): void {
    const cx = GAME.width / 2;
    const cy = GAME.height / 2;
    const dim = this.add.rectangle(cx, cy, GAME.width, GAME.height, 0x000000, 0.72);
    this.levelTitle = this.add
      .text(cx, cy - 170, '', { fontSize: '40px', color: '#4ade80', fontStyle: 'bold' })
      .setOrigin(0.5);
    const sub = this.add
      .text(cx, cy - 128, 'Elige 1 mejora  (clic o teclas 1 · 2 · 3)', {
        fontSize: '16px',
        color: '#9ca3af',
      })
      .setOrigin(0.5);
    const parts: Phaser.GameObjects.GameObject[] = [dim, this.levelTitle, sub];
    this.cardName = [];
    this.cardDesc = [];
    const CW = 290;
    const CH = 210;
    for (let i = 0; i < 3; i++) {
      const x = cx + (i - 1) * (CW + 24);
      // NOTA input: los hijos interactivos de un contenedor con scrollFactor(0)
      // necesitan scrollFactor(0) propio — el hit-test usa el del hijo, no el
      // del contenedor (con la cámara desplazada los clics fallarían).
      const bg = this.add.rectangle(x, cy + 20, CW, CH, 0x1f2937, 1).setScrollFactor(0);
      bg.setStrokeStyle(3, 0x4ade80, 1);
      bg.setInteractive({ useHandCursor: true });
      const idx = i;
      bg.on('pointerdown', () => this.chooseUpgrade(idx));
      bg.on('pointerover', () => bg.setFillStyle(0x374151, 1));
      bg.on('pointerout', () => bg.setFillStyle(0x1f2937, 1));
      const key = this.add
        .text(x - CW / 2 + 12, cy + 20 - CH / 2 + 8, `[${i + 1}]`, { fontSize: '14px', color: '#6b7280' })
        .setOrigin(0, 0);
      const name = this.add
        .text(x, cy - 30, '', { fontSize: '24px', color: '#f8fafc', fontStyle: 'bold' })
        .setOrigin(0.5);
      const desc = this.add
        .text(x, cy + 40, '', {
          fontSize: '16px',
          color: '#a5f3fc',
          align: 'center',
          wordWrap: { width: CW - 32 },
        })
        .setOrigin(0.5);
      this.cardName.push(name);
      this.cardDesc.push(desc);
      parts.push(bg, key, name, desc);
    }
    this.levelOverlay = this.add.container(0, 0, parts);
    this.levelOverlay.setScrollFactor(0).setDepth(110).setVisible(false);
  }

  private openLevelup(): void {
    if (this.state !== 'playing') return;
    this.state = 'levelup';
    this.physics.pause();
    audio.sfx('level');
    this.offered = buildOffers(this.loadout);
    this.labelOffers();
    this.levelOverlay.setVisible(true);
  }

  private labelOffers(): void {
    this.levelTitle.setText(`¡NIVEL ${this.xpState.level}!`);
    this.offered.forEach((o, i) => {
      this.cardName[i].setText(o.title);
      this.cardDesc[i].setText(o.desc);
    });
  }

  private chooseUpgrade(i: number): void {
    if (this.state !== 'levelup' || i < 0 || i >= this.offered.length) return;
    this.applyOffer(this.offered[i]);
    this.pendingLevels -= 1;
    this.refreshHud(true);
    this.refreshLoadoutHud();
    if (this.pendingLevels > 0) {
      this.offered = buildOffers(this.loadout);
      this.labelOffers();
    } else {
      this.levelOverlay.setVisible(false);
      this.state = 'playing';
      this.physics.resume();
    }
  }

  private applyOffer(o: Offer): void {
    audio.sfx('ui');
    switch (o.kind) {
      case 'weapon-new':
        if (o.weaponId) this.loadout.weapons.push({ id: o.weaponId, level: 1 });
        break;
      case 'weapon-up': {
        const w = o.weaponId && this.loadout.weapons.find((w) => w.id === o.weaponId);
        if (w) w.level = Math.min(w.level + 1, weaponDef(w.id).maxLevel);
        break;
      }
      case 'passive-new':
        if (o.passiveId) this.loadout.passives.push({ id: o.passiveId, level: 1 });
        break;
      case 'passive-up': {
        const p = o.passiveId && this.loadout.passives.find((p) => p.id === o.passiveId);
        if (p) p.level = Math.min(p.level + 1, passiveDef(p.id).maxLevel);
        break;
      }
      case 'evolve':
        if (o.weaponId && o.evoId) {
          const idx = this.loadout.weapons.findIndex((w) => w.id === o.weaponId);
          if (idx >= 0) this.loadout.weapons[idx] = { id: o.evoId, level: 1 };
          audio.sfx('evolve');
          this.hitStop(40);
        }
        break;
      case 'heal':
        this.hp = Math.min(this.hp + 30, this.stats.maxHp);
        break;
    }
    this.stats = composeStats(this.loadout.passives, this.metaBase);
  }

  // ---------- Etapa 5: banner, barra de jefe, victoria ----------

  private makeBanner(): void {
    this.bannerText = this.add
      .text(GAME.width / 2, 140, '', {
        fontSize: '34px',
        color: '#fbbf24',
        fontStyle: 'bold',
        stroke: '#000000',
        strokeThickness: 5,
      })
      .setOrigin(0.5)
      .setScrollFactor(0)
      .setDepth(105)
      .setAlpha(0);
  }

  showBanner(text: string, holdMs = 1300): void {
    this.tweens.killTweensOf(this.bannerText);
    this.bannerText.setText(text).setAlpha(1);
    this.tweens.add({ targets: this.bannerText, alpha: 0, duration: 1200, delay: holdMs });
  }

  private makeBossBar(): void {
    this.bossLabel = this.add
      .text(GAME.width / 2, 64, 'REY DEMONIO', { fontSize: '15px', color: '#fca5a5', fontStyle: 'bold' })
      .setOrigin(0.5, 0)
      .setScrollFactor(0)
      .setDepth(91)
      .setVisible(false);
    this.bossGfx = this.add.graphics().setScrollFactor(0).setDepth(91).setVisible(false);
  }

  private refreshBossBar(): void {
    const st = this.enemyEngine.bossStatus();
    if (!st) {
      this.bossGfx.setVisible(false);
      this.bossLabel.setVisible(false);
      return;
    }
    this.bossGfx.setVisible(true);
    this.bossLabel.setVisible(true);
    const w = 460;
    const h = 14;
    const x = GAME.width / 2 - w / 2;
    const y = 86;
    const frac = Phaser.Math.Clamp(st.hp / st.max, 0, 1);
    this.bossGfx.clear();
    this.bossGfx.fillStyle(0x111827, 1);
    this.bossGfx.fillRoundedRect(x, y, w, h, 4);
    this.bossGfx.fillStyle(0xdc2626, 1);
    if (frac > 0) this.bossGfx.fillRoundedRect(x + 2, y + 2, Math.max(4, (w - 4) * frac), h - 4, 3);
    this.bossGfx.lineStyle(2, 0x7f1d1d, 1);
    this.bossGfx.strokeRoundedRect(x, y, w, h, 4);
  }

  private makeVictoryOverlay(): void {
    const cx = GAME.width / 2;
    const cy = GAME.height / 2;
    const dim = this.add.rectangle(cx, cy, GAME.width, GAME.height, 0x000000, 0.7);
    const title = this.add
      .text(cx, cy - 70, '¡VICTORIA!', {
        fontSize: '60px',
        color: '#4ade80',
        fontStyle: 'bold',
        stroke: '#052e16',
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    const sub = this.add
      .text(cx, cy - 18, 'El Rey Demonio ha caído', { fontSize: '20px', color: '#f8fafc' })
      .setOrigin(0.5);
    this.victoryStats = this.add
      .text(cx, cy + 26, '', { fontSize: '18px', color: '#a5f3fc', align: 'center' })
      .setOrigin(0.5);
    const hint = this.add
      .text(cx, cy + 76, 'Pulsa R o el botón para jugar otra vez', { fontSize: '16px', color: '#9ca3af' })
      .setOrigin(0.5);
    const btnBg = this.add.rectangle(cx, cy + 128, 230, 54, 0x16a34a, 1).setScrollFactor(0);
    const btnText = this.add
      .text(cx, cy + 128, 'Reiniciar', { fontSize: '22px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5);
    btnBg.setInteractive({ useHandCursor: true });
    btnBg.on('pointerdown', () => this.restartRun());
    btnBg.on('pointerover', () => btnBg.setFillStyle(0x15803d, 1));
    btnBg.on('pointerout', () => btnBg.setFillStyle(0x16a34a, 1));
    const menuBg = this.add.rectangle(cx, cy + 192, 230, 44, 0x374151, 1).setScrollFactor(0);
    const menuText = this.add
      .text(cx, cy + 192, 'Menú', { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5);
    menuBg.setInteractive({ useHandCursor: true });
    menuBg.on('pointerdown', () => fadeAndGo(this, 'menu'));
    void btnText;
    void menuText;
    this.victoryOverlay = this.add.container(0, 0, [dim, title, sub, this.victoryStats, hint, btnBg, btnText, menuBg, menuText]);
    this.victoryOverlay.setScrollFactor(0).setDepth(120).setVisible(false);
  }

  /** Acredita almas una sola vez por partida y persiste. Devuelve las ganadas. */
  private grantSouls(victory: boolean): number {
    if (this.soulsGranted) return this.soulsEarned;
    this.soulsGranted = true;
    this.soulsEarned = soulsForRun(
      { kills: this.kills, level: this.xpState.level, seconds: this.elapsed, victory },
      greedMul(this.save),
    );
    this.save.souls += this.soulsEarned;
    this.save.runs += 1;
    if (victory) this.save.victories += 1;
    this.save.bestTimeSec = Math.max(this.save.bestTimeSec, Math.floor(this.elapsed));
    persistSave(localStorage, this.save);
    return this.soulsEarned;
  }

  private enterVictory(): void {
    if (this.state !== 'playing') return;
    this.state = 'victory';
    this.player.setVelocity(0, 0);
    this.physics.pause();
    audio.sfx('victory');
    const souls = this.grantSouls(true);
    this.victoryStats.setText(
      `Tiempo ${formatTime(this.elapsed)}   ·   Nivel ${this.xpState.level}   ·   ${this.kills} muertes\n+${souls} ◈ almas`,
    );
    this.victoryOverlay.setVisible(true);
  }

  // ---------- Binds, pausa y feel ----------

  /** Joystick flotante en mitad izquierda, solo con touch. No consume UI. */
  private setupTouch(): void {
    this.stickBase = this.add
      .image(0, 0, 'ring')
      .setScale(2)
      .setAlpha(0.4)
      .setDepth(201)
      .setScrollFactor(0)
      .setVisible(false);
    this.stickKnob = this.add
      .image(0, 0, 'spark')
      .setScale(6)
      .setAlpha(0.8)
      .setDepth(202)
      .setScrollFactor(0)
      .setVisible(false);
    if (!('ontouchstart' in window) && navigator.maxTouchPoints <= 0) return;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      if (!p.wasTouch || this.touchId !== null || this.state !== 'playing') return;
      if (p.x > GAME.width / 2) return; // mitad derecha libre para futuros gestos
      this.touchId = p.id;
      this.stickOX = p.x;
      this.stickOY = p.y;
      this.stickVec = { mx: 0, my: 0 };
      this.stickBase.setPosition(p.x, p.y).setVisible(true);
      this.stickKnob.setPosition(p.x, p.y).setVisible(true);
    });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (p.id !== this.touchId || this.state !== 'playing') return;
      this.stickVec = stickVector(this.stickOX, this.stickOY, p.x, p.y);
      const cl = Math.min(Math.hypot(p.x - this.stickOX, p.y - this.stickOY), STICK_RADIUS);
      const d = Math.hypot(p.x - this.stickOX, p.y - this.stickOY) || 1;
      this.stickKnob.setPosition(
        this.stickOX + ((p.x - this.stickOX) / d) * cl,
        this.stickOY + ((p.y - this.stickOY) / d) * cl,
      );
    });
    const release = (p: Phaser.Input.Pointer) => {
      if (p.id !== this.touchId) return;
      this.touchId = null;
      this.stickVec = { mx: 0, my: 0 };
      this.stickBase.setVisible(false);
      this.stickKnob.setVisible(false);
    };
    this.input.on('pointerup', release);
    this.input.on('pointerupoutside', release);
  }

  private releaseStick(): void {
    this.touchId = null;
    this.stickVec = { mx: 0, my: 0 };
    this.stickBase?.setVisible(false);
    this.stickKnob?.setVisible(false);
  }

  private readPadState(): { mx: number; my: number; start: boolean; a: boolean } | null {
    if (typeof navigator === 'undefined' || typeof navigator.getGamepads !== 'function') return null;
    const pads = navigator.getGamepads();
    const raw = pads && pads[0] ? pads[0] : null;
    return readPad(raw as unknown as FakePad | null);
  }

  private applyBinds(): void {
    const kb = this.input.keyboard!;
    const codes = Phaser.Input.Keyboard.KeyCodes as unknown as Record<string, number>;
    const code = (name: string): number => {
      const phaser = phaserKeyName(name);
      return (phaser && codes[phaser]) || codes['I'];
    };
    const b = this.settings.keys;
    this.bindKeys = {
      up: kb.addKey(code(b.up)),
      down: kb.addKey(code(b.down)),
      left: kb.addKey(code(b.left)),
      right: kb.addKey(code(b.right)),
    };
    this.pauseKey = kb.addKey(code(b.pause));
  }

  private pauseGame(): void {
    if (this.state !== 'playing') return;
    this.state = 'paused';
    this.releaseStick();
    this.physics.world.pause();
    this.tweens.paused = true;
    this.time.paused = true;
    this.refreshPauseLabels();
    this.pauseOverlay.setVisible(true);
  }

  private resumeGame(): void {
    if (this.state !== 'paused') return;
    this.capturingBind = null;
    this.state = 'playing';
    this.physics.world.resume();
    this.physics.world.timeScale = 1;
    this.tweens.paused = false;
    this.tweens.timeScale = 1;
    this.time.paused = false;
    this.pauseOverlay.setVisible(false);
  }

  /** Congela el mundo unos ms (élite/jefe/evolución). El timer de run no se toca. */  private hitStop(ms: number): void {
    this.physics.world.timeScale = 0.05;
    this.tweens.timeScale = 0.05;
    this.time.delayedCall(ms, () => {
      if (!this.scene.isActive()) return;
      this.physics.world.timeScale = 1;
      this.tweens.timeScale = 1;
    });
  }

  private makePauseOverlay(): void {
    const cx = GAME.width / 2;
    const parts: Phaser.GameObjects.GameObject[] = [];
    const dim = this.add.rectangle(cx, 360, GAME.width, GAME.height, 0x000000, 0.72);
    parts.push(dim);
    const title = this.add
      .text(cx, 84, 'PAUSA', { fontSize: '44px', color: '#f8fafc', fontStyle: 'bold' })
      .setOrigin(0.5);
    parts.push(title);

    const addRow = (
      y: number,
      name: string,
      get: () => string,
      left: () => void,
      right: () => void,
    ): Phaser.GameObjects.Text => {
      const nameT = this.add
        .text(cx - 330, y, name, { fontSize: '18px', color: '#e5e7eb' })
        .setOrigin(0, 0.5);
      const valT = this.add
        .text(cx + 60, y, '', { fontSize: '18px', color: '#a5f3fc', fontStyle: 'bold' })
        .setOrigin(0.5);
      const bl = this.add.rectangle(cx - 60, y, 52, 34, 0x374151, 1).setScrollFactor(0);
      const blT = this.add
        .text(cx - 60, y, '−', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' })
        .setOrigin(0.5);
      const br = this.add.rectangle(cx + 180, y, 52, 34, 0x374151, 1).setScrollFactor(0);
      const brT = this.add
        .text(cx + 180, y, '+', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' })
        .setOrigin(0.5);
      bl.setInteractive({ useHandCursor: true });
      bl.on('pointerdown', () => {
        left();
        valT.setText(get());
      });
      br.setInteractive({ useHandCursor: true });
      br.on('pointerdown', () => {
        right();
        valT.setText(get());
      });
      valT.setText(get());
      parts.push(nameT, valT, bl, blT, br, brT);
      return valT;
    };

    const vols: { key: 'master' | 'music' | 'sfx'; name: string }[] = [
      { key: 'master', name: 'Volumen' },
      { key: 'music', name: 'Música' },
      { key: 'sfx', name: 'Efectos' },
    ];
    vols.forEach((v, i) => {
      this.volLabels[v.key] = addRow(
        150 + i * 52,
        v.name,
        () => `${this.settings[v.key]}`,
        () => this.bumpVol(v.key, -10),
        () => this.bumpVol(v.key, 10),
      );
    });

    const binds: { key: keyof KeyBinds; name: string }[] = [
      { key: 'up', name: 'Arriba (alt.)' },
      { key: 'down', name: 'Abajo (alt.)' },
      { key: 'left', name: 'Izquierda (alt.)' },
      { key: 'right', name: 'Derecha (alt.)' },
      { key: 'pause', name: 'Pausa (alt.)' },
    ];
    binds.forEach((b, i) => {
      const y = 330 + i * 46;
      const nameT = this.add
        .text(cx - 330, y, b.name, { fontSize: '17px', color: '#e5e7eb' })
        .setOrigin(0, 0.5);
      const keyT = this.add
        .text(cx + 60, y, '', { fontSize: '17px', color: '#a5f3fc', fontStyle: 'bold' })
        .setOrigin(0.5);
      const bg = this.add.rectangle(cx + 60, y, 170, 34, 0x374151, 1).setScrollFactor(0);
      bg.setInteractive({ useHandCursor: true });
      const key = b.key;
      bg.on('pointerdown', () => this.captureBind(key));
      this.remapLabels[key] = keyT;
      parts.push(nameT, bg, keyT);
    });

    const cont = this.add.rectangle(cx, 596, 280, 50, 0x2563eb, 1).setScrollFactor(0);
    const contT = this.add
      .text(cx, 596, 'Continuar', { fontSize: '20px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5);
    cont.setInteractive({ useHandCursor: true });
    cont.on('pointerdown', () => this.resumeGame());
    const menu = this.add.rectangle(cx, 654, 280, 42, 0x374151, 1).setScrollFactor(0);
    const menuT = this.add
      .text(cx, 654, 'Salir al menú', { fontSize: '17px', color: '#ffffff' })
      .setOrigin(0.5);
    menu.setInteractive({ useHandCursor: true });
    menu.on('pointerdown', () => {
      this.resumeGame();
      fadeAndGo(this, 'menu');
    });
    const hint = this.add
      .text(cx, 692, 'Esc alterna pausa · M silencia · Mando: stick + start', {
        fontSize: '13px',
        color: '#6b7280',
      })
      .setOrigin(0.5);
    parts.push(cont, contT, menu, menuT, hint);
    this.pauseOverlay = this.add.container(0, 0, parts);
    this.pauseOverlay.setScrollFactor(0).setDepth(115).setVisible(false);
    this.refreshPauseLabels();
  }

  private bumpVol(which: 'master' | 'music' | 'sfx', d: number): void {
    this.settings[which] = Math.min(100, Math.max(0, this.settings[which] + d));
    persistSettings(localStorage, this.settings);
    audio.setVolumes(this.settings.master, this.settings.music, this.settings.sfx);
    audio.sfx('ui');
    this.refreshPauseLabels();
  }

  private refreshPauseLabels(): void {
    (Object.keys(this.volLabels) as ('master' | 'music' | 'sfx')[]).forEach((k) => {
      this.volLabels[k]?.setText(`${this.settings[k]}`);
    });
    (Object.keys(this.remapLabels) as (keyof KeyBinds)[]).forEach((k) => {
      this.remapLabels[k]?.setText(this.capturingBind === k ? '···' : prettyKey(this.settings.keys[k]));
    });
  }

  private captureBind(which: keyof KeyBinds): void {    this.capturingBind = which;
    this.refreshPauseLabels();
    this.input.keyboard?.once('keydown', (e: KeyboardEvent) => {
      if (this.capturingBind !== which) return;
      if (e.code && e.code !== 'Escape' && phaserKeyName(e.code)) {
        this.settings.keys[which] = e.code;
        persistSettings(localStorage, this.settings);
        this.applyBinds();
      }
      this.capturingBind = null;
      this.refreshPauseLabels();
    });
  }

  // ---------- Game Over ----------

  private makeGameOverOverlay(): void {
    const cx = GAME.width / 2;
    const cy = GAME.height / 2;
    const dim = this.add.rectangle(cx, cy, GAME.width, GAME.height, 0x000000, 0.7);
    const title = this.add
      .text(cx, cy - 60, 'GAME OVER', {
        fontSize: '60px',
        color: '#ef4444',
        fontStyle: 'bold',
        stroke: '#450a0a',
        strokeThickness: 6,
      })
      .setOrigin(0.5);
    this.overlayTimeText = this.add
      .text(cx, cy, 'Sobreviviste 00:00', { fontSize: '22px', color: '#f8fafc' })
      .setOrigin(0.5);
    this.overlaySoulsText = this.add
      .text(cx, cy + 30, '', { fontSize: '18px', color: '#a5f3fc' })
      .setOrigin(0.5);
    const hint = this.add
      .text(cx, cy + 62, 'Pulsa R o el botón para reiniciar', { fontSize: '16px', color: '#9ca3af' })
      .setOrigin(0.5);
    const btnBg = this.add.rectangle(cx, cy + 112, 230, 54, 0x2563eb, 1).setScrollFactor(0);
    const btnText = this.add
      .text(cx, cy + 112, 'Reiniciar', { fontSize: '22px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5);
    btnBg.setInteractive({ useHandCursor: true });
    btnBg.on('pointerdown', () => this.restartRun());
    btnBg.on('pointerover', () => btnBg.setFillStyle(0x1d4ed8, 1));
    btnBg.on('pointerout', () => btnBg.setFillStyle(0x2563eb, 1));
    const menuBg = this.add.rectangle(cx, cy + 172, 230, 44, 0x374151, 1).setScrollFactor(0);
    const menuText = this.add
      .text(cx, cy + 172, 'Menú', { fontSize: '18px', color: '#ffffff', fontStyle: 'bold' })
      .setOrigin(0.5);
    menuBg.setInteractive({ useHandCursor: true });
    menuBg.on('pointerdown', () => fadeAndGo(this, 'menu'));
    void btnText;
    void menuText;
    this.overlay = this.add.container(0, 0, [
      dim,
      title,
      this.overlayTimeText,
      this.overlaySoulsText,
      hint,
      btnBg,
      btnText,
      menuBg,
      menuText,
    ]);
    this.overlay.setScrollFactor(0).setDepth(100).setVisible(false);
  }

  private beginPlayerDeath(): void {
    if (this.state !== 'playing') return;
    this.state = 'dying';
    this.hp = 0;
    this.releaseStick();
    this.refreshHud(true);
    this.player.setVelocity(0, 0);
    this.physics.pause();
    this.tweens.killTweensOf(this.player);
    this.tweens.add({
      targets: this.player,
      angle: 90,
      alpha: 0.4,
      duration: 400,
      ease: 'Quad.easeIn',
      onComplete: () => this.enterGameOver(),
    });
  }

  private enterGameOver(): void {
    if (this.state === 'gameover') return;
    this.state = 'gameover';
    audio.sfx('defeat');
    const souls = this.grantSouls(false);
    this.overlayTimeText.setText(`Sobreviviste ${formatTime(this.elapsed)}`);
    this.overlaySoulsText.setText(`+${souls} ◈ almas`);
    this.overlay.setVisible(true);
  }

  private restartRun(): void {
    this.tweens.killTweensOf(this.player);
    this.tweens.killTweensOf(this.hpGfx);
    for (const t of this.dmgPool) {
      this.tweens.killTweensOf(t);
      t.setActive(false).setVisible(false);
    }
    this.lowHpPulsing = false;
    this.hpGfx.setAlpha(1);
    this.enemies.clear(true, true);
    this.gems.clear(true, true);
    this.engine.reset();
    this.enemyEngine.reset();
    this.loadout = emptyLoadout(this.runChar.startWeapon);
    this.stats = composeStats(this.loadout.passives, this.metaBase);
    this.xpState = { level: 1, xp: 0 };
    this.pendingLevels = 0;
    this.offered = [];
    this.kills = 0;
    this.soulsGranted = false;
    this.soulsEarned = 0;
    this.releaseStick();
    this.levelOverlay.setVisible(false);
    this.victoryOverlay.setVisible(false);
    this.bossGfx.setVisible(false);
    this.bossLabel.setVisible(false);
    this.tweens.killTweensOf(this.bannerText);
    this.bannerText.setAlpha(0);
    this.lastXpKey = '';
    this.resetRunState();
    this.player.setTexture(this.runChar.tex);
    this.player.setPosition(WORLD.width / 2, WORLD.height / 2);
    this.player.setVelocity(0, 0);
    this.player.setAngle(0).setAlpha(1).setScale(SPRITES.player.scale).clearTint().setFlipX(false);
    this.overlay.setVisible(false);
    this.physics.resume();
    this.refreshHud(true);
    this.refreshXpHud();
    this.refreshLoadoutHud();
    this.showBanner(this.runMap.name);
  }

  private resetRunState(): void {
    this.hp = this.stats.maxHp;
    this.elapsed = 0;
    this.spawnAcc = 0;
    this.lastDamageAt = -1;
    this.state = 'playing';
  }
}
