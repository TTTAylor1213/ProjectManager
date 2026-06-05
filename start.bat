@echo off
echo ========================================
echo  设备研发项目管理系统 - 一键启动
echo ========================================
cd /d %~dp0
echo.
echo [1/2] 检查依赖...
call npm install --silent
echo [2/2] 启动服务...
call npm run dev
pause
