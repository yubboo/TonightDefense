# TonightDefense 项目说明

## 项目信息

- 项目名：TonightDefense
- 当前整理包版本：v0.4.19
- Cocos Creator：3.8.8
- 目标平台：微信小游戏

## 开发规范

AI / Agent / 自动化修改项目时，统一遵循项目根目录 `AGENTS.md`。开发规范只维护这一份，避免与项目说明重复。

## 使用方式

1. 解压后，用 Cocos Creator 3.8.8 打开 `TonightDefense` 目录。
2. 第一次打开时等待 Cocos 自动重新导入资源。
3. 在 Cocos 中先预览测试，再正常构建微信小游戏。

源码包不包含 `library`、`temp`、`build`、`native` 等自动生成目录，以减少缓存污染和 Windows 路径过长问题。



## v0.4.19 GitHub 一键推送可见性确认修复

- 修复 Public/Private 人工确认大小写过严的问题：`PUBLIC`、`Public`、`public`、`P` 均可识别，Private 同理。
- 匿名 GitHub API 无法判断仓库可见性时，不再把“自动检测失败”误导成 GitHub 推送失败；改为明确提示人工确认。
- 用户首次确认 Public/Private 后，结果保存到当前仓库 `.git/config` 的 `tonightDefense.repositoryVisibility`，不会进入 GitHub，也不会每次 Push 重复询问。
- 保留 Public 仓库源码保护：第一次公开推送仍需明确确认，但确认后不再反复打断工作流。
- 本版本只修改 GitHub 辅助脚本、版本说明和开发规范，不改任何游戏逻辑。

## v0.3.7 变更

- 修复 Cocos 浏览器预览刷新时把启动音频当作下载文件保存到系统“下载”目录的问题。
- 启动音频从 WAV 切换为 MP3 资源，统一放到 `assets/resources/audio_v2/`。
- 音频系统路径切换到 `audio_v2`，旧 WAV 不再被运行时代码加载。
- 取消启动时对 `ui_click` 与 `hit` 的强制预载，音效只在真正需要播放时加载。
- `full` 包已清理旧 `assets/resources/audio/` WAV 资源；`patch` 只新增新资源并修改音频管理代码，便于直接覆盖。

## v0.3.6 变更

- 新增全局 `AudioManager`：跨场景常驻，统一管理 BGM、战斗 SFX 与 UI 音效。
- 新增音频设置持久化：主音量、背景音乐、游戏音效、静音状态会自动保存。
- 游戏设置面板加入声音控制；大厅与战斗继续共用同一个设置面板。
- 新增 BGM 自动切换：大厅 / 普通战斗 / BOSS 三套循环音乐，并带淡入淡出。
- 首批接入音效：UI 点击、主角攻击、命中、怪物死亡、小关通过、升级、BOSS 警报。
- 高频战斗音效加入节流，避免群怪同时受击/死亡时大量音频调用拖慢微信小游戏。
- `assets/resources/audio/` 内附首版原创程序合成占位音频，方便立即测试整套系统；后续可直接用正式音乐/音效替换同名资源。
- 补丁包规则：ZIP 根目录直接是需要覆盖到项目根目录的 `assets/` 等目录，不再额外套版本文件夹。

## v0.3.3 变更

- 优化主角移动：加入短时速度平滑、异常大 `dt` 限制，降低微信端移动顿挫与瞬移感。
- 优化虚拟摇杆：增加中心死区、触摸输入立即发布，并复用坐标对象，减少触摸期间临时对象和 GC。
- 优化战斗热路径：怪物 AI 查询目标不再每帧创建临时目标数组；敌人更新不再每帧复制敌人数组；选敌临时对象、防线坐标与弹道目标坐标改为复用，进一步降低微信端 GC 抖动。
- 保留并加强 `BattleTargetRegistry` 的异常目标清理，继续避免 `isAlive is not a function` 类错误。
- 新增游戏设置面板：支持目标帧率 30 / 60 / 120 FPS 选项，并保存玩家选择。
- 大厅右上角“设置”按钮已接入设置面板；战斗 HUD 进度数字右侧新增“设”按钮，可在战斗中直接打开。
- 微信小游戏当前公开帧率接口有效范围最高为 60 FPS，因此微信端 120 FPS 会显示但禁用；其它支持高刷的平台可选择 120 FPS，实际帧率仍取决于设备刷新率和性能。

