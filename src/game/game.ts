import * as pc from 'playcanvas';
import { Hud } from '../core/hud';
import { InputController } from '../core/input';
import { Enemy, type EnemyKind } from './enemy';
import { GAME_CONFIG, UPGRADES, type UpgradeId } from './config';
import { Projectile } from './projectile';
import { createMaterial, createPrimitive, flashEntity } from './visuals';

type GameState = 'playing' | 'choosing-upgrade' | 'won' | 'lost';

export class RogueliteGame {
  private readonly input: InputController;
  private readonly hud: Hud;
  private readonly player: pc.Entity;
  private readonly camera: pc.Entity;
  private readonly aimMarker: pc.Entity;
  private enemies: Enemy[] = [];
  private projectiles: Projectile[] = [];
  private state: GameState = 'playing';
  private waveIndex = 0;
  private health = GAME_CONFIG.player.maxHealth;
  private maxHealth = GAME_CONFIG.player.maxHealth;
  private attackPower = GAME_CONFIG.player.attackDamage;
  private skillPower = GAME_CONFIG.player.skillDamage;
  private moveSpeed = GAME_CONFIG.player.moveSpeed;
  private skillCooldownScale = 1;
  private attackTimer = 0;
  private skillTimer = 0;
  private dashTimer = 0;
  private invulnerabilityTimer = 0;
  private message = '清除灰烬荒原中的敌人';

  constructor(private readonly app: pc.Application, canvas: HTMLCanvasElement, hudRoot: HTMLElement) {
    this.input = new InputController(canvas);
    this.hud = new Hud(hudRoot);
    this.camera = this.createWorld();
    this.player = this.createPlayer();
    this.aimMarker = this.createAimMarker();
    this.spawnWave(0);
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

    for (let i = 0; i < 18; i += 1) {
      const angle = (i / 18) * Math.PI * 2;
      const radius = 8 + (i % 3);
      const ember = createMaterial(new pc.Color(0.12, 0.08, 0.06), new pc.Color(0.28, 0.055, 0.008));
      createPrimitive(
        this.app,
        `ember-${i}`,
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
      this.updateProjectiles(dt);
      this.checkWaveCompletion();
    }

    this.hud.update({
      health: this.health,
      maxHealth: this.maxHealth,
      wave: this.waveIndex + 1,
      enemyCount: this.enemies.filter((enemy) => enemy.alive).length,
      skillCooldown: this.skillTimer,
      dashCooldown: this.dashTimer,
      message: this.message
    });
  }

  private updatePlayer(dt: number): void {
    const movement = this.input.getMovement();
    const position = this.player.getPosition();

    if (this.input.consumeDash() && this.dashTimer <= 0) {
      const dashDirection = movement.lengthSq() > 0 ? movement : this.getAimDirection();
      position.add(dashDirection.mulScalar(GAME_CONFIG.player.dashDistance));
      this.dashTimer = GAME_CONFIG.player.dashCooldown;
      this.invulnerabilityTimer = GAME_CONFIG.player.dashInvulnerability;
      flashEntity(this.player, new pc.Color(0.12, 0.85, 1), 0.16);
    } else {
      position.add(movement.mulScalar(this.moveSpeed * dt));
    }

    const half = GAME_CONFIG.arenaHalfSize - 0.7;
    position.x = pc.math.clamp(position.x, -half, half);
    position.z = pc.math.clamp(position.z, -half, half);
    position.y = 0.95;
    this.player.setPosition(position);

    const aimPoint = this.input.getAimPoint(this.camera, 0.03);
    this.aimMarker.setPosition(aimPoint.x, 0.03, aimPoint.z);
    const aimDirection = this.getAimDirection();
    this.player.lookAt(position.x + aimDirection.x, position.y, position.z + aimDirection.z);

    if (this.input.consumeAttack() && this.attackTimer <= 0) this.performAction(false);
    if (this.input.consumeSkill() && this.skillTimer <= 0) this.performAction(true);
  }

  private getAimDirection(): pc.Vec3 {
    const direction = this.aimMarker.getPosition().clone().sub(this.player.getPosition());
    direction.y = 0;
    if (direction.lengthSq() < 0.001) return new pc.Vec3(0, 0, -1);
    return direction.normalize();
  }

  private performAction(skill: boolean): void {
    const direction = this.getAimDirection();
    const origin = this.player.getPosition().clone();
    const range = skill ? GAME_CONFIG.player.skillRange : GAME_CONFIG.player.attackRange;
    const amount = skill ? this.skillPower : this.attackPower;
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
      skill ? new pc.Vec3(3.4, 0.35, 3.4) : new pc.Vec3(1.8, 0.25, 1.8)
    );
    window.setTimeout(() => effect.destroy(), skill ? 160 : 90);

    for (const enemy of this.enemies) {
      if (!enemy.alive) continue;
      const offset = enemy.position.clone().sub(origin);
      const distance = offset.length();
      if (distance > range + enemy.radius) continue;
      offset.y = 0;
      const facing = offset.lengthSq() > 0 ? direction.dot(offset.normalize()) : 1;
      if (skill || facing > 0.18) enemy.applyHit(amount);
    }

    if (skill) {
      this.skillTimer = GAME_CONFIG.player.skillCooldown * this.skillCooldownScale;
      this.message = '余烬冲击释放';
    } else {
      this.attackTimer = GAME_CONFIG.player.attackCooldown;
      this.message = '长枪横扫';
    }
  }

