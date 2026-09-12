import {
    sys,
} from 'cc';

import {
    AccountLoginResult,
    PlayerAccountSnapshot,
} from '../model/PlayerAccount';

import {
    WeChatMiniGameBridge,
} from '../platform/WeChatMiniGameBridge';

/**
 * AccountSystem / 账号系统
 *
 * 市面微信小游戏常见做法：
 * - 微信环境：微信身份 -> 云函数 -> OpenID 绑定玩家档案。
 * - 浏览器预览：开发者 Guest，不阻断日常开发。
 *
 * 注意：OpenID 只在服务端使用，不显示给玩家。
 */
export class AccountService {
    private static readonly CACHE_KEY =
        'TonightDefense.Account.Cache.V1';

    private static current:
        PlayerAccountSnapshot | null =
        null;

    static async login():
        Promise<AccountLoginResult> {
        if (
            !WeChatMiniGameBridge
                .isWeChatMiniGame()
        ) {
            const account =
                this.buildBrowserGuest();

            this.current =
                account;

            return {
                ok: true,
                code: 'browser-dev',
                message:
                    '浏览器开发模式：已使用本地测试账号',
                account,
            };
        }

        if (
            !WeChatMiniGameBridge
                .isCloudConfigured()
        ) {
            return {
                ok: false,
                code:
                    'cloud-env-missing',
                message:
                    '微信云环境尚未配置：请先填写 WeChatCloudConfig.ts 的 envId，并部署 tdLogin 云函数',
                account: null,
            };
        }

        try {
            const payload =
                await WeChatMiniGameBridge
                    .loginAndFetchPlayer();

            if (
                !payload.ok ||
                !payload.player
            ) {
                throw new Error(
                    payload.message ??
                    '云端没有返回玩家资料',
                );
            }

            const account:
                PlayerAccountSnapshot = {
                provider:
                    'wechat',
                cloudBound:
                    true,
                online:
                    true,
                isNew:
                    !!payload.isNew,
                profile: {
                    uid:
                        payload.player.uid,
                    nickname:
                        payload.player.nickname ||
                        '守城的勇者',
                    avatarUrl:
                        payload.player.avatarUrl ||
                        '',
                    level:
                        Math.max(
                            1,
                            Math.floor(
                                payload.player.level ||
                                1,
                            ),
                        ),
                },
            };

            this.current =
                account;

            this.saveCache(
                account,
            );

            return {
                ok: true,
                code: 'ok',
                message:
                    account.isNew
                        ? '微信账号已绑定，玩家档案创建成功'
                        : '微信账号登录成功',
                account,
            };
        } catch (
            error
        ) {
            const cached =
                this.readCache();

            if (
                cached &&
                cached.provider ===
                    'wechat'
            ) {
                const offline = {
                    ...cached,
                    online: false,
                };

                this.current =
                    offline;

                return {
                    ok: true,
                    code:
                        'cloud-login-failed',
                    message:
                        '网络登录失败，暂时使用本机缓存资料进入大厅',
                    account:
                        offline,
                };
            }

            return {
                ok: false,
                code:
                    'cloud-login-failed',
                message:
                    error instanceof Error
                        ? error.message
                        : '微信账号登录失败',
                account: null,
            };
        }
    }

    static getCurrent():
        PlayerAccountSnapshot {
        if (
            this.current
        ) {
            return this.current;
        }

        const cached =
            this.readCache();

        if (cached) {
            this.current =
                cached;
            return cached;
        }

        const guest =
            this.buildBrowserGuest();

        this.current =
            guest;

        return guest;
    }

    private static buildBrowserGuest():
        PlayerAccountSnapshot {
        let uid =
            sys.localStorage
                .getItem(
                    'TonightDefense.DevGuestUid.V1',
                );

        if (!uid) {
            uid =
                `DEV-${Math.floor(
                    100000 +
                    Math.random() *
                    900000,
                )}`;

            sys.localStorage
                .setItem(
                    'TonightDefense.DevGuestUid.V1',
                    uid,
                );
        }

        return {
            provider: 'dev',
            cloudBound: false,
            online: true,
            isNew: false,
            profile: {
                uid,
                nickname:
                    '守城的勇者',
                avatarUrl: '',
                level: 1,
            },
        };
    }

    private static saveCache(
        account:
            PlayerAccountSnapshot,
    ): void {
        sys.localStorage
            .setItem(
                this.CACHE_KEY,
                JSON.stringify(
                    account,
                ),
            );
    }

    private static readCache():
        PlayerAccountSnapshot | null {
        const raw =
            sys.localStorage
                .getItem(
                    this.CACHE_KEY,
                );

        if (!raw) {
            return null;
        }

        try {
            const parsed =
                JSON.parse(
                    raw,
                ) as
                    PlayerAccountSnapshot;

            if (
                !parsed.profile ||
                !parsed.profile.uid
            ) {
                return null;
            }

            return parsed;
        } catch {
            return null;
        }
    }
}
