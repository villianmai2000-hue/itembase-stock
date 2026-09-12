@echo off
chcp 65001 > nul
title ItemBase - ระบบคลังและจัดการงานทีมก่อสร้าง
echo ===================================================================
echo   🌟 ITEMBASE - ระบบคลังและจัดการงานทีมก่อสร้าง
echo   ผู้ควบคุมระบบ: คุณยุทธการ คำกลอน
echo ===================================================================
echo.
echo กำลังเริ่มต้นระบบเซิร์ฟเวอร์ และสร้างลิงก์เว็บไซต์สำหรับมือถือ/แท็บเล็ต...
echo.

set "PATH=%LOCALAPPDATA%\Microsoft\WinGet\Packages\OpenJS.NodeJS.LTS_Microsoft.Winget.Source_8wekyb3d8bbwe\node-v24.19.0-win-x64;%PATH%"

timeout /t 2 > nul
start http://localhost:3000
node server/index.js
pause
