@echo off
setlocal

set "SCRIPT_DIR=%~dp0"
set "PROJECT_ROOT=%SCRIPT_DIR%..\.."

cd /d "%PROJECT_ROOT%"

powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%SCRIPT_DIR%argocd.ps1"

echo.
echo Press any key to close...
pause > nul
