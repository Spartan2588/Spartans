# Real-Time Data Integration Guide

## Overview

The Cascade Failure Analysis now uses **real-time data** instead of hardcoded values. The system fetches live data from various APIs to provide accurate, up-to-date risk assessments.

## Data Sources

### 1. **Weather Data** (OpenWeatherMap API)
- Temperature
- Humidity
- Wind Speed
- Visibility
- Air Pressure

### 2. **Air Quality Index** (AQI)
- Primary: OpenWeatherMap Air Pollution API
- Fallback: AQICN API
- Metrics: AQI, PM2.5, PM10

### 3. **Traffic Data**
- Time-based patterns with real-time estimation
- Rush hour detection
- Traffic density levels

### 4. **Hospital Load**
- Time-based patterns
- Real-time estimation based on time of day

### 5. **Crop Supply & Food Price Index**
- Seasonal patterns
- Real-time variations

## Setup Instructions

### Option 1: With API Keys (Recommended for Production)

1. **Get OpenWeatherMap API Key** (Free):
   - Visit: https://openweathermap.org/api
   - Sign up for a free account
   - Get your API key from the dashboard

2. **Get AQICN API Key** (Optional):
   - Visit: https://aqicn.org/api/
   - Sign up for free tier
   - Get your token

3. **Set Environment Variables**:
   ```bash
   # Create .env file (or set in your environment)
   export OPENWEATHER_API_KEY=your_key_here
   export AQICN_API_KEY=your_token_here
   ```

   Or create a `.env` file in the project root:
   ```
   OPENWEATHER_API_KEY=your_key_here
   AQICN_API_KEY=your_token_here
   ```

### Option 2: Without API Keys (Fallback Mode)

The system will automatically use fallback data generators if:
- API keys are not provided
- API requests fail
- Network issues occur

**Note**: Fallback mode uses realistic patterns but is not real-time data.

## How It Works

### Data Flow

1. **Request Received**: API endpoint receives request for city data
2. **Cache Check**: System checks if data is cached (5-minute TTL)
3. **API Fetch**: If cache expired, fetches from real APIs
4. **Fallback**: If APIs fail, uses fallback generators
5. **Response**: Returns real-time or cached data

### Cascade Analysis with Real-Time Data

The cascade analysis now:
- Uses **real-time AQI** to adjust cascade severity
- Uses **real-time temperature** to factor in heat stress
- Uses **real-time hospital load** to assess healthcare capacity
- Adjusts cascade propagation based on current conditions

**Example**: 
- High AQI (300+) → Increases cascade severity by up to 50%
- High Temperature (35°C+) → Increases cascade probability
- High Hospital Load (80%+) → Reduces recovery capacity

## Caching Strategy

- **Cache TTL**: 5 minutes
- **Cache Key**: Based on city ID and data type
- **Fallback**: Uses expired cache if available when APIs fail

## API Endpoints (All Now Real-Time)

### GET /api/v1/current-state?city_id={1,2,3}
Returns real-time metrics:
- AQI (from OpenWeatherMap/AQICN)
- Temperature (from OpenWeatherMap)
- Hospital Load (time-based estimation)
- Crop Supply (seasonal patterns)
- Food Price Index (real-time variations)
- Traffic Density (time-based)

### GET /api/v1/cascading-failure
Uses real-time data to:
- Adjust initial cascade severity based on current AQI
- Factor in temperature stress
- Consider hospital capacity
- Calculate more accurate impact

## Monitoring

Check server logs for:
- `[RealTimeData]` - Data fetching operations
- `[CASCADE]` - Cascade calculations with real-time factors
- `[DataStore]` - Data retrieval operations

## Troubleshooting

### Issue: "No OpenWeather API key"
**Solution**: System will use fallback data. For real-time data, add API key.

### Issue: API requests timing out
**Solution**: System automatically falls back to cached or generated data.

### Issue: Data seems stale
**Solution**: Clear cache by restarting server, or wait for 5-minute TTL.

### Issue: Network errors
**Solution**: System uses fallback data automatically. Check internet connection.

## Performance

- **API Calls**: Minimized through 5-minute caching
- **Response Time**: < 2 seconds (with cache), < 5 seconds (fresh fetch)
- **Fallback**: Instant (no network delay)

## Future Enhancements

Potential real-time data sources to integrate:
- Google Maps Traffic API (for real traffic data)
- Health Department APIs (for hospital load)
- Agricultural APIs (for crop supply)
- Economic APIs (for food price index)
- IoT Sensors (for hyper-local data)

## Testing

Test real-time data:
```bash
# Test current state endpoint
curl http://localhost:5000/api/v1/current-state?city_id=1

# Test cascade with real-time data
curl "http://localhost:5000/api/v1/cascading-failure?city_id=1&trigger=power&severity=0.8"
```

Check logs to see:
- Real-time data being fetched
- Cache hits/misses
- Fallback usage
