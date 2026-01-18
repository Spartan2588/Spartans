# Real-Time AQI API Integration Guide

## Overview

The application now supports real-time AQI (Air Quality Index) data from multiple sources. The backend acts as a proxy to protect API keys and handle fallbacks gracefully.

---

## Recommended APIs (Free Tier)

### 1. **OpenWeatherMap** ⭐ RECOMMENDED
- **Free Tier:** 60 calls/min, 1,000 calls/day
- **Coverage:** Global, including India
- **Data Quality:** Excellent
- **Sign Up:** https://openweathermap.org/api/air-pollution
- **Setup Time:** 5 minutes

**Steps:**
1. Go to https://openweathermap.org/api/air-pollution
2. Sign up for free account
3. Get your API key from dashboard
4. Add to `.env` file: `OPENWEATHERMAP_API_KEY=your_key_here`

---

### 2. **IQAir (AirVisual)**
- **Free Tier:** 10,000 calls/month (~330/day)
- **Coverage:** Global, including India
- **Data Quality:** Very Good
- **Sign Up:** https://www.iqair.com/air-quality-api
- **Setup Time:** 5 minutes

**Steps:**
1. Go to https://www.iqair.com/air-quality-api
2. Sign up for free account
3. Get your API key
4. Add to `.env` file: `IQAIR_API_KEY=your_key_here`

---

### 3. **WAQI (World Air Quality Index)**
- **Free Tier:** Unlimited (with rate limits)
- **Coverage:** Global, strong in Asia
- **Data Quality:** Good
- **Sign Up:** https://waqi.info/
- **Setup Time:** 5 minutes

**Steps:**
1. Go to https://waqi.info/
2. Sign up for free account
3. Get your API key from dashboard
4. Add to `.env` file: `WAQI_API_KEY=your_key_here`

---

## Setup Instructions

### Backend Setup

1. **Create `.env` file in root directory:**
```bash
# .env
OPENWEATHERMAP_API_KEY=your_openweathermap_key
IQAIR_API_KEY=your_iqair_key
WAQI_API_KEY=your_waqi_key
PORT=5000
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the backend server:**
```bash
npm start
# or
node server.js
```

The server will run on `http://localhost:5000`

### Frontend Setup

1. **Navigate to client directory:**
```bash
cd client
```

2. **Install dependencies:**
```bash
npm install
```

3. **Start the development server:**
```bash
npm run dev
```

The frontend will run on `http://localhost:5173` (or similar)

---

## API Endpoints

### Get Real-Time AQI Data
```
GET /api/v1/aqi?lat={latitude}&lng={longitude}
```

**Example:**
```bash
curl "http://localhost:5000/api/v1/aqi?lat=19.0760&lng=72.8777"
```

**Response:**
```json
{
  "aqi": 185,
  "source": "OpenWeatherMap",
  "coordinates": {
    "lat": 19.0760,
    "lng": 72.8777
  },
  "timestamp": "2026-01-18T10:30:00.000Z",
  "pollutants": {
    "pm25": 148,
    "pm10": 222,
    "o3": 45,
    "no2": 32,
    "so2": 12,
    "co": 8
  }
}
```

---

## API Fallback Strategy

The backend tries APIs in this order:

1. **OpenWeatherMap** (if `OPENWEATHERMAP_API_KEY` is set)
2. **IQAir** (always available with demo key)
3. **WAQI** (if `WAQI_API_KEY` is set)
4. **Simulated Data** (if all APIs fail)

This ensures the app always returns data, even if external APIs are down.

---

## Testing the Integration

### Test 1: Check Backend Health
```bash
curl http://localhost:5000/api/v1/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-18T10:30:00.000Z"
}
```

### Test 2: Get AQI for Mumbai
```bash
curl "http://localhost:5000/api/v1/aqi?lat=19.0760&lng=72.8777"
```

### Test 3: Get AQI for Delhi
```bash
curl "http://localhost:5000/api/v1/aqi?lat=28.7041&lng=77.1025"
```

### Test 4: Get AQI for Bangalore
```bash
curl "http://localhost:5000/api/v1/aqi?lat=12.9716&lng=77.5946"
```

---

## Troubleshooting

### Issue: "Failed to fetch AQI data"

**Solution 1:** Check if backend is running
```bash
curl http://localhost:5000/api/v1/health
```

**Solution 2:** Verify API keys in `.env` file
```bash
# Check if .env exists
cat .env
```

**Solution 3:** Check backend logs for API errors
```bash
# Look for error messages in terminal where server is running
```

### Issue: Getting simulated data instead of real data

**Possible causes:**
1. API keys not set in `.env`
2. API rate limits exceeded
3. External API is down
4. Network connectivity issue

**Solution:**
1. Verify API keys are correct
2. Wait a few minutes and try again
3. Check external API status pages
4. Check internet connection

### Issue: CORS errors in browser console

**Solution:** This should not happen as backend proxies requests. If it does:
1. Ensure backend is running on `http://localhost:5000`
2. Check that frontend is making requests to `/api/v1/aqi` (not external URLs)

---

## API Comparison

| Feature | OpenWeatherMap | IQAir | WAQI |
|---------|---|---|---|
| Free Tier | 60 calls/min | 10k/month | Unlimited* |
| Setup Time | 5 min | 5 min | 5 min |
| Data Quality | Excellent | Very Good | Good |
| Coverage | Global | Global | Global |
| Pollutants | 6+ | Limited | 6+ |
| Recommended | ✅ YES | ✅ YES | ✅ YES |

*WAQI has rate limits but no hard cap on free tier

---

## Production Deployment

### Environment Variables

For production, set these environment variables:

```bash
# Production
OPENWEATHERMAP_API_KEY=your_production_key
IQAIR_API_KEY=your_production_key
WAQI_API_KEY=your_production_key
PORT=5000
NODE_ENV=production
```

### Security Best Practices

1. **Never commit `.env` file** - Add to `.gitignore`
2. **Use environment variables** - Don't hardcode API keys
3. **Rotate API keys regularly** - Change keys every 3-6 months
4. **Monitor API usage** - Check dashboard for unusual activity
5. **Use backend proxy** - Never expose API keys in frontend code

---

## Performance Optimization

### Caching Strategy

Consider implementing caching to reduce API calls:

```javascript
// Example: Cache AQI data for 5 minutes
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

app.get('/api/v1/aqi', async (req, res) => {
  const cacheKey = `${req.query.lat},${req.query.lng}`;
  
  if (cache.has(cacheKey)) {
    const cached = cache.get(cacheKey);
    if (Date.now() - cached.timestamp < CACHE_TTL) {
      return res.json(cached.data);
    }
  }
  
  // Fetch fresh data...
  cache.set(cacheKey, { data, timestamp: Date.now() });
});
```

---

## Support & Resources

- **OpenWeatherMap Docs:** https://openweathermap.org/api/air-pollution
- **IQAir API Docs:** https://www.iqair.com/air-quality-api
- **WAQI API Docs:** https://waqi.info/api
- **AQI Scale Reference:** https://www.airnow.gov/aqi/aqi-basics/

---

## Next Steps

1. ✅ Choose your preferred API (OpenWeatherMap recommended)
2. ✅ Sign up and get API key
3. ✅ Add key to `.env` file
4. ✅ Start backend server
5. ✅ Test with curl commands above
6. ✅ Start frontend and test in browser
7. ✅ Click on map to see real-time AQI data

---

**Last Updated:** January 18, 2026
**Status:** ✅ Ready for Production
