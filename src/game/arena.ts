import * as pc from 'playcanvas';
import { GAME_CONFIG } from './config';
import { createMaterial, createPrimitive } from './visuals';

interface ArenaObstacle {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
}

interface Palette {
  floor: pc.Color;
  stone: pc.Color;
  accent: pc.Color;
  glow: pc.Color;
}

const PALETTES: readonly Palette[] = [
  {
    floor: new pc.Color(0.105, 0.098, 0.092),
    stone: new pc.Color(0.18, 0.165, 0.15),
    accent: new pc.Color(0.28, 0.115, 0.06),
    glow: new pc.Color(0.52, 0.12, 0.02)
  },
  {
    floor: new pc.Color(0.075, 0.087, 0.092),
    stone: new pc.Color(0.16, 0.18, 0.19),
    accent: new pc.Color(0.15, 0.25, 0.26),
    glow: new pc.Color(0.055, 0.2, 0.22)
  },
  {
    floor: new pc.Color(0.078, 0.074, 0.096),
    stone: new pc.Color(0.17, 0.16, 0.205),
    accent: new pc.Color(0.25, 0.2, 0.34),
    glow: new pc.Color(0.22, 0.085, 0.42)
  },
  {
    floor: new pc.Color(0.105, 0.071, 0.055),
    stone: new pc.Color(0.2, 0.13, 0.095),
    accent: new pc.Color(0.35, 0.155, 0.045),
    glow: new pc.Color(0.62, 0.12, 0.015)
  },
  {
    floor: new pc.Color(0.052, 0.055, 0.064),
    stone: new pc.Color(0.105, 0.11, 0.122),
    accent: new pc.Color(0.27, 0.085, 0.045),
    glow: new pc.Color(0.76, 0.09, 0.01)
  }
];

export class ArenaEnvironment {
  private entities: pc.Entity[] = [];
  private obstacles: ArenaObstacle[] = [];

  constructor(private readonly app: pc.Application) {}

  rebuild(stageIndex: number): void {
    this.clear();
    const palette = PALETTES[Math.min(stageIndex, PALETTES.length - 1)] as Palette;
    const floor = createMaterial(palette.floor, undefined, 0.04, 0.18);
    this.track(createPrimitive(
      this.app,
      `stage-floor-${stageIndex}`,
      'box',
      floor,
      new pc.Vec3(0, -0.02, 0),
      new pc.Vec3(21.8, 0.07, 21.8)
    ));
    this.addFloorTiles(stageIndex, palette);

    if (stageIndex === 0) this.buildOuterRing(palette);
    else if (stageIndex === 1) this.buildBrokenCorridor(palette);
    else if (stageIndex === 2) this.buildRelicSanctum(palette);
    else if (stageIndex === 3) this.buildEmberGate(palette);
    else this.buildBossArena(palette);
  }

  resolvePosition(position: pc.Vec3, radius: number): pc.Vec3 {
    const half = GAME_CONFIG.arenaHalfSize - radius;
    position.x = pc.math.clamp(position.x, -half, half);
    position.z = pc.math.clamp(position.z, -half, half);

    for (let pass = 0; pass < 2; pass += 1) {
      for (const obstacle of this.obstacles) {
        const minX = obstacle.minX - radius;
        const maxX = obstacle.maxX + radius;
        const minZ = obstacle.minZ - radius;
        const maxZ = obstacle.maxZ + radius;
        if (position.x <= minX || position.x >= maxX || position.z <= minZ || position.z >= maxZ) continue;

        const toLeft = Math.abs(position.x - minX);
        const toRight = Math.abs(maxX - position.x);
        const toTop = Math.abs(position.z - minZ);
        const toBottom = Math.abs(maxZ - position.z);
        const nearest = Math.min(toLeft, toRight, toTop, toBottom);
        if (nearest === toLeft) position.x = minX;
        else if (nearest === toRight) position.x = maxX;
        else if (nearest === toTop) position.z = minZ;
        else position.z = maxZ;
      }
    }
    return position;
  }

