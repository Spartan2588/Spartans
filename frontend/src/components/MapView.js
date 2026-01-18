import { ApiClient } from '../utils/api.js';
import gsap from 'gsap';
import '../styles/components/map-view.css';

/**
 * Map View Component - API-Ready Abstraction Layer
 * Designed to accept future GeoJSON, heatmap, and zone-based APIs
 */
export class MapView {
  constructor() {
    this.api = new ApiClient();
    this.currentCity = 1;
    this.currentState = null;
    this.currentRisks = null;
    this.selectedLayer = 'environmental';
    this.canvas = null;
    this.ctx = null;
  }

  async render(container) {
    container.innerHTML = `
      <div class="map-view">
        <div class="map-header">
          <h2>Urban Risk Map</h2>
          <div class="map-controls">
            <select id="map-layer" class="map-select">
              <option value="environmental">Environmental Risk</option>
              <option value="health">Health Infrastructure</option>
              <option value="agriculture">Agricultural Zones</option>
              <option value="combined">Combined Risk</option>
            </select>
            <button id="map-refresh" class="map-btn">↻ Refresh</button>
          </div>
        </div>

        <div class="map-container">
          <canvas id="map-canvas" class="map-canvas"></canvas>
          <div class="map-overlay">
            <div class="map-info">
              <div id="map-city-info" class="info-panel"></div>
              <div id="map-legend" class="legend-panel"></div>
            </div>
          </div>
        </div>

        <div class="map-api-hooks">
          <div class="hook-info">
            <h4>API Integration Points</h4>
            <ul>
              <li>GeoJSON layers: <code>mapView.loadGeoJSON(data)</code></li>
              <li>Heatmap data: <code>mapView.renderHeatmap(data)</code></li>
              <li>Zone metrics: <code>mapView.updateZones(zones)</code></li>
              <li>Real-time updates: <code>mapView.syncWithScenario(scenario)</code></li>
            </ul>
          </div>
        </div>
      </div>
    `;

    this.canvas = container.querySelector('#map-canvas');
    this.ctx = this.canvas.getContext('2d');

    this.setupCanvas();
    this.setupEventListeners(container);
    await this.loadData();
  }

  setupCanvas() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;

