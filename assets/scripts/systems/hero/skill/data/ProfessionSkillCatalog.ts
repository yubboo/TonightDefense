import {
    ProfessionId,
} from '../../profession/definition/ProfessionTypes';

import {
    ProfessionSkillDefinition,
    ProfessionSkillLevelTuning,
    ProfessionSkillModule,
} from './ProfessionSkillTypes';

import {
    BattleArtKey,
} from '../../../../ui/resources/BattleArt';

const SLOT_ICONS:
    readonly [
        BattleArtKey,
        BattleArtKey,
        BattleArtKey,
        BattleArtKey,
    ] = [
        'skill-flame-bolt',
        'skill-flame-ring',
        'skill-crimson-guard',
        'skill-meteor',
    ];

const PASSIVE_ICON: BattleArtKey =
    'skill-crimson-guard';

function passive(
    professionId: ProfessionId,
    id: string,
    name: string,
    levels: ProfessionSkillDefinition['levels'],
): ProfessionSkillDefinition {
    return {
        id,
        professionId,
        name,
        kind: 'passive',
        slotIndex: -1,
        targetMode: 'SELF',
        behavior: 'passive',
        baseCooldown: 0,
        icon: PASSIVE_ICON,
        levels,
    };
}

function active(
    professionId: ProfessionId,
    slotIndex: 0 | 1 | 2 | 3,
    id: string,
    name: string,
    baseCooldown: number,
    targetMode: ProfessionSkillDefinition['targetMode'],
    behavior: ProfessionSkillDefinition['behavior'],
    levels: ProfessionSkillDefinition['levels'],
): ProfessionSkillDefinition {
    return {
        id,
        professionId,
        name,
        kind: 'active',
        slotIndex,
        targetMode,
        behavior,
        baseCooldown,
        icon: SLOT_ICONS[slotIndex],
        levels,
    };
}

/**
 * 战士 / 重装战士
 * 设计目标：近战持续输出、半肉、越战越勇。
 */
