@echo off
chcp 65001 >nul
setlocal
cd /d "%~dp0"
echo.
echo ================================================================
echo   TonightDefense v0.6.1 Patch Migration
echo ================================================================
echo.
powershell.exe -NoLogo -NoProfile -ExecutionPolicy Bypass -File "%~dp0apply-v0.6.1-cleanup.ps1"
set CODE=%ERRORLEVEL%
echo.
if not "%CODE%"=="0" (
  echo [FAILED] v0.6.1 patch migration failed.
  echo Please copy the last console output to ChatGPT.
) else (
  echo [DONE] v0.6.1 patch migration finished.
)
echo.
pause
exit /b %CODE%
