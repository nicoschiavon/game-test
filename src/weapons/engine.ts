// Motor de armas: pools + updaters por kind, dirigido por tablas (defs.ts).
// La escena crea el engine, le pasa loadout + contexto por frame y aplica
// ofertas. Sin números hard-codeados: todo sale de WeaponDef/RunStats.

import Phaser from 'phaser';
import { WORLD, RunStats } from '../config';
import { applyDamage, findNearestEnemyIndex } from '../systems/combat';
import { canTick } from '../systems/tick';
import { Loadout, OwnedWeapon } from '../systems/loadout';
import { WeaponLevel, weaponDef } from './defs';

export interface WeaponFx {
  damageNumber(x: number, y: number, amount: number): void;
  burst(x: number, y: number, n: number): void;
  killEnemy(enemy: Phaser.Physics.Arcade.Image): void;
  sfx(name: string): void;
}

export interface WeaponCtx {
  player: Phaser.Physics.Arcade.Image;
  stats: RunStats;
  elapsed: number;
  dt: number;
  fx: WeaponFx;
}

interface ZoneState {
  dmg: number;
  radius: number;
  tick: number;
  until: number;
  nextTick: number;
}

export class WeaponEngine {
  private scene: Phaser.Scene;
  private enemies: Phaser.Physics.Arcade.Group;
  private bullets: Phaser.Physics.Arcade.Group;
  private spears: Phaser.Physics.Arcade.Group;
  private orbs: Phaser.Physics.Arcade.Group;
  private rings: Phaser.GameObjects.Group;
  private zones: Phaser.Physics.Arcade.Group;
  private timers = new Map<string, number>();
  private orbAngle = new Map<string, number>();
  private orbTick = 0.4;
  private fx?: WeaponFx;
  private now = 0;

  constructor(scene: Phaser.Scene, enemies: Phaser.Physics.Arcade.Group) {
    this.scene = scene;
    this.enemies = enemies;
    this.bullets = scene.physics.add.group({ maxSize: 128 });
    this.spears = scene.physics.add.group({ maxSize: 64 });
    this.orbs = scene.physics.add.group({ maxSize: 8 });
    this.rings = scene.add.group({ maxSize: 3 });
    this.zones = scene.physics.add.group({ maxSize: 4 });
    const hit = (_a: object, _b: object) => this.onShotHit(_a, _b);
    scene.physics.add.overlap(this.bullets, this.enemies, hit, undefined, this);
    scene.physics.add.overlap(this.spears, this.enemies, hit, undefined, this);
    scene.physics.add.overlap(this.orbs, this.enemies, (a, b) => this.onOrbHit(a, b), undefined, this);
  }

  /** Daño efectivo de un nivel con los stats vigentes. */
  static effDmg(lvl: WeaponLevel, stats: RunStats): number {
    return lvl.dmg * stats.dmgMul;
  }

  /** Intervalo efectivo de un nivel con la cadencia vigente. */
  static effInterval(lvl: WeaponLevel, stats: RunStats): number {
    return stats.rateMul > 0 ? lvl.interval / stats.rateMul : lvl.interval;
  }

  update(ctx: WeaponCtx, loadout: Loadout): void {
    this.fx = ctx.fx;
    this.now = ctx.elapsed;
    this.syncOrbs(loadout);
    for (const w of loadout.weapons) {
      const def = weaponDef(w.id);
      const lvl = def.levels[w.level - 1];
      switch (def.kind) {
        case 'bolt':
        case 'pierce':
          this.updateShooter(ctx, w, lvl, def.kind);
          break;
        case 'orbital':
          this.updateOrbital(ctx, w, lvl);
          break;
        case 'nova':
          this.updateNova(ctx, w, lvl);
          break;
        case 'zone':
          this.updateZone(ctx, w, lvl);
          break;
      }
    }
    this.updateProjectiles(ctx, this.bullets);
    this.updateProjectiles(ctx, this.spears);
    this.updateZones(ctx);
  }

  reset(): void {
    this.bullets.clear(true, true);
    this.spears.clear(true, true);
    this.orbs.clear(true, true);
    this.rings.clear(true, true);
    this.zones.clear(true, true);
    this.timers.clear();
    this.orbAngle.clear();
    this.fx = undefined;
  }

  private liveEnemies(): Phaser.Physics.Arcade.Image[] {
    return this.enemies
      .getChildren()
      .filter((g) => (g as Phaser.Physics.Arcade.Image).active && !(g as Phaser.Physics.Arcade.Image).getData('dying')) as Phaser.Physics.Arcade.Image[];
  }

  // ---------- Disparadores (bolt/pierce) ----------

