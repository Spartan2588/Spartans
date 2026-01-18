import gsap from 'gsap';
import { ApiClient } from '../utils/api.js';
import { ScenarioResults } from './ScenarioResults.js';
import { ScenarioSliders } from './ScenarioSliders.js';
import '../styles/components/scenario-chat.css';

/**
 * ScenarioChat Component
 * Main interface for scenario simulation with:
 * - Current metrics display (before simulation)
 * - Natural language prompt input
 * - Preset scenario buttons
 * - Delta-based simulation results
 * - Manual slider adjustments
 */
export class ScenarioChat {
  constructor() {
    this.api = new ApiClient();
    this.isLoading = false;
    this.currentMetrics = null;
    this.selectedCity = 'Mumbai'; // STRICTLY MUMBAI
    this.lastResult = null;

    // Child components
    this.resultsComponent = new ScenarioResults();
    this.slidersComponent = new ScenarioSliders((customDeltas) => {
      this.runSimulationWithDeltas(customDeltas);
    });
  }

  render(container) {
    container.innerHTML = `
      <div class="scenario-chat">
        <!-- Current Metrics Display (Before Simulation) -->
        <div class="current-metrics-display" id="current-metrics">
          <div class="metrics-loading">Loading current conditions...</div>
        </div>

        <!-- Chat Input -->
        <div class="chat-input-wrapper">
          <form class="chat-form" id="scenario-form">
            <input
              type="text"
              class="chat-input"
              id="scenario-input"
              placeholder="What if a heatwave hits Mumbai?"
              autocomplete="off"
            >
            <button type="submit" class="chat-submit" id="submit-btn">
              <span class="submit-text">Simulate</span>
              <span class="submit-icon">→</span>
            </button>
          </form>
          <div class="chat-suggestions">
            <button class="suggestion-btn" data-scenario="heatwave">
              🔥 Heatwave
            </button>
            <button class="suggestion-btn" data-scenario="drought">
              🏜️ Drought
            </button>
            <button class="suggestion-btn" data-scenario="crisis">
              ⚠️ Crisis
            </button>
            <button class="suggestion-btn" data-scenario="flood">
              🌊 Flood
            </button>
            <button class="suggestion-btn" data-scenario="pollution_spike">
              💨 Pollution
            </button>
          </div>
        </div>

        <!-- Slider Controls -->
        <div class="sliders-container" id="sliders-container"></div>

        <!-- Results Display -->
        <div class="results-container" id="results-container"></div>
      </div>
    `;

    // Initialize
    this.setupEventListeners(container);
    this.fetchCurrentMetrics();
  }

