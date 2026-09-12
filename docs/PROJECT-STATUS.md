# TonightDefense 当前状态

## 当前版本

**v0.5.1 — 王城前境战斗地图 / 五人战斗 HUD**

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
- 地图：`BattleMapCatalog` 按章节选择视觉主题，战斗几何坐标仍由唯一 `BattleLayoutConfig` 管理；当前第 1 章使用“王城前境”。
- 阵型：主角中轴 C 位；伙伴 1/2/3 横排；伙伴 4 为中轴远程后排；单塔位于城墙前，公主位于城墙后。
- HUD：底部固定五人卡栏（伙伴1 / 伙伴2 / 主角 / 伙伴3 / 伙伴4），左侧摇杆、右侧四个主角技能意图入口；防线状态移到顶部 HUD 下方。

## GitHub 基线

- GitHub helper：首次初始化会自动创建/修复 `origin`，空仓库按首次推送流程处理；PowerShell 脚本统一 UTF-8 BOM + CRLF；Public/Private 人工确认大小写不敏感，并在首次确认后保存到本地 `.git/config`，避免每次重复询问；Safety Gate 已增加 Windows PowerShell 5.1 的中文路径与相对 import 假阳性保护。

仓库：`https://github.com/yubboo/TonightDefense`

从本版本开始，首次完整推送成功后：

- GitHub `main` 作为源码基线；
- 新版本开发前必须先读取 `main` 最新 Commit 与 Actions 结果；
- 本地 ZIP 仍可用于备份/回滚，但不能替代 Git 历史作为“当前源码到底是哪一版”的事实来源；
- GitHub Actions 当前只做静态/Cocos Meta/回归 Gate，不能冒充 Cocos Creator 编辑器预览或微信真机验证。

## 当前已知开发重点

1. 继续稳定 Hero / Recruit / AI / Revive 完整闭环，避免统一英雄系统时残留旧字段。
2. 在“王城前境”基线上继续调优地图尺寸、镜头、安全区与怪物泉水节奏。
3. 为主角四个技能意图入口接入后续主动技能定义、冷却和释放反馈。
4. 基于 `BossCatalog` 继续扩展其它 Boss，并在 3.8.8 编辑器与微信真机调优赤金炎龙数值/技能可读性。
5. 微信开发者工具与真机持续做性能和触摸体验验证。
