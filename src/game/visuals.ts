import * as pc from 'playcanvas';

export type PrimitiveType = 'box' | 'sphere' | 'capsule' | 'cylinder' | 'cone' | 'plane';

export function createMaterial(
  color: pc.Color,
  emissive?: pc.Color,
  metalness = 0.05,
  gloss = 0.3
): pc.StandardMaterial {
  const material = new pc.StandardMaterial();
  material.diffuse = color;
  material.metalness = metalness;
  material.gloss = gloss;
  if (emissive) {
    material.emissive = emissive;
    material.emissiveIntensity = 1.5;
  }
  material.update();
  return material;
}

export function createPrimitive(
  app: pc.Application,
  name: string,
  type: PrimitiveType,
  material: pc.StandardMaterial,
  position: pc.Vec3,
  scale: pc.Vec3
): pc.Entity {
  const entity = new pc.Entity(name);
  entity.addComponent('model', { type });
  if (entity.model) entity.model.material = material;
  entity.setPosition(position);
  entity.setLocalScale(scale);
  app.root.addChild(entity);
  return entity;
}

export function createChildPrimitive(
  parent: pc.Entity,
  name: string,
  type: PrimitiveType,
  material: pc.StandardMaterial,
  position: pc.Vec3,
  scale: pc.Vec3,
  euler?: pc.Vec3
): pc.Entity {
  const entity = new pc.Entity(name);
  entity.addComponent('model', { type });
  if (entity.model) entity.model.material = material;
  entity.setLocalPosition(position);
  entity.setLocalScale(scale);
  if (euler) entity.setLocalEulerAngles(euler.x, euler.y, euler.z);
  parent.addChild(entity);
  return entity;
}

export function flashEntity(entity: pc.Entity, color: pc.Color, duration = 0.08): void {
  const material = entity.model?.material as pc.StandardMaterial | undefined;
  if (!material) return;
  const previous = material.emissive.clone();
  const previousIntensity = material.emissiveIntensity;
  material.emissive = color;
  material.emissiveIntensity = 2.5;
  material.update();
  window.setTimeout(() => {
    if (!entity.parent) return;
    material.emissive = previous;
    material.emissiveIntensity = previousIntensity;
    material.update();
  }, duration * 1000);
}
