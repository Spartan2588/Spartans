@echo off
echo ============================================================
echo Starting Urban Risk Intelligence Platform
echo ============================================================
echo.

cd /d "%~dp0"

echo Starting Backend Server on port 5000...
start "Backend Server" cmd /k "node server.js"

timeout /t 3 /nobreak >nul

echo Starting Frontend Server on port 5173...
cd client
start "Frontend Server" cmd /k "npm run dev"

cd ..

echo.
echo ============================================================
echo Servers are starting!
echo ============================================================
echo.
echo Backend:  http://localhost:5000
echo Frontend: http://localhost:5173 (check terminal for actual port)
echo.
echo Press any key to exit this window (servers will keep running)...
pause >nul
