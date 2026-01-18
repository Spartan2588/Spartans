import { ApiClient } from '../utils/api.js';
import gsap from 'gsap';
import '../styles/components/data-dashboard.css';

export class DataDashboard {
  constructor() {
    this.api = new ApiClient();
    this.currentCity = 'Mumbai';
    this.currentState = null;
    this.currentRisks = null;
    this.updateInterval = null;
  }

  async render(container) {
    container.innerHTML = `
      <div class="data-dashboard">
        <div class="dashboard-header">
          <h2>Urban Intelligence Dashboard</h2>
          <div class="dashboard-controls">
            <select id="city-select" class="city-select">
              <option value="Mumbai">Mumbai</option>
              <option value="Delhi">Delhi</option>
              <option value="Bangalore">Bangalore</option>
            </select>
            <button id="refresh-btn" class="refresh-btn">↻ Refresh</button>
          </div>
        </div>

        <div class="dashboard-grid">
          <!-- Risk Cards -->
          <div class="dashboard-section">
            <h3>Risk Assessment</h3>
            <div id="risk-cards" class="risk-cards-container"></div>
          </div>

          <!-- Current Metrics -->
          <div class="dashboard-section">
            <h3>Current Metrics</h3>
            <div id="metrics-panel" class="metrics-panel"></div>
          </div>

          <!-- Economic Impact -->
          <div class="dashboard-section section-economic">
            <h3>Economic Exposure (Real-Time)</h3>
            <div id="economic-impact" class="economic-impact"></div>
          </div>

          <!-- Historical Chart -->
          <div class="dashboard-section full-width">
            <h3>24-Hour Trends</h3>
            <div id="historical-chart" class="historical-chart"></div>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners(container);
    await this.loadData();
    this.startAutoRefresh();
  }

  setupEventListeners(container) {
    const citySelect = container.querySelector('#city-select');
    const refreshBtn = container.querySelector('#refresh-btn');
    const simulateBtn = container.querySelector('#simulate-btn');
    const sliders = container.querySelectorAll('.slider');

    citySelect.addEventListener('change', (e) => {
      this.currentCity = e.target.value;
      this.loadData();
    });

    refreshBtn.addEventListener('click', () => {
      this.loadData();
      gsap.to(refreshBtn, { rotation: 360, duration: 0.6, ease: 'power2.inOut' });
    });
  }

  async loadData() {
    try {
      const [state, risks, historical] = await Promise.all([
        this.api.getCurrentState(this.currentCity),
        this.api.getRiskAssessment(this.currentCity),
        this.api.getHistoricalData(this.currentCity, 24)
      ]);

      this.currentState = state;
      this.currentRisks = risks;

      this.renderRiskCards();
      this.renderMetrics();
      this.renderHistoricalChart(historical);

      // Update city environment
      if (window.cityEnvironment) {
        window.dispatchEvent(new CustomEvent('scenario-updated', {
          detail: {
            intervention: risks
          }
        }));
      }
    } catch (error) {
      console.error('Failed to load data:', error);
    }
  }

  renderRiskCards() {
    const container = document.querySelector('#risk-cards');
    if (!container || !this.currentRisks) return;

    const risks = [
      { key: 'environmental_risk', probKey: 'environmental_prob', icon: '🌍', label: 'Environmental' },
      { key: 'health_risk', probKey: 'health_prob', icon: '🏥', label: 'Health' },
      { key: 'food_security_risk', probKey: 'food_security_prob', icon: '🌾', label: 'Food Security' }
    ];

    container.innerHTML = risks.map(risk => {
      // Backend returns risk level as string directly, probability as separate field
      const level = this.currentRisks[risk.key] || 'unknown';
      const probability = Math.round((this.currentRisks[risk.probKey] || 0) * 100);
      const color = this.getRiskColor(level);

      return `
        <div class="risk-card glass">
          <div class="risk-header">
            <span class="risk-icon">${risk.icon}</span>
            <h4>${risk.label}</h4>
          </div>
          <div class="risk-level" style="color: ${color}">
            ${level.toUpperCase()}
          </div>
          <div class="risk-probability">
            <span>Probability:</span>
            <span class="value">${probability}%</span>
          </div>
        </div>
      `;
    }).join('');

    gsap.from(container.querySelectorAll('.risk-card'), {
      opacity: 0,
      y: 20,
      duration: 0.5,
      stagger: 0.1,
      ease: 'power2.out'
    });
  }

  renderMetrics() {
    const container = document.querySelector('#metrics-panel');
    if (!container || !this.currentState) return;

    // Helper to format values nicely
    const format = (val, decimals = 1) => {
      if (val === null || val === undefined) return 'N/A';
      return typeof val === 'number' ? val.toFixed(decimals) : val;
    };

    const metrics = [
      { label: 'AQI', value: format(this.currentState.aqi, 0), unit: '', icon: '💨' },
      { label: 'Hospital Load', value: format(this.currentState.bed_occupancy_percent, 1), unit: '%', icon: '🏥' },
      { label: 'Temperature', value: format(this.currentState.temperature, 1), unit: '°C', icon: '🌡️' },
      { label: 'Food Availability', value: format(this.currentState.crop_supply_index, 0), unit: '%', icon: '🌾' },
      { label: 'Food Price', value: format(this.currentState.food_price_index, 0), unit: '', icon: '💹' },
      { label: 'Traffic', value: format(this.currentState.traffic_congestion_index, 0), unit: '', icon: '🚗' }
    ];

    container.innerHTML = metrics.map(m => `
      <div class="metric-item glass">
        <div class="metric-icon">${m.icon}</div>
        <div class="metric-label">${m.label}</div>
        <div class="metric-value">${m.value}${m.unit}</div>
      </div>
    `).join('');
  }

  // Simulation methods removed - handled in Scenarios section

  renderEconomicImpact(impact) {
    const container = document.querySelector('#economic-impact');
    if (!container) return;

    container.innerHTML = `
      <div class="economic-grid">
        <div class="economic-item glass">
          <div class="economic-label">Intervention Cost</div>
          <div class="economic-value">$${(impact.intervention_cost / 1000).toFixed(0)}K</div>
        </div>
        <div class="economic-item glass">
          <div class="economic-label">Total Savings</div>
          <div class="economic-value">$${(impact.total_savings / 1000000).toFixed(1)}M</div>
        </div>
        <div class="economic-item glass highlight">
          <div class="economic-label">ROI</div>
          <div class="economic-value">${impact.roi}x</div>
        </div>
        <div class="economic-item glass">
          <div class="economic-label">Payback Period</div>
          <div class="economic-value">${impact.payback_period_months} months</div>
        </div>
      </div>
    `;
  }

  renderHistoricalChart(historical) {
    const container = document.querySelector('#historical-chart');
    if (!container || !historical) return;

    // Backend returns { data_points: [...], city, time_range, record_count }
    const dataPoints = historical.data_points || [];

    if (dataPoints.length === 0) {
      container.innerHTML = '<div style="color: #94a3b8; text-align: center; padding: 40px;">No historical data available</div>';
      return;
    }

    // Create simple chart using canvas
    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth || 600;
    canvas.height = 300;
    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    // Use aqi_severity_score from data_points
    const chartData = dataPoints.map(dp => ({ value: dp.aqi_severity_score || dp.traffic_congestion_index || 0 }));
    this.drawChart(ctx, chartData, 'Risk Score', '#a78bfa');
  }

  drawChart(ctx, data, label, color) {
    // Null safety
    if (!ctx || !data || !Array.isArray(data) || data.length === 0) {
      console.warn('drawChart: Invalid data provided');
      return;
    }

    const width = ctx.canvas.width;
    const height = ctx.canvas.height;
    const padding = 40;

    // Background
    ctx.fillStyle = 'rgba(10, 10, 26, 0.5)';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.1)';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (height - padding * 2) * (i / 5);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }

    // Data line
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.beginPath();

    // Safe extraction of values
    const values = data.map(d => (d && typeof d.value === 'number') ? d.value : 0);
    const maxValue = Math.max(...values);
    const minValue = Math.min(...values);
    const range = maxValue - minValue || 1;

    values.forEach((val, index) => {
      const x = padding + (width - padding * 2) * (index / Math.max(values.length - 1, 1));
      const y = height - padding - (height - padding * 2) * ((val - minValue) / range);

      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });

    ctx.stroke();

    // Labels
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px Inter';
    ctx.textAlign = 'center';
    ctx.fillText(label, width / 2, height - 10);
  }

  getRiskColor(level) {
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
  }

  startAutoRefresh() {
    this.updateInterval = setInterval(() => {
      this.loadData();
    }, 30000); // Refresh every 30 seconds
  }

  cleanup() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}
