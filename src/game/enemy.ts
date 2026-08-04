import * as pc from 'playcanvas';
import { GAME_CONFIG, type EnemyKind } from './config';
import { createMaterial, createPrimitive, flashEntity } from './visuals';

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
        ? new pc.Color(0.18, 0.04, 0.04)
        : elite
          ? new pc.Color(0.48, 0.18, 0.035)
          : kind === 'ranged'
            ? new pc.Color(0.33, 0.12, 0.42)
            : new pc.Color(0.35, 0.09, 0.06),
      boss ? new pc.Color(0.5, 0.02, 0.01) : elite ? new pc.Color(0.35, 0.07, 0.01) : undefined
    );

    this.radius = config.radius;
    this.maxHealth = Math.round(config.health * difficultyScale);
    this.health = this.maxHealth;
    this.strafeSign = randomSign >= 0 ? 1 : -1;

    const scale = boss
      ? new pc.Vec3(2.3, 3.2, 2.3)
      : elite
        ? new pc.Vec3(1.75, 2.25, 1.75)
        : kind === 'ranged'
          ? new pc.Vec3(1.1, 1.7, 1.1)
          : new pc.Vec3(1.2, 1.6, 1.2);
    const primitive = boss || elite ? 'box' : kind === 'ranged' ? 'cylinder' : 'capsule';
    this.entity = createPrimitive(app, `enemy-${kind}`, primitive, material, position, scale);
  }

  get position(): pc.Vec3 {
    return this.entity.getPosition().clone();
  }

  update(dt: number, target: pc.Vec3, onContact: (amount: number) => void): void {
    if (!this.alive) return;
    this.actionTimer = Math.max(0, this.actionTimer - dt);
    const config = GAME_CONFIG.enemies[this.kind];
    const position = this.entity.getPosition().clone();
    const direction = target.clone().sub(position);
    const distance = direction.length();
    if (distance > 0.001) direction.normalize();

    if (this.kind === 'ranged') {
      if (distance > 6.5) position.add(direction.clone().mulScalar(config.speed * dt));
      if (distance < 4.2) position.sub(direction.clone().mulScalar((config.speed + 0.4) * dt));
      position.add(new pc.Vec3(-direction.z, 0, direction.x).mulScalar(this.strafeSign * 1.2 * dt));
      if (distance < config.attackDistance && this.actionTimer <= 0) {
        this.actionTimer = config.attackCooldown;
        this.launchProjectile(position.clone().add(new pc.Vec3(0, 0.7, 0)), direction.clone(), config.damage);
      }
    } else {
      if (distance > config.attackDistance) position.add(direction.clone().mulScalar(config.speed * dt));
      if (distance <= config.attackDistance && this.actionTimer <= 0) {
        this.actionTimer = config.attackCooldown;
        onContact(config.damage);
      }
    }

    const height = this.kind === 'boss' ? 1.6 : this.kind === 'elite' ? 1.12 : 0.85;
    this.entity.setPosition(position.x, height, position.z);
    if (distance > 0.1) this.entity.lookAt(target.x, height, target.z);
  }

  applyHit(amount: number): void {
    if (!this.alive) return;
    this.health -= amount;
    flashEntity(this.entity, new pc.Color(1, 0.55, 0.12));
    if (this.health > 0) return;

    this.alive = false;
    this.entity.destroy();
    const config = GAME_CONFIG.enemies[this.kind];
    this.onDefeated({ kind: this.kind, experience: config.experience, coins: config.coins });
  }
}
