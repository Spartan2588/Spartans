# Urban Risk Intelligence Platform - Setup & Testing Guide

## Quick Start

### Prerequisites
- Node.js 16+ and npm
- Modern web browser (Chrome, Firefox, Safari, Edge)

### Installation

1. **Install dependencies:**
```bash
npm install
cd client && npm install && cd ..
```

2. **Start development servers:**
```bash
npm run dev
```

This will start:
- Backend API: `http://localhost:5000`
- Frontend: `http://localhost:3000`

3. **Open in browser:**
Navigate to `http://localhost:3000`

---

## Architecture Overview

### Backend (`server.js`)
- **Express.js** server on port 5000
- **DataStore class:** Generates realistic historical data for 3 cities
- **RiskAnalytics class:** Calculates risk scores using weighted algorithms
- **6 API endpoints** for data retrieval and scenario simulation

### Frontend (`client/`)
- **Vite** build tool for fast development
- **Vanilla JavaScript** with ES6 modules
- **Three.js** for 3D city visualization
- **GSAP** for smooth animations
- **Plotly.js** for data charts

### Key Components
- **DataDashboard:** Main analytics interface with city selector, risk cards, metrics, scenario simulator
- **CityEnvironment:** Persistent 3D city that reacts to data changes
- **Router:** Multi-page navigation (Home, Platform, Scenarios, Impact, About)
- **ApiClient:** Centralized API communication

---

## Testing the Platform

### Test 1: Verify Backend API

**Check health endpoint:**
```bash
curl http://localhost:5000/api/v1/health
```

Expected response:
```json
{"status": "ok", "timestamp": "2026-01-17T..."}
```

**Get current state for Mumbai:**
```bash
curl http://localhost:5000/api/v1/current-state?city_id=1
```

Expected response includes: aqi, hospital_load, temperature, crop_supply, food_price_index, traffic_density

**Get risk assessment:**
```bash
curl http://localhost:5000/api/v1/risk-assessment?city_id=1
```

Expected response includes: environmental_risk, health_risk, food_security_risk (each with level, probability, score)

**Simulate scenario:**
```bash
curl -X POST http://localhost:5000/api/v1/scenario \
  -H "Content-Type: application/json" \
  -d '{
    "aqi": 250,
    "hospital_load": 70,
    "crop_supply": 50,
    "temperature": 35
  }'
```

Expected response includes: baseline, intervention, economic_impact, changes

---

### Test 2: Frontend Data Loading

1. Navigate to `http://localhost:3000`
2. Click on "Platform" in navigation
3. Verify:
   - Dashboard loads without errors
   - City selector dropdown shows Mumbai, Delhi, Bangalore
   - Risk cards display (Environmental, Health, Food Security)
   - Current metrics show (AQI, Hospital Load, Temperature, etc.)
   - Refresh button works (rotates and reloads data)

---

### Test 3: City Selector

1. On Platform page, change city selector
2. Verify:
   - Data updates for new city
   - Risk levels change appropriately
   - Metrics reflect city-specific values
   - 3D city environment updates

---

### Test 4: Scenario Simulation

1. On Platform page, scroll to "Scenario Simulation" section
2. Adjust sliders:
   - AQI: 300 (high pollution)
   - Hospital Load: 80% (high)
   - Crop Supply: 40% (low)
   - Temperature: 38°C (hot)
3. Click "Simulate Scenario"
4. Verify:
   - Comparison results show baseline vs intervention
   - Risk levels decrease after intervention
   - Economic impact displays (cost, savings, ROI)
   - 3D city environment reacts to changes

---

### Test 5: Data-Driven City Reactions

The 3D city environment should react to data changes:

**AQI Impact:**
- Adjust AQI slider to 500 (maximum)
- Observe: Fog density increases, visibility decreases

**Temperature Impact:**
- Adjust temperature to 45°C
- Observe: Warm orange light intensifies

**Hospital Load Impact:**
- Adjust hospital load to 100%
- Observe: Health zone (purple buildings) pulses more intensely

**Crop Supply Impact:**
- Adjust crop supply to 10%
- Observe: Agriculture zone (green buildings) darkens

---

### Test 6: Historical Data Charts

1. On Platform page, scroll to "24-Hour Trends" section
2. Verify:
   - Canvas chart renders
   - AQI line chart shows 24-hour trend
   - Grid lines visible
   - Data points connected smoothly

---

### Test 7: Multi-Page Navigation

1. Navigate between pages:
   - Home → Platform → Scenarios → Impact → About
