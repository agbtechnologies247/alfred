@echo off
echo ==========================================================
echo Starting A.L.F.R.E.D. Operational Intelligence Platform
echo ==========================================================
echo.

echo [1/3] Starting Backend API Gateway (Rust)...
start "A.L.F.R.E.D. Backend" cmd /k "cd backend && cargo run --bin api-gateway"

echo [2/3] Starting Synthetic Monitor Agent (Node.js)...
start "A.L.F.R.E.D. Monitor Agent" cmd /k "cd monitor-agent && npm install && npm start"

echo [3/3] Starting Frontend UI (React)...
start "A.L.F.R.E.D. Frontend" cmd /k "cd frontend && pnpm dev"

echo.
echo All services are starting up in separate windows!
echo.
echo - Frontend UI will be available at: http://localhost:5173
echo - Backend API is listening at: http://127.0.0.1:3000/api
echo.
echo IMPORTANT: Ensure you have Rust (cargo), Node.js (npm), and pnpm installed!
echo.
pause
