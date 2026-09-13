# TonightDefense GitHub / Cocos 开发规则

## 1. GitHub 是源码基线，不是缓存备份盘

首次完整推送成功后，`main` 是当前稳定源码事实来源。`library/temp/build` 即使本机存在也不能进入 Git。

开发新版本前必须：

1. 读取 `AGENTS.md` 与核心 docs；
2. 查看 GitHub `main` 最新 Commit；
3. 查看该 Commit 对应 Actions；
4. 只基于真实最新源码继续修改。

## 2. 可以推送

- `assets/`：Scene、TypeScript、运行时 PNG/MP3、Prefab 等和所有 `.meta`；
- `settings/`：Cocos 项目级设置；
- `build-templates/`；
- `cloudfunctions/`；
- `extensions/` 的源码、`dist`、package.json / lockfile（不含 node_modules）；
- `spine_source/` 当前小体积原创拆件；
- `design-reference/`：权威设计参考图、拆图、素材清单、PSD 源文件与交付 ZIP，供 GitHub/网页端 AI/跨机器协作查看；
- `.github/`、`scripts/`、`docs/`；
- 根目录 `AGENTS.md`、`PROJECT.md`、`package.json`、`tsconfig.json`、项目 manifest、GitHub BAT/PS1。

## 3. 默认不推送

- `library/`、`temp/`、`build/`、`native/`、`local/`：Cocos 自动生成；
- `profiles/`：本机编辑器/构建状态，当前还包含微信 AppID 与本地构建记录；
- `extensions/**/node_modules/`：可由 lockfile 恢复；
- `output/`：本机美术/生成工作区；
- ZIP/7z/RAR、PSD/PSB、EXE/DLL/PDB、日志、dump、缓存；
- `.env`、私钥、证书、Token、AppSecret、账号/凭据文件。

注意：`assets/resources` 下的 PNG/MP3 是游戏运行所需资源，必须推送；`design-reference/` 是公开协作所需的权威设计素材，也必须推送。PSD/ZIP 只允许在 `design-reference/` 内跟踪，其它位置仍默认禁止。

## 4. Cocos Meta 是源码

`.meta` 必须和资源一起提交。删除资源必须同时删除对应 `.meta`；移动资源优先通过 Cocos Editor 完成，避免 UUID/引用漂移。

## 5. 删除保护

一键推送脚本遇到 `assets/scripts`、`assets/scenes`、`assets/resources`、`settings` 等关键路径删除时默认拒绝 Push。大型重构先人工确认，不允许自动 force push。

## 6. Commit / 分支

- 默认稳定分支：`main`。
- 当前早期开发可直接小步提交 main，但每次必须先过 Safety Gate。
- 大功能（英雄系统重构、地图系统重构、资源迁移）建议分支：`feature/<name>`，通过后再合并。
- Commit 要描述实际变化，不使用“fix”“update”这类无法追踪的空信息。

## 7. GitHub Actions 的验证边界

当前 `TonightDefense Safety Gate` 验证：

- 项目骨架关键文件；
- Scene JSON；
- `.meta` JSON 与 UUID 重复；
- TypeScript 相对 import；
- 唯一 AudioManager / audio 目录；
- `statProfile` 招募回归；
- 禁止目录/秘密/大文件。

它不能替代 Cocos 编辑器运行、微信构建或真机测试。

## 8. 仓库可见性

本项目默认按闭源开发处理。推荐 GitHub 仓库保持 **Private**。`TonightDefense-GitHub.bat` 首次确认公开仓库时必须要求明确确认；输入比较大小写不敏感（`PUBLIC/Public/public/P` 均可），确认结果保存在当前仓库 `.git/config`，后续不重复询问。匿名 GitHub API 检测失败只代表自动检测失败，菜单模式应允许人工确认；非交互模式可显式使用 `-AllowPublicRepository`。
## 9. Windows PowerShell 脚本编码

- `push-tonight-defense.ps1` 与 `scripts/github/check-project.ps1` 必须保存为 **UTF-8 with BOM**。
- 原因：项目当前一键工具使用 Windows PowerShell 5.1；它会把“UTF-8 无 BOM”的中文 `.ps1` 按系统 ANSI 编码解释，可能导致中文字符串乱码，甚至把引号解析坏并在脚本启动前直接 `ParserError`。
- 修改 GitHub 工具脚本后，提交前至少验证文件前三个字节为 `EF BB BF`，并在 Windows PowerShell 5.1 中完成一次菜单启动/安全检查。
- `.bat` 保持 ASCII/CRLF，启动时切换到 UTF-8 控制台代码页；不要依赖系统默认中文代码页。

