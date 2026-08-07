import * as pc from 'playcanvas';
import { createChildPrimitive, createMaterial } from './visuals';

interface ArtMaterials {
  iron: pc.StandardMaterial;
  ironLight: pc.StandardMaterial;
  ember: pc.StandardMaterial;
  crimson: pc.StandardMaterial;
  teal: pc.StandardMaterial;
  tealGlow: pc.StandardMaterial;
  violet: pc.StandardMaterial;
  violetGlow: pc.StandardMaterial;
  cloth: pc.StandardMaterial;
  bone: pc.StandardMaterial;
}

/**
 * Temporary V0.3 visual layer.
 *
 * Gameplay entities stay primitive and lightweight, while this director adds a
 * consistent dark-fantasy silhouette on top. When GLB models arrive, this file
 * becomes the replacement seam rather than forcing combat code changes.
 */
export class ArtDirectionDirector {
  private readonly decorated = new WeakSet<pc.Entity>();
  private readonly materials: ArtMaterials;

  constructor(private readonly app: pc.Application) {
    this.materials = {
      iron: createMaterial(new pc.Color(0.055, 0.06, 0.068), undefined, 0.62, 0.48),
      ironLight: createMaterial(new pc.Color(0.13, 0.135, 0.145), undefined, 0.58, 0.54),
      ember: createMaterial(new pc.Color(0.62, 0.17, 0.025), new pc.Color(0.52, 0.055, 0.006), 0.18, 0.44),
      crimson: createMaterial(new pc.Color(0.22, 0.035, 0.028), undefined, 0.04, 0.2),
      teal: createMaterial(new pc.Color(0.055, 0.19, 0.18), undefined, 0.14, 0.34),
      tealGlow: createMaterial(new pc.Color(0.07, 0.42, 0.38), new pc.Color(0.018, 0.22, 0.2), 0.12, 0.42),
      violet: createMaterial(new pc.Color(0.17, 0.09, 0.29), undefined, 0.08, 0.36),
      violetGlow: createMaterial(new pc.Color(0.44, 0.2, 0.72), new pc.Color(0.24, 0.07, 0.52), 0.08, 0.44),
      cloth: createMaterial(new pc.Color(0.12, 0.022, 0.02), undefined, 0.02, 0.18),
      bone: createMaterial(new pc.Color(0.48, 0.42, 0.34), undefined, 0.02, 0.2)
    };

    this.scan();
    this.app.on('update', this.scan, this);
  }

  private scan(): void {
    this.walk(this.app.root);
  }

  private walk(node: pc.Entity): void {
    if (!this.decorated.has(node)) {
      if (node.name === 'player') this.decoratePlayer(node);
      else if (node.name === 'companion-archer') this.decorateArcher(node);
      else if (node.name === 'companion-guardian') this.decorateGuardian(node);
      else if (node.name === 'companion-support') this.decorateOracle(node);
      else if (node.name === 'enemy-melee') this.decorateRaider(node);
      else if (node.name === 'enemy-ranged') this.decorateHunter(node);
      else if (node.name === 'enemy-elite') this.decorateBrute(node);
      else if (node.name === 'enemy-boss') this.decorateBoss(node);
    }

    for (const child of node.children as pc.Entity[]) this.walk(child);
  }

  private mark(entity: pc.Entity): void {
    this.decorated.add(entity);
  }

  private paint(entity: pc.Entity, material: pc.StandardMaterial): void {
    if (entity.model) entity.model.material = material;
  }

  private addCape(parent: pc.Entity, material: pc.StandardMaterial, width: number, height: number, y = 0.15): void {
    createChildPrimitive(parent, 'art-cape', 'box', material, new pc.Vec3(0, y, 0.42), new pc.Vec3(width, height, 0.08), new pc.Vec3(-14, 0, 0));
    createChildPrimitive(parent, 'art-cape-tail-l', 'box', material, new pc.Vec3(-width * 0.24, y - height * 0.52, 0.5), new pc.Vec3(width * 0.33, height * 0.72, 0.055), new pc.Vec3(-20, 0, -7));
    createChildPrimitive(parent, 'art-cape-tail-r', 'box', material, new pc.Vec3(width * 0.24, y - height * 0.48, 0.5), new pc.Vec3(width * 0.3, height * 0.66, 0.055), new pc.Vec3(-18, 0, 8));
  }

