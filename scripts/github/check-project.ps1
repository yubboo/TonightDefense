# Encoding: UTF-8 with BOM. Required for Windows PowerShell 5.1 because this script contains non-ASCII text.
[CmdletBinding()]
param(
    [ValidateSet('Repository','WorkingTree','Staged')]
    [string]$Mode = 'WorkingTree',
    [string]$ProjectRoot = ''
)

$ErrorActionPreference = 'Stop'
try {
    $utf8 = New-Object System.Text.UTF8Encoding($false)
    [Console]::InputEncoding = $utf8
    [Console]::OutputEncoding = $utf8
    $OutputEncoding = $utf8
} catch {}

function Write-Step([string]$Text) { Write-Host ('[检查] ' + $Text) -ForegroundColor Cyan }
function Write-Ok([string]$Text) { Write-Host ('[通过] ' + $Text) -ForegroundColor Green }
function Add-Failure([System.Collections.Generic.List[string]]$List, [string]$Text) { $List.Add($Text) }

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    $ProjectRoot = [System.IO.Path]::GetFullPath((Join-Path (Split-Path -Parent $PSCommandPath) '..\..'))
} else {
    $ProjectRoot = [System.IO.Path]::GetFullPath($ProjectRoot)
}
Set-Location -LiteralPath $ProjectRoot

$failures = New-Object System.Collections.Generic.List[string]
$warnings = New-Object System.Collections.Generic.List[string]

Write-Step '项目骨架完整性'
$requiredFiles = @(
    'AGENTS.md',
    'PROJECT.md',
    'package.json',
    'tsconfig.json',
    '.gitignore',
    'assets/scenes/MainMenu.scene',
    'assets/scenes/Battle.scene',
    'assets/scripts/core/bootstrap/GameBootstrap.ts',
    'assets/scripts/systems/audio/AudioManager.ts',
    'assets/scripts/systems/character/data/CharacterCatalog.ts',
    'assets/scripts/systems/profession/definition/ProfessionCatalog.ts',
    'assets/scripts/systems/character/player/MainHeroController.ts',
    'assets/scripts/systems/character/companion/CompanionBattleController.ts',
    'assets/scripts/systems/battle/targeting/BattleTargetRegistry.ts',
    'assets/scripts/systems/feature/pause/BattlePauseService.ts',
    'assets/scripts/ui/panels/battle-pause/BattlePausePanel.ts',
    'assets/scripts/systems/level/runtime/ChapterWaveController.ts',
    'settings/v2/packages/project.json',
    'docs/PROJECT-STATUS.md',
    'docs/PROJECT-ARCHITECTURE.md',
    'docs/development/PROJECT-RULES.md',
    'docs/DEVELOPMENT-PLAN.md',
    'scripts/github/check-project.ps1',
    'push-tonight-defense.ps1',
    'TonightDefense-GitHub.bat',
    '.github/workflows/safety.yml'
)
foreach ($rel in $requiredFiles) {
    if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot ($rel -replace '/', '\')) -PathType Leaf)) {
        Add-Failure $failures ('关键文件缺失：' + $rel)
    }
}

