import * as pc from 'playcanvas';
import { ArenaEnvironment } from './arena';
import { createChildPrimitive, createMaterial, createPrimitive, type PrimitiveType } from './visuals';

interface StageTheme {
  accent: pc.Color;
  glow: pc.Color;
  stone: pc.Color;
}

interface RemotePropSpec {
  file: string;
  scale: number;
}

interface PropPlacement {
  model: keyof typeof REMOTE_PROPS;
  x: number;
  z: number;
  yaw?: number;
  scale?: number;
  fallback: PrimitiveType;
  fallbackScale: pc.Vec3;
}

const DUNGEON = 'https://cdn.jsdelivr.net/gh/KayKit-Game-Assets/KayKit-Dungeon-Remastered-1.0@main/addons/kaykit_dungeon_remastered/Assets/gltf';

const REMOTE_PROPS: Readonly<Record<string, RemotePropSpec>> = {
  pillar: { file: 'pillar.gltf.glb', scale: 1.5 },
  decoratedPillar: { file: 'pillar_decorated.gltf.glb', scale: 1.55 },
  torch: { file: 'torch_lit.gltf.glb', scale: 1.15 },
  gate: { file: 'wall_gated.gltf.glb', scale: 1.55 },
  banner: { file: 'banner_patternA_red.gltf.glb', scale: 1.35 },
  chest: { file: 'chest.gltf.glb', scale: 1.15 }
};

const STAGE_THEMES: readonly StageTheme[] = [
  { accent: new pc.Color(0.42, 0.13, 0.045), glow: new pc.Color(0.7, 0.08, 0.01), stone: new pc.Color(0.18, 0.15, 0.13) },
  { accent: new pc.Color(0.06, 0.3, 0.33), glow: new pc.Color(0.015, 0.36, 0.42), stone: new pc.Color(0.13, 0.18, 0.19) },
  { accent: new pc.Color(0.29, 0.18, 0.46), glow: new pc.Color(0.28, 0.06, 0.58), stone: new pc.Color(0.17, 0.15, 0.22) },
  { accent: new pc.Color(0.52, 0.16, 0.03), glow: new pc.Color(0.86, 0.07, 0.005), stone: new pc.Color(0.2, 0.12, 0.08) },
  { accent: new pc.Color(0.32, 0.31, 0.25), glow: new pc.Color(0.25, 0.15, 0.06), stone: new pc.Color(0.18, 0.18, 0.16) },
  { accent: new pc.Color(0.045, 0.28, 0.25), glow: new pc.Color(0.01, 0.38, 0.32), stone: new pc.Color(0.11, 0.17, 0.17) },
  { accent: new pc.Color(0.2, 0.24, 0.48), glow: new pc.Color(0.1, 0.16, 0.66), stone: new pc.Color(0.14, 0.15, 0.23) },
  { accent: new pc.Color(0.62, 0.19, 0.025), glow: new pc.Color(0.95, 0.09, 0.005), stone: new pc.Color(0.22, 0.105, 0.06) },
  { accent: new pc.Color(0.34, 0.08, 0.055), glow: new pc.Color(0.66, 0.025, 0.012), stone: new pc.Color(0.14, 0.12, 0.12) },
  { accent: new pc.Color(0.5, 0.055, 0.025), glow: new pc.Color(1, 0.055, 0.005), stone: new pc.Color(0.1, 0.095, 0.11) }
];

// Reuse the proven collision layouts while giving all ten rooms their own visual identity.
// The last room deliberately maps to the dedicated boss arena.
const BASE_LAYOUT_BY_STAGE: readonly number[] = [0, 1, 2, 3, 0, 1, 2, 3, 1, 4];
const decorated = new WeakMap<ArenaEnvironment, pc.Entity[]>();
const assetCache = new Map<string, Promise<pc.Asset>>();
let installed = false;