const WARRIOR_MODULE: ProfessionSkillModule = {
    professionId: 'heavy_warrior',
    passive: passive(
        'heavy_warrior',
        'warrior_battle_fury',
        '战意沸腾',
        [
            { description: '每5秒获得1层战意；每层+2%攻击，最多5层。', attackBonus: 0.02, duration: 5, specialTags: ['fury-stack:5'] },
            { description: '战意叠层间隔缩短为4.5秒。', attackBonus: 0.02, duration: 4.5, specialTags: ['fury-stack:5'] },
            { description: '每层攻击加成提高到2.5%。', attackBonus: 0.025, duration: 4.5, specialTags: ['fury-stack:5'] },
            { description: '战意上限提高到6层。', attackBonus: 0.025, duration: 4.5, specialTags: ['fury-stack:6'] },
            { description: '满层时额外获得10%冷却恢复。', attackBonus: 0.025, duration: 4.5, specialTags: ['fury-stack:6', 'full-fury-cdr:0.10'] },
        ],
    ),
    activeSkills: [
        active(
            'heavy_warrior', 0,
            'warrior_whirlwind', '旋风斩', 7,
            'AROUND_SELF', 'area_damage',
            [
                { description: '3段旋斩，每段70%攻击。', damageRatio: 0.70, hitCount: 3, radius: 175 },
                { description: '每段伤害提高到85%。', damageRatio: 0.85, hitCount: 3, radius: 175 },
                { description: '范围提高20%。', damageRatio: 0.85, hitCount: 3, radius: 210 },
                { description: '4段旋斩，每段90%攻击。', damageRatio: 0.90, hitCount: 4, radius: 210 },
                { description: '4段100%，并轻微牵引普通敌人。', damageRatio: 1.00, hitCount: 4, radius: 220, specialTags: ['pull-light'] },
            ],
        ),
        active(
            'heavy_warrior', 1,
            'warrior_earthsplitter', '裂地斩', 9,
            'FRONT_LINE', 'line_damage',
            [
                { description: '前方直线造成180%攻击并击退。', damageRatio: 1.80, range: 320, radius: 74, knockback: 55 },
                { description: '伤害提高到220%。', damageRatio: 2.20, range: 320, radius: 74, knockback: 55 },
                { description: '宽度和距离提高25%。', damageRatio: 2.20, range: 400, radius: 92, knockback: 55 },
                { description: '260%攻击，击退增强。', damageRatio: 2.60, range: 400, radius: 92, knockback: 90 },
                { description: '留下2秒裂隙，持续造成伤害并减速。', damageRatio: 2.60, range: 420, radius: 96, knockback: 90, slowRatio: 0.30, duration: 2, specialTags: ['ground-rift'] },
            ],
        ),
        active(
            'heavy_warrior', 2,
            'warrior_bloodrush_combo', '血怒连斩', 10,
            'HIGHEST_HP_ENEMY', 'multi_hit',
            [
                { description: '对高血量目标连续4斩，每斩55%。', damageRatio: 0.55, hitCount: 4, range: 360 },
                { description: '每斩提高到65%。', damageRatio: 0.65, hitCount: 4, range: 360 },
                { description: '提升为5斩，每斩65%。', damageRatio: 0.65, hitCount: 5, range: 360 },
                { description: '技能暴击率提高20%。', damageRatio: 0.72, hitCount: 5, range: 360, specialTags: ['skill-crit:0.20'] },
                { description: '对精英与Boss额外造成30%伤害。', damageRatio: 0.72, hitCount: 5, range: 380, eliteBossDamageBonus: 0.30 },
            ],
        ),
        active(
            'heavy_warrior', 3,
            'warrior_warcry', '战吼', 15,
            'ALL_ALLIES', 'team_buff',
            [
                { description: '全队+15%攻击、+10%攻速，持续6秒。', attackBonus: 0.15, attackSpeedBonus: 0.10, duration: 6 },
                { description: '持续时间提高到7秒。', attackBonus: 0.15, attackSpeedBonus: 0.10, duration: 7 },
                { description: '攻击加成提高到20%。', attackBonus: 0.20, attackSpeedBonus: 0.10, duration: 7 },
                { description: '攻速加成提高到15%。', attackBonus: 0.20, attackSpeedBonus: 0.15, duration: 7 },
                { description: '前3秒额外获得15%减伤。', attackBonus: 0.20, attackSpeedBonus: 0.15, damageReduction: 0.15, duration: 7, specialTags: ['opening-reduction:3'] },
            ],
        ),
    ],
};

