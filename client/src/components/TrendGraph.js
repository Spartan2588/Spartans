/**
 * Standardized Trend Graph Component
 * Single source of truth for all trend visualizations
 * Matches the AQI graph style from Home page
 */

import gsap from 'gsap';

export class TrendGraph {
  constructor(canvasId, title, unit, color = '#a78bfa') {
    this.canvasId = canvasId;
    this.title = title;
    this.unit = unit;
    this.color = color;
    this.canvas = null;
    this.ctx = null;
    this.baselineData = [];
    this.simulationData = [];
  }

  /**
   * Initialize the graph
   */
  init(container) {
    this.canvas = container.querySelector(`#${this.canvasId}`);
    if (!this.canvas) {
      console.warn(`Canvas #${this.canvasId} not found in container`);
      return false;
    }

    this.ctx = this.canvas.getContext('2d');
    if (!this.ctx) {
      console.warn(`Could not get 2D context for #${this.canvasId}`);
      return false;
    }

    this.setupCanvas();
    return true;
  }

  /**
   * Setup canvas with proper sizing
   */
  setupCanvas() {
    if (!this.canvas) return;

    // Canvas already has width/height attributes from HTML
    // Just ensure context is ready
    if (!this.ctx) {
      this.ctx = this.canvas.getContext('2d');
    }

    // Handle window resize - scale canvas responsively
    const resizeHandler = () => {
      if (this.canvas && this.canvas.parentElement) {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        if (rect.width > 0) {
          // Scale canvas to parent width while maintaining aspect ratio
          const scale = rect.width / 400;
          this.canvas.width = Math.round(rect.width);
          this.canvas.height = Math.round(280 * scale);
          this.render();
        }
      }
    };

    window.addEventListener('resize', resizeHandler);
  }

  /**
   * Update graph data
   */
  updateData(baselineData, simulationData) {
    this.baselineData = baselineData || [];
    this.simulationData = simulationData || [];
    
    console.log(`[${this.canvasId}] Data updated:`, {
      baseline: this.baselineData.length,
      simulation: this.simulationData.length,
      baselineValues: this.baselineData.slice(0, 3),
      simulationValues: this.simulationData.slice(0, 3)
    });
    
    // Ensure data is valid
    if (this.baselineData.length === 0 && this.simulationData.length === 0) {
      console.warn(`[${this.canvasId}] No data provided`);
      return;
    }
    
    this.render();
  }

  /**
   * Render the graph
   */
  render() {
    if (!this.ctx) {
      console.warn(`[${this.canvasId}] No context`);
      return;
    }

    if (this.baselineData.length === 0 && this.simulationData.length === 0) {
      console.warn(`[${this.canvasId}] No data to render`);
      return;
    }

    const width = this.canvas.width;
    const height = this.canvas.height;
    
    console.log(`[${this.canvasId}] Rendering with canvas size:`, { width, height });

    const padding = { top: 30, right: 20, bottom: 40, left: 50 };

    // Clear canvas
    this.clearCanvas(width, height);

    // Draw background
    this.drawBackground(width, height);

    // Find data range - ensure we have valid numbers
    const allValues = [
      ...this.baselineData.filter(v => typeof v === 'number' && !isNaN(v)),
      ...this.simulationData.filter(v => typeof v === 'number' && !isNaN(v))
    ];

    if (allValues.length === 0) {
      console.warn(`[${this.canvasId}] No valid numeric data`);
      return;
    }

    const maxValue = Math.max(...allValues);
    const minValue = Math.min(...allValues);
    let range = maxValue - minValue;
    
    // Ensure range is not zero
    if (range === 0) {
      range = maxValue * 0.1 || 1;
    }

    console.log(`[${this.canvasId}] Data range:`, { minValue, maxValue, range });

    // Draw grid
    this.drawGrid(width, height, padding, minValue, maxValue);

    // Draw axes
    this.drawAxes(width, height, padding);

    // Draw baseline line
    this.drawLine(
      this.baselineData,
      padding,
      width,
      height,
      minValue,
      range,
      this.color,
      false,
      2.5
    );

    // Draw simulation line (dashed)
    this.drawLine(
      this.simulationData,
      padding,
      width,
      height,
      minValue,
      range,
      '#06b6d4',
      true,
      2.5
    );

    // Draw axis labels
    this.drawAxisLabels(width, height, padding, minValue, maxValue);
    
    console.log(`[${this.canvasId}] ✓ Render complete`);
  }

