import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fetch from 'node-fetch';
import { RealTimeDataService } from './services/RealTimeDataService.js';
import { CrossDomainIntegration } from './services/CrossDomainIntegration.js';
import { ProductionScalability } from './services/ProductionScalability.js';
import './load-env.js'; // Load .env.local if it exists

// Make fetch available globally
global.fetch = fetch;

const app = express();
app.use(cors());
app.use(bodyParser.json());

// ============================================================================
// DATA LAYER - Real-Time Data Service
// ============================================================================

// Initialize real-time data service
const realTimeDataService = new RealTimeDataService();

// Legacy DataStore wrapper for compatibility
class DataStore {
  constructor() {
    this.cities = {
      1: { id: 1, name: 'Mumbai', lat: 19.0760, lng: 72.8777 },
      2: { id: 2, name: 'Delhi', lat: 28.7041, lng: 77.1025 },
      3: { id: 3, name: 'Bangalore', lat: 12.9716, lng: 77.5946 }
    };
  }

  async getCurrentState(cityId) {
    try {
      // Fetch real-time data
      const state = await realTimeDataService.getCurrentState(cityId);
      console.log(`[DataStore] Fetched real-time data for city ${cityId}:`, state);
      return state;
    } catch (error) {
      console.error(`[DataStore] Error fetching real-time data:`, error);
      // Fallback to basic data structure
      return {
        city: this.cities[cityId]?.name || 'Unknown',
        timestamp: new Date().toISOString(),
        aqi: 150,
        hospital_load: 50,
        temperature: 25,
        crop_supply: 70,
        food_price_index: 100,
        traffic_density: 'medium'
      };
    }
  }

  async getHistoricalData(cityId, hours = 24) {
    try {
      // Fetch real-time historical data
      const data = await realTimeDataService.getHistoricalData(cityId, hours);
      console.log(`[DataStore] Fetched historical data for city ${cityId}`);
      return data;
    } catch (error) {
      console.error(`[DataStore] Error fetching historical data:`, error);
      // Return empty structure as fallback
      return {
        aqi: [],
        hospital_load: [],
        crop_supply: [],
        temperature: [],
        food_price_index: []
      };
    }
  }
}

// ============================================================================
// ANALYTICS LAYER - Risk Scoring & Algorithms
// ============================================================================

class RiskAnalytics {
  /**
   * Calculate risk level based on normalized inputs
   * Combines multiple factors with weighted scoring
   */
  static calculateRiskLevel(aqi, temperature, hospitalLoad, cropSupply) {
    // Normalize inputs to 0-1 scale
    const aqiNorm = Math.min(aqi / 500, 1);
    const tempNorm = Math.max(0, Math.min((temperature - 20) / 30, 1)); // 20-50°C range
    const hospitalNorm = hospitalLoad / 100;
    const cropNorm = 1 - (cropSupply / 100); // Inverse: low supply = high risk

    // Weighted scoring (total weight = 1.0)
    const weights = {
      aqi: 0.35,
      temperature: 0.25,
      hospital: 0.25,
      crop: 0.15
    };

    const riskScore = (
      aqiNorm * weights.aqi +
      tempNorm * weights.temperature +
      hospitalNorm * weights.hospital +
      cropNorm * weights.crop
    );

    // Convert to level and probability
    let level, probability;
    if (riskScore < 0.33) {
      level = 'low';
      probability = Math.round(riskScore * 100);
    } else if (riskScore < 0.66) {
      level = 'medium';
      probability = Math.round(riskScore * 100);
    } else {
      level = 'high';
      probability = Math.round(riskScore * 100);
    }

    return { level, probability, score: riskScore };
  }

  /**
   * Calculate environmental risk based on AQI and temperature
   */
  static calculateEnvironmentalRisk(aqi, temperature) {
    const aqiNorm = Math.min(aqi / 500, 1);
    const tempNorm = Math.max(0, Math.min((temperature - 20) / 30, 1));

    const envScore = aqiNorm * 0.6 + tempNorm * 0.4;

    let level;
    if (envScore < 0.33) level = 'low';
    else if (envScore < 0.66) level = 'medium';
    else level = 'high';

    return {
      level,
      probability: Math.round(envScore * 100),
      score: envScore
    };
  }

  /**
   * Calculate health risk based on hospital load and temperature
   */
  static calculateHealthRisk(hospitalLoad, temperature) {
    const hospitalNorm = hospitalLoad / 100;
    const tempNorm = Math.max(0, Math.min((temperature - 20) / 30, 1));

    const healthScore = hospitalNorm * 0.7 + tempNorm * 0.3;

    let level;
    if (healthScore < 0.33) level = 'low';
    else if (healthScore < 0.66) level = 'medium';
    else level = 'high';

    return {
      level,
      probability: Math.round(healthScore * 100),
      score: healthScore
    };
  }

