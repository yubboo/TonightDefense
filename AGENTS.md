# AGENTS.md

## AI / 人工开发阅读顺序

开始较大修改前依次阅读：`docs/PROJECT-STATUS.md` → `docs/PROJECT-ARCHITECTURE.md` → `docs/development/PROJECT-RULES.md` → `docs/DEVELOPMENT-PLAN.md`。具体版本历史继续查看 `PROJECT.md`。当前状态与长期规则优先于历史版本描述。

## GitHub 基线与固定工作流

默认仓库：`https://github.com/yubboo/TonightDefense.git`，默认分支：`main`。首次完整源码推送成功后，GitHub `main` 是项目源码事实来源。

以下时点必须主动检查 GitHub，而不是等待用户提醒：

1. 开始新的版本开发前；
2. 用户说“推好了 / 已推送 / 看看 GitHub”后；
3. 修复 GitHub Actions 失败前；
4. 准备下一版 patch/full 源码包前。

每次至少确认：`main` 最新 commit、变更范围、对应 Actions 结果。不能用旧 ZIP 工作目录覆盖 GitHub 新基线。GitHub 静态 Gate 不能冒充 Cocos 编辑器/微信真机运行验证。

GitHub 提交边界统一遵循 `docs/development/PROJECT-RULES.md` 与根目录 `.gitignore`；`library/temp/build/profiles/node_modules/output` 等本机/生成目录不得进入 Git 历史。`design-reference/` 是 GitHub/网页端 AI/跨机器共用的权威设计素材库，其中的参考图、拆图、清单、PSD 和交付归档必须进入 Git；不得因其不参与 Cocos 运行时就将其排除。

> 本文件是 TonightDefense 项目的 AI / Agent / 自动化开发规范。
> 任何修改代码、修复 Bug、重构、资源迁移或打包前，必须先阅读并遵守本文件。
> 本文件优先级高于临时实现习惯；不得凭记忆绕过。

### 1. 先审计，后修改

- 修 Bug 前必须先定位现有完整调用链：**入口 → 状态拥有者 → 核心逻辑 → 事件/回调 → UI/资源调用点**。
- 必须全项目搜索同功能的旧实现、重复监听、重复定时器、重复播放、重复状态字段和历史路径，确认是否存在多套逻辑并存。
- 用户指出“以前某一版正常”时，必须先把该版本作为 **Last Known Good（最后已知正常版本）** 与当前版本做差异对比，再决定怎么修。
- 没有证据前禁止通过“再加一层兜底 / 再注册一次 / 再调用一次”来碰运气。

### 2. 每个功能只能有一个权威实现（Single Source of Truth）

- 同一业务行为只能有一个主控制器/主状态源。修复前必须明确“这件事到底由谁负责”。
- 发现新旧两套逻辑时，优先**合并并删除/停用旧路径**，禁止继续叠第三套实现。
- UI 只发出意图，不重复维护核心业务状态；业务系统不要反过来复制 UI 状态。
- 资源路径、设置键、事件名、缓存键必须统一；迁移后旧路径必须彻底退出运行时代码。

### 3. Bug 修复必须保护已有正常行为

- 修改前先写清本次验收标准：**要修什么、什么必须保持不变、哪些平台需要验证**。
- 只改与根因有关的最小文件集合；禁止“顺手优化”无关系统。
- 已经正常的行为默认视为回归保护项，不得为了修另一个问题而改变。
- 如果修复需要跨系统，必须先检查双方现有公开接口，避免复制逻辑。

### 4. 提交/打包前必须做冲突与回归审计

每次准备补丁前至少检查：

- 是否存在同名功能的重复 Controller / Manager / Service。
- 是否对同一事件重复 `on` / `addEventListener` / 定时器注册，且没有对应解除。
- 是否同一动作被多个入口重复调用（例如按钮点击既播音效，弹窗打开又播一次）。
- 是否存在旧资源目录、旧路径、旧设置键仍被代码引用。
- 是否出现“每次点击/每帧/每次场景进入都重新初始化”的非幂等逻辑。
- TypeScript 语法、相对 import、场景脚本 UUID / `.meta` 是否正常。
- 补丁包只包含本次真正修改的文件；未修改文件不得为了“保险”重复覆盖。

