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
├─ economy/                 # CurrencyService + ShopCatalog/ShopService + legacy compatibility
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
│  │  ├─ levelup/           # 三选一：技能 + 本局全队属性成长
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
HeroSkillUpgradeService ─┐
                         ├→ HeroRunUpgradeService ← LevelUpChoiceController
HeroRunStatState ────────┘   ↓ 技能解锁/升级 + 全队本局属性成长
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

UI 不拥有冷却、等级、能量、属性成长或释放状态。v0.6.1 后主动技能按钮是状态显示，不是释放入口。v0.6.2 后 Battle 与 HeroSkill 之间只通过 `CombatEventBus` 传播已发生事实；敌人控制/标记统一由 `EnemyStatusSystem` 持有。v0.6.6 后 `HeroRunStatState` 是攻击/防御/生命/移速/闪避本局永久成长唯一状态源，`HeroRunUpgradeService` 是技能 + 属性混合三选一唯一入口。

### 英雄移动 / AI / 复活

- `MainHeroController`：玩家主角移动唯一 Runtime；历史 `PlayerController` 不再消费摇杆输入。
- `CompanionBattleController`：AI 英雄唯一寻怪/追击/回防 Runtime；使用 `EnemyController.findNearestEnemy()` 全战场索敌，只受 `BattleLayoutConfig.heroMoveBounds` 物理地图边界限制。
- 所有职业基础移动速度读取 `HERO_BASE_MOVE_SPEED`；追击、回防、巡逻不再各自维护隐藏速度常量。
- `DefenseObjectiveService -> CoreHealth`：主角与伙伴复活通道唯一事实源，复活共同消耗防御塔生命；角色控制器只提交复活请求和接收进度，不自行扣塔血。

### 英雄仓库 vs 普通仓库

`MainMenuHeroPage` = 英雄仓库/英雄养成中心：人物、职业、技能、培养、英雄装备。

`MainMenuWarehousePage` + `systems/storage/` = 普通仓库/背包：装备物品、材料、道具、消耗品及持有数量。

`MainMenuShopPage` = MainMenu.scene 内独立商店页面；打开时隐藏大厅 TopHUD，自带返回与资源栏，但必须复用并保留常驻 `MainMenuBottomNav`。Page 专属背景和滚动层精确结束在 132 px 底栏顶边，不得覆盖导航或留下透出其它页面背景的水平缝隙。`MainMenuView` 唯一管理商店、英雄、战斗、仓库、升级五个独立 Page 的切换与底栏选中态。交易事实不在 UI：`ShopCatalog` 定义商品，`ShopService` 唯一处理每日限购/扣款/发货，`CurrencyService` 与 `InventoryService` 继续分别拥有余额和库存。

`MainMenuFullscreenShell` = HeroPage / WarehousePage / UpgradePage 共用的全屏视觉骨架；统一 Header、资源余额栏、羊皮纸正文和 132 px 底栏安全边界，不持有英雄、库存或升级业务状态。只有 BattlePage 使用大厅 TopHUD / Logo，其余四个独立 Page 使用自身 Header。

v0.6.8 起 `ShopArt` 是 ShopPage 正式 SpriteFrame 加载入口；三张原始素材表保留在 `design-reference/shop/v0.6.8-source/`，预切运行资源分别进入 `chrome/`、`banners/`、`icons/`、`item-cards/`。UI 不需要人工 SpriteEditor 切图，也不把资源路径散落到交易逻辑。 v0.6.9 继续保持这一入口，并要求运行时切片按源图 alpha 边界精确裁切；页面视觉层新增固定羊皮纸正文背景，不改变商店业务状态归属。

“英雄装备”可以读取 Storage 中的装备物品，但穿戴关系与战斗修正由 `EquipmentLoadoutService` 管；不复制物品库存。

## 4. Battle / Level 关系

- `StageCatalog`：关卡内容、敌人池、Boss、奖励和解锁条件。
- `ChapterWaveController`：波次推进唯一 Runtime。
- `BattleMapCatalog`：地图主题。
- `BattleLayoutConfig`：战场几何坐标唯一来源；v0.6.3 起逻辑地图固定为正式背景原生 900 × 1600（9:16）坐标系。
- `BattleWorldService`：战场 viewport cover 缩放唯一来源，按当前 `view.getVisibleSize()` 统一缩放背景和所有世界对象。
- `BattleCameraController`：只负责有限地图跟随与 clamp，使用 BattleWorldRoot 的实际 scale，不再维护第二套固定缩放。
- `BattleSceneSetup`：正式战斗世界视觉构建入口；v0.6.5 起不再绘制怪物泉水调试圆环，泉水只保留为刷怪逻辑坐标。
- `CoreHealth`：防线生命/全英雄复活消耗/GameOver 唯一状态源；v0.6.5 起显示层使用 BattleWorldRoot 世界血条，不再创建覆盖上半屏的 Canvas 大面板。
- `BattleHudLayout`：战斗屏幕空间 SafeArea / visibleSize 唯一布局换算入口；只负责 HUD 边缘锚点，不拥有任何战斗业务状态。
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