  /**
   * Calculate food security risk based on crop supply and price
   */
  static calculateFoodSecurityRisk(cropSupply, foodPriceIndex) {
    const cropNorm = 1 - (cropSupply / 100); // Low supply = high risk
    const priceNorm = Math.max(0, Math.min((foodPriceIndex - 100) / 50, 1)); // 100-150 range

    const foodScore = cropNorm * 0.6 + priceNorm * 0.4;

    let level;
    if (foodScore < 0.33) level = 'low';
    else if (foodScore < 0.66) level = 'medium';
    else level = 'high';

    return {
      level,
      probability: Math.round(foodScore * 100),
      score: foodScore
    };
  }

  /**
   * Simulate scenario impact with intervention
   */
  static simulateScenario(params) {
    const baseline = {
      environmental_risk: this.calculateEnvironmentalRisk(150, 25),
      health_risk: this.calculateHealthRisk(50, 25),
      food_security_risk: this.calculateFoodSecurityRisk(70, 100)
    };

    // Apply intervention (reduce by 20-30%)
    const interventionFactor = 0.75; // 25% reduction

    const intervention = {
      environmental_risk: this.calculateEnvironmentalRisk(
        params.aqi * interventionFactor,
        params.temperature * 0.95
      ),
      health_risk: this.calculateHealthRisk(
        params.hospital_load * interventionFactor,
        params.temperature * 0.95
      ),
      food_security_risk: this.calculateFoodSecurityRisk(
        params.crop_supply * 1.1, // Slight improvement
        100
      )
    };

    // Calculate economic impact
    const economicImpact = this.calculateEconomicImpact(
      baseline,
      intervention,
      params
    );

    return {
      baseline,
      intervention,
      economic_impact: economicImpact,
      changes: {
        environmental: {
          level_change: baseline.environmental_risk.level !== intervention.environmental_risk.level,
          probability_change: intervention.environmental_risk.probability - baseline.environmental_risk.probability
        },
        health: {
          level_change: baseline.health_risk.level !== intervention.health_risk.level,
          probability_change: intervention.health_risk.probability - baseline.health_risk.probability
        },
        food: {
          level_change: baseline.food_security_risk.level !== intervention.food_security_risk.level,
          probability_change: intervention.food_security_risk.probability - baseline.food_security_risk.probability
        }
      }
    };
  }

  /**
   * Calculate economic impact of intervention
   */
  static calculateEconomicImpact(baseline, intervention, params) {
    // Base intervention cost (scales with severity)
    const avgBaselineRisk = (
      baseline.environmental_risk.score +
      baseline.health_risk.score +
      baseline.food_security_risk.score
    ) / 3;

    const interventionCost = Math.round(100000 + avgBaselineRisk * 400000);

    // Savings calculation (based on risk reduction)
    const avgInterventionRisk = (
      intervention.environmental_risk.score +
      intervention.health_risk.score +
      intervention.food_security_risk.score
    ) / 3;

    const riskReduction = avgBaselineRisk - avgInterventionRisk;
    const totalSavings = Math.round(riskReduction * 2000000);

    // ROI calculation
    const roi = totalSavings > 0 ? (totalSavings / interventionCost).toFixed(2) : 0;

    return {
      intervention_cost: interventionCost,
      total_savings: totalSavings,
      roi: parseFloat(roi),
      payback_period_months: totalSavings > 0 ? Math.round((interventionCost / totalSavings) * 12) : 0
    };
  }
}

// ============================================================================
// CASCADE PREDICTION LAYER - Multi-Hazard Cascade Analysis
// ============================================================================

