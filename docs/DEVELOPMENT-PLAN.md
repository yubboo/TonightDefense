# TonightDefense 开发计划

## Phase A：源码基线与工程治理（持续）

v0.6.1 完成第一次系统域收口：Hero、Storage、Battle、Level、Feature 等职责按业务域归档；根目录只保留真正项目入口/工具。后续新增模块优先进入现有域，不恢复 `systems/character`、`systems/skill`、`systems/inventory` 等平铺旧目录。

## Phase B：英雄大系统（v0.6.2 已完成底层补强）

- Character：人物身份唯一来源。
- Profession：职业基础属性与攻击模型。
- Skill：每职业 1 被动 + 4 自动主动技能。
- Progression：招募、经验、局内三选一技能成长。
- Equipment：英雄穿戴关系与战斗属性修正。
- MainMenu Hero Warehouse：人物 / 职业 / 技能 / 培养 / 装备统一入口。

v0.6.2 已增加统一 `CombatEventBus / EnemyStatusSystem`，并正式接通坦克受击叠层/嘲讽、游侠印记、法师冻结/减速与共鸣范围强化。下一步继续补齐 `pull / split-fireball / final-lightning-burst / emergency-shield` 等觉醒标签与正式状态表现。

## Phase C：战斗核心与空间（v0.6.3 当前重点）

v0.6.3 统一正式背景与玩法空间：`battle_ground` 原生 900 × 1600（9:16）直接成为 BattleLayout 逻辑坐标系；`BattleWorldService` 按真实设备可见尺寸做 cover 缩放，长屏只裁左右安全出血。继续保护现有 Hero/AI Hero、招募、复活、防线、波次和 Boss 闭环；AI Hero 只在主战场 + 防守区活动，主角可以主动进入上方危险区。任何空间/技能扩展都不能重新复制 Camera/Enemy/Target/Health 系统。

## Phase D：正式 UI / 美术

- 战斗 HUD 继续读取 Runtime，不保存业务状态。
- 主角右侧 4 技能位改为“自动技能状态”：锁定 / 等级 / 冷却。
- 为全部职业补齐独立技能图标、预警和命中特效。
- 英雄仓库逐步从真实 Catalog 概览升级为永久培养 UI。
- 普通仓库继续展示真实 Inventory/Warehouse 数据，不混入英雄培养状态。

## Phase E：内容扩展

新增英雄、职业、技能、敌人、Boss、地图、装备时，优先只扩 Catalog/Definition/素材，不复制 Runtime。职业技能新增必须遵循 `docs/design/HERO-PROFESSION-SKILLS.md`。

## Phase F：微信发布优化

- 分包与首包尺寸；
- 30/60 FPS 真机基线；
- 自动技能高频选敌的对象分配与 CPU 热点；
- GC / 对象池；
- 音频与触摸兼容；
- 云存档；
- 发布回归矩阵。

## CI 计划

Hosted Runner 继续只做静态 Gate。未来在装有 Cocos Creator 3.8.8 的 Windows 开发机增加 self-hosted Runner，才允许增加真实 Creator Build Gate。