/** 坦克 / 守护骑士 */
const TANK_MODULE: ProfessionSkillModule = {
    professionId: 'guardian_knight',
    passive: passive(
        'guardian_knight',
        'tank_iron_wall',
        '钢铁壁垒',
        [
            { description: '每次受击获得2%减伤，持续4秒，最多5层。', damageReduction: 0.02, duration: 4, specialTags: ['hit-stack:5'] },
            { description: '减伤层数上限提高到6层。', damageReduction: 0.02, duration: 4, specialTags: ['hit-stack:6'] },
            { description: '每层减伤提高到2.5%。', damageReduction: 0.025, duration: 4, specialTags: ['hit-stack:6'] },
            { description: '层数持续时间提高到6秒。', damageReduction: 0.025, duration: 6, specialTags: ['hit-stack:6'] },
            { description: '满层时周期性获得5%最大生命护盾。', damageReduction: 0.025, duration: 6, shieldMaxHpRatio: 0.05, specialTags: ['hit-stack:6', 'full-stack-shield'] },
        ],
    ),
    activeSkills: [
        active(
            'guardian_knight', 0,
            'tank_shield_bash', '盾牌猛击', 8,
            'FRONT_CONE', 'cone_damage',
            [
                { description: '扇形140%攻击并眩晕1.2秒。', damageRatio: 1.40, range: 190, radius: 110, stunDuration: 1.2 },
                { description: '伤害提高到170%。', damageRatio: 1.70, range: 190, radius: 110, stunDuration: 1.2 },
                { description: '扇形范围提高20%。', damageRatio: 1.70, range: 225, radius: 132, stunDuration: 1.2 },
                { description: '眩晕提高到1.6秒。', damageRatio: 1.70, range: 225, radius: 132, stunDuration: 1.6 },
                { description: '额外产生第二道冲击波。', damageRatio: 1.70, hitCount: 2, range: 245, radius: 138, stunDuration: 1.6 },
            ],
        ),
        active(
            'guardian_knight', 1,
            'tank_taunting_roar', '嘲讽怒吼', 13,
            'AROUND_SELF', 'area_damage',
            [
                { description: '范围嘲讽3秒，并使敌人伤害降低10%。', damageRatio: 0.35, radius: 220, duration: 3, specialTags: ['taunt', 'enemy-damage-down:0.10'] },
                { description: '范围提高20%。', damageRatio: 0.35, radius: 265, duration: 3, specialTags: ['taunt', 'enemy-damage-down:0.10'] },
                { description: '嘲讽持续3.5秒。', damageRatio: 0.35, radius: 265, duration: 3.5, specialTags: ['taunt', 'enemy-damage-down:0.10'] },
                { description: '敌人伤害降低提高到15%。', damageRatio: 0.35, radius: 265, duration: 3.5, specialTags: ['taunt', 'enemy-damage-down:0.15'] },
                { description: '嘲讽结束后附加30%减速2秒。', damageRatio: 0.35, radius: 280, duration: 3.5, slowRatio: 0.30, specialTags: ['taunt', 'enemy-damage-down:0.15'] },
            ],
        ),
        active(
            'guardian_knight', 2,
            'tank_ground_stomp', '震地重踏', 10,
            'AROUND_SELF', 'area_damage',
            [
                { description: '120%攻击、40%减速3秒并轻击退。', damageRatio: 1.20, radius: 205, slowRatio: 0.40, duration: 3, knockback: 35 },
                { description: '伤害提高到150%。', damageRatio: 1.50, radius: 205, slowRatio: 0.40, duration: 3, knockback: 35 },
                { description: '范围提高20%。', damageRatio: 1.50, radius: 246, slowRatio: 0.40, duration: 3, knockback: 35 },
                { description: '减速提高到50%。', damageRatio: 1.50, radius: 246, slowRatio: 0.50, duration: 3, knockback: 35 },
                { description: '1秒后触发第二次80%攻击震波。', damageRatio: 1.50, hitCount: 2, radius: 255, slowRatio: 0.50, duration: 3, knockback: 35, specialTags: ['second-wave:0.80'] },
            ],
        ),
        active(
            'guardian_knight', 3,
            'tank_unyielding_bulwark', '不屈壁垒', 16,
            'ALL_ALLIES', 'team_shield',
            [
                { description: '自身20%最大生命护盾，队友8%，持续5秒。', shieldMaxHpRatio: 0.20, secondaryAllyRatio: 0.40, duration: 5 },
                { description: '自身护盾提高到25%。', shieldMaxHpRatio: 0.25, secondaryAllyRatio: 0.32, duration: 5 },
                { description: '队友护盾提高到12%。', shieldMaxHpRatio: 0.25, secondaryAllyRatio: 0.48, duration: 5 },
                { description: '持续时间提高到6秒。', shieldMaxHpRatio: 0.25, secondaryAllyRatio: 0.48, duration: 6 },
                { description: '护盾存在期间再获得10%减伤。', shieldMaxHpRatio: 0.25, secondaryAllyRatio: 0.48, damageReduction: 0.10, duration: 6 },
            ],
        ),
    ],
};

