# Encoding: UTF-8 with BOM + CRLF is required for Windows PowerShell 5.1.
[CmdletBinding()]
param(
    [ValidateSet('menu','push','status','pull','commit','scan','log','open')]
    [string]$Action = 'menu',
    [string]$ProjectRoot = '',
    [string]$RepoUrl = 'https://github.com/yubboo/TonightDefense.git',
    [string]$Branch = 'main',
    [string]$CommitMessage = '',
    [switch]$AllowPublicRepository,
    [switch]$AllowMassDeletion
)

$ErrorActionPreference = 'Stop'
try {
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    [Console]::InputEncoding = $utf8
    [Console]::OutputEncoding = $utf8
    $OutputEncoding = $utf8
} catch {}

function Write-Title([string]$Text) {
    Write-Host ''
    Write-Host '====================================================================' -ForegroundColor DarkGray
    Write-Host ('  ' + $Text) -ForegroundColor White
    Write-Host '====================================================================' -ForegroundColor DarkGray
}
function Write-Step([string]$Text) { Write-Host ('[进行] ' + $Text) -ForegroundColor Cyan }
function Write-Ok([string]$Text) { Write-Host ('[完成] ' + $Text) -ForegroundColor Green }
function Write-Warn2([string]$Text) { Write-Host ('[注意] ' + $Text) -ForegroundColor Yellow }
function Stop-Fail([string]$Text) { Write-Host ('[失败] ' + $Text) -ForegroundColor Red; exit 1 }

function Invoke-Git([string[]]$Arguments, [switch]$AllowFailure) {
    # Git 在成功的 fetch/pull/push 中也可能把进度写到 stderr。
    # Windows PowerShell 5.1 + ErrorActionPreference=Stop 不能让这些 stderr
    # 在检查 LASTEXITCODE 之前中断脚本。
    $oldPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        & git @Arguments
        $code = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $oldPreference
    }
    if (-not $AllowFailure -and $code -ne 0) {
        Stop-Fail ('Git 命令失败：git ' + ($Arguments -join ' '))
    }
    return $code
}

# Windows PowerShell 5.1 + $ErrorActionPreference='Stop' 时，
# 原生命令向 stderr 写内容可能被提升为 NativeCommandError。
# 对“允许失败”的探测命令统一走这个函数，避免把正常探测当成脚本异常。
function Invoke-GitProbe([string[]]$Arguments) {
    $oldPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        $output = @(& git @Arguments 2>$null)
        $code = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $oldPreference
    }
    return [pscustomobject]@{
        Code = $code
        Output = $output
    }
}

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    $ProjectRoot = Split-Path -Parent $PSCommandPath
}
$ProjectRoot = [System.IO.Path]::GetFullPath($ProjectRoot)
if (-not (Test-Path -LiteralPath $ProjectRoot -PathType Container)) {
    Stop-Fail ('项目目录不存在：' + $ProjectRoot)
}
Set-Location -LiteralPath $ProjectRoot

# v0.4.18: migrate the historical Chinese root tool filename to ASCII.
# This runs before Git/Safety checks so existing v0.4.17 working copies are repaired automatically.
$legacyCacheBat = Join-Path $ProjectRoot '清理Cocos缓存.bat'
$asciiCacheBat = Join-Path $ProjectRoot 'Clear-Cocos-Cache.bat'
if (Test-Path -LiteralPath $legacyCacheBat -PathType Leaf) {
    if (Test-Path -LiteralPath $asciiCacheBat -PathType Leaf) {
        Remove-Item -LiteralPath $legacyCacheBat -Force
        Write-Ok '已移除旧中文工具文件名：清理Cocos缓存.bat'
    } else {
        Move-Item -LiteralPath $legacyCacheBat -Destination $asciiCacheBat
        Write-Ok '已迁移工具文件名：清理Cocos缓存.bat -> Clear-Cocos-Cache.bat'
    }
}

if (-not (Get-Command git.exe -ErrorAction SilentlyContinue)) {
    Stop-Fail '未找到 Git。请先安装 Git for Windows。'
}

$SafetyScript = Join-Path $ProjectRoot 'scripts\github\check-project.ps1'
if (-not (Test-Path -LiteralPath $SafetyScript -PathType Leaf)) {
    Stop-Fail '缺少 scripts/github/check-project.ps1。'
}

