# TonightDefense 当前状态

## 当前版本

**v0.6.17 — 英雄 / 仓库 / 升级全屏 UI**

## 当前稳定基线

- Cocos Creator：3.8.8。
- 目标平台：微信小游戏。
- 场景：`MainMenu.scene` + `Battle.scene`；大厅各功能继续使用页面，不为英雄仓库、普通仓库、商店额外拆 Scene。
- GitHub：`main` 是远端源码事实来源；本轮开发基线为 v0.6.6 commit `6baed393`，TonightDefense Safety Gate #10 已完成且 conclusion=success。
- 音频：唯一 `AudioManager`，唯一运行目录 `assets/resources/audio/`。
- 暂停：唯一 `BattlePauseService` + `BattlePausePanel`。
- Boss：继续保持 `BossCatalog -> BossRuntimeController -> EnemyController`；本轮不复制 Boss 生命、掉落或波次逻辑。
- 战斗地图：`StageCatalog` 管关卡内容，`BattleMapCatalog` 管主题，`BattleLayoutConfig` 管战斗几何坐标。




## 英雄 / 仓库 / 升级全屏 UI（v0.6.17）

- 英雄、仓库、升级三个 Page 已改为与 ShopPage 同级的 720 设计宽全屏页面；旧大厅 TopHUD / Logo 只在战斗首页显示。
- 三页共同使用 `MainMenuFullscreenShell`：统一深绿色背景、商店同源 Header / 资源胶囊、浅色羊皮纸正文，并精确衔接 132 px 常驻底栏。
- `MainMenuBottomNav` 仍只有一个实例，由 `MainMenuView.openTab()` 统一切换商店、英雄、战斗、仓库、升级并更新选中态。
- 英雄页继续读取 Character / Profession / Skill Catalog；普通仓库继续读取 `InventoryService` 快照；升级页仅建立 UI 入口，没有复制永久成长状态。
- 三页主要交互文字不低于 16 px，说明文字保持 14–16 px，长屏高度继续跟随 `visibleDesignHeight`。

## 商品按钮垂直光学居中（v0.6.16）

- 商品卡按钮节点和底板位置不变，仅将内部文字及货币图标统一设置为 `contentY=6`。
- 售罄、免费、金币、钻石四种状态共享相同的垂直光学校正，避免系统字体和图标可见区域偏下。
- v0.6.15 的水平居中继续保留，交易回调未修改。

## 商品价格内容居中（v0.6.15）

- 商品价格底板位置不变；统一把货币图标从 `x=-72` 调整为 `x=-48`，价格文字使用 `x=26 / width=100` 的紧凑区域。
- 金币与钻石商品共享同一居中布局；免费和售罄状态继续使用 `x=0` 的纯文字居中布局。
- ShopService、价格数据、扣款与购买回调均未改动。

## 商店商品卡文字重叠修复（v0.6.14）

- 商品卡从 322×316 统一调整为 322×356，双列行距从 332 调整为 372；单数末卡继续居中。
- 头图、名称、描述、最多两行奖励、限购和价格按钮重新获得独立垂直区间，保留 14–22 px 可读字号。
- 普通、售罄、免费和付费卡继续共用一个 `createOfferCard()` 布局入口；ShopService 与 Snapshot 未改动。

## 商店与常驻底栏接缝修复（v0.6.13）

- 修复 v0.6.12 商店羊皮纸与常驻底栏之间出现城堡背景细条的视觉回归。
- ShopPage 专属背景、纸张和 ScrollView 统一结束在 `-half + 132` 的底栏顶边；纸张不再额外内缩 8 px。
- `MainMenuBottomNav`、选中框与五个 Page 切换逻辑没有复制或改写，商店交易逻辑不变。

## 底栏选中态背景统一（v0.6.12）

- `MainMenuBottomNav` 的几何、选中框和五项入口仍只有一份实现。
- v0.6.12 曾让 ShopPage 底部 142 px 透出大厅公共背景；实机预览暴露水平细缝后，该做法已由 v0.6.13 取代。
- Shop ScrollView 仍严格停在常驻底栏上方，交易逻辑和 v0.6.11 字号调整不变。

## MainMenu 底栏常驻（v0.6.11）

