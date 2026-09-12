"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwError = void 0;
exports.onAfterBuild = onAfterBuild;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
/**
 * 云函数同步失败时，让构建直接报错。
 * 避免出现“Cocos 显示构建成功，但微信工程缺云函数”的情况。
 */
exports.throwError = true;
function copyDirectory(source, target) {
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
        }
        else {
            fs.copyFileSync(sourcePath, targetPath);
        }
    }
}
/**
 * Cocos 整个微信小游戏构建结束后执行。
 */
async function onAfterBuild() {
    // 当前 JS 最终运行位置：
    // TonightDefense/extensions/wechat-cloud-sync/dist/hooks.js
    const extensionRoot = path.resolve(__dirname, '..');
    // extensions/wechat-cloud-sync -> extensions -> TonightDefense
    const projectRoot = path.resolve(extensionRoot, '..', '..');
    const sourceCloudFunctions = path.join(projectRoot, 'cloudfunctions');
    const wechatBuildRoot = path.join(projectRoot, 'build', 'wechatgame');
    const targetCloudFunctions = path.join(wechatBuildRoot, 'cloudfunctions');
    console.log('[wechat-cloud-sync] 开始同步微信云函数...');
    console.log(`[wechat-cloud-sync] 来源: ${sourceCloudFunctions}`);
    console.log(`[wechat-cloud-sync] 目标: ${targetCloudFunctions}`);
    if (!fs.existsSync(wechatBuildRoot)) {
        throw new Error(`[wechat-cloud-sync] 找不到微信构建目录: ${wechatBuildRoot}\n` +
            '请确认 Cocos 构建任务名称固定为 wechatgame。');
    }
    // 清理上一次构建残留的云函数
    if (fs.existsSync(targetCloudFunctions)) {
        fs.rmSync(targetCloudFunctions, {
            recursive: true,
            force: true,
        });
    }
    copyDirectory(sourceCloudFunctions, targetCloudFunctions);
    console.log('[wechat-cloud-sync] 云函数同步完成。');
    // 再检查 tdLogin，防止路径配置错误
    const tdLoginPath = path.join(targetCloudFunctions, 'tdLogin');
    if (!fs.existsSync(tdLoginPath)) {
        throw new Error(`[wechat-cloud-sync] 同步结束但没有找到 tdLogin: ${tdLoginPath}`);
    }
    console.log('[wechat-cloud-sync] tdLogin 已写入微信小游戏构建目录。');
}
