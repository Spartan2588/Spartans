export class ApiClient {
  constructor(baseUrl = '/api/v1') {
    this.baseUrl = baseUrl;
  }

  async getCurrentState(cityId = 1) {
    try {
      const response = await fetch(`${this.baseUrl}/current-state?city_id=${cityId}`);
      if (!response.ok) throw new Error('Failed to fetch current state');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async getRiskAssessment(cityId = 1) {
    try {
      const response = await fetch(`${this.baseUrl}/risk-assessment?city_id=${cityId}`);
      if (!response.ok) throw new Error('Failed to fetch risk assessment');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

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

  async getHistoricalData(cityId = 1, hours = 24) {
    try {
      const response = await fetch(`${this.baseUrl}/historical?city_id=${cityId}&hours=${hours}`);
      if (!response.ok) throw new Error('Failed to fetch historical data');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async getCities() {
    try {
      const response = await fetch(`${this.baseUrl}/cities`);
      if (!response.ok) throw new Error('Failed to fetch cities');
      return await response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  async getCascadingFailure(cityId = 1, trigger = 'power', severity = 0.8, duration = 24) {
    try {
      const url = `${this.baseUrl}/cascading-failure?city_id=${cityId}&trigger=${trigger}&severity=${severity}&duration=${duration}`;
      console.log('[API] Fetching cascade data from:', url);
      
      const response = await fetch(url);
      
      if (!response.ok) {
        // Try to parse error response
        let errorData = { message: `HTTP ${response.status}: ${response.statusText}` };
        try {
          const errorText = await response.text();
          if (errorText) {
            try {
              errorData = JSON.parse(errorText);
            } catch (e) {
              errorData = { message: errorText };
            }
          }
        } catch (e) {
          console.warn('[API] Could not parse error response:', e);
        }
        
        const error = new Error(errorData.message || errorData.error || `Failed to fetch cascading failure data: ${response.status}`);
        error.data = errorData;
        error.status = response.status;
        throw error;
      }
      
      const data = await response.json();
      console.log('[API] Cascade data received:', data);
      return data;
    } catch (error) {
      console.error('[API] Error fetching cascading failure:', error);
      
      // If it's already our custom error, re-throw it
      if (error.data || error.status) {
        throw error;
      }
      
      // Network errors (fetch fails completely)
      if (error.name === 'TypeError' && error.message.includes('fetch')) {
        throw new Error(`Network error: Cannot connect to backend server. Please ensure the server is running on port 5000. Original error: ${error.message}`);
      }
      
      // Other errors
      throw new Error(`Failed to fetch cascade data: ${error.message}`);
    }
  }
}
