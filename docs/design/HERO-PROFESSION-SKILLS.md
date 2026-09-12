# TonightDefense Hero Profession Skill Designer

## 目标
用于 `yubboo/TonightDefense`（Cocos Creator 3.8.8 / TypeScript）的英雄职业技能设计，作为 TonightDefense 项目内职业技能设计规范使用。

## 英雄系统边界
- 英雄仓库是大厅中的英雄养成系统，不等同于普通仓库/背包。
- 子系统：职业系统、人物系统、技能系统、升级系统、装备系统。
- 普通仓库存放装备/材料/消耗品；英雄仓库存放与培养英雄。

## 必须遵守的 TonightDefense 架构
- 人物单一真相源：`CharacterCatalog`。
- 战斗数值/运行态：现有 `CharacterCombatant` / `EnemyController` / `BattleTargetRegistry`。
- 主动技能：沿用并扩展 `ProfessionSkillCatalog` + `HeroSkillRuntime`。
- 三选一成长：沿用并扩展 `HeroSkillUpgradeService` + `ProfessionSkillRunState`。
- 不创建第二套 SkillManager、UpgradeManager、HeroDatabase 或重复配置源。人物/职业/技能分别以 CharacterCatalog、ProfessionCatalog、ProfessionSkillCatalog 为唯一数据来源。
- 本文件既是设计规范，也是 v0.6.2 以后新增职业技能时的验收模板；运行时实现必须映射到现有 HeroSystem。

## v0.6.2 运行时映射
- 定义：`assets/scripts/systems/hero/skill/data/ProfessionSkillCatalog.ts`
- 类型：`ProfessionSkillTypes.ts`
- 单局等级：`runtime/ProfessionSkillRunState.ts`
- 自动施放/冷却：`runtime/HeroSkillRuntime.ts`
- 三选一：`upgrade/HeroSkillUpgradeService.ts`
- 目标：`targeting/SkillTargeting.ts`
- 效果：`effect/SkillEffectResolver.ts`
- 持续状态：`effect/StatusEffectSystem.ts`
- 战斗事件：`assets/scripts/systems/battle/combat/CombatEventBus.ts`
- 敌人状态：`assets/scripts/systems/battle/enemy/status/EnemyStatusSystem.ts`

## 职业技能规则
每个职业固定 5 个技能：
- 1 个被动
- 4 个主动

主动技能：
- 自动释放
- 释放后进入冷却
- 冷却完成且存在合法目标时再次自动释放
- 第一次在三选一中抽到 = 解锁 Lv.1
- 后续抽到 = Lv.2 → Lv.5
- Lv.5 优先做“质变/觉醒”，不能只是简单加数值

被动技能建议：
- 职业入场自带 Lv.1
- 后续可进入三选一池升到 Lv.5
- 被动必须体现职业身份

## 三选一规则
- 每次给 3 个不同候选。
- 只从当前出战阵容的职业池抽取。
- 主角职业权重建议 2.0。
- 每名伙伴职业权重建议 1.0。
- 同职业多角色可叠加权重。
- 已满级技能不再出现。
- 同一轮不能出现同一个技能两次。
- 当前项目已有成长选择波次可直接承接这套职业技能升级。

## 通用目标模式
`SELF` / `NEAREST_ENEMY` / `HIGHEST_HP_ENEMY` / `DENSEST_ENEMY_CLUSTER` / `FRONT_CONE` / `FRONT_LINE` / `AROUND_SELF` / `LOWEST_HP_ALLY` / `ALL_ALLIES` / `TEAM_CENTER`

## 五个首发职业

### 战士 Warrior
定位：近战持续输出、半肉、越战越勇。

**被动：战意沸腾 `warrior_battle_fury`**
- Lv1：战斗中每 5 秒获得 1 层战意，每层 +2% 攻击，最多 5 层。
- Lv2：叠层间隔 4.5 秒。
- Lv3：每层 +2.5% 攻击。
- Lv4：最多 6 层。
- Lv5：满层时额外获得 +10% 冷却恢复。

**旋风斩 `warrior_whirlwind`** — CD 7s / AROUND_SELF
- Lv1：3 段，每段 70% 攻击。
- Lv2：每段 85%。
- Lv3：范围 +20%。
- Lv4：4 段，每段 90%。
- Lv5：4 段，每段 100%，轻微牵引普通敌人。

