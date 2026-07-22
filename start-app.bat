@echo off
set ELECTRON_PATH=%~dp0node_modules\electron\dist\electron.exe
"%ELECTRON_PATH%" . --no-sandbox 2>&1