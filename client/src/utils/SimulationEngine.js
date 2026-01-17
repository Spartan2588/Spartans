/**
 * Simulation Engine
 * Generates time-series projections based on scenarios and interventions
 */

export class SimulationEngine {
  constructor() {
    this.baselineState = null;
    this.currentScenario = null;
    this.projectionHours = 24;
  }

  /**
   * Run simulation for a given scenario
   * Returns projected metrics over time
   */
  runSimulation(baselineState, scenario, hours = 24) {
    this.baselineState = baselineState || {
      aqi: 150,
      temperature: 25,
      hospital_load: 50,
      crop_supply: 70,
      food_price_index: 100
    };
    this.currentScenario = scenario;
    this.projectionHours = hours;

    const projection = {
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

    // Generate time series
    for (let h = 0; h < hours; h++) {
      const timestamp = new Date(Date.now() + h * 3600000);
      projection.timestamps.push(timestamp);

      // Calculate metrics at this hour
      const metrics = this.calculateMetricsAtHour(h, hours);

      projection.environmental_risk.push(metrics.environmental_risk);
      projection.health_risk.push(metrics.health_risk);
      projection.food_security_risk.push(metrics.food_security_risk);
      projection.aqi.push(metrics.aqi);
      projection.hospital_load.push(metrics.hospital_load);
      projection.crop_supply.push(metrics.crop_supply);
      projection.temperature.push(metrics.temperature);
      projection.food_price_index.push(metrics.food_price_index);
    }

    // Ensure all arrays have data
    console.log('✓ Simulation projection generated:', {
      environmental_risk: projection.environmental_risk.length,
      health_risk: projection.health_risk.length,
      temperature: projection.temperature.length,
      aqi: projection.aqi.length
    });

    return projection;
  }

  /**
   * Calculate metrics at a specific hour
   * Applies scenario effects and cascading impacts
   */
  calculateMetricsAtHour(hour, totalHours) {
    const progress = hour / totalHours;
    const scenarioIntensity = this.currentScenario?.intensity || 0;

    // Base values from baseline state
    const baseAqi = this.baselineState.aqi || 150;
    const baseTemp = this.baselineState.temperature || 25;
    const baseHospital = this.baselineState.hospital_load || 50;
    const baseCrop = this.baselineState.crop_supply || 70;
    const baseFoodPrice = this.baselineState.food_price_index || 100;

    // Apply scenario effects with time-based curves
    const aqiCurve = this.generateScenarioCurve(progress, scenarioIntensity, 'aqi');
    const tempCurve = this.generateScenarioCurve(progress, scenarioIntensity, 'temperature');
    const hospitalCurve = this.generateScenarioCurve(progress, scenarioIntensity, 'hospital');
    const cropCurve = this.generateScenarioCurve(progress, scenarioIntensity, 'crop');
    const foodPriceCurve = this.generateScenarioCurve(progress, scenarioIntensity, 'foodprice');

    // Calculate projected values
    const aqi = Math.max(0, baseAqi * (1 + aqiCurve));
    const temperature = baseTemp + tempCurve * 8;
    const hospital_load = Math.min(100, Math.max(0, baseHospital * (1 + hospitalCurve)));
    const crop_supply = Math.max(0, baseCrop * (1 + cropCurve));
    const food_price_index = baseFoodPrice * (1 + foodPriceCurve);

    // Calculate risk scores based on metrics (returns 0-1, convert to 0-100)
    const environmental_risk = Math.round(this.calculateEnvironmentalRisk(aqi, temperature) * 100);
    const health_risk = Math.round(this.calculateHealthRisk(hospital_load, temperature, aqi) * 100);
    const food_security_risk = Math.round(this.calculateFoodSecurityRisk(crop_supply, food_price_index) * 100);

    return {
      environmental_risk,
      health_risk,
      food_security_risk,
      aqi: Math.round(aqi),
      hospital_load: Math.round(hospital_load),
      crop_supply: Math.round(crop_supply),
      temperature: Math.round(temperature * 10) / 10,
      food_price_index: Math.round(food_price_index)
    };
  }

  /**
   * Generate scenario curve based on scenario type
   * Different scenarios have different temporal patterns
   */
  generateScenarioCurve(progress, intensity, metric) {
    const scenarioType = this.currentScenario?.type || 'baseline';

    switch (scenarioType) {
      case 'heatwave':
        return this.heatwaveCurve(progress, intensity, metric);
      case 'drought':
        return this.droughtCurve(progress, intensity, metric);
      case 'crisis':
        return this.crisisCurve(progress, intensity, metric);
      case 'intervention':
        return this.interventionCurve(progress, intensity, metric);
      default:
        return 0;
    }
  }

  /**
   * Heatwave scenario: rapid temperature rise, cascading health impacts
   */
  heatwaveCurve(progress, intensity, metric) {
    const peak = Math.sin(progress * Math.PI) * intensity;

    switch (metric) {
      case 'temperature':
        return peak * 1.5; // Temperature rises most
      case 'aqi':
        return peak * 0.8; // AQI increases due to heat
      case 'hospital':
        // Delayed health impact (2-4 hour lag)
        const healthDelay = Math.max(0, progress - 0.1);
        return Math.sin(healthDelay * Math.PI) * intensity * 0.6;
      case 'crop':
        return -peak * 0.7; // Crops suffer
      case 'foodprice':
        return peak * 0.5; // Food prices rise
      default:
        return 0;
    }
  }

  /**
   * Drought scenario: gradual crop decline, food security crisis
   */
  droughtCurve(progress, intensity, metric) {
    // Drought builds gradually
    const droughtBuild = Math.pow(progress, 1.5) * intensity;

    switch (metric) {
      case 'crop':
        return -droughtBuild * 1.2; // Crops decline significantly
      case 'foodprice':
        return droughtBuild * 1.5; // Food prices spike
      case 'aqi':
        return droughtBuild * 0.4; // Dust storms increase AQI
      case 'temperature':
        return droughtBuild * 0.6; // Hotter due to lack of moisture
      case 'hospital':
        // Delayed malnutrition/health impacts
        const healthDelay = Math.max(0, progress - 0.15);
        return Math.pow(healthDelay, 1.5) * intensity * 0.5;
      default:
        return 0;
    }
  }

  /**
   * Crisis scenario: rapid deterioration across all systems
   */
  crisisCurve(progress, intensity, metric) {
    // Crisis escalates exponentially
    const crisisEscalation = Math.pow(progress, 2) * intensity;

    switch (metric) {
      case 'aqi':
        return crisisEscalation * 1.2;
      case 'temperature':
        return crisisEscalation * 0.8;
      case 'hospital':
        return crisisEscalation * 1.0;
      case 'crop':
        return -crisisEscalation * 0.9;
      case 'foodprice':
        return crisisEscalation * 1.3;
      default:
        return 0;
    }
  }

  /**
   * Intervention scenario: mitigation reduces impacts
   */
  interventionCurve(progress, intensity, metric) {
    // Intervention improves conditions over time
    const improvement = Math.sin(progress * Math.PI) * (1 - intensity);

    switch (metric) {
      case 'aqi':
        return improvement * -0.3; // AQI improves
      case 'temperature':
        return improvement * -0.2;
      case 'hospital':
        return improvement * -0.25;
      case 'crop':
        return improvement * 0.4; // Crops recover
      case 'foodprice':
        return improvement * -0.3; // Prices stabilize
      default:
        return 0;
    }
  }

  /**
   * Calculate environmental risk (0-1)
   */
  calculateEnvironmentalRisk(aqi, temperature) {
    const aqiNorm = Math.min(aqi / 500, 1);
    const tempNorm = Math.max(0, Math.min((temperature - 20) / 30, 1));
    return (aqiNorm * 0.6 + tempNorm * 0.4);
  }

  /**
   * Calculate health risk (0-1)
   * Cascading effect: environmental impacts health
   */
  calculateHealthRisk(hospitalLoad, temperature, aqi) {
    const hospitalNorm = hospitalLoad / 100;
    const tempNorm = Math.max(0, Math.min((temperature - 20) / 30, 1));
    const aqiNorm = Math.min(aqi / 500, 1);

    // Cascading: high AQI and temperature increase health risk
    return (hospitalNorm * 0.4 + tempNorm * 0.3 + aqiNorm * 0.3);
  }

  /**
   * Calculate food security risk (0-1)
   * Cascading effect: crop decline and price increase
   */
  calculateFoodSecurityRisk(cropSupply, foodPrice) {
    const cropNorm = 1 - (cropSupply / 100);
    const priceNorm = Math.min(foodPrice / 200, 1);

    // Cascading: low crops and high prices increase food security risk
    return (cropNorm * 0.6 + priceNorm * 0.4);
  }

  /**
   * Generate baseline projection (no scenario)
   */
  generateBaseline(baselineState, hours = 24) {
    this.baselineState = baselineState || {
      aqi: 150,
      temperature: 25,
      hospital_load: 50,
      crop_supply: 70,
      food_price_index: 100
    };
    this.currentScenario = null;

    const projection = {
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
      const timestamp = new Date(Date.now() + h * 3600000);
      projection.timestamps.push(timestamp);

      // Baseline is relatively stable with minor fluctuations
      const variation = Math.sin(h / 24 * Math.PI * 2) * 0.05;

      const aqi = Math.round(this.baselineState.aqi * (1 + variation));
      const temperature = Math.round((this.baselineState.temperature + variation * 2) * 10) / 10;
      const hospital_load = Math.round(this.baselineState.hospital_load * (1 + variation * 0.5));
      const crop_supply = Math.round(this.baselineState.crop_supply * (1 + variation * 0.3));
      const food_price_index = Math.round(this.baselineState.food_price_index * (1 + variation * 0.2));

      projection.aqi.push(aqi);
      projection.temperature.push(temperature);
      projection.hospital_load.push(hospital_load);
      projection.crop_supply.push(crop_supply);
      projection.food_price_index.push(food_price_index);

      // Calculate risks as 0-100 values
      const envRisk = this.calculateEnvironmentalRisk(aqi, temperature);
      const healthRisk = this.calculateHealthRisk(hospital_load, temperature, aqi);
      const foodRisk = this.calculateFoodSecurityRisk(crop_supply, food_price_index);

      projection.environmental_risk.push(Math.round(envRisk * 100));
      projection.health_risk.push(Math.round(healthRisk * 100));
      projection.food_security_risk.push(Math.round(foodRisk * 100));
    }

    // Ensure all arrays have data
    console.log('✓ Baseline projection generated:', {
      environmental_risk: projection.environmental_risk.length,
      health_risk: projection.health_risk.length,
      temperature: projection.temperature.length,
      aqi: projection.aqi.length
    });

    return projection;
  }
}