  private buildOuterRing(palette: Palette): void {
    this.addWall('outer-nw', -6.7, -4.4, 4.0, 0.7, 1.35, palette, 1);
    this.addWall('outer-se', 6.8, 4.1, 3.8, 0.7, 1.2, palette, 2);
    this.addWall('outer-ne', 7.2, -6.0, 0.7, 3.6, 1.0, palette, 3);
    this.addWall('outer-sw', -7.1, 6.2, 0.7, 3.0, 1.0, palette, 4);
    this.addTorch(-8.8, -8.2, palette);
    this.addTorch(8.5, 7.8, palette);
    this.addRubble(-3.8, 7.7, palette, 0);
    this.addRubble(4.6, -7.8, palette, 1);
    this.addShrub(-8.7, 3.9, palette, 0);
    this.addShrub(8.5, -2.8, palette, 1);
    this.addBanner(-5.0, -7.9, 8, palette);
    this.addBanner(5.5, 7.7, -16, palette);
  }

  private buildBrokenCorridor(palette: Palette): void {
    this.addWall('corridor-left-a', -5.6, -4.4, 5.2, 0.75, 1.65, palette, 5);
    this.addWall('corridor-right-a', 4.7, -0.8, 5.0, 0.75, 1.45, palette, 6);
    this.addWall('corridor-left-b', -4.6, 3.2, 4.6, 0.75, 1.25, palette, 7);
    this.addWall('corridor-right-b', 6.2, 6.0, 3.1, 0.75, 1.1, palette, 8);
    this.addPillar(-8.4, -0.2, palette, true);
    this.addPillar(8.3, 2.5, palette, true);
    this.addTorch(-8.8, -7.8, palette);
    this.addTorch(8.8, 7.8, palette);
    this.addRubble(0.2, -7.6, palette, 2);
    this.addBarricade(-0.5, 5.7, 11, palette);
    this.addBarricade(1.2, -3.3, -24, palette);
    this.addShrub(-8.6, 7.2, palette, 2);
  }

  private buildRelicSanctum(palette: Palette): void {
    const altarStone = createMaterial(palette.stone, undefined, 0.12, 0.32);
    const altarGlow = createMaterial(palette.accent, palette.glow, 0.18, 0.5);
    this.track(createPrimitive(this.app, 'sanctum-dais-low', 'cylinder', altarStone, new pc.Vec3(0, 0.12, -1.2), new pc.Vec3(5.2, 0.22, 5.2)));
    this.track(createPrimitive(this.app, 'sanctum-dais-high', 'cylinder', altarStone, new pc.Vec3(0, 0.32, -1.2), new pc.Vec3(3.9, 0.24, 3.9)));
    this.track(createPrimitive(this.app, 'sanctum-plinth', 'box', altarStone, new pc.Vec3(0, 0.64, -1.2), new pc.Vec3(1.5, 0.65, 1.5)));
    const relic = this.track(createPrimitive(this.app, 'sanctum-relic', 'cone', altarGlow, new pc.Vec3(0, 1.65, -1.2), new pc.Vec3(0.7, 1.45, 0.7)));
    relic.setLocalEulerAngles(0, 45, 0);
    const positions = [
      [-6.4, -5.8], [6.4, -5.8], [-6.4, 4.7], [6.4, 4.7]
    ] as const;
    for (const [x, z] of positions) this.addPillar(x, z, palette, false);
    this.addTorch(-3.3, -6.7, palette);
    this.addTorch(3.3, -6.7, palette);
    this.addTorch(-3.3, 5.2, palette);
    this.addTorch(3.3, 5.2, palette);
    this.addBanner(-8.4, -1.0, 0, palette);
    this.addBanner(8.4, -1.0, 0, palette);
  }

  private buildEmberGate(palette: Palette): void {
    this.addWall('gate-left', -6.7, -4.8, 5.4, 1.3, 2.35, palette, 9);
    this.addWall('gate-right', 6.7, -4.8, 5.4, 1.3, 2.35, palette, 10);
    this.addWall('gate-wing-l', -7.2, 2.7, 0.8, 4.0, 1.4, palette, 11);
    this.addWall('gate-wing-r', 7.2, 2.7, 0.8, 4.0, 1.4, palette, 12);
    this.addPillar(-3.2, 0.6, palette, true);
    this.addPillar(3.2, 0.6, palette, true);
    this.addTorch(-4.2, -3.4, palette);
    this.addTorch(4.2, -3.4, palette);
    this.addRubble(-8.2, 7.3, palette, 3);
    this.addRubble(8.0, 7.2, palette, 4);
    this.addGate(0, -8.9, palette);
    this.addBanner(-8.8, -5.7, 0, palette);
    this.addBanner(8.8, -5.7, 0, palette);
    this.addBarricade(-1.8, 6.6, 7, palette);
    this.addBarricade(1.8, 6.4, -8, palette);
  }

