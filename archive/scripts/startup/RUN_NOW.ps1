# Quick Start Script for Urban Risk Platform
Write-Host ""
Write-Host "╔══════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   Urban Risk Intelligence Platform - Starting...        ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Get script directory
$scriptDir = $PSScriptRoot
if (-not $scriptDir) { $scriptDir = Get-Location }

Set-Location $scriptDir

Write-Host "Current Directory: $scriptDir" -ForegroundColor Yellow
Write-Host ""

# Check if we're in the right directory
if (-not (Test-Path "server.js")) {
    Write-Host "ERROR: server.js not found!" -ForegroundColor Red
    Write-Host "Please navigate to the project root directory." -ForegroundColor Yellow
    Write-Host ""
    pause
    exit 1
}

# Check dependencies
if (-not (Test-Path "node_modules\express")) {
    Write-Host "⚠ Installing backend dependencies..." -ForegroundColor Yellow
    npm install
}

if (-not (Test-Path "client\node_modules\vite")) {
    Write-Host "⚠ Installing frontend dependencies..." -ForegroundColor Yellow
    Set-Location client
    npm install
    Set-Location ..
}

Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Green
Write-Host ""
Write-Host "Backend will run on:  http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend will run on: http://localhost:5173 (check terminal output)" -ForegroundColor Cyan
Write-Host ""
Write-Host "Press Ctrl+C to stop all servers" -ForegroundColor Gray
Write-Host ""
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor DarkGray
Write-Host ""

# Start both servers
npm run dev
