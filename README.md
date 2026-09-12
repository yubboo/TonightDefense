# TonightDefense / 今晚守城

Cocos Creator 3.8.8 微信小游戏割草守城项目。

## 开发入口

开始较大修改前依次阅读：`AGENTS.md` → `docs/PROJECT-STATUS.md` → `docs/PROJECT-ARCHITECTURE.md` → `docs/development/PROJECT-RULES.md` → `docs/DEVELOPMENT-PLAN.md`。当前版本记录见 `PROJECT.md`。

## v0.6.1 目录重点

- `assets/scripts/systems/hero/`：英雄大系统，统一人物、职业、技能、局内成长和英雄装备。
- `assets/scripts/systems/storage/`：普通背包/物品/仓库，不保存英雄培养状态。
- `assets/scripts/systems/battle/`：敌人、Boss、防线、战斗目标、战场表现。
- `assets/scripts/systems/level/`：Stage、Wave、Map、关卡推进。
- `assets/scripts/systems/feature/`：暂停、设置、体力、教程、大厅等独立功能。
- `docs/architecture/project-modules.json`：当前机器可读模块骨架。
- `docs/design/HERO-PROFESSION-SKILLS.md`：职业技能设计与接入规范。
- `design-reference/`：共享设计素材基线，不参与 Cocos Runtime 导入。

大厅“英雄仓库”和普通“仓库”职责分开：英雄仓库负责人物/职业/技能/培养/英雄装备；普通仓库负责装备物品、材料、道具与消耗品持有数据。

## GitHub 工作流

Windows 开发机双击 `TonightDefense-GitHub.bat`，选择 `1. 一键推送`。脚本依次执行 Safety Gate、远端同步、暂存、删除保护、Commit 和 Push，永不自动 force push。

GitHub Action 绿色只代表静态检查通过；最终仍需 Cocos Creator 3.8.8 编辑器、微信开发者工具与真机验证。
