/**
 * @architecture TonightDefense V1.0
 * @owner character
 * @module selection
 *
 * 开始游戏前：
 * 先随机三选一主角，
 * 选完后才允许第1小关正式开始。
 */
import {
    _decorator,
    Component,
    Node,
} from 'cc';

import {
    MainHeroController,
} from '../player/MainHeroController';

import {
    HeroSelectionState,
} from './HeroSelectionState';

import {
    StarterHeroSelectionService,
} from './StarterHeroSelectionService';

import {
    CharacterDefinition,
} from '../data/CharacterCatalog';

import {
    HeroSelectionPanel,
} from '../../../../ui/panels/hero-select/HeroSelectionPanel';

import {
    ChapterWaveController,
} from '../../../level/runtime/ChapterWaveController';

import {
    VirtualJoystick,
} from '../../../../ui/input/VirtualJoystick';

const {
    ccclass,
} = _decorator;

@ccclass(
    'PreBattleHeroSelectionController',
)
export class PreBattleHeroSelectionController
extends Component {
    private overlay:
        Node | null = null;

    private joystickWasEnabled =
        false;

    start(): void {
        if (
            HeroSelectionState
                .hasSelected
        ) {
            const selected =
                HeroSelectionState
                    .current;

            if (selected) {
                MainHeroController
                    .instance
                    ?.spawnSelectedHero(
                        selected,
                    );
            }

            ChapterWaveController
                .instance
                ?.beginAfterHeroSelection();

            return;
        }

        this.openSelection();
    }

    private openSelection(): void {
        const joystick =
            this.node.getComponent(
                VirtualJoystick,
            );

        this.joystickWasEnabled =
            !!joystick?.enabled;

        if (joystick) {
            joystick.enabled = false;
        }

        const canvas =
            this.node.parent;

        if (!canvas) {
            return;
        }

        const options =
            StarterHeroSelectionService
                .rollThree();

        console.log(
            '[今晚守城] 开局主角三选一：',
            options
                .map(
                    (
                        character,
                    ) =>
                        character.name,
                )
                .join(' / '),
        );

        void HeroSelectionPanel
            .create(
                canvas,
                options,
                (
                    character,
                ) => {
                    this.selectHero(
                        character,
                    );
                },
            )
            .then(
                (
                    overlay,
                ) => {
                    this.overlay =
                        overlay;
                },
            );
    }

    private selectHero(
        character:
            CharacterDefinition,
    ): void {
        if (
            HeroSelectionState
                .hasSelected
        ) {
            return;
        }

        HeroSelectionState.select(
            character,
        );

        MainHeroController
            .instance
            ?.spawnSelectedHero(
                character,
            );

        const joystick =
            this.node.getComponent(
                VirtualJoystick,
            );

        if (joystick) {
            joystick.enabled =
                this.joystickWasEnabled;
        }

        if (
            this.overlay &&
            this.overlay.isValid
        ) {
            this.overlay.destroy();
        }

        this.overlay = null;

        console.log(
            `[今晚守城] 本局主角：${character.name}`,
        );

        ChapterWaveController
            .instance
            ?.beginAfterHeroSelection();
    }
}
