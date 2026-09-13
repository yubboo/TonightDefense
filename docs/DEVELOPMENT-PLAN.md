# TonightDefense 开发计划

## Phase A：源码基线与工程治理（持续）

v0.6.1 完成第一次系统域收口：Hero、Storage、Battle、Level、Feature 等职责按业务域归档；根目录只保留真正项目入口/工具。后续新增模块优先进入现有域，不恢复 `systems/character`、`systems/skill`、`systems/inventory` 等平铺旧目录。

## Phase B：英雄大系统（v0.6.6 当前补强）

- Character：人物身份唯一来源。
- Profession：职业基础属性与攻击模型。
- Skill：每职业 1 被动 + 4 自动主动技能。
- Progression：招募、经验、局内三选一技能成长。
- Equipment：英雄穿戴关系与战斗属性修正。
- MainMenu Hero Warehouse：人物 / 职业 / 技能 / 培养 / 装备统一入口。

v0.6.2 已增加统一 `CombatEventBus / EnemyStatusSystem`。v0.6.6 进一步统一本局成长：`HeroRunUpgradeService` 把职业技能与攻击/防御/生命/移速/闪避全部纳入三选一，`HeroRunStatState` 持有本局全队属性等级。装备只决定开局基线，不得绕过三选一私下提高本局永久移动速度。下一步继续补齐 `pull / split-fireball / final-lightning-burst / emergency-shield` 等觉醒标签与正式状态表现。

## Phase C：战斗核心与空间（v0.6.3 已完成世界适配）

v0.6.3 统一正式背景与玩法空间：`battle_ground` 原生 900 × 1600（9:16）直接成为 BattleLayout 逻辑坐标系；`BattleWorldService` 按真实设备可见尺寸做 cover 缩放，长屏只裁左右安全出血。v0.6.6 取消 AI 独立交战区：主角和 AI Hero 共用地图物理边界，AI 可全战场寻找最近怪物；战斗结束后按自身实际移速走回固定阵位，不瞬移归位。主角与伙伴统一通过防御塔复活通道复活。任何空间/技能扩展都不能重新复制 Camera/Enemy/Target/Health 系统。

## Phase D：正式 UI / 大厅功能（v0.6.17 持续）

v0.6.4 先完成 Battle 屏幕空间适配：项目仍以 720 × 1280 为设计分辨率，`BattleHudLayout` 统一把顶部/底部/左右设计边距锚到当前设备 SafeArea；顶部关卡 HUD、Boss 血条、底部五人卡/自动技能区与虚拟摇杆不再使用固定 1280 高度定位。

v0.6.5 清理正式战场残留原型：刷怪泉水不再绘制调试圆环，防线生命显示从 Canvas 大白板迁到防线世界位置的紧凑血条；后续继续把剩余 Graphics 兜底逐步替换为正式资源，但不重复业务状态。

v0.6.7 先把底部大厅功能从空壳升级为真实 Page：第一步完成全屏 ShopPage，新增 ShopCatalog / ShopService，并接回 CurrencyService、InventoryService、StaminaService。

v0.6.8 完成 ShopPage 方案 C 美术资源化：三张素材表进入 `design-reference/shop/v0.6.8-source` 作为可追溯源图，同时预切独立 PNG，运行时由 `ShopArt` 加载；商店改成顶部推荐区 + 横向分类 + 双列商品卡 + ScrollView。后续按同一原则依次完成 HeroPage、WarehousePage、UpgradePage；仍然不为这些功能拆新 Scene。

v0.6.9 对方案 C 做视觉回归修复：精确重切运行时素材，清除切片串图；正文恢复浅色羊皮纸承载层，商品卡放大并对单数卡自动居中。后续大厅页面继续遵守“设计源图留 design-reference，Runtime 只放实际使用切图”的资源边界。

v0.6.10 统一五个 Shop 分类的顶部主题区，并移除商品卡外框/价格按钮的重复 Sprite 叠层；分类主题图只从既有切片库按需进入 Runtime，不复制交易状态。

v0.6.11 将既有 `MainMenuBottomNav` 确立为五个大厅独立 Page 的常驻唯一导航；Shop ScrollView 为底栏预留空间，并提高主要正文与交互文字字号。后续大厅 Page 不得再通过“全屏模式”隐藏或复制底部主导航。

v0.6.12 统一常驻底栏背衬：Page 的专属全屏底色不得覆盖底部导航安全区，底栏及向上凸出的选中态统一露出大厅公共背景。

v0.6.13 根据 Creator 预览回归修正上述衔接方式：页面专属背景与 ScrollView 精确结束在 132 px 底栏顶边，不覆盖导航，也不再额外留出会露出城堡背景的透明间距。

v0.6.14 在不缩小文字的前提下统一增高 Shop 商品卡和行距，为名称、描述、奖励、限购和购买按钮建立互不重叠的固定分区。

v0.6.15 将商品卡货币图标与价格文字收口为紧凑居中视觉组，避免不同币种和数值长度导致按钮内容重心偏左。

v0.6.16 补充按钮内容的垂直光学校正：所有商品卡按钮状态统一上移 6 px，解决文字与货币图标在底板中视觉偏下。

v0.6.17 将 HeroPage、WarehousePage、UpgradePage 升级为与 ShopPage 同级的全屏页面，三页统一复用 `MainMenuFullscreenShell` 和唯一 `MainMenuBottomNav`；Hero / Inventory 继续读取既有事实源，Upgrade 只完成 UI，不提前复制养成状态。

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