export function installArenaExpansion(app: pc.Application): void {
  if (installed) return;
  installed = true;

  const originalRebuild = ArenaEnvironment.prototype.rebuild;
  ArenaEnvironment.prototype.rebuild = function rebuildExpanded(this: ArenaEnvironment, stageIndex: number): void {
    clearStageDecoration(this);
    const mappedIndex = BASE_LAYOUT_BY_STAGE[stageIndex] ?? (stageIndex >= BASE_LAYOUT_BY_STAGE.length - 1 ? 4 : stageIndex % 4);
    originalRebuild.call(this, mappedIndex);
    decorateStage(app, this, stageIndex);
  };
}

function decorateStage(app: pc.Application, arena: ArenaEnvironment, stageIndex: number): void {
  const theme = STAGE_THEMES[Math.min(stageIndex, STAGE_THEMES.length - 1)] as StageTheme;
  if (stageIndex === 0) buildAshenOutskirts(app, arena, theme);
  else if (stageIndex === 1) buildShatteredAqueduct(app, arena, theme);
  else if (stageIndex === 2) buildNamelessShrine(app, arena, theme);
  else if (stageIndex === 3) buildEmberGate(app, arena, theme);
  else if (stageIndex === 4) buildBoneOrchard(app, arena, theme);
  else if (stageIndex === 5) buildSunkenCloister(app, arena, theme);
  else if (stageIndex === 6) buildStarfallArchive(app, arena, theme);
  else if (stageIndex === 7) buildFurnaceHeart(app, arena, theme);
  else if (stageIndex === 8) buildLastCauseway(app, arena, theme);
  else buildWardenCitadel(app, arena, theme);
}

function buildAshenOutskirts(app: pc.Application, arena: ArenaEnvironment, theme: StageTheme): void {
  addRoad(app, arena, theme, 0, 0.08, 0, 3.8, 0.035, 19.5);
  addPropCluster(app, arena, theme, [
    { model: 'torch', x: -8.6, z: -7.4, fallback: 'cylinder', fallbackScale: new pc.Vec3(0.15, 1.0, 0.15) },
    { model: 'torch', x: 8.4, z: 7.1, yaw: 180, fallback: 'cylinder', fallbackScale: new pc.Vec3(0.15, 1.0, 0.15) },
    { model: 'chest', x: -7.5, z: 6.5, yaw: 24, fallback: 'box', fallbackScale: new pc.Vec3(1.0, 0.55, 0.7) }
  ]);
  addDeadTree(app, arena, theme, 8.2, -5.9, -18);
  addDeadTree(app, arena, theme, -8.0, 3.5, 21);
  addPointLight(app, arena, theme.glow, -8.4, 1.8, -7.3, 5.5, 1.6);
}

function buildShatteredAqueduct(app: pc.Application, arena: ArenaEnvironment, theme: StageTheme): void {
  addChannel(app, arena, theme, -4.7, 0.065, 0, 2.0, 0.035, 19.2);
  addChannel(app, arena, theme, 4.7, 0.065, 0, 2.0, 0.035, 19.2);
  addRoad(app, arena, theme, 0, 0.095, -2.2, 7.2, 0.04, 2.4);
  addRoad(app, arena, theme, 0, 0.095, 5.6, 7.2, 0.04, 2.4);
  addPropCluster(app, arena, theme, [
    { model: 'pillar', x: -8.2, z: -6.6, fallback: 'cylinder', fallbackScale: new pc.Vec3(0.7, 2.4, 0.7) },
    { model: 'pillar', x: 8.2, z: 5.9, fallback: 'cylinder', fallbackScale: new pc.Vec3(0.7, 2.4, 0.7) },
    { model: 'decoratedPillar', x: 0, z: -8.0, fallback: 'cylinder', fallbackScale: new pc.Vec3(0.8, 2.8, 0.8) }
  ]);
  addPointLight(app, arena, theme.glow, 0, 1.1, -2.2, 6.5, 1.1);
}

