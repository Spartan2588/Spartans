import { ApiClient } from '../utils/api.js';
import gsap from 'gsap';
import '../styles/components/trend-analysis.css';

export class TrendAnalysis {
  constructor() {
    this.api = new ApiClient();
    this.currentCity = 1;
    this.historicalData = null;
    this.projectedData = null;
    this.charts = {};
  }

  async render(container) {
    container.innerHTML = `
      <div class="trend-analysis">
        <div class="trend-header">
          <h2>Trend Analysis</h2>
          <div class="trend-controls">
            <select id="trend-domain" class="trend-select">
              <option value="environmental">Environmental</option>
              <option value="health">Health</option>
              <option value="agriculture">Agriculture</option>
              <option value="risks">Risk Scores</option>
            </select>
            <button id="trend-refresh" class="trend-btn">↻ Refresh</button>
          </div>
        </div>

        <div class="trend-grid">
          <div class="trend-card">
            <div class="trend-chart-container">
              <div id="aqi-chart" class="trend-chart"></div>
            </div>
            <div class="trend-insight">
              <span class="insight-label">AQI Trend</span>
              <span id="aqi-direction" class="insight-direction">→</span>
            </div>
          </div>

          <div class="trend-card">
            <div class="trend-chart-container">
              <div id="temperature-chart" class="trend-chart"></div>
            </div>
            <div class="trend-insight">
              <span class="insight-label">Temperature Trend</span>
              <span id="temp-direction" class="insight-direction">→</span>
            </div>
          </div>

          <div class="trend-card">
            <div class="trend-chart-container">
              <div id="hospital-chart" class="trend-chart"></div>
            </div>
            <div class="trend-insight">
              <span class="insight-label">Hospital Load Trend</span>
              <span id="hospital-direction" class="insight-direction">→</span>
            </div>
          </div>

          <div class="trend-card">
            <div class="trend-chart-container">
              <div id="crop-chart" class="trend-chart"></div>
            </div>
            <div class="trend-insight">
              <span class="insight-label">Crop Supply Trend</span>
              <span id="crop-direction" class="insight-direction">→</span>
            </div>
          </div>

          <div class="trend-card full-width">
            <div class="trend-chart-container">
              <div id="risk-chart" class="trend-chart"></div>
            </div>
            <div class="trend-insight">
              <span class="insight-label">Overall Risk Trend</span>
              <span id="risk-direction" class="insight-direction">→</span>
            </div>
          </div>
        </div>

        <div class="trend-legend">
          <div class="legend-item">
            <span class="legend-color improving"></span>
            <span>Improving</span>
          </div>
          <div class="legend-item">
            <span class="legend-color stable"></span>
            <span>Stable</span>
          </div>
          <div class="legend-item">
            <span class="legend-color worsening"></span>
            <span>Worsening</span>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners(container);
    await this.loadData();
  }

  setupEventListeners(container) {
    const refreshBtn = container.querySelector('#trend-refresh');
    const domainSelect = container.querySelector('#trend-domain');

    refreshBtn.addEventListener('click', () => {
      this.loadData();
      gsap.to(refreshBtn, { rotation: 360, duration: 0.6 });
    });

    domainSelect.addEventListener('change', () => {
      this.updateCharts();
    });

    // Listen for scenario updates
    window.addEventListener('scenario-updated', () => {
      this.loadData();
    });

    // Listen for city changes
    window.addEventListener('city-changed', (e) => {
      this.currentCity = e.detail.cityId;
      this.loadData();
    });
  }

  async loadData() {
    try {
      const historical = await this.api.getHistoricalData(this.currentCity, 24);
      this.historicalData = historical;
      this.generateProjectedData();
      this.updateCharts();
    } catch (error) {
      console.error('Failed to load trend data:', error);
    }
  }

  generateProjectedData() {
    if (!this.historicalData) return;

    // Generate 6-hour projection based on current trend
    this.projectedData = {
      aqi: this.projectMetric(this.historicalData.aqi, 6),
      temperature: this.projectMetric(this.historicalData.temperature, 6),
      hospital_load: this.projectMetric(this.historicalData.hospital_load, 6),
      crop_supply: this.projectMetric(this.historicalData.crop_supply, 6)
    };
  }

  projectMetric(historicalValues, hoursAhead) {
    if (historicalValues.length < 2) return historicalValues;

    const lastValue = historicalValues[historicalValues.length - 1].value;
    const prevValue = historicalValues[historicalValues.length - 2].value;
    const trend = lastValue - prevValue;

    const projected = [];
    for (let i = 0; i < hoursAhead; i++) {
      const timestamp = new Date(
        new Date(historicalValues[historicalValues.length - 1].timestamp).getTime() +
        (i + 1) * 3600000
      ).toISOString();

      projected.push({
        timestamp,
        value: Math.max(0, lastValue + trend * (i + 1) * 0.5) // Dampen projection
      });
    }

    return projected;
  }

  updateCharts() {
    if (!this.historicalData) return;

    this.renderChart('aqi', this.historicalData.aqi, this.projectedData.aqi, 'AQI', '#a78bfa');
    this.renderChart('temperature', this.historicalData.temperature, this.projectedData.temperature, 'Temperature (°C)', '#f59e0b');
    this.renderChart('hospital', this.historicalData.hospital_load, this.projectedData.hospital_load, 'Hospital Load (%)', '#ef4444');
    this.renderChart('crop', this.historicalData.crop_supply, this.projectedData.crop_supply, 'Crop Supply (%)', '#10b981');
    this.renderRiskChart();

    this.updateTrendDirections();
  }

  renderChart(id, historical, projected, label, color) {
    const container = document.querySelector(`#${id}-chart`);
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = 200;
    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const padding = 30;
    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = 'rgba(10, 10, 26, 0.5)';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (height - padding * 2) * (i / 4);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Combine historical and projected
    const allData = [...historical, ...projected];
    const maxValue = Math.max(...allData.map(d => d.value));
    const minValue = Math.min(...allData.map(d => d.value));
    const range = maxValue - minValue || 1;

    // Draw historical data
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    historical.forEach((point, index) => {
      const x = padding + (width - padding * 2) * (index / (allData.length - 1));
      const y = height - padding - (height - padding * 2) * ((point.value - minValue) / range);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Draw projected data (dashed)
    ctx.strokeStyle = color;
    ctx.setLineDash([5, 5]);
    ctx.lineWidth = 2;
    ctx.beginPath();

    const startIndex = historical.length - 1;
    projected.forEach((point, index) => {
      const totalIndex = startIndex + index;
      const x = padding + (width - padding * 2) * (totalIndex / (allData.length - 1));
      const y = height - padding - (height - padding * 2) * ((point.value - minValue) / range);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();
    ctx.setLineDash([]);

    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(label, width / 2, height - 10);
  }

  renderRiskChart() {
    const container = document.querySelector('#risk-chart');
    if (!container) return;

    // Calculate risk scores over time
    const riskTimeline = this.historicalData.aqi.map((aqi, index) => {
      const temp = this.historicalData.temperature[index]?.value || 25;
      const hospital = this.historicalData.hospital_load[index]?.value || 50;
      const crop = this.historicalData.crop_supply[index]?.value || 70;

      const aqiNorm = Math.min(aqi.value / 500, 1);
      const tempNorm = Math.max(0, Math.min((temp - 20) / 30, 1));
      const hospitalNorm = hospital / 100;
      const cropNorm = 1 - (crop / 100);

      const riskScore = (aqiNorm * 0.35 + tempNorm * 0.25 + hospitalNorm * 0.25 + cropNorm * 0.15) * 100;

      return {
        timestamp: aqi.timestamp,
        value: riskScore
      };
    });

    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = 200;
    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const padding = 30;
    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = 'rgba(10, 10, 26, 0.5)';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) {
      const y = padding + (height - padding * 2) * (i / 4);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Draw risk line
    ctx.strokeStyle = '#06b6d4';
    ctx.lineWidth = 2;
    ctx.beginPath();

    riskTimeline.forEach((point, index) => {
      const x = padding + (width - padding * 2) * (index / (riskTimeline.length - 1));
      const y = height - padding - (height - padding * 2) * (point.value / 100);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Label
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText('Overall Risk Score (%)', width / 2, height - 10);
  }

  updateTrendDirections() {
    const directions = {
      aqi: this.getTrendDirection(this.historicalData.aqi),
      temperature: this.getTrendDirection(this.historicalData.temperature),
      hospital: this.getTrendDirection(this.historicalData.hospital_load),
      crop: this.getTrendDirection(this.historicalData.crop_supply)
    };

    Object.entries(directions).forEach(([key, direction]) => {
      const element = document.querySelector(`#${key}-direction`);
      if (element) {
        element.textContent = direction.symbol;
        element.className = `insight-direction ${direction.class}`;
      }
    });
  }

  getTrendDirection(data) {
    if (data.length < 2) return { symbol: '→', class: 'stable' };

    const recent = data.slice(-6);
    const avg1 = recent.slice(0, 3).reduce((sum, d) => sum + d.value, 0) / 3;
    const avg2 = recent.slice(3).reduce((sum, d) => sum + d.value, 0) / 3;

    const change = avg2 - avg1;
    const threshold = (avg1 * 0.05); // 5% threshold

    if (change > threshold) {
      return { symbol: '↑', class: 'worsening' };
    } else if (change < -threshold) {
      return { symbol: '↓', class: 'improving' };
    } else {
      return { symbol: '→', class: 'stable' };
    }
  }

  cleanup() {
    // Cleanup if needed
  }
}
