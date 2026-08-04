import * as pc from 'playcanvas';
import { Hud } from '../core/hud';
import { InputController } from '../core/input';
import { ProfileStore } from '../core/profile';
import { Companion, COMPANION_NAMES, type CompanionKind } from './companion';
import {
  RELIC_CATALOG,
  UPGRADE_CATALOG,
  createStageRooms,
  type RelicId,
  type RoomDefinition,
  type UpgradeId
} from './content';
import { GAME_CONFIG, type EnemyKind } from './config';
import { Enemy, type DefeatReward } from './enemy';
import { Projectile } from './projectile';
import { createSeedLabel, SeededRng } from './rng';
import { createMaterial, createPrimitive, flashEntity } from './visuals';

type GameState = 'playing' | 'choosing-upgrade' | 'choosing-relic' | 'room-complete' | 'won' | 'lost';

export class RogueliteGame {
  private readonly input: InputController;
  private readonly hud: Hud;
  private readonly player: pc.Entity;
  private readonly camera: pc.Entity;
  private readonly aimMarker: pc.Entity;
  private readonly seedLabel: string;
  private readonly rng: SeededRng;
  private readonly rooms: RoomDefinition[];
  private readonly profile = new ProfileStore();
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private companions: Companion[] = [];
  private state: GameState = 'playing';
  private roomIndex = 0;
  private level = 1;
  private experience = 0;
  private experienceToNext: number = GAME_CONFIG.progression.baseExperience;
  private pendingLevels = 0;
  private coins = 0;
  private kills = 0;
  private synergy = 0;
  private health: number = GAME_CONFIG.player.maxHealth;
  private maxHealth: number = GAME_CONFIG.player.maxHealth;
  private attackPower: number = GAME_CONFIG.player.attackDamage;
  private skillPower: number = GAME_CONFIG.player.skillDamage;
  private moveSpeed: number = GAME_CONFIG.player.moveSpeed;
  private skillCooldownScale = 1;
  private dashCooldownScale = 1;
  private attackCooldownScale = 1;
  private attackRangeScale = 1;
  private critChance = 0.05;
  private critMultiplier = 1.75;
  private damageReduction = 0;
  private healOnKill = 0;
  private coinMultiplier = 1;
  private deathSaveAvailable = false;
  private readonly upgradeLevels = new Map<UpgradeId, number>();
  private readonly relics = new Set<RelicId>();
  private attackTimer = 0;
  private skillTimer = 0;
  private dashTimer = 0;
  private invulnerabilityTimer = 0;
  private message = '命数正在生成';

  constructor(private readonly app: pc.Application, canvas: HTMLCanvasElement, hudRoot: HTMLElement) {
    this.seedLabel = createSeedLabel();
    this.rng = new SeededRng(this.seedLabel);
    this.rooms = createStageRooms(this.rng);
    this.input = new InputController(canvas);
    this.hud = new Hud(hudRoot);
    this.camera = this.createWorld();
    this.player = this.createPlayer();
    this.aimMarker = this.createAimMarker();
    this.enterRoom(0);
    this.app.on('update', (dt: number) => this.update(Math.min(dt, 0.05)));
  }

