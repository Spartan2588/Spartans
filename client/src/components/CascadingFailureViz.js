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
          <div class="cascade-flow">
            <div id="cascade-diagram" class="cascade-diagram"></div>
          </div>

          <div class="cascade-details">
            <div class="cascade-timeline">
              <h3>Propagation Timeline</h3>
              <div id="cascade-stages" class="cascade-stages"></div>
            </div>

            <div class="cascade-summary">
              <h3>Impact Summary</h3>
              <div id="cascade-summary" class="summary-content"></div>
            </div>
          </div>
        </div>

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

    // Find the most significant change
    const baseline = scenario.baseline;
    const intervention = scenario.intervention;

    let maxChange = 0;
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

    this.renderDiagram();
    this.renderTimeline();
    this.renderSummary();
  }

  renderDiagram() {
    const container = document.querySelector('#cascade-diagram');
    if (!container) return;

    const canvas = document.createElement('canvas');
    canvas.width = container.clientWidth;
    canvas.height = 300;
    container.innerHTML = '';
    container.appendChild(canvas);

    const ctx = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;

    // Background
    ctx.fillStyle = 'rgba(10, 10, 26, 0.5)';
    ctx.fillRect(0, 0, width, height);

    // Draw system nodes and connections
    const systems = ['environmental', 'health', 'agriculture', 'economy'];
    const nodePositions = {};

    // Calculate positions
    systems.forEach((system, index) => {
      const x = padding + (index / (systems.length - 1)) * (width - padding * 2);
      const y = height / 2;
      nodePositions[system] = { x, y };
    });

    // Draw connections
    ctx.strokeStyle = 'rgba(167, 139, 250, 0.3)';
    ctx.lineWidth = 2;

    const connections = [
      ['environmental', 'health'],
      ['environmental', 'agriculture'],
      ['health', 'economy'],
      ['agriculture', 'economy']
    ];

    connections.forEach(([from, to]) => {
      const fromPos = nodePositions[from];
      const toPos = nodePositions[to];

      ctx.beginPath();
      ctx.moveTo(fromPos.x, fromPos.y);
      ctx.lineTo(toPos.x, toPos.y);
      ctx.stroke();
    });

    // Draw nodes
    systems.forEach(system => {
      const pos = nodePositions[system];
      const affected = this.cascade.find(s => s.system === system);
      const severity = affected ? affected.severity : 0;

      // Node circle
      const color = this.getSeverityColor(severity);
      ctx.fillStyle = color;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 25 + severity * 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;

      // Border
      ctx.strokeStyle = color;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, 25 + severity * 15, 0, Math.PI * 2);
      ctx.stroke();

      // Label
      ctx.fillStyle = '#e2e8f0';
      ctx.font = 'bold 12px Inter';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(this.model.systemGraph[system].icon, pos.x, pos.y - 5);
      ctx.font = '10px Inter';
      ctx.fillText(system, pos.x, pos.y + 15);

      // Severity percentage
      if (severity > 0) {
        ctx.fillStyle = '#a78bfa';
        ctx.font = 'bold 11px Inter';
        ctx.fillText(`${(severity * 100).toFixed(0)}%`, pos.x, pos.y + 30);
      }
    });
  }

  renderTimeline() {
    const container = document.querySelector('#cascade-stages');
    if (!container || !this.cascade) return;

    const stages = this.cascade.map((stage, index) => `
      <div class="cascade-stage" data-stage="${index}">
        <div class="stage-number">${stage.stage}</div>
        <div class="stage-content">
          <div class="stage-system">${this.model.systemGraph[stage.system].icon} ${stage.system}</div>
          <div class="stage-description">${stage.description}</div>
          <div class="stage-severity">
            <div class="severity-bar">
              <div class="severity-fill" style="width: ${stage.severity * 100}%; background: ${this.getSeverityColor(stage.severity)};"></div>
            </div>
            <span class="severity-text">${(stage.severity * 100).toFixed(0)}%</span>
          </div>
          <div class="stage-delay">Delay: ${stage.timestamp}h</div>
        </div>
      </div>
    `).join('');

    container.innerHTML = stages;
  }

  renderSummary() {
    const container = document.querySelector('#cascade-summary');
    if (!container || !this.cascade) return;

    const affectedSystems = this.model.getAffectedSystems(this.cascade);
    const totalSeverity = affectedSystems.reduce((sum, s) => sum + s.maxSeverity, 0) / affectedSystems.length;

    const summary = `
      <div class="summary-item">
        <span class="summary-label">Systems Affected</span>
        <span class="summary-value">${affectedSystems.length}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Cascade Stages</span>
        <span class="summary-value">${Math.max(...this.cascade.map(s => s.stage)) + 1}</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Average Severity</span>
        <span class="summary-value">${(totalSeverity * 100).toFixed(0)}%</span>
      </div>
      <div class="summary-item">
        <span class="summary-label">Total Propagation Time</span>
        <span class="summary-value">${Math.max(...this.cascade.map(s => s.timestamp))}h</span>
      </div>
      <div class="summary-description">
        ${this.model.generateDescription(this.cascade)}
      </div>
    `;

    container.innerHTML = summary;
  }

  animateCascade() {
    if (this.isAnimating || !this.cascade) return;

    this.isAnimating = true;
    const stages = document.querySelectorAll('.cascade-stage');

    stages.forEach((stage, index) => {
      gsap.to(stage, {
        opacity: 1,
        x: 0,
        duration: 0.5,
        delay: index * 0.3,
        ease: 'power2.out'
      });
    });

    // Animate diagram
    const diagram = document.querySelector('#cascade-diagram');
    if (diagram) {
      gsap.to(diagram, {
        opacity: 1,
        duration: 0.5,
        ease: 'power2.out'
      });
    }

    setTimeout(() => {
      this.isAnimating = false;
    }, stages.length * 300 + 500);
  }

  resetCascade() {
    const stages = document.querySelectorAll('.cascade-stage');
    stages.forEach(stage => {
      gsap.to(stage, {
        opacity: 0,
        x: -20,
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