function buildNamelessShrine(app: pc.Application, arena: ArenaEnvironment, theme: StageTheme): void {
  addSigil(app, arena, theme, 0, -1.2, 4.8, 8);
  addPropCluster(app, arena, theme, [
    { model: 'decoratedPillar', x: -6.3, z: -5.6, fallback: 'cylinder', fallbackScale: new pc.Vec3(0.8, 2.8, 0.8) },
    { model: 'decoratedPillar', x: 6.3, z: -5.6, fallback: 'cylinder', fallbackScale: new pc.Vec3(0.8, 2.8, 0.8) },
    { model: 'banner', x: -8.8, z: -0.9, yaw: 90, fallback: 'box', fallbackScale: new pc.Vec3(0.25, 1.8, 1.0) },
    { model: 'banner', x: 8.8, z: -0.9, yaw: -90, fallback: 'box', fallbackScale: new pc.Vec3(0.25, 1.8, 1.0) }
  ]);
  addFloatingShard(app, arena, theme, 0, 1.8, -1.2, 45);
  addPointLight(app, arena, theme.glow, 0, 2.1, -1.2, 8, 1.45);
}

function buildEmberGate(app: pc.Application, arena: ArenaEnvironment, theme: StageTheme): void {
  addRoad(app, arena, theme, 0, 0.085, 0, 4.0, 0.04, 19.5);
  addPropCluster(app, arena, theme, [
    { model: 'gate', x: 0, z: -8.4, scale: 1.2, fallback: 'box', fallbackScale: new pc.Vec3(5.0, 2.7, 0.5) },
    { model: 'torch', x: -4.2, z: -6.8, fallback: 'cylinder', fallbackScale: new pc.Vec3(0.15, 1.0, 0.15) },
    { model: 'torch', x: 4.2, z: -6.8, fallback: 'cylinder', fallbackScale: new pc.Vec3(0.15, 1.0, 0.15) },
    { model: 'banner', x: -8.6, z: -4.8, yaw: 90, fallback: 'box', fallbackScale: new pc.Vec3(0.25, 1.8, 1.0) },
    { model: 'banner', x: 8.6, z: -4.8, yaw: -90, fallback: 'box', fallbackScale: new pc.Vec3(0.25, 1.8, 1.0) }
  ]);
  addPointLight(app, arena, theme.glow, -4.2, 1.7, -6.8, 5.5, 1.8);
  addPointLight(app, arena, theme.glow, 4.2, 1.7, -6.8, 5.5, 1.8);
}

function buildBoneOrchard(app: pc.Application, arena: ArenaEnvironment, theme: StageTheme): void {
  for (let index = 0; index < 7; index += 1) {
    const side = index % 2 === 0 ? -1 : 1;
    const x = side * (6.2 + (index % 3) * 0.7);
    const z = -7.5 + index * 2.35;
    addBoneStake(app, arena, theme, x, z, side * (8 + index * 5));
  }
  addSigil(app, arena, theme, 0, 0, 3.4, 6);
  addPropCluster(app, arena, theme, [
    { model: 'chest', x: 7.8, z: -6.8, yaw: -20, fallback: 'box', fallbackScale: new pc.Vec3(1.0, 0.55, 0.7) },
    { model: 'pillar', x: -8.3, z: -1.0, fallback: 'cylinder', fallbackScale: new pc.Vec3(0.7, 2.4, 0.7) }
  ]);
}

function buildSunkenCloister(app: pc.Application, arena: ArenaEnvironment, theme: StageTheme): void {
  addChannel(app, arena, theme, 0, 0.06, 0, 6.0, 0.035, 18.8);
  for (let z = -7.0; z <= 7.0; z += 2.8) addSteppingStone(app, arena, theme, 0, z);
  addPropCluster(app, arena, theme, [
    { model: 'decoratedPillar', x: -7.9, z: -6.0, fallback: 'cylinder', fallbackScale: new pc.Vec3(0.8, 2.8, 0.8) },
    { model: 'decoratedPillar', x: 7.9, z: 5.7, fallback: 'cylinder', fallbackScale: new pc.Vec3(0.8, 2.8, 0.8) },
    { model: 'torch', x: -7.3, z: 6.7, fallback: 'cylinder', fallbackScale: new pc.Vec3(0.15, 1.0, 0.15) }
  ]);
  addPointLight(app, arena, theme.glow, -7.2, 1.7, 6.7, 4.8, 1.25);
}

