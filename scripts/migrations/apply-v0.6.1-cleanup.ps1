# Encoding: UTF-8 with BOM + CRLF is required for Windows PowerShell 5.1.
[CmdletBinding()]
param(
    [string]$ProjectRoot = ''
)

$ErrorActionPreference = 'Stop'

function Write-Step([string]$Text) { Write-Host ('[进行] ' + $Text) -ForegroundColor Cyan }
function Write-Ok([string]$Text) { Write-Host ('[完成] ' + $Text) -ForegroundColor Green }
function Stop-Fail([string]$Text) { Write-Host ('[失败] ' + $Text) -ForegroundColor Red; exit 1 }

if ([string]::IsNullOrWhiteSpace($ProjectRoot)) {
    $scriptDir = Split-Path -Parent $PSCommandPath
    $ProjectRoot = [System.IO.Path]::GetFullPath(
        [System.IO.Path]::Combine($scriptDir, '..', '..')
    )
} else {
    $ProjectRoot = [System.IO.Path]::GetFullPath($ProjectRoot)
}

if (-not [System.IO.Directory]::Exists($ProjectRoot)) {
    Stop-Fail ('项目根目录不存在：' + $ProjectRoot)
}

Set-Location -LiteralPath $ProjectRoot

$sentinels = @(
    'PROJECT.md',
    'assets/scripts/systems/hero/skill/runtime/HeroSkillRuntime.ts',
    'assets/scripts/systems/hero/character/data/CharacterCatalog.ts',
    'assets/scripts/systems/storage/inventory/runtime/InventoryService.ts',
    'assets/scripts/systems/battle/view/BattleSceneSetup.ts',
    'scripts/github/check-project.ps1'
)

foreach ($rel in $sentinels) {
    $full = [System.IO.Path]::Combine(
        $ProjectRoot,
        $rel.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
    )
    if (-not [System.IO.File]::Exists($full)) {
        Stop-Fail ('补丁文件尚未完整覆盖，缺少：' + $rel)
    }
}

$projectText = Get-Content -LiteralPath (Join-Path $ProjectRoot 'PROJECT.md') -Raw -Encoding UTF8
if ($projectText -notmatch '当前整理包版本：v0\.6\.1') {
    Stop-Fail 'PROJECT.md 不是 v0.6.1。请先把 TonightDefense-v0.6.1-patch.zip 完整覆盖到 v0.6.0 项目根目录。'
}

Write-Step '清理 v0.6.0 旧路径，完成 v0.6.1 结构迁移'

