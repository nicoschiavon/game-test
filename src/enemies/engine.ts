// Motor de enemigos: oleadas, spawn por especie, steering por kind,
// proyectiles enemigos y patrones del jefe. Dirigido por defs.ts/waves.ts.
// La escena aporta HUD (banner, barra de jefe) y muerte (killEnemy) vía fx.

import Phaser from 'phaser';
import { SPAWNER, WORLD } from '../config';
import { scaledCircle } from '../systems/hitbox';
import { nextSpawnPoint, spawnParams } from '../systems/spawner';
import { EnemyDef, enemyDef, scaleAt } from './defs';
import { mixAt, nextEvents, pickEnemyType } from './waves';

export interface EnemyFx {
  dropGem(x: number, y: number, value: number): void;
  damageNumber(x: number, y: number, amount: number): void;
  burst(x: number, y: number, n: number): void;
  banner(text: string): void;
  hurtPlayer(dmg: number): void;
  onBossDeath(boss: Phaser.Physics.Arcade.Image): void;
  sfx(name: string): void;
}

export interface EnemyCtx {
  player: Phaser.Physics.Arcade.Image;
  elapsed: number;
  dt: number;
  fx: EnemyFx;
  mods: MapModsLike;
}

export interface MapModsLike {
  spawnIntervalMul: number;
  enemyHpMul: number;
}

export class EnemyEngine {
  private scene: Phaser.Scene;
  private enemies: Phaser.Physics.Arcade.Group;
  private eshots: Phaser.Physics.Arcade.Group;
  private spawnAcc = 0;
  private lastT = 0;
  private fired = new Set<number>();
  private fx?: EnemyFx;
  boss: Phaser.Physics.Arcade.Image | null = null;

  constructor(
    scene: Phaser.Scene,
    enemies: Phaser.Physics.Arcade.Group,
    player: Phaser.Physics.Arcade.Image,
  ) {
    this.scene = scene;
    this.enemies = enemies;
    this.eshots = scene.physics.add.group({ maxSize: 64 });
    // NOTA orden de args: con (grupo, sprite) el callback recibe (sprite, hijo).
    // Se registra (player, eshots) y el handler espera (player, shot). Ver World
    // 1971/2115: collideSpriteVsGroup(sprite, group) → callback(sprite, child).
    // Invertirlo deshabilitaría al JUGADOR en vez del proyectil (bug Etapa 5).
    scene.physics.add.overlap(player, this.eshots, (p, s) => this.onEshotHit(p, s), undefined, this);
  }

  reset(): void {
    this.eshots.clear(true, true);
    this.spawnAcc = 0;
    this.lastT = 0;
    this.fired.clear();
    this.boss = null;
    this.fx = undefined;
  }

  bossStatus(): { hp: number; max: number } | null {
    if (!this.boss || !this.boss.active) return null;
    return {
      hp: (this.boss.getData('hp') as number) ?? 0,
      max: (this.boss.getData('maxHp') as number) ?? 1,
    };
  }

  update(ctx: EnemyCtx): void {
    this.fx = ctx.fx;
    this.handleWaves(ctx);
    this.handleTrickle(ctx);
    this.steerAll(ctx);
    this.updateEshots(ctx.dt);
  }

  // ---------- Oleadas ----------

  private view(): { x: number; y: number; w: number; h: number } {
    const cam = this.scene.cameras.main;
    return { x: cam.scrollX, y: cam.scrollY, w: cam.width, h: cam.height };
  }

  private handleWaves(ctx: EnemyCtx): void {
    for (const ev of nextEvents(this.lastT, ctx.elapsed, this.fired)) {
      const v = this.view();
      if (ev.op === 'banner' && ev.text) ctx.fx.banner(ev.text);
      else if (ev.op === 'burst' && ev.enemy) {
        for (let i = 0; i < (ev.count ?? 1); i++) this.spawnAtEdge(ctx, ev.enemy, v);
      } else if (ev.op === 'elite') {
        this.spawnAtEdge(ctx, 'elite', v);
      } else if (ev.op === 'boss') {
        this.spawnBoss(ctx, v);
      }
    }
    this.lastT = ctx.elapsed;
  }

