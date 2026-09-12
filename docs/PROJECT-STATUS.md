# TonightDefense 当前状态

## 当前版本

**v0.4.19 — GitHub 可见性确认流程修复 / 可复现源码基线**

## 当前稳定基线

- Cocos Creator：3.8.8。
- 目标平台：微信小游戏。
- 场景：`MainMenu.scene` + `Battle.scene`，不为商店/英雄/仓库等 MainMenu 页面额外拆 Scene。
- 音频：唯一 `AudioManager`，唯一目录 `assets/resources/audio/`，3 BGM + 7 SFX；禁止恢复 `audio_v2` / WAV。
- 暂停：唯一 `BattlePauseService` + `BattlePausePanel`。
- 英雄：所有可上场人物统一来自 CharacterSystem；主角与 AI 英雄共享人物/职业数据，区别只在控制方式。
- 队伍：主角 + 最多 4 名 AI 英雄。
- 战斗路线：有限守城战场，怪物从上方泉水区域进入；AI 英雄只在主战场 + 防守区活动，主角可由玩家主动前压。
- 防线：英雄优先承伤；英雄都失去战斗能力后进入 `雕像 -> 城墙 -> 公主`。
- AI 英雄复活：固定四宫格复活位，雕像持续输送能量并持续消耗自身生命，满血后重新参战。

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
2. 确定路线 B 的地图尺寸、镜头、安全区与怪物泉水节奏。
3. 完成正式战斗 HUD：顶部信息、防线状态、五人角色栏。
4. 再扩英雄、职业、技能和敌人内容。
5. 微信开发者工具与真机持续做性能和触摸体验验证。
