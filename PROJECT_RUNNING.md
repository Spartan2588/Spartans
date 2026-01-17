# 🚀 Project Running Status

## ✅ Servers Started

The Urban Risk Intelligence Platform is now running!

### Backend Server
- **Status**: ✅ Running
- **Port**: 5000
- **URL**: http://localhost:5000
- **API Key**: Configured (36a4df8166a7e11d2d9375a965d05a59)

### Frontend Server
- **Status**: ✅ Running
- **Port**: 3000
- **URL**: http://localhost:3000

## 🌐 Access Points

### Main Application
- **Home**: http://localhost:3000
- **Cascade Analysis**: http://localhost:3000/cascade
- **Platform**: http://localhost:3000/platform
- **Scenarios**: http://localhost:3000/scenarios
- **Impact**: http://localhost:3000/impact

### API Endpoints
- **Health Check**: http://localhost:5000/api/v1/health
- **Current State**: http://localhost:5000/api/v1/current-state?city_id=1
- **Risk Assessment**: http://localhost:5000/api/v1/risk-assessment?city_id=1
- **Cascade Analysis**: http://localhost:5000/api/v1/cascading-failure?city_id=1&trigger=power&severity=0.8

## 🎯 Quick Start

1. **Open your browser**
2. **Navigate to**: http://localhost:3000/cascade
3. **Select**:
   - City (Mumbai, Delhi, or Bangalore)
   - Trigger event (Power, Water, Traffic, etc.)
   - Severity (0.1 to 1.0)
4. **Click**: "Simulate Cascade"
5. **View**: Real-time cascade failure analysis

## 📊 Features Available

### ✅ Real-Time Data
- Live weather data (if API key active)
- Real-time AQI
- Current temperature
- Hospital load estimates
- Traffic patterns

### ✅ Cascade Analysis
- Infrastructure failure propagation
- Real-time severity adjustments
- Impact assessment
- Economic cost analysis
- Actionable recommendations

### ✅ Multi-City Support
- Mumbai (city_id=1)
- Delhi (city_id=2)
- Bangalore (city_id=3)

### ✅ All Triggers
- Power Grid
- Water System
- Traffic System
- Communications
- Emergency Services
- Healthcare
- Transport
- Financial Systems

## 🧪 Testing

### Test Real-Time Data
```bash
npm run test:realtime
```

### Test Cascade Analysis
```bash
npm run test:cascade
```

### Test All
```bash
npm run test:all
```

## 📝 Server Logs

Check the background PowerShell windows for:
- `[RealTimeData]` - Data fetching operations
- `[CASCADE]` - Cascade calculations
- `[DataStore]` - Data retrieval
- `[API]` - Endpoint calls
- `[Env]` - Environment variable loading

## ⚠️ Troubleshooting

### Backend Not Responding
- Wait 5-10 seconds for startup
- Check backend console window for errors
- Verify port 5000 is not in use

### Frontend Not Loading
- Wait 15-20 seconds for initial Vite build
- Check frontend console window for errors
- Verify port 3000 is not in use

### API Key Issues
- System works with fallback data if API key fails
- Check `.env.local` file exists
- Verify key in server logs

## 🎉 Ready to Use!

The system is fully operational and ready for cascade failure analysis with real-time data integration!

---

**Status**: ✅ **RUNNING**
**Last Updated**: $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
