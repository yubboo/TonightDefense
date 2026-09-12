# 主动技能系统

## 权威边界

- `UpgradeCatalog`：波次奖励的属性强化，兼容原 `SkillCatalog` 数据。
- `ActiveSkillCatalog`：职业四技能定义。
- `ActiveSkillRuntime`：唯一拥有技能冷却、能量、释放状态和意图消费。
- `SkillTargeting`：按方向、目标、圆形范围取得目标。
- `SkillEffectResolver`：统一执行伤害、击退、护盾、治疗和状态效果。
- `StatusEffectSystem`：持续状态的生命周期与结算。
- `BattlePartyHUD`：只显示状态并发送 `hero-skill-intent`，不计算伤害或冷却。

## 首批职业模板

首版为炎诀少年、剑修、灵药师、体修提供四技能职责模板：高频输出、范围/控制、生存、终极技。炎诀少年已接入正式图标：炎弹、烈焰环、赤炎护体、天火陨星。

新角色优先复用职业模板；只有玩法职责确实不同，才在 `ActiveSkillCatalog` 增加新定义，避免 15 名角色立即复制出 60 套难以维护的逻辑。

## 事件链

```text
触摸技能按钮
  -> hero-skill-intent
  -> ActiveSkillRuntime 校验主角/暂停/冷却/能量
  -> SkillEffectResolver 结算
  -> active-skill-state-changed
  -> HUD 更新冷却遮罩、能量与可释放提示
```

UI 不允许直接扣能量、启动计时器或修改敌人生命。
