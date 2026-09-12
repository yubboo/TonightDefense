@echo off
chcp 65001 >nul
title TonightDefense - 清理 Cocos 缓存

echo.
echo ============================================
echo  TonightDefense V2.3 - 清理 Cocos 生成缓存
echo ============================================
echo.
echo 请确认 Cocos Creator 和 Cocos Dashboard 已经完全关闭。
echo.
echo 只会删除当前项目根目录中的：
echo   temp
echo   library
echo.
echo 不会删除 assets、scripts、resources、settings、profiles。
echo.
pause

cd /d "%~dp0"

if exist "temp" (
    echo 删除 temp...
    rmdir /s /q "temp"
)

if exist "library" (
    echo 删除 library...
    rmdir /s /q "library"
)

echo.
echo 清理完成。
echo 现在重新打开 Cocos Dashboard / Creator 3.8.8。
echo 第一次打开会重新导入资源，时间会比平时稍长。
echo.
pause