function buildStarfallArchive(app: pc.Application, arena: ArenaEnvironment, theme: StageTheme): void {
  addSigil(app, arena, theme, 0, -1.0, 5.4, 12);
  addShelf(app, arena, theme, -7.2, -5.0, 0);
  addShelf(app, arena, theme, -7.2, 3.8, 0);
  addShelf(app, arena, theme, 7.2, -5.0, 0);
  addShelf(app, arena, theme, 7.2, 3.8, 0);
  addFloatingShard(app, arena, theme, -2.2, 1.6, -1.0, 28);
  addFloatingShard(app, arena, theme, 2.2, 2.0, -0.4, -34);
  addPropCluster(app, arena, theme, [
    { model: 'banner', x: 0, z: -8.7, yaw: 180, fallback: 'box', fallbackScale: new pc.Vec3(0.25, 1.8, 1.0) },
    { model: 'decoratedPillar', x: 0, z: 7.4, fallback: 'cylinder', fallbackScale: new pc.Vec3(0.8, 2.8, 0.8) }
  ]);
  addPointLight(app, arena, theme.glow, 0, 2.4, -1.0, 7.5, 1.35);
}

function buildFurnaceHeart(app: pc.Application, arena: ArenaEnvironment, theme: StageTheme): void {
  addChannel(app, arena, theme, -4.6, 0.065, 0, 1.6, 0.04, 19.0);
  addChannel(app, arena, theme, 4.6, 0.065, 0, 1.6, 0.04, 19.0);
  addRoad(app, arena, theme, 0, 0.095, 0, 5.4, 0.045, 19.5);
  addForge(app, arena, theme, -7.4, -4.8);
  addForge(app, arena, theme, 7.4, 4.8);
  addPropCluster(app, arena, theme, [
    { model: 'torch', x: -3.2, z: -7.1, fallback: 'cylinder', fallbackScale: new pc.Vec3(0.15, 1.0, 0.15) },
    { model: 'torch', x: 3.2, z: 7.1, yaw: 180, fallback: 'cylinder', fallbackScale: new pc.Vec3(0.15, 1.0, 0.15) }
  ]);
  addPointLight(app, arena, theme.glow, -7.3, 1.4, -4.8, 6.5, 2.0);
  addPointLight(app, arena, theme.glow, 7.3, 1.4, 4.8, 6.5, 2.0);
}

function buildLastCauseway(app: pc.Application, arena: ArenaEnvironment, theme: StageTheme): void {
  addRoad(app, arena, theme, 0, 0.09, 0, 4.2, 0.04, 20.2);
  for (const x of [-6.6, 6.6]) {
    for (const z of [-6.8, -2.3, 2.3, 6.8]) {
      addPropCluster(app, arena, theme, [
        { model: 'pillar', x, z, fallback: 'cylinder', fallbackScale: new pc.Vec3(0.68, 2.35, 0.68) }
      ]);
    }
  }
  addPropCluster(app, arena, theme, [
    { model: 'gate', x: 0, z: -8.6, scale: 1.15, fallback: 'box', fallbackScale: new pc.Vec3(5.0, 2.7, 0.5) },
    { model: 'banner', x: -3.4, z: -7.9, fallback: 'box', fallbackScale: new pc.Vec3(0.25, 1.8, 1.0) },
    { model: 'banner', x: 3.4, z: -7.9, fallback: 'box', fallbackScale: new pc.Vec3(0.25, 1.8, 1.0) }
  ]);
  addPointLight(app, arena, theme.glow, 0, 2.0, -7.5, 7.5, 1.5);
}

