import * as pc from 'playcanvas';

export function createMaterial(color: pc.Color, emissive?: pc.Color): pc.StandardMaterial {
  const material = new pc.StandardMaterial();
  material.diffuse = color;
  material.metalness = 0.05;
  material.gloss = 0.3;
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
  type: 'box' | 'sphere' | 'capsule' | 'cylinder' | 'cone' | 'plane',
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
