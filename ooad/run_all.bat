@echo off
echo ===================================================
echo   AutoCare - Vehicle Service Booking System
echo ===================================================
echo Starting FastAPI Backend on port 8000...
start "AutoCare-Backend" cmd /k "cd /d %~dp0backend && py -m uvicorn app.main:app --port 8000"

echo Starting Vite React Frontend on port 5173...
start "AutoCare-Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

timeout /t 3 >nul
echo Opening AutoCare in browser...
start "" "http://localhost:5173"

echo.
echo Both servers are running!
echo Access the site at: http://localhost:5173
echo.
pause