## v0.3.2 关键修复

- 修复战斗目标筛选中旧/异常目标对象导致的 `isAlive is not a function` 报错。
- 加固敌人近战、远程弹道的目标有效性检查。
- 战斗开始时清空静态目标注册表，避免热重载残留对象污染新一局。

## 项目整理规则

- 项目说明统一只保留本文件 `PROJECT.md`。
- 不再散落生成说明、修复说明、恢复说明等 `.txt` / `.md` 文件。
- 压缩包统一命名：`TonightDefense-vX.X.X.zip`。
- 版本递增后，在本文件中记录必要的变更摘要。

## 目录说明

- `assets/`：Cocos 游戏场景、脚本与运行资源。
- `cloudfunctions/`：微信云函数。
- `extensions/wechat-cloud-sync/`：微信构建后的云函数同步扩展。扩展保留编译后的 `dist`，不携带开发用 `node_modules`。
- `design-reference/`：美术/UI 设计参考素材，不参与 Cocos 运行时资源导入。
- `spine_source/`：Spine 源素材参考，不参与 Cocos 运行时资源导入。

## 备注

后续修复继续直接基于 Cocos 源项目进行；完成后重新构建微信小游戏即可。


## v0.3.4

- 修复微信开发者工具中拖动虚拟摇杆时的卡顿、闪烁、瞬移：TOUCH_MOVE 事件只记录最新坐标，复杂计算限制为每帧一次。
- 主角移动改为直接按摇杆方向积分，不再二次速度平滑，减少输入迟滞和松手拖尾。
- 极端长帧的位移步长限制为 1/30 秒，避免调试器偶发长帧造成明显瞬移。
- 角色左右朝向只在真正改变时更新，避免每帧重复 setScale 造成 UI Transform 持续脏标记。
- 微信开发者工具启动阶段偶发的 `[jsbridge] getSystemInfo ... jsbridge not ready` 属于工具/运行时初始化时序提示；项目代码未调用 `getSystemInfo`，且后续场景正常加载时无需作为游戏逻辑错误处理。

## v0.4.1

- 音频修复包：以 v0.3.8 `audio_v2` 阶段的 MP3 资源为权威源，完整恢复 3 个 BGM + 7 个 SFX，并统一迁移到唯一目录 `assets/resources/audio/`。
- 恢复并保留 v2 阶段的音频解锁、缓存、BGM 淡入淡出、SFX 节流和设置持久化逻辑；运行时不再依赖 `audio_v2`。
- 首次用户交互后预热大厅 BGM、UI 点击、命中这 3 个最早使用的核心音频，避免迁移后出现“文件在但首次事件无声”的错觉。
- 补丁同时重发所有音频调用接入点，便于直接覆盖修复本地可能存在的混合版本文件。

## v0.4.0

- 设置界面恢复为居中弹窗；弹窗外使用一次性低分辨率 RenderTexture 放大形成模糊/磨砂背景，捕获后立即销毁额外相机。
- 音频资源目录统一为 `assets/resources/audio/`，删除历史 `audio_v2`。
- AudioManager 所有动态加载路径统一回 `audio/...`。
- 音频 MP3 与目录均补齐 `.meta`，后续版本保留对应 UUID。


## v0.4.2 音频修复
- 修复 Web 预览的自动播放假状态：大厅 BGM 不再需要打开设置才开始播放。
- 声音默认开启：主音量 100%，BGM 70%，SFX 70%。已有玩家设置仍会按本地保存值读取。
- 音频目录保持唯一 `assets/resources/audio/`，无 `audio_v2`。
- 10 个音频资源明确对应 3 个 BGM + 7 个 SFX；不再启动时预载全部音频。
- 主角选择、技能选择、招募选择补齐 UI 点击音效。
- v0.4.2 patch 不再覆盖 MainMenuController 等无关文件，避免 Cocos 热重载时组件短暂失效。

## v0.4.3 音频系统审计修复