/** 游侠 */
const RANGER_MODULE: ProfessionSkillModule = {
    professionId: 'ranger',
    passive: passive(
        'ranger',
        'ranger_hunters_mark',
        '猎人印记',
        [
            { description: '命中附加5秒印记；目标受到游侠伤害+5%。', duration: 5, specialTags: ['hunter-mark:0.05'] },
            { description: '印记增伤提高到7%。', duration: 5, specialTags: ['hunter-mark:0.07'] },
            { description: '印记持续时间提高到7秒。', duration: 7, specialTags: ['hunter-mark:0.07'] },
            { description: '击杀印记敌人时，游侠技能冷却-0.35秒。', duration: 7, specialTags: ['hunter-mark:0.07', 'mark-kill-cdr:0.35'] },
            { description: '攻击印记目标时暴击率+10%。', duration: 7, specialTags: ['hunter-mark:0.07', 'mark-kill-cdr:0.35', 'mark-crit:0.10'] },
        ],
    ),
    activeSkills: [
        active(
            'ranger', 0,
            'ranger_multishot', '多重箭', 5,
            'FRONT_CONE', 'multi_target_damage',
            [
                { description: '发射5箭，每箭65%攻击。', damageRatio: 0.65, projectileCount: 5, range: 410, radius: 150 },
                { description: '提高到6箭。', damageRatio: 0.65, projectileCount: 6, range: 410, radius: 150 },
                { description: '每箭伤害提高到75%。', damageRatio: 0.75, projectileCount: 6, range: 410, radius: 150 },
                { description: '每箭可穿透1名敌人。', damageRatio: 0.75, projectileCount: 6, range: 430, radius: 155, specialTags: ['pierce:1'] },
                { description: '7箭×85%，优先覆盖印记目标。', damageRatio: 0.85, projectileCount: 7, range: 450, radius: 165, specialTags: ['pierce:1', 'prefer-mark'] },
            ],
        ),
        active(
            'ranger', 1,
            'ranger_piercing_arrow', '穿云箭', 8,
            'FRONT_LINE', 'line_damage',
            [
                { description: '直线贯穿造成220%，每穿过一名敌人衰减15%。', damageRatio: 2.20, range: 520, radius: 55, specialTags: ['pierce-falloff:0.15'] },
                { description: '伤害提高到250%。', damageRatio: 2.50, range: 520, radius: 55, specialTags: ['pierce-falloff:0.15'] },
                { description: '射程提高25%。', damageRatio: 2.50, range: 650, radius: 55, specialTags: ['pierce-falloff:0.15'] },
                { description: '无视20%防御。', damageRatio: 2.50, range: 650, radius: 55, defenseIgnoreRatio: 0.20, specialTags: ['pierce-falloff:0.15'] },
                { description: '不再穿透衰减，对精英/Boss额外+30%。', damageRatio: 2.50, range: 680, radius: 58, eliteBossDamageBonus: 0.30, specialTags: ['pierce-no-falloff'] },
            ],
        ),
        active(
            'ranger', 2,
            'ranger_arrow_rain', '箭雨', 11,
            'DENSEST_ENEMY_CLUSTER', 'area_damage',
            [
                { description: '5波箭雨，每波55%攻击。', damageRatio: 0.55, hitCount: 5, radius: 190, range: 520 },
                { description: '范围提高20%。', damageRatio: 0.55, hitCount: 5, radius: 228, range: 520 },
                { description: '附加20%减速。', damageRatio: 0.55, hitCount: 5, radius: 228, range: 520, slowRatio: 0.20, duration: 2 },
                { description: '6波，每波65%。', damageRatio: 0.65, hitCount: 6, radius: 228, range: 540, slowRatio: 0.20, duration: 2 },
                { description: '7波，最后一波获得额外暴击伤害。', damageRatio: 0.70, hitCount: 7, radius: 240, range: 560, slowRatio: 0.20, duration: 2, specialTags: ['last-wave-crit'] },
            ],
        ),
        active(
            'ranger', 3,
            'ranger_hawkeye_snipe', '鹰眼狙击', 12,
            'HIGHEST_HP_ENEMY', 'single_damage',
            [
                { description: '对高血量目标造成320%攻击。', damageRatio: 3.20, range: 700 },
                { description: '伤害提高到360%。', damageRatio: 3.60, range: 700 },
                { description: '技能暴击率+25%。', damageRatio: 3.60, range: 720, specialTags: ['skill-crit:0.25'] },
                { description: '对印记目标额外+40%。', damageRatio: 3.60, range: 720, specialTags: ['mark-bonus:0.40'] },
                { description: '击杀目标返还剩余冷却的50%。', damageRatio: 4.10, range: 760, cooldownRefundRatio: 0.50, specialTags: ['kill-refund'] },
            ],
        ),
    ],
};

