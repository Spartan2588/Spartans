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
}