  private createWorld(): pc.Entity {
    this.app.scene.ambientLight = new pc.Color(0.22, 0.24, 0.27);
    this.app.scene.exposure = 1.05;

    const ground = createMaterial(new pc.Color(0.16, 0.17, 0.18));
    createPrimitive(this.app, 'arena-ground', 'box', ground, new pc.Vec3(0, -0.35, 0), new pc.Vec3(24, 0.6, 24));

    const rim = createMaterial(new pc.Color(0.07, 0.08, 0.09), new pc.Color(0.08, 0.025, 0.01));
    const half = GAME_CONFIG.arenaHalfSize + 0.5;
    createPrimitive(this.app, 'north-wall', 'box', rim, new pc.Vec3(0, 0.35, -half), new pc.Vec3(24, 1.4, 0.5));
    createPrimitive(this.app, 'south-wall', 'box', rim, new pc.Vec3(0, 0.35, half), new pc.Vec3(24, 1.4, 0.5));
    createPrimitive(this.app, 'west-wall', 'box', rim, new pc.Vec3(-half, 0.35, 0), new pc.Vec3(0.5, 1.4, 24));
    createPrimitive(this.app, 'east-wall', 'box', rim, new pc.Vec3(half, 0.35, 0), new pc.Vec3(0.5, 1.4, 24));

    for (let index = 0; index < 18; index += 1) {
      const angle = (index / 18) * Math.PI * 2;
      const radius = 8 + (index % 3);
      const ember = createMaterial(new pc.Color(0.12, 0.08, 0.06), new pc.Color(0.28, 0.055, 0.008));
      createPrimitive(
        this.app,
        `ember-${index}`,
        'sphere',
        ember,
        new pc.Vec3(Math.cos(angle) * radius, 0.04, Math.sin(angle) * radius),
        new pc.Vec3(0.12, 0.05, 0.12)
      );
    }

    const light = new pc.Entity('sun');
    light.addComponent('light', {
      type: 'directional',
      color: new pc.Color(1, 0.72, 0.52),
      intensity: 1.45,
      castShadows: true,
      shadowResolution: 1024,
      shadowDistance: 35
    });
    light.setEulerAngles(48, 35, 0);
    this.app.root.addChild(light);

    const camera = new pc.Entity('camera');
    camera.addComponent('camera', {
      clearColor: new pc.Color(0.035, 0.045, 0.055),
      farClip: 80,
      fov: 46
    });
    camera.setPosition(12, 15, 13);
    camera.lookAt(0, 0, 0);
    this.app.root.addChild(camera);
    return camera;
  }

  private createPlayer(): pc.Entity {
    const material = createMaterial(new pc.Color(0.14, 0.38, 0.43), new pc.Color(0.02, 0.16, 0.2));
    return createPrimitive(this.app, 'player', 'capsule', material, new pc.Vec3(0, 0.95, 4), new pc.Vec3(1.05, 1.8, 1.05));
  }

  private createAimMarker(): pc.Entity {
    const material = createMaterial(new pc.Color(0.8, 0.24, 0.05), new pc.Color(0.8, 0.12, 0.02));
    return createPrimitive(this.app, 'aim-marker', 'cylinder', material, new pc.Vec3(0, 0.03, 0), new pc.Vec3(0.25, 0.03, 0.25));
  }

  private update(dt: number): void {
    this.attackTimer = Math.max(0, this.attackTimer - dt);
    this.skillTimer = Math.max(0, this.skillTimer - dt);
    this.dashTimer = Math.max(0, this.dashTimer - dt);
    this.invulnerabilityTimer = Math.max(0, this.invulnerabilityTimer - dt);

    if (this.state === 'playing') {
      this.updatePlayer(dt);
      this.updateEnemies(dt);
      this.updateCompanions(dt);
      this.updateProjectiles(dt);
      this.checkRoomCompletion();
    }

    const room = this.rooms[this.roomIndex] as RoomDefinition;
    this.hud.update({
      health: this.health,
      maxHealth: this.maxHealth,
      level: this.level,
      experience: this.experience,
      experienceToNext: this.experienceToNext,
      room: this.roomIndex + 1,
      roomCount: this.rooms.length,
      roomTitle: room.title,
      enemyCount: this.enemies.filter((enemy) => enemy.alive).length,
      coins: this.coins,
      relics: [...this.relics].map((id) => RELIC_CATALOG.find((relic) => relic.id === id)?.name ?? id),
      companions: this.companions.map((companion) => companion.name),
      synergy: this.synergy,
      seed: this.seedLabel,
      skillCooldown: this.skillTimer,
      dashCooldown: this.dashTimer,
      message: this.message
    });
  }