function Get-TonightDefenseVersion {
    $path = Join-Path $ProjectRoot 'PROJECT.md'
    if (Test-Path -LiteralPath $path) {
        $text = Get-Content -LiteralPath $path -Raw -Encoding UTF8
        $m = [regex]::Match($text, '当前整理包版本：v?([0-9]+\.[0-9]+\.[0-9]+)')
        if ($m.Success) { return $m.Groups[1].Value }
    }
    return 'unknown'
}

function Initialize-Repository {
    Write-Step '初始化/检查 Git 仓库'

    if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot '.git'))) {
        Invoke-Git @('init') | Out-Null
        Write-Ok '已初始化本地 Git 仓库。'
    }

    Invoke-Git @('branch','-M',$Branch) | Out-Null

    # Windows + 中文文件名：Git 默认 core.quotePath=true 会把非 ASCII 路径
    # 输出成带引号的八进制转义（例如 \"\346\270...\"）。
    # PowerShell 再把它当真实路径会触发 Illegal characters in path。
    # 仓库级固定关闭 quotePath，同时 Safety Gate 的关键命令也显式 -c 覆盖。
    Invoke-Git @('config','core.quotePath','false') | Out-Null

    # 不直接执行 `git remote get-url origin` 作为存在性探测。
    # origin 不存在时 Git 会向 stderr 输出错误，而 Windows PowerShell 5.1
    # 在 ErrorActionPreference=Stop 下会把它变成终止异常。
    $remoteList = Invoke-GitProbe @('remote')
    if ($remoteList.Code -ne 0) {
        Stop-Fail '无法读取 Git remote 列表。'
    }

    $hasOrigin = @($remoteList.Output) -contains 'origin'
    if (-not $hasOrigin) {
        Invoke-Git @('remote','add','origin',$RepoUrl) | Out-Null
        Write-Ok ('已创建 origin：' + $RepoUrl)
        return
    }

    $originResult = Invoke-GitProbe @('remote','get-url','origin')
    if ($originResult.Code -ne 0 -or @($originResult.Output).Count -eq 0) {
        Invoke-Git @('remote','set-url','origin',$RepoUrl) | Out-Null
        Write-Ok ('origin 已修复为：' + $RepoUrl)
        return
    }

    $origin = [string](@($originResult.Output)[0])
    if ($origin.Trim() -ne $RepoUrl) {
        Write-Warn2 ('origin 原地址：' + $origin.Trim())
        Invoke-Git @('remote','set-url','origin',$RepoUrl) | Out-Null
        Write-Ok ('origin 已更新：' + $RepoUrl)
    } else {
        Write-Ok ('origin 已正确配置：' + $RepoUrl)
    }
}

function Ensure-GitIdentity {
    $nameResult = Invoke-GitProbe @('config','--get','user.name')
    $emailResult = Invoke-GitProbe @('config','--get','user.email')

    $name = ''
    $email = ''
    if ($nameResult.Code -eq 0 -and @($nameResult.Output).Count -gt 0) {
        $name = [string](@($nameResult.Output)[0])
    }
    if ($emailResult.Code -eq 0 -and @($emailResult.Output).Count -gt 0) {
        $email = [string](@($emailResult.Output)[0])
    }

    if (-not [string]::IsNullOrWhiteSpace($name) -and -not [string]::IsNullOrWhiteSpace($email)) {
        return
    }

    Write-Warn2 '当前仓库还没有可用的 Git user.name / user.email；首次 commit 需要配置。'
    if ($Action -ne 'menu') {
        Stop-Fail '请先配置 git user.name / user.email，或使用菜单模式完成首次设置。'
    }

    if ([string]::IsNullOrWhiteSpace($name)) {
        $name = Read-Host '请输入 Git 提交用户名（例如 yubboo）'
    }
    if ([string]::IsNullOrWhiteSpace($email)) {
        $email = Read-Host '请输入 Git 提交邮箱（可使用 GitHub noreply 邮箱）'
    }
    if ([string]::IsNullOrWhiteSpace($name) -or [string]::IsNullOrWhiteSpace($email)) {
        Stop-Fail 'Git 用户名/邮箱不能为空。'
    }

    Invoke-Git @('config','user.name',$name) | Out-Null
    Invoke-Git @('config','user.email',$email) | Out-Null
    Write-Ok ('已为当前 TonightDefense 仓库配置 Git 身份：' + $name + ' <' + $email + '>')
}