/** 法师 / 元素法师 */
const MAGE_MODULE: ProfessionSkillModule = {
    professionId: 'element_mage',
    passive: passive(
        'element_mage',
        'mage_elemental_resonance',
        '元素共鸣',
        [
            { description: '主动技能施放获得共鸣；3层后下一技能伤害+30%、范围+20%。', specialTags: ['resonance:3', 'empower-damage:0.30', 'empower-radius:0.20'] },
            { description: '强化伤害提高到35%。', specialTags: ['resonance:3', 'empower-damage:0.35', 'empower-radius:0.20'] },
            { description: '共鸣层持续提高到12秒。', duration: 12, specialTags: ['resonance:3', 'empower-damage:0.35', 'empower-radius:0.20'] },
            { description: '强化施法返还该技能20%冷却。', duration: 12, cooldownRefundRatio: 0.20, specialTags: ['resonance:3', 'empower-damage:0.35', 'empower-radius:0.20'] },
            { description: '强化伤害提高到50%。', duration: 12, cooldownRefundRatio: 0.20, specialTags: ['resonance:3', 'empower-damage:0.50', 'empower-radius:0.20'] },
        ],
    ),
    activeSkills: [
        active(
            'element_mage', 0,
            'mage_fireball', '火球术', 5,
            'NEAREST_ENEMY', 'single_damage',
            [
                { description: '火球爆炸造成170%攻击。', damageRatio: 1.70, range: 470, radius: 90 },
                { description: '伤害提高到200%。', damageRatio: 2.00, range: 470, radius: 90 },
                { description: '附加灼烧：每秒40%攻击，持续2秒。', damageRatio: 2.00, range: 470, radius: 90, burnDpsRatio: 0.40, burnDuration: 2 },
                { description: '爆炸范围提高25%。', damageRatio: 2.00, range: 480, radius: 113, burnDpsRatio: 0.40, burnDuration: 2 },
                { description: '爆炸后分裂3枚小火球追击附近敌人。', damageRatio: 2.00, range: 500, radius: 120, burnDpsRatio: 0.40, burnDuration: 2, projectileCount: 3, specialTags: ['split-fireball'] },
            ],
        ),
        active(
            'element_mage', 1,
            'mage_frost_nova', '冰霜新星', 9,
            'DENSEST_ENEMY_CLUSTER', 'area_damage',
            [
                { description: '造成120%攻击并减速50% 3秒。', damageRatio: 1.20, range: 500, radius: 185, slowRatio: 0.50, duration: 3 },
                { description: '伤害提高到150%。', damageRatio: 1.50, range: 500, radius: 185, slowRatio: 0.50, duration: 3 },
                { description: '范围提高20%。', damageRatio: 1.50, range: 510, radius: 222, slowRatio: 0.50, duration: 3 },
                { description: '减速提高到60%。', damageRatio: 1.50, range: 510, radius: 222, slowRatio: 0.60, duration: 3 },
                { description: '首击冻结普通敌人1.5秒，随后转为减速。', damageRatio: 1.50, range: 530, radius: 230, slowRatio: 0.60, duration: 3, stunDuration: 1.5 },
            ],
        ),
        active(
            'element_mage', 2,
            'mage_chain_lightning', '连锁闪电', 7,
            'NEAREST_ENEMY', 'chain_damage',
            [
                { description: '首击140%，弹射5次，每次衰减15%。', damageRatio: 1.40, chainCount: 5, chainFalloff: 0.15, range: 470 },
                { description: '弹射提高到6次。', damageRatio: 1.40, chainCount: 6, chainFalloff: 0.15, range: 470 },
                { description: '首击提高到160%。', damageRatio: 1.60, chainCount: 6, chainFalloff: 0.15, range: 480 },
                { description: '衰减降低到8%。', damageRatio: 1.60, chainCount: 6, chainFalloff: 0.08, range: 490 },
                { description: '弹射8次，最后一名目标触发小范围雷爆。', damageRatio: 1.60, chainCount: 8, chainFalloff: 0.08, range: 510, specialTags: ['final-lightning-burst'] },
            ],
        ),
        active(
            'element_mage', 3,
            'mage_arcane_vortex', '奥术黑洞', 14,
            'DENSEST_ENEMY_CLUSTER', 'area_damage',
            [
                { description: '牵引3秒，每0.5秒造成50%攻击。', damageRatio: 0.50, hitCount: 6, range: 520, radius: 200, duration: 3, specialTags: ['pull'] },
                { description: '范围提高20%。', damageRatio: 0.50, hitCount: 6, range: 520, radius: 240, duration: 3, specialTags: ['pull'] },
                { description: '持续时间提高到3.5秒。', damageRatio: 0.50, hitCount: 7, range: 520, radius: 240, duration: 3.5, specialTags: ['pull'] },
                { description: '每跳伤害提高到60%。', damageRatio: 0.60, hitCount: 7, range: 540, radius: 240, duration: 3.5, specialTags: ['pull'] },
                { description: '结束时造成220%范围爆炸。', damageRatio: 0.60, hitCount: 7, range: 560, radius: 250, duration: 3.5, specialTags: ['pull', 'finish-burst:2.20'] },
            ],
        ),
    ],
};

