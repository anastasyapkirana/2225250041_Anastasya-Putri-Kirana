@echo off
rem Klik dua kali: gabungkan file kiriman siswa (data\kiriman\*.json) ke database,
rem lalu buat dan buka data\hasil-penelitian.xlsx.
cd /d "%~dp0"

if exist ".venv\Scripts\python.exe" (
    set "PY=.venv\Scripts\python.exe"
) else (
    set "PY=py"
)

"%PY%" scripts\import_data.py
if errorlevel 1 (
    pause
    exit /b 1
)

"%PY%" scripts\export_excel.py
if errorlevel 1 (
    pause
    exit /b 1
)

start "" "data\hasil-penelitian.xlsx"