function buildWardenCitadel(app: pc.Application, arena: ArenaEnvironment, theme: StageTheme): void {
  addSigil(app, arena, theme, 0, -1.0, 6.3, 16);
  addRoad(app, arena, theme, 0, 0.1, 5.7, 5.0, 0.04, 8.0);
  addThrone(app, arena, theme, 0, -8.1);
  addPropCluster(app, arena, theme, [
    { model: 'decoratedPillar', x: -8.4, z: -6.6, fallback: 'cylinder', fallbackScale: new pc.Vec3(0.82, 3.0, 0.82) },
    { model: 'decoratedPillar', x: 8.4, z: -6.6, fallback: 'cylinder', fallbackScale: new pc.Vec3(0.82, 3.0, 0.82) },
    { model: 'torch', x: -5.2, z: -7.6, fallback: 'cylinder', fallbackScale: new pc.Vec3(0.15, 1.0, 0.15) },
    { model: 'torch', x: 5.2, z: -7.6, fallback: 'cylinder', fallbackScale: new pc.Vec3(0.15, 1.0, 0.15) }
  ]);
  addPointLight(app, arena, theme.glow, 0, 2.4, -5.8, 9.5, 2.1);
}

function addPropCluster(app: pc.Application, arena: ArenaEnvironment, theme: StageTheme, placements: readonly PropPlacement[]): void {
  for (const placement of placements) addRemoteProp(app, arena, theme, placement);
}

function addRemoteProp(app: pc.Application, arena: ArenaEnvironment, theme: StageTheme, placement: PropPlacement): void {
  const spec = REMOTE_PROPS[placement.model] as RemotePropSpec;
  const host = new pc.Entity(`environment-${String(placement.model)}`);
  host.setPosition(placement.x, 0, placement.z);
  host.setEulerAngles(0, placement.yaw ?? 0, 0);
  app.root.addChild(host);
  track(arena, host);

  const fallbackMaterial = createMaterial(theme.stone, undefined, 0.06, 0.2);
  const fallback = createChildPrimitive(host, 'fallback', placement.fallback, fallbackMaterial, new pc.Vec3(0, placement.fallbackScale.y * 0.5, 0), placement.fallbackScale);
  void attachRemoteModel(app, host, fallback, spec, placement.scale ?? 1);
}

async function attachRemoteModel(app: pc.Application, host: pc.Entity, fallback: pc.Entity, spec: RemotePropSpec, scale: number): Promise<void> {
  try {
    const asset = await loadContainer(app, `${DUNGEON}/${spec.file}`);
    if (!host.parent) return;
    const resource = asset.resource as unknown as {
      instantiateRenderEntity(options?: { castShadows?: boolean; receiveShadows?: boolean }): pc.Entity;
    };
    if (!resource?.instantiateRenderEntity) return;
    const visual = resource.instantiateRenderEntity({ castShadows: true, receiveShadows: true });
    visual.name = 'remote-environment-visual';
    visual.setLocalScale(spec.scale * scale, spec.scale * scale, spec.scale * scale);
    host.addChild(visual);
    if (fallback.model) fallback.model.enabled = false;
  } catch (error) {
    console.warn(`[Emberfall] Dungeon prop ${spec.file} failed to load; using fallback.`, error);
  }
}

function loadContainer(app: pc.Application, url: string): Promise<pc.Asset> {
  const cached = assetCache.get(url);
  if (cached) return cached;
  const pending = new Promise<pc.Asset>((resolve, reject) => {
    app.assets.loadFromUrl(url, 'container', (error, asset) => {
      if (error || !asset) {
        reject(error ?? new Error(`Unable to load ${url}`));
        return;
      }
      resolve(asset);
    });
  });
  assetCache.set(url, pending);
  return pending;
}

