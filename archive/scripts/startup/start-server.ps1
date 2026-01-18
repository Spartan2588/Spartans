# Start Server Script
Write-Host "Starting Urban Risk Intelligence Platform..." -ForegroundColor Cyan

$ErrorActionPreference = "Continue"

# Change to the script directory
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptDir

Write-Host "Current directory: $PWD" -ForegroundColor Yellow

# Check if server.js exists
if (-not (Test-Path "server.js")) {
    Write-Host "ERROR: server.js not found in $PWD" -ForegroundColor Red
    Write-Host "Files in current directory:" -ForegroundColor Yellow
    Get-ChildItem | Select-Object Name
    exit 1
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "WARNING: node_modules not found. Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Set environment
$env:NODE_ENV = "development"
$env:PORT = "5000"

Write-Host ""
Write-Host "Starting backend server on http://localhost:5000" -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Start the server
node server.js