  private handleTrickle(ctx: EnemyCtx): void {
    const sp = spawnParams(ctx.elapsed);
    this.spawnAcc += ctx.dt;
    if (this.spawnAcc < sp.interval * ctx.mods.spawnIntervalMul) return;
    this.spawnAcc = 0;
    if (this.enemies.countActive(true) >= sp.max) return;
    this.spawnAtEdge(ctx, pickEnemyType(mixAt(ctx.elapsed)), this.view());
  }

  spawnAtEdge(
    ctx: EnemyCtx,
    species: string,
    view = this.view(),
  ): Phaser.Physics.Arcade.Image | null {
    const p = nextSpawnPoint(view, WORLD.width, WORLD.height, SPAWNER.margin);
    return this.spawn(ctx, species, p.x, p.y);
  }

  spawn(
    ctx: EnemyCtx,
    species: string,
    x: number,
    y: number,
  ): Phaser.Physics.Arcade.Image | null {
    const def = enemyDef(species);
    const img = this.enemies.get(x, y, def.tex) as Phaser.Physics.Arcade.Image | null;
    if (!img) return null;
    const sc = scaleAt(ctx.elapsed);
    const maxHp = Math.round(def.hp * (def.boss ? 1 : sc.hp) * ctx.mods.enemyHpMul);
    // NOTA pool: Group.get() reutiliza miembros inactivos SIN cambiar su
    // textura — hay que fijarla explícitamente o los enemigos heredan el
    // modelo del ocupante anterior (bug visual Etapa 5).
    img.setTexture(def.tex);
    img.setActive(true).setVisible(true);
    if (img.body) this.scene.physics.world.enable(img);
    img.setScale(def.scale);
    img.setAlpha(1);
    img.clearTint();
    const hb = scaledCircle(def.radius, def.scale, 16);
    img.setCircle(hb.radius, hb.offset, hb.offset);
    img.setData('species', species);
    img.setData('hp', maxHp);
    img.setData('maxHp', maxHp);
    img.setData('dmg', Math.round(def.dmg * (def.boss ? 1 : sc.dmg)));
    img.setData('xp', def.xp);
    img.setData('dying', false);
    img.setData('phase', Math.random() * Math.PI * 2);
    img.setData('orbLast', -1);
    img.setData('zoneLast', -1);
    img.setData('fireAt', ctx.elapsed + 1 + Math.random());
    img.setData('dashAt', ctx.elapsed + 1 + Math.random() * 2);
    img.setData('dashingUntil', -1);
    img.setData('teleUntil', -1);
    img.setData('dashVx', 0);
    img.setData('dashVy', 0);
    img.setData('radialAt', ctx.elapsed + 2);
    img.setData('summonAt', ctx.elapsed + 5);
    img.setData('chargeAt', ctx.elapsed + 4);
    img.setData('chargeUntil', -1);
    img.setDepth(def.boss ? 6 : 5);
    if (def.boss) this.boss = img;
    this.scene.physics.moveToObject(img, ctx.player, def.speed);
    return img;
  }

  private spawnBoss(ctx: EnemyCtx, view: { x: number; y: number; w: number; h: number }): void {
    const p = nextSpawnPoint(view, WORLD.width, WORLD.height, SPAWNER.margin);
    this.spawn(ctx, 'demon', p.x, p.y);
    ctx.fx.sfx('boss');
  }

  /** Muertes especiales: división, recompensas extra, jefe. La escena llama. */
  handleDeath(ctx: EnemyCtx, enemy: Phaser.Physics.Arcade.Image): void {
    const species = (enemy.getData('species') as string) ?? 'slime';
    const x = enemy.x;
    const y = enemy.y;
    if (species === 'ghost') {
      this.spawn(ctx, 'mini', x - 18, y);
      this.spawn(ctx, 'mini', x + 18, y);
    } else if (species === 'elite') {
      for (let i = 0; i < 5; i++) {
        ctx.fx.dropGem(x + (i - 2) * 16, y + (i % 2 === 0 ? -10 : 10), 12);
      }
    } else if (species === 'demon') {
      for (let i = 0; i < 20; i++) {
        const a = (i / 20) * Math.PI * 2;
        ctx.fx.dropGem(x + Math.cos(a) * 40, y + Math.sin(a) * 40, 15);
      }
      if (this.boss === enemy) this.boss = null;
      ctx.fx.onBossDeath(enemy);
    }
  }

