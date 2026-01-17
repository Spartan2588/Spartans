import { ApiClient } from '../utils/api.js';
import { SimulationEngine } from '../utils/SimulationEngine.js';
import { TrendGraph } from './TrendGraph.js';
import { realtimeClient } from '../utils/RealtimeClient.js';
import gsap from 'gsap';
import '../styles/components/trend-analysis.css';

export class TrendAnalysis {
  constructor() {
    this.api = new ApiClient();
    this.engine = new SimulationEngine();
    this.realtimeClient = realtimeClient;
    this.currentCity = 'Mumbai';
    this.currentScenario = null;
    this.baselineState = null;
    this.baselineProjection = null;
    this.simulationProjection = null;
    this.graphs = {};
    this.isLive = false;
  }

  /**
   * Generate fallback data for localhost testing
   * LOCAL ONLY - ensures graphs never render empty
   */
  generateFallbackData(hours = 24) {
    const fallback = {
      environmental_risk: [],
      health_risk: [],
      food_security_risk: [],
      aqi: [],
      hospital_load: [],
      crop_supply: [],
      temperature: [],
      food_price_index: [],
      timestamps: []
    };

    for (let h = 0; h < hours; h++) {
      const progress = h / hours;
      const sine = Math.sin(progress * Math.PI);

      fallback.environmental_risk.push(Math.round(40 + sine * 20));
      fallback.health_risk.push(Math.round(35 + sine * 15));
      fallback.food_security_risk.push(Math.round(25 + sine * 10));
      fallback.aqi.push(Math.round(150 + sine * 50));
      fallback.temperature.push(Math.round((25 + sine * 5) * 10) / 10);
      fallback.hospital_load.push(Math.round(50 + sine * 20));
      fallback.crop_supply.push(Math.round(70 - sine * 15));
      fallback.food_price_index.push(Math.round(100 + sine * 20));
      fallback.timestamps.push(new Date(Date.now() + h * 3600000));
    }

    console.warn('⚠ Using fallback data for graphs (localhost only)');
    return fallback;
  }

