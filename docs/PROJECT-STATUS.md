# TonightDefense 当前状态

## 当前版本

**v0.6.1 — 英雄域收口 / 职业技能成长 / 项目骨架整理**

## 当前稳定基线

- Cocos Creator：3.8.8。
- 目标平台：微信小游戏。
- 场景：`MainMenu.scene` + `Battle.scene`；大厅各功能继续使用页面，不为英雄仓库、普通仓库、商店额外拆 Scene。
- GitHub：`main` 是源码事实来源；本版本开发基线为 v0.6.0 commit `26f73c0`，该基线 Safety Gate 为绿色。
- 音频：唯一 `AudioManager`，唯一运行目录 `assets/resources/audio/`。
- 暂停：唯一 `BattlePauseService` + `BattlePausePanel`。
- Boss：继续保持 `BossCatalog -> BossRuntimeController -> EnemyController`；本轮不复制 Boss 生命、掉落或波次逻辑。
- 战斗地图：`StageCatalog` 管关卡内容，`BattleMapCatalog` 管主题，`BattleLayoutConfig` 管战斗几何坐标。

## v0.6.1 英雄大系统

英雄相关代码统一收口到 `assets/scripts/systems/hero/`：

```text
hero/
├─ character/      # 人物、主角/AI 控制、队伍、战斗属性、表现
├─ profession/     # 职业定义与展示数据
├─ skill/          # 职业技能数据、单局等级、自动释放、效果、选敌、三选一
├─ progression/    # 经验、波次成长编排、招募
└─ equipment/      # 英雄装备穿戴与战斗属性结算
```

永久规则：主角和 AI 伙伴属于同一个 HeroSystem。Character 只定义“谁”，Profession 定义“职业基础战斗方式”，Skill 定义“职业技能模组”，Progression 负责“本局怎么成长”，Equipment 负责“英雄装备怎么影响战斗”。

大厅 `MainMenuHeroPage` 明确为“英雄仓库”，包含人物 / 职业 / 技能 / 培养 / 装备五个子入口语义；普通 `Warehouse` 继续只负责装备、材料、道具等物品存储，两者不共用 UI 职责。

## 职业技能规则

- 每个职业固定 **1 个被动 + 4 个主动技能**。
- 被动入场默认 Lv.1；主动技能初始 Lv.0（锁定）。
- 三选一第一次抽到主动技能时解锁 Lv.1，之后升级到 Lv.5；Lv.5 后退出候选池。
- 主动技能不再由玩家点击触发：冷却完成且存在合法目标时自动释放，然后重新进入冷却。
- 同职业的多名上阵英雄共享本局技能等级，但每个英雄拥有独立冷却计时。
- 三选一只从当前上阵职业池抽取：主角职业权重 2；每名 AI 英雄职业权重 1；相同职业叠加权重；同轮不重复同一技能。
- `ProfessionSkillCatalog` 是职业技能定义唯一来源；`ProfessionSkillRunState` 是单局技能等级唯一来源；`HeroSkillRuntime` 是自动施放/冷却唯一 Runtime；`HeroSkillUpgradeService` 是三选一候选和升级唯一入口。
- 首批完整设计数据：战士、坦克、游侠、法师、辅助；其余现有职业都有独立可运行技能模组，不再错误回退到同一套通用技能。

### 当前技能效果支持层级

已统一支持：单体/多段/范围/直线/扇形/多目标/连锁伤害、治疗、单体/团队护盾、团队增益、持续治疗区域、燃烧、击退、攻击/攻速/移速/减伤等英雄临时修正。

坦克受击叠层、游侠标记、完整嘲讽/冻结/敌人减速、法师共鸣范围放大等需要 Enemy/Combat 事件接口的高级状态已经保留在 Catalog 的 `specialTags` 数据中；v0.6.1 不把它们硬编码进 UI 或 CharacterController，后续通过统一 CombatEvent/EnemyStatus 接口补齐。

## 项目骨架整理

- `character / profession / skill / progression` 顶层散目录并入 `systems/hero/`。
- `inventory / item / warehouse` 并入 `systems/storage/`。
- `settings` 并入 `systems/feature/settings/`。
- 历史 `feature/economy` 兼容层移入 `systems/economy/legacy/`；真正经济事实来源仍是 `CurrencyService`。
- 原运行时 `debug/prototype/Step2SceneSetup.ts` 迁入 `systems/battle/view/BattleSceneSetup.ts`，不再把正式战斗场景实现放在 prototype 目录。
- 根目录迁移清单、旧架构 manifest、设计同步说明归档到 `docs/archive/migrations/`；`project-modules.json` 迁到 `docs/architecture/`。
- 清理脚本系统中无对应目录的空 `.meta` 占位，减少 Cocos AssetDB 噪音。
- 移除 `CompanionCatalog`、`CompanionStatsConfig`、旧 `SkillCatalog / UpgradeCatalog / SkillEffectCatalog` 等重复兼容事实源；运行时代码直接读取统一 Character / Profession / ProfessionSkill 数据。

## 当前已知开发重点

1. 在 Cocos Creator 3.8.8 编辑器验证 v0.6.1 的脚本迁移、Scene UUID 引用、战斗自动技能和招募闭环。
2. 增加统一 CombatEvent/EnemyStatus 接口，完整落地坦克叠层、游侠印记、嘲讽/冻结/减速等高级职业机制。
3. 把英雄仓库从“真实数据概览”继续推进到永久英雄等级、培养、突破和逐英雄装备配置；不要把局内技能等级保存成永久等级。
4. 为所有职业制作独立技能图标/特效；当前可继续复用公共技能槽图标作为安全占位。
5. 微信开发者工具与真机继续验证 GC、自动技能高频选敌、长屏 HUD 和 30/60 FPS。