class CascadeAnalytics {
  /**
   * Infrastructure dependency graph
   * Each domain has dependencies (what it needs) and dependents (what depends on it)
   * Dependency strength: 0.0 (no dependency) to 1.0 (complete dependency)
   */
  static INFRASTRUCTURE_GRAPH = {
    power: {
      dependencies: {},
      dependents: {
        water: 0.9,
        traffic: 0.85,
        communications: 0.95,
        emergency: 0.9,
        healthcare: 0.85,
        transport: 0.8,
        financial: 0.95
      },
      resilience: 0.3,
      recovery_rate: 0.15,
      backup_capacity: 0.4
    },
    water: {
      dependencies: { power: 0.9 },
      dependents: {
        healthcare: 0.8,
        emergency: 0.7,
        residential: 0.95,
        food_supply: 0.6
      },
      resilience: 0.25,
      recovery_rate: 0.12,
      backup_capacity: 0.3
    },
    traffic: {
      dependencies: { power: 0.85 },
      dependents: {
        transport: 0.95,
        emergency: 0.6,
        economic: 0.7
      },
      resilience: 0.4,
      recovery_rate: 0.25,
      backup_capacity: 0.2
    },
    communications: {
      dependencies: { power: 0.95 },
      dependents: {
        emergency: 0.85,
        financial: 0.9,
        healthcare: 0.7,
        government: 0.8
      },
      resilience: 0.35,
      recovery_rate: 0.2,
      backup_capacity: 0.5
    },
    emergency: {
      dependencies: {
        power: 0.9,
        communications: 0.85,
        water: 0.7,
        traffic: 0.6
      },
      dependents: {
        public_safety: 0.95,
        disaster_response: 1.0
      },
      resilience: 0.5,
      recovery_rate: 0.3,
      backup_capacity: 0.6
    },
    healthcare: {
      dependencies: {
        power: 0.85,
        water: 0.8,
        communications: 0.7
      },
      dependents: {
        public_health: 0.95,
        emergency: 0.6
      },
      resilience: 0.4,
      recovery_rate: 0.18,
      backup_capacity: 0.5
    },
    transport: {
      dependencies: {
        power: 0.8,
        traffic: 0.95
      },
      dependents: {
        economic: 0.8,
        emergency: 0.5
      },
      resilience: 0.35,
      recovery_rate: 0.22,
      backup_capacity: 0.3
    },
    financial: {
      dependencies: {
        power: 0.95,
        communications: 0.9
      },
      dependents: {
        economic: 0.95,
        government: 0.7
      },
      resilience: 0.45,
      recovery_rate: 0.28,
      backup_capacity: 0.7
    }
  };

  /**
   * Economic impact costs per domain (USD per severity point per hour)
   */
  static ECONOMIC_IMPACT_COSTS = {
    power: 5000000,
    water: 2000000,
    traffic: 1500000,
    communications: 3000000,
    emergency: 4000000,
    healthcare: 6000000,
    transport: 2500000,
    financial: 8000000
  };

  /**
   * Population impact factors (percentage of city population affected per severity point)
   */
  static POPULATION_IMPACT = {
    power: 0.8,
    water: 0.9,
    traffic: 0.5,
    communications: 0.7,
    emergency: 0.6,
    healthcare: 0.4,
    transport: 0.3,
    financial: 0.5
  };

