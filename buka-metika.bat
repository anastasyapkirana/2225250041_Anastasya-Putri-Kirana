@echo off
rem Klik dua kali: build ulang dist\metika.html dari kode terbaru, lalu buka di browser.
cd /d "%~dp0"

if exist ".venv\Scripts\python.exe" (
    set "PY=.venv\Scripts\python.exe"
) else (
    set "PY=py"
)

echo Membuat ulang Metika...
"%PY%" scripts\build_single_html.py
if errorlevel 1 (
    echo.
    echo Gagal membuat file. Lihat pesan di atas.
    pause
    exit /b 1
)

start "" "dist\metika.html"
