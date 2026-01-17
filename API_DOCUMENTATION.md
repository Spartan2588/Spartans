# Urban Risk Intelligence Platform - API Documentation

## Overview

The backend API provides real-time urban risk assessment, scenario simulation, and historical data analysis for three major Indian cities: Mumbai, Delhi, and Bangalore.

**Base URL:** `http://localhost:5000/api/v1`

---

## Data Model

### City Object
```json
{
  "id": 1,
  "name": "Mumbai",
  "lat": 19.0760,
  "lng": 72.8777
}
```

### Risk Level
- `low`: Risk score < 0.33
- `medium`: Risk score 0.33 - 0.66
- `high`: Risk score > 0.66

### Risk Score Calculation
Risk scores are normalized to 0-1 scale using weighted factors:
- **AQI (Air Quality Index):** 35% weight
- **Temperature:** 25% weight
- **Hospital Load:** 25% weight
- **Crop Supply:** 15% weight

---

## Endpoints

### 1. Get Current State
Returns current metrics for a specific city.

**Request:**
```
GET /api/v1/current-state?city_id={city_id}
```

**Parameters:**
- `city_id` (required): 1 (Mumbai), 2 (Delhi), or 3 (Bangalore)

**Response:**
```json
{
  "city": "Mumbai",
  "timestamp": "2026-01-17T10:30:00.000Z",
  "aqi": 185,
  "hospital_load": 62,
  "temperature": 28.5,
  "crop_supply": 65,
  "food_price_index": 112.3,
  "traffic_density": "high"
}
```

**Status Codes:**
- `200`: Success
- `400`: Invalid city_id

---

### 2. Get Risk Assessment
Returns calculated risk levels for environmental, health, and food security domains.

**Request:**
```
GET /api/v1/risk-assessment?city_id={city_id}
```

**Parameters:**
- `city_id` (required): 1 (Mumbai), 2 (Delhi), or 3 (Bangalore)

**Response:**
```json
{
  "environmental_risk": {
    "level": "high",
    "probability": 72,
    "score": 0.72
  },
  "health_risk": {
    "level": "medium",
    "probability": 58,
    "score": 0.58
  },
  "food_security_risk": {
    "level": "low",
    "probability": 28,
    "score": 0.28
  }
}
```

**Risk Calculation Details:**
- **Environmental Risk:** AQI (60%) + Temperature (40%)
- **Health Risk:** Hospital Load (70%) + Temperature (30%)
- **Food Security Risk:** Crop Supply (60%) + Food Price Index (40%)

---

### 3. Simulate Scenario
Simulates the impact of interventions on risk levels and calculates economic outcomes.

**Request:**
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

**Parameters:**
- `aqi` (required): 0-500
- `hospital_load` (required): 0-100 (percentage)
- `crop_supply` (required): 0-100 (percentage)
- `temperature` (required): 20-50 (°C)

**Response:**
```json
{
  "baseline": {
    "environmental_risk": {
      "level": "medium",
      "probability": 45,
      "score": 0.45
    },
    "health_risk": {
      "level": "low",
      "probability": 38,
      "score": 0.38
    },
    "food_security_risk": {
      "level": "low",
      "probability": 25,
      "score": 0.25
    }
  },
  "intervention": {
    "environmental_risk": {
      "level": "low",
      "probability": 34,
      "score": 0.34
    },
    "health_risk": {
      "level": "low",
      "probability": 29,
      "score": 0.29
    },
    "food_security_risk": {
      "level": "low",
      "probability": 28,
      "score": 0.28
    }
  },
  "economic_impact": {
    "intervention_cost": 250000,
    "total_savings": 1500000,
    "roi": 6.0,
    "payback_period_months": 2
  },
  "changes": {
    "environmental": {
      "level_change": true,
      "probability_change": -11
    },
    "health": {
      "level_change": false,
      "probability_change": -9
    },
    "food": {
      "level_change": false,
      "probability_change": 3
    }
  }
}
```

**Intervention Model:**
- Reduces AQI by 25%
- Reduces temperature by 5%
- Reduces hospital load by 25%
- Increases crop supply by 10%

