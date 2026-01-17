import { CascadingFailureModel } from '../utils/CascadingFailureModel.js';
import { ApiClient } from '../utils/api.js';
import gsap from 'gsap';
import '../styles/components/cascading-failure.css';

export class CascadingFailureViz {
  constructor() {
    this.model = new CascadingFailureModel();
    this.api = new ApiClient();
    this.cascade = null;
    this.cascadeData = null; // Real API data
    this.isAnimating = false;
    this.currentCityId = 1; // Default to Mumbai
    this.cities = [
      { id: 1, name: 'Mumbai' },
      { id: 2, name: 'Delhi' },
      { id: 3, name: 'Bangalore' }
    ];
    this.container = null; // Store container reference for scoped queries
  }

  async render(container) {
    container.innerHTML = `
      <div class="cascading-failure">
        <div class="cascade-header">
          <h2>Cascading Failure Analysis</h2>
          <p class="cascade-subtitle">How failures propagate through interconnected systems</p>
        </div>

        <!-- Control Panel -->
        <div class="cascade-control-panel">
          <div class="control-group">
            <label for="city-select">City:</label>
            <select id="city-select" class="cascade-select">
              ${this.cities.map(city => 
                `<option value="${city.id}" ${city.id === this.currentCityId ? 'selected' : ''}>${city.name}</option>`
              ).join('')}
            </select>
          </div>
          <div class="control-group">
            <label for="trigger-select">Trigger Event:</label>
            <select id="trigger-select" class="cascade-select">
              <option value="power" selected>Power Grid Failure</option>
              <option value="water">Water System Failure</option>
              <option value="traffic">Traffic System Failure</option>
              <option value="communications">Communications Failure</option>
              <option value="emergency">Emergency Services Disruption</option>
              <option value="healthcare">Healthcare System Overload</option>
              <option value="transport">Public Transport Failure</option>
              <option value="financial">Financial System Disruption</option>
            </select>
          </div>
          <div class="control-group">
            <label for="severity-slider">Severity: <span id="severity-value">0.8</span></label>
            <input type="range" id="severity-slider" min="0.1" max="1.0" step="0.1" value="0.8" class="cascade-slider">
          </div>
          <div class="control-group">
            <button id="cascade-simulate" class="cascade-btn primary">🔄 Simulate Cascade</button>
          </div>
        </div>

        <!-- Loading State -->
        <div id="cascade-loading" class="cascade-loading hidden">
          <div class="loading-spinner"></div>
          <p>Calculating cascade propagation...</p>
        </div>

        <!-- Content Container -->
        <div id="cascade-content" class="cascade-content">
          <div class="cascade-container">
            <!-- Progression Timeline -->
            <div class="cascade-progression">
              <h3>Failure Propagation Timeline</h3>
              <div id="cascade-timeline" class="cascade-timeline"></div>
            </div>

            <!-- Metrics Impact -->
            <div class="cascade-metrics">
              <h3>Affected Infrastructure</h3>
              <div id="cascade-metrics" class="metrics-grid"></div>
            </div>
          </div>

          <!-- Impact Summary -->
          <div class="cascade-summary-section">
            <h3>Total Impact Assessment</h3>
            <div id="cascade-impact" class="impact-grid"></div>
          </div>

          <!-- Recommendations -->
          <div class="cascade-recommendations">
            <h3>Mitigation Recommendations</h3>
            <div id="cascade-recommendations" class="recommendations-list"></div>
          </div>

          <!-- Detailed Stages -->
          <div class="cascade-stages-section">
            <h3>Detailed Cascade Stages</h3>
            <div id="cascade-stages" class="cascade-stages"></div>
          </div>
        </div>
      </div>
    `;

    // Store container reference for scoped queries
    this.container = container;
    
    this.setupEventListeners(container);
    // Load initial cascade with default city
    await this.loadCascadeData(this.currentCityId);
  }

  setupEventListeners(container) {
    const simulateBtn = container.querySelector('#cascade-simulate');
    const citySelect = container.querySelector('#city-select');
    const triggerSelect = container.querySelector('#trigger-select');
    const severitySlider = container.querySelector('#severity-slider');
    const severityValue = container.querySelector('#severity-value');

    // Update severity display
    severitySlider.addEventListener('input', (e) => {
      severityValue.textContent = e.target.value;
    });

    // Update city when changed
    citySelect.addEventListener('change', (e) => {
      this.currentCityId = parseInt(e.target.value);
    });

    // Simulate cascade with real API
    simulateBtn.addEventListener('click', async () => {
      const cityId = parseInt(citySelect.value);
      const trigger = triggerSelect.value;
      const severity = parseFloat(severitySlider.value);
      await this.loadCascadeData(cityId, trigger, severity);
    });
  }

