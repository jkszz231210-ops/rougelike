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

export type RoomKind = 'combat' | 'relic' | 'elite' | 'merchant' | 'rest' | 'event' | 'boss';
export type RouteRisk = 0 | 1 | 2 | 3 | 4 | 5;

export interface RoomDefinition {
  id: string;
  title: string;
  kind: RoomKind;
  description: string;
  reward: string;
  risk: RouteRisk;
  enemies: Partial<Record<EnemyKind, number>>;
}

export type RouteLayer = readonly RoomDefinition[];

export const ROOM_KIND_LABELS: Readonly<Record<RoomKind, string>> = {
  combat: '战斗',
  relic: '遗物',
  elite: '精英',
  merchant: '商店',
  rest: '营火',
  event: '事件',
  boss: '首领'
};

function room(
  id: string,
  title: string,
  kind: RoomKind,
  description: string,
  reward: string,
  risk: RouteRisk,
  enemies: Partial<Record<EnemyKind, number>> = {}
): RoomDefinition {
  return { id, title, kind, description, reward, risk, enemies };
}

/**
 * Generates the complete V0.6 route graph up front so the same seed always
 * produces the same choices, enemy counts and node ordering.
 */
export function createRoguelikeRoute(rng: SeededRng): RouteLayer[] {
  const layer = (...nodes: RoomDefinition[]): RouteLayer => rng.shuffle(nodes);

  return [
    [room(
      'ashen-outskirts',
      '灰烬外环',
      'combat',
      '远征的入口。敌人稀少，适合建立第一组强化。',
      '经验 · 灰金币',
      1,
      { melee: 3 }
    )],
    layer(
      room(
        'shattered-aqueduct',
        '断流引渠',
        'combat',
        '狭长水渠将战场切成两翼，远程敌人开始出现。',
        '经验 · 灰金币',
        2,
        { melee: rng.int(3, 4), ranged: 1 }
      ),
      room(
        'weeping-fork',
        '哭泣岔道',
        'event',
        '一条没有敌人的岔路，墙后传来无法分辨来源的低语。',
        '未知事件',
        1
      )
    ),
    layer(
      room(
        'inverted-crypt',
        '倒悬墓道',
        'combat',
        '墓道开阔但缺乏掩体，敌群会从多个方向逼近。',
        '经验 · 灰金币',
        2,
        { melee: 3, ranged: 2 }
      ),
      room(
        'iron-campfire',
        '黑铁营火',
        'rest',
        '一处仍有余温的安全营地，可以休整或强化武器。',
        '恢复 · 锻造',
        0
      ),
      room(
        'ash-caravan',
        '拾烬商旅',
        'merchant',
        '流浪商人只接受从怪物身上取得的灰金币。',
        '购买强化',
        0
      )
    ),
    layer(
      room(
        'ember-gate',
        '余烬门卫',
        'elite',
        '通往深层的铁门被精英卫士封锁。',
        '遗物 · 高额经验',
        3,
        { melee: 2, ranged: 1, elite: 1 }
      ),
      room(
        'nameless-shrine',
        '无名圣龛',
        'relic',
        '没有守卫，只有三件等待新主人的旧时代遗物。',
        '免费遗物',
        0
      )
    ),
    layer(
      room(
        'bone-orchard',
        '白骨荒圃',
        'combat',
        '枯骨像作物一样从土地里生长，敌群数量明显增加。',
        '经验 · 灰金币',
        2,
        { melee: rng.int(4, 5), ranged: 2 }
      ),
      room(
        'bone-bell-tree',
        '骨铃树',
        'event',
        '骨制风铃在没有风的地方自行作响。',
        '未知事件',
        2
      ),
      room(
        'salt-ash-stall',
        '盐灰商亭',
        'merchant',
        '比上一位商人更深入荒原，也更懂得如何给冒险者定价。',
        '购买强化',
        0
      )
    ),
    layer(
      room(
        'sunken-cloister',
        '沉水回廊',
        'combat',
        '积水与断墙迫使你在狭窄路线中处理近远程混编敌群。',
        '经验 · 灰金币',
        3,
        { melee: 3, ranged: rng.int(2, 3), elite: 1 }
      ),
      room(
        'stillwater-camp',
        '静水营地',
        'rest',
        '潮湿而安静的临时营火，足够让队伍重新整理状态。',
        '恢复 · 锻造',
        0
      )
    ),
    layer(
      room(
        'starfall-wardens',
        '坠星秘库卫士',
        'elite',
        '秘库入口由重甲守卫看守，胜利能换来高价值遗物。',
        '遗物 · 高额经验',
        4,
        { melee: 2, ranged: 2, elite: 1 }
      ),
      room(
        'starfall-archive',
        '坠星秘库',
        'relic',
        '星辉仍残留在封存的遗物上。',
        '免费遗物',
        0
      ),
      room(
        'fractured-star-rite',
        '裂星祭仪',
        'event',
        '一场被中断的仪式仍在缓慢消耗周围的光。',
        '高风险事件',
        3
      )
    ),
    layer(
      room(
        'furnace-heart',
        '熔炉心室',
        'combat',
        '地面热浪不断升高，敌人的编队也开始更具压迫感。',
        '高额经验 · 灰金币',
        3,
        { melee: 4, ranged: 2, elite: 1 }
      ),
      room(
        'forge-market',
        '熔铸商站',
        'merchant',
        '最后一处稳定补给点，价格昂贵但能决定终局强度。',
        '高级强化',
        0
      )
    ),
    layer(
      room(
        'last-causeway',
        '终焰长桥',
        'elite',
        '通往王座的唯一道路，精英与远程单位共同封锁桥面。',
        '遗物 · 大量经验',
        5,
        { melee: 4, ranged: 2, elite: 2 }
      ),
      room(
        'bridge-campfire',
        '桥头营火',
        'rest',
        '最后一次安全休整。跨过前方的门就没有回头路。',
        '恢复 · 终局锻造',
        0
      ),
      room(
        'faceless-envoy',
        '无面使者',
        'event',
        '使者承诺力量，但代价直到选择后才会显现。',
        '高风险事件',
        4
      )
    ),
    [room(
      'warden-citadel',
      '灰烬守卫王座',
      'boss',
      '远征终点。Boss 会与残余守军同时进入战场。',
      '通关',
      5,
      { melee: 2, ranged: 2, boss: 1 }
    )]
  ];
}
