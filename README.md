# TonightDefense / 今晚守城

Cocos Creator 3.8.8 微信小游戏割草守城项目。

## 开发入口

开始较大修改前依次阅读：`AGENTS.md` → `docs/PROJECT-STATUS.md` → `docs/PROJECT-ARCHITECTURE.md` → `docs/development/PROJECT-RULES.md` → `docs/DEVELOPMENT-PLAN.md`。当前版本记录见 `PROJECT.md`。

## v0.6.6 目录重点

- `assets/scripts/systems/hero/`：英雄大系统，统一人物、职业、技能、局内成长和英雄装备。
- `assets/scripts/systems/storage/`：普通背包/物品/仓库，不保存英雄培养状态。
- `assets/scripts/systems/battle/`：敌人、Boss、防线、战斗目标、战场表现。
  - `battle/data/BattleLayoutConfig.ts`：900 × 1600 正式背景/玩法统一坐标系。
  - `battle/view/BattleWorldService.ts`：按真实设备视口统一 cover 缩放战场世界。
  - `battle/combat/CombatEventBus.ts`：战斗事实事件桥。
  - `battle/enemy/status/EnemyStatusSystem.ts`：敌人控制/标记唯一状态源。
  - `battle/objective/CoreHealth.ts`：防线生命与全英雄复活能量通道唯一状态源；正式 UI 为世界内紧凑血条。
  - `battle/view/BattleSceneSetup.ts`：正式地图构建；怪物泉水只保留逻辑坐标，不绘制调试圆环。
- `assets/scripts/systems/hero/progression/levelup/`：`HeroRunUpgradeService` 统一技能 + 全队属性三选一，`HeroRunStatState` 持有本局攻击/防御/生命/移速/闪避成长等级。
- `assets/scripts/systems/hero/character/companion/CompanionBattleController.ts`：全战场自由索敌，追击/回防统一使用真实英雄移动速度。
- `assets/scripts/systems/level/`：Stage、Wave、Map、关卡推进。
- `assets/scripts/systems/feature/`：暂停、设置、体力、教程、大厅等独立功能。
- `assets/scripts/ui/layout/BattleHudLayout.ts`：720×1280 设计坐标到真实 visibleSize / SafeArea 的统一 HUD 锚点换算。
- `docs/architecture/project-modules.json`：当前机器可读模块骨架。
- `docs/design/HERO-PROFESSION-SKILLS.md`：职业技能设计与接入规范。
- `design-reference/`：共享设计素材基线，不参与 Cocos Runtime 导入。

大厅“英雄仓库”和普通“仓库”职责分开：英雄仓库负责人物/职业/技能/培养/英雄装备；普通仓库负责装备物品、材料、道具与消耗品持有数据。

## GitHub 工作流

Windows 开发机双击 `TonightDefense-GitHub.bat`，选择 `1. 一键推送`。脚本依次执行 Safety Gate、远端同步、暂存、删除保护、Commit 和 Push，永不自动 force push。

GitHub Action 绿色只代表静态检查通过；最终仍需 Cocos Creator 3.8.8 编辑器、微信开发者工具与真机验证。
