/**
 * @architecture TonightDefense V1.0
 * @owner debug
 * @module battle
 * @migratedFrom battle/BattleLayoutPreview.ts
 */
import { _decorator, Component } from 'cc';

const { ccclass } = _decorator;

/**
 * 《今晚守城》
 *
 * 这个组件以前用于显示：
 * “左上出怪区 / 伙伴1 / 防御塔”等调试文字和红框。
 *
 * 现在正式关闭所有可视化调试标记。
 * 即使 GameRoot 还挂着本组件，也不会往游戏画面画任何东西。
 */
@ccclass('BattleLayoutPreview')
export class BattleLayoutPreview extends Component {
    start(): void {
        console.log(
            '[今晚守城] 战场布局配置已加载，调试文字/边框已关闭',
        );
    }
}
