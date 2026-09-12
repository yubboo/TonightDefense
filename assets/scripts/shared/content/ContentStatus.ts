/**
 * 全项目内容落地状态。
 *
 * reference_only: 只有设计参考图，禁止直接当正式运行资产。
 * prototype:       已有临时运行表现，但不是正式美术。
 * asset_ready:     正式可导入资产已准备好，但可能尚未接运行逻辑。
 * runtime_ready:   正式资产和运行逻辑都已接通。
 */
export type ContentImplementationStatus =
    | 'reference_only'
    | 'prototype'
    | 'asset_ready'
    | 'runtime_ready';
