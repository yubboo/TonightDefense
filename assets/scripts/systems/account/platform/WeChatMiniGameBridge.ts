import {
    WECHAT_CLOUD_CONFIG,
} from '../config/WeChatCloudConfig';

interface WxLoginResult {
    code: string;
}

interface WxCloudCallResult {
    result?: unknown;
}

interface WxCloudLike {
    init(
        options:
            Record<string, unknown>,
    ): void;

    callFunction(
        options: {
            name: string;
            data?: unknown;
            success?: (
                result:
                    WxCloudCallResult,
            ) => void;
            fail?: (
                error:
                    unknown,
            ) => void;
        },
    ): void;
}

interface WxLike {
    login(
        options: {
            timeout?: number;
            success?: (
                result:
                    WxLoginResult,
            ) => void;
            fail?: (
                error:
                    unknown,
            ) => void;
        },
    ): void;

    cloud?: WxCloudLike;
}

export interface CloudPlayerPayload {
    uid: string;
    nickname: string;
    avatarUrl: string;
    level: number;
}

export interface CloudLoginPayload {
    ok: boolean;
    message?: string;
    isNew?: boolean;
    player?: CloudPlayerPayload;
}

/**
 * 微信小游戏 SDK 桥接层。
 *
 * 这里只碰 window/globalThis.wx，AccountSystem 的其他代码不直接依赖 wx。
 * 这样浏览器预览仍然可以运行。
 */
export class WeChatMiniGameBridge {
    private static cloudInitialized = false;

    static isWeChatMiniGame(): boolean {
        const wx =
            this.getWx();

        return !!(
            wx &&
            typeof wx.login ===
                'function'
        );
    }

    static isCloudConfigured(): boolean {
        return (
            WECHAT_CLOUD_CONFIG
                .envId
                .trim()
                .length > 0
        );
    }

    static async loginAndFetchPlayer():
        Promise<CloudLoginPayload> {
        const wx =
            this.getWx();

        if (!wx) {
            throw new Error(
                '当前不是微信小游戏环境',
            );
        }

        await this.loginWx(
            wx,
        );

        const cloud =
            wx.cloud;

        if (!cloud) {
            throw new Error(
                '当前微信基础库没有 wx.cloud，请在微信开发者工具中启用云开发并更新基础库',
            );
        }

        this.initCloud(
            cloud,
        );

        return await this.callLoginFunction(
            cloud,
        );
    }

    private static loginWx(
        wx:
            WxLike,
    ): Promise<void> {
        return new Promise(
            (
                resolve,
                reject,
            ) => {
                wx.login({
                    timeout:
                        WECHAT_CLOUD_CONFIG
                            .loginTimeoutMs,

                    success:
                        (
                            result,
                        ) => {
                            if (
                                !result.code
                            ) {
                                reject(
                                    new Error(
                                        'wx.login 没有返回登录 code',
                                    ),
                                );
                                return;
                            }

                            /**
                             * 云开发路径不把 code 发到客户端自己的服务器。
                             * 身份最终由云函数 cloud.getWXContext() 获取。
                             */
                            resolve();
                        },

                    fail:
                        (
                            error,
                        ) => {
                            reject(
                                new Error(
                                    `wx.login 失败：${this.describeError(error)}`,
                                ),
                            );
                        },
                });
            },
        );
    }

    private static initCloud(
        cloud:
            WxCloudLike,
    ): void {
        if (
            this.cloudInitialized
        ) {
            return;
        }

        cloud.init({
            env:
                WECHAT_CLOUD_CONFIG
                    .envId,
            traceUser: true,
        });

        this.cloudInitialized = true;
    }

    private static callLoginFunction(
        cloud:
            WxCloudLike,
    ): Promise<CloudLoginPayload> {
        return new Promise(
            (
                resolve,
                reject,
            ) => {
                let settled =
                    false;

                const timer =
                    setTimeout(
                        () => {
                            if (
                                settled
                            ) {
                                return;
                            }

                            settled = true;
                            reject(
                                new Error(
                                    '微信云登录超时',
                                ),
                            );
                        },
                        WECHAT_CLOUD_CONFIG
                            .loginTimeoutMs,
                    );

                cloud.callFunction({
                    name:
                        WECHAT_CLOUD_CONFIG
                            .loginFunctionName,

                    data: {
                        clientVersion:
                            '3.1',
                    },

                    success:
                        (
                            response,
                        ) => {
                            if (
                                settled
                            ) {
                                return;
                            }

                            settled = true;
                            clearTimeout(
                                timer,
                            );

                            resolve(
                                response.result as
                                    CloudLoginPayload,
                            );
                        },

                    fail:
                        (
                            error,
                        ) => {
                            if (
                                settled
                            ) {
                                return;
                            }

                            settled = true;
                            clearTimeout(
                                timer,
                            );

                            reject(
                                new Error(
                                    `云函数登录失败：${this.describeError(error)}`,
                                ),
                            );
                        },
                });
            },
        );
    }

    private static getWx():
        WxLike | null {
        const scope =
            globalThis as
                unknown as {
                    wx?: WxLike;
                };

        return scope.wx ?? null;
    }

    private static describeError(
        error:
            unknown,
    ): string {
        if (
            error instanceof Error
        ) {
            return error.message;
        }

        try {
            return JSON.stringify(
                error,
            );
        } catch {
            return `${error}`;
        }
    }
}