  private updatePlayer(dt: number): void {
    const movement = this.input.getMovement();
    const current = this.player.getPosition();
    const position = new pc.Vec3(current.x, current.y, current.z);

    if (this.input.consumeDash() && this.dashTimer <= 0) {
      const dashDirection = movement.lengthSq() > 0 ? movement : this.getAimDirection();
      position.add(dashDirection.mulScalar(GAME_CONFIG.player.dashDistance));
      this.dashTimer = GAME_CONFIG.player.dashCooldown * this.dashCooldownScale;
      this.invulnerabilityTimer = GAME_CONFIG.player.dashInvulnerability;
      flashEntity(this.player, new pc.Color(0.12, 0.85, 1), 0.16);
    } else {
      position.add(movement.mulScalar(this.moveSpeed * dt));
    }

    const half = GAME_CONFIG.arenaHalfSize - 0.7;
    position.set(pc.math.clamp(position.x, -half, half), 0.95, pc.math.clamp(position.z, -half, half));
    this.player.setPosition(position);

    const aimPoint = this.input.getAimPoint(this.camera, 0.03);
    this.aimMarker.setPosition(aimPoint.x, 0.03, aimPoint.z);
    const aimDirection = this.getAimDirection();
    this.player.lookAt(position.x + aimDirection.x, position.y, position.z + aimDirection.z);

    if (this.input.consumeAttack() && this.attackTimer <= 0) this.performAction(false);
    if (this.input.consumeSkill() && this.skillTimer <= 0) this.performAction(true);
    if (this.input.consumeSynergy()) this.performSynergy();
  }

  private getAimDirection(): pc.Vec3 {
    const direction = this.aimMarker.getPosition().clone().sub(this.player.getPosition());
    direction.set(direction.x, 0, direction.z);
    if (direction.lengthSq() < 0.001) return new pc.Vec3(0, 0, -1);
    return direction.normalize();
  }

  private performAction(skill: boolean): void {
    const direction = this.getAimDirection();
    const origin = this.player.getPosition().clone();
    const range = (skill ? GAME_CONFIG.player.skillRange : GAME_CONFIG.player.attackRange) * this.attackRangeScale;
    const baseAmount = skill ? this.skillPower : this.attackPower;
    const lowHealthMultiplier = this.relics.has('broken-crown') && this.health / this.maxHealth < 0.4 ? 1.35 : 1;
    const center = origin.clone().add(direction.clone().mulScalar(range * 0.58));

    const material = createMaterial(
      skill ? new pc.Color(0.85, 0.22, 0.03) : new pc.Color(0.48, 0.18, 0.04),
      skill ? new pc.Color(1, 0.18, 0.015) : new pc.Color(0.7, 0.08, 0.01)
    );
    const effect = createPrimitive(
      this.app,
      skill ? 'skill-effect' : 'attack-effect',
      'sphere',
      material,
      new pc.Vec3(center.x, 0.65, center.z),
      skill ? new pc.Vec3(3.4, 0.35, 3.4).mulScalar(this.attackRangeScale) : new pc.Vec3(1.8, 0.25, 1.8).mulScalar(this.attackRangeScale)
    );
    window.setTimeout(() => effect.destroy(), skill ? 160 : 90);

    let criticalHit = false;
    let hitCount = 0;
    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const offset = enemy.position.clone().sub(origin);
      const distance = offset.length();
      if (distance > range + enemy.radius) continue;
      offset.set(offset.x, 0, offset.z);
      const facing = offset.lengthSq() > 0 ? direction.dot(offset.normalize()) : 1;
      if (!skill && facing <= 0.18) continue;

      let amount = baseAmount * lowHealthMultiplier;
      if (this.relics.has('hunter-eye') && (enemy.kind === 'elite' || enemy.kind === 'boss')) amount *= 1.22;
      if (this.rng.next() < this.critChance) {
        amount *= this.critMultiplier;
        criticalHit = true;
      }
      enemy.applyHit(Math.round(amount));
      hitCount += 1;
    }
    if (this.companions.length > 0) this.synergy = Math.min(100, this.synergy + hitCount * (skill ? 4 : 2));