  private buildBossArena(palette: Palette): void {
    const center = createMaterial(palette.accent, palette.glow, 0.28, 0.52);
    const dark = createMaterial(this.shade(palette.floor, 0.55), undefined, 0.04, 0.18);
    this.track(createPrimitive(this.app, 'boss-sigil', 'cylinder', dark, new pc.Vec3(0, 0.035, -1.0), new pc.Vec3(7.4, 0.04, 7.4)));
    for (let index = 0; index < 12; index += 1) {
      const angle = (index / 12) * Math.PI * 2;
      const radius = 5.2;
      const spoke = this.track(createPrimitive(
        this.app,
        `boss-sigil-spoke-${index}`,
        'box',
        center,
        new pc.Vec3(Math.cos(angle) * radius * 0.52, 0.07, -1 + Math.sin(angle) * radius * 0.52),
        new pc.Vec3(0.13, 0.035, radius)
      ));
      spoke.setLocalEulerAngles(0, -angle * (180 / Math.PI), 0);
    }
    this.track(createPrimitive(this.app, 'boss-sigil-core', 'cylinder', center, new pc.Vec3(0, 0.075, -1), new pc.Vec3(1.3, 0.045, 1.3)));
    const ring = [
      [-7.2, -5.4], [7.2, -5.4], [-8.0, 2.0], [8.0, 2.0], [-5.6, 7.2], [5.6, 7.2]
    ] as const;
    for (const [x, z] of ring) this.addPillar(x, z, palette, true);
    this.addTorch(-9.0, -8.4, palette);
    this.addTorch(9.0, -8.4, palette);
    this.addTorch(-9.0, 8.2, palette);
    this.addTorch(9.0, 8.2, palette);
    this.addBanner(-9.2, -1.0, 0, palette);
    this.addBanner(9.2, -1.0, 0, palette);
  }

  private addFloorTiles(stageIndex: number, palette: Palette): void {
    const tileA = createMaterial(this.shade(palette.floor, 1.07), undefined, 0.03, 0.16);
    const tileB = createMaterial(this.shade(palette.floor, 0.86), undefined, 0.03, 0.13);
    const seam = createMaterial(this.shade(palette.accent, 0.62), stageIndex === 4 ? this.shade(palette.glow, 0.58) : undefined, 0.03, 0.14);
    const size = 2.36;
    for (let xIndex = -4; xIndex <= 4; xIndex += 1) {
      for (let zIndex = -4; zIndex <= 4; zIndex += 1) {
        const material = (xIndex + zIndex + stageIndex) % 2 === 0 ? tileA : tileB;
        this.track(createPrimitive(
          this.app,
          `floor-tile-${stageIndex}-${xIndex}-${zIndex}`,
          'box',
          material,
          new pc.Vec3(xIndex * size, 0.025, zIndex * size),
          new pc.Vec3(size - 0.08, 0.035, size - 0.08)
        ));
        if ((Math.abs(xIndex * 3 + zIndex + stageIndex) % 7) === 0) {
          const crack = this.track(createPrimitive(
            this.app,
            `floor-crack-${stageIndex}-${xIndex}-${zIndex}`,
            'box',
            seam,
            new pc.Vec3(xIndex * size + 0.15, 0.052, zIndex * size - 0.1),
            new pc.Vec3(0.055, 0.015, 1.15)
          ));
          crack.setLocalEulerAngles(0, 24 + (xIndex - zIndex) * 9, 0);
        }
      }
    }
  }