  private updateEnemies(dt: number): void {
    const playerPosition = this.player.getPosition().clone();
    for (const enemy of this.enemies) {
      enemy.update(dt, playerPosition, (amount) => this.receiveImpact(amount));
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
    this.health -= amount;
    this.invulnerabilityTimer = 0.45;
    flashEntity(this.player, new pc.Color(1, 0.04, 0.02), 0.12);
    this.message = `受到 ${amount} 点伤害`;
    if (this.health <= 0) {
      this.health = 0;
      this.state = 'lost';
      this.hud.showResult(false, () => window.location.reload());
    }
  }

  private spawnWave(index: number): void {
    this.waveIndex = index;
    const wave = GAME_CONFIG.waves[index];
    if (!wave) return;
    this.message = wave.boss ? '灰烬守卫苏醒' : `第 ${index + 1} 波来袭`;

    if (wave.boss) {
      this.spawnEnemy('boss', new pc.Vec3(0, 1.6, -4));
      return;
    }

    let spawnIndex = 0;
    for (let i = 0; i < wave.melee; i += 1) this.spawnEnemy('melee', this.spawnPosition(spawnIndex++));
    for (let i = 0; i < wave.ranged; i += 1) this.spawnEnemy('ranged', this.spawnPosition(spawnIndex++));
  }

  private spawnPosition(index: number): pc.Vec3 {
    const angle = (index / 7) * Math.PI * 2 + this.waveIndex * 0.7;
    const radius = 6.8 + (index % 2) * 1.2;
    return new pc.Vec3(Math.cos(angle) * radius, 0.85, Math.sin(angle) * radius - 1.5);
  }

  private spawnEnemy(kind: EnemyKind, position: pc.Vec3): void {
    this.enemies.push(new Enemy(
      this.app,
      kind,
      position,
      () => { this.message = kind === 'boss' ? '灰烬守卫已被击败' : '敌人化为余烬'; },
      (projectilePosition, direction, amount) => {
        this.projectiles.push(new Projectile(this.app, projectilePosition, direction, amount));
      }
    ));
  }

  private checkWaveCompletion(): void {
    if (this.enemies.some((enemy) => enemy.alive)) return;
    this.enemies = [];
    this.projectiles.forEach((projectile) => projectile.destroy());
    this.projectiles = [];

    if (this.waveIndex >= GAME_CONFIG.waves.length - 1) {
      this.state = 'won';
      this.message = '灰烬荒原已肃清';
      this.hud.showResult(true, () => window.location.reload());
      return;
    }

    if (this.waveIndex === 0) {
      this.state = 'choosing-upgrade';
      this.message = '选择强化后继续';
      this.hud.showUpgrade(UPGRADES, (id) => {
        this.applyUpgrade(id);
        this.state = 'playing';
        this.spawnWave(1);
      });
      return;
    }

    this.spawnWave(this.waveIndex + 1);
  }

  private applyUpgrade(id: UpgradeId): void {
    if (id === 'damage') {
      this.attackPower *= 1.25;
      this.skillPower *= 1.25;
    } else if (id === 'vitality') {
      this.maxHealth += 30;
      this.health = Math.min(this.maxHealth, this.health + 30);
    } else {
      this.moveSpeed *= 1.15;
      this.skillCooldownScale *= 0.85;
    }
    this.message = '强化已生效';
  }
}