  // ---------- Steering por kind ----------

  private steerAll(ctx: EnemyCtx): void {
    const px = ctx.player.x;
    const py = ctx.player.y;
    for (const g of this.enemies.getChildren()) {
      const img = g as Phaser.Physics.Arcade.Image;
      if (!img.active || img.getData('dying')) continue;
      const def = enemyDef((img.getData('species') as string) ?? 'slime');
      switch (def.kind) {
        case 'chaser':
        case 'runner':
        case 'splitter':
        case 'tank':
        case 'mini':
        case 'elite':
          this.scene.physics.moveToObject(img, ctx.player, def.speed);
          this.wobble(ctx, img, def.scale);
          break;
        case 'dasher':
          this.steerDasher(ctx, img, def, px, py);
          break;
        case 'ranged':
          this.steerRanged(ctx, img, def, px, py);
          break;
        case 'boss':
          this.steerBoss(ctx, img, def, px, py);
          break;
      }
    }
  }

  private wobble(ctx: EnemyCtx, img: Phaser.Physics.Arcade.Image, scale: number): void {
    const w = Math.sin(ctx.elapsed * 8 + ((img.getData('phase') as number) ?? 0)) * 0.09;
    img.setScale(scale * (1 - w), scale * (1 + w));
  }

  private steerDasher(
    ctx: EnemyCtx,
    img: Phaser.Physics.Arcade.Image,
    def: EnemyDef,
    px: number,
    py: number,
  ): void {
    const b = def.behavior ?? {};
    if (ctx.elapsed < ((img.getData('dashingUntil') as number) ?? -1)) {
      img.setVelocity((img.getData('dashVx') as number) ?? 0, (img.getData('dashVy') as number) ?? 0);
      return;
    }
    const teleUntil = (img.getData('teleUntil') as number) ?? -1;
    if (teleUntil > 0 && ctx.elapsed < teleUntil) return; // telegrafiado, quieto
    if (teleUntil > 0) {
      // Termina el telegrafiado: embestir hacia el jugador
      const dx = px - img.x;
      const dy = py - img.y;
      const d = Math.hypot(dx, dy) || 1;
      const sp = b.dashSpeed ?? 360;
      img.setData('dashVx', (dx / d) * sp);
      img.setData('dashVy', (dy / d) * sp);
      img.setData('dashingUntil', ctx.elapsed + (b.dashTime ?? 0.5));
      img.setData('dashAt', ctx.elapsed + (b.dashPeriod ?? 2.6));
      img.setData('teleUntil', -1);
      img.clearTint();
      img.setVelocity((img.getData('dashVx') as number) ?? 0, (img.getData('dashVy') as number) ?? 0);
      return;
    }
    if (ctx.elapsed >= ((img.getData('dashAt') as number) ?? 0)) {
      img.setTintFill(0xfde047);
      img.setData('teleUntil', ctx.elapsed + 0.3);
      img.setVelocity(0, 0);
      return;
    }
    // Órbita alrededor del jugador
    const orbitR = b.orbitR ?? 200;
    const phase = (img.getData('phase') as number) ?? 0;
    const tx = px + Math.cos(ctx.elapsed * 0.9 + phase) * orbitR;
    const ty = py + Math.sin(ctx.elapsed * 0.9 + phase) * orbitR;
    const dx = tx - img.x;
    const dy = ty - img.y;
    const d = Math.hypot(dx, dy) || 1;
    img.setVelocity((dx / d) * def.speed, (dy / d) * def.speed);
    this.wobble(ctx, img, def.scale);
  }

  private steerRanged(
    ctx: EnemyCtx,
    img: Phaser.Physics.Arcade.Image,
    def: EnemyDef,
    px: number,
    py: number,
  ): void {
    const b = def.behavior ?? {};
    const keep = b.keepRange ?? 280;
    const dx = px - img.x;
    const dy = py - img.y;
    const d = Math.hypot(dx, dy) || 1;
    if (d > keep + 40) {
      this.scene.physics.moveToObject(img, ctx.player, def.speed);
    } else if (d < keep - 60) {
      img.setVelocity((-dx / d) * def.speed, (-dy / d) * def.speed);
    } else {
      img.setVelocity(0, 0);
    }
    if (ctx.elapsed >= ((img.getData('fireAt') as number) ?? 0) && d < 480) {
      img.setData('fireAt', ctx.elapsed + (b.firePeriod ?? 2.4));
      img.setTintFill(0xffffff);
      ctx.fx.burst(img.x, img.y - 10, 2);
      this.scene.time.delayedCall(150, () => {
        if (img.active) img.clearTint();
      });
      this.fireEshot(img.x, img.y, px, py, b.shotSpeed ?? 210, b.shotDmg ?? 8);
    }
  }

