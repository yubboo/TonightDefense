/**
 * 波次结束属性强化的语义化入口。
 * 旧 SkillCatalog 暂保留为数据文件与兼容层，主动释放技能只使用 ActiveSkillCatalog。
 */
export {
    SKILL_CATALOG as UPGRADE_CATALOG,
} from './SkillCatalog';

export type {
    SkillDefinition as UpgradeDefinition,
    SkillEffectKind as UpgradeEffectKind,
} from './SkillCatalog';