  private addShoulders(parent: pc.Entity, scale: number, material: pc.StandardMaterial): void {
    createChildPrimitive(parent, 'art-shoulder-l', 'box', material, new pc.Vec3(-0.56 * scale, 0.47 * scale, 0), new pc.Vec3(0.5 * scale, 0.2 * scale, 0.62 * scale), new pc.Vec3(0, 0, -10));
    createChildPrimitive(parent, 'art-shoulder-r', 'box', material, new pc.Vec3(0.56 * scale, 0.47 * scale, 0), new pc.Vec3(0.5 * scale, 0.2 * scale, 0.62 * scale), new pc.Vec3(0, 0, 10));
  }

  private addHelmet(parent: pc.Entity, scale: number, material: pc.StandardMaterial, glow?: pc.StandardMaterial): void {
    createChildPrimitive(parent, 'art-helmet', 'cone', material, new pc.Vec3(0, 0.98 * scale, 0), new pc.Vec3(0.48 * scale, 0.7 * scale, 0.48 * scale));
    createChildPrimitive(parent, 'art-faceplate', 'box', material, new pc.Vec3(0, 0.86 * scale, -0.29 * scale), new pc.Vec3(0.5 * scale, 0.33 * scale, 0.12 * scale));
    if (glow) {
      createChildPrimitive(parent, 'art-visor', 'box', glow, new pc.Vec3(0, 0.9 * scale, -0.37 * scale), new pc.Vec3(0.34 * scale, 0.055 * scale, 0.025 * scale));
    }
  }

  private addSpear(parent: pc.Entity, length: number, material: pc.StandardMaterial, tip: pc.StandardMaterial): void {
    createChildPrimitive(parent, 'art-spear-shaft', 'cylinder', material, new pc.Vec3(0.73, 0.08, -0.12), new pc.Vec3(0.055, length, 0.055), new pc.Vec3(0, 0, -23));
    createChildPrimitive(parent, 'art-spear-tip', 'cone', tip, new pc.Vec3(1.22, 1.35, -0.12), new pc.Vec3(0.19, 0.58, 0.19), new pc.Vec3(0, 0, -23));
  }

  private decoratePlayer(entity: pc.Entity): void {
    this.mark(entity);
    this.paint(entity, this.materials.iron);
    this.addCape(entity, this.materials.crimson, 0.92, 1.08, 0.12);
    this.addShoulders(entity, 1.0, this.materials.ironLight);
    this.addHelmet(entity, 1.0, this.materials.iron, this.materials.ember);
    createChildPrimitive(entity, 'art-chestplate', 'box', this.materials.ironLight, new pc.Vec3(0, 0.18, -0.45), new pc.Vec3(0.78, 0.78, 0.18));
    createChildPrimitive(entity, 'art-ember-core', 'sphere', this.materials.ember, new pc.Vec3(0, 0.28, -0.59), new pc.Vec3(0.12, 0.12, 0.07));
    createChildPrimitive(entity, 'art-plume-a', 'cone', this.materials.ember, new pc.Vec3(0, 1.62, 0.03), new pc.Vec3(0.19, 0.7, 0.19), new pc.Vec3(7, 0, 0));
    createChildPrimitive(entity, 'art-plume-b', 'cone', this.materials.ember, new pc.Vec3(0.12, 1.82, 0.08), new pc.Vec3(0.11, 0.45, 0.11), new pc.Vec3(16, 0, 10));
    this.addSpear(entity, 1.38, this.materials.ironLight, this.materials.ember);
  }

