import { CascadingFailureModel } from '../utils/CascadingFailureModel.js';
import gsap from 'gsap';
import '../styles/components/cascading-failure.css';

export class CascadingFailureViz {
  constructor() {
    this.model = new CascadingFailureModel();
    this.cascade = null;
    this.isAnimating = false;
  }

  async render(container) {
    container.innerHTML = `
      <div class="cascading-failure">
        <div class="cascade-header">
          <h2>Cascading Failure Analysis</h2>
          <p class="cascade-subtitle">How failures propagate through interconnected systems</p>
        </div>

        <div class="cascade-container">
          <!-- Progression Timeline -->
          <div class="cascade-progression">
            <h3>Failure Propagation</h3>
            <div id="cascade-timeline" class="cascade-timeline"></div>
          </div>

          <!-- Metrics Impact -->
          <div class="cascade-metrics">
            <h3>System Impact</h3>
            <div id="cascade-metrics" class="metrics-grid"></div>
          </div>
        </div>

        <!-- Detailed Stages -->
        <div class="cascade-stages-section">
          <h3>Propagation Stages</h3>
          <div id="cascade-stages" class="cascade-stages"></div>
        </div>

        <!-- Summary Statistics -->
        <div class="cascade-summary">
          <h3>Impact Summary</h3>
          <div id="cascade-summary" class="summary-content"></div>
        </div>

        <!-- Controls -->
        <div class="cascade-controls">
          <button id="cascade-play" class="cascade-btn primary">▶ Animate Cascade</button>
          <button id="cascade-reset" class="cascade-btn secondary">↻ Reset</button>
        </div>
      </div>
    `;

    this.setupEventListeners(container);
    this.initializeCascade();
  }

  setupEventListeners(container) {
    const playBtn = container.querySelector('#cascade-play');
    const resetBtn = container.querySelector('#cascade-reset');

    playBtn.addEventListener('click', () => {
      this.animateCascade();
    });

    resetBtn.addEventListener('click', () => {
      this.resetCascade();
    });

    // Listen for scenario updates
    window.addEventListener('scenario-updated', (e) => {
      this.updateCascadeFromScenario(e.detail);
    });
  }

  initializeCascade() {
    // Initialize with default scenario
    const initialMetrics = {
      aqi: 150,
      temperature: 25,
      hospital_load: 50,
      crop_supply: 70
    };

    this.cascade = this.model.analyzeCascade(initialMetrics, 'aqi', 150);
    this.renderCascade();
  }

  updateCascadeFromScenario(scenario) {
    if (!scenario.intervention) return;

    const baseline = scenario.baseline;
    const intervention = scenario.intervention;

    let changedMetric = 'aqi';
    let newValue = 150;

    // Determine which metric changed most
    if (intervention.environmental_risk?.probability > baseline.environmental_risk?.probability) {
      changedMetric = 'aqi';
      newValue = 200 + (intervention.environmental_risk.probability * 3);
    } else if (intervention.health_risk?.probability > baseline.health_risk?.probability) {
      changedMetric = 'hospital_load';
      newValue = intervention.health_risk.probability;
    } else if (intervention.food_security_risk?.probability > baseline.food_security_risk?.probability) {
      changedMetric = 'crop_supply';
      newValue = 100 - intervention.food_security_risk.probability;
    }

    const initialMetrics = {
      aqi: 150,
      temperature: 25,
      hospital_load: 50,
      crop_supply: 70
    };

    this.cascade = this.model.analyzeCascade(initialMetrics, changedMetric, newValue);
    this.renderCascade();
  }

  renderCascade() {
    if (!this.cascade) return;

    this.renderTimeline();
    this.renderMetricsImpact();
    this.renderStages();
    this.renderSummary();
  }

  /**
   * Render progression timeline showing cascade flow
   */
  renderTimeline() {
    const container = document.querySelector('#cascade-timeline');
    if (!container || !this.cascade) return;

    const stages = this.cascade.map((stage, index) => {
      const isLast = index === this.cascade.length - 1;
      return `
        <div class="timeline-item" data-stage="${index}">
          <div class="timeline-marker" style="background: ${this.getSeverityColor(stage.severity)};">
            <span class="marker-number">${stage.stage}</span>
          </div>
          <div class="timeline-content">
            <div class="timeline-system">${stage.system}</div>
            <div class="timeline-delay">${stage.timestamp}h delay</div>
          </div>
          ${!isLast ? '<div class="timeline-arrow">→</div>' : ''}
        </div>
      `;
    }).join('');

    container.innerHTML = stages;
  }

