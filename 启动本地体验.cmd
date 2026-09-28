@echo off
cd /d "%~dp0"
call pnpm build
if errorlevel 1 (
  pause
  exit /b 1
)
echo Keep this window open while using the workshop on your phone.
call pnpm preview --host 0.0.0.0 --port 4173 --strictPort
pause
