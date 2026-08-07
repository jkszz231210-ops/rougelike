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
    floor: new pc.Color(0.15, 0.14, 0.135),
    stone: new pc.Color(0.21, 0.19, 0.17),
    accent: new pc.Color(0.39, 0.2, 0.1),
    glow: new pc.Color(0.52, 0.12, 0.02)
  },
  {
    floor: new pc.Color(0.105, 0.12, 0.13),
    stone: new pc.Color(0.19, 0.22, 0.23),
    accent: new pc.Color(0.24, 0.32, 0.34),
    glow: new pc.Color(0.08, 0.24, 0.28)
  },
  {
    floor: new pc.Color(0.11, 0.105, 0.14),
    stone: new pc.Color(0.23, 0.21, 0.29),
    accent: new pc.Color(0.39, 0.31, 0.52),
    glow: new pc.Color(0.26, 0.12, 0.48)
  },
  {
    floor: new pc.Color(0.16, 0.105, 0.08),
    stone: new pc.Color(0.27, 0.17, 0.12),
    accent: new pc.Color(0.48, 0.23, 0.08),
    glow: new pc.Color(0.62, 0.12, 0.015)
  },
  {
    floor: new pc.Color(0.07, 0.075, 0.085),
    stone: new pc.Color(0.13, 0.135, 0.15),
    accent: new pc.Color(0.36, 0.12, 0.07),
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
    const floor = createMaterial(palette.floor, undefined, 0.04, 0.2);
    this.track(createPrimitive(
      this.app,
      `stage-floor-${stageIndex}`,
      'box',
      floor,
      new pc.Vec3(0, -0.015, 0),
      new pc.Vec3(21.6, 0.07, 21.6)
    ));

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
    this.addWall('outer-nw', -6.7, -4.4, 4.0, 0.7, 1.35, palette);
    this.addWall('outer-se', 6.8, 4.1, 3.8, 0.7, 1.2, palette);
    this.addWall('outer-ne', 7.2, -6.0, 0.7, 3.6, 1.0, palette);
    this.addWall('outer-sw', -7.1, 6.2, 0.7, 3.0, 1.0, palette);
    this.addTorch(-8.8, -8.2, palette);
    this.addTorch(8.5, 7.8, palette);
    this.addRubble(-3.8, 7.7, palette, 0);
    this.addRubble(4.6, -7.8, palette, 1);
  }

  private buildBrokenCorridor(palette: Palette): void {
    this.addWall('corridor-left-a', -5.6, -4.4, 5.2, 0.75, 1.65, palette);
    this.addWall('corridor-right-a', 4.7, -0.8, 5.0, 0.75, 1.45, palette);
    this.addWall('corridor-left-b', -4.6, 3.2, 4.6, 0.75, 1.25, palette);
    this.addWall('corridor-right-b', 6.2, 6.0, 3.1, 0.75, 1.1, palette);
    this.addPillar(-8.4, -0.2, palette, true);
    this.addPillar(8.3, 2.5, palette, true);
    this.addTorch(-8.8, -7.8, palette);
    this.addTorch(8.8, 7.8, palette);
    this.addRubble(0.2, -7.6, palette, 2);
  }

  private buildRelicSanctum(palette: Palette): void {
    const altar = createMaterial(palette.accent, palette.glow, 0.18, 0.5);
    this.track(createPrimitive(this.app, 'sanctum-dais', 'cylinder', altar, new pc.Vec3(0, 0.22, -1.2), new pc.Vec3(5.0, 0.36, 5.0)));
    this.track(createPrimitive(this.app, 'sanctum-relic', 'sphere', altar, new pc.Vec3(0, 1.25, -1.2), new pc.Vec3(0.75, 1.1, 0.75)));
    const positions = [
      [-6.4, -5.8], [6.4, -5.8], [-6.4, 4.7], [6.4, 4.7]
    ] as const;
    for (const [x, z] of positions) this.addPillar(x, z, palette, false);
    this.addTorch(-3.3, -6.7, palette);
    this.addTorch(3.3, -6.7, palette);
    this.addTorch(-3.3, 5.2, palette);
    this.addTorch(3.3, 5.2, palette);
  }

  private buildEmberGate(palette: Palette): void {
    this.addWall('gate-left', -6.7, -4.8, 5.4, 1.3, 2.35, palette);
    this.addWall('gate-right', 6.7, -4.8, 5.4, 1.3, 2.35, palette);
    this.addWall('gate-wing-l', -7.2, 2.7, 0.8, 4.0, 1.4, palette);
    this.addWall('gate-wing-r', 7.2, 2.7, 0.8, 4.0, 1.4, palette);
    this.addPillar(-3.2, 0.6, palette, true);
    this.addPillar(3.2, 0.6, palette, true);
    this.addTorch(-4.2, -3.4, palette);
    this.addTorch(4.2, -3.4, palette);
    this.addRubble(-8.2, 7.3, palette, 3);
    this.addRubble(8.0, 7.2, palette, 4);
  }

  private buildBossArena(palette: Palette): void {
    const center = createMaterial(palette.accent, palette.glow, 0.28, 0.55);
    this.track(createPrimitive(this.app, 'boss-sigil', 'cylinder', center, new pc.Vec3(0, 0.035, -1.0), new pc.Vec3(7.0, 0.04, 7.0)));
    const ring = [
      [-7.2, -5.4], [7.2, -5.4], [-8.0, 2.0], [8.0, 2.0], [-5.6, 7.2], [5.6, 7.2]
    ] as const;
    for (const [x, z] of ring) this.addPillar(x, z, palette, true);
    this.addTorch(-9.0, -8.4, palette);
    this.addTorch(9.0, -8.4, palette);
    this.addTorch(-9.0, 8.2, palette);
    this.addTorch(9.0, 8.2, palette);
  }

  private addWall(name: string, x: number, z: number, width: number, depth: number, height: number, palette: Palette): void {
    const stone = createMaterial(palette.stone, undefined, 0.08, 0.24);
    this.track(createPrimitive(this.app, name, 'box', stone, new pc.Vec3(x, height * 0.5, z), new pc.Vec3(width, height, depth)));
    this.obstacles.push({ minX: x - width * 0.5, maxX: x + width * 0.5, minZ: z - depth * 0.5, maxZ: z + depth * 0.5 });

    const cap = createMaterial(palette.accent, undefined, 0.12, 0.2);
    this.track(createPrimitive(this.app, `${name}-cap`, 'box', cap, new pc.Vec3(x, height + 0.05, z), new pc.Vec3(width * 0.92, 0.12, depth * 1.05)));
  }

  private addPillar(x: number, z: number, palette: Palette, blocking: boolean): void {
    const stone = createMaterial(palette.stone, undefined, 0.1, 0.32);
    const accent = createMaterial(palette.accent, palette.glow, 0.2, 0.5);
    this.track(createPrimitive(this.app, `pillar-${x}-${z}`, 'cylinder', stone, new pc.Vec3(x, 1.15, z), new pc.Vec3(1.05, 2.3, 1.05)));
    this.track(createPrimitive(this.app, `pillar-cap-${x}-${z}`, 'cylinder', accent, new pc.Vec3(x, 2.35, z), new pc.Vec3(1.35, 0.18, 1.35)));
    if (blocking) this.obstacles.push({ minX: x - 0.72, maxX: x + 0.72, minZ: z - 0.72, maxZ: z + 0.72 });
  }

  private addTorch(x: number, z: number, palette: Palette): void {
    const metal = createMaterial(new pc.Color(0.12, 0.11, 0.1), undefined, 0.55, 0.42);
    const fire = createMaterial(new pc.Color(0.8, 0.26, 0.045), palette.glow, 0, 0.18);
    this.track(createPrimitive(this.app, `torch-post-${x}-${z}`, 'cylinder', metal, new pc.Vec3(x, 0.55, z), new pc.Vec3(0.16, 1.1, 0.16)));
    this.track(createPrimitive(this.app, `torch-fire-${x}-${z}`, 'sphere', fire, new pc.Vec3(x, 1.3, z), new pc.Vec3(0.34, 0.48, 0.34)));
  }

  private addRubble(x: number, z: number, palette: Palette, seed: number): void {
    const stone = createMaterial(palette.stone, undefined, 0.06, 0.18);
    for (let index = 0; index < 4; index += 1) {
      const offsetX = ((index + seed) % 3 - 1) * 0.55;
      const offsetZ = ((index * 2 + seed) % 3 - 1) * 0.48;
      const scale = 0.42 + ((index + seed) % 2) * 0.2;
      const rubble = createPrimitive(
        this.app,
        `rubble-${seed}-${index}`,
        'box',
        stone,
        new pc.Vec3(x + offsetX, 0.16 + scale * 0.08, z + offsetZ),
        new pc.Vec3(scale, 0.3 + scale * 0.18, scale * 0.78)
      );
      rubble.setLocalEulerAngles(8 * index, 22 * (index + seed), 5 * seed);
      this.track(rubble);
    }
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