  private updateShooter(ctx: WeaponCtx, w: OwnedWeapon, lvl: WeaponLevel, kind: string): void {
    const acc = (this.timers.get(w.id) ?? 0) + ctx.dt;
    if (acc < WeaponEngine.effInterval(lvl, ctx.stats)) {
      this.timers.set(w.id, acc);
      return;
    }
    this.timers.set(w.id, 0);

    const foes = this.liveEnemies();
    if (foes.length === 0) return;
    const points = foes.map((e) => ({ x: e.x, y: e.y, hp: (e.getData('hp') as number) ?? 1 }));
    const idx = findNearestEnemyIndex(ctx.player.x, ctx.player.y, points, lvl.range ?? 420);
    if (idx === -1) return;
    const target = points[idx];

    const pierce = kind === 'pierce' || lvl.pierce === true;
    const group = pierce ? this.spears : this.bullets;
    const tex = pierce ? 'spear' : 'bullet';
    const base = Math.atan2(target.y - ctx.player.y, target.x - ctx.player.x);
    for (let i = 0; i < lvl.count; i++) {
      const shot = group.get(ctx.player.x, ctx.player.y, tex) as Phaser.Physics.Arcade.Image | null;
      if (!shot) return;
      shot.setActive(true).setVisible(true);
      if (shot.body) this.scene.physics.world.enable(shot);
      shot.setScale(2).setDepth(8).setAlpha(1);
      const angle = base + (i - (lvl.count - 1) / 2) * 0.12;
      const speed = lvl.speed ?? 420;
      shot.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);
      shot.setRotation(angle);
      shot.setData('dmg', WeaponEngine.effDmg(lvl, ctx.stats));
      shot.setData('pierce', pierce);
      shot.setData('hit', []);
      shot.setData('ttl', (lvl.range ?? 420) / speed + 0.6);
    }
    ctx.fx.sfx('shoot');
  }

  private onShotHit(a: object, b: object): void {
    const shot = a as Phaser.Physics.Arcade.Image;
    const enemy = b as Phaser.Physics.Arcade.Image;
    if (!shot.active || !enemy.active || enemy.getData('dying') || !this.fx) return;
    if (shot.getData('pierce') === true) {
      const hit = shot.getData('hit') as Phaser.Physics.Arcade.Image[];
      if (hit.includes(enemy)) return;
      hit.push(enemy);
    }
    const dmg = (shot.getData('dmg') as number) ?? 0;
    const rest = applyDamage((enemy.getData('hp') as number) ?? 1, dmg);
    enemy.setData('hp', rest);
    this.fx.damageNumber(enemy.x, enemy.y - 20, Math.round(dmg));
    if (shot.getData('pierce') !== true) shot.disableBody(true, true);
    if (rest <= 0) this.fx.killEnemy(enemy);
  }

  private updateProjectiles(ctx: WeaponCtx, group: Phaser.Physics.Arcade.Group): void {
    void ctx;
    for (const g of group.getChildren()) {
      const img = g as Phaser.Physics.Arcade.Image;
      if (!img.active) continue;
      const ttl = ((img.getData('ttl') as number) ?? 1) - ctx.dt;
      img.setData('ttl', ttl);
      if (ttl <= 0 || img.x < 0 || img.y < 0 || img.x > WORLD.width || img.y > WORLD.height) {
        img.disableBody(true, true);
      }
    }
  }

  // ---------- Orbitales ----------

  private syncOrbs(loadout: Loadout): void {
    const ids = new Set(
      loadout.weapons.filter((w) => weaponDef(w.id).kind === 'orbital').map((w) => w.id),
    );
    for (const child of [...this.orbs.getChildren()]) {
      const img = child as Phaser.Physics.Arcade.Image;
      if (!ids.has(img.getData('owner') as string)) img.disableBody(true, true);
    }
  }

  private updateOrbital(ctx: WeaponCtx, w: OwnedWeapon, lvl: WeaponLevel): void {
    this.orbTick = lvl.tick ?? 0.4;
    const angle = (this.orbAngle.get(w.id) ?? 0) + (lvl.rotSpeed ?? 2.4) * ctx.dt;
    this.orbAngle.set(w.id, angle);
    const range = lvl.range ?? 100;
    let i = 0;
    for (const child of this.orbs.getChildren()) {
      const img = child as Phaser.Physics.Arcade.Image;
      if ((img.getData('owner') as string) !== w.id || !img.active) continue;
      if (i >= lvl.count) {
        img.disableBody(true, true);
        continue;
      }
      const a = angle + (i / lvl.count) * Math.PI * 2;
      img.setPosition(ctx.player.x + Math.cos(a) * range, ctx.player.y + Math.sin(a) * range);
      i++;
    }
    for (; i < lvl.count; i++) {
      const orb = this.orbs.get(ctx.player.x, ctx.player.y, 'orb') as Phaser.Physics.Arcade.Image | null;
      if (!orb) return;
      orb.setActive(true).setVisible(true);
      if (orb.body) this.scene.physics.world.enable(orb);
      orb.setDepth(8);
      orb.setData('owner', w.id);
      orb.setData('dmg', WeaponEngine.effDmg(lvl, ctx.stats));
    }
  }

  private onOrbHit(a: object, b: object): void {
    const orb = a as Phaser.Physics.Arcade.Image;
    const enemy = b as Phaser.Physics.Arcade.Image;
    if (!orb.active || !enemy.active || enemy.getData('dying') || !this.fx) return;
    if (!canTick((enemy.getData('orbLast') as number) ?? -1, this.now, this.orbTick)) return;
    enemy.setData('orbLast', this.now);
    const dmg = (orb.getData('dmg') as number) ?? 0;
    const rest = applyDamage((enemy.getData('hp') as number) ?? 1, dmg);
    enemy.setData('hp', rest);
    this.fx.damageNumber(enemy.x, enemy.y - 20, Math.round(dmg));
    if (rest <= 0) this.fx.killEnemy(enemy);
  }

  // ---------- Nova ----------

  private updateNova(ctx: WeaponCtx, w: OwnedWeapon, lvl: WeaponLevel): void {
    const acc = (this.timers.get(w.id) ?? 0) + ctx.dt;
    if (acc < WeaponEngine.effInterval(lvl, ctx.stats)) {
      this.timers.set(w.id, acc);
      return;
    }
    this.timers.set(w.id, 0);
    ctx.fx.sfx('shoot');
    const range = lvl.range ?? 120;
    const dmg = WeaponEngine.effDmg(lvl, ctx.stats);
    const r2 = range * range;    for (const e of this.liveEnemies()) {
      const dx = e.x - ctx.player.x;
      const dy = e.y - ctx.player.y;
      if (dx * dx + dy * dy > r2) continue;
      const rest = applyDamage((e.getData('hp') as number) ?? 1, dmg);
      e.setData('hp', rest);
      ctx.fx.damageNumber(e.x, e.y - 20, Math.round(dmg));
      if (rest <= 0) ctx.fx.killEnemy(e);
    }
    ctx.fx.burst(ctx.player.x, ctx.player.y, 6);
    const ring = this.rings.get(ctx.player.x, ctx.player.y, 'ring') as Phaser.GameObjects.Image | null;
    if (ring) {
      ring.setActive(true).setVisible(true).setDepth(9).setAlpha(0.9).setTint(0xfb923c);
      ring.setScale(0.2);
      const target = range / 26;
      this.scene.tweens.add({
        targets: ring,
        scaleX: target,
        scaleY: target,
        alpha: 0,
        duration: 450,
        ease: 'Cubic.easeOut',
        onComplete: () => ring.setActive(false).setVisible(false),
      });
    }
  }

  // ---------- Hoguera (zona persistente) ----------

  private updateZone(ctx: WeaponCtx, w: OwnedWeapon, lvl: WeaponLevel): void {
    const acc = (this.timers.get(w.id) ?? 0) + ctx.dt;
    const mine = this.zones.getChildren().filter((g) => {
      const img = g as Phaser.Physics.Arcade.Image;
      return img.active && (img.getData('owner') as string) === w.id;
    });
    if (acc < WeaponEngine.effInterval(lvl, ctx.stats) || mine.length >= lvl.count) {
      this.timers.set(w.id, acc);
      return;
    }
    this.timers.set(w.id, 0);
    const zone = this.zones.get(ctx.player.x, ctx.player.y, 'zone') as Phaser.Physics.Arcade.Image | null;
    if (!zone) return;
    // Se planta sobre el enemigo vivo más cercano (fallback: el jugador)
    let zx = ctx.player.x;
    let zy = ctx.player.y;
    let best = Infinity;
    for (const e of this.liveEnemies()) {
      const d = (e.x - ctx.player.x) ** 2 + (e.y - ctx.player.y) ** 2;
      if (d < best) {
        best = d;
        zx = e.x;
        zy = e.y;
      }
    }
    zone.setActive(true).setVisible(true);
    zone.setPosition(zx, zy).setDepth(3).setAlpha(0.35).setTint(0xf97316);
    const radius = lvl.range ?? 80;
    zone.setDisplaySize(radius * 2, radius * 2);
    zone.setData('owner', w.id);
    zone.setData('st', {
      dmg: WeaponEngine.effDmg(lvl, ctx.stats),
      radius,
      tick: lvl.tick ?? 0.5,
      until: ctx.elapsed + (lvl.duration ?? 3),
      nextTick: ctx.elapsed,
    } as ZoneState);
    ctx.fx.sfx('shoot');
  }

  private updateZones(ctx: WeaponCtx): void {
    for (const g of this.zones.getChildren()) {
      const img = g as Phaser.Physics.Arcade.Image;
      if (!img.active) continue;
      const st = img.getData('st') as ZoneState | undefined;
      if (!st || ctx.elapsed >= st.until) {
        img.setActive(false).setVisible(false);
        continue;
      }
      if (ctx.elapsed < st.nextTick) continue;
      st.nextTick = ctx.elapsed + st.tick;
      img.setData('st', st);
      const r2 = st.radius * st.radius;
      for (const e of this.liveEnemies()) {
        const dx = e.x - img.x;
        const dy = e.y - img.y;
        if (dx * dx + dy * dy > r2) continue;
        if (!canTick((e.getData('zoneLast') as number) ?? -1, ctx.elapsed, st.tick)) continue;
        e.setData('zoneLast', ctx.elapsed);
        const rest = applyDamage((e.getData('hp') as number) ?? 1, st.dmg);
        e.setData('hp', rest);
        ctx.fx.damageNumber(e.x, e.y - 20, Math.round(st.dmg));
        if (rest <= 0) ctx.fx.killEnemy(e);
      }
    }
  }
}