### 5. 音频系统专项规则

- 全项目只有一个 `AudioManager` 作为音频权威入口。
- Web 音频“首次用户交互解锁”只能执行一次；解锁逻辑与正常播放逻辑必须分离。
- `playUi()` 只能负责 UI 音效，**不得顺带重新播放/恢复/重启 BGM**。
- `playBgm(id)` 必须幂等：当前已经是同一首且正在正常播放时，不得从头重播。
- BGM、SFX、UI 音效的调用点不得重复；一个用户动作默认只触发一次对应音效。
- 不允许因为“怕首次无声”而无条件预热一批无关音频。需要预载时必须有明确性能/体验理由。
- 音频资源唯一目录为 `assets/resources/audio/`；禁止重新引入 `audio_v2`、旧 WAV 路径或并行资源目录。
- 浏览器自动播放限制、Cocos Web 预览、微信开发者工具、微信真机是不同运行环境，兼容逻辑必须隔离，不能让某个平台的解锁方案污染其他平台。

### 6. 排错纪律

- 看到错误先追第一条有效错误和调用栈，不根据后续连锁报错猜根因。
- 能复现时优先做 A/B 测试，区分：源码逻辑、Cocos 缓存、浏览器限制、微信开发者工具、真机差异。
- 如果证据指向缓存，先清缓存验证；如果证据指向代码，再改代码。不能把缓存问题和代码问题同时混改。
- 用户反馈与预期不符时，先重新审查需求和历史正常版本，不继续盲目新增逻辑。

### 7. 每次修改的固定流程

1. 重新阅读本节。
2. 复述本次验收标准。
3. 搜索并画出当前调用链与状态拥有者。
4. 对比最后已知正常版本（如有）。
5. 找根因，确认唯一权威实现。
6. 做最小修改，并删除/停用冲突旧逻辑。
7. 做静态检查 + 关键回归检查。
8. 只打包本次修改文件；完整包另存用于回滚。
9. 在本 `PROJECT.md` 记录必要的架构/行为变更。

## 8. 项目文件职责

- `AGENTS.md`：只存放 AI / Agent / 自动化开发规范，修改前必读。
- `PROJECT.md`：只存放项目说明、版本变更、目录说明和面向项目维护者的信息。
- 不要把开发规范重复写进 `PROJECT.md`，避免两份规则漂移。
- 如果规范需要调整，只修改 `AGENTS.md`，并确保后续 Agent 使用最新版本。

## 9. 补丁与版本交付规则

- **每个正式版本（包括 GitHub 工具修复/热修复）都必须至少交付一个完整源码主包，固定命名 `TonightDefense-vX.Y.Z.zip`。** 这是面向用户的主版本包，不能只给 patch、full、临时目录、裸路径、`hotfix.zip` 或无项目名/版本号的文件；最终回复必须优先给出这个主包。
- 若同时提供增量补丁，命名固定为 `TonightDefense-vX.Y.Z-patch.zip`；若提供含本机生成目录的回滚备份，命名固定为 `TonightDefense-vX.Y.Z-full.zip`。
- 所有 ZIP 名称都必须包含 **项目名 + 版本号**；`PROJECT.md` 的“当前整理包版本”必须与交付 ZIP 版本一致。
- 最终回复必须提供可点击下载链接，禁止只写 `/mnt/data/...` 文件系统路径。
- patch 包只包含本次真正修改的文件，保持项目根目录相对路径，方便直接覆盖。
- patch ZIP 根目录直接放 `assets/`、`scripts/`、`AGENTS.md` 等需要覆盖的项目项，不额外套版本目录。
- `TonightDefense-vX.Y.Z.zip` 完整源码包按 GitHub 可复现源码边界制作：包含游戏运行所需源码、场景、资源、`.meta` 与 `design-reference/` 共享设计素材，排除 `library/temp/build/native/profiles/node_modules/output` 等生成或本机状态。
- full 包用于完整备份与回滚，可保留当前本机生成目录；它不能替代主版本源码包。
- 未修改文件不得为了“保险”重复覆盖。

