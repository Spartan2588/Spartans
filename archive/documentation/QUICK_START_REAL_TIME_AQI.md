# Quick Start: Real-Time AQI Integration

## 🚀 Get Started in 5 Minutes

### Step 1: Choose an API Provider (Pick One)

**Option A: OpenWeatherMap** ⭐ RECOMMENDED
- Go to: https://openweathermap.org/api/air-pollution
- Click "Sign Up"
- Create free account
- Copy your API key

**Option B: IQAir**
- Go to: https://www.iqair.com/air-quality-api
- Click "Get Free API"
- Create free account
- Copy your API key

**Option C: WAQI**
- Go to: https://waqi.info/
- Click "Sign Up"
- Create free account
- Copy your API key

### Step 2: Create `.env` File

Create a file named `.env` in the **root directory** (same level as `server.js`):

```bash
# For OpenWeatherMap
OPENWEATHERMAP_API_KEY=your_api_key_here

# OR for IQAir
IQAIR_API_KEY=your_api_key_here

# OR for WAQI
WAQI_API_KEY=your_api_key_here

PORT=5000
```

### Step 3: Start Backend Server

```bash
# Install dependencies (if not done)
npm install

# Start server
npm start
```

You should see:
```
╔════════════════════════════════════════════════════════════╗
║  Urban Risk Intelligence Platform - Backend Server         ║
║  Running on http://localhost:5000                          ║
╚════════════════════════════════════════════════════════════╝
```

### Step 4: Start Frontend (New Terminal)

```bash
cd client
npm install  # if not done
npm run dev
```

### Step 5: Test It!

1. Open browser to `http://localhost:5173`
2. Click on the map anywhere in Mumbai
3. You should see real-time AQI data!

---

## ✅ Verify It's Working

### Test 1: Check Backend
```bash
curl http://localhost:5000/api/v1/health
```

Expected: `{"status":"ok","timestamp":"..."}`

### Test 2: Get Real AQI Data
```bash
curl "http://localhost:5000/api/v1/aqi?lat=19.0760&lng=72.8777"
```

Expected: Real AQI value with source (OpenWeatherMap, IQAir, or WAQI)

### Test 3: Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Click on map
4. You should see: `✅ Real-time AQI data from [SOURCE]: [VALUE]`

---

## 🔧 Troubleshooting

### Problem: "Failed to fetch AQI data"
- ✅ Check backend is running: `curl http://localhost:5000/api/v1/health`
- ✅ Check `.env` file exists in root directory
- ✅ Check API key is correct in `.env`

### Problem: Getting simulated data
- ✅ API key might be wrong
- ✅ API rate limit might be exceeded
- ✅ External API might be down
- ✅ Wait 5 minutes and try again

### Problem: CORS errors
- ✅ Make sure backend is running on `http://localhost:5000`
- ✅ Make sure frontend is on `http://localhost:5173`
- ✅ Restart both servers

---

## 📊 What You'll See

When you click on the map:

```json
{
  "aqi": 185,
  "source": "OpenWeatherMap",
  "category": "Unhealthy",
  "color": "#ef4444",
  "pollutants": {
    "pm25": 148,
    "pm10": 222,
    "o3": 45,
    "no2": 32,
    "so2": 12,
    "co": 8
  },
  "timestamp": "2026-01-18T10:30:00.000Z"
}
```

---

## 🎯 Next Steps

1. ✅ Set up API key (5 min)
2. ✅ Start backend (1 min)
3. ✅ Start frontend (1 min)
4. ✅ Test on map (1 min)
5. ✅ Deploy to production (see API_SETUP_GUIDE.md)

---

## 📚 Full Documentation

See `API_SETUP_GUIDE.md` for:
- Detailed API comparison
- Production deployment
- Caching strategies
- Security best practices
- Performance optimization

---

**Status:** ✅ Ready to use
**Last Updated:** January 18, 2026
