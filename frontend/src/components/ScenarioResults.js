import gsap from 'gsap';
import '../styles/components/scenario-results.css';

/**
 * ScenarioResults Component
 * Displays structured simulation results in three distinct blocks:
 * 1. Current Conditions (baseline)
 * 2. Scenario Impact (with deltas)
 * 3. ML Simulation Results (risks)
 */
export class ScenarioResults {
  constructor() {
    this.container = null;
  }

  /**
   * Render the scenario results
   * @param {HTMLElement} container - Container element
   * @param {Object} data - Simulation result data from /api/v1/scenario-delta
   */
  render(container, data) {
    this.container = container;

    if (!data) {
      container.innerHTML = `
        <div class="scenario-results scenario-results--empty">
          <p class="empty-message">Run a scenario simulation to see results</p>
        </div>
      `;
      return;
    }

    const { baseline, deltas, simulated, risks, validation } = data;

    // Safety check for null/undefined values to prevent "null" text
    const safeBaseline = this.sanitizeMetrics(baseline);
    const safeSimulated = this.sanitizeMetrics(simulated);

    const confidencePercent = Math.round((baseline.confidence || 0.5) * 100);

    container.innerHTML = `
      <div class="scenario-results">
        <!-- Block 1: Current Conditions -->
        <div class="result-block result-block--baseline">
          <div class="block-header">
            <span class="block-icon">📊</span>
            <h3>Current Conditions — ${baseline.city || 'Mumbai'}</h3>
            <span class="block-badge ${this.getBadgeClass(baseline.data_freshness)}">${baseline.data_freshness}</span>
          </div>
          <div class="metrics-grid">
            ${this.renderMetric('AQI', safeBaseline.aqi, null, baseline.timestamps?.air_quality, baseline.sources?.air_quality)}
            ${this.renderMetric('Temperature', safeBaseline.temperature, '°C', baseline.timestamps?.traffic, baseline.sources?.traffic)}
            ${this.renderMetric('Hospital Load', safeBaseline.hospital_load, '%', baseline.timestamps?.respiratory, baseline.sources?.respiratory)}
            ${this.renderMetric('Food Availability', safeBaseline.crop_supply, '%', baseline.timestamps?.agriculture, baseline.sources?.agriculture)}
          </div>
          <div class="confidence-bar">
            <span class="confidence-label">Data Confidence:</span>
            <div class="confidence-track">
              <div class="confidence-fill" style="width: ${confidencePercent}%"></div>
            </div>
            <span class="confidence-value">${confidencePercent}%</span>
          </div>
        </div>

        <!-- Block 2: Scenario Impact -->
        <div class="result-block result-block--scenario">
          <div class="block-header">
            <span class="block-icon">⚡</span>
            <h3>Scenario Impact${deltas.inferred_scenario ? ` (${this.formatScenario(deltas.inferred_scenario)})` : ''}</h3>
            <span class="block-badge block-badge--delta">${deltas.source}</span>
          </div>
          ${deltas.description ? `<p class="scenario-description">${deltas.description}</p>` : ''}
          <div class="metrics-grid">
            ${this.renderDeltaMetric('AQI', safeBaseline.aqi, safeSimulated.aqi, deltas.aqi_delta)}
            ${this.renderDeltaMetric('Temperature', safeBaseline.temperature, safeSimulated.temperature, deltas.temperature_delta, '°C')}
            ${this.renderDeltaMetric('Hospital Load', safeBaseline.hospital_load, safeSimulated.hospital_load, deltas.hospital_load_delta, '%')}
            ${this.renderDeltaMetric('Food Availability', safeBaseline.crop_supply, safeSimulated.crop_supply, deltas.crop_supply_delta, '%')}
          </div>
        </div>

        <!-- Block 3: Risk Assessment -->
        <div class="result-block result-block--risks">
          <div class="block-header">
            <span class="block-icon">🎯</span>
            <h3>Risk Resilience</h3>
            <span class="block-badge ${validation.ml_executed ? 'block-badge--success' : 'block-badge--warning'}">
              ${validation.ml_executed ? 'ML Computed' : 'Estimated'}
            </span>
          </div>
          
          <div class="resilience-section">
            <div class="resilience-header">
              <span class="resilience-label">Overall Resilience Score</span>
              <span class="resilience-value">${(risks.resilience_score * 100).toFixed(1)}%</span>
            </div>
            <div class="resilience-bar">
              <div class="resilience-fill ${this.getResilienceClass(risks.resilience_score)}" 
                   style="width: ${risks.resilience_score * 100}%"></div>
            </div>
            ${risks.causal_explanations && risks.causal_explanations.length > 0 ? `
              <p class="resilience-explanation">${risks.causal_explanations[0]}</p>
            ` : ''}
          </div>

          <div class="risks-grid">
            ${this.renderRisk('Environmental', risks.environmental_risk, risks.environmental_prob, '🌍')}
            ${this.renderRisk('Health', risks.health_risk, risks.health_prob, '🏥')}
            ${this.renderRisk('Food Security', risks.food_security_risk, risks.food_security_prob, '🌾')}
          </div>
          
        </div>

        <!-- Validation Info (collapsed by default) -->
        <div class="validation-info">
          <button class="validation-toggle" onclick="this.parentElement.classList.toggle('expanded')">
            <span class="toggle-icon">▶</span> Validation Details (Debug)
          </button>
          <div class="validation-content">
            <div class="validation-item ${validation.used_live_data ? 'success' : 'warning'}">
              <span class="validation-icon">${validation.used_live_data ? '✓' : '⚠'}</span>
              Live/Recent Data: ${validation.used_live_data ? 'Yes' : 'No'}
            </div>
            <div class="validation-item ${!validation.fallback_used ? 'success' : 'warning'}">
              <span class="validation-icon">${!validation.fallback_used ? '✓' : '⚠'}</span>
              Fallback Used: ${validation.fallback_used ? 'Yes' : 'No'}
            </div>
            <div class="validation-item ${validation.deltas_applied ? 'success' : 'error'}">
              <span class="validation-icon">${validation.deltas_applied ? '✓' : '✗'}</span>
              Deltas Applied: ${validation.deltas_applied ? 'Yes' : 'No'}
            </div>
          </div>
        </div>
      </div>
    `;

    // Animate in
    this.animateIn();
  }

