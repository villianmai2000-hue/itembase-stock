@echo off
chcp 65001 > nul
echo ========================================================
echo   Uploading ItemBase to GitHub...
echo ========================================================
echo.
set "PATH=%PATH%;C:\Program Files\Git\cmd;C:\Program Files\Git\bin"
cd /d "%~dp0"
git push -u origin main
echo.
pause