- 对当前项目 109 个 TypeScript 文件做静态语法检查：0 个语法错误；所有相对导入均可解析。
- 检查 427 个 `.meta`：0 个损坏、0 个重复 UUID。`MainMenuController.ts` 与其 `.meta` 和 v0.3.8 已验证版本完全一致，场景引用 UUID 也一致。
- 确认音频目录唯一为 `assets/resources/audio/`：3 个 BGM + 7 个 SFX，共 10 个 MP3；无 WAV、无 `audio_v2`。
- 找到 v0.4.2 的真实重复播放问题：UI 每次点击都会再次执行音频解锁逻辑，从而重复 `play()` 当前 BGM。现在音频解锁只允许首次用户交互执行一次。
- 移除 `playUi()` 对音频解锁的重复调用；Web 预览仅由全局首次触摸/鼠标按下完成一次解锁。
- SFX 在 Web 音频未解锁前不再提前请求资源，减少无效请求。
- 修复“设置”入口双点击音：大厅按钮本身已有点击音，不再由设置面板重复播放；战斗 HUD 单独补 1 次点击音。
- v0.4.1 曾在首次交互预热 `menu + ui_click + hit`，这正对应本地预览里同时出现 `ui_click.mp3` 与 `hit.mp3` 请求。v0.4.3 已彻底取消该预热逻辑。
- 应用本版本后需要关闭 Cocos，删除项目根目录 `library` 与 `temp`，再重新打开项目，让 Creator 重新建立脚本索引，清除 v0.4.1/v0.4.2 热重载遗留缓存。

## v0.4.4 音频系统回归审计与重建

- 按 `AGENTS.md` 执行全项目音频调用链审计，并以 v0.3.8 的音频系统作为 Last Known Good。
- `AudioManager` 回退到 v0.3.8 已验证的单一播放模型，仅把资源路径统一为 `audio/...`；删除 v0.4.1-v0.4.3 期间新增的 `desiredBgm`、Web 播放门禁和重复解锁分支。
- Web 首次交互只做一次“恢复被浏览器自动播放策略阻止的 BGM”，普通 `playUi()` / `playSfx()` 不再触碰 BGM。
- BGM 同曲幂等：当前曲目已激活时不会因普通点击重新从头播放。
- SFX/点击音继续使用单例缓存与 `playOneShot`；资源首次加载后从 `clipCache` 复用，不在业务点击中重新初始化 AudioManager。
- 保留唯一目录 `assets/resources/audio/`，3 个 BGM + 7 个 SFX 的 MP3 与 `.meta` 不重新生成、不改 UUID，避免资源地址继续漂移。
- 审计确认 10 个声音均有明确调用点：大厅/战斗/BOSS BGM、UI 点击、主角攻击、命中、敌人死亡、小关通过、升级、BOSS 警报。
- `MainMenu.scene` 与 `MainMenuController.ts.meta` UUID 一致；项目缓存日志可见 `Register MainMenuController`。本版本不为“保险”重写场景或主菜单脚本。

## v0.4.6 战斗 HUD 美化版

- 在不改动战斗主逻辑的前提下，重做顶部 `ChapterWaveHUD` 的视觉层级：左侧控制组、中央关卡标题牌、右侧怪物等级卡、下方进度条与设置入口重新排布。
- 顶部 HUD 统一为更明确的米色面板 + 深色标题牌 + 柔和描边，改善“信息挤在一起”的问题，提升微信小游戏小屏可读性。
- 重绘底部 `DefenseStatusUI`：新增整体状态面板、两条更易读的雕像/城墙血条，以及独立的公主状态卡，使底部状态区和顶部 HUD 风格统一。
- 美化虚拟摇杆底座与摇杆旋钮，保持交互逻辑不变，仅优化透明度、层次和高光细节。
- 本版本仅涉及战斗场景 UI 呈现，不修改音频、关卡推进、暂停逻辑或战斗数值。


## v0.4.7 大地图与主角镜头跟随