**裂地斩 `warrior_earthsplitter`** — CD 9s / FRONT_LINE
- Lv1：前方直线 180% 攻击并击退。
- Lv2：220%。
- Lv3：宽度/距离 +25%。
- Lv4：260%，击退增强。
- Lv5：留下 2 秒裂隙，每秒 50% 攻击并减速。

**血怒连斩 `warrior_bloodrush_combo`** — CD 10s / HIGHEST_HP_ENEMY
- Lv1：4×55%。
- Lv2：4×65%。
- Lv3：5×65%。
- Lv4：技能暴击率 +20%。
- Lv5：对精英/Boss 额外 +30% 伤害。

**战吼 `warrior_warcry`** — CD 15s / ALL_ALLIES
- Lv1：全队 +15% 攻击、+10% 攻速，6 秒。
- Lv2：7 秒。
- Lv3：攻击加成 +20%。
- Lv4：攻速加成 +15%。
- Lv5：前 3 秒额外获得 15% 减伤。

### 坦克 Tank
定位：承伤、嘲讽、控制、保护阵线。

**被动：钢铁壁垒 `tank_iron_wall`**
- Lv1：每次受击获得 2% 减伤，持续 4 秒，最多 5 层。
- Lv2：最多 6 层。
- Lv3：每层 2.5%。
- Lv4：持续 6 秒。
- Lv5：满层时周期性获得 5% 最大生命护盾。

**盾牌猛击 `tank_shield_bash`** — CD 8s / FRONT_CONE
- Lv1：140% 攻击，眩晕 1.2 秒。
- Lv2：170%。
- Lv3：扇形范围 +20%。
- Lv4：眩晕 1.6 秒。
- Lv5：产生第二道冲击波。

**嘲讽怒吼 `tank_taunting_roar`** — CD 13s / AROUND_SELF
- Lv1：范围嘲讽 3 秒，被嘲讽敌人造成伤害 -10%。
- Lv2：范围 +20%。
- Lv3：3.5 秒。
- Lv4：伤害降低 -15%。
- Lv5：嘲讽结束后附加 30% 减速 2 秒。

**震地重踏 `tank_ground_stomp`** — CD 10s / AROUND_SELF
- Lv1：120% 攻击、40% 减速 3 秒、轻击退。
- Lv2：150%。
- Lv3：范围 +20%。
- Lv4：减速 50%。
- Lv5：1 秒后触发第二次 80% 攻击震波。

**不屈壁垒 `tank_unyielding_bulwark`** — CD 16s / ALL_ALLIES
- Lv1：自身 20% 最大生命护盾，队友 8%，持续 5 秒。
- Lv2：自身 25%。
- Lv3：队友 12%。
- Lv4：6 秒。
- Lv5：护盾存在期间再获得 10% 减伤。

### 游侠 Ranger
定位：远程物理、穿透、标记、精英击杀。

**被动：猎人印记 `ranger_hunters_mark`**
- Lv1：命中附加 5 秒印记，目标受到游侠伤害 +5%。
- Lv2：+7%。
- Lv3：印记 7 秒。
- Lv4：击杀带印记敌人时，游侠技能冷却 -0.35 秒。
- Lv5：攻击带印记目标时暴击率 +10%。

**多重箭 `ranger_multishot`** — CD 5s / FRONT_CONE
- Lv1：5 箭×65%。
- Lv2：6 箭。
- Lv3：每箭 75%。
- Lv4：每箭穿透 1 个敌人。
- Lv5：7 箭×85%，优先覆盖印记目标。

**穿云箭 `ranger_piercing_arrow`** — CD 8s / FRONT_LINE
- Lv1：220%，直线贯穿，每穿过一个目标衰减 15%。
- Lv2：250%。
- Lv3：距离 +25%。
- Lv4：无视 20% 防御。
- Lv5：不再穿透衰减，对精英/Boss +30%。

**箭雨 `ranger_arrow_rain`** — CD 11s / DENSEST_ENEMY_CLUSTER
- Lv1：5 波×55%。
- Lv2：范围 +20%。
- Lv3：附加 20% 减速。
- Lv4：6 波×65%。
- Lv5：7 波，最后一波额外暴击伤害。