  /**
   * Calculate cascading failure propagation
   * @param {string} trigger - Initial failure domain
   * @param {number} severity - Failure severity (0-1)
   * @param {number} cityId - City identifier
   * @param {DataStore} dataStore - DataStore instance for accessing city data
   * @param {number} duration - Simulation duration in hours (default: 24)
   * @param {Object} currentState - Real-time current state (optional, will fetch if not provided)
   */
  static async calculateCascade(trigger, severity, cityId, dataStore, duration = 24, currentState = null) {
    // Validate inputs
    if (!this.INFRASTRUCTURE_GRAPH[trigger]) {
      throw new Error(`Invalid trigger domain: ${trigger}`);
    }
    if (severity < 0 || severity > 1) {
      throw new Error('Severity must be between 0 and 1');
    }

    const cascades = [];
    const timeline = [];
    const impactedDomains = new Set([trigger]);

    // Get city data from DataStore (real-time data)
    const cityInfo = dataStore.cities[cityId];
    if (!currentState) {
      currentState = await dataStore.getCurrentState(cityId);
    }

    // Use real city population (in millions) - derived from city size/importance
    const cityPopulations = {
      1: 20.4,  // Mumbai - India's financial capital
      2: 32.9,  // Delhi - National capital, largest metro area
      3: 12.3   // Bangalore - IT hub
    };
    const cityPopulation = cityPopulations[cityId] || 15;

    // Use real-time metrics to adjust cascade severity
    // Higher AQI, temperature, and hospital load increase cascade probability
    const aqiFactor = Math.min(1.5, 1 + (currentState.aqi / 500) * 0.5);
    const tempFactor = Math.min(1.3, 1 + ((currentState.temperature - 25) / 25) * 0.3);
    const hospitalFactor = Math.min(1.4, 1 + (currentState.hospital_load / 100) * 0.4);
    
    // Adjust initial severity based on real-time conditions
    const adjustedSeverity = Math.min(1.0, severity * aqiFactor * tempFactor * hospitalFactor);
    console.log(`[CASCADE] Real-time factors - AQI: ${aqiFactor.toFixed(2)}, Temp: ${tempFactor.toFixed(2)}, Hospital: ${hospitalFactor.toFixed(2)}`);
    console.log(`[CASCADE] Adjusted severity: ${severity} -> ${adjustedSeverity.toFixed(2)}`);

    // Track severity per domain over time (use adjusted severity)
    let currentSeverities = { [trigger]: adjustedSeverity };
    let previousSeverities = {};

    // Simulate hour by hour
    for (let hour = 0; hour <= duration; hour++) {
      const newCascades = [];

      // Check each currently impacted domain
      for (const [domain, domainSeverity] of Object.entries(currentSeverities)) {
        const domainInfo = this.INFRASTRUCTURE_GRAPH[domain];

        // Propagate to dependents
        if (domainInfo.dependents) {
          for (const [dependent, dependencyStrength] of Object.entries(domainInfo.dependents)) {
            // Calculate cascade probability and severity
            const cascadeSeverity = this.calculateCascadeSeverity(
              domainSeverity,
              dependencyStrength,
              domainInfo.resilience,
              hour
            );

            // Only cascade if severity is significant and domain not already failed
            if (cascadeSeverity > 0.1 && !impactedDomains.has(dependent)) {
              const cascade = {
                domain: dependent,
                impact_time_hours: hour + (Math.random() * 0.5), // Add jitter
                severity: Math.round(cascadeSeverity * 100) / 100,
                cause: domain,
                dependency_strength: dependencyStrength,
                affected_infrastructure: this.getAffectedInfrastructure(dependent, cascadeSeverity)
              };

              newCascades.push(cascade);
              impactedDomains.add(dependent);
              currentSeverities[dependent] = cascadeSeverity;
            } else if (impactedDomains.has(dependent)) {
              // Update existing failure severity (compound effect)
              const compoundSeverity = Math.min(1.0,
                (currentSeverities[dependent] || 0) + cascadeSeverity * 0.3
              );
              currentSeverities[dependent] = compoundSeverity;
            }
          }
        }
      }

      cascades.push(...newCascades);

      // Apply recovery
      previousSeverities = { ...currentSeverities };
      currentSeverities = this.applyRecovery(currentSeverities, hour);

      // Record timeline snapshot
      const totalSeverity = Object.values(currentSeverities).reduce((a, b) => a + b, 0);
      timeline.push({
        hour,
        affected_domains: impactedDomains.size,
        total_severity: Math.round(totalSeverity * 100) / 100,
        active_failures: Object.keys(currentSeverities).length,
        domains: Object.keys(currentSeverities)
      });
    }

    // Calculate total impact
    const totalImpact = this.calculateTotalImpact(
      cascades,
      timeline,
      cityPopulation,
      duration
    );

    // Generate recommendations
    const recommendations = this.generateRecommendations(
      trigger,
      severity,
      cascades,
      totalImpact
    );

    return {
      trigger: {
        domain: trigger,
        severity: adjustedSeverity,
        initial_impact: this.getAffectedInfrastructure(trigger, adjustedSeverity)
      },
      cascades: cascades.sort((a, b) => a.impact_time_hours - b.impact_time_hours),
      timeline,
      total_impact: totalImpact,
      recommendations
    };
  }

  /**
   * Calculate cascade severity based on dependency and resilience
   */
  static calculateCascadeSeverity(sourceSeverity, dependencyStrength, resilience, hour) {
    // Base cascade calculation
    let cascadeSeverity = sourceSeverity * dependencyStrength;

    // Apply resilience factor (reduces impact)
    cascadeSeverity *= (1 - resilience * 0.5);

    // Time decay (failures get slightly worse over time without intervention)
    const timeMultiplier = 1 + (hour * 0.02);
    cascadeSeverity *= timeMultiplier;

    // Cap at 1.0
    return Math.min(1.0, cascadeSeverity);
  }

  /**
   * Apply recovery over time
   */
  static applyRecovery(severities, hour) {
    const recovered = {};

    for (const [domain, severity] of Object.entries(severities)) {
      const domainInfo = this.INFRASTRUCTURE_GRAPH[domain];

      // Skip domains not in our dependency graph
      if (!domainInfo) {
        continue;
      }

      const recoveryAmount = domainInfo.recovery_rate * domainInfo.backup_capacity;

      // Recovery kicks in after 2 hours
      const newSeverity = hour > 2
        ? Math.max(0, severity - recoveryAmount)
        : severity;

      if (newSeverity > 0.05) {
        recovered[domain] = newSeverity;
      }
    }

    return recovered;
  }

