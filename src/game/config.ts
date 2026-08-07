export type EnemyKind = 'melee' | 'ranged' | 'elite' | 'boss';

export const GAME_CONFIG = {
  arenaHalfSize: 11,
  player: {
    maxHealth: 130,
    moveSpeed: 6.8,
    attackDamage: 26,
    attackRange: 2.35,
    attackCooldown: 0.4,
    skillDamage: 46,
    skillRange: 4.4,
    skillCooldown: 4.3,
    dashDistance: 3.6,
    dashCooldown: 1.1,
    dashInvulnerability: 0.3,
    hitInvulnerability: 0.65
  },
  progression: {
    baseExperience: 52,
    experienceGrowth: 30
  },
  enemies: {
    melee: {
      health: 62,
      speed: 2.45,
      attackDistance: 1.42,
      attackCooldown: 1.65,
      windup: 0.48,
      damage: 8,
      experience: 19,
      coins: 5,
      radius: 0.7
    },
    ranged: {
      health: 52,
      speed: 2.15,
      attackDistance: 8.4,
      attackCooldown: 1.95,
      windup: 0.68,
      damage: 8,
      experience: 23,
      coins: 7,
      radius: 0.65
    },
    elite: {
      health: 190,
      speed: 2.35,
      attackDistance: 1.82,
      attackCooldown: 1.45,
      windup: 0.62,
      damage: 13,
      experience: 72,
      coins: 25,
      radius: 1.0
    },
    boss: {
      health: 650,
      speed: 1.95,
      attackDistance: 2.28,
      attackCooldown: 1.55,
      windup: 0.78,
      damage: 16,
      experience: 120,
      coins: 60,
      radius: 1.35
    }
  }
};
