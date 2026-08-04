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
  waves: [
    { melee: 5, ranged: 0, boss: false },
    { melee: 4, ranged: 2, boss: false },
    { melee: 0, ranged: 0, boss: true }
  ]
} as const;

export type UpgradeId = 'damage' | 'vitality' | 'haste';

export const UPGRADES: ReadonlyArray<{
  id: UpgradeId;
  name: string;
  description: string;
}> = [
  { id: 'damage', name: '灼锋', description: '普通攻击与技能伤害提高 25%' },
  { id: 'vitality', name: '余火护体', description: '最大生命提高 30，并立即恢复 30' },
  { id: 'haste', name: '疾行余烬', description: '移动速度提高 15%，技能冷却缩短 15%' }
];