    if (skill) {
      this.skillTimer = GAME_CONFIG.player.skillCooldown * this.skillCooldownScale;
      this.message = criticalHit ? '余烬冲击 · 暴击' : '余烬冲击释放';
    } else {
      this.attackTimer = GAME_CONFIG.player.attackCooldown * this.attackCooldownScale;
      this.message = criticalHit ? '长枪横扫 · 暴击' : '长枪横扫';
    }
  }

  private performSynergy(): void {
    const count = this.companions.length;
    if (count === 0) {
      this.message = '尚未解救可以协同作战的伙伴';
      return;
    }
    if (this.synergy < 100) {
      this.message = `协同能量尚未充满 · ${Math.floor(this.synergy)}%`;
      return;
    }

    this.synergy = 0;
    const damage = count === 1 ? 34 : count === 2 ? 44 : 56;
    const origin = this.player.getPosition();
    const material = createMaterial(new pc.Color(0.5, 0.24, 0.7), new pc.Color(0.42, 0.1, 0.8));
    const effect = createPrimitive(
      this.app,
      'companion-synergy',
      'sphere',
      material,
      new pc.Vec3(origin.x, 0.55, origin.z),
      new pc.Vec3(8.5, 0.28, 8.5)
    );
    window.setTimeout(() => effect.destroy(), 260);

    for (const enemy of this.enemies) {
      if (enemy.alive) enemy.applyHit(damage);
    }
    if (count >= 2) this.invulnerabilityTimer = Math.max(this.invulnerabilityTimer, 1.5);
    if (count >= 3) {
      this.health = Math.min(this.maxHealth, this.health + 28);
      this.invulnerabilityTimer = Math.max(this.invulnerabilityTimer, 2);
    }
    this.message = count === 1 ? '弦羽 · 箭雨' : count === 2 ? '弦羽与壁垒 · 守护箭阵' : '三人协同 · 星辉回响';
  }

  private updateEnemies(dt: number): void {
    const playerPosition = this.player.getPosition().clone();
    for (const enemy of this.enemies) enemy.update(dt, playerPosition, (amount) => this.receiveImpact(amount));
  }

  private updateCompanions(dt: number): void {
    const playerPosition = this.player.getPosition().clone();
    for (const companion of this.companions) {
      companion.update(dt, playerPosition, this.enemies, (amount) => {
        const previous = this.health;
        this.health = Math.min(this.maxHealth, this.health + amount);
        if (this.health > previous) this.message = `星眠为队伍恢复 ${amount} 点生命`;
      });
    }
  }

  private updateProjectiles(dt: number): void {
    const playerPosition = this.player.getPosition();
    for (const projectile of this.projectiles) {
      projectile.update(dt);
      if (projectile.alive && projectile.position.distance(playerPosition) < projectile.radius + 0.65) {
        projectile.destroy();
        this.receiveImpact(projectile.amount);
      }
    }
    this.projectiles = this.projectiles.filter((projectile) => projectile.alive);
  }

  private receiveImpact(amount: number): void {
    if (this.invulnerabilityTimer > 0 || this.state !== 'playing') return;
    const reducedAmount = Math.max(1, amount * (1 - Math.min(0.65, this.damageReduction)));
    this.health -= reducedAmount;
    this.invulnerabilityTimer = 0.45;
    flashEntity(this.player, new pc.Color(1, 0.04, 0.02), 0.12);
    this.message = `受到 ${Math.ceil(reducedAmount)} 点伤害`;

    if (this.health > 0) return;
    if (this.deathSaveAvailable) {
      this.deathSaveAvailable = false;
      this.health = 1;
      this.invulnerabilityTimer = 1.5;
      this.message = '灰烬斗篷替你承受了死亡';
      return;
    }
    this.finishRun(false);
  }

  private enterRoom(index: number): void {
    this.clearCombatEntities();
    this.roomIndex = index;
    this.profile.markRoom(index + 1);
    this.player.setPosition(0, 0.95, 4);
    const room = this.rooms[index] as RoomDefinition;

    if (index > 0 && this.relics.has('empty-bottle')) this.health = Math.min(this.maxHealth, this.health + 18);
    this.message = `进入 ${room.title}`;

    if (room.kind === 'relic') {
      this.presentRelic(() => this.completeRoom());
      return;
    }

    this.state = 'playing';
    let spawnIndex = 0;
    const order: readonly EnemyKind[] = ['melee', 'ranged', 'elite', 'boss'];
    for (const kind of order) {
      const count = room.enemies[kind] ?? 0;
      for (let current = 0; current < count; current += 1) {
        const position = kind === 'boss' ? new pc.Vec3(0, 1.6, -4) : this.spawnPosition(spawnIndex++);
        this.spawnEnemy(kind, position);
      }
    }
  }

  private spawnPosition(index: number): pc.Vec3 {
    const angle = (index / 7) * Math.PI * 2 + this.roomIndex * 0.7 + this.rng.next() * 0.35;
    const radius = 6.6 + (index % 2) * 1.2;
    return new pc.Vec3(Math.cos(angle) * radius, 0.85, Math.sin(angle) * radius - 1.2);
  }

  private spawnEnemy(kind: EnemyKind, position: pc.Vec3): void {
    const difficultyScale = 1 + this.roomIndex * 0.16;
    this.enemies.push(new Enemy(
      this.app,
      kind,
      position,
      this.rng.next() - 0.5,
      difficultyScale,
      (reward) => this.handleDefeat(reward),
      (projectilePosition, direction, amount) => {
        this.projectiles.push(new Projectile(this.app, projectilePosition, direction, amount));
      }
    ));
  }

  private handleDefeat(reward: DefeatReward): void {
    this.kills += 1;
    this.coins += Math.round(reward.coins * this.coinMultiplier);
    this.health = Math.min(this.maxHealth, this.health + this.healOnKill);
    this.gainExperience(reward.experience);
    if (this.companions.length > 0) this.synergy = Math.min(100, this.synergy + (reward.kind === 'boss' ? 24 : reward.kind === 'elite' ? 18 : 11));
    this.message = reward.kind === 'boss' ? '灰烬守卫已被击败' : `获得 ${reward.experience} 经验与 ${reward.coins} 金币`;
  }

  private gainExperience(amount: number): void {
    this.experience += amount;
    while (this.experience >= this.experienceToNext) {
      this.experience -= this.experienceToNext;
      this.level += 1;
      this.pendingLevels += 1;
      this.experienceToNext = GAME_CONFIG.progression.baseExperience + (this.level - 1) * GAME_CONFIG.progression.experienceGrowth;
    }
  }

  private checkRoomCompletion(): void {
    if (this.enemies.some((enemy) => enemy.alive)) return;
    const room = this.rooms[this.roomIndex] as RoomDefinition;
    this.state = 'room-complete';
    this.projectiles.forEach((projectile) => projectile.destroy());
    this.projectiles = [];

    if (room.kind === 'boss') {
      this.finishRun(true);
      return;
    }

    const afterLevels = (): void => {
      if (room.kind === 'elite') this.presentRelic(() => this.completeRoom());
      else this.completeRoom();
    };

    if (this.pendingLevels > 0) this.presentNextUpgrade(afterLevels);
    else afterLevels();
  }

  private presentNextUpgrade(after: () => void): void {
    if (this.pendingLevels <= 0) {
      after();
      return;
    }

    const available = UPGRADE_CATALOG.filter((definition) => (this.upgradeLevels.get(definition.id) ?? 0) < definition.maxLevel);
    const choices = this.rng.shuffle(available).slice(0, 3).map((definition) => ({
      definition,
      currentLevel: this.upgradeLevels.get(definition.id) ?? 0
    }));

    if (choices.length === 0) {
      this.pendingLevels = 0;
      after();
      return;
    }

    this.state = 'choosing-upgrade';
    this.hud.showUpgrade(choices, (id) => {
      this.applyUpgrade(id);
      this.pendingLevels -= 1;
      this.presentNextUpgrade(after);
    });
  }

  private presentRelic(after: () => void): void {
    const available = RELIC_CATALOG.filter((definition) => !this.relics.has(definition.id));
    const choices = this.rng.shuffle(available).slice(0, 3);
    if (choices.length === 0) {
      after();
      return;
    }

    this.state = 'choosing-relic';
    this.hud.showRelic(choices, (id) => {
      this.applyRelic(id);
      after();
    });
  }

  private applyUpgrade(id: UpgradeId): void {
    const nextLevel = (this.upgradeLevels.get(id) ?? 0) + 1;
    this.upgradeLevels.set(id, nextLevel);

    if (id === 'damage') {
      this.attackPower *= 1.18;
      this.skillPower *= 1.18;
    } else if (id === 'vitality') {
      this.maxHealth += 24;
      this.health = Math.min(this.maxHealth, this.health + 24);
    } else if (id === 'haste') {
      this.moveSpeed *= 1.1;
      this.skillCooldownScale *= 0.92;
    } else if (id === 'reach') {
      this.attackRangeScale *= 1.14;
    } else if (id === 'dash') {
      this.dashCooldownScale *= 0.86;
    } else if (id === 'critical') {
      this.critChance += 0.08;
    } else if (id === 'focus') {
      this.skillPower *= 1.24;
    } else if (id === 'guard') {
      this.damageReduction += 0.07;
    } else if (id === 'recovery') {
      this.healOnKill += 2;
    } else if (id === 'fury') {
      this.attackCooldownScale *= 0.91;
    } else if (id === 'fortune') {
      this.coinMultiplier *= 1.25;
    } else if (id === 'surge') {
      this.skillPower *= 1.1;
      this.attackRangeScale *= 1.18;
    }
    this.message = `强化已生效 · Lv.${nextLevel}`;
  }

  private applyRelic(id: RelicId): void {
    this.relics.add(id);
    if (id === 'iron-oath') this.damageReduction += 0.12;
    if (id === 'echo-stone') this.skillCooldownScale *= 0.8;
    if (id === 'ash-cloak') this.deathSaveAvailable = true;
    const name = RELIC_CATALOG.find((relic) => relic.id === id)?.name ?? id;
    this.message = `获得遗物 · ${name}`;
  }

  private unlockCompanion(): string | null {
    const roomNumber = this.roomIndex + 1;
    const unlocks: Partial<Record<number, CompanionKind>> = {
      2: 'archer',
      3: 'guardian',
      4: 'support'
    };
    const kind = unlocks[roomNumber];
    if (!kind || this.companions.some((companion) => companion.kind === kind)) return null;

    const companion = new Companion(this.app, kind, this.player.getPosition().clone());
    this.companions.push(companion);
    this.synergy = Math.max(this.synergy, 35);
    return COMPANION_NAMES[kind];
  }

  private completeRoom(): void {
    const nextRoom = this.rooms[this.roomIndex + 1];
    if (!nextRoom) {
      this.finishRun(true);
      return;
    }

    const unlocked = this.unlockCompanion();
    this.state = 'room-complete';
    const unlockText = unlocked ? `伙伴「${unlocked}」已加入队伍。` : '';
    const detail = `${unlockText} 当前等级 ${this.level}，金币 ${this.coins}。下一房间：${nextRoom.title}`.trim();
    this.hud.showRoomComplete((this.rooms[this.roomIndex] as RoomDefinition).title, detail, () => this.enterRoom(this.roomIndex + 1));
  }

  private finishRun(victory: boolean): void {
    if (this.state === 'won' || this.state === 'lost') return;
    this.health = Math.max(0, this.health);
    this.state = victory ? 'won' : 'lost';
    const profile = this.profile.finishRun({
      victory,
      room: this.roomIndex + 1,
      kills: this.kills,
      level: this.level,
      coins: this.coins
    });

    this.hud.showResult(
      victory,
      {
        seed: this.seedLabel,
        room: this.roomIndex + 1,
        kills: this.kills,
        level: this.level,
        coins: this.coins,
        profile
      },
      () => window.location.reload(),
      () => {
        const url = new URL(window.location.href);
        url.searchParams.set('seed', `${Date.now().toString(36)}-${Math.floor(Math.random() * 0xffffff).toString(36)}`);
        window.location.assign(url);
      }
    );
  }

  private clearCombatEntities(): void {
    for (const enemy of this.enemies) {
      if (enemy.alive) enemy.entity.destroy();
    }
    for (const projectile of this.projectiles) projectile.destroy();
    this.enemies = [];
    this.projectiles = [];
  }
}