2. Verify:
   - Smooth fade transitions between pages
   - 3D city persists (doesn't reset)
   - Navigation bar highlights current page
   - No console errors

---

### Test 8: Responsive Design

Test on different screen sizes:

**Desktop (1920x1080):**
- Dashboard grid displays 2-3 columns
- All elements visible without scrolling

**Tablet (768x1024):**
- Dashboard grid displays 1-2 columns
- Sliders stack vertically
- Touch interactions work

**Mobile (375x667):**
- Dashboard grid displays 1 column
- Metrics display 1-2 per row
- Sliders full width
- Buttons accessible

---

### Test 9: Error Handling

1. **Network error simulation:**
   - Open DevTools Network tab
   - Throttle to "Offline"
   - Try to load data
   - Verify: Error message displays gracefully

2. **Invalid city ID:**
   - Modify API call to use city_id=99
   - Verify: Error response received

---

### Test 10: Performance

1. Open DevTools Performance tab
2. Record while:
   - Loading Platform page
   - Changing city selector
   - Running scenario simulation
   - Scrolling through dashboard

Expected metrics:
- Page load: < 2 seconds
- City change: < 500ms
- Scenario simulation: < 1 second
- Smooth 60 FPS animations

---

## Debugging

### Enable Console Logging

The platform logs important events to console:

```javascript
// In browser console
window.cityEnvironment  // Access city environment
window.dispatchEvent(new CustomEvent('scenario-updated', {
  detail: { /* scenario data */ }
}))  // Manually trigger city update
```

### Check Network Requests

1. Open DevTools Network tab
2. Filter by XHR/Fetch
3. Verify API calls:
   - `/api/v1/current-state?city_id=1`
   - `/api/v1/risk-assessment?city_id=1`
   - `/api/v1/scenario` (POST)
   - `/api/v1/historical?city_id=1&hours=24`

### Common Issues

**Issue: "Cannot GET /api/v1/current-state"**
- Solution: Ensure backend is running (`npm run server`)
- Check port 5000 is not in use

**Issue: "CORS error"**
- Solution: Backend has CORS enabled, should work
- Check browser console for specific error

**Issue: "3D city not rendering"**
- Solution: Check WebGL support in browser
- Verify Three.js loaded correctly
- Check browser console for errors

**Issue: "Data not updating"**
- Solution: Check API responses in Network tab
- Verify city_id parameter is correct
- Check browser console for fetch errors

---

## File Structure

```
.
├── server.js                          # Backend API
├── package.json                       # Root dependencies
├── API_DOCUMENTATION.md               # API reference
├── SETUP_AND_TESTING.md              # This file
├── client/
│   ├── package.json                   # Frontend dependencies
│   ├── vite.config.js                 # Vite configuration
│   ├── public/
│   │   └── index.html                 # Entry HTML
│   └── src/
│       ├── main.js                    # App initialization
│       ├── index.js                   # Entry point
│       ├── App.js                     # Root component
│       ├── styles/
│       │   ├── global.css              # Global styles
│       │   ├── components/
│       │   │   └── data-dashboard.css  # Dashboard styles
│       │   └── pages/
│       │       └── platform.css        # Platform page styles
│       ├── components/
│       │   ├── DataDashboard.js        # Main dashboard
│       │   ├── Navigation.js           # Navigation bar
│       │   └── ...other components
│       ├── pages/
│       │   ├── Platform.js             # Platform page
│       │   ├── Home.js                 # Home page
│       │   └── ...other pages
│       ├── core/
│       │   ├── router.js               # Page router
│       │   └── app.js                  # App setup
│       └── utils/
│           ├── api.js                  # API client
│           ├── CityEnvironment.js      # 3D city
│           └── ThreeScene.js           # Three.js utilities
```

---

## Development Workflow

### Adding a New Feature

1. **Create component:**
```javascript
// client/src/components/MyComponent.js
export class MyComponent {
  render(container) {
    container.innerHTML = `<div>My Component</div>`;
  }
}
```

2. **Add styles:**
```css
/* client/src/styles/components/my-component.css */
.my-component { /* styles */ }
```

3. **Import and use:**
```javascript
import { MyComponent } from '../components/MyComponent.js';
import '../styles/components/my-component.css';

const component = new MyComponent();
component.render(container);
```

### Modifying API

1. Edit `server.js` to add/modify endpoints
2. Update `client/src/utils/api.js` with new methods
3. Test with curl before using in frontend
4. Update `API_DOCUMENTATION.md`

### Styling

- Use CSS variables from `global.css`
- Follow glassmorphism design pattern
- Ensure mobile responsiveness
- Test on multiple screen sizes

---

## Production Build

```bash
npm run build
```

This creates optimized build in `client/dist/`

To preview:
```bash
npm run preview
```

---

## Performance Optimization

### Current Optimizations
- Vite for fast bundling
- GSAP for GPU-accelerated animations
- Three.js with shadow maps for realistic lighting
- Canvas-based charts for performance
- Lazy loading of components

### Future Optimizations
- Code splitting by page
- Image optimization
- Service worker for offline support
- WebGL texture atlasing
- Data compression

---

## Support & Troubleshooting

For issues:
1. Check browser console for errors
2. Verify backend is running
3. Check network requests in DevTools
4. Review API_DOCUMENTATION.md
5. Check file permissions and paths

---

## Next Steps

1. ✅ Backend API fully implemented
2. ✅ DataDashboard component created
3. ✅ Platform page integrated
4. ✅ CSS styling complete
5. ⏭️ Test end-to-end data pipeline
6. ⏭️ Verify city environment updates
7. ⏭️ Deploy to production

---

## Quick Commands

```bash
# Start development
npm run dev

# Start only backend
npm run server

# Start only frontend
cd client && npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Test API endpoint
curl http://localhost:5000/api/v1/health
```

---

Last Updated: January 17, 2026