/** 辅助 / 守护祭司 */
const SUPPORT_MODULE: ProfessionSkillModule = {
    professionId: 'priest',
    passive: passive(
        'priest',
        'support_guardian_aura',
        '守护灵光',
        [
            { description: '全队受到治疗+5%，减伤3%。', damageReduction: 0.03, specialTags: ['healing-received:0.05', 'team-aura'] },
            { description: '减伤提高到4%。', damageReduction: 0.04, specialTags: ['healing-received:0.05', 'team-aura'] },
            { description: '受到治疗提高到8%。', damageReduction: 0.04, specialTags: ['healing-received:0.08', 'team-aura'] },
            { description: '生命首次低于30%时获得8%最大生命应急护盾。', damageReduction: 0.04, shieldMaxHpRatio: 0.08, specialTags: ['healing-received:0.08', 'emergency-shield-cd:20', 'team-aura'] },
            { description: '应急护盾提高到12%，内置冷却15秒。', damageReduction: 0.04, shieldMaxHpRatio: 0.12, specialTags: ['healing-received:0.08', 'emergency-shield-cd:15', 'team-aura'] },
        ],
    ),
    activeSkills: [
        active(
            'priest', 0,
            'support_holy_heal', '圣愈术', 7,
            'LOWEST_HP_ALLY', 'single_heal',
            [
                { description: '治疗12%目标最大生命。', healMaxHpRatio: 0.12 },
                { description: '治疗提高到14%。', healMaxHpRatio: 0.14 },
                { description: '冷却降低到6.5秒。', healMaxHpRatio: 0.14, cooldown: 6.5 },
                { description: '目标满血时，50%治疗量转为护盾。', healMaxHpRatio: 0.14, specialTags: ['overheal-shield:0.50'] },
                { description: '再弹向第二低血量队友，效果60%。', healMaxHpRatio: 0.14, secondaryAllyRatio: 0.60, specialTags: ['bounce-heal'] },
            ],
        ),
        active(
            'priest', 1,
            'support_guardian_shield', '守护之盾', 9,
            'LOWEST_HP_ALLY', 'single_shield',
            [
                { description: '给予12%最大生命护盾，持续5秒。', shieldMaxHpRatio: 0.12, duration: 5 },
                { description: '护盾提高到15%。', shieldMaxHpRatio: 0.15, duration: 5 },
                { description: '持续时间提高到6秒。', shieldMaxHpRatio: 0.15, duration: 6 },
                { description: '护盾目标额外获得10%减伤。', shieldMaxHpRatio: 0.15, duration: 6, damageReduction: 0.10 },
                { description: '第二名队友获得70%数值的副护盾。', shieldMaxHpRatio: 0.15, duration: 6, damageReduction: 0.10, secondaryAllyRatio: 0.70 },
            ],
        ),
        active(
            'priest', 2,
            'support_battle_hymn', '战歌鼓舞', 15,
            'ALL_ALLIES', 'team_buff',
            [
                { description: '全队+12%攻击、+10%攻速，持续6秒。', attackBonus: 0.12, attackSpeedBonus: 0.10, duration: 6 },
                { description: '持续时间提高到7秒。', attackBonus: 0.12, attackSpeedBonus: 0.10, duration: 7 },
                { description: '攻击提高到16%。', attackBonus: 0.16, attackSpeedBonus: 0.10, duration: 7 },
                { description: '攻速提高到15%。', attackBonus: 0.16, attackSpeedBonus: 0.15, duration: 7 },
                { description: '再获得+10%移速和5%减伤。', attackBonus: 0.16, attackSpeedBonus: 0.15, moveSpeedBonus: 0.10, damageReduction: 0.05, duration: 7 },
            ],
        ),
        active(
            'priest', 3,
            'support_sanctuary', '生命圣域', 16,
            'TEAM_CENTER', 'sanctuary',
            [
                { description: '持续4秒，每秒恢复3%最大生命并获得10%减伤。', healMaxHpRatio: 0.03, damageReduction: 0.10, duration: 4, radius: 250 },
                { description: '圣域范围提高20%。', healMaxHpRatio: 0.03, damageReduction: 0.10, duration: 4, radius: 300 },
                { description: '每秒恢复提高到4%。', healMaxHpRatio: 0.04, damageReduction: 0.10, duration: 4, radius: 300 },
                { description: '持续时间提高到5秒。', healMaxHpRatio: 0.04, damageReduction: 0.10, duration: 5, radius: 300 },
                { description: '结束时额外恢复8%，并延续3秒减伤。', healMaxHpRatio: 0.04, damageReduction: 0.10, duration: 5, radius: 320, specialTags: ['finish-heal:0.08', 'after-reduction:3'] },
            ],
        ),
    ],
};