function addRoad(app: pc.Application, arena: ArenaEnvironment, theme: StageTheme, x: number, y: number, z: number, sx: number, sy: number, sz: number): void {
  const material = createMaterial(theme.stone, undefined, 0.04, 0.16);
  track(arena, createPrimitive(app, 'landmark-road', 'box', material, new pc.Vec3(x, y, z), new pc.Vec3(sx, sy, sz)));
}

function addChannel(app: pc.Application, arena: ArenaEnvironment, theme: StageTheme, x: number, y: number, z: number, sx: number, sy: number, sz: number): void {
  const material = createMaterial(theme.accent, theme.glow, 0.08, 0.46);
  track(arena, createPrimitive(app, 'landmark-channel', 'box', material, new pc.Vec3(x, y, z), new pc.Vec3(sx, sy, sz)));
}

function addSigil(app: pc.Application, arena: ArenaEnvironment, theme: StageTheme, x: number, z: number, radius: number, spokes: number): void {
  const material = createMaterial(theme.accent, theme.glow, 0.1, 0.42);
  track(arena, createPrimitive(app, 'landmark-sigil-core', 'cylinder', material, new pc.Vec3(x, 0.09, z), new pc.Vec3(1.0, 0.035, 1.0)));
  for (let index = 0; index < spokes; index += 1) {
    const angle = (index / spokes) * Math.PI * 2;
    const entity = createPrimitive(
      app,
      `landmark-sigil-${index}`,
      'box',
      material,
      new pc.Vec3(x + Math.cos(angle) * radius * 0.48, 0.075, z + Math.sin(angle) * radius * 0.48),
      new pc.Vec3(0.08, 0.02, radius)
    );
    entity.setLocalEulerAngles(0, -angle * 180 / Math.PI, 0);
    track(arena, entity);
  }
}

function addDeadTree(app: pc.Application, arena: ArenaEnvironment, theme: StageTheme, x: number, z: number, yaw: number): void {
  const material = createMaterial(new pc.Color(theme.stone.r * 0.55, theme.stone.g * 0.48, theme.stone.b * 0.42), undefined, 0.01, 0.08);
  const trunk = createPrimitive(app, 'dead-tree', 'cylinder', material, new pc.Vec3(x, 1.35, z), new pc.Vec3(0.35, 2.7, 0.35));
  trunk.setLocalEulerAngles(0, yaw, 9);
  track(arena, trunk);
  for (let index = 0; index < 3; index += 1) {
    const branch = createPrimitive(app, 'dead-tree-branch', 'box', material, new pc.Vec3(x + (index - 1) * 0.18, 2.25 + index * 0.18, z), new pc.Vec3(1.4 - index * 0.2, 0.12, 0.12));
    branch.setLocalEulerAngles(0, yaw + index * 42, index % 2 === 0 ? 24 : -24);
    track(arena, branch);
  }
}

function addBoneStake(app: pc.Application, arena: ArenaEnvironment, theme: StageTheme, x: number, z: number, yaw: number): void {
  const material = createMaterial(new pc.Color(0.46, 0.43, 0.34), undefined, 0.01, 0.12);
  const stake = createPrimitive(app, 'bone-stake', 'cone', material, new pc.Vec3(x, 0.9, z), new pc.Vec3(0.32, 1.8, 0.32));
  stake.setLocalEulerAngles(0, yaw, 4);
  track(arena, stake);
  const skull = createPrimitive(app, 'bone-skull', 'sphere', material, new pc.Vec3(x, 1.82, z), new pc.Vec3(0.42, 0.34, 0.38));
  track(arena, skull);
  void theme;
}

function addSteppingStone(app: pc.Application, arena: ArenaEnvironment, theme: StageTheme, x: number, z: number): void {
  const material = createMaterial(theme.stone, undefined, 0.03, 0.15);
  const stone = createPrimitive(app, 'stepping-stone', 'cylinder', material, new pc.Vec3(x, 0.12, z), new pc.Vec3(1.15, 0.11, 0.9));
  stone.setLocalEulerAngles(0, z * 7, 0);
  track(arena, stone);
}