  setupEventListeners(container) {
    const form = container.querySelector('#scenario-form');
    const input = container.querySelector('#scenario-input');
    const suggestions = container.querySelectorAll('.suggestion-btn');

    // Form submit
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = input.value.trim();
      if (query) {
        this.handleScenarioQuery(query);
        input.value = '';
      }
    });

    // Suggestion buttons
    suggestions.forEach(btn => {
      btn.addEventListener('click', () => {
        const scenario = btn.dataset.scenario;
        this.handlePresetScenario(scenario);
      });
    });

    // Focus animation
    input.addEventListener('focus', () => {
      gsap.to(container.querySelector('.chat-input-wrapper'), {
        boxShadow: '0 0 30px rgba(167, 139, 250, 0.3)',
        duration: 0.3
      });
    });

    input.addEventListener('blur', () => {
      gsap.to(container.querySelector('.chat-input-wrapper'), {
        boxShadow: '0 0 0px rgba(167, 139, 250, 0)',
        duration: 0.3
      });
    });
  }

  /**
   * Fetch current metrics for the selected city
   * This is displayed BEFORE any simulation
   */
  async fetchCurrentMetrics() {
    const metricsContainer = document.querySelector('#current-metrics');

    try {
      console.log(`[ScenarioChat] Fetching current metrics for ${this.selectedCity}`);
      const data = await this.api.getCurrentState(this.selectedCity);

      // Store metrics
      this.currentMetrics = {
        aqi: data.aqi,
        temperature: data.temperature,
        hospital_load: data.hospital_load || data.bed_occupancy_percent,
        crop_supply: data.crop_supply_index,
        timestamp: data.timestamp,
        data_freshness: data.data_freshness
      };

      // Render current metrics
      this.renderCurrentMetrics(metricsContainer, data);

      // Initialize sliders with baseline
      const slidersContainer = document.querySelector('#sliders-container');
      this.slidersComponent.setValues(this.currentMetrics, true);
      this.slidersComponent.render(slidersContainer);

    } catch (error) {
      console.error('Failed to fetch current metrics:', error);
      metricsContainer.innerHTML = `
        <div class="metrics-error">
          <span class="error-icon">⚠️</span>
          <span>Unable to load current conditions. Using estimated values.</span>
        </div>
      `;

      // Set default estimated values
      this.currentMetrics = {
        aqi: 100,
        temperature: 30,
        hospital_load: 50,
        crop_supply: 70
      };

      // Still render sliders with defaults
      const slidersContainer = document.querySelector('#sliders-container');
      this.slidersComponent.setValues(this.currentMetrics, true);
      this.slidersComponent.render(slidersContainer);
    }
  }

  /**
   * Render current metrics display
   */
  renderCurrentMetrics(container, data) {
    const formatFreshness = (freshness) => {
      if (!freshness) return 'Unknown';
      // Extract most recent date from freshness object
      const dates = Object.values(freshness).filter(d => d);
      if (dates.length === 0) return 'Unknown';
      return 'Recent data';
    };

    container.innerHTML = `
      <div class="current-metrics-card">
        <div class="metrics-header">
          <span class="metrics-icon">📊</span>
          <h4>Current Conditions — ${this.selectedCity}</h4>
          <span class="freshness-badge">${formatFreshness(data.data_freshness)}</span>
        </div>
        <div class="metrics-row">
          <div class="metric-item">
            <span class="metric-label">AQI</span>
            <span class="metric-value">${data.aqi?.toFixed(0) || 'N/A'}</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Temperature</span>
            <span class="metric-value">${data.temperature?.toFixed(1) || 'N/A'}°C</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Hospital Load</span>
            <span class="metric-value">${(data.hospital_load || data.bed_occupancy_percent)?.toFixed(0) || 'N/A'}%</span>
          </div>
          <div class="metric-item">
            <span class="metric-label">Food Availability</span>
            <span class="metric-value">${data.crop_supply_index?.toFixed(0) || 'N/A'}%</span>
          </div>
        </div>
      </div>
    `;

    // Animate in
    gsap.from(container.querySelector('.current-metrics-card'), {
      opacity: 0,
      y: -10,
      duration: 0.4,
      ease: 'power2.out'
    });
  }

  /**
   * Handle natural language scenario query
   * Uses the new delta-based simulation endpoint
   */
  async handleScenarioQuery(query) {
    if (this.isLoading) return;

    console.log(`[ScenarioChat] Processing query: "${query}"`);

    // Call delta-based API with custom_prompt
    await this.runSimulation({
      city: this.selectedCity,
      custom_prompt: query
    });
  }

  /**
   * Handle preset scenario button click
   */
  async handlePresetScenario(scenarioType) {
    if (this.isLoading) return;

    console.log(`[ScenarioChat] Running preset scenario: ${scenarioType}`);

    // Call delta-based API with scenario_type
    await this.runSimulation({
      city: this.selectedCity,
      scenario_type: scenarioType
    });
  }

  /**
   * Run simulation with custom deltas from sliders
   */
  async runSimulationWithDeltas(customDeltas) {
    if (this.isLoading) return;

    console.log(`[ScenarioChat] Running simulation with custom deltas:`, customDeltas);

    await this.runSimulation({
      city: this.selectedCity,
      custom_deltas: customDeltas
    });
  }

  /**
   * Core simulation execution
   * This is the ONLY place that calls the API
   */
  async runSimulation(params) {
    this.isLoading = true;
    const btn = document.querySelector('#submit-btn');
    const resultsContainer = document.querySelector('#results-container');

    // Show loading state
    gsap.to(btn, { opacity: 0.5, duration: 0.2 });
    resultsContainer.innerHTML = `
      <div class="simulation-loading">
        <div class="loading-spinner"></div>
        <span>Running simulation...</span>
      </div>
    `;

    try {
      // Call the NEW delta-based endpoint
      // NO HARDCODED VALUES - all values come from real baseline + deltas
      const result = await this.api.simulateScenarioDelta(params);

      console.log('[ScenarioChat] Simulation complete:', result);
      this.lastResult = result;

      // Update sliders to show simulated values
      this.slidersComponent.setValues({
        aqi: result.simulated.aqi,
        temperature: result.simulated.temperature,
        hospital_load: result.simulated.hospital_load,
        crop_supply: result.simulated.crop_supply
      }, false); // false = don't update baseline

      // Render results
      this.resultsComponent.render(resultsContainer, result);

      // Dispatch event for other components
      window.dispatchEvent(new CustomEvent('scenario-updated', { detail: result }));

      // Success feedback
      const input = document.querySelector('#scenario-input');
      gsap.to(input, {
        borderColor: 'rgba(16, 185, 129, 0.5)',
        duration: 0.3
      });
      setTimeout(() => {
        gsap.to(input, {
          borderColor: 'rgba(167, 139, 250, 0.2)',
          duration: 0.3
        });
      }, 1000);

    } catch (error) {
      console.error('[ScenarioChat] Simulation failed:', error);

      resultsContainer.innerHTML = `
        <div class="simulation-error">
          <span class="error-icon">❌</span>
          <span>Simulation failed: ${error.message}</span>
          <button class="retry-btn" onclick="this.closest('.scenario-chat').querySelector('#scenario-form').dispatchEvent(new Event('submit'))">
            Retry
          </button>
        </div>
      `;

      // Error feedback
      const input = document.querySelector('#scenario-input');
      gsap.to(input, {
        borderColor: 'rgba(239, 68, 68, 0.5)',
        duration: 0.3
      });
      setTimeout(() => {
        gsap.to(input, {
          borderColor: 'rgba(167, 139, 250, 0.2)',
          duration: 0.3
        });
      }, 2000);
    } finally {
      this.isLoading = false;
      gsap.to(btn, { opacity: 1, duration: 0.2 });
    }
  }

  /**
   * DEPRECATED: Old parseScenario method
   * This method is NO LONGER used - kept for reference only
   * All scenario parsing now happens on the backend using ScenarioDeltas
   */
  // parseScenario(query) {
  //   // THIS FUNCTION IS INTENTIONALLY REMOVED
  //   // It used hardcoded values which violated the requirements
  //   // The backend now handles all scenario inference using deltas
  //   throw new Error('parseScenario is deprecated - use delta-based API');
  // }
}