/**
 * 现有原创职业先保留其独立技能模组，不回退成“所有职业共用四个模板”。
 * 这些是可运行首版，后续只需扩这里的数据，不改 Runtime。
 */
function makeLegacyCombatModule(
    professionId: ProfessionId,
    passiveName: string,
    names: readonly [string, string, string, string],
    style: 'magic' | 'melee' | 'ranged' | 'support',
): ProfessionSkillModule {
    const ranged = style === 'magic' || style === 'ranged';
    const support = style === 'support';

    const passiveLevels = [1, 2, 3, 4, 5].map(
        (level) => ({
            description: `${passiveName} Lv.${level}：强化职业核心战斗节奏。`,
            attackBonus: support ? 0.01 * level : 0.015 * level,
            damageReduction: style === 'melee' ? 0.008 * level : 0,
            specialTags: ['legacy-profession-passive'],
        }),
    ) as unknown as ProfessionSkillDefinition['levels'];

    const mk = (
        slot: 0 | 1 | 2 | 3,
        behavior: ProfessionSkillDefinition['behavior'],
        target: ProfessionSkillDefinition['targetMode'],
        baseCooldown: number,
        baseRatio: number,
    ) => active(
        professionId,
        slot,
        `${professionId}_skill_${slot + 1}`,
        names[slot],
        baseCooldown,
        target,
        behavior,
        [0, 1, 2, 3, 4].map((i) => ({
            description: `${names[slot]} Lv.${i + 1}：伤害/效果逐级增强${i === 4 ? '并获得觉醒强化。' : '。'}`,
            damageRatio: support && slot < 2 ? undefined : baseRatio * (1 + i * 0.16),
            radius: slot === 1 || slot === 3 ? 190 + i * 12 : undefined,
            range: ranged ? 430 + i * 18 : 280 + i * 14,
            shieldMaxHpRatio: support && slot === 1 ? 0.10 + i * 0.015 : undefined,
            healMaxHpRatio: support && slot === 0 ? 0.09 + i * 0.012 : undefined,
            specialTags: i === 4 ? ['awakened'] : undefined,
        })) as unknown as ProfessionSkillDefinition['levels'],
    );

    return {
        professionId,
        passive: passive(
            professionId,
            `${professionId}_passive`,
            passiveName,
            passiveLevels,
        ),
        activeSkills: [
            mk(0, support ? 'single_heal' : 'single_damage', support ? 'LOWEST_HP_ALLY' : 'NEAREST_ENEMY', 5.5, 1.8),
            mk(1, support ? 'single_shield' : 'area_damage', support ? 'LOWEST_HP_ALLY' : 'AROUND_SELF', 9.5, 1.45),
            mk(2, 'single_damage', 'HIGHEST_HP_ENEMY', 12, 2.5),
            mk(3, support ? 'team_buff' : 'area_damage', support ? 'ALL_ALLIES' : 'DENSEST_ENEMY_CLUSTER', 16, 3.8),
        ],
    };
}