$requiredDirs = @('assets/resources','assets/scripts','assets/scenes','settings','extensions','cloudfunctions')
foreach ($rel in $requiredDirs) {
    if (-not (Test-Path -LiteralPath (Join-Path $ProjectRoot ($rel -replace '/', '\')) -PathType Container)) {
        Add-Failure $failures ('关键目录缺失：' + $rel + '/')
    }
}

Write-Step 'Windows PowerShell / GitHub 工具安全'
$powerShellFiles = @(
    'push-tonight-defense.ps1',
    'scripts/github/check-project.ps1'
)
foreach ($rel in $powerShellFiles) {
    $full = Join-Path $ProjectRoot ($rel -replace '/', '\')
    if (-not (Test-Path -LiteralPath $full -PathType Leaf)) { continue }
    $bytes = [System.IO.File]::ReadAllBytes($full)
    $hasBom = $bytes.Length -ge 3 -and $bytes[0] -eq 0xEF -and $bytes[1] -eq 0xBB -and $bytes[2] -eq 0xBF
    if (-not $hasBom) {
        Add-Failure $failures ('PowerShell 脚本必须是 UTF-8 with BOM：' + $rel)
        continue
    }
    $decoded = [System.Text.Encoding]::UTF8.GetString($bytes, 3, $bytes.Length - 3)
    if ($decoded -match "(?<!`r)`n") {
        Add-Failure $failures ('PowerShell 脚本必须使用 CRLF：' + $rel)
    }
}

$pushHelper = Join-Path $ProjectRoot 'push-tonight-defense.ps1'
if (Test-Path -LiteralPath $pushHelper -PathType Leaf) {
    $pushText = Get-Content -LiteralPath $pushHelper -Raw -Encoding UTF8
    if ($pushText -notmatch [regex]::Escape('https://github.com/yubboo/TonightDefense.git')) {
        Add-Failure $failures 'GitHub helper 默认 RepoUrl 不是 TonightDefense 正式仓库。'
    }
    if ($pushText -notmatch 'function\s+Invoke-GitProbe') {
        Add-Failure $failures 'GitHub helper 缺少 Invoke-GitProbe；Windows PowerShell 5.1 可能把 Git stderr 探测误判为终止异常。'
    }
    if ($pushText -match '\$origin\s*=\s*&\s*git\s+remote\s+get-url\s+origin') {
        Add-Failure $failures '禁止直接用 git remote get-url origin 探测 origin；首次仓库没有 origin 时会触发 NativeCommandError。'
    }
    $remoteCheckIndex = $pushText.IndexOf("Invoke-GitProbe @('remote')")
    $remoteGetIndex = $pushText.IndexOf("Invoke-GitProbe @('remote','get-url','origin')")
    if ($remoteCheckIndex -lt 0 -or $remoteGetIndex -lt 0 -or $remoteCheckIndex -gt $remoteGetIndex) {
        Add-Failure $failures 'origin 初始化顺序异常：必须先 git remote 判断，再 get-url。'
    }
    # 不把 $Branch 放进双引号搜索串：PowerShell 会先展开变量，导致
    # Safety Gate 错把正确的源码判成“顺序异常”。
    $lsRemoteIndex = $pushText.IndexOf("Invoke-GitProbe @('ls-remote','--heads','origin',")
    $fetchIndex = $pushText.IndexOf("Invoke-GitProbe @('fetch','origin',")
    if ($lsRemoteIndex -lt 0 -or $fetchIndex -lt 0 -or $lsRemoteIndex -gt $fetchIndex) {
        Add-Failure $failures '首次推送顺序异常：必须先 ls-remote 判断远端 main，再 fetch。'
    }
}

Write-Step 'Cocos Scene / Meta 完整性与 UUID 唯一性'
foreach ($sceneRel in @('assets/scenes/MainMenu.scene','assets/scenes/Battle.scene')) {
    $scenePath = Join-Path $ProjectRoot ($sceneRel -replace '/', '\')
    if (Test-Path -LiteralPath $scenePath) {
        try { Get-Content -LiteralPath $scenePath -Raw -Encoding UTF8 | ConvertFrom-Json | Out-Null }
        catch { Add-Failure $failures ('场景 JSON 无法解析：' + $sceneRel + ' -> ' + $_.Exception.Message) }
    }
}

$uuidMap = @{}
$metaCount = 0
Get-ChildItem -LiteralPath (Join-Path $ProjectRoot 'assets') -Filter '*.meta' -File -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
    $metaCount++
    $rel = $_.FullName.Substring($ProjectRoot.Length).TrimStart('\').Replace('\','/')
    try {
        $json = Get-Content -LiteralPath $_.FullName -Raw -Encoding UTF8 | ConvertFrom-Json
        if ($json.uuid) {
            $uuid = [string]$json.uuid
            if ($uuidMap.ContainsKey($uuid)) {
                Add-Failure $failures ('重复 Meta UUID：' + $uuid + ' -> ' + $uuidMap[$uuid] + ' / ' + $rel)
            } else {
                $uuidMap[$uuid] = $rel
            }
        }
    } catch {
        Add-Failure $failures ('Meta JSON 损坏：' + $rel + ' -> ' + $_.Exception.Message)
    }
}
if ($metaCount -eq 0) { Add-Failure $failures 'assets 下没有找到任何 .meta；Cocos 项目资源 UUID 将无法稳定复现。' }

Write-Step '音频唯一目录与历史路径回归'
$audioDir = Join-Path $ProjectRoot 'assets\resources\audio'
if (-not (Test-Path -LiteralPath $audioDir -PathType Container)) {
    Add-Failure $failures '缺少唯一音频目录 assets/resources/audio/'
}
if (Test-Path -LiteralPath (Join-Path $ProjectRoot 'assets\resources\audio_v2')) {
    Add-Failure $failures '发现禁止回归的 assets/resources/audio_v2/'
}
$wav = @(Get-ChildItem -LiteralPath (Join-Path $ProjectRoot 'assets') -Filter '*.wav' -File -Recurse -ErrorAction SilentlyContinue)
if ($wav.Count -gt 0) { Add-Failure $failures ('发现 WAV 资源（项目约定只使用 MP3）：' + ($wav.FullName -join ', ')) }
$audioManagers = @(Get-ChildItem -LiteralPath (Join-Path $ProjectRoot 'assets\scripts') -Filter 'AudioManager.ts' -File -Recurse -ErrorAction SilentlyContinue)
if ($audioManagers.Count -ne 1) { Add-Failure $failures ('AudioManager.ts 数量应为 1，当前：' + $audioManagers.Count) }

Write-Step '已知回归保护'
$companionPath = Join-Path $ProjectRoot 'assets\scripts\systems\character\companion\CompanionBattleController.ts'
if (Test-Path -LiteralPath $companionPath) {
    $companionText = Get-Content -LiteralPath $companionPath -Raw -Encoding UTF8
    if ($companionText -match '\bstatProfile\b') {
        Add-Failure $failures 'CompanionBattleController.ts 又出现 statProfile；v0.4.13 已确认该旧变量会中断招募流程。'
    }
}

Write-Step 'TypeScript 相对 import 路径'
$tsFiles = @(Get-ChildItem -LiteralPath (Join-Path $ProjectRoot 'assets\scripts') -Filter '*.ts' -File -Recurse -ErrorAction SilentlyContinue)
$importRegex = [regex]'(?m)(?:from\s+|import\s*\()\s*["''](\.{1,2}/[^"'']+)["'']'
$importChecks = 0
$missingImports = New-Object System.Collections.Generic.List[string]

function Test-RelativeImportTarget([string]$ImporterDirectory, [string]$RelativeImport) {
    try {
        # 使用 System.IO，而不是把候选路径丢进 Test-Path 管道。
        # Windows PowerShell 5.1 在某些数组/Native 输出组合下会出现
        # 全量 false negative；File.Exists 对这里的普通源码路径更稳定。
        $nativeImport = $RelativeImport.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $base = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($ImporterDirectory, $nativeImport))

        $candidates = New-Object System.Collections.Generic.List[string]
        $candidates.Add($base)
        $candidates.Add($base + '.ts')
        $candidates.Add($base + '.tsx')
        $candidates.Add($base + '.js')
        $candidates.Add($base + '.mjs')
        $candidates.Add($base + '.cjs')
        $candidates.Add($base + '.json')
        $candidates.Add([System.IO.Path]::Combine($base, 'index.ts'))
        $candidates.Add([System.IO.Path]::Combine($base, 'index.tsx'))
        $candidates.Add([System.IO.Path]::Combine($base, 'index.js'))

        foreach ($candidate in $candidates) {
            if ([System.IO.File]::Exists($candidate)) {
                return $true
            }
        }
        return $false
    } catch {
        return $false
    }
}

foreach ($file in $tsFiles) {
    $text = Get-Content -LiteralPath $file.FullName -Raw -Encoding UTF8
    foreach ($m in $importRegex.Matches($text)) {
        $importChecks++
        $relImport = $m.Groups[1].Value
        if (-not (Test-RelativeImportTarget $file.DirectoryName $relImport)) {
            $relFile = $file.FullName.Substring($ProjectRoot.Length).TrimStart('\').Replace('\','/')
            $missingImports.Add($relFile + ' -> ' + $relImport)
        }
    }
}

foreach ($missing in $missingImports) {
    Add-Failure $failures ('相对 import 缺失：' + $missing)
}

# Safety Gate 自检：当前基线里这个导入必须能解析。
# 如果连它都失败，说明是检查器自身回归，不要输出几百条误报。
$bootstrapDir = Join-Path $ProjectRoot 'assets\scripts\core\bootstrap'
if ((Test-Path -LiteralPath $bootstrapDir -PathType Container) -and
    -not (Test-RelativeImportTarget $bootstrapDir '../../shared/GameEnums')) {
    Add-Failure $failures 'Safety Gate 内部错误：已知存在的 GameEnums.ts 无法被 import resolver 解析。'
}

Write-Step 'Git 跟踪文件安全边界'
$gitAvailable = [bool](Get-Command git -ErrorAction SilentlyContinue)
$gitDir = Join-Path $ProjectRoot '.git'
$filesToScan = @()
if ($gitAvailable -and (Test-Path -LiteralPath $gitDir -PathType Container)) {
    if ($Mode -eq 'Staged') {
        $filesToScan = @(& git -c core.quotePath=false diff --cached --name-only --diff-filter=ACMR)
    } elseif ($Mode -eq 'Repository') {
        $filesToScan = @(& git -c core.quotePath=false ls-files)
    } else {
        $filesToScan = @(& git -c core.quotePath=false ls-files --cached --others --exclude-standard)
    }
} else {
    $filesToScan = @(Get-ChildItem -LiteralPath $ProjectRoot -File -Recurse -ErrorAction SilentlyContinue | ForEach-Object {
        $_.FullName.Substring($ProjectRoot.Length).TrimStart('\').Replace('\','/')
    })
}

$forbiddenRoot = '^(?:library|temp|build|native|local|profiles|output|design-reference)/'
$forbiddenNested = '(^|/)(?:node_modules|\.pnpm-store)/'
$forbiddenExt = '\.(?:exe|dll|pdb|zip|7z|rar|psd|psb|dmp|stackdump|tmp|bak|key|priv|seed|pem|p12|pfx|jks|keystore)$'
$forbiddenNames = '(^|/)(?:project\.private\.config\.json|private\.config\.json|secrets\.json|credentials\.json)$'
$secretPatterns = @(
    '(?<![A-Za-z0-9])sk-(?:proj-|ant-)?[A-Za-z0-9_-]{20,}',
    'github_pat_[A-Za-z0-9_]{20,}',
    'gh[pousr]_[A-Za-z0-9]{30,}',
    '-----BEGIN(?: RSA| EC| OPENSSH)? PRIVATE KEY-----'
)
$textExtensions = @('.ts','.tsx','.js','.mjs','.cjs','.json','.scene','.meta','.md','.txt','.ps1','.bat','.cmd','.sh','.yml','.yaml','.xml','.html','.css','.py')

foreach ($file in $filesToScan) {
    if ([string]::IsNullOrWhiteSpace($file)) { continue }
    $rel = $file.Replace('\','/')
    $lower = $rel.ToLowerInvariant()
    if ($lower -match $forbiddenRoot) { Add-Failure $failures ('禁止进入 Git 的本机/生成/大设计目录：' + $rel); continue }
    if ($lower -match $forbiddenNested) { Add-Failure $failures ('依赖目录禁止提交：' + $rel); continue }
    if ($lower -match $forbiddenExt) { Add-Failure $failures ('构建/归档/设计源/密钥文件禁止普通 Git 提交：' + $rel); continue }
    if ($lower -match $forbiddenNames -or $lower -match '(^|/)\.env($|\.)') { Add-Failure $failures ('本机私密配置禁止提交：' + $rel); continue }

    try {
        $nativeRel = $rel.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
        $full = [System.IO.Path]::GetFullPath([System.IO.Path]::Combine($ProjectRoot, $nativeRel))
        if (-not [System.IO.File]::Exists($full)) { continue }
        $item = New-Object System.IO.FileInfo($full)
    } catch {
        Add-Failure $failures ('Git 文件路径无法由 PowerShell 解析：' + $rel + '；请检查 core.quotePath / 文件名编码。')
        continue
    }
    if ($item.Length -ge 95MB) { Add-Failure $failures (('文件接近/超过 GitHub 单文件限制：{0} ({1:N1} MB)' -f $rel, ($item.Length / 1MB))); continue }
    if ($item.Length -ge 20MB) { $warnings.Add((('大文件建议确认是否真要进 Git：{0} ({1:N1} MB)' -f $rel, ($item.Length / 1MB)))) }

    if ($textExtensions -contains $item.Extension.ToLowerInvariant()) {
        try {
            $content = Get-Content -LiteralPath $full -Raw -Encoding UTF8
            foreach ($pattern in $secretPatterns) {
                if ($content -match $pattern) { Add-Failure $failures ('疑似秘密/Token：' + $rel); break }
            }
        } catch {}
    }
}

if ($warnings.Count -gt 0) {
    Write-Host ''
    Write-Host '警告：' -ForegroundColor Yellow
    $warnings | ForEach-Object { Write-Host ('  - ' + $_) -ForegroundColor Yellow }
}

if ($failures.Count -gt 0) {
    Write-Host ''
    Write-Host ('TonightDefense Safety Gate FAILED，共 ' + $failures.Count + ' 项：') -ForegroundColor Red
    $failures | ForEach-Object { Write-Host ('  - ' + $_) -ForegroundColor Red }
    exit 1
}

Write-Host ''
Write-Ok ('TonightDefense Safety Gate PASS | TS=' + $tsFiles.Count + ' | Import=' + $importChecks + ' | Meta=' + $metaCount + ' | UUID=' + $uuidMap.Count)
exit 0
