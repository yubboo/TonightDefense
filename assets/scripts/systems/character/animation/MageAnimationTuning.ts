/**
 * @architecture TonightDefense V1.0
 * @owner character
 * @module animation
 *
 * 元素法师动作参数 V0.3：
 * 更慢、更柔、幅度更小、不同部件错相位。
 */
export const MAGE_ANIMATION_TUNING = {
    locomotionBlendSpeed: 5.2,

    idle: {
        breathSpeed: 1.85,
        swaySpeed: 1.1,

        rootBob: 0.38,
        headBob: 0.28,

        bodySway: 0.18,
        headCounterSway: 0.16,

        hatTipSway: 2.1,
        capeSway: 1.15,
        armSway: 0.38,
        staffSway: 0.55,

        orbPulseSpeed: 3.0,
        orbPulseAmount: 0.018,
    },

    walk: {
        stepSpeed: 7.1,

        rootBob: 1.05,

        legSwing: 4.2,
        upperArmSwing: 2.35,
        lowerArmSwing: 1.25,

        bodySway: 0.52,
        headCounterSway: 0.38,
        headBob: 0.42,

        hatTipLag: 2.45,
        capeLag: 1.95,
        staffLag: 1.15,
    },

    attack: {
        defaultDuration: 0.46,
        minimumDuration: 0.30,

        chargeEnd: 0.38,
        releaseEnd: 0.66,

        bodyCharge: -1.25,
        armUpperCharge: -10,
        armLowerCharge: -13,
        staffCharge: -6,

        bodyRelease: 1.45,
        armUpperRelease: 14,
        armLowerRelease: 16,
        staffRelease: 10,

        orbMoveX: 4,
        orbMoveY: 3,
        orbPulse: 0.09,

        hatReaction: 1.8,
        capeReaction: 1.25,
    },

    hurt: {
        defaultDuration: 0.22,
        minimumDuration: 0.15,

        rootKickX: 1.8,
        bodyKick: 2.6,
        headKick: 2.0,
        hatKick: 4.0,
        capeKick: 2.6,
    },
} as const;
