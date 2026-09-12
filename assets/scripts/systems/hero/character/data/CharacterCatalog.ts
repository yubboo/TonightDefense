/**
 * @architecture TonightDefense V1.0
 * @owner character
 * @module data
 *
 * 所有“可上场人物”统一归 CharacterSystem 管理。
 *
 * 关键规则：
 * - 开局先从 canBeMainHero=true 的人物里随机三选一。
 * - 被选中的那个成为本局主角。
 * - 其它 canBeCompanion=true 的人物进入后续伙伴招募池。
 * - 当前主角本人不会再次被招募成伙伴。
 *
 * 因此“主角”和“伙伴”不是两套人物数据库，
 * 而是同一个 CharacterCatalog 的不同使用方式。
 */
import {
    ProfessionId,
} from '../../profession/definition/ProfessionTypes';

export interface CharacterDefinition {
    id: string;
    name: string;
    faction: string;

    professionId:
        ProfessionId;

    description: string;

    /**
     * 是否允许出现在开局主角三选一。
     */
    canBeMainHero: boolean;

    /**
     * 如果本局没有被选为主角，
     * 是否允许后续作为伙伴被招募。
     */
    canBeCompanion: boolean;

    /**
     * resources 下的角色资源根路径。
     */
    resourceRoot: string;

    /**
     * 正面 sprite 文件名（不带扩展名）。
     */
    spriteKey: string;
}

/**
 * 前四个是“小说式成长流”原创占位主角。
 *
 * 正式上线建议继续使用原创名字、原创形象、原创技能，
 * 不直接复刻具体网络小说角色。
 */
