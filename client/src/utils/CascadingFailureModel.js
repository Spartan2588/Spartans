/**
 * Cascading Failure Analysis Model
 * Models how failures propagate through interconnected urban systems
 */

export class CascadingFailureModel {
  constructor() {
    // Define system dependencies and propagation rules
    this.systemGraph = {
      environmental: {
        name: 'Environmental',
        icon: '🌍',
        dependents: ['health', 'agriculture'],
        propagationDelay: 0, // immediate
        impactWeight: 1.0
      },
      health: {
        name: 'Health',
        icon: '🏥',
        dependents: ['economy'],
        propagationDelay: 2, // 2-hour delay
        impactWeight: 0.8
      },
      agriculture: {
        name: 'Agriculture',
        icon: '🌾',
        dependents: ['economy'],
        propagationDelay: 4, // 4-hour delay
        impactWeight: 0.7
      },
      economy: {
        name: 'Economy',
        icon: '💰',
        dependents: [],
        propagationDelay: 6, // 6-hour delay
        impactWeight: 1.0
      }
    };

    // Propagation rules: how metrics in one system affect another
    this.propagationRules = {
      'environmental->health': {
        trigger: 'aqi',
        threshold: 200,
        impactFactor: 0.6, // AQI increase translates to 60% health risk increase
        metric: 'hospital_load'
      },
      'environmental->agriculture': {
        trigger: 'temperature',
        threshold: 35,
        impactFactor: 0.5,
        metric: 'crop_supply'
      },
      'health->economy': {
        trigger: 'hospital_load',
        threshold: 80,
        impactFactor: 0.7,
        metric: 'economic_impact'
      },
      'agriculture->economy': {
        trigger: 'crop_supply',
        threshold: 40,
        impactFactor: 0.6,
        metric: 'economic_impact'
      }
    };
  }

  /**
   * Analyze cascading effects from initial trigger
   * Returns timeline of propagating failures
   */
  analyzeCascade(initialMetrics, changedMetric, newValue) {
    const cascade = [];
    const affectedSystems = new Set();
    const processedRules = new Set();

    // Start with the initial system
    const initialSystem = this.getSystemFromMetric(changedMetric);
    cascade.push({
      stage: 0,
      system: initialSystem,
      metric: changedMetric,
      value: newValue,
      severity: this.calculateSeverity(changedMetric, newValue),
      timestamp: 0,
      description: `${initialSystem} system affected by ${changedMetric}`
    });

    affectedSystems.add(initialSystem);

    // Propagate through dependent systems
    let currentStage = 0;
    let currentAffectedSystems = [initialSystem];

    while (currentAffectedSystems.length > 0 && currentStage < 4) {
      const nextAffectedSystems = [];

      for (const system of currentAffectedSystems) {
        const dependents = this.systemGraph[system]?.dependents || [];

        for (const dependent of dependents) {
          const ruleKey = `${system}->${dependent}`;
          if (processedRules.has(ruleKey)) continue;
          processedRules.add(ruleKey);

          const rule = this.propagationRules[ruleKey];
          if (!rule) continue;

          // Calculate impact on dependent system
          const impactValue = this.calculatePropagatedImpact(
            newValue,
            rule.threshold,
            rule.impactFactor
          );

          const propagationDelay = this.systemGraph[dependent]?.propagationDelay || 0;

          cascade.push({
            stage: currentStage + 1,
            system: dependent,
            metric: rule.metric,
            value: impactValue,
            severity: this.calculateSeverity(rule.metric, impactValue),
            timestamp: propagationDelay,
            description: `${dependent} system impacted by ${system} failure`,
            sourceSystem: system,
            impactFactor: rule.impactFactor
          });

          if (!affectedSystems.has(dependent)) {
            affectedSystems.add(dependent);
            nextAffectedSystems.push(dependent);
          }
        }
      }

      currentAffectedSystems = nextAffectedSystems;
      currentStage++;
    }

    return cascade;
  }

  /**
   * Calculate propagated impact value
   */
  calculatePropagatedImpact(sourceValue, threshold, impactFactor) {
    if (sourceValue <= threshold) {
      return 0;
    }

    const excessAmount = sourceValue - threshold;
    const normalizedExcess = Math.min(excessAmount / threshold, 1);
    return normalizedExcess * impactFactor * 100;
  }

  /**
   * Calculate severity level (0-1)
   */
  calculateSeverity(metric, value) {
    const severityThresholds = {
      aqi: { low: 100, high: 300 },
      temperature: { low: 25, high: 40 },
      hospital_load: { low: 50, high: 90 },
      crop_supply: { low: 50, high: 20 },
      economic_impact: { low: 100000, high: 500000 }
    };

    const threshold = severityThresholds[metric];
    if (!threshold) return 0.5;

    if (value <= threshold.low) return 0;
    if (value >= threshold.high) return 1;

    return (value - threshold.low) / (threshold.high - threshold.low);
  }

  /**
   * Get system name from metric
   */
  getSystemFromMetric(metric) {
    const metricToSystem = {
      aqi: 'environmental',
      temperature: 'environmental',
      hospital_load: 'health',
      crop_supply: 'agriculture',
      food_price_index: 'agriculture',
      economic_impact: 'economy'
    };

    return metricToSystem[metric] || 'environmental';
  }

  /**
   * Get all affected systems and their impact
   */
  getAffectedSystems(cascade) {
    const affected = {};

    for (const stage of cascade) {
      if (!affected[stage.system]) {
        affected[stage.system] = {
          system: stage.system,
          maxSeverity: 0,
          stages: [],
          totalImpact: 0
        };
      }

      affected[stage.system].maxSeverity = Math.max(
        affected[stage.system].maxSeverity,
        stage.severity
      );
      affected[stage.system].stages.push(stage);
      affected[stage.system].totalImpact += stage.severity;
    }

    return Object.values(affected);
  }

  /**
   * Generate human-readable cascade description
   */
  generateDescription(cascade) {
    if (cascade.length === 0) return 'No cascading effects detected.';

    const stages = cascade.map(s => `${s.description} (severity: ${(s.severity * 100).toFixed(0)}%)`);
    return stages.join(' → ');
  }
}