  private decorateArcher(entity: pc.Entity): void {
    this.mark(entity);
    this.paint(entity, this.materials.teal);
    this.addCape(entity, this.materials.teal, 0.72, 0.92, 0.02);
    createChildPrimitive(entity, 'art-archer-hood', 'cone', this.materials.iron, new pc.Vec3(0, 0.95, 0), new pc.Vec3(0.55, 0.72, 0.55));
    createChildPrimitive(entity, 'art-archer-mask', 'box', this.materials.iron, new pc.Vec3(0, 0.83, -0.3), new pc.Vec3(0.34, 0.28, 0.08));
    createChildPrimitive(entity, 'art-archer-eyes', 'box', this.materials.tealGlow, new pc.Vec3(0, 0.88, -0.36), new pc.Vec3(0.23, 0.04, 0.02));
    createChildPrimitive(entity, 'art-bow-upper', 'cylinder', this.materials.bone, new pc.Vec3(-0.72, 0.46, -0.03), new pc.Vec3(0.045, 0.74, 0.045), new pc.Vec3(0, 0, -28));
    createChildPrimitive(entity, 'art-bow-lower', 'cylinder', this.materials.bone, new pc.Vec3(-0.72, -0.18, -0.03), new pc.Vec3(0.045, 0.74, 0.045), new pc.Vec3(0, 0, 28));
    createChildPrimitive(entity, 'art-quiver', 'cylinder', this.materials.ironLight, new pc.Vec3(0.42, 0.42, 0.38), new pc.Vec3(0.13, 0.72, 0.13), new pc.Vec3(10, 0, -18));
  }

  private decorateGuardian(entity: pc.Entity): void {
    this.mark(entity);
    this.paint(entity, this.materials.iron);
    this.addCape(entity, this.materials.crimson, 0.82, 0.82, 0.04);
    this.addShoulders(entity, 1.12, this.materials.ironLight);
    this.addHelmet(entity, 1.02, this.materials.iron, this.materials.ember);
    createChildPrimitive(entity, 'art-guardian-shield', 'box', this.materials.ironLight, new pc.Vec3(0.77, 0.05, -0.06), new pc.Vec3(0.18, 1.14, 0.88));
    createChildPrimitive(entity, 'art-shield-core', 'sphere', this.materials.ember, new pc.Vec3(0.9, 0.08, -0.08), new pc.Vec3(0.08, 0.18, 0.18));
    createChildPrimitive(entity, 'art-mace-shaft', 'cylinder', this.materials.ironLight, new pc.Vec3(-0.62, 0.02, 0), new pc.Vec3(0.07, 0.72, 0.07), new pc.Vec3(0, 0, 12));
    createChildPrimitive(entity, 'art-mace-head', 'sphere', this.materials.ironLight, new pc.Vec3(-0.78, 0.66, 0), new pc.Vec3(0.28, 0.28, 0.28));
  }

  private decorateOracle(entity: pc.Entity): void {
    this.mark(entity);
    this.paint(entity, this.materials.violet);
    createChildPrimitive(entity, 'art-oracle-robe', 'cone', this.materials.violet, new pc.Vec3(0, -0.18, 0), new pc.Vec3(0.96, 1.18, 0.96));
    createChildPrimitive(entity, 'art-oracle-hood', 'cone', this.materials.iron, new pc.Vec3(0, 0.72, 0), new pc.Vec3(0.58, 0.7, 0.58));
    createChildPrimitive(entity, 'art-oracle-face', 'sphere', this.materials.violetGlow, new pc.Vec3(0, 0.66, -0.22), new pc.Vec3(0.18, 0.18, 0.12));
    createChildPrimitive(entity, 'art-oracle-halo', 'cylinder', this.materials.ironLight, new pc.Vec3(0, 1.1, 0.3), new pc.Vec3(0.9, 0.05, 0.9), new pc.Vec3(90, 0, 0));
    for (let index = 0; index < 4; index += 1) {
      const angle = (index / 4) * Math.PI * 2;
      createChildPrimitive(
        entity,
        `art-oracle-shard-${index}`,
        'cone',
        this.materials.violetGlow,
        new pc.Vec3(Math.cos(angle) * 0.92, 0.18 + (index % 2) * 0.36, Math.sin(angle) * 0.92),
        new pc.Vec3(0.13, 0.42, 0.13),
        new pc.Vec3(index * 13, index * 31, 0)
      );
    }
  }

  private decorateRaider(entity: pc.Entity): void {
    this.mark(entity);
    this.paint(entity, this.materials.iron);
    this.addCape(entity, this.materials.cloth, 0.68, 0.74, -0.02);
    this.addHelmet(entity, 0.9, this.materials.ironLight, this.materials.ember);
    createChildPrimitive(entity, 'art-raider-axe-shaft', 'cylinder', this.materials.bone, new pc.Vec3(0.66, 0.05, 0), new pc.Vec3(0.07, 0.88, 0.07), new pc.Vec3(0, 0, -22));
    createChildPrimitive(entity, 'art-raider-axe-head', 'box', this.materials.ironLight, new pc.Vec3(0.93, 0.72, 0), new pc.Vec3(0.42, 0.18, 0.1), new pc.Vec3(0, 0, -22));
  }

