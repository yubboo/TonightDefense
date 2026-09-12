# v0.6.0 正式战斗美术来源

本目录保存 v0.6.0 战斗美术的原始生成稿，供 GitHub、网页端 AI 与后续美术继续拆分和精修。实际运行时压缩图位于 `assets/resources/`，并由 Cocos Creator 3.8.8 的 `.meta` 固定 UUID。

## 已接入运行时

| 原始稿 | 运行时资源 | 用途 |
| --- | --- | --- |
| `battle_ground.png` | `assets/resources/scenes/themes/royal_city_outskirts/battle_ground.png` | 王城前境无 UI 战斗底图 |
| `guardian_tower.png` | `assets/resources/buildings/defense/guardian_tower.png` | 单座守护塔 |
| `royal_wall.png` | `assets/resources/buildings/city/royal_wall.png` | 城墙防线 |
| `princess.png` | `assets/resources/npcs/princess.png` | 城墙后的公主 |
| `top_hud_panel.png` | `assets/resources/ui/battle/formal/top_hud_panel.png` | 顶部蓝金关卡 HUD |
| `party_card_frame_landscape_original.png` | `assets/resources/ui/battle/formal/party_card_frame.png` | 底部五人横向人物卡框 |
| `flame_bolt.png` 等四张图 | `assets/resources/effects/skills/flame_caster/` | 炎诀少年四个主动技能图标 |

`party_card_frame.png` 是早期竖版源稿，仅保留作设计参考；运行时只能使用已批准的横版卡框。

## 生成方向与授权

- 生成工具：OpenAI ImageGen。
- 项目内用途：TonightDefense 的运行时游戏美术、宣传截图和后续衍生修改。
- 统一风格：明亮可爱幻想塔防、王国蓝金与暖象牙白、轮廓清晰、竖屏小尺寸仍可辨识。
- 地图提示方向：空战场、中央石板路、森林边界、无角色和文字。
- 建筑/人物提示方向：透明背景、独立守护塔、弧形城墙、蓝金公主。
- UI 提示方向：透明背景、无文字、无角色；顶部关卡面板和横向人物卡均保留可由 Cocos 动态填充的空区域。
- 技能提示方向：深蓝/暗红底、金红火焰主体；炎弹、烈焰环、赤炎护体、天火陨星四种职责必须一眼区分。

后续协作者不得把包含完整角色、UI、文字的整张概念图直接当运行资源，也不得重新生成资源覆盖这里已批准的图；需要替换时应保留文件职责、透明通道、英文路径和既有 `.meta` UUID。
