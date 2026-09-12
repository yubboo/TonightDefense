/**
 * 微信小游戏云开发配置。
 *
 * 重要：
 * - 这里只放“云环境 ID”，不是 AppSecret。
 * - AppSecret 永远不能写进 Cocos / 微信小游戏客户端。
 * - 创建微信云开发环境后，把环境 ID 填到 envId。
 */
export const WECHAT_CLOUD_CONFIG = {
    envId: 'cloud1-d0gex5u2heba099e6',
    loginFunctionName: 'tdLogin',
    loginTimeoutMs: 10000,
} as const;