- 复用既有 `MainMenuBottomNav`；商店、英雄、战斗、仓库、升级五个主 Page 始终保留同一底栏及对应选中态。
- 五个主入口仍由 `MainMenuView.openTab()` 创建各自独立 Page，不新增第二套导航或当前页面状态。
- Shop ScrollView 底部预留 142 px，避开 132 px 导航与 10 px 间距；商店顶部继续使用自己的标题和资源栏。
- 商店原先 10–15 px 的主要正文、限购、奖励和按钮文字提高到 14–18 px 区间，商品标题提高到 22 px；业务状态和交易服务未改动。

## ShopPage 分类头图统一（v0.6.10）

- 五个分类都有固定 258 高度的顶部主题区；非推荐分类使用独立主题插画，避免页面结构忽高忽低。
- 商品卡外框和价格按钮只保留一层权威 Sprite；价格、货币图标与售罄文案继续由 Snapshot 动态生成。
- 新增 `shop_card_disabled` 与四张分类主题运行资源；源图仍来自 `design-reference/shop/v0.6.8-sliced-library/`，未新增第二套素材源。
- 交易、限购、库存与体力逻辑未改动。

## ShopPage 视觉回归修复（v0.6.9）

- v0.6.8 运行时切片中存在少量相邻素材串入：分隔线、部分 Banner / Tab 边缘会带入红丝带或金线碎片。v0.6.9 使用源图真实 alpha 边界重新裁切，并保持已有 `.meta` / UUID 不变。
- Shop ScrollView 增加固定浅色羊皮纸承载层，恢复方案 C 的“深色外框 + 浅色商品正文”层级；SectionTitle / Hint 继续使用深色字，但不再落在深绿色底上。
- 双列商品卡尺寸与文字可读性提高；推荐/礼包/每日等奇数数量时最后一张自动居中。
- Banner 的 `cover` 缩放统一由固定图片窗裁剪，禁止越界串到相邻卡片；卡片文字分区与短列表页脚位置已重新约束。
- 交易业务仍唯一走 ShopService / CurrencyService / InventoryService / StaminaService；本轮没有复制或迁移业务状态。

## ShopPage 正式美术（v0.6.8）

- `design-reference/shop/v0.6.8-source/` 保存 3 张原始素材表：UI、商品图标、Banner；对应正式运行资源已经预切到 `chrome/`、`banners/`、`icons/`、`item-cards/`。
- `ShopArt` 是商店 SpriteFrame 加载唯一入口；MainMenuShopPage 不直接写资源路径。
- 商店使用方案 C：固定顶部标题/余额栏，正文 ScrollView 内为推荐大 Banner + 体力侧 Banner + 横向分类 Tabs + 双列商品卡。
- Cocos 3.8.8 用户无需手工切图；直接覆盖源码/patch 后等待 Creator 导入 `.meta` 即可。

## MainMenu 全屏商店（v0.6.7，导航规则已由 v0.6.11 更新）

- 商店继续属于 `MainMenu.scene` 的 Page，不新增 Shop.scene；v0.6.11 起只隐藏大厅 TopHUD / Logo，复用并保留常驻 `MainMenuBottomNav`，商店内容跟随大厅长屏 `visibleDesignHeight`。
- `ShopCatalog` 是商品定义唯一来源；`ShopService` 是每日限购、货币扣除、库存检查与道具发放唯一入口。
- `CurrencyService` 继续唯一拥有金币/钻石；`InventoryService` 继续唯一拥有玩家物品数量；商店 UI 不保存余额、库存或购买次数。
- 体力商品不复制到 ShopService，仍唯一走 `StaminaService.purchaseStamina()`，因此原有 5 次/日递增金币价格规则保持不变。
- 当前分类：推荐 / 礼包 / 材料 / 外观 / 每日。推荐、礼包、材料、每日已有确定性购买闭环；外观等待 Hero 外观数据层后再开放。
- 当前商店不包含随机抽取或概率商品。

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

1. 在 Cocos Creator 3.8.8 实战验证 v0.6.11 ShopPage：商店顶部使用自身 Header，底部常驻 MainMenuBottomNav，滚动内容不被底栏遮挡。
2. 验证金币/钻石商品购买、每日限购、免费每日补给、库存入账与余额刷新；体力购买继续保持原 StaminaService 规则。
3. 商店稳定后继续完成 HeroPage（英雄仓库）、WarehousePage（普通仓库）和 UpgradePage（防线/长期升级）的真实业务闭环。
4. 战斗侧继续回归 v0.6.6：主角复活、伙伴自由索敌/真实回防速度、三选一属性成长、敌人红色血条。
5. 之后再补剩余职业觉醒标签与第一章完整 Vertical Slice。