  private addWall(name: string, x: number, z: number, width: number, depth: number, height: number, palette: Palette, seed: number): void {
    const stone = createMaterial(palette.stone, undefined, 0.08, 0.24);
    const cap = createMaterial(this.shade(palette.stone, 1.18), undefined, 0.11, 0.22);
    const sections = Math.max(2, Math.round(width > depth ? width / 1.2 : depth / 1.2));
    const alongX = width >= depth;
    for (let index = 0; index < sections; index += 1) {
      const t = sections === 1 ? 0 : index / (sections - 1) - 0.5;
      const sectionHeight = Math.max(0.58, height * (0.72 + (((index + seed) % 3) * 0.12)));
      const positionX = x + (alongX ? t * width * 0.82 : 0);
      const positionZ = z + (alongX ? 0 : t * depth * 0.82);
      const section = this.track(createPrimitive(
        this.app,
        `${name}-section-${index}`,
        'box',
        stone,
        new pc.Vec3(positionX, sectionHeight * 0.5, positionZ),
        new pc.Vec3(alongX ? width / sections * 1.06 : width, sectionHeight, alongX ? depth : depth / sections * 1.06)
      ));
      section.setLocalEulerAngles(0, ((index + seed) % 2 === 0 ? -1 : 1) * (2 + (seed % 3)), ((index + seed) % 2) * 2);
    }
    this.track(createPrimitive(this.app, `${name}-cap`, 'box', cap, new pc.Vec3(x, height + 0.03, z), new pc.Vec3(width * 0.92, 0.1, depth * 1.05)));
    this.obstacles.push({ minX: x - width * 0.5, maxX: x + width * 0.5, minZ: z - depth * 0.5, maxZ: z + depth * 0.5 });
  }

  private addPillar(x: number, z: number, palette: Palette, blocking: boolean): void {
    const stone = createMaterial(palette.stone, undefined, 0.12, 0.3);
    const accent = createMaterial(palette.accent, palette.glow, 0.18, 0.46);
    this.track(createPrimitive(this.app, `pillar-base-${x}-${z}`, 'box', stone, new pc.Vec3(x, 0.16, z), new pc.Vec3(1.45, 0.28, 1.45)));
    this.track(createPrimitive(this.app, `pillar-${x}-${z}`, 'cylinder', stone, new pc.Vec3(x, 1.18, z), new pc.Vec3(0.88, 2.1, 0.88)));
    this.track(createPrimitive(this.app, `pillar-band-${x}-${z}`, 'cylinder', accent, new pc.Vec3(x, 1.28, z), new pc.Vec3(0.96, 0.12, 0.96)));
    this.track(createPrimitive(this.app, `pillar-cap-${x}-${z}`, 'box', stone, new pc.Vec3(x, 2.33, z), new pc.Vec3(1.35, 0.22, 1.35)));
    if (blocking) this.obstacles.push({ minX: x - 0.72, maxX: x + 0.72, minZ: z - 0.72, maxZ: z + 0.72 });
  }

  private addTorch(x: number, z: number, palette: Palette): void {
    const metal = createMaterial(new pc.Color(0.085, 0.08, 0.075), undefined, 0.58, 0.4);
    const fire = createMaterial(new pc.Color(0.8, 0.22, 0.035), palette.glow, 0, 0.16);
    this.track(createPrimitive(this.app, `torch-base-${x}-${z}`, 'box', metal, new pc.Vec3(x, 0.13, z), new pc.Vec3(0.72, 0.22, 0.72)));
    this.track(createPrimitive(this.app, `torch-post-${x}-${z}`, 'cylinder', metal, new pc.Vec3(x, 0.64, z), new pc.Vec3(0.14, 1.0, 0.14)));
    this.track(createPrimitive(this.app, `torch-bowl-${x}-${z}`, 'cylinder', metal, new pc.Vec3(x, 1.18, z), new pc.Vec3(0.5, 0.15, 0.5)));
    this.track(createPrimitive(this.app, `torch-fire-${x}-${z}`, 'cone', fire, new pc.Vec3(x, 1.55, z), new pc.Vec3(0.34, 0.68, 0.34)));
    const tip = this.track(createPrimitive(this.app, `torch-fire-tip-${x}-${z}`, 'cone', fire, new pc.Vec3(x + 0.08, 1.86, z), new pc.Vec3(0.16, 0.42, 0.16)));
    tip.setLocalEulerAngles(8, 0, 8);
  }

  private addBanner(x: number, z: number, rotation: number, palette: Palette): void {
    const pole = createMaterial(new pc.Color(0.09, 0.085, 0.08), undefined, 0.5, 0.34);
    const cloth = createMaterial(this.shade(palette.accent, 0.7), undefined, 0.01, 0.14);
    const staff = this.track(createPrimitive(this.app, `banner-pole-${x}-${z}`, 'cylinder', pole, new pc.Vec3(x, 1.2, z), new pc.Vec3(0.06, 2.4, 0.06)));
    staff.setLocalEulerAngles(0, rotation, 0);
    const banner = this.track(createPrimitive(this.app, `banner-cloth-${x}-${z}`, 'box', cloth, new pc.Vec3(x + 0.38, 1.58, z), new pc.Vec3(0.72, 0.92, 0.045)));
    banner.setLocalEulerAngles(0, rotation, 4);
  }

