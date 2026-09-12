import * as fs from 'fs';
import * as path from 'path';

/**
 * 云函数同步失败时，让构建直接报错。
 * 避免出现“Cocos 显示构建成功，但微信工程缺云函数”的情况。
 */
export const throwError = true;

function copyDirectory(source: string, target: string): void {
    if (!fs.existsSync(source)) {
        throw new Error(`[wechat-cloud-sync] 源目录不存在: ${source}`);
    }

    fs.mkdirSync(target, { recursive: true });

    const entries = fs.readdirSync(source, { withFileTypes: true });

    for (const entry of entries) {
        const sourcePath = path.join(source, entry.name);
        const targetPath = path.join(target, entry.name);

        if (entry.isDirectory()) {
            // 云函数本地 node_modules 不复制到微信构建目录。
            // tdLogin 使用“云端安装依赖”部署。
            if (entry.name === 'node_modules') {
                continue;
            }

            copyDirectory(sourcePath, targetPath);
        } else {
            fs.copyFileSync(sourcePath, targetPath);
        }
    }
}

/**
 * Cocos 整个微信小游戏构建结束后执行。
 */
export async function onAfterBuild(): Promise<void> {
    // 当前 JS 最终运行位置：
    // TonightDefense/extensions/wechat-cloud-sync/dist/hooks.js
    const extensionRoot = path.resolve(__dirname, '..');

    // extensions/wechat-cloud-sync -> extensions -> TonightDefense
    const projectRoot = path.resolve(extensionRoot, '..', '..');

    const sourceCloudFunctions = path.join(
        projectRoot,
        'cloudfunctions'
    );

    const wechatBuildRoot = path.join(
        projectRoot,
        'build',
        'wechatgame'
    );

    const targetCloudFunctions = path.join(
        wechatBuildRoot,
        'cloudfunctions'
    );

    console.log(
        '[wechat-cloud-sync] 开始同步微信云函数...'
    );

    console.log(
        `[wechat-cloud-sync] 来源: ${sourceCloudFunctions}`
    );

    console.log(
        `[wechat-cloud-sync] 目标: ${targetCloudFunctions}`
    );

    if (!fs.existsSync(wechatBuildRoot)) {
        throw new Error(
            `[wechat-cloud-sync] 找不到微信构建目录: ${wechatBuildRoot}\n` +
            '请确认 Cocos 构建任务名称固定为 wechatgame。'
        );
    }

    // 清理上一次构建残留的云函数
    if (fs.existsSync(targetCloudFunctions)) {
        fs.rmSync(targetCloudFunctions, {
            recursive: true,
            force: true,
        });
    }

    copyDirectory(
        sourceCloudFunctions,
        targetCloudFunctions
    );

    console.log(
        '[wechat-cloud-sync] 云函数同步完成。'
    );

    // 再检查 tdLogin，防止路径配置错误
    const tdLoginPath = path.join(
        targetCloudFunctions,
        'tdLogin'
    );

    if (!fs.existsSync(tdLoginPath)) {
        throw new Error(
            `[wechat-cloud-sync] 同步结束但没有找到 tdLogin: ${tdLoginPath}`
        );
    }

    console.log(
        '[wechat-cloud-sync] tdLogin 已写入微信小游戏构建目录。'
    );
}