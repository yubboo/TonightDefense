import type {
    Node,
} from 'cc';

/**
 * CombatEventBus 是 Battle 与 HeroSkill 之间的轻量事件桥。
 *
 * 规则：
 * - 生命/伤害事实仍由 CharacterCombatant / EnemyController 持有；
 * - 事件只发布“已经发生的事实”，不在这里重复结算；
 * - HeroSkillRuntime 只订阅事件实现职业被动，不反向接管 EnemyController；
 * - 监听器异常必须隔离，不能打断战斗主循环。
 */
export type CombatSourceKind =
    | 'hero-basic'
    | 'hero-skill'
    | 'hero-dot'
    | 'enemy'
    | 'boss-skill'
    | 'objective'
    | 'environment';

export interface CombatSource {
    kind: CombatSourceKind;
    actorId?: string;
    professionId?: string;
    skillId?: string;
    enemyId?: number;
}

export interface HeroDamagedCombatEvent {
    targetNode: Node;
    requestedDamage: number;
    actualDamage: number;
    hpDamage: number;
    shieldAbsorbed: number;
    currentHp: number;
    maxHp: number;
    source?: CombatSource;
}

export interface EnemyDamagedCombatEvent {
    enemyId: number;
    enemyNode: Node;
    rank: 'normal' | 'elite' | 'boss';
    requestedDamage: number;
    actualDamage: number;
    currentHp: number;
    maxHp: number;
    critical: boolean;
    killed: boolean;
    source?: CombatSource;
}

export interface EnemyDefeatedCombatEvent {
    enemyId: number;
    enemyNode: Node;
    rank: 'normal' | 'elite' | 'boss';
    source?: CombatSource;
}

type Listener<T> = (event: T) => void;

export class CombatEventBus {
    private static readonly heroDamagedListeners =
        new Set<Listener<HeroDamagedCombatEvent>>();

    private static readonly enemyDamagedListeners =
        new Set<Listener<EnemyDamagedCombatEvent>>();

    private static readonly enemyDefeatedListeners =
        new Set<Listener<EnemyDefeatedCombatEvent>>();

    static onHeroDamaged(
        listener: Listener<HeroDamagedCombatEvent>,
    ): () => void {
        this.heroDamagedListeners.add(listener);
        return () => {
            this.heroDamagedListeners.delete(listener);
        };
    }

    static onEnemyDamaged(
        listener: Listener<EnemyDamagedCombatEvent>,
    ): () => void {
        this.enemyDamagedListeners.add(listener);
        return () => {
            this.enemyDamagedListeners.delete(listener);
        };
    }

    static onEnemyDefeated(
        listener: Listener<EnemyDefeatedCombatEvent>,
    ): () => void {
        this.enemyDefeatedListeners.add(listener);
        return () => {
            this.enemyDefeatedListeners.delete(listener);
        };
    }

    static emitHeroDamaged(
        event: HeroDamagedCombatEvent,
    ): void {
        this.emitSafe(
            this.heroDamagedListeners,
            event,
            'hero-damaged',
        );
    }

    static emitEnemyDamaged(
        event: EnemyDamagedCombatEvent,
    ): void {
        this.emitSafe(
            this.enemyDamagedListeners,
            event,
            'enemy-damaged',
        );
    }

    static emitEnemyDefeated(
        event: EnemyDefeatedCombatEvent,
    ): void {
        this.emitSafe(
            this.enemyDefeatedListeners,
            event,
            'enemy-defeated',
        );
    }

    /**
     * Battle.scene 重进 / Creator 热重载时清掉历史监听。
     * 必须在重新 addComponent(HeroSkillRuntime) 之前调用。
     */
    static clear(): void {
        this.heroDamagedListeners.clear();
        this.enemyDamagedListeners.clear();
        this.enemyDefeatedListeners.clear();
    }

    private static emitSafe<T>(
        listeners: ReadonlySet<Listener<T>>,
        event: T,
        eventName: string,
    ): void {
        for (const listener of listeners) {
            try {
                listener(event);
            } catch (error) {
                console.warn(
                    `[今晚守城] CombatEventBus ${eventName} 监听异常`,
                    error,
                );
            }
        }
    }
}