  /**
   * Get affected infrastructure components
   */
  static getAffectedInfrastructure(domain, severity) {
    const infrastructure = {
      power: ['power_plants', 'substations', 'distribution_grid', 'transformers'],
      water: ['pumping_stations', 'treatment_plants', 'distribution_network', 'reservoirs'],
      traffic: ['traffic_lights', 'signaling_systems', 'smart_roads', 'parking_systems'],
      communications: ['cell_towers', 'data_centers', 'fiber_network', 'satellite_links'],
      emergency: ['dispatch_centers', 'fire_stations', 'police_stations', 'ambulance_services'],
      healthcare: ['hospitals', 'clinics', 'emergency_rooms', 'medical_supply_chain'],
      transport: ['metro_systems', 'bus_networks', 'railways', 'airports'],
      financial: ['banks', 'atm_network', 'payment_systems', 'stock_exchange']
    };

    const components = infrastructure[domain] || [];
    const affectedCount = Math.ceil(components.length * severity);

    return components.slice(0, affectedCount);
  }

  /**
   * Calculate total impact metrics
   */
  static calculateTotalImpact(cascades, timeline, cityPopulation, duration) {
    // Find peak severity
    const peakTimeline = timeline.reduce((max, curr) =>
      curr.total_severity > max.total_severity ? curr : max
    );

    // Calculate economic cost
    let totalEconomicCost = 0;
    const domainCosts = {};

    cascades.forEach(cascade => {
      const hourlyCost = this.ECONOMIC_IMPACT_COSTS[cascade.domain] * cascade.severity;
      const durationCost = hourlyCost * duration;
      totalEconomicCost += durationCost;
      domainCosts[cascade.domain] = (domainCosts[cascade.domain] || 0) + durationCost;
    });

    // Calculate affected population
    let affectedPopulation = 0;
    const uniqueDomains = new Set(cascades.map(c => c.domain));
    uniqueDomains.forEach(domain => {
      const maxSeverity = Math.max(...cascades.filter(c => c.domain === domain).map(c => c.severity));
      affectedPopulation += cityPopulation * this.POPULATION_IMPACT[domain] * maxSeverity;
    });

    // Estimate recovery time
    const avgRecoveryRate = Array.from(uniqueDomains).reduce((sum, domain) => {
      const domainInfo = this.INFRASTRUCTURE_GRAPH[domain];
      // Skip undefined domains
      if (!domainInfo) return sum;
      return sum + domainInfo.recovery_rate;
    }, 0) / uniqueDomains.size;

    const recoveryTime = Math.ceil(peakTimeline.total_severity / avgRecoveryRate);

    return {
      affected_domains: uniqueDomains.size,
      peak_severity_time_hours: peakTimeline.hour,
      peak_total_severity: peakTimeline.total_severity,
      population_affected: Math.round(affectedPopulation * 1000000),
      estimated_economic_cost: Math.round(totalEconomicCost),
      economic_cost_by_domain: domainCosts,
      recovery_time_hours: recoveryTime,
      cascade_depth: cascades.length
    };
  }

  /**
   * Generate actionable recommendations
   */
  static generateRecommendations(trigger, severity, cascades, totalImpact) {
    const recommendations = [];

    // Trigger-specific recommendations
    const triggerRecs = {
      power: [
        'Activate backup power systems for critical infrastructure',
        'Deploy mobile generators to hospitals and emergency services',
        'Implement rolling blackout schedule to preserve grid stability'
      ],
      water: [
        'Activate emergency water reserves',
        'Deploy water tankers to critical facilities',
        'Issue water conservation advisory to residents'
      ],
      traffic: [
        'Deploy manual traffic management teams',
        'Activate alternative transportation routes',
        'Implement emergency traffic signal protocols'
      ],
      communications: [
        'Activate backup communication systems (satellite, radio)',
        'Establish emergency communication centers',
        'Deploy mobile cell towers to critical areas'
      ],
      emergency: [
        'Activate mutual aid agreements with neighboring jurisdictions',
        'Deploy National Guard/military support',
        'Establish emergency operations center'
      ],
      healthcare: [
        'Activate hospital surge capacity protocols',
        'Deploy mobile medical units',
        'Coordinate with regional healthcare network'
      ],
      transport: [
        'Activate emergency public transportation plan',
        'Deploy shuttle services for critical workers',
        'Establish alternative transportation hubs'
      ],
      financial: [
        'Activate business continuity plans',
        'Enable offline payment systems',
        'Coordinate with central bank for emergency liquidity'
      ]
    };

    recommendations.push(...(triggerRecs[trigger] || []));

    // Severity-based recommendations
    if (severity > 0.7) {
      recommendations.push('Declare state of emergency');
      recommendations.push('Activate all emergency response protocols');
      recommendations.push('Request state/federal assistance');
    }

    // Cascade-specific recommendations
    const affectedDomains = new Set(cascades.map(c => c.domain));

    if (affectedDomains.has('emergency')) {
      recommendations.push('Establish alternative emergency dispatch centers');
      recommendations.push('Pre-position emergency response teams');
    }

    if (affectedDomains.has('healthcare')) {
      recommendations.push('Activate hospital diversion protocols');
      recommendations.push('Stockpile critical medical supplies');
    }

    if (totalImpact.affected_domains > 5) {
      recommendations.push('Coordinate multi-agency response');
      recommendations.push('Establish unified command structure');
      recommendations.push('Implement price controls to prevent gouging');
    }

    // Communication recommendations
    recommendations.push('Issue public safety announcements via all available channels');
    recommendations.push('Activate community emergency notification systems');

    return recommendations.slice(0, 8); // Return top 8 recommendations
  }
}