$obsoleteFiles = @(
    'ARCHITECTURE_V2_PATCH_MANIFEST.json',
    'DESIGN-SYNC-README.txt',
    'assets/scripts/debug/prototype.meta',
    'assets/scripts/debug/prototype/Step2SceneSetup.ts',
    'assets/scripts/debug/prototype/Step2SceneSetup.ts.meta',
    'assets/scripts/systems/battle/enemy/ai.meta',
    'assets/scripts/systems/battle/enemy/elite.meta',
    'assets/scripts/systems/battle/projectile.meta',
    'assets/scripts/systems/battle/spawning.meta',
    'assets/scripts/systems/battle/tower.meta',
    'assets/scripts/systems/character.meta',
    'assets/scripts/systems/character/animation.meta',
    'assets/scripts/systems/character/animation/CutoutCharacterAnimator.ts',
    'assets/scripts/systems/character/animation/CutoutCharacterAnimator.ts.meta',
    'assets/scripts/systems/character/animation/MageAnimationTuning.ts',
    'assets/scripts/systems/character/animation/MageAnimationTuning.ts.meta',
    'assets/scripts/systems/character/animation/legacy.meta',
    'assets/scripts/systems/character/animation/legacy/CharacterMotionAnimator.ts',
    'assets/scripts/systems/character/animation/legacy/CharacterMotionAnimator.ts.meta',
    'assets/scripts/systems/character/animation/legacy/SpineCharacterController.ts',
    'assets/scripts/systems/character/animation/legacy/SpineCharacterController.ts.meta',
    'assets/scripts/systems/character/companion.meta',
    'assets/scripts/systems/character/companion/CompanionBattleController.ts',
    'assets/scripts/systems/character/companion/CompanionBattleController.ts.meta',
    'assets/scripts/systems/character/data.meta',
    'assets/scripts/systems/character/data/CharacterCatalog.ts',
    'assets/scripts/systems/character/data/CharacterCatalog.ts.meta',
    'assets/scripts/systems/character/data/CompanionCatalog.ts',
    'assets/scripts/systems/character/data/CompanionCatalog.ts.meta',
    'assets/scripts/systems/character/party.meta',
    'assets/scripts/systems/character/party/PartyState.ts',
    'assets/scripts/systems/character/party/PartyState.ts.meta',
    'assets/scripts/systems/character/player.meta',
    'assets/scripts/systems/character/player/MainHeroController.ts',
    'assets/scripts/systems/character/player/MainHeroController.ts.meta',
    'assets/scripts/systems/character/player/PlayerController.ts',
    'assets/scripts/systems/character/player/PlayerController.ts.meta',
    'assets/scripts/systems/character/selection.meta',
    'assets/scripts/systems/character/selection/HeroSelectionState.ts',
    'assets/scripts/systems/character/selection/HeroSelectionState.ts.meta',
    'assets/scripts/systems/character/selection/PreBattleHeroSelectionController.ts',
    'assets/scripts/systems/character/selection/PreBattleHeroSelectionController.ts.meta',
    'assets/scripts/systems/character/selection/StarterHeroSelectionService.ts',
    'assets/scripts/systems/character/selection/StarterHeroSelectionService.ts.meta',
    'assets/scripts/systems/character/stats.meta',
    'assets/scripts/systems/character/stats/CharacterCombatant.ts',
    'assets/scripts/systems/character/stats/CharacterCombatant.ts.meta',
    'assets/scripts/systems/character/stats/CompanionStatsConfig.ts',
    'assets/scripts/systems/character/stats/CompanionStatsConfig.ts.meta',
    'assets/scripts/systems/character/visual.meta',
    'assets/scripts/systems/character/visual/CharacterSpriteController.ts',
    'assets/scripts/systems/character/visual/CharacterSpriteController.ts.meta',
    'assets/scripts/systems/character/visual/HeroBattleVisualFactory.ts',
    'assets/scripts/systems/character/visual/HeroBattleVisualFactory.ts.meta',
    'assets/scripts/systems/character/visual/MageCutoutFactory.ts',
    'assets/scripts/systems/character/visual/MageCutoutFactory.ts.meta',
    'assets/scripts/systems/character/visual/MageCutoutPoseConfig.ts',
    'assets/scripts/systems/character/visual/MageCutoutPoseConfig.ts.meta',
    'assets/scripts/systems/feature/codex.meta',
    'assets/scripts/systems/feature/economy.meta',
    'assets/scripts/systems/feature/economy/CoinService.ts',
    'assets/scripts/systems/feature/economy/CoinService.ts.meta',
    'assets/scripts/systems/feature/flags.meta',
    'assets/scripts/systems/feature/lifecycle.meta',
    'assets/scripts/systems/feature/shop.meta',
    'assets/scripts/systems/gameplay/data.meta',
    'assets/scripts/systems/inventory.meta',
    'assets/scripts/systems/inventory/consumable.meta',
    'assets/scripts/systems/inventory/data.meta',
    'assets/scripts/systems/inventory/data/InventoryTypes.ts',
    'assets/scripts/systems/inventory/data/InventoryTypes.ts.meta',
    'assets/scripts/systems/inventory/equipment.meta',
    'assets/scripts/systems/inventory/equipment/EquipmentLoadoutService.ts',
    'assets/scripts/systems/inventory/equipment/EquipmentLoadoutService.ts.meta',
    'assets/scripts/systems/inventory/item.meta',
    'assets/scripts/systems/inventory/runtime.meta',
    'assets/scripts/systems/inventory/runtime/InventoryService.ts',
    'assets/scripts/systems/inventory/runtime/InventoryService.ts.meta',
    'assets/scripts/systems/item.meta',
    'assets/scripts/systems/item/consumable.meta',
    'assets/scripts/systems/item/definition.meta',
    'assets/scripts/systems/item/definition/ItemCatalog.ts',
    'assets/scripts/systems/item/definition/ItemCatalog.ts.meta',
    'assets/scripts/systems/item/definition/ItemTypes.ts',
    'assets/scripts/systems/item/definition/ItemTypes.ts.meta',
    'assets/scripts/systems/item/equipment.meta',
    'assets/scripts/systems/item/material.meta',
    'assets/scripts/systems/level/difficulty.meta',
    'assets/scripts/systems/level/objective.meta',
    'assets/scripts/systems/profession.meta',
    'assets/scripts/systems/profession/data.meta',
    'assets/scripts/systems/profession/data/ProfessionPresentationCatalog.ts',
    'assets/scripts/systems/profession/data/ProfessionPresentationCatalog.ts.meta',
    'assets/scripts/systems/profession/definition.meta',
    'assets/scripts/systems/profession/definition/ProfessionCatalog.ts',
    'assets/scripts/systems/profession/definition/ProfessionCatalog.ts.meta',
    'assets/scripts/systems/profession/definition/ProfessionTypes.ts',
    'assets/scripts/systems/profession/definition/ProfessionTypes.ts.meta',
    'assets/scripts/systems/profession/runtime.meta',
    'assets/scripts/systems/profession/synergy.meta',
    'assets/scripts/systems/progression.meta',
    'assets/scripts/systems/progression/cultivation.meta',
    'assets/scripts/systems/progression/data.meta',
    'assets/scripts/systems/progression/experience.meta',
    'assets/scripts/systems/progression/experience/ExperienceSystem.ts',
    'assets/scripts/systems/progression/experience/ExperienceSystem.ts.meta',
    'assets/scripts/systems/progression/experience/LevelState.ts',
    'assets/scripts/systems/progression/experience/LevelState.ts.meta',
    'assets/scripts/systems/progression/fortification.meta',
    'assets/scripts/systems/progression/levelup.meta',
    'assets/scripts/systems/progression/levelup/LevelUpChoiceController.ts',
    'assets/scripts/systems/progression/levelup/LevelUpChoiceController.ts.meta',
    'assets/scripts/systems/progression/levelup/WaveRewardSchedule.ts',
    'assets/scripts/systems/progression/levelup/WaveRewardSchedule.ts.meta',
    'assets/scripts/systems/progression/recruitment.meta',
    'assets/scripts/systems/progression/recruitment/RandomService.ts',
    'assets/scripts/systems/progression/recruitment/RandomService.ts.meta',
    'assets/scripts/systems/progression/recruitment/RecruitService.ts',
    'assets/scripts/systems/progression/recruitment/RecruitService.ts.meta',
    'assets/scripts/systems/progression/upgrade.meta',
    'assets/scripts/systems/settings.meta',
    'assets/scripts/systems/settings/GamePerformanceSettings.ts',
    'assets/scripts/systems/settings/GamePerformanceSettings.ts.meta',
    'assets/scripts/systems/skill.meta',
    'assets/scripts/systems/skill/active.meta',
    'assets/scripts/systems/skill/active/ActiveSkillCatalog.ts',
    'assets/scripts/systems/skill/active/ActiveSkillCatalog.ts.meta',
    'assets/scripts/systems/skill/active/ActiveSkillRuntime.ts',
    'assets/scripts/systems/skill/active/ActiveSkillRuntime.ts.meta',
    'assets/scripts/systems/skill/active/SkillEffectResolver.ts',
    'assets/scripts/systems/skill/active/SkillEffectResolver.ts.meta',
    'assets/scripts/systems/skill/active/SkillTargeting.ts',
    'assets/scripts/systems/skill/active/SkillTargeting.ts.meta',
    'assets/scripts/systems/skill/active/StatusEffectSystem.ts',
    'assets/scripts/systems/skill/active/StatusEffectSystem.ts.meta',
    'assets/scripts/systems/skill/data.meta',
    'assets/scripts/systems/skill/definition.meta',
    'assets/scripts/systems/skill/definition/SkillCatalog.ts',
    'assets/scripts/systems/skill/definition/SkillCatalog.ts.meta',
    'assets/scripts/systems/skill/definition/UpgradeCatalog.ts',
    'assets/scripts/systems/skill/definition/UpgradeCatalog.ts.meta',
    'assets/scripts/systems/skill/effect.meta',
    'assets/scripts/systems/skill/effect/SkillEffectCatalog.ts',
    'assets/scripts/systems/skill/effect/SkillEffectCatalog.ts.meta',
    'assets/scripts/systems/skill/modifier.meta',
    'assets/scripts/systems/skill/runtime.meta',
    'assets/scripts/systems/skill/runtime/SkillUpgradeService.ts',
    'assets/scripts/systems/skill/runtime/SkillUpgradeService.ts.meta',
    'assets/scripts/systems/skill/targeting.meta',
    'assets/scripts/systems/warehouse.meta',
    'assets/scripts/systems/warehouse/data.meta',
    'assets/scripts/systems/warehouse/migration.meta',
    'assets/scripts/systems/warehouse/repository.meta',
    'assets/scripts/systems/warehouse/repository/WarehouseRepository.ts',
    'assets/scripts/systems/warehouse/repository/WarehouseRepository.ts.meta',
    'assets/scripts/systems/warehouse/storage.meta',
    'assets/scripts/ui/panels/skill/SkillTargetPortraitResolver.ts',
    'assets/scripts/ui/panels/skill/SkillTargetPortraitResolver.ts.meta',
    'migration-manifest.json',
    'project-modules.json',
)

