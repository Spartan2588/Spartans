# Urban Risk Assessment Dashboard

A modern, interactive dashboard for monitoring environmental, health, and food security risks across Indian cities. Built with React and Node.js, inspired by useorigin.com's design aesthetic.

## Features

- **City Selector**: Switch between Mumbai, Delhi, and Bangalore
- **Risk Assessment Cards**: Real-time environmental, health, and food security risk levels
- **Current Metrics**: AQI, hospital load, temperature, crop supply, food price index, and traffic density
- **Scenario Analysis**: Pre-built scenarios (Normal, Heatwave, Drought, Crisis)
- **Custom Sliders**: Adjust parameters and calculate custom impact scenarios
- **Scenario Comparison**: Side-by-side baseline vs. intervention comparison
- **Economic Impact**: View intervention costs, savings, and ROI
- **Historical Charts**: 24-hour trend visualization using Plotly
- **Recommendations**: AI-generated action items based on risk levels

## Tech Stack

- **Frontend**: React 18, CSS3 with modern gradients and animations
- **Backend**: Node.js with Express
- **Charts**: Plotly.js
- **Styling**: Custom CSS with glassmorphism design

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd risk-dashboard
```

2. Install root dependencies:
```bash
npm install
```

3. Install client dependencies:
```bash
cd client
npm install
cd ..
```

### Running the Application

**Development Mode** (runs both server and client):
```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:5000`
- Frontend on `http://localhost:3000`

**Production Build**:
```bash
npm run build
```

## API Endpoints

### Get Current State
```
GET /api/v1/current-state?city_id={city_id}
```
Returns current metrics for a city.

### Get Risk Assessment
```
GET /api/v1/risk-assessment?city_id={city_id}
```
Returns current risk levels and probabilities.

### Calculate Scenario
```
POST /api/v1/scenario
Content-Type: application/json

{
  "aqi": 150,
  "hospital_load": 50,
  "crop_supply": 70,
  "temperature": 30
}
```
Returns baseline vs. intervention comparison and economic impact.

### Get Historical Data
```
GET /api/v1/historical?city_id={city_id}&hours=24
```
Returns time-series data for the last N hours.

## Project Structure

```
risk-dashboard/
├── server.js                 # Express backend
├── package.json
├── client/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── App.js
│   │   ├── App.css
│   │   ├── index.js
│   │   ├── index.css
│   │   └── components/
│   │       ├── CitySelector.js
│   │       ├── RiskCards.js
│   │       ├── MetricsDisplay.js
│   │       ├── ScenarioButtons.js
│   │       ├── CustomSliders.js
│   │       ├── ComparisonDisplay.js
│   │       ├── EconomicImpact.js
│   │       ├── HistoricalCharts.js
│   │       ├── RecommendationsList.js
│   │       └── [component].css files
│   └── package.json
└── README.md
```

## Design Features

- **Glassmorphism**: Semi-transparent cards with backdrop blur effects
- **Dark Theme**: Slate and blue color palette for reduced eye strain
- **Responsive Grid**: Adapts to different screen sizes
- **Smooth Animations**: Hover effects and transitions throughout
- **Accessibility**: Semantic HTML and proper color contrast

## Customization

### Adding New Cities
Edit `server.js` and add to the `cityData` object:
```javascript
const cityData = {
  1: { name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
  2: { name: 'Delhi', lat: 28.7041, lng: 77.1025 },
  3: { name: 'Bangalore', lat: 12.9716, lng: 77.5946 },
  4: { name: 'Your City', lat: 0.0000, lng: 0.0000 }
};
```

### Modifying Risk Thresholds
Update the risk calculation logic in `server.js` POST `/api/v1/scenario` endpoint.

### Changing Colors
Edit the CSS files in `client/src/components/` to modify the color scheme.

## Future Enhancements

- Real API integration with actual environmental data
- User authentication and saved scenarios
- Export reports as PDF
- Mobile app version
- Real-time notifications
- Machine learning predictions
- Multi-language support

## License

MIT

## Support

For issues or questions, please open an issue in the repository.
