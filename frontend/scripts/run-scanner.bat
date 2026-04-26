@echo off
echo [WinWin Scanner] Starting...
:loop
curl -s "http://localhost:3000/api/scan?secret=winwin-scan-secret-2024" > nul
echo [%time%] Scan complete, waiting 2 minutes...
timeout /t 120 /nobreak > nul
goto loop
