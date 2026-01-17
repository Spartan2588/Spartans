import '../styles/components/metrics-display.css';

export class MetricsDisplay {
  render(container, metrics) {
    const metricsList = [
      { label: 'AQI', value: metrics.aqi, unit: '', icon: '💨' },
      { label: 'Hospital Load', value: metrics.hospital_load, unit: '%', icon: '🏥' },
      { label: 'Temperature', value: metrics.temperature, unit: '°C', icon: '🌡️' },
      { label: 'Crop Supply', value: metrics.crop_supply, unit: '%', icon: '🌾' },
      { label: 'Food Price Index', value: metrics.food_price_index, unit: '', icon: '💹' },
      { label: 'Traffic Density', value: metrics.traffic_density, unit: '', icon: '🚗' }
    ];

    container.innerHTML = `
      <div class="metrics-display">
        <h2>Current Metrics</h2>
        <div class="metrics-grid">
          ${metricsList.map(metric => `
            <div class="metric-card glass">
              <div class="metric-icon">${metric.icon}</div>
              <div class="metric-label">${metric.label}</div>
              <div class="metric-value">
                ${metric.value}
                <span class="metric-unit">${metric.unit}</span>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }
}
