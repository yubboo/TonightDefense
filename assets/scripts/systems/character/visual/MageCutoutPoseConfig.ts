/**
 * @architecture TonightDefense V1.0
 * @owner character
 * @module visual
 *
 * 元素法师拆件基础姿势 V0.3。
 */
export interface CutoutPoseTransform {
    x: number;
    y: number;
    rotation: number;
}

export const MAGE_CUTOUT_POSE = {
    /**
     * V0.2 = 0.88
     * V0.3 缩到 0.64。
     */
    modelScale: 0.54,

    rootY: 1,

    body: {
        x: 0,
        y: -1,
        rotation: 0,
    },

    hairBack: {
        x: 0,
        y: 43,
        rotation: 0,
    },

    capeBack: {
        x: 0,
        y: 2,
        rotation: 0,
    },

    legL: {
        x: -10,
        y: -38,
        rotation: -1,
    },

    legR: {
        x: 10,
        y: -38,
        rotation: 1,
    },

    belt: {
        x: 0,
        y: -12,
        rotation: 0,
    },

    capeLeft: {
        x: -21,
        y: 4,
        rotation: -1.5,
    },

    capeRight: {
        x: 21,
        y: 4,
        rotation: 1.5,
    },

    armLUpper: {
        x: -23,
        y: 16,
        rotation: 1.5,
    },

    armLLower: {
        x: -5,
        y: -17,
        rotation: 0.5,
    },

    armRUpper: {
        x: 23,
        y: 16,
        rotation: -2,
    },

    armRLower: {
        x: 5,
        y: -17,
        rotation: -0.5,
    },

    staff: {
        x: 14,
        y: 0,
        rotation: -13,
    },

    staffOrb: {
        x: 12,
        y: 46,
        rotation: 0,
    },

    head: {
        x: 0,
        y: 41,
        rotation: 0,
    },

    hatBase: {
        x: 0,
        y: 27,
        rotation: 0,
    },

    hatTip: {
        x: 3,
        y: 15,
        rotation: 0,
    },
} as const;
