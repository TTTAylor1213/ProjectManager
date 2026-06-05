@echo off
cd /d %~dp0
call npm install --silent
call npm run dev
pause