  private steerBoss(
    ctx: EnemyCtx,
    img: Phaser.Physics.Arcade.Image,
    def: EnemyDef,
    px: number,
    py: number,
  ): void {
    if (ctx.elapsed < ((img.getData('chargeUntil') as number) ?? -1)) return;
    if (ctx.elapsed >= ((img.getData('chargeAt') as number) ?? 0)) {
      img.setTintFill(0xef4444);
      img.setVelocity(0, 0);
      const dx = px - img.x;
      const dy = py - img.y;
      const d = Math.hypot(dx, dy) || 1;
      img.setData('dashVx', (dx / d) * 380);
      img.setData('dashVy', (dy / d) * 380);
      img.setData('chargeAt', ctx.elapsed + 7);
      img.setData('chargeUntil', ctx.elapsed + 1.3);
      this.scene.time.delayedCall(400, () => {
        if (!img.active) return;
        img.clearTint();
        img.setVelocity((img.getData('dashVx') as number) ?? 0, (img.getData('dashVy') as number) ?? 0);
        this.scene.time.delayedCall(900, () => {
          if (img.active && img.getData('dying') !== true) img.setVelocity(0, 0);
        });
      });
    } else {
      this.scene.physics.moveToObject(img, ctx.player, def.speed);
    }
    img.setScale(def.scale * (1 + Math.sin(ctx.elapsed * 3) * 0.03));
    if (ctx.elapsed >= ((img.getData('radialAt') as number) ?? 0)) {
      img.setData('radialAt', ctx.elapsed + 3.2);
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2;
        this.fireEshot(
          img.x,
          img.y,
          img.x + Math.cos(a) * 100,
          img.y + Math.sin(a) * 100,
          def.behavior?.shotSpeed ?? 190,
          def.behavior?.shotDmg ?? 12,
        );
      }
      ctx.fx.burst(img.x, img.y, 10);
    }
    if (ctx.elapsed >= ((img.getData('summonAt') as number) ?? 0)) {
      img.setData('summonAt', ctx.elapsed + 9);
      for (let i = 0; i < 4; i++) {
        const a = Math.random() * Math.PI * 2;
        this.spawn(ctx, 'slime', img.x + Math.cos(a) * 70, img.y + Math.sin(a) * 70);
      }
    }
  }

  // ---------- Proyectiles enemigos ----------

  fireEshot(x: number, y: number, tx: number, ty: number, speed: number, dmg: number): void {
    const s = this.eshots.get(x, y, 'eshot') as Phaser.Physics.Arcade.Image | null;
    if (!s) return;
    s.setActive(true).setVisible(true);
    if (s.body) this.scene.physics.world.enable(s);
    s.setScale(2).setDepth(8).setAlpha(1);
    const a = Math.atan2(ty - y, tx - x);
    s.setVelocity(Math.cos(a) * speed, Math.sin(a) * speed);
    s.setData('dmg', dmg);
    s.setData('ttl', 4);
  }

  private updateEshots(dt: number): void {
    for (const g of this.eshots.getChildren()) {
      const img = g as Phaser.Physics.Arcade.Image;
      if (!img.active) continue;
      const ttl = ((img.getData('ttl') as number) ?? 1) - dt;
      img.setData('ttl', ttl);
      if (ttl <= 0 || img.x < 0 || img.y < 0 || img.x > WORLD.width || img.y > WORLD.height) {
        img.disableBody(true, true);
      }
    }
  }

  private onEshotHit(playerObj: object, shotObj: object): void {
    void playerObj;
    const shot = shotObj as Phaser.Physics.Arcade.Image;
    if (!shot.active || !this.fx) return;
    const dmg = (shot.getData('dmg') as number) ?? 8;
    shot.disableBody(true, true);
    this.fx.hurtPlayer(dmg);
  }
}