- 战斗世界新增唯一 `BattleWorldRoot`：地图、主角、伙伴、怪物、弹道和战斗特效统一进入世界层；HUD、摇杆、设置/选择弹窗继续固定在 Canvas 屏幕层。
- 新增唯一 `BattleCameraController` 负责镜头表现。由于当前项目使用单 Canvas 2D 架构，为避免 Camera 缩放连带 HUD，本版本采用“固定屏幕 Camera + 平移/缩放 BattleWorldRoot”的等价镜头方案。
- 世界视野默认缩放到 84%，相当于把战斗镜头拉远约 19%；主角默认位于屏幕中心略偏下的位置，给前方敌人更多可视空间。
- 镜头使用 `lateUpdate()`、安全区和指数平滑跟随，避免镜头每像素粘住主角造成抖动；同时加入地图边缘 clamp，防止移动到边缘时露出黑边。
- 战斗地图扩展为 1400 × 2800 世界单位，道路与两侧植被同步加宽拉长；主角出生点移动到地图中心，移动范围扩展。
- 怪物出生区、防御塔、城墙、公主与伙伴活动范围同步迁移到大地图坐标。
- 所有战斗实体统一挂到世界层，继续使用同一套局部战斗坐标，避免镜头移动破坏选敌、碰撞距离、弹道与防线目标逻辑。
- 本版本不修改音频、暂停、关卡奖励和角色战斗数值。


## v0.4.8 无限战场 / 八方来袭 / 目标优先级修复

- 修复 Cocos 编辑器预览 `Part_shadow already contains cc.UITransform`：元素法师拆件创建 Sprite 后统一复用自动存在的 `UITransform`，不再重复添加组件。
- 伙伴元素法师的异步拆件创建补齐失败捕获；视觉加载失败只降级该伙伴视觉，不再产生未处理 `PromiseRejectionEvent`。
- 战斗地图改为逻辑无边界：主角移动不再受旧 `heroMoveBounds` 矩形限制，镜头也不再执行有限地图边缘 clamp。
- 地面改为 3×3 循环地块。九个 Graphics 地块围绕主角按格子重排，不在运行时无限创建节点，也不会因为主角走远露出固定地图外的黑边。
- 镜头视野从 0.84 调整为 0.76，并继续使用 `lateUpdate()` + 安全区 + 平滑跟随；主角保持略偏下，扩大前方和侧向视野。
- 怪物出生改为八方环形：N / NE / E / SE / S / SW / W / NW 八个方向随机来袭，并加入随机半径和切线抖动，取消旧版只从上方三个固定点刷怪。
- 怪物目标优先级统一为：只要主角或任意伙伴仍存活，始终先攻击距离最近的角色；全部角色死亡后才进入 `雕像 -> 城墙 -> 公主` 的防线目标顺序。
- 四名伙伴定位为守城单位：出生在雕像/城墙周围的两前两后阵型，只在防线警戒半径内追击敌人，空闲时在各自守位附近小范围巡逻，不再追怪跑遍无限地图。
- 保留原有雕像复活伙伴机制；若暂时没有存活角色，怪物会攻击当前防线目标，伙伴复活后可再次成为角色目标。
- 本版本不修改音频系统、暂停系统、关卡奖励和角色战斗数值。


## v0.4.9 路线 B：有限守城战场与持续复活

- 放弃 v0.4.8 无限地图，改回有明确左右/上边界、底部固定据点的有限战场；地图横向比纵向更宽，保留左右拉扯空间，但整体不做过长。
- 镜头保持拉远视角；主角向左、向右、向上越过安全区后平滑跟随，向下返回防守区时镜头不再继续下移。
- 战场分为三层：上半区“怪物泉水 + 前线交战区”、中间“主战场/大乱斗区”、下半区“玩家防守区”。
- 上半区设置 5 个固定怪物泉水。刷怪根据主角当前横向位置，优先从最近泉水及左右相邻泉水出现，形成左上 / 上 / 右上来袭，同时允许玩家主动上前堵泉水。
- 四名伙伴继续作为守城单位，并新增 4 个固定复活位。伙伴阵亡后回到对应复活位，不再延迟后瞬间复活。
- 防御塔雕像成为伙伴复活能量唯一来源：单次复活约 4 秒，伙伴生命持续从低血量恢复到满血，雕像生命同时持续消耗；传输过程中显示从雕像流向复活位的动态能量束与移动光点。
- 复活中的伙伴暂不参与 AI、怪物目标选择和受击；传输完成后才重新加入战斗。若雕像在传输中被打坏或生命耗尽，复活立即中断。
- 怪物攻击优先级继续保持：主角 / 已复活伙伴优先；五名角色均无可攻击目标后，才按“防御塔雕像 -> 城墙 -> 公主”依次推进。
- 保留 v0.4.8 的 `MageCutoutFactory` UITransform 重复添加修复与异步 Promise 捕获，不回退音频和已稳定战斗系统。


