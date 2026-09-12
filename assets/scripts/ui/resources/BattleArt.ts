import {
    Graphics,
    isValid,
    Layers,
    Node,
    resources,
    Sprite,
    SpriteFrame,
    UITransform,
} from 'cc';

export const BattleArtPaths = {
    'map-ground':
        'scenes/themes/royal_city_outskirts/battle_ground',
    'guardian-tower':
        'buildings/defense/guardian_tower',
    'royal-wall':
        'buildings/city/royal_wall',
    'princess':
        'npcs/princess',
    'top-hud-panel':
        'ui/battle/formal/top_hud_panel',
    'party-card-frame':
        'ui/battle/formal/party_card_frame',
    'skill-flame-bolt':
        'effects/skills/flame_caster/flame_bolt',
    'skill-flame-ring':
        'effects/skills/flame_caster/flame_ring',
    'skill-crimson-guard':
        'effects/skills/flame_caster/crimson_guard',
    'skill-meteor':
        'effects/skills/flame_caster/meteor',
} as const;

export type BattleArtKey =
    keyof typeof BattleArtPaths;

export type BattleArtFit =
    | 'contain'
    | 'cover'
    | 'stretch';

/**
 * 战斗正式美术唯一加载入口。
 * Graphics 只保留为资源加载失败时的安全兜底。
 */
export class BattleArt {
    private static readonly cache =
        new Map<BattleArtKey, SpriteFrame>();

    private static preloadPromise:
        Promise<void> | null = null;

    static preloadRequired(): Promise<void> {
        if (this.preloadPromise) {
            return this.preloadPromise;
        }

        const keys =
            Object.keys(BattleArtPaths) as BattleArtKey[];

        this.preloadPromise =
            Promise.all(
                keys.map(
                    (key) =>
                        new Promise<void>((resolve) => {
                            const path =
                                `${BattleArtPaths[key]}/spriteFrame`;
                            const cached =
                                resources.get(path, SpriteFrame);

                            if (cached) {
                                this.cache.set(key, cached);
                                resolve();
                                return;
                            }

                            resources.load(
                                path,
                                SpriteFrame,
                                (error, frame) => {
                                    if (!error && frame) {
                                        this.cache.set(key, frame);
                                    }

                                    resolve();
                                },
                            );
                        }),
                ),
            ).then(() => undefined);

        return this.preloadPromise;
    }

    static attach(
        parent: Node,
        asset: BattleArtKey,
        width: number,
        height: number,
        fit: BattleArtFit = 'contain',
        onReady?: () => void,
        disableParentGraphics = true,
    ): Node {
        const node =
            new Node(`BattleArt_${asset}`);

        node.layer = Layers.Enum.UI_2D;
        parent.insertChild(node, 0);

        const transform =
            node.addComponent(UITransform);

        transform.setContentSize(
            width,
            height,
        );

        const sprite =
            node.addComponent(Sprite);

        sprite.sizeMode =
            Sprite.SizeMode.CUSTOM;
        sprite.trim = true;

        const path =
            `${BattleArtPaths[asset]}/spriteFrame`;

        const cached =
            this.cache.get(asset) ??
            resources.get(
                path,
                SpriteFrame,
            );

        if (cached) {
            this.applyFrame(
                parent,
                transform,
                sprite,
                cached,
                width,
                height,
                fit,
                onReady,
                disableParentGraphics,
            );

            return node;
        }

        resources.load(
            path,
            SpriteFrame,
            (error, frame) => {
                if (
                    !isValid(node, true) ||
                    !isValid(parent, true)
                ) {
                    return;
                }

                if (error || !frame) {
                    console.warn(
                        `[BattleArt] 无法加载 ${asset}: ${path}`,
                        error,
                    );
                    node.destroy();
                    return;
                }

                this.cache.set(asset, frame);
                this.applyFrame(
                    parent,
                    transform,
                    sprite,
                    frame,
                    width,
                    height,
                    fit,
                    onReady,
                    disableParentGraphics,
                );
            },
        );

        return node;
    }

    private static applyFrame(
        parent: Node,
        transform: UITransform,
        sprite: Sprite,
        frame: SpriteFrame,
        width: number,
        height: number,
        fit: BattleArtFit,
        onReady?: () => void,
        disableParentGraphics = true,
    ): void {
        sprite.spriteFrame = frame;

        if (fit !== 'stretch') {
            const rect = frame.rect;
            const scale =
                fit === 'cover'
                    ? Math.max(
                        width / rect.width,
                        height / rect.height,
                    )
                    : Math.min(
                        width / rect.width,
                        height / rect.height,
                    );

            transform.setContentSize(
                rect.width * scale,
                rect.height * scale,
            );
        }

        if (disableParentGraphics) {
            const fallback =
                parent.getComponent(Graphics);

            if (fallback) {
                fallback.enabled = false;
            }
        }

        onReady?.();
    }
}