  async loadCascadeData(cityId = null, trigger = 'power', severity = 0.8) {
    if (!this.container) {
      console.error('Container not initialized');
      return;
    }

    const loadingEl = this.container.querySelector('#cascade-loading');
    const contentEl = this.container.querySelector('#cascade-content');

    // Use provided cityId or current cityId
    const selectedCityId = cityId !== null ? cityId : this.currentCityId;

    try {
      // Show loading state
      if (loadingEl) loadingEl.classList.remove('hidden');
      if (contentEl) contentEl.classList.add('hidden');

      console.log(`[Cascade] Loading cascade data: cityId=${selectedCityId}, trigger=${trigger}, severity=${severity}`);

      // Fetch real cascade data from API
      this.cascadeData = await this.api.getCascadingFailure(selectedCityId, trigger, severity, 24);

      console.log('[Cascade] Data received:', this.cascadeData);

      // Render the data
      this.renderRealCascade();

      // Hide loading, show content
      if (loadingEl) loadingEl.classList.add('hidden');
      if (contentEl) contentEl.classList.remove('hidden');

    } catch (error) {
      console.error('[Cascade] Failed to load cascade data:', error);
      
      // Extract error message - fetch errors don't have response property
      let errorMessage = error.message || 'Unknown error occurred';
      
      // If error has data property (from our API client), use it
      if (error.data) {
        errorMessage = error.data.message || error.data.error || errorMessage;
      }

      if (loadingEl) {
        loadingEl.innerHTML = `
          <div class="error-message">
            <p>❌ Failed to load cascade data</p>
            <p class="error-detail">${errorMessage}</p>
            <p class="error-hint">Please ensure the backend server is running on port 5000</p>
            <button id="retry-cascade" class="cascade-btn">Retry</button>
          </div>
        `;
        
        // Add retry button handler
        const retryBtn = loadingEl.querySelector('#retry-cascade');
        if (retryBtn) {
          retryBtn.addEventListener('click', () => {
            this.loadCascadeData(selectedCityId, trigger, severity);
          });
        }
      }
    }
  }

  renderRealCascade() {
    if (!this.cascadeData) return;

    this.renderRealTimeline();
    this.renderRealMetrics();
    this.renderRealImpact();
    this.renderRealRecommendations();
    this.renderRealStages();
  }

  renderRealTimeline() {
    if (!this.container || !this.cascadeData) return;
    const container = this.container.querySelector('#cascade-timeline');
    if (!container) return;

    const cascades = this.cascadeData.cascades || [];

    if (cascades.length === 0) {
      container.innerHTML = '<p class="empty-state">No cascade propagation detected.</p>';
      return;
    }

    const timelineHTML = cascades.slice(0, 10).map((cascade, index) => {
      const severity = Math.round(cascade.severity * 100);
      const color = this.getSeverityColor(cascade.severity);

      return `
        <div class="timeline-item">
          <div class="timeline-marker" style="background: ${color};">
            <span class="marker-number">${index + 1}</span>
          </div>
          <div class="timeline-content">
            <div class="timeline-system">${this.formatDomainName(cascade.domain)}</div>
            <div class="timeline-details">
              <span class="timeline-severity">${severity}% severity</span>
              <span class="timeline-delay">${cascade.impact_time_hours.toFixed(1)}h</span>
            </div>
            <div class="timeline-cause">from ${this.formatDomainName(cascade.cause)}</div>
          </div>
          ${index < Math.min(cascades.length, 10) - 1 ? '<div class="timeline-arrow">→</div>' : ''}
        </div>
      `;
    }).join('');

    container.innerHTML = timelineHTML;
  }

