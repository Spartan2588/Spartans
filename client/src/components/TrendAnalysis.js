import { ApiClient } from '../utils/api.js';
import { SimulationEngine } from '../utils/SimulationEngine.js';
import { SimpleRadarChart } from './SimpleRadarChart.js';
import { RiskDomainCalculator } from '../utils/RiskDomainCalculator.js';
import { LiveDataService } from '../utils/LiveDataService.js';
import gsap from 'gsap';
import '../styles/components/trend-analysis.css';

export class TrendAnalysis {
  constructor() {
    this.api = new ApiClient();
    this.engine = new SimulationEngine();
    this.riskCalculator = new RiskDomainCalculator();
    this.liveDataService = new LiveDataService();
    this.currentCity = 1;
    this.currentScenario = null;
    this.baselineState = null;
    this.baselineProjection = null;
    this.simulationProjection = null;
    this.radarChart = null;
    this.autoRefreshInterval = null;
    this.previousRiskScores = null;
  }

  /**
   * Generate fallback data for all 11 required risk domains
   * HARD CONSTRAINT: Must generate exactly 10 domains + 1 composite = 11 total
   */
  generateFallbackData(hours = 8) {
    const fallback = {
      // 10 Required Risk Domains
      heat_index_risk: [],
      extreme_rainfall_prob: [],
      coastal_flooding_risk: [],
      power_grid_failure: [],
      traffic_congestion: [],
      hospital_capacity_stress: [],
      telecom_failure_risk: [],
      environmental_risk: [], // Air Quality Health Risk
      fire_hazard_risk: [],
      public_health_outbreak: [],

      // 1 Composite Index (11th line)
      composite_urban_risk: [],

      // Supporting data
      timestamps: [],

      // Confidence bands for each domain
      heat_index_confidence: [],
      rainfall_confidence: [],
      flooding_confidence: [],
      power_confidence: [],
      traffic_confidence: [],
      hospital_confidence: [],
      telecom_confidence: [],
      aqi_confidence: [],
      fire_confidence: [],
      health_confidence: [],
      composite_confidence: []
    };

    for (let h = 0; h < hours; h++) {
      const progress = h / hours;
      const sine = Math.sin(progress * Math.PI);
      const cosine = Math.cos(progress * Math.PI * 2);

      // Generate realistic risk patterns
      fallback.heat_index_risk.push(Math.round(45 + sine * 15 + Math.random() * 5));
      fallback.extreme_rainfall_prob.push(Math.round(30 + cosine * 20 + Math.random() * 8));
      fallback.coastal_flooding_risk.push(Math.round(25 + sine * 12 + Math.random() * 6));
      fallback.power_grid_failure.push(Math.round(50 + sine * 18 + Math.random() * 7));
      fallback.traffic_congestion.push(Math.round(60 + Math.abs(sine) * 25 + Math.random() * 5));
      fallback.hospital_capacity_stress.push(Math.round(55 + sine * 20 + Math.random() * 8));
      fallback.telecom_failure_risk.push(Math.round(35 + cosine * 15 + Math.random() * 6));
      fallback.environmental_risk.push(Math.round(40 + sine * 20 + Math.random() * 7)); // AQI Health
      fallback.fire_hazard_risk.push(Math.round(38 + sine * 22 + Math.random() * 6));
      fallback.public_health_outbreak.push(Math.round(42 + cosine * 18 + Math.random() * 7));

      // Composite = weighted average of all 10 domains
      const composite = Math.round(
        (fallback.heat_index_risk[h] * 0.12 +
          fallback.extreme_rainfall_prob[h] * 0.10 +
          fallback.coastal_flooding_risk[h] * 0.08 +
          fallback.power_grid_failure[h] * 0.15 +
          fallback.traffic_congestion[h] * 0.05 +
          fallback.hospital_capacity_stress[h] * 0.15 +
          fallback.telecom_failure_risk[h] * 0.08 +
          fallback.environmental_risk[h] * 0.15 +
          fallback.fire_hazard_risk[h] * 0.06 +
          fallback.public_health_outbreak[h] * 0.12)
      );
      fallback.composite_urban_risk.push(composite);

      // Confidence bands (uncertainty ranges)
      const baseConfidence = 5 + Math.random() * 3;
      fallback.heat_index_confidence.push(Math.round(baseConfidence));
      fallback.rainfall_confidence.push(Math.round(baseConfidence + 2));
      fallback.flooding_confidence.push(Math.round(baseConfidence + 1));
      fallback.power_confidence.push(Math.round(baseConfidence));
      fallback.traffic_confidence.push(Math.round(baseConfidence - 1));
      fallback.hospital_confidence.push(Math.round(baseConfidence + 1));
      fallback.telecom_confidence.push(Math.round(baseConfidence));
      fallback.aqi_confidence.push(Math.round(baseConfidence + 1));
      fallback.fire_confidence.push(Math.round(baseConfidence + 2));
      fallback.health_confidence.push(Math.round(baseConfidence + 1));
      fallback.composite_confidence.push(Math.round(baseConfidence - 2));

      fallback.timestamps.push(new Date(Date.now() + h * 3600000));
    }

    console.warn('⚠ Using fallback data for 11 risk domains (10 primary + 1 composite)');
    return fallback;
  }