**Economic Calculation:**
- Intervention cost scales with baseline risk severity
- Savings calculated from risk reduction (1:20 ratio)
- ROI = Total Savings / Intervention Cost
- Payback period = (Intervention Cost / Total Savings) × 12 months

---

### 4. Get Historical Data
Returns 24-hour historical data for a city.

**Request:**
```
GET /api/v1/historical?city_id={city_id}&hours={hours}
```

**Parameters:**
- `city_id` (required): 1 (Mumbai), 2 (Delhi), or 3 (Bangalore)
- `hours` (optional): 1-24, default 24

**Response:**
```json
{
  "aqi": [
    {
      "timestamp": "2026-01-17T09:00:00.000Z",
      "value": 165
    },
    {
      "timestamp": "2026-01-17T10:00:00.000Z",
      "value": 172
    }
  ],
  "hospital_load": [...],
  "crop_supply": [...],
  "temperature": [...],
  "food_price_index": [...]
}
```

---

### 5. Get Available Cities
Returns list of all available cities.

**Request:**
```
GET /api/v1/cities
```

**Response:**
```json
[
  {
    "id": 1,
    "name": "Mumbai",
    "lat": 19.0760,
    "lng": 72.8777
  },
  {
    "id": 2,
    "name": "Delhi",
    "lat": 28.7041,
    "lng": 77.1025
  },
  {
    "id": 3,
    "name": "Bangalore",
    "lat": 12.9716,
    "lng": 77.5946
  }
]
```

---

### 6. Health Check
Verifies API is running.

**Request:**
```
GET /api/v1/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-17T10:30:00.000Z"
}
```

---

## Data Generation

### Historical Data
- Generated for 24 hours prior to current time
- Uses sinusoidal patterns with random noise for realism
- City-specific factors applied:
  - **Mumbai:** AQI multiplier 1.2x (higher pollution)
  - **Delhi:** AQI multiplier 1.1x, Temperature +3°C
  - **Bangalore:** AQI multiplier 0.9x (cleaner air)

### Current State
- Latest values from historical data
- Traffic density randomly assigned (low/medium/high)
- All values within realistic ranges

---

## Error Handling

### Error Response Format
```json
{
  "error": "Error message describing what went wrong"
}
```

### Common Errors

| Status | Error | Cause |
|--------|-------|-------|
| 400 | Invalid city_id | city_id not in [1, 2, 3] |
| 400 | Invalid parameters | Missing or invalid POST body |
| 500 | Internal server error | Unexpected server error |

---

## Usage Examples

### Example 1: Get Current State for Mumbai
```bash
curl http://localhost:5000/api/v1/current-state?city_id=1
```

### Example 2: Simulate Heatwave Scenario
```bash
curl -X POST http://localhost:5000/api/v1/scenario \
  -H "Content-Type: application/json" \
  -d '{
    "aqi": 300,
    "hospital_load": 85,
    "crop_supply": 40,
    "temperature": 42
  }'
```

### Example 3: Get 12-Hour Historical Data
```bash
curl http://localhost:5000/api/v1/historical?city_id=2&hours=12
```

---

## Performance Notes

- All endpoints respond in < 100ms
- Historical data is generated on-demand
- No database queries (in-memory data store)
- Suitable for real-time dashboards with 30-second refresh intervals

---

## Integration with Frontend

The frontend `ApiClient` class (`client/src/utils/api.js`) provides convenient methods:

```javascript
import { ApiClient } from './utils/api.js';

const api = new ApiClient();

// Get current state
const state = await api.getCurrentState(1);

// Get risk assessment
const risks = await api.getRiskAssessment(1);

// Simulate scenario
const result = await api.simulateScenario({
  aqi: 200,
  hospital_load: 60,
  crop_supply: 65,
  temperature: 28
});

// Get historical data
const history = await api.getHistoricalData(1, 24);
```

---

## Future Enhancements

- [ ] Database persistence for historical data
- [ ] Real API data integration (AQI sensors, hospital systems)
- [ ] Predictive modeling (ML-based forecasting)
- [ ] Multi-city comparison endpoints
- [ ] Custom intervention parameters
- [ ] Export data to CSV/JSON
- [ ] WebSocket support for real-time updates