  renderRealMetrics() {
    if (!this.container || !this.cascadeData) return;
    const container = this.container.querySelector('#cascade-metrics');
    if (!container) return;

    const cascades = this.cascadeData.cascades || [];

    // Group by domain and find max severity
    const domainMap = {};
    cascades.forEach(c => {
      if (!domainMap[c.domain] || domainMap[c.domain].severity < c.severity) {
        domainMap[c.domain] = c;
      }
    });

    const metricsHTML = Object.values(domainMap).map(cascade => {
      const severity = Math.round(cascade.severity * 100);
      const color = this.getSeverityColor(cascade.severity);

      return `
        <div class="metric-card">
          <div class="metric-header">
            <span class="metric-name">${this.formatDomainName(cascade.domain)}</span>
            <span class="metric-severity" style="color: ${color};">${severity}%</span>
          </div>
          <div class="metric-bar">
            <div class="metric-fill" style="width: ${severity}%; background: ${color};"></div>
          </div>
          <div class="metric-info">
            <span>${cascade.affected_infrastructure.length} components affected</span>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = metricsHTML || '<p class="empty-state">No metrics available.</p>';
  }

  renderRealImpact() {
    if (!this.container || !this.cascadeData) return;
    const container = this.container.querySelector('#cascade-impact');
    if (!container) return;

    const impact = this.cascadeData.total_impact;

    const impactHTML = `
      <div class="impact-stat">
        <div class="impact-icon">🏙️</div>
        <div class="impact-content">
          <div class="impact-value">${impact.affected_domains}</div>
          <div class="impact-label">Domains Affected</div>
        </div>
      </div>
      <div class="impact-stat">
        <div class="impact-icon">👥</div>
        <div class="impact-content">
          <div class="impact-value">${(impact.population_affected / 1000000).toFixed(1)}M</div>
          <div class="impact-label">People Affected</div>
        </div>
      </div>
      <div class="impact-stat">
        <div class="impact-icon">💰</div>
        <div class="impact-content">
          <div class="impact-value">$${(impact.estimated_economic_cost / 1000000).toFixed(0)}M</div>
          <div class="impact-label">Economic Cost</div>
        </div>
      </div>
      <div class="impact-stat">
        <div class="impact-icon">⏱️</div>
        <div class="impact-content">
          <div class="impact-value">${impact.recovery_time_hours}h</div>
          <div class="impact-label">Recovery Time</div>
        </div>
      </div>
    `;

    container.innerHTML = impactHTML;
  }

  renderRealRecommendations() {
    if (!this.container || !this.cascadeData) return;
    const container = this.container.querySelector('#cascade-recommendations');
    if (!container) return;

    const recommendations = this.cascadeData.recommendations || [];

    const recsHTML = recommendations.map((rec, index) => `
      <div class="recommendation-item">
        <div class="recommendation-number">${index + 1}</div>
        <div class="recommendation-text">${rec}</div>
      </div>
    `).join('');

    container.innerHTML = recsHTML || '<p class="empty-state">No recommendations available.</p>';
  }

  renderRealStages() {
    if (!this.container || !this.cascadeData) return;
    const container = this.container.querySelector('#cascade-stages');
    if (!container) return;

    const cascades = this.cascadeData.cascades || [];

    const stagesHTML = cascades.map((cascade, index) => {
      const severity = Math.round(cascade.severity * 100);
      const color = this.getSeverityColor(cascade.severity);

      return `
        <div class="stage-card">
          <div class="stage-header">
            <div class="stage-badge" style="background: ${color};">
              Stage ${index + 1}
            </div>
            <div class="stage-title">${this.formatDomainName(cascade.domain)}</div>
            <div class="stage-time">${cascade.impact_time_hours.toFixed(1)}h</div>
          </div>
          <div class="stage-body">
            <div class="stage-metrics">
              <div class="metric-row">
                <span class="metric-key">Severity:</span>
                <span class="metric-val" style="color: ${color};">${severity}%</span>
              </div>
              <div class="metric-row">
                <span class="metric-key">Caused by:</span>
                <span class="metric-val">${this.formatDomainName(cascade.cause)}</span>
              </div>
              <div class="metric-row">
                <span class="metric-key">Dependency:</span>
                <span class="metric-val">${Math.round(cascade.dependency_strength * 100)}%</span>
              </div>
            </div>
            <div class="stage-infrastructure">
              <strong>Affected Infrastructure:</strong>
              <ul>
                ${cascade.affected_infrastructure.map(i => `<li>${i.replace(/_/g, ' ')}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>
      `;
    }).join('');

    container.innerHTML = stagesHTML || '<p class="empty-state">No cascade stages to display.</p>';
  }

  formatDomainName(domain) {
    return domain.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  // Deprecated old methods (kept for backwards compatibility)
  initializeCascade() { }
  updateCascadeFromScenario() { }
  renderCascade() { }
  renderTimeline() { }
  renderMetricsImpact() { }
  renderStages() { }
  renderSummary() { }
  animateCascade() { }
  resetCascade() { }

  getSeverityColor(severity) {
    if (severity < 0.33) return '#10b981';
    if (severity < 0.66) return '#f59e0b';
    return '#ef4444';
  }

  cleanup() {
    // Cleanup if needed
  }
}
