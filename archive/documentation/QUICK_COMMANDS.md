# Quick Commands Reference

## ⚠️ Windows Users: PowerShell Syntax

On Windows PowerShell, use `;` instead of `&&` to chain commands.

**Example:**
- ❌ Wrong: `cd client && npm install`
- ✅ Right: `cd client; npm install`

Or run commands separately in different terminals.

---

## 🚀 Launch Commands

### Start Backend Server
```powershell
npm install
npm start
```

### Start Frontend Server (New Terminal)
```powershell
cd client
npm install
npm run dev
```

---

## 🧪 Testing Commands

### Test Backend Health
```bash
curl http://localhost:5000/api/v1/health
```

### Test AQI Endpoint - Mumbai
```bash
curl "http://localhost:5000/api/v1/aqi?lat=19.0760&lng=72.8777"
```

### Test AQI Endpoint - Delhi
```bash
curl "http://localhost:5000/api/v1/aqi?lat=28.7041&lng=77.1025"
```

### Test AQI Endpoint - Bangalore
```bash
curl "http://localhost:5000/api/v1/aqi?lat=12.9716&lng=77.5946"
```

---

## 📍 Browser URLs

### Frontend Application
```
http://localhost:5173
```

### Backend API
```
http://localhost:5000/api/v1
```

### Health Check
```
http://localhost:5000/api/v1/health
```

---

## 🔍 Debugging

### View Environment Variables
```bash
cat .env
```

### Check Backend Logs
Look in terminal where `npm start` is running

### Check Frontend Logs
1. Open browser
2. Press F12 (DevTools)
3. Go to Console tab
4. Look for: `✅ Real-time AQI data from...`

---

## 📊 API Endpoints

### Get Current State
```
GET /api/v1/current-state?city_id=1
```

### Get Risk Assessment
```
GET /api/v1/risk-assessment?city_id=1
```

### Get Real-Time AQI
```
GET /api/v1/aqi?lat={latitude}&lng={longitude}
```

### Simulate Scenario
```
POST /api/v1/scenario
Content-Type: application/json

{
  "aqi": 150,
  "hospital_load": 50,
  "crop_supply": 70,
  "temperature": 25
}
```

### Get Historical Data
```
GET /api/v1/historical?city_id=1&hours=24
```

### Get Available Cities
```
GET /api/v1/cities
```

### Health Check
```
GET /api/v1/health
```

---

## 🔧 Configuration

### View Current Configuration
```bash
cat .env
```

### Update API Key
Edit `.env` file and change:
```
OPENWEATHERMAP_API_KEY=your_new_key_here
```

Then restart backend: `npm start`

---

## 📁 Project Structure

```
project-root/
├── server.js              # Backend server
├── package.json           # Backend dependencies
├── .env                   # Configuration (API keys)
├── client/
│  ├── src/
│  │  ├── utils/
│  │  │  └── AqiService.js # AQI service
│  │  └── components/
│  │     └── LeafletMapView.js # Map component
│  ├── package.json        # Frontend dependencies
│  └── vite.config.js      # Vite configuration
└── Documentation files...
```

---

## 🎯 Common Workflows

### First Time Setup
```bash
# 1. Install backend dependencies
npm install

# 2. Start backend
npm start

# 3. In new terminal, install frontend dependencies
cd client
npm install

# 4. Start frontend
npm run dev

# 5. Open browser to http://localhost:5173
# 6. Click on map to see real-time AQI data
```

### Testing Integration
```bash
# 1. Check backend health
curl http://localhost:5000/api/v1/health

# 2. Test AQI endpoint
curl "http://localhost:5000/api/v1/aqi?lat=19.0760&lng=72.8777"

# 3. Open browser and check console
# Press F12 → Console tab → Click on map
```

### Debugging Issues
```bash
# 1. Check environment variables
cat .env

# 2. Check backend logs
# Look in terminal where npm start is running

# 3. Check frontend logs
# Press F12 → Console tab in browser

# 4. Test API directly
curl "http://localhost:5000/api/v1/aqi?lat=19.0760&lng=72.8777"
```

---

## 🔑 API Key Management

### Current API Key
```
OpenWeatherMap: 3102aff4b425585604ec803633c37fcd
```

### Location
```
File: .env
Variable: OPENWEATHERMAP_API_KEY
```

### Limits
```
Free Tier: 60 calls/minute
Monthly: 1,000 calls/day
```

---

## 📊 City Coordinates

### Mumbai
```
Latitude: 19.0760
Longitude: 72.8777
```

### Delhi
```
Latitude: 28.7041
Longitude: 77.1025
```

### Bangalore
```
Latitude: 12.9716
Longitude: 77.5946
```

---

## 🚨 Emergency Commands

### Kill Backend Process
```bash
# On Windows
taskkill /F /IM node.exe

# On Mac/Linux
pkill -f "node server.js"
```

### Clear Node Modules (if issues)
```bash
# Backend
rm -rf node_modules
npm install

# Frontend
cd client
rm -rf node_modules
npm install
```

### Reset Everything
```bash
# 1. Kill all node processes
# 2. Delete node_modules
# 3. Run: npm install
# 4. Run: npm start
```

---

## 📝 Useful Links

### API Documentation
- OpenWeatherMap: https://openweathermap.org/api/air-pollution
- IQAir: https://www.iqair.com/air-quality-api
- WAQI: https://waqi.info/api

### AQI Information
- AQI Scale: https://www.airnow.gov/aqi/aqi-basics/
- Health Effects: https://www.airnow.gov/aqi/aqi-basics/health-effects/

### Documentation
- API_DOCS_INDEX.md - Documentation index
- QUICK_START_REAL_TIME_AQI.md - Quick start guide
- API_SETUP_GUIDE.md - Complete setup guide

---

**Last Updated:** January 18, 2026
**Status:** ✅ Ready to Use
