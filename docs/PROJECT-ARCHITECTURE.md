# TonightDefense 项目架构

## 1. 根目录

```text
TonightDefense/
├─ .github/              # GitHub Actions 静态安全 Gate
├─ assets/               # Cocos 运行时资源、Scene、TypeScript、Meta
├─ build-templates/      # 微信小游戏构建模板
├─ cloudfunctions/       # 微信云函数源码
├─ docs/                 # 当前状态、架构、开发规则、计划
├─ extensions/           # Cocos 扩展源码 + dist；node_modules 不进 Git
├─ settings/             # Cocos 项目级设置（进 Git）
├─ spine_source/         # 小体积角色源拆件（可进 Git）
├─ scripts/github/       # GitHub Safety Gate
├─ design-reference/    # GitHub/网页端 AI/跨机器共享的权威设计素材库
├─ AGENTS.md             # AI/人工最高开发规范
├─ PROJECT.md            # 项目说明与版本记录
├─ TonightDefense-GitHub.bat
└─ push-tonight-defense.ps1
```

不属于共享基线：`library/`、`temp/`、`build/`、`native/`、`profiles/`、`output/`、任何 `node_modules/`。`design-reference/` 虽不参与 Cocos 运行时，但属于共享基线，用于固定视觉方向并防止协作者用临时生成素材覆盖正式素材。

## 2. Scene 与 UI

```text
MainMenu.scene
└─ MainMenu Page UI
   ├─ Battle
   ├─ Shop
   ├─ Hero
   ├─ Warehouse
   └─ Upgrade

Battle.scene
├─ Battle world
├─ Hero / AI Hero / Enemy / Projectile / Objective
└─ Screen UI
   ├─ ChapterWaveHUD
   ├─ VirtualJoystick
   ├─ DefenseStatusUI
   ├─ BattlePartyHUD
   ├─ ActiveSkillRuntime / BattleDebugPanel
   ├─ BattlePausePanel
   └─ Reward / Recruit / Skill panels
```

MainMenu 的 Shop/Hero/Warehouse/Upgrade 是页面，不因为 UI 名称就拆独立 Scene。

## 3. 核心系统与事实来源

### CharacterSystem

- `CharacterCatalog`：人物定义唯一来源。
- `ProfessionCatalog`：职业战斗基础数据唯一来源。
- `HeroSelectionState`：本局玩家选中的主角。
- `MainHeroController`：玩家输入控制。
- `CompanionBattleController`：AI 控制器；历史文件名暂保留，语义上属于 AI Hero Controller。
- `PartyState`：主角 + 4 AI 英雄的队伍状态。

永久规则：主角和伙伴不是两套角色系统。新增英雄/职业先扩 Catalog，再复用同一战斗组件。

### BattleSystem

- `BattleTargetRegistry`：战斗目标注册事实来源。
- `EnemyController`：敌人生成后的 AI/受击/死亡行为。
- `CoreHealth` / `DefenseObjectiveService`：雕像、城墙、公主防线。
- `AutoAttackController`：自动攻击。
- projectile / targeting / spawning / objective 各自保持单一职责。

Boss 仍属于 BattleSystem 的特殊 Enemy：

- `BossCatalog`：Boss 身份、阶段、技能定义唯一来源。
- `BossRuntimeController`：只负责单只 Boss 的阶段、吟唱、范围技能和战斗精灵。
- `EnemyController`：继续唯一拥有 Boss 的生命、移动、普攻、死亡和掉落。
- `ChapterWaveController`：继续唯一决定第 40 波何时生成哪个 `BossId`。
- `BossHealthHUD`：只显示 EnemyController 提供的状态，不复制 Boss 状态。

怪物目标优先级：存活可战斗 Hero -> 雕像 -> 城墙 -> 公主。

### Level / Progression

- `StageCatalog`：章节关卡、地图、敌人池、预算波次、精英/Boss、奖励和解锁条件的唯一数据入口。
- `ChapterWaveController`：消费 Stage 数据并负责关卡/小关推进，不再拥有硬编码波次数量表。
- `BattleMapCatalog`：章节对应战斗地图主题的唯一来源；不复制战斗坐标。
- `LevelUpChoiceController`：奖励选择编排。
- `RecruitService`：招募候选与招募规则。
- `PartyState`：最终队伍容量/成员状态。

战斗场景阵型、泉水与防线坐标继续统一由 `BattleLayoutConfig` 管理；地图 Catalog 只提供关卡主题、色彩和装饰参数。

招募链必须完整验证：UI -> LevelUpChoiceController -> RecruitService -> PartyState -> AI Hero spawn -> finishReward。

### SkillSystem

- `UpgradeCatalog`：波次结束时的属性强化；原 `SkillCatalog` 仅保留兼容导出。
- `ActiveSkillCatalog`：职业主动技能定义。
- `ActiveSkillRuntime`：冷却、能量与释放状态唯一来源。
- `SkillTargeting` / `SkillEffectResolver` / `StatusEffectSystem`：统一目标选择、效果结算与持续状态。
- HUD 只能发送 `hero-skill-intent`，不得复制主动技能状态。

### Inventory / Save

- `WarehouseRepository`：仓库与装备存档唯一入口，当前 schema v2，保留最近一次可恢复备份。
- `EquipmentLoadoutService`：装备槽、穿戴和战斗属性修正唯一入口。

### Battle Art / Runtime Support

- `BattleArt`：正式战斗 SpriteFrame 的加载、缓存与回退入口。
- `BattleEffectPool`：短生命周期战斗反馈节点对象池。
- `BattleStatisticsService`：本局伤害/击杀/技能等统计唯一来源。
- `BattleDebugPanel`：仅在 `TONIGHT_DEFENSE_DEBUG === true` 时显示，不进入普通玩家路径。

### FeatureSystem

暂停、体力、设置、主菜单等功能分别由独立 Service/Controller 拥有状态。暂停只有一套 `BattlePauseService`。

### AudioSystem

唯一 `AudioManager`；资源唯一 `assets/resources/audio/`。UI 音效不能顺带恢复/重播 BGM。

## 4. Cocos 资源规则

- `assets/**` 与对应 `.meta` 必须一起进入 Git；UUID 是项目资源引用的一部分。
- 禁止重新生成已有资源 `.meta` 来“修复”问题，除非确认资源迁移且所有引用同步更新。
- `library/`、`temp/`、`build/` 都是可重建产物，不作为源码。
- `settings/` 是项目级配置，进入 Git；`profiles/` 是本机编辑器/构建状态，不进入 Git。

## 5. 验证层级

```text
GitHub Safety Gate
    ↓
源码/Meta/路径/回归静态验证
    ↓
Cocos Creator 3.8.8 编辑器预览
    ↓
微信开发者工具构建/平台验证
    ↓
微信真机输入/性能/最终手感
```

GitHub Runner 没有 Cocos Creator 许可证/编辑器环境时，不把静态 PASS 写成“游戏已运行验证”。未来可在开发机增加 Windows self-hosted Runner 做真实 Creator Build Gate。
