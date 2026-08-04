import * as pc from 'playcanvas';
import { createMaterial, createPrimitive, flashEntity } from './visuals';

export type EnemyKind = 'melee' | 'ranged' | 'boss';

export class Enemy {
  readonly entity: pc.Entity;
  readonly radius: number;
  health: number;
  alive = true;
  private actionTimer = 0;
  private readonly strafeSign = Math.random() > 0.5 ? 1 : -1;

  constructor(
    app: pc.Application,
    readonly kind: EnemyKind,
    position: pc.Vec3,
    private readonly onDefeated: () => void,
    private readonly launchProjectile: (position: pc.Vec3, direction: pc.Vec3, amount: number) => void
  ) {
    const boss = kind === 'boss';
    const material = createMaterial(
      boss ? new pc.Color(0.18, 0.04, 0.04) : kind === 'ranged' ? new pc.Color(0.33, 0.12, 0.42) : new pc.Color(0.35, 0.09, 0.06),
      boss ? new pc.Color(0.5, 0.02, 0.01) : undefined
    );
    this.radius = boss ? 1.35 : 0.7;
    this.health = boss ? 620 : kind === 'ranged' ? 62 : 76;
    const scale = boss ? new pc.Vec3(2.3, 3.2, 2.3) : kind === 'ranged' ? new pc.Vec3(1.1, 1.7, 1.1) : new pc.Vec3(1.2, 1.6, 1.2);
    this.entity = createPrimitive(app, `enemy-${kind}`, boss ? 'box' : kind === 'ranged' ? 'cylinder' : 'capsule', material, position, scale);
  }

  get position(): pc.Vec3 {
    return this.entity.getPosition().clone();
  }

  update(dt: number, target: pc.Vec3, onContact: (amount: number) => void): void {
    if (!this.alive) return;
    this.actionTimer = Math.max(0, this.actionTimer - dt);
    const position = this.entity.getPosition();
    const direction = target.clone().sub(position);
    const distance = direction.length();
    if (distance > 0.001) direction.normalize();

    if (this.kind === 'ranged') {
      if (distance > 6.5) position.add(direction.clone().mulScalar(2.4 * dt));
      if (distance < 4.2) position.sub(direction.clone().mulScalar(2.8 * dt));
      position.add(new pc.Vec3(-direction.z, 0, direction.x).mulScalar(this.strafeSign * 1.2 * dt));
      if (distance < 9 && this.actionTimer <= 0) {
        this.actionTimer = 1.55;
        this.launchProjectile(position.clone().add(new pc.Vec3(0, 0.7, 0)), direction.clone(), 12);
      }
    } else {
      const speed = this.kind === 'boss' ? 2.2 : 2.9;
      const actionDistance = this.kind === 'boss' ? 2.2 : 1.35;
      if (distance > actionDistance) position.add(direction.clone().mulScalar(speed * dt));
      if (distance <= actionDistance && this.actionTimer <= 0) {
        this.actionTimer = this.kind === 'boss' ? 1.05 : 1.2;
        onContact(this.kind === 'boss' ? 22 : 14);
      }
    }

    this.entity.setPosition(position.x, this.kind === 'boss' ? 1.6 : 0.85, position.z);
    if (distance > 0.1) this.entity.lookAt(target.x, this.entity.getPosition().y, target.z);
  }

  applyHit(amount: number): void {
    if (!this.alive) return;
    this.health -= amount;
    flashEntity(this.entity, new pc.Color(1, 0.55, 0.12));
    if (this.health <= 0) {
      this.alive = false;
      this.entity.destroy();
      this.onDefeated();
    }
  }
}
