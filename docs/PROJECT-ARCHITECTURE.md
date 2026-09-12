# TonightDefense 项目架构

## 1. 根目录

```text
TonightDefense/
├─ .github/                 # GitHub Actions 静态 Safety Gate
├─ assets/                  # Cocos Scene / TypeScript / Runtime Resources / Meta
├─ build-templates/         # 微信小游戏构建模板
├─ cloudfunctions/          # 微信云函数源码
├─ design-reference/        # 权威设计素材共享库，不参与 Cocos Runtime 导入
├─ docs/
│  ├─ architecture/         # 机器可读模块骨架
│  ├─ archive/migrations/   # 历史迁移说明/manifest
│  ├─ design/               # 系统设计规范
│  └─ development/          # 开发/Git 规则
├─ extensions/              # Cocos 扩展（不含 node_modules）
├─ scripts/                 # GitHub / 迁移辅助脚本
├─ settings/                # Cocos 项目级设置
├─ spine_source/            # 小体积角色源拆件
├─ AGENTS.md
├─ PROJECT.md
├─ README.md
├─ TonightDefense-GitHub.bat
├─ push-tonight-defense.ps1
├─ package.json
└─ tsconfig.json
```

根目录不再摆放 migration manifest、设计同步临时说明、模块 JSON 等维护碎片；它们分别进入 `docs/archive/migrations/` 与 `docs/architecture/`。

## 2. Runtime 系统域

```text
assets/scripts/systems/
├─ account/                 # 登录 / 平台 / 账号模型
├─ audio/                   # 唯一 AudioManager
├─ battle/                  # 战斗目标、敌人、Boss、防线、伤害、场景表现
├─ economy/                 # CurrencyService + legacy compatibility
├─ feature/                 # pause / settings / stamina / tutorial / main-menu
├─ gameplay/                # 模式、规则、单局会话
├─ hero/                    # 英雄大系统（重点）
│  ├─ character/
│  │  ├─ data/              # CharacterCatalog
│  │  ├─ selection/         # 主角开局选择
│  │  ├─ player/            # 玩家控制
│  │  ├─ companion/         # AI Hero 控制
│  │  ├─ party/             # 队伍状态
│  │  ├─ stats/             # CharacterCombatant
│  │  ├─ visual/            # 英雄战斗表现
│  │  └─ animation/
│  ├─ profession/
│  │  ├─ definition/        # ProfessionCatalog / ProfessionTypes
│  │  └─ data/              # ProfessionPresentationCatalog
│  ├─ skill/
│  │  ├─ data/              # ProfessionSkillCatalog / Types
│  │  ├─ runtime/           # HeroSkillRuntime / ProfessionSkillRunState
│  │  ├─ effect/            # SkillEffectResolver / StatusEffectSystem
│  │  ├─ targeting/         # SkillTargeting
│  │  └─ upgrade/           # HeroSkillUpgradeService
│  ├─ progression/
│  │  ├─ experience/
│  │  ├─ levelup/           # 波次成长奖励编排
│  │  └─ recruitment/       # 招募
│  └─ equipment/            # EquipmentLoadoutService
├─ level/                   # Stage / Wave / Map / Chapter runtime
├─ reward/                  # 奖励发放
└─ storage/                 # 物品存储域
   ├─ inventory/
   ├─ item/
   └─ warehouse/
```

## 3. 英雄域单一事实来源

### 人物 Character

`CharacterCatalog` 是所有可上场人物唯一数据库。主角和 AI 英雄不再维护两份人物 Catalog；“主角/伙伴”只表示控制方式和队伍位置。

### 职业 Profession

`ProfessionCatalog` 只保存职业基础属性、攻击方式、射程/攻速和视觉主题。职业技能不要塞回 ProfessionDefinition，避免职业基础数值与技能成长耦合。

### 技能 Skill

```text
ProfessionSkillCatalog
    ↓ 1 passive + 4 active / profession
ProfessionSkillRunState
    ↓ current-run shared profession skill levels
HeroSkillUpgradeService ← LevelUpChoiceController
    ↓ unlock / Lv2~Lv5
HeroSkillRuntime
    ↓ each actor independent cooldown + auto cast
SkillTargeting → SkillEffectResolver
    ↓                         ↓
StatusEffectSystem       EnemyStatusSystem
(hero DoT/buffs)         (slow/stun/freeze/taunt/mark)
    ↓                         ↑
CharacterCombatant ← CombatEventBus → EnemyController
    ↓
BattlePartyHUD (read-only state display)
```

UI 不拥有冷却、等级、能量或释放状态。v0.6.1 后主动技能按钮是状态显示，不是释放入口。v0.6.2 后 Battle 与 HeroSkill 之间只通过 `CombatEventBus` 传播已发生事实；敌人控制/标记统一由 `EnemyStatusSystem` 持有。

### 英雄仓库 vs 普通仓库

`MainMenuHeroPage` = 英雄仓库/英雄养成中心：人物、职业、技能、培养、英雄装备。

`MainMenuWarehousePage` + `systems/storage/` = 普通仓库/背包：装备物品、材料、道具、消耗品及持有数量。

“英雄装备”可以读取 Storage 中的装备物品，但穿戴关系与战斗修正由 `EquipmentLoadoutService` 管；不复制物品库存。

## 4. Battle / Level 关系

- `StageCatalog`：关卡内容、敌人池、Boss、奖励和解锁条件。
- `ChapterWaveController`：波次推进唯一 Runtime。
- `BattleMapCatalog`：地图主题。
- `BattleLayoutConfig`：战场几何坐标唯一来源。
- `BattleSceneSetup`：正式战斗世界视觉构建入口，已从 `debug/prototype` 迁入 `battle/view`。
- `EnemyController`：普通/精英/Boss 的生命、移动、受击、死亡链事实来源。
- `CombatEventBus`：英雄受击、敌人受击/死亡事实事件桥，不拥有生命或伤害状态。
- `EnemyStatusSystem`：敌人 slow / stun / freeze / taunt / hunter mark 唯一状态源；不复制 EnemyController。
- `BossRuntimeController`：只增加 Boss 阶段与技能行为，不复制敌人生命链。

## 5. Cocos 资源迁移规则

- 迁移 `.ts`、资源或目录时，对应 `.meta` 必须一起移动，UUID 保持不变。
- Scene 仍按脚本 UUID 引用组件；禁止为了“重构路径”重新生成脚本 `.meta`。
- `assets/resources` 是运行时资源；`design-reference` 是设计共享库，两者职责不同。
- `library/temp/build/native/profiles/output/node_modules` 不进入源码主包。

## 6. 验证层级

```text
静态检查 / Import / JSON / Meta UUID / Safety Gate
    ↓
Cocos Creator 3.8.8 重新导入 + Preview
    ↓
微信开发者工具 Build
    ↓
微信真机输入 / 性能 / 长时间战斗回归
```

GitHub Actions 绿色只能证明静态 Gate 通过，不能写成“Cocos 已运行验证”。
