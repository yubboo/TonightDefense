# TonightDefense 当前状态

## 当前版本

**v0.6.6 — 英雄复活 / AI 自由索敌 / 三选一属性成长 / 敌人红血条**

## 当前稳定基线

- Cocos Creator：3.8.8。
- 目标平台：微信小游戏。
- 场景：`MainMenu.scene` + `Battle.scene`；大厅各功能继续使用页面，不为英雄仓库、普通仓库、商店额外拆 Scene。
- GitHub：`main` 是远端源码事实来源；开始本轮时远端最新稳定为 v0.6.3 commit `7bfb654`，Safety Gate 为绿色。用户随后已在本机 Cocos Creator 3.8.8 连续验证 v0.6.4 / v0.6.5 画面可运行，因此 v0.6.6 的实际增量基线为用户当前本地 v0.6.5。
- 音频：唯一 `AudioManager`，唯一运行目录 `assets/resources/audio/`。
- 暂停：唯一 `BattlePauseService` + `BattlePausePanel`。
- Boss：继续保持 `BossCatalog -> BossRuntimeController -> EnemyController`；本轮不复制 Boss 生命、掉落或波次逻辑。
- 战斗地图：`StageCatalog` 管关卡内容，`BattleMapCatalog` 管主题，`BattleLayoutConfig` 管战斗几何坐标。

## 英雄大系统（v0.6.1 收口，v0.6.2 延续）

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
- `HeroRunUpgradeService` 是 v0.6.6 起本局成长三选一统一入口：技能候选继续由 `HeroSkillUpgradeService` 持有，攻击/防御/最大生命/移动速度/闪避等级由 `HeroRunStatState` 持有；禁止 UI 或装备在战斗中另写永久成长。
- 所有职业基础移动速度统一为 `HERO_BASE_MOVE_SPEED = 138`；技能临时移速效果允许继续走 Skill Modifier，因为技能本身也只能通过三选一解锁/升级。

### 当前技能效果支持层级

已统一支持：单体/多段/范围/直线/扇形/多目标/连锁伤害、治疗、单体/团队护盾、团队增益、持续治疗区域、燃烧、击退、攻击/攻速/移速/减伤等英雄临时修正。

v0.6.2 新增两条底层事实链：

- `CombatEventBus`：发布英雄受击、敌人受击、敌人死亡事件，事件不重复结算生命/伤害；
- `EnemyStatusSystem`：统一保存 slow / stun / freeze / taunt / hunter mark，EnemyController 只读取这些状态修正。

已经正式落地：坦克真实受击叠层与嘲讽、游侠猎人印记/印记增伤/标记击杀减 CD/标记暴击、法师元素共鸣伤害+范围强化、冰霜新星冻结/减速、盾击眩晕以及 Boss/精英控制抗性规则。

仍未宣称完成的少数觉醒标签包括 `pull`、`split-fireball`、`final-lightning-burst`、`emergency-shield` 等；后续继续通过现有 Battle/Hero 接口实现，不把职业特判写回 HUD。


## 英雄复活 / AI / 本局成长（v0.6.6）

- `DefenseObjectiveService -> CoreHealth` 统一负责主角与伙伴复活通道；每名阵亡英雄独立记录传输进度，但共同消耗同一防御塔生命。塔损坏后所有未完成复活立即中断。
- 主角复活期间 `MainHeroController.isCombatReady = false`，不会注册为有效受击目标，也不会被 AutoAttack / HeroSkillRuntime 当作可行动角色；BattlePartyHUD 显示“复活中”。
- `CompanionBattleController` 使用 `EnemyController.findNearestEnemy()` 做全战场最近目标搜索，不再存在 `aiHeroMoveBounds/findNearestEnemyInBounds` 第二套交战边界。
- AI 追怪、回防、巡逻移动都读取 `CharacterCombatant.moveSpeed`；无怪时先真实走回固定阵位，不瞬移归位。
- `PlayerController` 保留历史组件兼容/调试视觉，但不再读取摇杆或移动主角；唯一玩家移动 Runtime 是 `MainHeroController`。
- 敌人世界血条普通/精英/Boss 统一红色填充。

## 正式战场原型残留清理（v0.6.5）

- 怪物泉水仍由 `BattleLayoutConfig.enemySpawn.fountains` 提供刷怪位置，但 `BattleSceneSetup` 不再绘制蓝紫色 `EnemyFountain_*` Graphics 圆环。
- `CoreHealth` 仍是雕像/城墙/公主生命、复活消耗和失败条件唯一状态源；只是把显示从 Canvas 大面板迁到 BattleWorldRoot 内的小型世界血条。
- 旧 `DefenseStatusUI` / `CoreHpUI` 会在场景进入时从 Canvas 与 BattleWorldRoot 两侧主动清理，兼容 Creator 热重载和覆盖更新。
- 正式战斗上半屏只保留关卡 HUD、敌人和地图，不再被 642×96 防线调试面板长期占住。

## Battle HUD / SafeArea（v0.6.4）

- 项目设计分辨率继续保持 720 × 1280；不把 iPhone / 安卓物理像素写进 UI 业务代码。
- `BattleHudLayout` 是战斗屏幕空间布局唯一换算入口：读取实际 visible size / visible origin / safe area，输出中心坐标系中的 safeTop / safeBottom / safeLeft / safeRight。
- 顶部关卡 HUD、Boss 血条锚定 safeTop；底部五人卡/自动技能 dock 锚定 safeBottom；摇杆锚定 safeLeft + safeBottom。
- BattleWorld / 正式背景继续使用 v0.6.3 的 900 × 1600 cover 策略；HUD SafeArea 不反向修改战场世界缩放。
- Creator 设备预览切换时，Chapter HUD 每帧检查布局；Party HUD / Joystick 每 0.25 秒刷新一次边缘锚点，避免长屏切换后停在旧 1280 位置。

## 战斗视口 / 正式背景（v0.6.3）

- 正式 `battle_ground` 原图为 900 × 1600（9:16），`BattleLayoutConfig.map` 同步为同一逻辑尺寸；背景和玩法不再使用两个不同比例的空间。
- `BattleWorldService` 是世界缩放唯一来源，运行时使用 `max(visibleWidth / mapWidth, visibleHeight / mapHeight)` 的 cover 策略。
- 720 × 1280 设计视口：世界缩放 0.8，整张 9:16 地图刚好填满。
- 更长设备：按高度填满并只裁左右树林出血；不再把完整背景缩在手机可视区外面。
- `BattleCameraController` 使用实际 WorldRoot scale 做 hero screen / clamp；viewport 与 world scale 每 0.5 秒同步刷新。
- HUD / 摇杆 / 弹窗仍属于 Canvas 屏幕空间，不跟随地图缩放。

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

1. 在 Cocos Creator 3.8.8 实战验证 v0.6.6：主角阵亡后防御塔应持续扣血并复活主角；塔生命不足时复活中断。
2. 验证伙伴可追击上方任意怪物；无怪后按真实英雄移速走回固定阵位，不能瞬间跳回防线；所有职业开局移速应一致。
3. 验证三选一同时能出现职业技能与全队属性卡；疾行/强攻/坚甲/体魄/灵巧只通过该入口永久强化本局属性，新招募英雄能继承已经获得的全队属性等级。
4. 回归敌人普通/精英/Boss 世界血条均为红色，以及 v0.6.2 的嘲讽、印记、冻结/减速与自动技能循环。
5. 继续实现剩余觉醒标签和英雄仓库永久培养；永久培养与本局三选一必须保持两套生命周期，不把局内等级写入永久英雄数据。