  private decorateHunter(entity: pc.Entity): void {
    this.mark(entity);
    this.paint(entity, this.materials.cloth);
    createChildPrimitive(entity, 'art-hunter-hood', 'cone', this.materials.iron, new pc.Vec3(0, 0.98, 0), new pc.Vec3(0.55, 0.72, 0.55));
    createChildPrimitive(entity, 'art-hunter-crest', 'cone', this.materials.ember, new pc.Vec3(0, 1.52, 0), new pc.Vec3(0.12, 0.52, 0.12));
    createChildPrimitive(entity, 'art-hunter-bow', 'cylinder', this.materials.bone, new pc.Vec3(-0.72, 0.14, -0.02), new pc.Vec3(0.055, 1.1, 0.055), new pc.Vec3(0, 0, -14));
    createChildPrimitive(entity, 'art-hunter-quiver', 'cylinder', this.materials.ironLight, new pc.Vec3(0.5, 0.34, 0.32), new pc.Vec3(0.16, 0.82, 0.16), new pc.Vec3(12, 0, -16));
  }

  private decorateBrute(entity: pc.Entity): void {
    this.mark(entity);
    this.paint(entity, this.materials.iron);
    this.addShoulders(entity, 1.18, this.materials.ironLight);
    this.addHelmet(entity, 1.02, this.materials.iron, this.materials.ember);
    createChildPrimitive(entity, 'art-brute-chest', 'box', this.materials.ironLight, new pc.Vec3(0, 0.1, -0.7), new pc.Vec3(1.05, 0.58, 0.2));
    createChildPrimitive(entity, 'art-brute-core', 'sphere', this.materials.ember, new pc.Vec3(0, 0.12, -0.86), new pc.Vec3(0.17, 0.2, 0.08));
    createChildPrimitive(entity, 'art-brute-weapon', 'cylinder', this.materials.ironLight, new pc.Vec3(0.92, 0.04, 0), new pc.Vec3(0.12, 1.1, 0.12), new pc.Vec3(0, 0, -25));
    createChildPrimitive(entity, 'art-brute-head', 'box', this.materials.ember, new pc.Vec3(1.24, 0.94, 0), new pc.Vec3(0.52, 0.34, 0.26), new pc.Vec3(0, 0, -25));
  }

  private decorateBoss(entity: pc.Entity): void {
    this.mark(entity);
    this.paint(entity, this.materials.iron);
    this.addCape(entity, this.materials.crimson, 1.35, 1.55, 0.0);
    this.addShoulders(entity, 1.3, this.materials.ironLight);
    this.addHelmet(entity, 1.15, this.materials.iron, this.materials.ember);
    createChildPrimitive(entity, 'art-boss-horn-l', 'cone', this.materials.ironLight, new pc.Vec3(-0.62, 1.62, 0.03), new pc.Vec3(0.18, 0.75, 0.18), new pc.Vec3(0, 0, 28));
    createChildPrimitive(entity, 'art-boss-horn-r', 'cone', this.materials.ironLight, new pc.Vec3(0.62, 1.62, 0.03), new pc.Vec3(0.18, 0.75, 0.18), new pc.Vec3(0, 0, -28));
    createChildPrimitive(entity, 'art-boss-core', 'sphere', this.materials.ember, new pc.Vec3(0, 0.22, -0.88), new pc.Vec3(0.24, 0.28, 0.1));
    createChildPrimitive(entity, 'art-boss-staff', 'cylinder', this.materials.ironLight, new pc.Vec3(1.18, 0.04, 0), new pc.Vec3(0.11, 1.45, 0.11), new pc.Vec3(0, 0, -13));
    createChildPrimitive(entity, 'art-boss-mace', 'sphere', this.materials.ember, new pc.Vec3(1.5, 1.37, 0), new pc.Vec3(0.42, 0.42, 0.42));
    createChildPrimitive(entity, 'art-boss-halo', 'cylinder', this.materials.ember, new pc.Vec3(0, 1.18, 0.68), new pc.Vec3(1.2, 0.05, 1.2), new pc.Vec3(90, 0, 0));
  }
}
