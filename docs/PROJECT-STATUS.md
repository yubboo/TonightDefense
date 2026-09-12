# TonightDefense 当前状态

## 当前版本

**v0.6.0 — 正式战斗闭环与首批美术资源**

## 当前稳定基线

- Cocos Creator：3.8.8。
- 目标平台：微信小游戏。
- 场景：`MainMenu.scene` + `Battle.scene`，不为商店/英雄/仓库等 MainMenu 页面额外拆 Scene。
- 音频：唯一 `AudioManager`，唯一目录 `assets/resources/audio/`，3 BGM + 8 SFX；禁止恢复 `audio_v2` / WAV。
- 暂停：唯一 `BattlePauseService` + `BattlePausePanel`。
- 英雄：所有可上场人物统一来自 CharacterSystem；主角与 AI 英雄共享人物/职业数据，区别只在控制方式。
- 队伍：主角 + 最多 4 名 AI 英雄。
- 战斗路线：有限守城战场，怪物从上方泉水区域进入；AI 英雄只在主战场 + 防守区活动，主角可由玩家主动前压。
- 防线：英雄优先承伤；英雄都失去战斗能力后进入 `雕像 -> 城墙 -> 公主`。
- AI 英雄复活：固定四宫格复活位，雕像持续输送能量并持续消耗自身生命，满血后重新参战。
- Boss：第 40 波为“普通潮 -> 精英潮 -> 警报 -> 赤金炎龙”；三阶段、三种预警范围技能、独立 Boss 血条，仍复用统一敌人生命/目标/掉落链。
- 地图：`StageCatalog` 统一关卡、地图、敌人池、预算波次、精英/Boss 与奖励；`BattleMapCatalog` 继续只管主题，战斗几何坐标仍由唯一 `BattleLayoutConfig` 管理。
- 阵型：主角中轴 C 位；伙伴 1/2/3 横排；伙伴 4 为中轴远程后排；单塔位于城墙前，公主位于城墙后。
- HUD：地图、单塔、城墙、公主、顶部蓝金面板、五人卡框和炎诀少年四技能图标已改为正式 PNG/Sprite；`Graphics` 仅在资源加载失败时回退。
- 主动技能：`ActiveSkillRuntime` 唯一拥有冷却/能量，HUD 只发 `hero-skill-intent`；首批四职业模板复用统一目标、效果和状态结算。
- 装备/存档：装备穿戴与战斗属性链已接入；存档升级为 v2，写入前备份并支持损坏恢复。
- 战斗闭环：失败、重试、回大厅、首次战斗引导、对象池/预载、战斗统计与显式调试面板已接入。
- 设计素材：`design-reference/` 整套设计板、拆图、清单、PSD 与交付归档纳入 GitHub 共享基线；网页端 AI 必须优先使用这些已批准素材，不得以临时生成图替换。

## GitHub 基线

- GitHub helper：首次初始化会自动创建/修复 `origin`，空仓库按首次推送流程处理；PowerShell 脚本统一 UTF-8 BOM + CRLF；Public/Private 人工确认大小写不敏感，并在首次确认后保存到本地 `.git/config`，避免每次重复询问；Safety Gate 已增加 Windows PowerShell 5.1 的中文路径与相对 import 假阳性保护。

仓库：`https://github.com/yubboo/TonightDefense`

从本版本开始，首次完整推送成功后：

- GitHub `main` 作为源码基线；
- 新版本开发前必须先读取 `main` 最新 Commit 与 Actions 结果；
- 本地 ZIP 仍可用于备份/回滚，但不能替代 Git 历史作为“当前源码到底是哪一版”的事实来源；
- GitHub Actions 当前只做静态/Cocos Meta/回归 Gate，不能冒充 Cocos Creator 编辑器预览或微信真机验证。

## 当前已知开发重点

1. 在 Cocos Creator 3.8.8 编辑器与微信真机调优首批正式资源的锚点、长屏安全区和技能触摸手感。
2. 为既有人物补齐正式头像、四方向/攻击/受伤/死亡动画和职业差异特效。
3. 扩充 `StageCatalog` 的后续章节、地图机制与预算曲线，不复制波次控制器。
4. 基于 `BossCatalog` 扩展其它 Boss，并调优赤金炎龙三阶段技能可读性。
5. 完成微信分包、真机性能、异常日志和发布回归矩阵。