## v0.4.10 伙伴自动索敌与四宫格复活位修复

- 修复 v0.4.9 伙伴“看起来不会自动找怪”的回归：根因是伙伴索敌被限制为防守区附近 520 距离，且移动边界只覆盖下半区。现在恢复全战场最近敌人索敌，有限地图内只要存在存活怪物，伙伴就会主动追击并可一直推进到上半区怪物泉水进行堵口作战。
- 保留路线 B 的有限战场，不恢复无限地图；伙伴移动边界覆盖怪物泉水区、主战场区与下方防守区。
- 伙伴固定出生位恢复为两行两列四宫格：伙伴1/伙伴2 在第一排，伙伴3/伙伴4 在第二排。
- 复活位与固定出生位统一为同一套四宫格坐标。伙伴阵亡后回到自己的固定出生位接受防御塔雕像持续能量传输，避免“出生一套、复活另一套”的双重阵位。
- 无怪时伙伴会回到各自固定阵位附近做小范围巡逻；有怪时再离开阵位主动迎战。
- 本版本不修改音频、主角镜头规则、怪物攻击优先级与持续消耗雕像生命的复活机制。

## v0.4.11 暂停系统回归修复

- 修复 v0.4.6 之后战斗暂停按钮失效的回归。根因是 v0.4.6 HUD 美化时误以未包含 v0.4.5 暂停功能的源码树为基底，导致 `BattlePausePanel` / `BattlePauseService` 文件和 HUD 的暂停按钮绑定一起丢失。
- 以 v0.4.5 已验证可用实现作为 Last Known Good，恢复唯一的 `BattlePauseService` 与 `BattlePausePanel`，没有新增第二套暂停逻辑。
- 当前美化后的顶部 HUD 保持不变，仅重新把 `Ⅱ` 按钮接回暂停弹窗；`≫` 仍保持未实现状态。
- 暂停菜单恢复：继续游戏、游戏设置、重新开始、返回大厅；重新开始不重复扣体力，返回大厅不返还本局已消耗体力。
- 本次修复不修改 v0.4.10 的伙伴自动索敌、四宫格出生/复活位、路线 B 地图、怪物刷新和持续能量复活机制，也不修改音频系统。


## v0.4.12 英雄系统统一与 AI 战区约束

- 明确 CharacterSystem 的统一规则：所有可上场人物都来自同一 `CharacterCatalog`，职业战斗数据统一来自 `ProfessionCatalog`；“主角”与“伙伴”不再是两套战斗数据，区别只在控制模式：玩家控制 / AI 控制。
- `BattleTargetRegistry` 将玩家主角与 AI 伙伴统一登记为 Hero 目标，并记录 `controlMode`。怪物仍然优先攻击任意存活英雄，所有英雄都失去战斗能力后才攻击“雕像 -> 城墙 -> 公主”。
- AI 伙伴不再使用独立的伙伴专属 HP / 攻击 / 防御 / 移速 / 射程表；战斗运行时直接使用该人物对应职业的 `baseStats`、攻击模式、射程、攻速与弹道速度。旧伙伴参数接口保留为兼容层，但只映射到 ProfessionSystem，不再维护第二套硬编码数值。
- 路线 B 下新增统一 `aiHeroMoveBounds`：四名 AI 英雄只在“主战场 + 玩家防守区”活动，不再追怪进入上方怪物泉水区，避免单个伙伴先冲泉水、后续伙伴逐个跟上送死。玩家控制主角仍可进入上半区主动堵泉水。
- AI 英雄索敌改为“可达交战区域”查询。EnemyController 新增有边界的最近敌人查询入口；每名 AI 英雄按自身职业射程扩展交战边界，远程可在战场边缘攻击进入射程的怪物，近战不会锁定永远够不到的泉水区目标。
- 无可交战目标时，AI 英雄继续返回原有四宫格固定出生/复活位附近巡逻；持续消耗雕像生命的复活机制、暂停系统、音频系统与现有镜头规则保持不变。