  // Ensure no nulls exist
  sanitizeMetrics(metrics) {
    if (!metrics) return {};
    return {
      aqi: metrics.aqi ?? 0,
      temperature: metrics.temperature ?? 0,
      hospital_load: metrics.hospital_load ?? 0,
      crop_supply: metrics.crop_supply ?? 0
    };
  }

  renderMetric(label, value, unit, timestamp, source) {
    // Careful with formatting to avoid "168.2null"
    const displayValue = typeof value === 'number' ? value.toFixed(1) : (value || 'N/A');
    const displayUnit = unit || ''; // If unit is null, use empty string

    // Source class for styling (live vs estimated)
    const sourceClass = source ? `source-${source}` : '';

    // Hide timestamp if it's just "Estimated" and we want a cleaner look, or style it differently
    const displayTimestamp = timestamp || 'Estimated';
    const isEstimated = displayTimestamp === 'Estimated' || (source && source.includes('estimate'));

    return `
      <div class="metric-card ${sourceClass} ${isEstimated ? 'metric-estimated' : ''}">
        <span class="metric-label">${label}</span>
        <span class="metric-value">${displayValue}${displayUnit}</span>
        <span class="metric-timestamp">${displayTimestamp}</span>
      </div>
    `;
  }

  renderDeltaMetric(label, baseline, final, delta, unit = '') {
    const baselineVal = typeof baseline === 'number' ? baseline.toFixed(1) : '0.0';
    const finalVal = typeof final === 'number' ? final.toFixed(1) : '0.0';

    const deltaNum = typeof delta === 'number' ? delta : 0;
    const deltaDisplay = Math.abs(deltaNum).toFixed(1);

    // For coloring: increase is usually bad (red), decrease good (green)
    // BUT for Crop Supply, decrease is bad.
    // And AQI decrease is good.
    // Let's stick to generic: >0 red, <0 green? Or neutral class names and CSS handles it?
    // Current CSS likely maps delta-increase to red?
    // Let's keep logic simple: 
    const deltaClass = deltaNum > 0 ? 'delta-increase' : deltaNum < 0 ? 'delta-decrease' : 'delta-neutral';
    const deltaSign = deltaNum > 0 ? '+' : deltaNum < 0 ? '-' : '';

    return `
      <div class="metric-card metric-card--delta">
        <span class="metric-label">${label}</span>
        <div class="delta-display">
          <span class="baseline-value" title="Baseline">${baselineVal}${unit}</span>
          <span class="delta-arrow">→</span>
          <span class="final-value" title="Simulated">${finalVal}${unit}</span>
        </div>
        <span class="delta-badge ${deltaClass}">${deltaSign}${deltaDisplay}${unit}</span>
      </div>
    `;
  }

  renderRisk(label, level, probability, icon) {
    const prob = probability !== null ? (probability * 100).toFixed(0) : 'N/A';
    const levelClass = `risk-${(level || 'low').toLowerCase()}`;

    return `
      <div class="risk-card ${levelClass}">
        <span class="risk-icon">${icon}</span>
        <span class="risk-label">${label}</span>
        <span class="risk-level">${(level || 'UNKNOWN').toUpperCase()}</span>
        <span class="risk-prob">${prob}% Risk</span>
      </div>
    `;
  }

  getBadgeClass(freshness) {
    const classes = {
      'live': 'block-badge--live',
      'recent': 'block-badge--recent',
      'cached': 'block-badge--cached',
      'estimated': 'block-badge--estimated'
    };
    return classes[freshness] || 'block-badge--unknown';
  }

  getResilienceClass(score) {
    if (score >= 0.7) return 'resilience--high';
    if (score >= 0.4) return 'resilience--medium';
    return 'resilience--low';
  }

  formatScenario(scenario) {
    if (!scenario) return '';
    return scenario.charAt(0).toUpperCase() + scenario.slice(1).replace(/_/g, ' ');
  }

  animateIn() {
    const blocks = this.container.querySelectorAll('.result-block');
    gsap.fromTo(blocks,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.5, stagger: 0.15, ease: 'power2.out' }
    );
  }

  clear() {
    if (this.container) {
      this.container.innerHTML = '';
    }
  }
}