const EXTRA_MODULES: readonly ProfessionSkillModule[] = [
    makeLegacyCombatModule('flame_caster', '炎脉共鸣', ['炎弹', '烈焰环', '赤炎护体', '天火陨星'], 'magic'),
    makeLegacyCombatModule('sword_cultivator', '剑心通明', ['飞剑斩', '剑气环', '御剑护身', '万剑归宗'], 'melee'),
    makeLegacyCombatModule('spirit_alchemist', '药灵循环', ['灵药弹', '百草雾', '回春丹', '仙草领域'], 'support'),
    makeLegacyCombatModule('body_cultivator', '金刚体魄', ['震地拳', '狮子吼', '金刚护体', '山河震'], 'melee'),
    makeLegacyCombatModule('commander', '军阵统御', ['号令突击', '战阵压制', '振奋军心', '王旗领域'], 'support'),
    makeLegacyCombatModule('demon_bruiser', '魔血沸腾', ['魔刃斩', '血焰震', '噬血突袭', '魔神降临'], 'melee'),
    makeLegacyCombatModule('shadow_caster', '暗影回响', ['影蚀弹', '幽影环', '魂缚术', '夜幕降临'], 'magic'),
    makeLegacyCombatModule('undead_bruiser', '亡者韧性', ['腐骨斩', '尸气爆', '噬魂击', '不死狂潮'], 'melee'),
    makeLegacyCombatModule('demon_lord', '魔王威压', ['霸刃', '魔焰震域', '深渊护体', '魔域君临'], 'melee'),
];

export const PROFESSION_SKILL_MODULES:
    readonly ProfessionSkillModule[] = [
        WARRIOR_MODULE,
        TANK_MODULE,
        RANGER_MODULE,
        MAGE_MODULE,
        SUPPORT_MODULE,
        ...EXTRA_MODULES,
    ];

const MODULE_BY_PROFESSION =
    new Map<ProfessionId, ProfessionSkillModule>(
        PROFESSION_SKILL_MODULES.map(
            (module) => [
                module.professionId,
                module,
            ],
        ),
    );

export function getProfessionSkillModule(
    professionId: ProfessionId,
): ProfessionSkillModule {
    const module =
        MODULE_BY_PROFESSION.get(
            professionId,
        );

    if (!module) {
        throw new Error(
            `[SkillSystem] 缺少职业技能模组：${professionId}`,
        );
    }

    return module;
}

export function getProfessionSkillById(
    professionId: ProfessionId,
    skillId: string,
): ProfessionSkillDefinition | null {
    const module =
        getProfessionSkillModule(
            professionId,
        );

    if (module.passive.id === skillId) {
        return module.passive;
    }

    return (
        module.activeSkills.find(
            (skill) =>
                skill.id === skillId,
        ) ??
        null
    );
}

export function getSkillLevelTuning(
    skill: ProfessionSkillDefinition,
    level: number,
): ProfessionSkillLevelTuning {
    const index = Math.max(
        0,
        Math.min(4, Math.floor(level) - 1),
    );

    return skill.levels[index];
}
