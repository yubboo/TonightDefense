const cloud = require('wx-server-sdk');
const crypto = require('crypto');

cloud.init({
    env: cloud.DYNAMIC_CURRENT_ENV,
});

const db = cloud.database();
const PLAYERS = 'players';

function createPublicUid(openid) {
    const hex = crypto
        .createHash('sha256')
        .update(openid)
        .digest('hex')
        .slice(0, 8);

    const number =
        10000000 +
        (parseInt(hex, 16) % 90000000);

    return `${number}`;
}

function publicPlayer(data) {
    return {
        uid: data.uid,
        nickname: data.nickname || '守城的勇者',
        avatarUrl: data.avatarUrl || '',
        level: Math.max(1, Number(data.level || 1)),
    };
}

exports.main = async (event) => {
    const context =
        cloud.getWXContext();

    const openid =
        context.OPENID;

    if (!openid) {
        return {
            ok: false,
            message: '无法识别微信用户身份',
        };
    }

    const doc =
        db.collection(PLAYERS)
            .doc(openid);

    let player = null;
    let isNew = false;

    try {
        const result =
            await doc.get();

        player =
            result.data;
    } catch (error) {
        isNew = true;

        player = {
            uid: createPublicUid(openid),
            nickname: '守城的勇者',
            avatarUrl: '',
            level: 1,
            saveVersion: 1,
            createdAt: db.serverDate(),
            lastLoginAt: db.serverDate(),
        };

        await doc.set({
            data: player,
        });
    }

    if (!isNew) {
        await doc.update({
            data: {
                lastLoginAt:
                    db.serverDate(),
            },
        });
    }

    return {
        ok: true,
        isNew,
        player: publicPlayer(player),
    };
};
