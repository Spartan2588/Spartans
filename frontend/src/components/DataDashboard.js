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

          <!-- Scenario Comparison -->
          <div class="dashboard-section full-width">
            <h3>Scenario Simulation</h3>
            <div class="scenario-controls">
              <div class="slider-group">
                <label>AQI: <span id="aqi-value">150</span></label>
                <input type="range" id="aqi-slider" min="0" max="500" value="150" class="slider">
              </div>
              <div class="slider-group">
                <label>Hospital Load: <span id="hospital-value">50</span>%</label>
                <input type="range" id="hospital-slider" min="0" max="100" value="50" class="slider">
              </div>
              <div class="slider-group">
                <label>Crop Supply: <span id="crop-value">70</span>%</label>
                <input type="range" id="crop-slider" min="0" max="100" value="70" class="slider">
              </div>
              <div class="slider-group">
                <label>Temperature: <span id="temp-value">25</span>°C</label>
                <input type="range" id="temp-slider" min="20" max="50" step="0.1" value="25" class="slider">
              </div>
              <button id="simulate-btn" class="btn btn-primary">Simulate Scenario</button>
            </div>
            <div id="comparison-results" class="comparison-results"></div>
          </div>

          <!-- Economic Impact -->
          <div class="dashboard-section">
            <h3>Economic Impact</h3>
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

    sliders.forEach(slider => {
      slider.addEventListener('input', (e) => {
        const valueSpan = container.querySelector(`#${e.target.id.replace('-slider', '-value')}`);
        if (valueSpan) {
          valueSpan.textContent = e.target.value;
        }
      });
    });

    simulateBtn.addEventListener('click', () => this.runSimulation(container));
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
      { label: 'Crop Supply', value: format(this.currentState.crop_supply_index, 0), unit: '%', icon: '🌾' },
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

  async runSimulation(container) {
    const aqi = parseFloat(container.querySelector('#aqi-slider').value);
    const hospital_load = parseFloat(container.querySelector('#hospital-slider').value);
    const crop_supply = parseFloat(container.querySelector('#crop-slider').value);
    const temperature = parseFloat(container.querySelector('#temp-slider').value);

    try {
      const result = await this.api.simulateScenario({
        city_id: this.currentCity,
        modifications: {
          aqi,
          hospital_load: hospital_load / 100, // Normalized 0-1 for backend
          crop_supply_index: crop_supply,     // Renaming to match schema if needed
          temperature,
          respiratory_cases: null // Optional
        }
      });

      this.renderComparison(result);
      this.renderEconomicImpact(result.economic_impact);

      // Update city environment
      if (window.cityEnvironment) {
        window.dispatchEvent(new CustomEvent('scenario-updated', {
          detail: result
        }));
      }
    } catch (error) {
      console.error('Simulation failed:', error);
    }
  }

  renderComparison(result) {
    const container = document.querySelector('#comparison-results');
    if (!container) return;

    // Backend returns baseline_risks and intervention_risks (not baseline/intervention)
    const baselineRisks = result.baseline_risks || result.baseline || {};
    const interventionRisks = result.intervention_risks || result.intervention || {};

    const risks = [
      { key: 'environmental_risk', probKey: 'environmental_prob', label: 'Environmental' },
      { key: 'health_risk', probKey: 'health_prob', label: 'Health' },
      { key: 'food_security_risk', probKey: 'food_security_prob', label: 'Food Security' }
    ];

    container.innerHTML = `
      <div class="comparison-grid">
        ${risks.map(risk => {
      // Backend returns risk level as string, probability as separate field
      const baselineLevel = baselineRisks[risk.key] || 'unknown';
      const baselineProb = Math.round((baselineRisks[risk.probKey] || 0) * 100);
      const interventionLevel = interventionRisks[risk.key] || 'unknown';
      const interventionProb = Math.round((interventionRisks[risk.probKey] || 0) * 100);
      const change = interventionProb - baselineProb;

      return `
            <div class="comparison-item glass">
              <h4>${risk.label}</h4>
              <div class="comparison-row">
                <div class="comparison-col">
                  <span class="label">Baseline</span>
                  <span class="level" style="color: ${this.getRiskColor(baselineLevel)}">
                    ${baselineLevel.toUpperCase()}
                  </span>
                  <span class="prob">${baselineProb}%</span>
                </div>
                <div class="comparison-col">
                  <span class="label">Intervention</span>
                  <span class="level" style="color: ${this.getRiskColor(interventionLevel)}">
                    ${interventionLevel.toUpperCase()}
                  </span>
                  <span class="prob">${interventionProb}%</span>
                </div>
                <div class="comparison-col">
                  <span class="label">Change</span>
                  <span class="change ${change < 0 ? 'positive' : 'negative'}">
                    ${change > 0 ? '+' : ''}${change}%
                  </span>
                </div>
              </div>
            </div>
          `;
    }).join('')}
      </div>
    `;
  }

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
