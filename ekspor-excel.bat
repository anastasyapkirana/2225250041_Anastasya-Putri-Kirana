@echo off
rem Klik dua kali: ekspor data penelitian (data\app.db) ke Excel, lalu buka.
cd /d "%~dp0"

if exist ".venv\Scripts\python.exe" (
    set "PY=.venv\Scripts\python.exe"
) else (
    set "PY=py"
)

"%PY%" scripts\export_excel.py
if errorlevel 1 (
    pause
    exit /b 1
)

start "" "data\hasil-penelitian.xlsx"
