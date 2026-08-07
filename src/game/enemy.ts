import * as pc from 'playcanvas';
import { GAME_CONFIG, type EnemyKind } from './config';
import { createChildPrimitive, createMaterial, createPrimitive, flashEntity } from './visuals';

export interface DefeatReward {
  kind: EnemyKind;
  experience: number;
  coins: number;
}

export class Enemy {
  readonly entity: pc.Entity;
  readonly radius: number;
  readonly maxHealth: number;
  health: number;
  alive = true;
  private actionTimer = 0;
  private windupTimer = 0;
  private windingUp = false;
  private readonly strafeSign: number;

  constructor(
    app: pc.Application,
    readonly kind: EnemyKind,
    position: pc.Vec3,
    randomSign: number,
    difficultyScale: number,
    private readonly onDefeated: (reward: DefeatReward) => void,
    private readonly launchProjectile: (position: pc.Vec3, direction: pc.Vec3, amount: number) => void
  ) {
    const config = GAME_CONFIG.enemies[kind];
    const boss = kind === 'boss';
    const elite = kind === 'elite';
    const material = createMaterial(
      boss
        ? new pc.Color(0.16, 0.035, 0.04)
        : elite
          ? new pc.Color(0.42, 0.14, 0.035)
          : kind === 'ranged'
            ? new pc.Color(0.24, 0.11, 0.35)
            : new pc.Color(0.3, 0.075, 0.055),
      boss ? new pc.Color(0.35, 0.015, 0.01) : elite ? new pc.Color(0.2, 0.035, 0.005) : undefined,
      boss || elite ? 0.34 : 0.12,
      boss ? 0.62 : 0.42
    );

    this.radius = config.radius;
    this.maxHealth = Math.round(config.health * difficultyScale);
    this.health = this.maxHealth;
    this.strafeSign = randomSign >= 0 ? 1 : -1;

    const scale = boss
      ? new pc.Vec3(2.15, 2.8, 2.15)
      : elite
        ? new pc.Vec3(1.62, 2.05, 1.62)
        : kind === 'ranged'
          ? new pc.Vec3(0.92, 1.45, 0.92)
          : new pc.Vec3(1.0, 1.42, 1.0);
    const primitive = boss || elite ? 'box' : kind === 'ranged' ? 'cylinder' : 'capsule';
    this.entity = createPrimitive(app, `enemy-${kind}`, primitive, material, position, scale);
    this.decorate();
  }

  get position(): pc.Vec3 {
    return this.entity.getPosition().clone();
  }

  update(
    dt: number,
    target: pc.Vec3,
    onContact: (amount: number) => void,
    resolvePosition: (position: pc.Vec3, radius: number) => pc.Vec3,
    allowAttack = true
  ): void {
    if (!this.alive) return;
    this.actionTimer = Math.max(0, this.actionTimer - dt);
    const config = GAME_CONFIG.enemies[this.kind];
    const position = this.entity.getPosition().clone();
    const direction = target.clone().sub(position);
    const distance = direction.length();
    if (distance > 0.001) direction.normalize();

    if (this.windingUp) {
      this.windupTimer = Math.max(0, this.windupTimer - dt);
      if (this.windupTimer <= 0) {
        this.windingUp = false;
        this.actionTimer = config.attackCooldown;
        const freshDirection = target.clone().sub(position);
        const freshDistance = freshDirection.length();
        if (freshDistance > 0.001) freshDirection.normalize();
        if (this.kind === 'ranged') {
          if (freshDistance <= config.attackDistance + 0.8) {
            this.launchProjectile(position.clone().add(new pc.Vec3(0, 0.72, 0)), freshDirection, config.damage);
          }
        } else if (freshDistance <= config.attackDistance + 0.48) {
          onContact(config.damage);
        }
      }
      this.faceTarget(target);
      return;
    }

    if (this.kind === 'ranged') {
      if (distance > 6.8) position.add(direction.clone().mulScalar(config.speed * dt));
      if (distance < 4.4) position.sub(direction.clone().mulScalar((config.speed + 0.35) * dt));
      position.add(new pc.Vec3(-direction.z, 0, direction.x).mulScalar(this.strafeSign * 0.8 * dt));
      if (allowAttack && distance < config.attackDistance && this.actionTimer <= 0) this.beginWindup(config.windup);
    } else {
      if (distance > config.attackDistance) position.add(direction.clone().mulScalar(config.speed * dt));
      if (allowAttack && distance <= config.attackDistance && this.actionTimer <= 0) this.beginWindup(config.windup);
    }

    const resolved = resolvePosition(position, this.radius);
    const height = this.kind === 'boss' ? 1.5 : this.kind === 'elite' ? 1.08 : 0.82;
    this.entity.setPosition(resolved.x, height, resolved.z);
    this.faceTarget(target);
  }

