# Boss 系统设计

## 目标与边界

Boss 是现有战斗系统中的特殊敌人，不建立第二套生命、目标、伤害、掉落或波次系统。

```text
ChapterWaveController（第 40 波编排 / 选择 BossId）
    -> EnemyController（生成、HP、防御、移动、普攻、死亡、掉落）
        -> BossRuntimeController（阶段、技能吟唱、范围技能、战斗精灵）
            -> BossCatalog（Boss 与技能定义唯一来源）
        -> BattleTargetRegistry（Hero 目标与范围伤害）
        -> DefenseObjectiveService（雕像 -> 城墙 -> 公主）
    -> BossHealthHUD（只显示状态）
    -> AudioManager（唯一音频入口）
```

## 赤金炎龙

- 身份：`flame_dragon`，焰岩之王，第 40 波关底首领。
- 阶段 1（100%~70%）：灼翼，使用龙炎吐息。
- 阶段 2（70%~38%）：熔甲，加入焰尾横扫，提高移动与普攻频率。
- 阶段 3（38%~0%）：焚城，加入陨石火雨，再次提高移动与普攻频率。
- 所有特殊技能先显示范围预警，再结算伤害；玩家可以离开预警区域规避。
- Hero 存活时技能以 Hero 为目标；Hero 全灭后继续攻击当前防线目标。
- Boss 死亡继续走统一经验、掉落、关卡完成与奖励流程。

## 资源

- 战斗精灵：`assets/resources/enemies/bosses/flame_dragon/sprite/flame_dragon_battle.png`。
- 龙吼：`assets/resources/audio/sfx/flame_dragon_roar.mp3`。
- 设计依据：用户提供的《赤金炎龙 Boss 素材设计方案 02》；战斗精灵由该设计板派生并压缩为 768 × 603 RGBA。
- 用户提供的 WAV 未进入运行资源，保持项目只使用 MP3 的规则。

## Cocos Creator 兼容基线

- 唯一版本：Cocos Creator 3.8.8。
- 运行时代码只使用项目当前已在用的 `cc` API：`Node`、`Graphics`、`Sprite`、`SpriteFrame`、`resources`、`UITransform`。
- PNG / MP3 与 `.meta` 一起进入 Git；动态加载路径位于 `assets/resources/` 下。

## 验证清单

1. 把 `Battle.scene` 中 `ChapterWaveController.startWaveNumber` 临时设为 40，完成开局选角。
2. 普通潮和精英潮清空后，只出现一次赤金炎龙警报和一次 Boss。
3. Boss 精灵、Boss BGM、龙吼与顶部 Boss 血条正常出现。
4. 70% 与 38% 生命阈值只切换一次阶段，血条阶段文字同步更新。
5. 三种技能先出现红金预警圈，站在圈外不受伤，圈内 Hero 正常受伤。
6. Hero 全灭后，Boss 按雕像、城墙、公主顺序推进。
7. Boss 死亡后正常掉落、进入第 40 波奖励并显示通关界面。
8. 暂停、继续、招募、AI 英雄阵亡与雕像复活没有回归。
