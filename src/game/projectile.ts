import * as pc from 'playcanvas';
import { createMaterial, createPrimitive } from './visuals';

export class Projectile {
  readonly entity: pc.Entity;
  readonly radius = 0.28;
  alive = true;
  private remainingLife = 4;

  constructor(
    app: pc.Application,
    position: pc.Vec3,
    private readonly direction: pc.Vec3,
    readonly amount: number
  ) {
    const material = createMaterial(new pc.Color(0.18, 0.03, 0.22), new pc.Color(0.65, 0.08, 0.8));
    this.entity = createPrimitive(app, 'enemy-projectile', 'sphere', material, position, new pc.Vec3(0.42, 0.42, 0.42));
  }

  get position(): pc.Vec3 {
    return this.entity.getPosition().clone();
  }

  update(dt: number): void {
    if (!this.alive) return;
    this.remainingLife -= dt;
    const position = this.entity.getPosition().add(this.direction.clone().mulScalar(7.5 * dt));
    this.entity.setPosition(position);
    if (this.remainingLife <= 0) this.destroy();
  }

  destroy(): void {
    if (!this.alive) return;
    this.alive = false;
    this.entity.destroy();
  }
}