## v0.4.13 招募回归修复与英雄系统审计

- 修复 v0.4.12 点击“招募”后卡住、无法结束招募选择的问题。根因是英雄统一重构删除了 `statProfile` 局部变量，但 `CompanionBattleController.spawnCompanion()` 末尾的部署日志仍引用旧变量；运行到该日志时抛出 `statProfile is not defined`，从而中断 `LevelUpChoiceController` 的后续 `finishReward()`。
- 日志改为使用当前唯一权威职业数据 `profession.baseStats`，不恢复旧的伙伴独立属性表，也不新增兜底/第二套英雄逻辑。
- 重新审计招募链：`LevelUpChoiceController -> RecruitService -> PartyState -> CompanionBattleController -> CharacterCatalog -> ProfessionCatalog`。招募池、主角排除、队伍上限和职业映射均保持单一数据源。
- 数据完整性检查：15 个 CharacterDefinition 无重复 ID、15 个招募候选均能解析到合法 ProfessionDefinition；随机招募模拟可连续招满 4 名 AI 英雄，已选主角在 1000 次候选抽取中未重新进入招募池。
- 使用独立 Cocos API stub 做源码语义检查，确认 v0.4.12 的 `statProfile` 未定义错误已消失；其余报告项为项目原有类型提示，与本次招募故障无关。
- 本版本不修改 AI 战区约束、四宫格出生/复活位、持续能量复活、暂停、音频、镜头与怪物目标优先级。



## v0.4.15 GitHub 首次推送修复

- 修复首次初始化本地 Git 仓库时没有 `origin`，`git remote get-url origin` 在 Windows PowerShell 5.1 + `ErrorActionPreference=Stop` 下把正常的 stderr 提升为终止错误的问题。
- Git remote 初始化改为先读取 `git remote`：没有 `origin` 时直接创建并绑定 `https://github.com/yubboo/TonightDefense.git`；已有但 URL 不一致时再安全更新。
- 修复空 GitHub 仓库首次推送流程：先用 `git ls-remote --heads origin main` 判断远端 `main` 是否存在；空仓库不再先执行会失败的 `git fetch origin main`。
- 新增统一 `Invoke-GitProbe`：所有预期允许失败的 Git 探测都隔离 stderr/退出码，避免 PowerShell 5.1 把探测结果误判成脚本异常。
- Public 仓库保护改成可交互明确确认：在菜单模式输入 `PUBLIC` 才允许本次公开推送；仍推荐改为 Private。
- 首次提交前自动检查当前仓库的 `user.name` / `user.email`；未配置时在菜单模式引导填写，避免推送流程最后才因 Git 身份缺失失败。
- 开发规范新增强制交付命名：每版必须提供 `TonightDefense-vX.Y.Z.zip` 主源码包；patch/full 只能作为附加包，且所有包都必须包含项目名和版本号。
- 本版本不修改游戏业务代码。

## v0.4.14 GitHub 可复现源码基线

- 新增 `TonightDefense-GitHub.bat + push-tonight-defense.ps1` 一键 GitHub 工作台：安全检查、远端 rebase、暂存、关键删除保护、Commit、Push；脚本永不自动 force push。
- 一键脚本默认检测 `yubboo/TonightDefense` 仓库可见性；项目按闭源开发处理，检测到 Public 仓库时默认停止，需先改 Private。
- 新增根 `.gitignore/.gitattributes`，明确 Cocos 源码与生成目录边界：`assets/settings/build-templates/cloudfunctions/extensions` 等进入 Git；`library/temp/build/profiles/node_modules/design-reference` 等不进入普通 Git 历史。
- 新增 GitHub Safety Gate，检查关键项目骨架、Scene JSON、Meta JSON/重复 UUID、TypeScript 相对 import、音频唯一目录/AudioManager、v0.4.13 `statProfile` 招募回归、秘密/禁止目录/大文件。
- 新增精简核心 docs：当前状态、项目架构、GitHub/Cocos 开发规则、阶段计划。`AGENTS.md` 增加固定阅读顺序和“开发前主动检查 GitHub main + Actions”规则。
- GitHub Hosted Runner 当前只提供静态验证；Cocos Creator 3.8.8 编辑器预览、微信开发者工具和真机仍是运行验收权威。后续可配置 Windows self-hosted Runner 增加真实 Creator Build Gate。
- GitHub 工具热修复：`push-tonight-defense.ps1` 与 `scripts/github/check-project.ps1` 固定为 UTF-8 BOM + CRLF，兼容 Windows PowerShell 5.1 对中文脚本的解析；BAT 启动时切换 UTF-8 控制台代码页，避免“中文乱码 -> 引号损坏 -> ParserError”。

