# TonightDefense / 今晚守城

Cocos Creator 3.8.8 微信小游戏项目。

## 开发入口

开始较大修改前依次阅读：

1. `AGENTS.md`
2. `docs/PROJECT-STATUS.md`
3. `docs/PROJECT-ARCHITECTURE.md`
4. `docs/development/PROJECT-RULES.md`
5. `docs/DEVELOPMENT-PLAN.md`

当前项目说明与版本记录见 `PROJECT.md`。

## GitHub 工作流

Windows 开发机双击 `TonightDefense-GitHub.bat`，选择 `1. 一键推送`。

脚本会依次执行项目安全检查、Git 同步、暂存、删除保护、Commit 和 Push，且永远不会自动 force push。

> 本项目包含完整游戏源码和运行时资源，推荐仓库保持 **Private**。一键推送脚本默认检测到 Public 仓库时会停止。