function addShelf(app: pc.Application, arena: ArenaEnvironment, theme: StageTheme, x: number, z: number, yaw: number): void {
  const dark = createMaterial(theme.stone, undefined, 0.02, 0.15);
  const shelf = createPrimitive(app, 'archive-shelf', 'box', dark, new pc.Vec3(x, 1.25, z), new pc.Vec3(1.0, 2.5, 3.2));
  shelf.setLocalEulerAngles(0, yaw, 0);
  track(arena, shelf);
  for (let row = 0; row < 3; row += 1) {
    const band = createPrimitive(app, 'archive-shelf-band', 'box', createMaterial(theme.accent, undefined, 0.02, 0.18), new pc.Vec3(x + (x < 0 ? 0.53 : -0.53), 0.55 + row * 0.7, z), new pc.Vec3(0.05, 0.16, 2.75));
    track(arena, band);
  }
}

function addFloatingShard(app: pc.Application, arena: ArenaEnvironment, theme: StageTheme, x: number, y: number, z: number, yaw: number): void {
  const material = createMaterial(theme.accent, theme.glow, 0.26, 0.56);
  const shard = createPrimitive(app, 'floating-shard', 'cone', material, new pc.Vec3(x, y, z), new pc.Vec3(0.52, 1.3, 0.52));
  shard.setLocalEulerAngles(12, yaw, 18);
  track(arena, shard);
}

function addForge(app: pc.Application, arena: ArenaEnvironment, theme: StageTheme, x: number, z: number): void {
  const stone = createMaterial(theme.stone, undefined, 0.09, 0.18);
  const fire = createMaterial(theme.accent, theme.glow, 0.08, 0.5);
  track(arena, createPrimitive(app, 'forge-base', 'box', stone, new pc.Vec3(x, 0.65, z), new pc.Vec3(2.1, 1.3, 1.6)));
  track(arena, createPrimitive(app, 'forge-fire', 'cone', fire, new pc.Vec3(x, 1.45, z), new pc.Vec3(0.72, 1.35, 0.72)));
}

function addThrone(app: pc.Application, arena: ArenaEnvironment, theme: StageTheme, x: number, z: number): void {
  const stone = createMaterial(theme.stone, undefined, 0.14, 0.22);
  const accent = createMaterial(theme.accent, theme.glow, 0.16, 0.4);
  track(arena, createPrimitive(app, 'warden-throne-base', 'box', stone, new pc.Vec3(x, 0.45, z), new pc.Vec3(4.5, 0.9, 2.5)));
  track(arena, createPrimitive(app, 'warden-throne-back', 'box', stone, new pc.Vec3(x, 2.0, z - 0.8), new pc.Vec3(3.0, 3.4, 0.6)));
  track(arena, createPrimitive(app, 'warden-throne-mark', 'cone', accent, new pc.Vec3(x, 2.5, z - 0.4), new pc.Vec3(0.65, 1.2, 0.65)));
}

function addPointLight(app: pc.Application, arena: ArenaEnvironment, color: pc.Color, x: number, y: number, z: number, range: number, intensity: number): void {
  const light = new pc.Entity('stage-landmark-light');
  light.addComponent('light', {
    type: 'omni',
    color,
    intensity,
    range,
    castShadows: false
  });
  light.setPosition(x, y, z);
  app.root.addChild(light);
  track(arena, light);
}

function track(arena: ArenaEnvironment, entity: pc.Entity): void {
  const entities = decorated.get(arena) ?? [];
  entities.push(entity);
  decorated.set(arena, entities);
}

function clearStageDecoration(arena: ArenaEnvironment): void {
  const entities = decorated.get(arena);
  if (!entities) return;
  for (const entity of entities) {
    if (entity.parent) entity.destroy();
  }
  decorated.delete(arena);
}
