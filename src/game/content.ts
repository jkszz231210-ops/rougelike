import type { EnemyKind } from './config';
import type { SeededRng } from './rng';

export type UpgradeId =
  | 'damage'
  | 'vitality'
  | 'haste'
  | 'reach'
  | 'dash'
  | 'critical'
  | 'focus'
  | 'guard'
  | 'recovery'
  | 'fury'
  | 'fortune'
  | 'surge';

export interface UpgradeDefinition {
  id: UpgradeId;
  name: string;
  description: string;
  maxLevel: number;
  rarity: '普通' | '稀有';
}

export const UPGRADE_CATALOG: readonly UpgradeDefinition[] = [
  { id: 'damage', name: '灼锋', description: '普通攻击与技能伤害提高 18%', maxLevel: 5, rarity: '普通' },
  { id: 'vitality', name: '余火护体', description: '最大生命提高 24，并立即恢复 24', maxLevel: 4, rarity: '普通' },
  { id: 'haste', name: '疾行余烬', description: '移动速度提高 10%，技能冷却缩短 8%', maxLevel: 4, rarity: '普通' },
  { id: 'reach', name: '延展锋芒', description: '普通攻击与技能范围提高 14%', maxLevel: 3, rarity: '普通' },
  { id: 'dash', name: '踏火', description: '闪避冷却缩短 14%', maxLevel: 4, rarity: '普通' },
  { id: 'critical', name: '裂命', description: '暴击率提高 8%', maxLevel: 4, rarity: '稀有' },
  { id: 'focus', name: '炉心专注', description: '主动技能伤害额外提高 24%', maxLevel: 4, rarity: '普通' },
  { id: 'guard', name: '焦壳', description: '受到的伤害降低 7%', maxLevel: 4, rarity: '普通' },
  { id: 'recovery', name: '夺火', description: '击败敌人恢复 2 点生命', maxLevel: 5, rarity: '普通' },
  { id: 'fury', name: '连燃', description: '普通攻击冷却缩短 9%', maxLevel: 4, rarity: '普通' },
  { id: 'fortune', name: '拾烬者', description: '获得的金币提高 25%', maxLevel: 3, rarity: '普通' },
  { id: 'surge', name: '焚潮', description: '技能范围提高 18%，技能伤害提高 10%', maxLevel: 3, rarity: '稀有' }
];

export type RelicId = 'broken-crown' | 'empty-bottle' | 'iron-oath' | 'hunter-eye' | 'echo-stone' | 'ash-cloak';

export interface RelicDefinition {
  id: RelicId;
  name: string;
  description: string;
}

export const RELIC_CATALOG: readonly RelicDefinition[] = [
  { id: 'broken-crown', name: '断裂王冠', description: '生命低于 40% 时，造成的伤害提高 35%' },
  { id: 'empty-bottle', name: '空瓶', description: '进入新房间时恢复 18 点生命' },
  { id: 'iron-oath', name: '铁誓', description: '受到的伤害降低 12%' },
  { id: 'hunter-eye', name: '猎手之眼', description: '对精英与 Boss 造成的伤害提高 22%' },
  { id: 'echo-stone', name: '回响石', description: '主动技能冷却缩短 20%' },
  { id: 'ash-cloak', name: '灰烬斗篷', description: '每局首次受到致命伤害时保留 1 点生命' }
];

export type RoomKind = 'combat' | 'relic' | 'elite' | 'boss';

export interface RoomDefinition {
  id: string;
  title: string;
  kind: RoomKind;
  enemies: Partial<Record<EnemyKind, number>>;
}

export function createStageRooms(rng: SeededRng): RoomDefinition[] {
  return [
    {
      id: 'outer-ring',
      title: '灰烬外环',
      kind: 'combat',
      enemies: { melee: rng.int(4, 6), ranged: rng.int(0, 1) }
    },
    {
      id: 'broken-corridor',
      title: '断墙回廊',
      kind: 'combat',
      enemies: { melee: rng.int(3, 5), ranged: rng.int(1, 2) }
    },
    {
      id: 'relic-sanctum',
      title: '无名遗物室',
      kind: 'relic',
      enemies: {}
    },
    {
      id: 'ember-gate',
      title: '余烬门卫',
      kind: 'elite',
      enemies: { melee: rng.int(2, 3), ranged: 1, elite: 1 }
    },
    {
      id: 'warden-arena',
      title: '灰烬守卫',
      kind: 'boss',
      enemies: { boss: 1 }
    }
  ];
}