  /**
   * Fetch AQI data from OpenWeather Air Pollution API
   * @param {number} lat - Latitude
   * @param {number} lon - Longitude
   * @returns {Promise<number>} AQI value (0-500 scale)
   */
  async fetchAQI(lat, lon) {
    const apiKey = 'f6b8c6f0e8f3d8c9a5b7e4f2d1c3a9b8'; // OpenWeather API key
    const url = `https://api.openweathermap.org/data/2.5/air_pollution?lat=${lat}&lon=${lon}&appid=${apiKey}`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error(`AQI API failed: ${response.status}`);

      const data = await response.json();
      // OpenWeather AQI scale: 1-5, convert to 0-500 scale
      const aqiIndex = data.list[0].main.aqi;
      const aqiMap = { 1: 50, 2: 100, 3: 150, 4: 200, 5: 300 };
      return aqiMap[aqiIndex] || 150;
    } catch (error) {
      console.warn('Failed to fetch AQI:', error);
      return 150; // Fallback AQI
    }
  }

  /**
   * Fetch live Mumbai weather trends from OpenWeather API
   * Builds 24-hour time series with 8 points (3-hour intervals)
   * Calculates ALL 12 risk domains using RiskDomainCalculator
   * @returns {Promise<Object>} Trend data with all 12 risk metrics
   */
  async fetchMumbaiTrends() {
    // Mumbai coordinates
    const lat = 19.0760;
    const lon = 72.8777;
    const apiKey = 'f6b8c6f0e8f3d8c9a5b7e4f2d1c3a9b8'; // OpenWeather API key
    const url = `https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=metric`;

    try {
      console.log('🌍 Fetching live Mumbai weather data...');

      // Fetch 5-day forecast
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Weather API failed: ${response.status}`);

      const forecast = await response.json();

      // Fetch AQI data
      const aqi = await this.fetchAQI(lat, lon);
      console.log(`✓ Fetched AQI: ${aqi}`);

      // Initialize trend data for ALL 12 domains
      const trendData = {
        // Original 3 domains
        environmental_risk: [],
        health_risk: [],
        food_security_risk: [],

        // New 7 domains
        heat_index_risk: [],
        extreme_rainfall_prob: [],
        coastal_flooding_risk: [],
        power_grid_failure: [],
        traffic_congestion: [],
        hospital_capacity_stress: [],
        population_density_stress: [],
        telecom_failure_risk: [],
        fire_hazard_risk: [],
        public_health_outbreak: [],

        // Composite indices
        composite_urban_risk: [],
        cascading_failure_risk: [],

        // Supporting data
        timestamps: []
      };

      // Extract first 8 forecast points (24 hours at 3-hour intervals)
      const forecastPoints = forecast.list.slice(0, 8);

      forecastPoints.forEach((point, index) => {
        // Extract weather data
        const temp = point.main.temp; // Celsius
        const rain = point.rain ? point.rain['3h'] || 0 : 0; // mm in 3 hours
        const humidity = point.main.humidity || 70;
        const windSpeed = point.wind ? point.wind.speed || 10 : 10;
        const timestamp = new Date(point.dt * 1000);
        const timeIndex = timestamp.getHours();

        // Prepare weather data object
        const weatherData = {
          temp,
          rain,
          aqi,
          humidity,
          windSpeed
        };

        // Calculate ALL risk domains using RiskDomainCalculator
        const risks = this.riskCalculator.calculateAllRisks(weatherData, timeIndex);

        // Store all calculated risks
        trendData.environmental_risk.push(Math.round(risks.environmental));
        trendData.health_risk.push(Math.round(risks.health));
        trendData.food_security_risk.push(Math.round(risks.foodSecurity));
        trendData.heat_index_risk.push(Math.round(risks.heatIndex));
        trendData.extreme_rainfall_prob.push(Math.round(risks.extremeRainfall));
        trendData.coastal_flooding_risk.push(Math.round(risks.coastalFlooding));
        trendData.power_grid_failure.push(Math.round(risks.powerGrid));
        trendData.traffic_congestion.push(Math.round(risks.trafficCongestion));
        trendData.hospital_capacity_stress.push(Math.round(risks.hospitalCapacity));
        trendData.population_density_stress.push(Math.round(risks.populationDensity));
        trendData.telecom_failure_risk.push(Math.round(risks.telecomFailure));
        trendData.fire_hazard_risk.push(Math.round(risks.fireHazard));
        trendData.public_health_outbreak.push(Math.round(risks.publicHealth));
        trendData.composite_urban_risk.push(Math.round(risks.compositeUrbanRisk));
        trendData.cascading_failure_risk.push(Math.round(risks.cascadingFailure));
        trendData.timestamps.push(timestamp);
      });

      console.log('✅ Live Mumbai trends calculated for 12 domains:', trendData);
      return trendData;

    } catch (error) {
      console.error('Failed to fetch Mumbai trends:', error);
      console.warn('⚠ Using fallback synthetic data');
      return this.generateFallbackData(8); // 8 points for 24 hours
    }
  }

  async render(container) {
    container.innerHTML = `
      <div class="trend-analysis">
        <div class="trend-header">
          <h2>Trend Analysis</h2>
          <div class="trend-controls">
            <button id="trend-refresh" class="trend-btn">🔄 Refresh Live Data</button>
            <span id="auto-refresh-status" class="status-badge" style="margin-left: 10px; padding: 5px 10px; background: #10b981; color: white; border-radius: 4px; font-size: 0.85em; font-weight: 600;">AUTO-REFRESH: ON (5min)</span>
            <span id="loading-spinner" class="spinner" style="display: none; margin-left: 10px;">🔄 Loading...</span>
            <span id="last-updated" class="timestamp" style="margin-left: 15px; font-size: 0.9em; color: #888;"></span>
          </div>
        </div>




        <!-- Radar Chart (Spider/Web Chart) -->
        <div class="trend-section">
          <div class="radar-chart-container">
            <div id="radar-chart" style="width: 100%; height: 650px;"></div>
          </div>
        </div>

        <!-- Statistics -->
        <div class="trend-stats">
          <div class="stat-item">
            <span class="stat-label">Scenario Type</span>
            <span id="scenario-type" class="stat-value">—</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">Projection Period</span>
            <span id="projection-period" class="stat-value">24h</span>
          </div>
          <div class="stat-item">
            <span class="stat-label">City</span>
            <span id="city-name" class="stat-value">—</span>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners(container);
    this.initializeGraphs(container);
    await this.loadData();
  }

  setupEventListeners(container) {
    const refreshBtn = container.querySelector('#trend-refresh');

    refreshBtn.addEventListener('click', async () => {
      console.log('Refresh button clicked - loading live data with Bayesian smoothing');
      gsap.to(refreshBtn, { rotation: 360, duration: 0.6 });
      await this.loadLiveData();
    });

    // Listen for scenario updates
    window.addEventListener('scenario-updated', (e) => {
      console.log('Scenario updated event received:', e.detail);
      this.currentScenario = e.detail;
      this.loadData();
    });

    // Listen for city changes
    window.addEventListener('city-changed', (e) => {
      console.log('City changed event received:', e.detail);
      this.currentCity = e.detail.cityId;
      this.loadData();
    });

    // Listen for slider changes
    window.addEventListener('sliders-changed', (e) => {
      console.log('Sliders changed event received:', e.detail);
      this.currentScenario = e.detail;
      this.loadData();
    });

    // Listen for chat simulation
    window.addEventListener('chat-simulation', (e) => {
      console.log('Chat simulation event received:', e.detail);
      this.currentScenario = e.detail;
      this.loadData();
    });
  }

  /**
   * Initialize radar chart and start auto-refresh
   */
  initializeGraphs(container) {
    // Initialize Radar Chart
    this.radarChart = new SimpleRadarChart('radar-chart');
    const radarInitialized = this.radarChart.init(container);

    if (radarInitialized) {
      console.log('✓ Radar chart initialized');

      // Load initial live data
      this.loadLiveData();

      // Start auto-refresh every 5 minutes
      this.startAutoRefresh();
    } else {
      console.warn('✗ Failed to initialize radar chart');
    }
  }

  /**
   * Start auto-refresh timer (5 minutes)
   */
  startAutoRefresh() {
    // Clear any existing interval
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
    }

    // Set up auto-refresh every 5 minutes (300000ms)
    this.autoRefreshInterval = setInterval(() => {
      console.log('🔄 Auto-refresh triggered (5 min interval)');
      this.loadLiveData();
    }, 5 * 60 * 1000);

    console.log('✅ Auto-refresh enabled (every 5 minutes)');
  }

  /**
   * Stop auto-refresh timer
   */
  stopAutoRefresh() {
    if (this.autoRefreshInterval) {
      clearInterval(this.autoRefreshInterval);
      this.autoRefreshInterval = null;
      console.log('⏸️ Auto-refresh stopped');
    }
  }

  async loadData() {
    try {
      console.log(`Loading data for city ${this.currentCity}...`);

      // Get baseline state
      this.baselineState = await this.api.getCurrentState(this.currentCity);
      console.log('Baseline state:', this.baselineState);

      // Generate baseline projection (no scenario)
      this.baselineProjection = this.engine.generateBaseline(this.baselineState, 24);

      // Fallback: if no data, use generated fallback
      if (!this.baselineProjection || !this.baselineProjection.environmental_risk || this.baselineProjection.environmental_risk.length === 0) {
        console.warn('⚠ Baseline projection empty, using fallback');
        this.baselineProjection = this.generateFallbackData(24);
      }

      console.log('Baseline projection:', this.baselineProjection);

      // Generate simulation projection if scenario exists
      if (this.currentScenario) {
        this.simulationProjection = this.engine.runSimulation(
          this.baselineState,
          this.currentScenario,
          24
        );

        // Fallback: if no data, use generated fallback
        if (!this.simulationProjection || !this.simulationProjection.environmental_risk || this.simulationProjection.environmental_risk.length === 0) {
          console.warn('⚠ Simulation projection empty, using fallback');
          this.simulationProjection = this.generateFallbackData(24);
        }

        console.log('Simulation projection:', this.simulationProjection);
      } else {
        // Use baseline as simulation if no scenario
        this.simulationProjection = this.baselineProjection;
        console.log('No scenario - using baseline as simulation');
      }

      this.updateGraphs();
      this.updateStatistics();
    } catch (error) {
      console.error('Failed to load trend data:', error);
      // Use fallback on error
      console.warn('⚠ Error loading data, using fallback');
      this.baselineProjection = this.generateFallbackData(24);
      this.simulationProjection = this.generateFallbackData(24);
      this.updateGraphs();
      this.updateStatistics();
    }
  }

  /**
   * Load live data using LiveDataService with Bayesian smoothing
   * This is the new method that replaces loadMumbaiData
   */
  async loadLiveData() {
    const spinner = document.querySelector('#loading-spinner');
    const timestampEl = document.querySelector('#last-updated');

    try {
      // Show loading spinner
      if (spinner) spinner.style.display = 'inline';

      console.log('🔄 Loading live Mumbai data with Bayesian smoothing...');

      // Fetch live data from APIs
      const liveData = await this.liveDataService.fetchLiveData();

      // Calculate normalized risk scores (0-100) with Bayesian smoothing
      const riskScores = this.liveDataService.calculateRiskScores(
        liveData,
        this.previousRiskScores
      );

      // Store scores for next smoothing iteration
      this.previousRiskScores = riskScores;

      // Convert to chart data format
      const chartData = {
        heat_index_risk: [riskScores.heatwave],
        extreme_rainfall_prob: [riskScores.rainfall],
        coastal_flooding_risk: [riskScores.flood],
        power_grid_failure: [riskScores.power],
        traffic_congestion: [riskScores.traffic],
        hospital_capacity_stress: [riskScores.hospital],
        telecom_failure_risk: [riskScores.telecom],
        environmental_risk: [riskScores.airQuality],
        fire_hazard_risk: [riskScores.fire],
        public_health_outbreak: [riskScores.publicHealth]
      };

      // Metadata for enhanced tooltips
      const metadata = {
        isLive: true,
        timestamp: liveData.timestamp,
        rawData: liveData,
        sources: liveData.sources
      };

      // Update radar chart with live data and metadata
      if (this.radarChart) {
        this.radarChart.render(chartData, metadata);
      }

      console.log('✅ Live data loaded and rendered successfully');

      // Update timestamp
      if (timestampEl) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        timestampEl.textContent = `Last Updated: ${hours}:${minutes}:${seconds}`;
        timestampEl.style.color = '#10b981'; // Green color for success
      }

    } catch (error) {
      console.error('❌ Failed to load live data:', error);

      // Update timestamp with error indicator
      if (timestampEl) {
        timestampEl.textContent = 'Failed to load live data';
        timestampEl.style.color = '#ef4444'; // Red color for error
      }

    } finally {
      // Hide loading spinner
      if (spinner) spinner.style.display = 'none';
    }
  }

  /**
   * DEPRECATED: Old method - kept for backwards compatibility
   * Use loadLiveData() instead
   */
  async loadMumbaiData() {
    const spinner = document.querySelector('#loading-spinner');
    const timestampEl = document.querySelector('#last-updated');

    try {
      // Show loading spinner
      if (spinner) spinner.style.display = 'inline';

      console.log('🔄 Loading live Mumbai trend data...');

      // Force Mumbai city ID
      const mumbaiCityId = 1;
      this.currentCity = mumbaiCityId;

      // Fetch live Mumbai trends from OpenWeather API
      const liveTrends = await this.fetchMumbaiTrends();

      // Use live data for both baseline and simulation
      this.baselineProjection = liveTrends;
      this.simulationProjection = liveTrends;
      this.currentScenario = null; // No scenario for live data

      console.log('✅ Live Mumbai data loaded successfully');

      // Update graphs and statistics
      this.updateGraphs();
      this.updateStatistics();

      // Update timestamp
      if (timestampEl) {
        const now = new Date();
        const hours = String(now.getHours()).padStart(2, '0');
        const minutes = String(now.getMinutes()).padStart(2, '0');
        const seconds = String(now.getSeconds()).padStart(2, '0');
        timestampEl.textContent = `Last Updated: ${hours}:${minutes}:${seconds}`;
        timestampEl.style.color = '#10b981'; // Green color for success
      }

    } catch (error) {
      console.error('❌ Failed to load Mumbai trend data:', error);

      // Use fallback on error
      console.warn('⚠ Error loading Mumbai data, using fallback synthetic data');
      this.currentCity = 1; // Ensure Mumbai is shown
      this.baselineProjection = this.generateFallbackData(8);
      this.simulationProjection = this.generateFallbackData(8);
      this.updateGraphs();
      this.updateStatistics();

      // Update timestamp with error indicator
      if (timestampEl) {
        timestampEl.textContent = 'Failed to load live data';
        timestampEl.style.color = '#ef4444'; // Red color for error
      }

    } finally {
      // Hide loading spinner
      if (spinner) spinner.style.display = 'none';
    }
  }

  /**
   * Update radar chart with new data
   */
  updateGraphs() {
    if (!this.baselineProjection || !this.simulationProjection) {
      console.warn('No projection data available');
      return;
    }

    // Update Radar Chart
    if (this.radarChart) {
      console.log('Updating radar chart with new data...');
      this.radarChart.render(this.simulationProjection);
      console.log('✓ Radar chart updated');
    } else {
      console.warn('Radar chart not initialized');
    }
  }

  /**
   * Update statistics display
   */
  updateStatistics() {
    const scenarioType = document.querySelector('#scenario-type');
    const cityName = document.querySelector('#city-name');

    if (scenarioType) {
      scenarioType.textContent = this.currentScenario?.type || 'Baseline';
    }

    if (cityName) {
      const cityNames = { 1: 'Mumbai', 2: 'Delhi', 3: 'Bangalore' };
      cityName.textContent = cityNames[this.currentCity] || 'Unknown';
    }
  }

  cleanup() {
    // Stop auto-refresh timer
    this.stopAutoRefresh();
    console.log('🧹 TrendAnalysis cleaned up');
  }
}