// ============================================================================
// API ENDPOINTS
// ============================================================================

const dataStore = new DataStore();
const crossDomainIntegration = new CrossDomainIntegration();
const scalability = new ProductionScalability();

/**
 * GET /api/v1/current-state?city_id={city}
 * Returns current metrics for a city (REAL-TIME DATA)
 */
app.get('/api/v1/current-state', async (req, res) => {
  try {
    const cityId = parseInt(req.query.city_id) || 1;

    if (!dataStore.cities[cityId]) {
      return res.status(400).json({ error: 'Invalid city_id' });
    }

    const state = await dataStore.getCurrentState(cityId);
    res.json(state);
  } catch (error) {
    console.error('[API] Error in current-state:', error);
    res.status(500).json({ error: 'Failed to fetch current state', message: error.message });
  }
});

/**
 * GET /api/v1/risk-assessment?city_id={city}
 * Returns risk assessment for a city (REAL-TIME DATA)
 */
app.get('/api/v1/risk-assessment', async (req, res) => {
  try {
    const cityId = parseInt(req.query.city_id) || 1;

    if (!dataStore.cities[cityId]) {
      return res.status(400).json({ error: 'Invalid city_id' });
    }

    const state = await dataStore.getCurrentState(cityId);

    const risks = {
      environmental_risk: RiskAnalytics.calculateEnvironmentalRisk(state.aqi, state.temperature),
      health_risk: RiskAnalytics.calculateHealthRisk(state.hospital_load, state.temperature),
      food_security_risk: RiskAnalytics.calculateFoodSecurityRisk(state.crop_supply, state.food_price_index)
    };

    res.json(risks);
  } catch (error) {
    console.error('[API] Error in risk-assessment:', error);
    res.status(500).json({ error: 'Failed to fetch risk assessment', message: error.message });
  }
});

/**
 * POST /api/v1/scenario
 * Simulates scenario with given parameters
 * Body: { aqi, hospital_load, crop_supply, temperature }
 */
app.post('/api/v1/scenario', (req, res) => {
  const { aqi, hospital_load, crop_supply, temperature } = req.body;

  // Validate inputs
  if (typeof aqi !== 'number' || typeof hospital_load !== 'number' ||
    typeof crop_supply !== 'number' || typeof temperature !== 'number') {
    return res.status(400).json({ error: 'Invalid parameters' });
  }

  const result = RiskAnalytics.simulateScenario({
    aqi: Math.max(0, Math.min(500, aqi)),
    hospital_load: Math.max(0, Math.min(100, hospital_load)),
    crop_supply: Math.max(0, Math.min(100, crop_supply)),
    temperature: Math.max(20, Math.min(50, temperature))
  });

  res.json(result);
});

/**
 * GET /api/v1/historical?city_id={city}&hours={hours}
 * Returns historical data for a city (REAL-TIME DATA)
 */
app.get('/api/v1/historical', async (req, res) => {
  try {
    const cityId = parseInt(req.query.city_id) || 1;
    const hours = parseInt(req.query.hours) || 24;

    if (!dataStore.cities[cityId]) {
      return res.status(400).json({ error: 'Invalid city_id' });
    }

    const historical = await dataStore.getHistoricalData(cityId, Math.min(hours, 24));
    res.json(historical);
  } catch (error) {
    console.error('[API] Error in historical:', error);
    res.status(500).json({ error: 'Failed to fetch historical data', message: error.message });
  }
});

/**
 * GET /api/v1/cities
 * Returns list of available cities
 */
app.get('/api/v1/cities', (req, res) => {
  res.json(Object.values(dataStore.cities));
});