  /**
   * Render metrics impact grid
   */
  renderMetricsImpact() {
    const container = document.querySelector('#cascade-metrics');
    if (!container || !this.cascade) return;

    const affectedSystems = this.model.getAffectedSystems(this.cascade);

    const metrics = affectedSystems.map(sys => {
      const severity = sys.maxSeverity;
      const severityPercent = (severity * 100).toFixed(0);
      const color = this.getSeverityColor(severity);

      return `
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-name">${sys.system}</span>
            <span class="metric-severity" style="color: ${color};">${severityPercent}%</span>
          </div>
          <div class="metric-bar">
            <div class="metric-fill" style="width: ${severityPercent}%; background: ${color};"></div>
          </div>
          <div class="metric-stages">
            <span class="metric-label">Stages affected: ${sys.stages.length}</span>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = metrics;
  }

  /**
   * Render detailed stages
   */
  renderStages() {
    const container = document.querySelector('#cascade-stages');
    if (!container || !this.cascade) return;

    const stages = this.cascade.map((stage, index) => `
      <div class="stage-card" data-stage="${index}">
        <div class="stage-header">
          <div class="stage-badge" style="background: ${this.getSeverityColor(stage.severity)};">
            Stage ${stage.stage}
          </div>
          <div class="stage-title">${stage.system}</div>
          <div class="stage-time">${stage.timestamp}h</div>
        </div>
        <div class="stage-body">
          <p class="stage-description">${stage.description}</p>
          <div class="stage-metrics">
            <div class="metric-row">
              <span class="metric-key">Severity:</span>
              <span class="metric-val">${(stage.severity * 100).toFixed(0)}%</span>
            </div>
            <div class="metric-row">
              <span class="metric-key">Impact Factor:</span>
              <span class="metric-val">${(stage.impactFactor || 0.8).toFixed(2)}</span>
            </div>
            ${stage.sourceSystem ? `
              <div class="metric-row">
                <span class="metric-key">Source:</span>
                <span class="metric-val">${stage.sourceSystem}</span>
              </div>
            ` : ''}
          </div>
        </div>
      </div>
    `).join('');

    container.innerHTML = stages;
  }

  /**
   * Render summary statistics
   */
  renderSummary() {
    const container = document.querySelector('#cascade-summary');
    if (!container || !this.cascade) return;

    const affectedSystems = this.model.getAffectedSystems(this.cascade);
    const totalSeverity = affectedSystems.reduce((sum, s) => sum + s.maxSeverity, 0) / affectedSystems.length;
    const maxStage = Math.max(...this.cascade.map(s => s.stage));
    const totalTime = Math.max(...this.cascade.map(s => s.timestamp));

    const summary = `
      <div class="summary-grid">
        <div class="summary-stat">
          <div class="summary-label">Systems Affected</div>
          <div class="summary-value">${affectedSystems.length}</div>
        </div>
        <div class="summary-stat">
          <div class="summary-label">Cascade Stages</div>
          <div class="summary-value">${maxStage + 1}</div>
        </div>
        <div class="summary-stat">
          <div class="summary-label">Average Severity</div>
          <div class="summary-value">${(totalSeverity * 100).toFixed(0)}%</div>
        </div>
        <div class="summary-stat">
          <div class="summary-label">Total Propagation</div>
          <div class="summary-value">${totalTime}h</div>
        </div>
      </div>
      <div class="summary-description">
        <p>${this.model.generateDescription(this.cascade)}</p>
      </div>
    `;

    container.innerHTML = summary;
  }

  /**
   * Animate cascade progression
   */
  animateCascade() {
    if (this.isAnimating || !this.cascade) return;

    this.isAnimating = true;

    // Animate timeline items
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach((item, index) => {
      gsap.to(item, {
        opacity: 1,
        x: 0,
        duration: 0.4,
        delay: index * 0.2,
        ease: 'power2.out'
      });
    });

    // Animate stage cards
    const stageCards = document.querySelectorAll('.stage-card');
    stageCards.forEach((card, index) => {
      gsap.to(card, {
        opacity: 1,
        y: 0,
        duration: 0.4,
        delay: index * 0.25,
        ease: 'power2.out'
      });
    });

    // Animate metric bars
    const metricFills = document.querySelectorAll('.metric-fill');
    metricFills.forEach((fill, index) => {
      const width = fill.style.width;
      gsap.to(fill, {
        width: width,
        duration: 0.6,
        delay: index * 0.15,
        ease: 'power2.out'
      });
    });

    setTimeout(() => {
      this.isAnimating = false;
    }, stageCards.length * 250 + 500);
  }

  /**
   * Reset cascade animation
   */
  resetCascade() {
    const timelineItems = document.querySelectorAll('.timeline-item');
    timelineItems.forEach(item => {
      gsap.to(item, {
        opacity: 0,
        x: -20,
        duration: 0.3,
        ease: 'power2.in'
      });
    });

    const stageCards = document.querySelectorAll('.stage-card');
    stageCards.forEach(card => {
      gsap.to(card, {
        opacity: 0,
        y: 20,
        duration: 0.3,
        ease: 'power2.in'
      });
    });

    const metricFills = document.querySelectorAll('.metric-fill');
    metricFills.forEach(fill => {
      gsap.to(fill, {
        width: '0%',
        duration: 0.3,
        ease: 'power2.in'
      });
    });

    this.isAnimating = false;
  }

  getSeverityColor(severity) {
    if (severity < 0.33) return '#10b981';
    if (severity < 0.66) return '#f59e0b';
    return '#ef4444';
  }

  cleanup() {
    // Cleanup if needed
  }
}
