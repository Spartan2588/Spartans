import React, { useState, useEffect } from 'react';
import './InteractiveDemo.css';

function InteractiveDemo() {
  const [selectedCity, setSelectedCity] = useState(1);
  const [metrics, setMetrics] = useState(null);
  const [risks, setRisks] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedCity]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [metricsRes, risksRes] = await Promise.all([
        fetch(`/api/v1/current-state?city_id=${selectedCity}`),
        fetch(`/api/v1/risk-assessment?city_id=${selectedCity}`)
      ]);

      const metricsData = await metricsRes.json();
      const risksData = await risksRes.json();

      setMetrics(metricsData);
      setRisks(risksData);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const cities = [
    { id: 1, name: 'Mumbai' },
    { id: 2, name: 'Delhi' },
    { id: 3, name: 'Bangalore' }
  ];

  const getRiskColor = (level) => {
    switch (level) {
      case 'low':
        return '#10b981';
      case 'medium':
        return '#f59e0b';
      case 'high':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  return (
    <section className="interactive-demo">
      <div className="demo-container">
        <div className="demo-header">
          <h2>See It In Action</h2>
          <p>Select a city to explore real-time risk data</p>
        </div>

        <div className="demo-content">
          <div className="city-selector-demo">
            {cities.map((city) => (
              <button
                key={city.id}
                className={`city-btn ${selectedCity === city.id ? 'active' : ''}`}
                onClick={() => setSelectedCity(city.id)}
              >
                {city.name}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="demo-loading">Loading...</div>
          ) : metrics && risks ? (
            <div className="demo-data">
              <div className="risks-display">
                {[
                  { key: 'environmental_risk', icon: '🌍', label: 'Environmental' },
                  { key: 'health_risk', icon: '🏥', label: 'Health' },
                  { key: 'food_security_risk', icon: '🌾', label: 'Food Security' }
                ].map((risk) => (
                  <div key={risk.key} className="risk-item">
                    <div className="risk-icon">{risk.icon}</div>
                    <div className="risk-info">
                      <p className="risk-label">{risk.label}</p>
                      <p
                        className="risk-level"
                        style={{ color: getRiskColor(risks[risk.key].level) }}
                      >
                        {risks[risk.key].level.toUpperCase()}
                      </p>
                      <p className="risk-prob">{risks[risk.key].probability}% probability</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="metrics-display">
                <div className="metric-item">
                  <span className="metric-label">AQI</span>
                  <span className="metric-value">{metrics.aqi}</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Hospital Load</span>
                  <span className="metric-value">{metrics.hospital_load}%</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Temperature</span>
                  <span className="metric-value">{metrics.temperature}°C</span>
                </div>
                <div className="metric-item">
                  <span className="metric-label">Crop Supply</span>
                  <span className="metric-value">{metrics.crop_supply}%</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <div className="demo-cta">
          <button className="demo-btn">
            Explore Full Dashboard →
          </button>
        </div>
      </div>
    </section>
  );
}

export default InteractiveDemo;