function Normalize-VisibilityAnswer([string]$Answer) {
    if ([string]::IsNullOrWhiteSpace($Answer)) { return '' }
    $value = $Answer.Trim().ToUpperInvariant()
    switch ($value) {
        'PUBLIC' { return 'public' }
        'P' { return 'public' }
        '公开' { return 'public' }
        'PRIVATE' { return 'private' }
        'PRIV' { return 'private' }
        '私有' { return 'private' }
        default { return '' }
    }
}

function Get-RepositoryVisibilityPreference {
    $result = Invoke-GitProbe @('config','--get','tonightDefense.repositoryVisibility')
    if ($result.Code -eq 0 -and @($result.Output).Count -gt 0) {
        $value = ([string](@($result.Output)[0])).Trim().ToLowerInvariant()
        if ($value -eq 'public' -or $value -eq 'private') { return $value }
    }
    return ''
}

function Save-RepositoryVisibilityPreference([string]$Visibility) {
    if ($Visibility -ne 'public' -and $Visibility -ne 'private') { return }
    Invoke-Git @('config','tonightDefense.repositoryVisibility',$Visibility) | Out-Null
}

function Confirm-RepositoryVisibility([string]$Visibility, [string]$Reason) {
    if ($Visibility -eq 'private') {
        Save-RepositoryVisibilityPreference 'private'
        Write-Ok ('仓库可见性已确认：Private' + $Reason)
        return
    }

    if ($Visibility -eq 'public') {
        Write-Host ''
        Write-Host 'GitHub 仓库当前按 PUBLIC 处理。' -ForegroundColor Yellow
        Write-Host '完整游戏源码、运行时美术和音频将对所有人可见。' -ForegroundColor Yellow
        if ($Action -eq 'menu') {
            $answer = Read-Host '确认公开推送请输入 PUBLIC / Public / public / P（大小写不限）；其他输入取消'
            $normalized = Normalize-VisibilityAnswer $answer
            if ($normalized -eq 'public') {
                Save-RepositoryVisibilityPreference 'public'
                Write-Warn2 '已确认公开推送；本仓库会记住此选择，后续不再重复询问。'
                return
            }
        }
        Write-Host '如果这是长期公开仓库，可在菜单中首次确认后自动记住。' -ForegroundColor DarkGray
        Write-Host '非交互模式可显式使用 -AllowPublicRepository。' -ForegroundColor DarkGray
        Stop-Fail '仓库可见性保护已触发。'
    }

    Stop-Fail '无法确认仓库可见性，已停止推送以保护完整源码。'
}

function Assert-RepositoryVisibility {
    if ($AllowPublicRepository) { return }

    # 用户首次确认后保存在当前仓库 .git/config，不进入 GitHub，不污染项目源码。
    # 这样 Public/Private 不会每次 push 都重复询问。
    $remembered = Get-RepositoryVisibilityPreference
    if ($remembered -eq 'public') {
        Write-Warn2 '已读取本地仓库设置：Public；继续公开推送。'
        return
    }
    if ($remembered -eq 'private') {
        Write-Ok '已读取本地仓库设置：Private。'
        return
    }

    $api = 'https://api.github.com/repos/yubboo/TonightDefense'
    try {
        $repo = Invoke-RestMethod -Uri $api -Headers @{ 'User-Agent' = 'TonightDefense-GitHub-Helper'; 'Accept' = 'application/vnd.github+json' } -TimeoutSec 8
        if ($null -ne $repo) {
            if ($repo.private -eq $true) {
                Confirm-RepositoryVisibility 'private' '（GitHub API）'
                return
            }
            if ($repo.private -eq $false) {
                Confirm-RepositoryVisibility 'public' '（GitHub API）'
                return
            }
        }
    } catch {
        # 网络、代理、TLS 或匿名 API 限制都可能导致这里失败。
        # 这不是 Git/GitHub 推送失败，只是“自动判断可见性”失败。
    }

    Write-Host ''
    Write-Warn2 '自动检测仓库 Public/Private 失败，但 GitHub 推送本身尚未失败。'
    if ($Action -eq 'menu') {
        $answer = Read-Host '请输入 Public/P/公开 或 Private/私有（大小写不限）；其他输入取消'
        $normalized = Normalize-VisibilityAnswer $answer
        if ($normalized -eq 'public' -or $normalized -eq 'private') {
            Confirm-RepositoryVisibility $normalized '（人工确认）'
            return
        }
    }
    Stop-Fail '无法确认仓库可见性，已停止推送以保护完整源码。'
}