/**
 * GET /api/v1/cascading-failure?city_id={city}&trigger={domain}&severity={0-1}&duration={hours}
 * Simulates cascading infrastructure failures
 * 
 * Query Parameters:
 *   - city_id (required): City identifier (1-3)
 *   - trigger (required): Initial failure domain (power, water, traffic, communications, emergency, healthcare, transport, financial)
 *   - severity (required): Failure magnitude (0.0 to 1.0)
 *   - duration (optional): Simulation hours (default: 24, max: 72)
 */
app.get('/api/v1/cascading-failure', async (req, res) => {
  try {
    console.log('[CASCADE] Request received:', req.query);

    // Parse and validate parameters
    const cityId = parseInt(req.query.city_id);
    const trigger = req.query.trigger;
    const severity = parseFloat(req.query.severity);
    const duration = parseInt(req.query.duration) || 24;

    console.log('[CASCADE] Parsed params:', { cityId, trigger, severity, duration });

    // Validate city_id
    if (!cityId || !dataStore.cities[cityId]) {
      console.log('[CASCADE] Invalid city_id:', cityId);
      return res.status(400).json({
        error: 'Invalid city_id',
        message: 'city_id must be 1 (Mumbai), 2 (Delhi), or 3 (Bangalore)'
      });
    }

    // Validate trigger
    const validTriggers = ['power', 'water', 'traffic', 'communications', 'emergency', 'healthcare', 'transport', 'financial'];
    if (!trigger || !validTriggers.includes(trigger)) {
      console.log('[CASCADE] Invalid trigger:', trigger);
      return res.status(400).json({
        error: 'Invalid trigger',
        message: `trigger must be one of: ${validTriggers.join(', ')}`
      });
    }

    // Validate severity
    if (isNaN(severity) || severity < 0 || severity > 1) {
      console.log('[CASCADE] Invalid severity:', severity);
      return res.status(400).json({
        error: 'Invalid severity',
        message: 'severity must be a number between 0.0 and 1.0'
      });
    }

    // Validate duration
    if (duration < 1 || duration > 72) {
      console.log('[CASCADE] Invalid duration:', duration);
      return res.status(400).json({
        error: 'Invalid duration',
        message: 'duration must be between 1 and 72 hours'
      });
    }

    console.log('[CASCADE] All validations passed, calling calculateCascade...');

    // Get real-time current state for cascade analysis
    const currentState = await dataStore.getCurrentState(cityId);
    console.log('[CASCADE] Using real-time data:', {
      aqi: currentState.aqi,
      temperature: currentState.temperature,
      hospital_load: currentState.hospital_load
    });

    // Calculate cascade with real-time data
    const cascadeResult = await CascadeAnalytics.calculateCascade(
      trigger,
      severity,
      cityId,
      dataStore,  // Pass DataStore instance for real-time data access
      duration,
      currentState  // Pass current real-time state
    );

    console.log('[CASCADE] Calculation complete, building response...');

    // Add metadata
    const response = {
      city: dataStore.cities[cityId].name,
      city_id: cityId,
      timestamp: new Date().toISOString(),
      simulation_duration_hours: duration,
      ...cascadeResult
    };

    console.log('[CASCADE] Sending response with', Object.keys(response).length, 'keys');
    res.json(response);

  } catch (error) {
    console.error('[CASCADE] Error occurred:', error);
    console.error('[CASCADE] Error stack:', error.stack);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

/**
 * GET /api/v1/systemic-resilience?city_id={1,2,3}&hours={24}
 * Returns systemic resilience metrics across domains (Urban + Health + Agriculture)
 * Shows systemic resilience, not isolated metrics
 */
app.get('/api/v1/systemic-resilience', async (req, res) => {
  try {
    const cityId = parseInt(req.query.city_id) || 1;
    const hours = parseInt(req.query.hours) || 24;

    if (!dataStore.cities[cityId]) {
      return res.status(400).json({ error: 'Invalid city_id' });
    }

    // Get current state (urban + health + agriculture data)
    const currentState = await dataStore.getCurrentState(cityId);

    // Separate data by domain
    const urbanData = {
      aqi: currentState.aqi,
      traffic_density: currentState.traffic_density,
      temperature: currentState.temperature
    };

    const healthData = {
      hospital_load: currentState.hospital_load,
      respiratory_cases: null // Would come from health APIs
    };

    const agricultureData = {
      crop_supply: currentState.crop_supply,
      food_price_index: currentState.food_price_index
    };

    // Integrate across domains
    const integration = await crossDomainIntegration.integrateDomains(
      cityId,
      urbanData,
      healthData,
      agricultureData
    );

    // Get historical resilience trends
    const historical = crossDomainIntegration.getSystemicResilience(cityId, hours);

    res.json({
      city_id: cityId,
      city: dataStore.cities[cityId].name,
      timestamp: new Date().toISOString(),
      ...integration,
      historical_trends: historical
    });

  } catch (error) {
    console.error('[SYSTEMIC-RESILIENCE] Error:', error);
    res.status(500).json({ error: 'Failed to calculate systemic resilience', message: error.message });
  }
});

/**
 * GET /api/v1/causal-discovery?source_domain={urban|health|agriculture}&target_domain={urban|health|agriculture}
 * Returns discovered causal relationships with lagged correlations
 * Validates using domain logic + statistical rigor
 */
app.get('/api/v1/causal-discovery', (req, res) => {
  try {
    const sourceDomain = req.query.source_domain || null;
    const targetDomain = req.query.target_domain || null;

    const links = crossDomainIntegration.getCausalDiscovery(sourceDomain, targetDomain);

    res.json({
      causal_links: links,
      total_links: links.length,
      validated_links: links.filter(l => l.validation_status === 'validated').length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[CAUSAL-DISCOVERY] Error:', error);
    res.status(500).json({ error: 'Failed to get causal discovery', message: error.message });
  }
});

/**
 * GET /api/v1/cross-domain-impact?city_id={1,2,3}
 * Shows cross-domain vulnerabilities and cascading effects
 * Production-ready: handles temporal misalignment, missing values
 */
app.get('/api/v1/cross-domain-impact', async (req, res) => {
  try {
    const cityId = parseInt(req.query.city_id) || 1;

    if (!dataStore.cities[cityId]) {
      return res.status(400).json({ error: 'Invalid city_id' });
    }

    // Get current state
    const currentState = await dataStore.getCurrentState(cityId);

    // Separate by domain
    const urbanData = {
      aqi: currentState.aqi,
      traffic_density: currentState.traffic_density,
      temperature: currentState.temperature
    };

    const healthData = {
      hospital_load: currentState.hospital_load
    };

    const agricultureData = {
      crop_supply: currentState.crop_supply,
      food_price_index: currentState.food_price_index
    };

    // Get vulnerabilities and cascading effects
    const vulnerabilities = crossDomainIntegration.identifyCrossDomainVulnerabilities(
      cityId,
      urbanData,
      healthData,
      agricultureData
    );

    const cascadingEffects = crossDomainIntegration.predictCascadingEffects(
      urbanData,
      healthData,
      agricultureData
    );

    res.json({
      city_id: cityId,
      city: dataStore.cities[cityId].name,
      timestamp: new Date().toISOString(),
      vulnerabilities,
      cascading_effects: cascadingEffects,
      total_vulnerabilities: vulnerabilities.length,
      total_cascading_effects: cascadingEffects.length
    });

  } catch (error) {
    console.error('[CROSS-DOMAIN-IMPACT] Error:', error);
    res.status(500).json({ error: 'Failed to analyze cross-domain impact', message: error.message });
  }
});

/**
 * GET /api/v1/stats
 * Get system statistics and performance metrics
 * Production monitoring endpoint
 */
app.get('/api/v1/stats', (req, res) => {
  try {
    const stats = scalability.getStats();
    res.json({
      ...stats,
      timestamp: new Date().toISOString(),
      system_health: stats.errors < 10 ? 'healthy' : 'degraded'
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get stats', message: error.message });
  }
});

/**
 * GET /api/v1/health
 * Health check endpoint
 */
app.get('/api/v1/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================================================================
// ERROR HANDLING & SERVER START
// ============================================================================

app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`
╔════════════════════════════════════════════════════════════╗
║  Urban Risk Intelligence Platform - Backend Server         ║
║  Running on http://localhost:${PORT}                          ║
╚════════════════════════════════════════════════════════════╝

API Endpoints:
  GET  /api/v1/current-state?city_id={1,2,3}
  GET  /api/v1/risk-assessment?city_id={1,2,3}
  POST /api/v1/scenario
  GET  /api/v1/historical?city_id={1,2,3}&hours=24
  GET  /api/v1/cascading-failure?city_id={1,2,3}&trigger={domain}&severity={0-1}
  GET  /api/v1/systemic-resilience?city_id={1,2,3}&hours={24}
  GET  /api/v1/causal-discovery?source_domain={domain}&target_domain={domain}
  GET  /api/v1/cross-domain-impact?city_id={1,2,3}
  GET  /api/v1/cities
  GET  /api/v1/health

Cities:
  1 = Mumbai
  2 = Delhi
  3 = Bangalore

Cascade Triggers:
  power, water, traffic, communications, emergency, healthcare, transport, financial
  `);
});
