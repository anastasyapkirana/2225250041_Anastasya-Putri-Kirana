@echo off
rem Klik dua kali: jalankan server Metika supaya bisa dibuka dari HP di Wi-Fi yang sama.
rem Biarkan jendela ini terbuka selama HP memakai aplikasi. Tutup jendela = server mati.
cd /d "%~dp0"

if exist ".venv\Scripts\python.exe" (
    set "PY=.venv\Scripts\python.exe"
) else (
    set "PY=py"
)

echo ==================================================
echo   METIKA - buka dari HP (Wi-Fi yang sama)
echo ==================================================
echo.
echo   Ketik alamat ini di Chrome HP:
echo.
for /f "usebackq delims=" %%i in (`powershell -NoProfile -Command "Get-NetIPAddress -AddressFamily IPv4 | Where-Object { $_.IPAddress -notlike '127.*' -and $_.IPAddress -notlike '169.254*' -and $_.PrefixOrigin -ne 'WellKnown' } | ForEach-Object { $_.IPAddress }"`) do echo      http://%%i:8000
echo.
echo   Di laptop: http://localhost:8000
echo.
echo   Jika Windows bertanya soal Firewall, pilih "Allow" / "Izinkan".
echo   JANGAN tutup jendela ini selama aplikasi dipakai.
echo ==================================================
echo.

"%PY%" -m uvicorn backend.app.main:app --host 0.0.0.0 --port 8000
pause
