export type AccountProvider =
    | 'wechat'
    | 'dev';

export interface PlayerAccountProfile {
    uid: string;
    nickname: string;
    avatarUrl: string;
    level: number;
}

export interface PlayerAccountSnapshot {
    provider: AccountProvider;
    cloudBound: boolean;
    online: boolean;
    isNew: boolean;
    profile: PlayerAccountProfile;
}

export interface AccountLoginResult {
    ok: boolean;
    code:
        | 'ok'
        | 'browser-dev'
        | 'cloud-env-missing'
        | 'wechat-sdk-missing'
        | 'wechat-login-failed'
        | 'cloud-unavailable'
        | 'cloud-login-failed';
    message: string;
    account: PlayerAccountSnapshot | null;
}