function Invoke-Safety([string]$Mode) {
    Write-Step ('运行 TonightDefense Safety Gate：' + $Mode)
    $oldPreference = $ErrorActionPreference
    try {
        $ErrorActionPreference = 'Continue'
        & powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File $SafetyScript -Mode $Mode -ProjectRoot $ProjectRoot
        $code = $LASTEXITCODE
    } finally {
        $ErrorActionPreference = $oldPreference
    }
    if ($code -ne 0) {
        Stop-Fail '项目安全/完整性检查未通过。'
    }
}

function Get-PlannedMigrationDeletionMap {
    $map = @{}
    $version = Get-TonightDefenseVersion
    if ([string]::IsNullOrWhiteSpace($version) -or $version -eq 'unknown') {
        return $map
    }

    $manifestRel = 'scripts/migrations/v' + $version + '-expected-deletions.txt'
    $manifestPath = Join-Path $ProjectRoot ($manifestRel -replace '/', '\')
    if (-not (Test-Path -LiteralPath $manifestPath -PathType Leaf)) {
        return $map
    }

    foreach ($line in @(Get-Content -LiteralPath $manifestPath -Encoding UTF8)) {
        if ([string]::IsNullOrWhiteSpace($line)) { continue }
        $trimmed = $line.Trim()
        if ($trimmed.StartsWith('#')) { continue }
        $normalized = $trimmed.Replace('\','/').TrimStart('/')
        if ([string]::IsNullOrWhiteSpace($normalized)) { continue }
        $map[$normalized.ToLowerInvariant()] = $true
    }

    if ($map.Count -gt 0) {
        Write-Warn2 ('已加载 v' + $version + ' 结构迁移删除清单：' + $map.Count + ' 项。')
    }
    return $map
}

function Test-StagedDeletionSafety {
    $rows = @(& git -c core.quotePath=false diff --cached --name-status --diff-filter=D)
    if ($rows.Count -eq 0) { return }

    $plannedMap = Get-PlannedMigrationDeletionMap
    $planned = New-Object System.Collections.Generic.List[string]
    $unexpected = New-Object System.Collections.Generic.List[string]
    $unexpectedCritical = New-Object System.Collections.Generic.List[string]
    $all = New-Object System.Collections.Generic.List[string]

    foreach ($row in $rows) {
        if ([string]::IsNullOrWhiteSpace($row)) { continue }
        $parts = $row -split "`t", 2
        if ($parts.Count -lt 2) { continue }

        $file = $parts[1].Replace('\','/')
        $all.Add($file)

        $key = $file.ToLowerInvariant()
        $isPlanned = $plannedMap.ContainsKey($key)
        if ($isPlanned) {
            $planned.Add($file)
            continue
        }

        $unexpected.Add($file)
        if ($file -match '^(?:assets/scripts/|assets/scenes/|assets/resources/|settings/|\.github/|scripts/github/|AGENTS\.md$|PROJECT\.md$)') {
            $unexpectedCritical.Add($file)
        }
    }

    if ($planned.Count -gt 0) {
        Write-Warn2 ('已确认本版本结构迁移删除：' + $planned.Count + ' 项；这些路径已由版本化清单精确授权。')
    }

    if ($unexpectedCritical.Count -gt 0) {
        Write-Host ''
        Write-Host '发现未列入迁移清单的关键游戏源码/资源删除，一键推送拒绝：' -ForegroundColor Red
        $unexpectedCritical | Select-Object -First 25 | ForEach-Object { Write-Host ('  - ' + $_) -ForegroundColor Red }
        Stop-Fail '关键文件删除保护已触发；请检查这些删除是否真的是预期变更。'
    }

    if ($unexpected.Count -gt 25 -and -not $AllowMassDeletion) {
        Stop-Fail ('检测到 ' + $unexpected.Count + ' 个未授权删除。大型删除必须人工确认或显式使用 -AllowMassDeletion。')
    }
}

function Sync-Remote {
    Write-Step ('同步远端 ' + $Branch + '（绝不 force push）')

    # 空仓库没有 main。必须先 ls-remote，再决定是否 fetch；
    # 直接 fetch origin main 会得到 "couldn't find remote ref main"。
    $remoteHead = Invoke-GitProbe @('ls-remote','--heads','origin',$Branch)
    if ($remoteHead.Code -ne 0) {
        Stop-Fail '无法读取远端分支。请确认网络、origin 和 GitHub 权限。'
    }

    if (@($remoteHead.Output).Count -eq 0) {
        Write-Ok ('远端 ' + $Branch + ' 尚不存在，按首次推送流程继续。')
        return
    }

    $fetch = Invoke-GitProbe @('fetch','origin',$Branch)
    if ($fetch.Code -ne 0) {
        Stop-Fail 'git fetch 失败。请确认网络、GitHub 登录状态和仓库权限。'
    }

    $localHead = Invoke-GitProbe @('rev-parse','--verify','HEAD')
    if ($localHead.Code -ne 0) {
        Write-Warn2 ('远端 ' + $Branch + ' 已存在，但本地还没有任何 commit。')
        Stop-Fail '为避免覆盖远端，请先人工确认远端内容后再继续。'
    }

    Invoke-Git @('pull','--rebase','--autostash','origin',$Branch) | Out-Null
    Write-Ok '远端同步完成。'
}

function Stage-And-Commit([string]$Message) {
    Ensure-GitIdentity
    Invoke-Safety 'WorkingTree'
    Write-Step '暂存允许进入 Git 的源码'
    Invoke-Git @('add','-A') | Out-Null
    Invoke-Safety 'Staged'
    Test-StagedDeletionSafety

    & git diff --cached --quiet
    if ($LASTEXITCODE -eq 0) {
        Write-Ok '没有需要提交的变更。'
        return $false
    }

    Write-Host ''
    & git status --short
    Write-Host ''

    if ([string]::IsNullOrWhiteSpace($Message)) {
        $version = Get-TonightDefenseVersion
        $Message = ('TonightDefense v' + $version + ' ' + (Get-Date -Format 'yyyy-MM-dd HH:mm'))
    }

    Write-Step ('提交：' + $Message)
    Invoke-Git @('commit','-m',$Message) | Out-Null
    Write-Ok 'Commit 完成。'
    return $true
}

function Show-Status {
    Write-Title ('TonightDefense GitHub 工作台 | v' + (Get-TonightDefenseVersion))
    & git status -sb
    Write-Host ''
    & git remote -v
}

function Invoke-Action([string]$Name, [string]$Message = '') {
    switch ($Name) {
        'scan' { Invoke-Safety 'WorkingTree' }
        'status' { Show-Status }
        'pull' { Assert-RepositoryVisibility; Sync-Remote; Show-Status }
        'commit' { [void](Stage-And-Commit $Message); Show-Status }
        'push' {
            Assert-RepositoryVisibility
            Invoke-Safety 'WorkingTree'
            Sync-Remote
            [void](Stage-And-Commit $Message)
            Write-Step ('推送到 GitHub ' + $Branch)
            Invoke-Git @('push','-u','origin',$Branch) | Out-Null
            Write-Ok 'GitHub 推送完成。'
            Show-Status
        }
        'log' { & git --no-pager log --oneline --decorate -20 }
        'open' { Start-Process 'https://github.com/yubboo/TonightDefense' }
        default { Stop-Fail ('未知 Action：' + $Name) }
    }
}

function Show-Menu {
    while ($true) {
        Write-Title ('TonightDefense GitHub 一键工作台 | v' + (Get-TonightDefenseVersion))
        Write-Host ('  仓库：' + $RepoUrl) -ForegroundColor DarkGray
        Write-Host ''
        Write-Host '  1. 一键推送（安全检查 -> 拉取/rebase -> Commit -> Push）' -ForegroundColor Green
        Write-Host '  2. 查看状态'
        Write-Host '  3. 仅拉取/rebase 远端 main'
        Write-Host '  4. 仅 Commit（不 Push）'
        Write-Host '  5. 仅运行项目/Git 安全检查'
        Write-Host '  6. 查看最近 Commit'
        Write-Host '  7. 打开 GitHub 仓库'
        Write-Host '  0. 退出'
        Write-Host ''
        $choice = Read-Host '请选择'
        switch ($choice) {
            '1' { Invoke-Action 'push' }
            '2' { Invoke-Action 'status' }
            '3' { Invoke-Action 'pull' }
            '4' { Invoke-Action 'commit' }
            '5' { Invoke-Action 'scan' }
            '6' { Invoke-Action 'log' }
            '7' { Invoke-Action 'open' }
            '0' { return }
            default { Write-Warn2 '请输入 0-7。' }
        }
        Write-Host ''
        if ($choice -ne '0') {
            Read-Host '按 Enter 返回菜单' | Out-Null
        }
    }
}

Initialize-Repository
if ($Action -eq 'menu') {
    Show-Menu
} else {
    Invoke-Action $Action $CommitMessage
}
