export class ApiClient {
  constructor(baseUrl = '/api/v1') {
    this.baseUrl = baseUrl;
  }

  async getCurrentState(city = 'Mumbai') {
    try {
      const response = await fetch(`${this.baseUrl}/current-state?city=${city}`);
      if (!response.ok) throw new Error('Failed to fetch current state');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async getRiskAssessment(city = 'Mumbai') {
    try {
      const response = await fetch(`${this.baseUrl}/risk-assessment?city=${city}`);
      if (!response.ok) throw new Error('Failed to fetch risk assessment');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Old scenario simulation endpoint (legacy)
   */
  async simulateScenario(params) {
    try {
      const response = await fetch(`${this.baseUrl}/scenario`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!response.ok) throw new Error('Failed to simulate scenario');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Delta-based scenario simulation endpoint (NEW)
   * Uses live baseline data and applies deltas for simulation
   * 
   * @param {Object} params - Simulation parameters
   * @param {string} params.city - City name (e.g., 'delhi', 'mumbai')
   * @param {string} [params.scenario_type] - Preset scenario: heatwave, drought, crisis, flood, pollution_spike
   * @param {string} [params.custom_prompt] - Natural language prompt for scenario inference
   * @param {Object} [params.custom_deltas] - Manual delta overrides: aqi_delta, temperature_delta, etc.
   * @returns {Promise<Object>} Simulation result with baseline, deltas, simulated, risks, validation
   */
  async simulateScenarioDelta(params) {
    try {
      console.log('[API] Calling /scenario-delta with:', params);

      const response = await fetch(`${this.baseUrl}/scenario-delta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to simulate delta scenario');
      }

      const result = await response.json();

      // Log validation info
      console.log('[VALIDATION] Simulation result:', {
        used_live_data: result.validation?.used_live_data,
        fallback_used: result.validation?.fallback_used,
        deltas_applied: result.validation?.deltas_applied,
        ml_executed: result.validation?.ml_executed
      });

      return result;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async getHistoricalData(city = 'Mumbai', hours = 24) {
    try {
      const response = await fetch(`${this.baseUrl}/historical?city=${city}&hours=${hours}`);
      if (!response.ok) throw new Error('Failed to fetch historical data');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  /**
   * Get scenario presets
   */
  async getScenarioPresets() {
    try {
      const response = await fetch(`${this.baseUrl}/scenario-presets`);
      if (!response.ok) throw new Error('Failed to fetch scenario presets');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }
}