    window.addEventListener('resize', () => {
      const newRect = this.canvas.parentElement.getBoundingClientRect();
      this.canvas.width = newRect.width;
      this.canvas.height = newRect.height;
      this.draw();
    });
  }

  setupEventListeners(container) {
    const layerSelect = container.querySelector('#map-layer');
    const refreshBtn = container.querySelector('#map-refresh');

    layerSelect.addEventListener('change', (e) => {
      this.selectedLayer = e.target.value;
      this.draw();
    });

    refreshBtn.addEventListener('click', () => {
      this.loadData();
      gsap.to(refreshBtn, { rotation: 360, duration: 0.6 });
    });

    // Listen for city changes
    window.addEventListener('city-changed', (e) => {
      this.currentCity = e.detail.cityId;
      this.loadData();
    });

    // Listen for scenario updates
    window.addEventListener('scenario-updated', (e) => {
      this.syncWithScenario(e.detail);
    });
  }

  async loadData() {
    try {
      const [state, risks] = await Promise.all([
        this.api.getCurrentState(this.currentCity),
        this.api.getRiskAssessment(this.currentCity)
      ]);

      this.currentState = state;
      this.currentRisks = risks;

      this.updateCityInfo();
      this.draw();
    } catch (error) {
      console.error('Failed to load map data:', error);
    }
  }

  draw() {
    if (!this.ctx) return;

    const width = this.canvas.width;
    const height = this.canvas.height;

    // Clear canvas
    this.ctx.fillStyle = '#0a0a1a';
    this.ctx.fillRect(0, 0, width, height);

    // Draw map background
    this.drawMapBackground();

    // Draw zones based on selected layer
    switch (this.selectedLayer) {
      case 'environmental':
        this.drawEnvironmentalLayer();
        break;
      case 'health':
        this.drawHealthLayer();
        break;
      case 'agriculture':
        this.drawAgricultureLayer();
        break;
      case 'combined':
        this.drawCombinedLayer();
        break;
    }

    // Draw grid and labels
    this.drawGrid();
    this.drawLabels();
  }

  drawMapBackground() {
    const width = this.canvas.width;
    const height = this.canvas.height;

    // Gradient background
    const gradient = this.ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(30, 30, 60, 0.3)');
    gradient.addColorStop(1, 'rgba(15, 15, 35, 0.3)');

    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);

    // Border
    this.ctx.strokeStyle = 'rgba(167, 139, 250, 0.2)';
    this.ctx.lineWidth = 2;
    this.ctx.strokeRect(0, 0, width, height);
  }

  drawEnvironmentalLayer() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const padding = 40;

    // Define zones (placeholder - ready for real GeoJSON)
    const zones = [
      { x: 0.2, y: 0.2, w: 0.3, h: 0.3, name: 'Industrial', risk: this.currentRisks?.environmental_risk?.score || 0.5 },
      { x: 0.6, y: 0.2, w: 0.3, h: 0.3, name: 'Residential', risk: 0.3 },
      { x: 0.2, y: 0.6, w: 0.3, h: 0.3, name: 'Commercial', risk: 0.4 },
      { x: 0.6, y: 0.6, w: 0.3, h: 0.3, name: 'Green Space', risk: 0.2 }
    ];

    zones.forEach(zone => {
      const x = padding + zone.x * (width - padding * 2);
      const y = padding + zone.y * (height - padding * 2);
      const w = zone.w * (width - padding * 2);
      const h = zone.h * (height - padding * 2);

      // Color based on risk
      const color = this.getRiskColor(zone.risk);
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = 0.6;
      this.ctx.fillRect(x, y, w, h);
      this.ctx.globalAlpha = 1;

      // Border
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, w, h);

      // Label
      this.ctx.fillStyle = '#e2e8f0';
      this.ctx.font = 'bold 12px Inter';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(zone.name, x + w / 2, y + h / 2);
    });
  }

  drawHealthLayer() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const padding = 40;

    // Health infrastructure zones
    const facilities = [
      { x: 0.3, y: 0.3, name: 'Hospital A', load: this.currentRisks?.health_risk?.score || 0.5 },
      { x: 0.7, y: 0.3, name: 'Clinic B', load: 0.3 },
      { x: 0.3, y: 0.7, name: 'Hospital C', load: 0.4 },
      { x: 0.7, y: 0.7, name: 'Clinic D', load: 0.2 }
    ];

    facilities.forEach(facility => {
      const x = padding + facility.x * (width - padding * 2);
      const y = padding + facility.y * (height - padding * 2);
      const radius = 30 + facility.load * 20;

      // Draw facility circle
      const color = this.getRiskColor(facility.load);
      this.ctx.fillStyle = color;
      this.ctx.globalAlpha = 0.5;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.fill();
      this.ctx.globalAlpha = 1;

      // Border
      this.ctx.strokeStyle = color;
      this.ctx.lineWidth = 2;
      this.ctx.beginPath();
      this.ctx.arc(x, y, radius, 0, Math.PI * 2);
      this.ctx.stroke();

      // Icon
      this.ctx.fillStyle = '#e2e8f0';
      this.ctx.font = '20px Arial';
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('🏥', x, y);

      // Label
      this.ctx.fillStyle = '#e2e8f0';
      this.ctx.font = '11px Inter';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(facility.name, x, y + radius + 15);
    });
  }

  drawAgricultureLayer() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const padding = 40;

    // Agricultural zones
    const zones = [
      { x: 0.2, y: 0.2, w: 0.25, h: 0.25, name: 'North Farm', supply: this.currentRisks?.food_security_risk?.score || 0.5 },
      { x: 0.55, y: 0.2, w: 0.25, h: 0.25, name: 'East Farm', supply: 0.6 },
      { x: 0.2, y: 0.55, w: 0.25, h: 0.25, name: 'South Farm', supply: 0.4 },
      { x: 0.55, y: 0.55, w: 0.25, h: 0.25, name: 'West Farm', supply: 0.7 }
    ];

    zones.forEach(zone => {
      const x = padding + zone.x * (width - padding * 2);
      const y = padding + zone.y * (height - padding * 2);
      const w = zone.w * (width - padding * 2);
      const h = zone.h * (height - padding * 2);

      // Color based on supply (inverse risk)
      const supplyColor = this.getSupplyColor(zone.supply);
      this.ctx.fillStyle = supplyColor;
      this.ctx.globalAlpha = 0.6;
      this.ctx.fillRect(x, y, w, h);
      this.ctx.globalAlpha = 1;

      // Border
      this.ctx.strokeStyle = supplyColor;
      this.ctx.lineWidth = 2;
      this.ctx.strokeRect(x, y, w, h);

      // Label
      this.ctx.fillStyle = '#e2e8f0';
      this.ctx.font = 'bold 11px Inter';
      this.ctx.textAlign = 'center';
      this.ctx.fillText(zone.name, x + w / 2, y + h / 2);
    });
  }

  drawCombinedLayer() {
    // Draw all layers with reduced opacity
    this.ctx.globalAlpha = 0.4;
    this.drawEnvironmentalLayer();
    this.ctx.globalAlpha = 0.4;
    this.drawHealthLayer();
    this.ctx.globalAlpha = 0.4;
    this.drawAgricultureLayer();
    this.ctx.globalAlpha = 1;
  }

  drawGrid() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const padding = 40;
    const gridSize = 4;

    this.ctx.strokeStyle = 'rgba(167, 139, 250, 0.1)';
    this.ctx.lineWidth = 1;

    for (let i = 0; i <= gridSize; i++) {
      const x = padding + (i / gridSize) * (width - padding * 2);
      const y = padding + (i / gridSize) * (height - padding * 2);

      // Vertical lines
      this.ctx.beginPath();
      this.ctx.moveTo(x, padding);
      this.ctx.lineTo(x, height - padding);
      this.ctx.stroke();

      // Horizontal lines
      this.ctx.beginPath();
      this.ctx.moveTo(padding, y);
      this.ctx.lineTo(width - padding, y);
      this.ctx.stroke();
    }
  }

  drawLabels() {
    const width = this.canvas.width;
    const height = this.canvas.height;
    const padding = 40;

    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '11px Inter';
    this.ctx.textAlign = 'center';

    // Axis labels
    this.ctx.fillText('West', padding / 2, height / 2);
    this.ctx.fillText('East', width - padding / 2, height / 2);
    this.ctx.fillText('North', width / 2, padding / 2);
    this.ctx.fillText('South', width / 2, height - padding / 2);
  }

  updateCityInfo() {
    const infoPanel = document.querySelector('#map-city-info');
    if (!infoPanel || !this.currentState) return;

    infoPanel.innerHTML = `
      <div class="city-info-item">
        <span class="info-label">${this.currentState.city}</span>
        <span class="info-value">${this.currentState.aqi} AQI</span>
      </div>
      <div class="city-info-item">
        <span class="info-label">Temperature</span>
        <span class="info-value">${this.currentState.temperature}°C</span>
      </div>
    `;

    const legendPanel = document.querySelector('#map-legend');
    if (legendPanel) {
      legendPanel.innerHTML = `
        <div class="legend-title">Risk Levels</div>
        <div class="legend-item">
          <span class="legend-color" style="background: #10b981;"></span>
          <span>Low</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #f59e0b;"></span>
          <span>Medium</span>
        </div>
        <div class="legend-item">
          <span class="legend-color" style="background: #ef4444;"></span>
          <span>High</span>
        </div>
      `;
    }
  }

  getRiskColor(risk) {
    if (risk < 0.33) return '#10b981';
    if (risk < 0.66) return '#f59e0b';
    return '#ef4444';
  }

  getSupplyColor(supply) {
    // Inverse: high supply = green, low supply = red
    if (supply > 0.66) return '#10b981';
    if (supply > 0.33) return '#f59e0b';
    return '#ef4444';
  }

  /**
   * API Hook: Load GeoJSON data
   * Future integration point for real map data
   */
  loadGeoJSON(geoJsonData) {
    console.log('GeoJSON data ready for integration:', geoJsonData);
    // Implementation will accept real GeoJSON and render features
  }

  /**
   * API Hook: Render heatmap
   * Future integration point for heatmap APIs
   */
  renderHeatmap(heatmapData) {
    console.log('Heatmap data ready for integration:', heatmapData);
    // Implementation will render heatmap overlay
  }

  /**
   * API Hook: Update zones with real data
   * Future integration point for zone-based metrics
   */
  updateZones(zones) {
    console.log('Zone data ready for integration:', zones);
    // Implementation will update zone rendering with real data
  }

  /**
   * Sync map with scenario changes
   */
  syncWithScenario(scenario) {
    if (scenario.intervention) {
      this.currentRisks = scenario.intervention;
      this.draw();
    }
  }

  cleanup() {
    // Cleanup if needed
  }
}