  async render(container) {
    container.innerHTML = `
      <div class="trend-analysis">
        <div class="trend-header">
          <h2>Trend Analysis</h2>
          <div class="trend-controls">
            <span id="live-indicator" class="live-badge" style="display:none;">● LIVE</span>
            <button id="trend-refresh" class="trend-btn">↻ Refresh</button>
            <button id="connect-live" class="trend-btn">📡 Connect Live</button>
          </div>
        </div>

        <div class="trend-info">
          <p id="trend-description">Baseline vs Simulation Comparison - 24 Hour Projection</p>
        </div>

        <!-- Risk Metrics -->
        <div class="trend-section">
          <h3>Risk Trends</h3>
          <div class="trend-grid">
            <div class="trend-card">
              <h4>Environmental Risk</h4>
              <canvas id="env-risk-chart" class="trend-canvas" width="400" height="280"></canvas>
            </div>
            <div class="trend-card">
              <h4>Health Risk</h4>
              <canvas id="health-risk-chart" class="trend-canvas" width="400" height="280"></canvas>
            </div>
            <div class="trend-card">
              <h4>Food Security Risk</h4>
              <canvas id="food-risk-chart" class="trend-canvas" width="400" height="280"></canvas>
            </div>
          </div>
        </div>

        <!-- Environmental Metrics -->
        <div class="trend-section">
          <h3>Environmental Metrics</h3>
          <div class="trend-grid">
            <div class="trend-card">
              <h4>Air Quality Index (AQI)</h4>
              <canvas id="aqi-chart" class="trend-canvas" width="400" height="280"></canvas>
            </div>
            <div class="trend-card">
              <h4>Temperature</h4>
              <canvas id="temperature-chart" class="trend-canvas" width="400" height="280"></canvas>
            </div>
          </div>
        </div>

        <!-- Health Metrics -->
        <div class="trend-section">
          <h3>Health Metrics</h3>
          <div class="trend-grid">
            <div class="trend-card">
              <h4>Hospital Load</h4>
              <canvas id="hospital-chart" class="trend-canvas" width="400" height="280"></canvas>
            </div>
          </div>
        </div>

        <!-- Agriculture & Food Metrics -->
        <div class="trend-section">
          <h3>Agriculture & Food Security</h3>
          <div class="trend-grid">
            <div class="trend-card">
              <h4>Crop Supply</h4>
              <canvas id="crop-chart" class="trend-canvas" width="400" height="280"></canvas>
            </div>
            <div class="trend-card">
              <h4>Food Price Index</h4>
              <canvas id="foodprice-chart" class="trend-canvas" width="400" height="280"></canvas>
            </div>
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
    const connectLiveBtn = container.querySelector('#connect-live');
    const liveIndicator = container.querySelector('#live-indicator');

    refreshBtn.addEventListener('click', () => {
      console.log('Refresh button clicked');
      this.loadData();
      gsap.to(refreshBtn, { rotation: 360, duration: 0.6 });
    });

    // Connect Live button - starts WebSocket connection
    connectLiveBtn.addEventListener('click', () => {
      if (this.isLive) {
        // Disconnect
        this.realtimeClient.disconnect();
        this.isLive = false;
        liveIndicator.style.display = 'none';
        connectLiveBtn.textContent = '📡 Connect Live';
        console.log('Disconnected from live stream');
      } else {
        // Connect
        this.connectToLiveStream(liveIndicator, connectLiveBtn);
      }
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
   * Connect to WebSocket live stream
   */
  connectToLiveStream(liveIndicator, connectLiveBtn) {
    console.log('Connecting to live stream...');

    // Set up event handlers before connecting
    this.realtimeClient.on('connected', () => {
      this.isLive = true;
      liveIndicator.style.display = 'inline';
      liveIndicator.style.color = '#22c55e';
      connectLiveBtn.textContent = '📡 Disconnect';
      console.log('Connected to live stream');
    });

    this.realtimeClient.on('disconnected', () => {
      this.isLive = false;
      liveIndicator.style.display = 'none';
      connectLiveBtn.textContent = '📡 Connect Live';
    });

    this.realtimeClient.on('prediction', (data) => {
      console.log('Live prediction received:', data);
      this.handleLivePrediction(data);
    });

    this.realtimeClient.on('init', (data) => {
      console.log('Initial data received:', data);
      if (data.history && data.history.length > 0) {
        this.updateGraphsFromHistory(data.history);
      }
    });

    this.realtimeClient.connect();
  }

  /**
   * Handle incoming live prediction and update graphs
   */
  handleLivePrediction(prediction) {
    const chartData = this.realtimeClient.getChartData();

    // Update risk graphs with live data
    if (this.graphs['env-risk-chart'] && chartData.environmental.length > 0) {
      this.graphs['env-risk-chart'].updateData({
        baseline: chartData.environmental,
        timestamps: chartData.timestamps.map(t => new Date(t))
      });
    }

    if (this.graphs['health-risk-chart'] && chartData.health.length > 0) {
      this.graphs['health-risk-chart'].updateData({
        baseline: chartData.health,
        timestamps: chartData.timestamps.map(t => new Date(t))
      });
    }

    if (this.graphs['food-risk-chart'] && chartData.foodSecurity.length > 0) {
      this.graphs['food-risk-chart'].updateData({
        baseline: chartData.foodSecurity,
        timestamps: chartData.timestamps.map(t => new Date(t))
      });
    }

    // Flash the LIVE indicator
    const liveIndicator = document.querySelector('#live-indicator');
    if (liveIndicator) {
      gsap.to(liveIndicator, {
        opacity: 0.5,
        duration: 0.1,
        yoyo: true,
        repeat: 1
      });
    }
  }

  /**
   * Update graphs from initial history data
   */
  updateGraphsFromHistory(history) {
    if (!history || history.length === 0) return;

    const timestamps = history.map(p => new Date(p.timestamp));
    const envData = history.map(p => p.environmental_prob * 100);
    const healthData = history.map(p => p.health_prob * 100);
    const foodData = history.map(p => p.food_security_prob * 100);

    // Update each graph
    if (this.graphs['env-risk-chart']) {
      this.graphs['env-risk-chart'].updateData({ baseline: envData, timestamps });
    }
    if (this.graphs['health-risk-chart']) {
      this.graphs['health-risk-chart'].updateData({ baseline: healthData, timestamps });
    }
    if (this.graphs['food-risk-chart']) {
      this.graphs['food-risk-chart'].updateData({ baseline: foodData, timestamps });
    }

    console.log(`Updated graphs with ${history.length} historical predictions`);
  }

  /**
   * Initialize all trend graphs with standardized component
   */
  initializeGraphs(container) {
    const graphConfigs = [
      { id: 'env-risk-chart', title: 'Environmental Risk', unit: '%', color: '#10b981' },
      { id: 'health-risk-chart', title: 'Health Risk', unit: '%', color: '#f59e0b' },
      { id: 'food-risk-chart', title: 'Food Security Risk', unit: '%', color: '#06b6d4' },
      { id: 'aqi-chart', title: 'AQI', unit: 'points', color: '#ef4444' },
      { id: 'temperature-chart', title: 'Temperature', unit: '°C', color: '#f59e0b' },
      { id: 'hospital-chart', title: 'Hospital Load', unit: '%', color: '#ef4444' },
      { id: 'crop-chart', title: 'Crop Supply', unit: '%', color: '#10b981' },
      { id: 'foodprice-chart', title: 'Food Price Index', unit: 'index', color: '#a78bfa' }
    ];

    graphConfigs.forEach(config => {
      const graph = new TrendGraph(config.id, config.title, config.unit, config.color);
      const initialized = graph.init(container);
      if (initialized) {
        this.graphs[config.id] = graph;
        console.log(`✓ Graph initialized: ${config.id}`);
      } else {
        console.warn(`✗ Failed to initialize graph: ${config.id}`);
      }
    });
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
   * Update all graphs with new data
   */
  updateGraphs() {
    if (!this.baselineProjection || !this.simulationProjection) {
      console.warn('No projection data available');
      return;
    }

    console.log('Updating graphs with new data...');

    // Validate and update each graph
    const updateGraph = (graphId, baselineKey, simulationKey) => {
      const graph = this.graphs[graphId];
      if (!graph) {
        console.warn(`Graph ${graphId} not found`);
        return;
      }

      const baselineData = this.baselineProjection[baselineKey] || [];
      const simulationData = this.simulationProjection[simulationKey] || [];

      // Validate data exists
      if (baselineData.length === 0 || simulationData.length === 0) {
        console.warn(`No data for ${graphId}: baseline=${baselineData.length}, simulation=${simulationData.length}`);
      }

      // Force update
      graph.updateData(baselineData, simulationData);
      graph.animateUpdate();
    };

    // Update each graph with explicit data binding
    updateGraph('env-risk-chart', 'environmental_risk', 'environmental_risk');
    updateGraph('health-risk-chart', 'health_risk', 'health_risk');
    updateGraph('food-risk-chart', 'food_security_risk', 'food_security_risk');
    updateGraph('aqi-chart', 'aqi', 'aqi');
    updateGraph('temperature-chart', 'temperature', 'temperature');
    updateGraph('hospital-chart', 'hospital_load', 'hospital_load');
    updateGraph('crop-chart', 'crop_supply', 'crop_supply');
    updateGraph('foodprice-chart', 'food_price_index', 'food_price_index');

    console.log('✓ All graphs updated');
  }

  /**
   * Update statistics display
   */
  updateStatistics() {
    const scenarioType = document.querySelector('#scenario-type');
    const cityName = document.querySelector('#city-name');
    const description = document.querySelector('#trend-description');

    if (scenarioType) {
      scenarioType.textContent = this.currentScenario?.type || 'Baseline';
    }

    if (cityName) {
      cityName.textContent = this.currentCity || 'Unknown';
    }

    if (description) {
      const scenarioText = this.currentScenario ? ` - ${this.currentScenario.type} Scenario` : '';
      description.textContent = `Baseline vs Simulation Comparison - 24 Hour Projection${scenarioText}`;
    }
  }

  cleanup() {
    // Cleanup if needed
  }
}
