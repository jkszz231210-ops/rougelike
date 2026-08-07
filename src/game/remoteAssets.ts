import * as pc from 'playcanvas';

interface RemoteModelSpec {
  url: string;
  scale: number;
  yaw?: number;
  hover?: number;
}

interface LoadedInstance {
  host: pc.Entity;
  visual: pc.Entity;
}

const ADVENTURERS = 'https://cdn.jsdelivr.net/gh/KayKit-Game-Assets/KayKit-Character-Pack-Adventures-1.0@main/addons/kaykit_character_pack_adventures/Characters/gltf';
const SKELETONS = 'https://cdn.jsdelivr.net/gh/KayKit-Game-Assets/KayKit-Character-Pack-Skeletons-1.0@main/addons/kaykit_character_pack_skeletons/Characters/gltf';

const REMOTE_MODELS: Readonly<Record<string, RemoteModelSpec>> = {
  player: { url: `${ADVENTURERS}/Knight.glb`, scale: 0.9, yaw: 180 },
  'companion-archer': { url: `${ADVENTURERS}/Rogue_Hooded.glb`, scale: 0.86, yaw: 180 },
  'companion-guardian': { url: `${ADVENTURERS}/Barbarian.glb`, scale: 0.94, yaw: 180 },
  'companion-support': { url: `${ADVENTURERS}/Mage.glb`, scale: 0.82, yaw: 180, hover: 0.28 },
  'enemy-melee': { url: `${SKELETONS}/Skeleton_Minion.glb`, scale: 0.82, yaw: 180 },
  'enemy-ranged': { url: `${SKELETONS}/Skeleton_Rogue.glb`, scale: 0.82, yaw: 180 },
  'enemy-elite': { url: `${SKELETONS}/Skeleton_Warrior.glb`, scale: 1.08, yaw: 180 },
  'enemy-boss': { url: `${SKELETONS}/Skeleton_Warrior.glb`, scale: 1.48, yaw: 180 }
};

/**
 * V0.4 real-model bridge.
 *
 * Runtime GLB assets are loaded from public CC0 KayKit repositories through
 * jsDelivr. Until a model has loaded, the V0.3 procedural art remains visible.
 * If loading succeeds we hide only the primitive ModelComponents and attach a
 * skinned RenderEntity, leaving movement/combat entities untouched.
 */
export class RemoteAssetDirector {
  private readonly claimed = new WeakSet<pc.Entity>();
  private readonly cache = new Map<string, Promise<pc.Asset>>();
  private readonly instances = new Set<LoadedInstance>();

  constructor(private readonly app: pc.Application) {
    this.scan();
    this.app.on('update', this.update, this);
  }

  private update(): void {
    this.scan();
    for (const instance of [...this.instances]) {
      if (!instance.host.parent) this.instances.delete(instance);
    }
  }

  private scan(): void {
    this.walk(this.app.root);
  }

  private walk(node: pc.Entity): void {
    const spec = REMOTE_MODELS[node.name];
    if (spec && !this.claimed.has(node)) {
      this.claimed.add(node);
      void this.attach(node, spec);
    }

    for (const child of node.children as pc.Entity[]) this.walk(child);
  }

  private async attach(host: pc.Entity, spec: RemoteModelSpec): Promise<void> {
    try {
      const asset = await this.loadContainer(spec.url);
      if (!host.parent) return;
      const resource = asset.resource as unknown as {
        instantiateRenderEntity(options?: { castShadows?: boolean; receiveShadows?: boolean }): pc.Entity;
        animations?: Array<{ name?: string; resource?: unknown }>;
      };
      if (!resource?.instantiateRenderEntity) return;

      const visual = resource.instantiateRenderEntity({ castShadows: true, receiveShadows: true });
      visual.name = 'remote-visual-root';

      const hostScale = host.getLocalScale();
      const sx = Math.abs(hostScale.x) > 0.001 ? hostScale.x : 1;
      const sy = Math.abs(hostScale.y) > 0.001 ? hostScale.y : 1;
      const sz = Math.abs(hostScale.z) > 0.001 ? hostScale.z : 1;
      visual.setLocalScale(spec.scale / sx, spec.scale / sy, spec.scale / sz);

      const desiredOriginY = spec.hover ?? 0;
      const hostWorldY = host.getPosition().y;
      visual.setLocalPosition(0, (desiredOriginY - hostWorldY) / sy, 0);
      visual.setLocalEulerAngles(0, spec.yaw ?? 180, 0);
      host.addChild(visual);

      this.hidePrimitiveVisuals(host, visual);
      this.tryPlayIdle(visual, resource.animations ?? []);
      this.instances.add({ host, visual });
    } catch (error) {
      console.warn(`[Emberfall] Remote model failed for ${host.name}; keeping procedural fallback.`, error);
    }
  }

  private loadContainer(url: string): Promise<pc.Asset> {
    const cached = this.cache.get(url);
    if (cached) return cached;

    const pending = new Promise<pc.Asset>((resolve, reject) => {
      this.app.assets.loadFromUrl(url, 'container', (error, asset) => {
        if (error || !asset) {
          reject(error ?? new Error(`Unable to load ${url}`));
          return;
        }
        resolve(asset);
      });
    });
    this.cache.set(url, pending);
    return pending;
  }

  private hidePrimitiveVisuals(root: pc.Entity, keep: pc.Entity): void {
    const walk = (node: pc.Entity): void => {
      if (node === keep) return;
      if (node.model) node.model.enabled = false;
      for (const child of node.children as pc.Entity[]) walk(child);
    };
    walk(root);
  }

  private tryPlayIdle(
    visual: pc.Entity,
    animations: Array<{ name?: string; resource?: unknown }>
  ): void {
    const clip = animations.find((entry) => /(^|[ _-])idle([ _-]|$)/i.test(entry.name ?? ''))
      ?? animations.find((entry) => /idle/i.test(entry.name ?? ''))
      ?? animations[0];
    const track = clip?.resource;
    if (!track) return;

    try {
      const animated = visual as pc.Entity & {
        anim?: {
          assignAnimation(
            nodePath: string,
            animTrack: unknown,
            layerName?: string,
            speed?: number,
            loop?: boolean
          ): void;
        };
      };
      if (!animated.anim) visual.addComponent('anim', { activate: true, speed: 1 });
      animated.anim?.assignAnimation('idle', track, undefined, 1, true);
    } catch (error) {
      console.warn('[Emberfall] Model loaded but idle animation could not be assigned.', error);
    }
  }
}