export const CHARACTER_CATALOG:
    readonly CharacterDefinition[] = [
        {
            id: 'ember_sage',
            name: '炎诀少年',
            faction: '炎域',
            professionId:
                'flame_caster',
            description:
                '擅长火焰爆发与范围清场。',
            canBeMainHero: true,
            canBeCompanion: true,
            resourceRoot:
                'characters/hero/ember_sage',
            spriteKey:
                'ember_sage',
        },

        {
            id: 'void_swordsman',
            name: '逆尘剑修',
            faction: '玄门',
            professionId:
                'sword_cultivator',
            description:
                '近身速度快，爆发高，擅长快速斩杀。',
            canBeMainHero: true,
            canBeCompanion: true,
            resourceRoot:
                'characters/hero/void_swordsman',
            spriteKey:
                'void_swordsman',
        },

        {
            id: 'spirit_alchemist',
            name: '灵药散修',
            faction: '灵谷',
            professionId:
                'spirit_alchemist',
            description:
                '远程稳定输出，并偏向续航成长。',
            canBeMainHero: true,
            canBeCompanion: true,
            resourceRoot:
                'characters/hero/spirit_alchemist',
            spriteKey:
                'spirit_alchemist',
        },

        {
            id: 'wild_body_cultivator',
            name: '荒域少年',
            faction: '荒域',
            professionId:
                'body_cultivator',
            description:
                '高生命高防御，适合贴身持续作战。',
            canBeMainHero: true,
            canBeCompanion: true,
            resourceRoot:
                'characters/hero/wild_body_cultivator',
            spriteKey:
                'wild_body_cultivator',
        },

        /**
         * 现有伙伴也允许被抽到作为开局主角。
         * 如果其中某人被选为主角，
         * 本局后续招募池会自动排除同一个人物。
         */
        {
            id: 'elf_ranger',
            name: '精灵射手',
            faction: '精灵',
            professionId:
                'ranger',
            description:
                '攻击距离远，擅长持续输出与穿透攻击。',
            canBeMainHero: true,
            canBeCompanion: true,
            resourceRoot:
                'characters/companions/elf_ranger',
            spriteKey:
                'elf_ranger',
        },

        {
            id: 'royal_knight',
            name: '皇家骑士',
            faction: '王国',
            professionId:
                'guardian_knight',
            description:
                '承受伤害并保护后排伙伴。',
            canBeMainHero: true,
            canBeCompanion: true,
            resourceRoot:
                'characters/companions/royal_knight',
            spriteKey:
                'royal_knight',
        },

        {
            id: 'commander',
            name: '指挥官',
            faction: '王国',
            professionId:
                'commander',
            description:
                '强化队伍攻击节奏与阵型能力。',
            canBeMainHero: true,
            canBeCompanion: true,
            resourceRoot:
                'characters/companions/commander',
            spriteKey:
                'commander',
        },

        {
            id: 'demon_warrior',
            name: '魔族战士',
            faction: '魔族',
            professionId:
                'demon_bruiser',
            description:
                '高压近战单位，适合持续作战。',
            canBeMainHero: true,
            canBeCompanion: true,
            resourceRoot:
                'characters/companions/demon_warrior',
            spriteKey:
                'demon_warrior',
        },

        {
            id: 'shadow_enchantress',
            name: '魅影术士',
            faction: '魔族',
            professionId:
                'shadow_caster',
            description:
                '使用暗影法术控制敌人并造成持续伤害。',
            canBeMainHero: true,
            canBeCompanion: true,
            resourceRoot:
                'characters/companions/shadow_enchantress',
            spriteKey:
                'shadow_enchantress',
        },

        {
            id: 'ghoul',
            name: '尸鬼战士',
            faction: '亡灵',
            professionId:
                'undead_bruiser',
            description:
                '近战作战并拥有较强的生存能力。',
            canBeMainHero: true,
            canBeCompanion: true,
            resourceRoot:
                'characters/companions/ghoul',
            spriteKey:
                'ghoul',
        },

        {
            id: 'archer',
            name: '游侠',
            faction: '王国',
            professionId:
                'ranger',
            description:
                '攻速快，擅长快速清理普通怪物。',
            canBeMainHero: true,
            canBeCompanion: true,
            resourceRoot:
                'characters/companions/archer',
            spriteKey:
                'archer',
        },

        {
            id: 'mage',
            name: '元素法师',
            faction: '学院',
            professionId:
                'element_mage',
            description:
                '使用火、冰、雷等范围法术清理怪潮。',
            canBeMainHero: true,
            canBeCompanion: true,
            resourceRoot:
                'characters/companions/mage',
            spriteKey:
                'mage',
        },

        {
            id: 'support',
            name: '守护祭司',
            faction: '王国',
            professionId:
                'priest',
            description:
                '提供治疗、护盾与团队强化。',
            canBeMainHero: true,
            canBeCompanion: true,
            resourceRoot:
                'characters/companions/support',
            spriteKey:
                'support',
        },

        {
            id: 'warrior',
            name: '重装战士',
            faction: '王国',
            professionId:
                'heavy_warrior',
            description:
                '兼顾近战输出和承伤。',
            canBeMainHero: true,
            canBeCompanion: true,
            resourceRoot:
                'characters/companions/warrior',
            spriteKey:
                'warrior',
        },

        {
            id: 'demon_lord',
            name: '魔族领主',
            faction: '魔族',
            professionId:
                'demon_lord',
            description:
                '拥有较高攻击与生存能力，是强力前排核心。',
            canBeMainHero: true,
            canBeCompanion: true,
            resourceRoot:
                'characters/companions/demon_lord',
            spriteKey:
                'demon_lord',
        },
    ] as const;

export function getCharacterById(
    id: string,
): CharacterDefinition | undefined {
    return CHARACTER_CATALOG.find(
        (
            character,
        ) =>
            character.id === id,
    );
}

export function getMainHeroCandidates():
    CharacterDefinition[] {
    return CHARACTER_CATALOG.filter(
        (
            character,
        ) =>
            character.canBeMainHero,
    );
}

export function getCompanionCandidates():
    CharacterDefinition[] {
    return CHARACTER_CATALOG.filter(
        (
            character,
        ) =>
            character.canBeCompanion,
    );
}