## 10. Windows / GitHub 辅助脚本规则

- 所有 `.ps1` 必须保存为 **UTF-8 with BOM + CRLF**，兼容 Windows PowerShell 5.1；BAT 启动时使用 UTF-8 控制台。
- `push-tonight-defense.ps1` 默认仓库固定为 `https://github.com/yubboo/TonightDefense.git`，默认分支 `main`。
- 在 `$ErrorActionPreference = 'Stop'` 下，任何“预期可能失败”的 Git 探测命令都不得直接执行并依赖 `$LASTEXITCODE`；必须通过不会把 stderr 提升为终止异常的 Probe/包装函数执行。
- 检查 `origin` 是否存在时先读取 `git remote`，只有确认存在后才执行 `git remote get-url origin`；origin 不存在时直接 `git remote add origin <RepoUrl>`。
- 首次推送空 GitHub 仓库时，先 `git ls-remote --heads origin main` 判断远端分支是否存在；远端没有 `main` 时禁止先执行 `git fetch origin main`。
- 一键脚本禁止自动 `force push`。任何远端已有内容、本地无基线 commit、关键源码大规模删除等情况都必须停止并要求人工确认。
- 仓库可见性人工确认必须**大小写不敏感**：`PUBLIC/Public/public/P` 均表示 Public，`PRIVATE/Private/private` 均表示 Private；禁止因为用户大小写不同把有效确认判成失败。
- 用户首次确认 Public/Private 后，可将结果保存到当前仓库 `.git/config`（例如 `tonightDefense.repositoryVisibility`）；该设置不得进入 Git 历史。后续推送应复用此本地确认，避免每次重复询问。
- GitHub API 可见性探测失败只代表“自动判断失败”，不能表述成 GitHub Push 已失败；交互模式应允许用户人工确认后继续。

- 修改 `scripts/github/check-project.ps1`、`push-tonight-defense.ps1` 或 GitHub Safety Gate 时，**必须先用当前 Last Known Good 项目做自检**，至少覆盖：空仓库首次 push、已有/不存在 origin、远端 main 存在/不存在、中文文件名、已知正常相对 import。Safety Gate 自身出现大批假阳性时必须先判定为检查器回归，禁止据此修改游戏源码。
- Safety Gate 的源码自检禁止使用会被 PowerShell 变量插值破坏的脆弱字符串匹配；路径存在性检查优先使用 `System.IO.File.Exists/Directory.Exists` 等字面量 API，避免 Windows PowerShell 5.1 的路径/管道兼容问题。

## 11. Windows 交付包与文件名编码规则

- 项目根目录的维护/工具文件名必须使用 ASCII（`A-Z a-z 0-9 . _ -`），避免 Windows ZIP、PowerShell、Git 和不同解压器之间的中文文件名编码差异。游戏运行资源目录中如确有中文资源名可以保留，但不得把中文命名用于根目录 BAT/PS1/交付工具。
- 交付给 Windows 用户的 ZIP **禁止直接使用 Linux `zip` 命令作为唯一打包方式**。必须使用能正确写入 UTF-8 filename flag 的打包器（当前统一使用 Python `zipfile`），或经过等价 Unicode 验证的工具。
- 每次生成 `TonightDefense-vX.Y.Z.zip`、`-patch.zip`、`-full.zip` 后，必须执行 ZIP 文件名回读检查；若出现 `µ╕à`、`τÉå`、`σ¡ÿ`、`鍘` 等典型 mojibake 字样，视为交付失败，不得发给用户。
- 对包含非 ASCII 路径的 ZIP，必须至少做一次“打包 -> Python `zipfile` 回读成员名 -> 临时目录解压 -> 文件名对比”验证。
- 历史根目录工具 `清理Cocos缓存.bat` 从 v0.4.18 起统一重命名为 `Clear-Cocos-Cache.bat`。后续文档和脚本只引用 ASCII 名称。