  applyHit(amount: number): void {
    if (!this.alive) return;
    this.health -= amount;
    flashEntity(this.entity, new pc.Color(1, 0.62, 0.16));
    if (this.health > 0) return;

    this.alive = false;
    this.entity.destroy();
    const config = GAME_CONFIG.enemies[this.kind];
    this.onDefeated({ kind: this.kind, experience: config.experience, coins: config.coins });
  }

  private beginWindup(duration: number): void {
    this.windingUp = true;
    this.windupTimer = duration;
    const warning = this.kind === 'ranged'
      ? new pc.Color(0.72, 0.32, 1)
      : this.kind === 'boss'
        ? new pc.Color(1, 0.12, 0.02)
        : new pc.Color(1, 0.52, 0.08);
    flashEntity(this.entity, warning, duration);
  }

  private faceTarget(target: pc.Vec3): void {
    const height = this.kind === 'boss' ? 1.5 : this.kind === 'elite' ? 1.08 : 0.82;
    this.entity.lookAt(target.x, height, target.z);
  }

  private decorate(): void {
    const iron = createMaterial(new pc.Color(0.12, 0.12, 0.13), undefined, 0.62, 0.5);
    const bone = createMaterial(new pc.Color(0.6, 0.5, 0.39), undefined, 0.02, 0.2);
    const ember = createMaterial(new pc.Color(0.7, 0.2, 0.035), new pc.Color(0.55, 0.07, 0.01));

    if (this.kind === 'melee') {
      createChildPrimitive(this.entity, 'melee-head', 'sphere', bone, new pc.Vec3(0, 0.82, 0), new pc.Vec3(0.54, 0.5, 0.54));
      createChildPrimitive(this.entity, 'melee-helm', 'box', iron, new pc.Vec3(0, 1.0, 0), new pc.Vec3(0.65, 0.18, 0.7));
      createChildPrimitive(this.entity, 'melee-blade', 'box', iron, new pc.Vec3(0.78, 0.04, -0.25), new pc.Vec3(0.13, 1.15, 0.18), new pc.Vec3(16, 0, -24));
      return;
    }

    if (this.kind === 'ranged') {
      createChildPrimitive(this.entity, 'ranged-hood', 'cone', iron, new pc.Vec3(0, 0.95, 0), new pc.Vec3(0.72, 0.72, 0.72));
      createChildPrimitive(this.entity, 'ranged-focus', 'sphere', ember, new pc.Vec3(0, 0.3, -0.58), new pc.Vec3(0.22, 0.22, 0.22));
      createChildPrimitive(this.entity, 'ranged-staff', 'cylinder', bone, new pc.Vec3(-0.7, 0.12, 0), new pc.Vec3(0.12, 1.45, 0.12), new pc.Vec3(0, 0, -10));
      return;
    }

    const headScale = this.kind === 'boss' ? 0.68 : 0.55;
    createChildPrimitive(this.entity, `${this.kind}-head`, 'sphere', bone, new pc.Vec3(0, 0.9, 0), new pc.Vec3(headScale, headScale, headScale));
    createChildPrimitive(this.entity, `${this.kind}-chest`, 'box', iron, new pc.Vec3(0, 0.1, -0.62), new pc.Vec3(0.9, 0.52, 0.18));
    const hornY = this.kind === 'boss' ? 1.42 : 1.25;
    const hornScale = this.kind === 'boss' ? 0.48 : 0.35;
    createChildPrimitive(this.entity, `${this.kind}-horn-l`, 'cone', ember, new pc.Vec3(-0.48, hornY, 0), new pc.Vec3(hornScale, 0.78, hornScale), new pc.Vec3(0, 0, 24));
    createChildPrimitive(this.entity, `${this.kind}-horn-r`, 'cone', ember, new pc.Vec3(0.48, hornY, 0), new pc.Vec3(hornScale, 0.78, hornScale), new pc.Vec3(0, 0, -24));
  }
}
