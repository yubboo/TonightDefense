# TonightDefense 当前状态

## 当前版本

**v0.6.3 — 战斗背景 / 手机视口统一适配**

## 当前稳定基线

- Cocos Creator：3.8.8。
- 目标平台：微信小游戏。
- 场景：`MainMenu.scene` + `Battle.scene`；大厅各功能继续使用页面，不为英雄仓库、普通仓库、商店额外拆 Scene。
- GitHub：`main` 是源码事实来源；本版本开发基线为 v0.6.2 commit `452b482`，该提交 GitHub Safety Gate 为绿色；用户已确认上一版 Battle 在 Cocos Creator 3.8.8 可正常运行。
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

### 当前技能效果支持层级

已统一支持：单体/多段/范围/直线/扇形/多目标/连锁伤害、治疗、单体/团队护盾、团队增益、持续治疗区域、燃烧、击退、攻击/攻速/移速/减伤等英雄临时修正。

v0.6.2 新增两条底层事实链：

- `CombatEventBus`：发布英雄受击、敌人受击、敌人死亡事件，事件不重复结算生命/伤害；
- `EnemyStatusSystem`：统一保存 slow / stun / freeze / taunt / hunter mark，EnemyController 只读取这些状态修正。

已经正式落地：坦克真实受击叠层与嘲讽、游侠猎人印记/印记增伤/标记击杀减 CD/标记暴击、法师元素共鸣伤害+范围强化、冰霜新星冻结/减速、盾击眩晕以及 Boss/精英控制抗性规则。

仍未宣称完成的少数觉醒标签包括 `pull`、`split-fireball`、`final-lightning-burst`、`emergency-shield` 等；后续继续通过现有 Battle/Hero 接口实现，不把职业特判写回 HUD。


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

1. 在 Cocos Creator 3.8.8 的 720×1280、iPhone 14/15 长屏和微信开发者工具中验证 v0.6.3：背景必须全屏 cover，主战道路/防线保持居中，不再出现“手机框缩在大背景中间”的比例错位。
2. 回归 v0.6.2 的坦克受击叠层、嘲讽目标切换、游侠印记、冻结/减速、Boss 控制抗性和长时间自动技能循环。
3. 继续实现剩余觉醒标签：牵引/黑洞、分裂火球、最终雷爆、紧急护盾等；优先扩 Resolver/Status/Event，不新增第二套 Runtime。
4. 把英雄仓库从“真实数据概览”继续推进到永久英雄等级、培养、突破和逐英雄装备配置；不要把局内技能等级保存成永久等级。
5. 为所有职业制作独立技能图标/特效，并给 hunter mark / taunt / freeze 等状态增加正式战斗表现；微信真机继续验证 GC、长屏 HUD 和 30/60 FPS。