**鹰眼狙击 `ranger_hawkeye_snipe`** — CD 12s / HIGHEST_HP_ENEMY
- Lv1：320%。
- Lv2：360%。
- Lv3：技能暴击率 +25%。
- Lv4：对印记目标 +40%。
- Lv5：击杀目标返还剩余冷却的 50%。

### 法师 Mage
定位：元素范围输出、控制、法术循环。

**被动：元素共鸣 `mage_elemental_resonance`**
- Lv1：每次主动技能施放获得 1 层共鸣，8 秒，最多 3 层；3 层后下一主动技能消耗全部层数，伤害 +30%、范围 +20%。
- Lv2：强化伤害 +35%。
- Lv3：层数持续 12 秒。
- Lv4：强化施法返还该技能 20% 冷却。
- Lv5：强化伤害 +50%。

**火球术 `mage_fireball`** — CD 5s / NEAREST_ENEMY
- Lv1：爆炸 170%。
- Lv2：200%。
- Lv3：灼烧 40%/秒，2 秒。
- Lv4：爆炸范围 +25%。
- Lv5：爆炸后分裂 3 枚小火球追击附近敌人。

**冰霜新星 `mage_frost_nova`** — CD 9s / DENSEST_ENEMY_CLUSTER
- Lv1：120%，减速 50% 3 秒。
- Lv2：150%。
- Lv3：范围 +20%。
- Lv4：减速 60%。
- Lv5：首击冻结普通敌人 1.5 秒，随后转为减速。

**连锁闪电 `mage_chain_lightning`** — CD 7s / NEAREST_ENEMY
- Lv1：首击 140%，弹射 5 次，每次衰减 15%。
- Lv2：6 次。
- Lv3：首击 160%。
- Lv4：衰减降至 8%。
- Lv5：8 次，最后一名目标触发小范围雷爆。

**奥术黑洞 `mage_arcane_vortex`** — CD 14s / DENSEST_ENEMY_CLUSTER
- Lv1：牵引 3 秒，每 0.5 秒造成 50%。
- Lv2：范围 +20%。
- Lv3：3.5 秒。
- Lv4：每跳 60%。
- Lv5：结束时造成 220% 范围爆炸。

### 辅助 Support
定位：治疗、护盾、增益、阵容续航。

**被动：守护灵光 `support_guardian_aura`**
- Lv1：全队受到治疗 +5%，减伤 3%。
- Lv2：减伤 4%。
- Lv3：受到治疗 +8%。
- Lv4：队友生命首次跌破 30% 时获得 8% 最大生命应急护盾；单目标内置 CD 20 秒。
- Lv5：护盾 12%，内置 CD 15 秒。

**圣愈术 `support_holy_heal`** — CD 7s / LOWEST_HP_ALLY
- Lv1：治疗 12% 目标最大生命 + 施法者系数。
- Lv2：14%。
- Lv3：CD 6.5 秒。
- Lv4：目标满血时，50% 治疗量转为临时护盾。
- Lv5：再弹向第二低血量队友，效果 60%。

**守护之盾 `support_guardian_shield`** — CD 9s / LOWEST_HP_ALLY
- Lv1：12% 最大生命护盾，5 秒。
- Lv2：15%。
- Lv3：6 秒。
- Lv4：护盾目标再获得 10% 减伤。
- Lv5：第二名队友获得 70% 数值的副护盾。

**战歌鼓舞 `support_battle_hymn`** — CD 15s / ALL_ALLIES
- Lv1：全队 +12% 攻击、+10% 攻速，6 秒。
- Lv2：7 秒。
- Lv3：攻击 +16%。
- Lv4：攻速 +15%。
- Lv5：再获得 +10% 移速和 5% 减伤。

**生命圣域 `support_sanctuary`** — CD 16s / TEAM_CENTER
- Lv1：持续 4 秒，范围内每秒恢复 3% 最大生命并获得 10% 减伤。
- Lv2：范围 +20%。
- Lv3：每秒恢复 4%。
- Lv4：持续 5 秒。
- Lv5：结束时额外恢复 8% 最大生命，并获得 3 秒 10% 减伤。

## 输出约定
以后新增职业时，必须输出：
1. 职业定位
2. 1 个被动
3. 4 个自动主动技能
4. 每个主动的目标模式和 CD
5. Lv1-Lv5 变化
6. 与其他职业的协同
7. 三选一文案
8. 对 TonightDefense 现有架构的映射建议
