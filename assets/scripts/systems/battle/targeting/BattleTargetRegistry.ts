/**
 * @architecture TonightDefense V1.0
 * @owner battle
 * @module targeting
 */
import {
    Node,
} from 'cc';

/**
 * 所有可战斗人物统一视为 Hero。
 * 玩家主角与伙伴的唯一运行时身份差异是控制方式。
 */
export type BattleHeroControlMode =
    | 'player'
    | 'ai';

export interface BattleCharacterTarget {
    id: string;
    kind: 'hero';
    controlMode:
        BattleHeroControlMode;
    node: Node;

    isAlive: () => boolean;

    takeDamage: (
        amount: number,
    ) => number;
}

export class BattleTargetRegistry {
    private static readonly targets =
        new Map<
            string,
            BattleCharacterTarget
        >();

    static register(
        target: BattleCharacterTarget,
    ): void {
        /**
         * 真机/热重载时，旧脚本实例有可能把历史结构残留到静态注册表。
         * 这里做一次运行时接口校验，避免坏目标进入每帧查询后把整场战斗卡死。
         */
        if (
            !target ||
            !target.node ||
            !target.node.isValid ||
            typeof target.isAlive !==
                'function' ||
            typeof target.takeDamage !==
                'function'
        ) {
            console.warn(
                '[今晚守城] BattleTargetRegistry 拒绝非法目标',
                target?.id ??
                    '<unknown>',
            );

            return;
        }

        this.targets.set(
            target.id,
            target,
        );
    }

    static unregister(
        id: string,
    ): void {
        this.targets.delete(id);
    }

    /**
     * 每次进入 Battle.scene 都应视为新的一局。
     * 清空静态目标表，防止微信开发者工具热重载/场景重进留下旧对象。
     */
    static clear(): void {
        this.targets.clear();
    }

    static getAliveTargets():
        BattleCharacterTarget[] {
        this.prune();

        const aliveTargets:
            BattleCharacterTarget[] = [];

        for (
            const [id, target]
            of this.targets
        ) {
            /**
             * 防御性检查：历史版本曾存在 isAlive 布尔值结构，
             * 不能直接 target.isAlive()，否则会在 update 中每帧抛错。
             */
            if (
                typeof target.isAlive !==
                'function'
            ) {
                console.warn(
                    `[今晚守城] BattleTargetRegistry 移除非法目标 ${id}: isAlive 不是函数`,
                );

                this.targets.delete(id);
                continue;
            }

            try {
                if (
                    target.isAlive.call(
                        target,
                    )
                ) {
                    aliveTargets.push(
                        target,
                    );
                }
            } catch (error) {
                console.warn(
                    `[今晚守城] BattleTargetRegistry 移除异常目标 ${id}`,
                    error,
                );

                this.targets.delete(id);
            }
        }

        return aliveTargets;
    }

    static findNearest(
        x: number,
        y: number,
        maxDistance =
            Number.POSITIVE_INFINITY,
    ):
        BattleCharacterTarget | null {
        let best:
            BattleCharacterTarget | null =
            null;

        let bestDistanceSq =
            maxDistance *
            maxDistance;

        /**
         * 这是怪物 AI 的高频热路径。
         * 旧版会先 getAliveTargets() 创建新数组，12 只怪 × 60FPS
         * 会产生大量短命数组并触发微信 JS GC，表现就是移动周期性顿挫。
         * 这里直接遍历 Map，零临时数组分配。
         */
        for (
            const [id, target]
            of this.targets
        ) {
            if (
                !this.isUsableTarget(
                    id,
                    target,
                )
            ) {
                continue;
            }

            let alive = false;

            try {
                alive =
                    target.isAlive.call(
                        target,
                    );
            } catch (error) {
                console.warn(
                    `[今晚守城] BattleTargetRegistry 移除异常目标 ${id}`,
                    error,
                );

                this.targets.delete(id);
                continue;
            }

            if (!alive) {
                continue;
            }

            const pos =
                target.node.position;

            const dx =
                pos.x - x;

            const dy =
                pos.y - y;

            const distanceSq =
                dx * dx +
                dy * dy;

            if (
                distanceSq <
                bestDistanceSq
            ) {
                bestDistanceSq =
                    distanceSq;

                best =
                    target;
            }
        }

        return best;
    }

    static getAliveCount(
        controlMode?:
            BattleHeroControlMode,
    ): number {
        let count = 0;

        for (
            const [id, target]
            of this.targets
        ) {
            if (
                !this.isUsableTarget(
                    id,
                    target,
                )
            ) {
                continue;
            }

            if (
                controlMode &&
                target.controlMode !==
                    controlMode
            ) {
                continue;
            }

            try {
                if (
                    target.isAlive.call(
                        target,
                    )
                ) {
                    count += 1;
                }
            } catch (error) {
                console.warn(
                    `[今晚守城] BattleTargetRegistry 移除异常目标 ${id}`,
                    error,
                );

                this.targets.delete(id);
            }
        }

        return count;
    }

    private static prune(): void {
        for (
            const [id, target]
            of this.targets
        ) {
            this.isUsableTarget(
                id,
                target,
            );
        }
    }

    private static isUsableTarget(
        id: string,
        target:
            BattleCharacterTarget,
    ): boolean {
        if (
            !target ||
            !target.node ||
            !target.node.isValid ||
            typeof target.isAlive !==
                'function' ||
            typeof target.takeDamage !==
                'function'
        ) {
            this.targets.delete(id);
            return false;
        }

        return true;
    }
}