## v0.4.16 GitHub Safety Gate 中文路径修复

- 修复首次 GitHub 推送时 `check-project.ps1` 对中文文件名的处理：Git 默认 `core.quotePath=true` 会把 `清理Cocos缓存.bat` 等路径输出成带引号的八进制转义，随后 `Test-Path` 报 `Illegal characters in path`。
- Safety Gate 的 `git ls-files` / `git diff --name-only` 现在显式使用 `-c core.quotePath=false`；Git 初始化也会设置仓库级 `core.quotePath=false`。
- `Test-Path` / `Get-Item` 增加路径解析异常保护，避免单个异常文件名导致整个检查脚本直接崩溃。
- staged 删除检查同样关闭 quotePath，确保中文关键文件的删除保护能够正确工作。
- 开发规范进一步明确：任何正式版本（包括 GitHub 工具热修复）都必须优先交付 `TonightDefense-vX.Y.Z.zip` 主源码包；patch/full 仅为附加包。
- 本版本不修改任何游戏逻辑、战斗数值、音频、UI 或场景。



## v0.4.17 GitHub Safety Gate 假阳性修复

- 修复 Safety Gate 对 `push-tonight-defense.ps1` 首次推送顺序的错误自检：旧检查在双引号搜索串里意外展开 `$Branch`，导致正确的 `ls-remote -> fetch` 顺序仍被误判失败。
- 重写 TypeScript 相对 import 存在性检查，改用 `System.IO.File.Exists` 逐候选验证，避免 Windows PowerShell 5.1 下出现“所有正常 import 都被报缺失”的大规模假阳性。
- Git 跟踪文件本地路径映射同样改用 `System.IO` 字面量 API，继续兼容中文文件名。
- 可见性 API 无法确认时不再静默放行：菜单模式必须人工输入 `PRIVATE` 或 `PUBLIC`，避免 Public 仓库保护被网络/API异常绕过。
- 开发规范新增 Safety Gate 自身回归验证要求：检查器出现批量假阳性时先修检查器，禁止据此修改正常游戏源码。
- 本版本只修改 GitHub/安全检查工具与规范，不修改游戏逻辑。

## v0.4.18 Windows ZIP 文件名编码修复

- 修复 v0.4.17 `TonightDefense-v0.4.17.zip` 与 `TonightDefense-v0.4.17-full.zip` 中 `清理Cocos缓存.bat` 在 Windows 解压后显示为 `µ╕àτÉåCocosτ╝ôσ¡ÿ.bat` 的问题。
- 根因不是源码文件本身乱码，而是上一版最终 ZIP 使用 Linux Info-ZIP 打包时，没有为该中文成员名写入 Windows/Python 可一致识别的 UTF-8 filename flag；因此 ZIP 内的 UTF-8 字节被按 CP437 解码成 mojibake。
- 根目录缓存清理工具从本版本起统一重命名为 ASCII：`Clear-Cocos-Cache.bat`，降低 Git / PowerShell / ZIP / Windows Explorer 的跨工具编码风险。
- 正式交付包改用 Python `zipfile` 生成，并加入 ZIP 成员名回读、临时解压和 mojibake 检查。后续禁止直接用 Linux `zip` 作为 Windows 最终交付包的唯一打包方式。
- 本版本不修改任何游戏逻辑、战斗数值、UI、音频、场景或 GitHub Safety Gate 业务规则。