## 10. Windows 一键 GitHub 工具

`AGENTS.md` 的版本交付与 GitHub 脚本规则是权威规范。本文件补充 TonightDefense 的执行细节：

- 仓库固定：`https://github.com/yubboo/TonightDefense.git`；默认分支：`main`。
- `.ps1`：UTF-8 with BOM + CRLF；兼容 Windows PowerShell 5.1。
- `origin` 不存在是首次初始化的正常状态，不得把 `git remote get-url origin` 的 stderr 当作失败退出；先用 `git remote` 判断。
- 空远端没有 `main` 也是正常首次推送状态；先用 `git ls-remote --heads origin main` 判断，只有远端分支已存在才 fetch/pull。
- 一键推送顺序：初始化/修复 origin → Safety Gate → 判断远端 main → 必要时 pull --rebase → stage → staged Gate → commit → push。
- 永不自动 force push。

## 11. 版本源码包命名

每个正式版本（含 GitHub 工具修复/热修复）必须至少有一个完整源码主包：`TonightDefense-vX.Y.Z.zip`，并在最终回复中优先提供。可额外提供 `TonightDefense-vX.Y.Z-patch.zip` 与 `TonightDefense-vX.Y.Z-full.zip`，但不能用它们代替主版本源码包。所有用户可下载交付件必须带项目名和版本号。

## 12. Git 中文/非 ASCII 文件名规则

Windows PowerShell 5.1 下，Git 默认 `core.quotePath=true` 会把中文路径输出成 C-style/八进制转义并带引号。任何需要把 Git 输出重新映射为本地路径的脚本，都必须使用 `git -c core.quotePath=false ...`（或 NUL 分隔的可靠解析），并在仓库初始化时设置 `git config core.quotePath false`。不得直接把默认 `git ls-files` / `git diff --name-only` 的转义字符串传给 `Join-Path`、`Test-Path`、`Get-Item`。


## 13. Safety Gate 自身也必须做回归验证

任何 GitHub/Safety Gate 脚本修改，都必须先对当前 Last Known Good 项目运行自检，不能只检查脚本语法。至少覆盖：空远端首次推送、origin 不存在/已存在、远端 main 不存在/已存在、中文文件名、正常 TypeScript 相对 import。

如果一次检查突然把大量已知存在的相对 import 全部报成缺失，优先判定检查器自身回归，不得据此改动游戏源码。Windows PowerShell 5.1 下路径解析优先使用 `System.IO.File.Exists/Directory.Exists` 等字面量 API；脚本源码自检不得在双引号字符串里意外展开 `$Branch` 等变量后再做 `IndexOf` 比对。

## 14. MainMenu 页面与常驻导航

- 大厅只复用一个 `MainMenuBottomNav`，固定为商店、英雄、战斗、仓库、升级五项；所有主 Page 均保持它可见。
- `MainMenuView` 是主导航选中态和独立 Page 生命周期的唯一管理者；各 Page 不复制底栏，不维护第二份主页面状态。
- 页面必须在实际可见高度内为 132 px 底栏预留空间；Page 专属背景和滚动层应精确衔接底栏顶边，不得覆盖底栏，也不得留下透出其它页面背景的水平缝隙；点击区域不得进入底栏范围。
- 720 设计宽的核心正文和按钮文字以 16 px 为默认可读下限，次要说明不低于 14 px；修改字号时同步检查行高、换行、溢出和长屏布局。

### Windows ZIP / Unicode 文件名

- 根目录维护工具统一 ASCII 文件名；`清理Cocos缓存.bat` 已统一为 `Clear-Cocos-Cache.bat`。
- Windows 交付 ZIP 统一使用可正确标记 UTF-8 文件名的打包方式；当前使用 Python `zipfile`，不再直接用 Linux `zip` 产出最终用户包。
- 打包后必须回读 ZIP 成员名并临时解压验证，发现 mojibake 立即判定失败。