  /**
   * Clear canvas
   */
  clearCanvas(width, height) {
    this.ctx.fillStyle = 'rgba(10, 10, 26, 0.5)';
    this.ctx.fillRect(0, 0, width, height);
  }

  /**
   * Draw background gradient
   */
  drawBackground(width, height) {
    const gradient = this.ctx.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, 'rgba(30, 30, 60, 0.1)');
    gradient.addColorStop(1, 'rgba(15, 15, 35, 0.1)');
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(0, 0, width, height);
  }

  /**
   * Draw grid lines
   */
  drawGrid(width, height, padding, minValue, maxValue) {
    this.ctx.strokeStyle = 'rgba(167, 139, 250, 0.15)';
    this.ctx.lineWidth = 1;

    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    // Horizontal grid lines
    for (let i = 0; i <= 4; i++) {
      const y = padding.top + (graphHeight / 4) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(padding.left, y);
      this.ctx.lineTo(width - padding.right, y);
      this.ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 6; i++) {
      const x = padding.left + (graphWidth / 6) * i;
      this.ctx.beginPath();
      this.ctx.moveTo(x, padding.top);
      this.ctx.lineTo(x, height - padding.bottom);
      this.ctx.stroke();
    }
  }

  /**
   * Draw axes
   */
  drawAxes(width, height, padding) {
    this.ctx.strokeStyle = 'rgba(167, 139, 250, 0.3)';
    this.ctx.lineWidth = 2;

    // X-axis
    this.ctx.beginPath();
    this.ctx.moveTo(padding.left, height - padding.bottom);
    this.ctx.lineTo(width - padding.right, height - padding.bottom);
    this.ctx.stroke();

    // Y-axis
    this.ctx.beginPath();
    this.ctx.moveTo(padding.left, padding.top);
    this.ctx.lineTo(padding.left, height - padding.bottom);
    this.ctx.stroke();
  }

  /**
   * Draw a line (baseline or simulation)
   */
  drawLine(data, padding, width, height, minValue, range, color, isDashed, lineWidth) {
    if (!data || data.length < 2) return;

    // Filter out invalid values
    const validData = data.filter(v => typeof v === 'number' && !isNaN(v));
    if (validData.length < 2) return;

    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = lineWidth;

    if (isDashed) {
      this.ctx.setLineDash([5, 5]);
    }

    this.ctx.beginPath();

    data.forEach((value, index) => {
      // Skip invalid values
      if (typeof value !== 'number' || isNaN(value)) {
        return;
      }

      const x = padding.left + (graphWidth / (data.length - 1)) * index;
      const normalized = (value - minValue) / range;
      const clampedNormalized = Math.max(0, Math.min(normalized, 1));
      const y = height - padding.bottom - graphHeight * clampedNormalized;

      if (index === 0 || (index > 0 && (typeof data[index - 1] !== 'number' || isNaN(data[index - 1])))) {
        this.ctx.moveTo(x, y);
      } else {
        this.ctx.lineTo(x, y);
      }
    });

    this.ctx.stroke();
    this.ctx.setLineDash([]);
  }

  /**
   * Draw axis labels
   */
  drawAxisLabels(width, height, padding, minValue, maxValue) {
    this.ctx.fillStyle = '#94a3b8';
    this.ctx.font = '11px Inter';

    const graphWidth = width - padding.left - padding.right;
    const graphHeight = height - padding.top - padding.bottom;

    // X-axis labels (time)
    this.ctx.textAlign = 'center';
    this.ctx.fillText('0h', padding.left, height - padding.bottom + 20);
    this.ctx.fillText('12h', padding.left + graphWidth / 2, height - padding.bottom + 20);
    this.ctx.fillText('24h', width - padding.right, height - padding.bottom + 20);

    // Y-axis labels (values)
    this.ctx.textAlign = 'right';
    for (let i = 0; i <= 4; i++) {
      const value = minValue + (maxValue - minValue) * (i / 4);
      const y = height - padding.bottom - (graphHeight / 4) * i;
      this.ctx.fillText(value.toFixed(0), padding.left - 10, y + 4);
    }

    // Unit label
    this.ctx.textAlign = 'left';
    this.ctx.fillStyle = '#cbd5e1';
    this.ctx.font = '10px Inter';
    this.ctx.fillText(this.unit, padding.left + 5, padding.top - 5);
  }

  /**
   * Animate data update
   */
  animateUpdate() {
    gsap.to(this.canvas, {
      opacity: 0.8,
      duration: 0.2,
      yoyo: true,
      repeat: 1,
      ease: 'power2.inOut'
    });
  }
}
