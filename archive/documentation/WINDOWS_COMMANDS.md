# Windows PowerShell Commands

## ⚠️ Important: PowerShell Syntax

On Windows PowerShell, use `;` instead of `&&` to chain commands.

---

## 🚀 Launch Commands

### Start Backend Server (Terminal 1)
```powershell
npm install
npm start
```

### Start Frontend Server (Terminal 2)
```powershell
cd client
npm install
npm run dev
```

---

## 🧪 Testing Commands

### Test Backend Health
```powershell
curl http://localhost:5000/api/v1/health
```

### Test AQI Endpoint - Mumbai
```powershell
curl "http://localhost:5000/api/v1/aqi?lat=19.0760&lng=72.8777"
```

### Test AQI Endpoint - Delhi
```powershell
curl "http://localhost:5000/api/v1/aqi?lat=28.7041&lng=77.1025"
```

### Test AQI Endpoint - Bangalore
```powershell
curl "http://localhost:5000/api/v1/aqi?lat=12.9716&lng=77.5946"
```

---

## 📁 Navigation Commands

### Go to Client Directory
```powershell
cd client
```

### Go Back to Root
```powershell
cd ..
```

### List Files
```powershell
Get-ChildItem
```

### View File Content
```powershell
Get-Content .env
```

---

## 🔧 Configuration Commands

### View Environment Variables
```powershell
Get-Content .env
```

### Check Node Version
```powershell
node --version
npm --version
```

### Check if Port is Available
```powershell
netstat -ano | findstr :5000
netstat -ano | findstr :5173
```

---

## 🎯 Complete Setup (Step by Step)

### Step 1: Install Backend Dependencies
```powershell
npm install
```

### Step 2: Start Backend
```powershell
npm start
```

**Expected Output:**
```
Running on http://localhost:5000
```

### Step 3: Open New Terminal and Go to Client
```powershell
cd client
```

### Step 4: Install Frontend Dependencies
```powershell
npm install
```

### Step 5: Start Frontend
```powershell
npm run dev
```

**Expected Output:**
```
Local: http://localhost:5173/
```

### Step 6: Open Browser
```powershell
# Open browser to:
http://localhost:5173
```

---

## 🐛 Troubleshooting Commands

### Kill Process on Port 5000
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force
```

### Kill Process on Port 5173
```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort 5173).OwningProcess | Stop-Process -Force
```

### Clear npm Cache
```powershell
npm cache clean --force
```

### Reinstall Dependencies
```powershell
Remove-Item -Recurse -Force node_modules
npm install
```

### Reinstall Frontend Dependencies
```powershell
cd client
Remove-Item -Recurse -Force node_modules
npm install
cd ..
```

---

## 📊 Useful PowerShell Commands

### Check Current Directory
```powershell
Get-Location
```

### List All Files
```powershell
Get-ChildItem
```

### List All .md Files
```powershell
Get-ChildItem -Filter "*.md"
```

### Search for Text in Files
```powershell
Select-String -Path *.js -Pattern "OPENWEATHERMAP_API_KEY"
```

### View File with Line Numbers
```powershell
Get-Content .env | Select-Object -Property @{Name="Line";Expression={$_}}, @{Name="LineNumber";Expression={[array]::IndexOf($(Get-Content .env),$_)+1}}
```

---

## 🔑 Quick Reference

### Backend
- **Start:** `npm start`
- **Port:** 5000
- **Health:** `curl http://localhost:5000/api/v1/health`

### Frontend
- **Start:** `npm run dev` (in client/)
- **Port:** 5173
- **URL:** `http://localhost:5173`

### Configuration
- **File:** `.env`
- **View:** `Get-Content .env`
- **API Key:** `OPENWEATHERMAP_API_KEY=3102aff4b425585604ec803633c37fcd`

---

## 💡 Tips for Windows Users

### Use Multiple Terminals
1. Open Terminal 1 for backend
2. Open Terminal 2 for frontend
3. Keep both running

### Use Windows Terminal
- Better than Command Prompt
- Supports multiple tabs
- Better PowerShell support

### Copy/Paste in PowerShell
- Right-click to paste
- Or use Ctrl+Shift+V

### Open Browser Quickly
```powershell
Start-Process "http://localhost:5173"
```

---

## 🚀 Quick Start (Copy & Paste)

### Terminal 1: Backend
```powershell
npm install
npm start
```

### Terminal 2: Frontend
```powershell
cd client
npm install
npm run dev
```

### Browser
```
http://localhost:5173
```

---

## ✅ Verification

### Check Backend Running
```powershell
curl http://localhost:5000/api/v1/health
```

### Check Frontend Running
```powershell
# Open browser to http://localhost:5173
```

### Check API Key
```powershell
Get-Content .env | Select-String "OPENWEATHERMAP_API_KEY"
```

---

## 📞 Common Issues

### "cd is not recognized"
- Use: `Set-Location client` instead of `cd client`
- Or just use: `cd client` (should work in most cases)

### "npm is not recognized"
- Node.js not installed
- Restart PowerShell after installing Node.js

### "Port already in use"
- Kill process: `Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force`

### "Permission denied"
- Run PowerShell as Administrator
- Or use: `npm install --no-optional`

---

**Last Updated:** January 18, 2026
**Platform:** Windows PowerShell
**Status:** ✅ Ready to Use