  private addGate(x: number, z: number, palette: Palette): void {
    const stone = createMaterial(palette.stone, undefined, 0.12, 0.28);
    const iron = createMaterial(new pc.Color(0.075, 0.077, 0.082), undefined, 0.7, 0.48);
    this.track(createPrimitive(this.app, 'gate-post-left', 'box', stone, new pc.Vec3(x - 2.3, 1.7, z), new pc.Vec3(0.8, 3.4, 0.9)));
    this.track(createPrimitive(this.app, 'gate-post-right', 'box', stone, new pc.Vec3(x + 2.3, 1.7, z), new pc.Vec3(0.8, 3.4, 0.9)));
    this.track(createPrimitive(this.app, 'gate-lintel', 'box', stone, new pc.Vec3(x, 3.15, z), new pc.Vec3(5.1, 0.5, 0.9)));
    for (let index = -3; index <= 3; index += 1) {
      this.track(createPrimitive(this.app, `gate-bar-${index}`, 'cylinder', iron, new pc.Vec3(x + index * 0.6, 1.55, z - 0.08), new pc.Vec3(0.065, 2.8, 0.065)));
    }
  }

  private addBarricade(x: number, z: number, rotation: number, palette: Palette): void {
    const wood = createMaterial(this.shade(palette.accent, 0.48), undefined, 0.02, 0.17);
    for (let index = -1; index <= 1; index += 1) {
      const spike = this.track(createPrimitive(this.app, `barricade-${x}-${z}-${index}`, 'cylinder', wood, new pc.Vec3(x + index * 0.52, 0.45, z), new pc.Vec3(0.085, 1.25, 0.085)));
      spike.setLocalEulerAngles(0, rotation, index * 24);
      const tip = this.track(createPrimitive(this.app, `barricade-tip-${x}-${z}-${index}`, 'cone', wood, new pc.Vec3(x + index * 0.52, 1.14, z), new pc.Vec3(0.15, 0.45, 0.15)));
      tip.setLocalEulerAngles(0, rotation, index * 24);
    }
  }

  private addShrub(x: number, z: number, palette: Palette, seed: number): void {
    const dead = createMaterial(this.shade(palette.stone, 0.58), undefined, 0.01, 0.1);
    for (let index = 0; index < 4; index += 1) {
      const branch = this.track(createPrimitive(
        this.app,
        `shrub-${seed}-${index}`,
        'cylinder',
        dead,
        new pc.Vec3(x + (index - 1.5) * 0.18, 0.34 + index * 0.04, z + ((index + seed) % 2) * 0.13),
        new pc.Vec3(0.035, 0.72 + index * 0.1, 0.035)
      ));
      branch.setLocalEulerAngles(18 + index * 12, seed * 31 + index * 48, (index % 2 === 0 ? -1 : 1) * (18 + index * 5));
    }
  }

  private addRubble(x: number, z: number, palette: Palette, seed: number): void {
    const stone = createMaterial(palette.stone, undefined, 0.06, 0.18);
    for (let index = 0; index < 5; index += 1) {
      const offsetX = ((index + seed) % 3 - 1) * 0.55;
      const offsetZ = ((index * 2 + seed) % 3 - 1) * 0.48;
      const scale = 0.38 + ((index + seed) % 2) * 0.2;
      const rubble = createPrimitive(
        this.app,
        `rubble-${seed}-${index}`,
        'box',
        stone,
        new pc.Vec3(x + offsetX, 0.16 + scale * 0.08, z + offsetZ),
        new pc.Vec3(scale, 0.28 + scale * 0.18, scale * 0.78)
      );
      rubble.setLocalEulerAngles(8 * index, 22 * (index + seed), 5 * seed);
      this.track(rubble);
    }
  }

  private shade(color: pc.Color, factor: number): pc.Color {
    return new pc.Color(
      pc.math.clamp(color.r * factor, 0, 1),
      pc.math.clamp(color.g * factor, 0, 1),
      pc.math.clamp(color.b * factor, 0, 1)
    );
  }

  private track(entity: pc.Entity): pc.Entity {
    this.entities.push(entity);
    return entity;
  }

  private clear(): void {
    for (const entity of this.entities) entity.destroy();
    this.entities = [];
    this.obstacles = [];
  }
}
