export type EnemyKind = 'melee' | 'ranged' | 'elite' | 'boss';

export const GAME_CONFIG = {
  arenaHalfSize: 11,
  player: {
    maxHealth: 100,
    moveSpeed: 6.5,
    attackDamage: 24,
    attackRange: 2.25,
    attackCooldown: 0.42,
    skillDamage: 42,
    skillRange: 4.25,
    skillCooldown: 4.5,
    dashDistance: 3.4,
    dashCooldown: 1.2,
    dashInvulnerability: 0.22
  },
  progression: {
    baseExperience: 58,
    experienceGrowth: 34
  },
  enemies: {
    melee: {
      health: 72,
      speed: 2.9,
      attackDistance: 1.35,
      attackCooldown: 1.2,
      damage: 14,
      experience: 18,
      coins: 5,
      radius: 0.7
    },
    ranged: {
      health: 58,
      speed: 2.4,
      attackDistance: 8.8,
      attackCooldown: 1.55,
      damage: 12,
      experience: 22,
      coins: 7,
      radius: 0.65
    },
    elite: {
      health: 230,
      speed: 2.65,
      attackDistance: 1.75,
      attackCooldown: 0.95,
      damage: 20,
      experience: 68,
      coins: 24,
      radius: 1.0
    },
    boss: {
      health: 760,
      speed: 2.2,
      attackDistance: 2.2,
      attackCooldown: 1.05,
      damage: 23,
      experience: 120,
      coins: 60,
      radius: 1.35
    }
  }
};
