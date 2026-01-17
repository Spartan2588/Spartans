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
          <div class="cascade-diagram-section">
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

    // Create SVG-based cascade diagram
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('viewBox', '0 0 800 400');
    svg.setAttribute('class', 'cascade-svg');
    container.innerHTML = '';
    container.appendChild(svg);

    // Define systems and their positions
    const systems = [
      { id: 'environmental', label: '🌍 Environmental', x: 100, y: 200, color: '#10b981' },
      { id: 'health', label: '🏥 Health', x: 300, y: 100, color: '#f59e0b' },
      { id: 'agriculture', label: '🌾 Agriculture', x: 300, y: 300, color: '#06b6d4' },
      { id: 'economy', label: '💰 Economy', x: 500, y: 200, color: '#ef4444' }
    ];

    // Draw connections
    const connections = [
      { from: 0, to: 1 },
      { from: 0, to: 2 },
      { from: 1, to: 3 },
      { from: 2, to: 3 }
    ];

    connections.forEach(conn => {
      const fromSys = systems[conn.from];
      const toSys = systems[conn.to];

      // Draw arrow line
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', fromSys.x + 60);
      line.setAttribute('y1', fromSys.y);
      line.setAttribute('x2', toSys.x - 60);
      line.setAttribute('y2', toSys.y);
      line.setAttribute('stroke', 'rgba(167, 139, 250, 0.3)');
      line.setAttribute('stroke-width', '2');
      line.setAttribute('marker-end', 'url(#arrowhead)');
      svg.appendChild(line);
    });

    // Define arrow marker
    const defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    const marker = document.createElementNS('http://www.w3.org/2000/svg', 'marker');
    marker.setAttribute('id', 'arrowhead');
    marker.setAttribute('markerWidth', '10');
    marker.setAttribute('markerHeight', '10');
    marker.setAttribute('refX', '9');
    marker.setAttribute('refY', '3');
    marker.setAttribute('orient', 'auto');
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
    polygon.setAttribute('points', '0 0, 10 3, 0 6');
    polygon.setAttribute('fill', 'rgba(167, 139, 250, 0.5)');
    marker.appendChild(polygon);
    defs.appendChild(marker);
    svg.appendChild(defs);

    // Draw system nodes
    systems.forEach(sys => {
      const affected = this.cascade.find(s => s.system === sys.id);
      const severity = affected ? affected.severity : 0;

      // Circle background
      const circle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      circle.setAttribute('cx', sys.x);
      circle.setAttribute('cy', sys.y);
      circle.setAttribute('r', 50 + severity * 20);
      circle.setAttribute('fill', sys.color);
      circle.setAttribute('opacity', '0.3');
      circle.setAttribute('class', 'cascade-node');
      svg.appendChild(circle);

      // Circle border
      const border = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      border.setAttribute('cx', sys.x);
      border.setAttribute('cy', sys.y);
      border.setAttribute('r', 50 + severity * 20);
      border.setAttribute('fill', 'none');
      border.setAttribute('stroke', sys.color);
      border.setAttribute('stroke-width', '2');
      svg.appendChild(border);

      // Label
      const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
      text.setAttribute('x', sys.x);
      text.setAttribute('y', sys.y - 5);
      text.setAttribute('text-anchor', 'middle');
      text.setAttribute('fill', '#e2e8f0');
      text.setAttribute('font-size', '14');
      text.setAttribute('font-weight', 'bold');
      text.textContent = sys.label.split(' ')[0];
      svg.appendChild(text);

      // Severity percentage
      if (severity > 0) {
        const severityText = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        severityText.setAttribute('x', sys.x);
        severityText.setAttribute('y', sys.y + 15);
        severityText.setAttribute('text-anchor', 'middle');
        severityText.setAttribute('fill', '#a78bfa');
        severityText.setAttribute('font-size', '12');
        severityText.setAttribute('font-weight', 'bold');
        severityText.textContent = `${(severity * 100).toFixed(0)}%`;
        svg.appendChild(severityText);
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

    // Animate diagram nodes
    const nodes = document.querySelectorAll('.cascade-node');
    nodes.forEach((node, index) => {
      gsap.to(node, {
        opacity: 0.6,
        duration: 0.5,
        delay: index * 0.2,
        ease: 'power2.out'
      });
    });

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

    const nodes = document.querySelectorAll('.cascade-node');
    nodes.forEach(node => {
      gsap.to(node, {
        opacity: 0.1,
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
