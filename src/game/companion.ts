import * as pc from 'playcanvas';
import { Enemy } from './enemy';
import { createMaterial, createPrimitive, flashEntity } from './visuals';

export type CompanionKind = 'archer' | 'guardian' | 'support';

export const COMPANION_NAMES: Record<CompanionKind, string> = {
  archer: '弦羽',
  guardian: '壁垒',
  support: '星眠'
};

const FOLLOW_OFFSETS: Record<CompanionKind, pc.Vec3> = {
  archer: new pc.Vec3(-2.1, 0, 2.1),
  guardian: new pc.Vec3(1.7, 0, -1.7),
  support: new pc.Vec3(2.2, 0, 2.2)
};

export class Companion {
  readonly entity: pc.Entity;
  readonly name: string;
  private attackTimer = 0;
  private abilityTimer = 2.5;

  constructor(
    app: pc.Application,
    readonly kind: CompanionKind,
    playerPosition: pc.Vec3
  ) {
    this.name = COMPANION_NAMES[kind];
    const material = createMaterial(
      kind === 'archer'
        ? new pc.Color(0.08, 0.42, 0.36)
        : kind === 'guardian'
          ? new pc.Color(0.48, 0.28, 0.08)
          : new pc.Color(0.32, 0.22, 0.56),
      kind === 'support' ? new pc.Color(0.12, 0.05, 0.3) : undefined
    );
    const primitive = kind === 'guardian' ? 'box' : kind === 'archer' ? 'cylinder' : 'sphere';
    const scale = kind === 'guardian'
      ? new pc.Vec3(1.25, 1.65, 1.25)
      : kind === 'archer'
        ? new pc.Vec3(0.85, 1.45, 0.85)
        : new pc.Vec3(0.95, 0.95, 0.95);
    const start = playerPosition.clone().add(FOLLOW_OFFSETS[kind]);
    start.set(start.x, kind === 'support' ? 1.15 : 0.82, start.z);
    this.entity = createPrimitive(app, `companion-${kind}`, primitive, material, start, scale);
  }

  update(
    dt: number,
    playerPosition: pc.Vec3,
    enemies: readonly Enemy[],
    onHeal: (amount: number) => void
  ): void {
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.abilityTimer = Math.max(0, this.abilityTimer - dt);

    const target = this.findNearest(enemies);
    const current = this.entity.getPosition().clone();
    let desired = playerPosition.clone().add(FOLLOW_OFFSETS[this.kind]);

    if (this.kind === 'guardian' && target && target.position.distance(playerPosition) < 5.5) {
      const away = current.clone().sub(target.position);
      away.set(away.x, 0, away.z);
      if (away.lengthSq() < 0.001) away.set(1, 0, 0);
      desired = target.position.clone().add(away.normalize().mulScalar(1.45));
    }

    const movement = desired.sub(current);
    movement.set(movement.x, 0, movement.z);
    const distance = movement.length();
    if (distance > 0.08) {
      const step = Math.min(distance, 6.2 * dt);
      current.add(movement.normalize().mulScalar(step));
    }
    const height = this.kind === 'support' ? 1.15 : 0.82;
    this.entity.setPosition(current.x, height, current.z);

    if (target) {
      const targetPosition = target.position;
      this.entity.lookAt(targetPosition.x, height, targetPosition.z);
      const targetDistance = targetPosition.distance(this.entity.getPosition());
      this.tryAttack(target, targetDistance);
    }

    if (this.kind === 'support' && this.abilityTimer <= 0) {
      this.abilityTimer = 5.2;
      onHeal(7);
      flashEntity(this.entity, new pc.Color(0.7, 0.55, 1), 0.22);
    }
  }

  private tryAttack(target: Enemy, distance: number): void {
    if (this.attackTimer > 0) return;

    if (this.kind === 'archer' && distance <= 10) {
      this.attackTimer = 0.88;
      target.applyHit(13);
      flashEntity(this.entity, new pc.Color(0.2, 1, 0.75), 0.08);
      return;
    }

    if (this.kind === 'guardian' && distance <= 2.45) {
      this.attackTimer = 0.68;
      target.applyHit(10);
      flashEntity(this.entity, new pc.Color(1, 0.55, 0.12), 0.1);
      return;
    }

    if (this.kind === 'support' && distance <= 8) {
      this.attackTimer = 1.35;
      target.applyHit(6);
      flashEntity(this.entity, new pc.Color(0.65, 0.4, 1), 0.1);
    }
  }

  private findNearest(enemies: readonly Enemy[]): Enemy | null {
    let nearest: Enemy | null = null;
    let nearestDistance = Number.POSITIVE_INFINITY;
    const position = this.entity.getPosition();
    for (const enemy of enemies) {
      if (!enemy.alive) continue;
      const distance = enemy.position.distance(position);
      if (distance < nearestDistance) {
        nearest = enemy;
        nearestDistance = distance;
      }
    }
    return nearest;
  }
}