$removedCount = 0
foreach ($rel in $obsoleteFiles) {
    $native = $rel.Replace('/', [System.IO.Path]::DirectorySeparatorChar)
    $full = [System.IO.Path]::Combine($ProjectRoot, $native)

    if ([System.IO.File]::Exists($full)) {
        [System.IO.File]::Delete($full)
        $removedCount++
    }
}

# 仅删除已经空掉的目录；绝不递归删除可能包含用户额外文件的目录。
$obsoleteDirs = $obsoleteFiles |
    ForEach-Object { [System.IO.Path]::GetDirectoryName($_.Replace('/', '\')) } |
    Where-Object { -not [string]::IsNullOrWhiteSpace($_) } |
    Sort-Object { $_.Length } -Descending -Unique

foreach ($relDir in $obsoleteDirs) {
    $fullDir = [System.IO.Path]::Combine($ProjectRoot, $relDir)
    if ([System.IO.Directory]::Exists($fullDir)) {
        try {
            $entries = [System.IO.Directory]::GetFileSystemEntries($fullDir)
            if ($entries.Length -eq 0) {
                [System.IO.Directory]::Delete($fullDir, $false)
            }
        } catch {}
    }
}

Write-Ok ('旧路径清理完成：删除 ' + $removedCount + ' 个旧文件')

$SafetyScript = Join-Path $ProjectRoot 'scripts\github\check-project.ps1'
if (-not [System.IO.File]::Exists($SafetyScript)) {
    Stop-Fail '缺少 Safety Gate：scripts/github/check-project.ps1'
}

Write-Step '运行 TonightDefense Safety Gate'
$oldPreference = $ErrorActionPreference
try {
    $ErrorActionPreference = 'Continue'
    & powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass `
        -File $SafetyScript `
        -Mode WorkingTree `
        -ProjectRoot $ProjectRoot
    $code = $LASTEXITCODE
} finally {
    $ErrorActionPreference = $oldPreference
}

if ($code -ne 0) {
    Stop-Fail 'v0.6.1 结构迁移完成，但 Safety Gate 未通过。请把控制台失败项发给 ChatGPT。'
}

Write-Ok 'TonightDefense v0.6.1 补丁迁移完成。'
Write-Host '现在可以用 Cocos Creator 3.8.8 打开项目预览测试。' -ForegroundColor White
