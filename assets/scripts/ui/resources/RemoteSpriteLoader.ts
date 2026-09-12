import {
    assetManager,
    ImageAsset,
    isValid,
    Node,
    Sprite,
    SpriteFrame,
    Texture2D,
} from 'cc';

/**
 * 远程头像加载器。
 * 账号系统拿到合法 avatarUrl 后，MainMenu 只负责显示。
 */
export class RemoteSpriteLoader {
    static load(
        node:
            Node,
        url:
            string,
    ): void {
        if (
            !url ||
            !node.isValid
        ) {
            return;
        }

        assetManager
            .loadRemote<ImageAsset>(
                url,
                (
                    error,
                    image,
                ) => {
                    if (
                        error ||
                        !image ||
                        !isValid(
                            node,
                            true,
                        )
                    ) {
                        return;
                    }

                    const texture =
                        new Texture2D();

                    texture.image =
                        image;

                    const frame =
                        new SpriteFrame();

                    frame.texture =
                        texture;

                    let sprite =
                        node.getComponent(
                            Sprite,
                        );

                    if (!sprite) {
                        sprite =
                            node.addComponent(
                                Sprite,
                            );
                    }

                    sprite.spriteFrame =
                        frame;
                },
            );
    }
}
