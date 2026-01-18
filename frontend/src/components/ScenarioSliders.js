
import gsap from 'gsap';
import '../styles/components/scenario-sliders.css';

/**
 * ScenarioSliders Component
 * Interactive slider controls for manual scenario adjustments.
 * Syncs with current baseline metrics and provides real-time feedback.
 */
export class ScenarioSliders {
    constructor(onUpdate) {
        this.onUpdate = onUpdate; // Callback on simulation run
        this.container = null;
        this.baselineValues = {};
        this.currentValues = {};
        this.lastInferredValues = null;
    }

    /**
     * Set the values for the sliders
     * @param {Object} values - Key/Value pairs of metrics
     * @param {boolean} isBaseline - Whether these are new baseline values
     */
    setValues(values, isBaseline = false) {
        if (isBaseline) {
            this.baselineValues = { ...values };
        }
        this.currentValues = { ...values };
        this.updateSliderUI();
    }

    render(container) {
        this.container = container;
        this.container.innerHTML = `
      <div class="scenario-sliders glass">
        <div class="sliders-header">
          <div class="header-main">
            <h3>Scenario Parameters</h3>
            <span class="header-subtitle">Adjust manually to explore risk ripples</span>
          </div>
          <button class="reset-sliders-btn" id="reset-sliders" title="Reset to baseline">
            Reset to Baseline
          </button>
        </div>

        <div class="sliders-grid">
          ${this.renderSlider('aqi', 'Air Quality (AQI)', 0, 500, '💨', 'Adjust atmospheric particulate matter')}
          ${this.renderSlider('hospital_load', 'Hospital Load (%)', 0, 100, '🏥', 'Current patient occupancy strain')}
          ${this.renderSlider('crop_supply', 'Food Availability (%)', 10, 100, '🌾', 'Urban food supply and availability')}
          ${this.renderSlider('temperature', 'Temperature (°C)', -10, 55, '🌡️', 'Ambient city temperature')}
        </div>

        <div class="sliders-footer">
          <button class="run-manual-simulation-btn" id="run-manual-sim">
            <span class="btn-text">Run Manual Simulation</span>
            <span class="btn-icon">⚡</span>
          </button>
        </div>
      </div>
    `;

        this.setupEventListeners();
        this.updateSliderUI();
    }

    renderSlider(id, label, min, max, icon, tooltip) {
        const value = this.currentValues[id] ?? ((min + max) / 2);

        return `
      <div class="slider-item" data-slider="${id}">
        <div class="slider-info">
          <div class="slider-label-group">
            <span class="slider-icon">${icon}</span>
            <label for="slider-${id}">${label}</label>
            <span class="slider-tooltip" title="${tooltip}">ⓘ</span>
          </div>
          <div class="value-display">
            <span class="current-value" id="val-${id}">${value.toFixed(1)}</span>
            <span class="baseline-reference" id="ref-${id}" title="Current baseline">/ ${this.baselineValues[id]?.toFixed(1) || '0.0'}</span>
          </div>
        </div>
        <div class="slider-input-wrapper">
          <input 
            type="range" 
            id="slider-${id}" 
            min="${min}" 
            max="${max}" 
            value="${value}" 
            step="${id === 'temperature' ? '0.1' : '1'}"
            class="slider-input"
          >
          <div class="slider-track-fill"></div>
        </div>
      </div>
    `;
    }

    setupEventListeners() {
        const inputs = this.container.querySelectorAll('.slider-input');
        const resetBtn = this.container.querySelector('#reset-sliders');
        const runBtn = this.container.querySelector('#run-manual-sim');

        inputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const id = e.target.id.replace('slider-', '');
                const val = parseFloat(e.target.value);
                this.currentValues[id] = val;
                this.updateValueDisplay(id, val);
            });
        });

        resetBtn.addEventListener('click', () => {
            this.currentValues = { ...this.baselineValues };
            this.updateSliderUI();
            // Animate reset
            gsap.to(inputs, { scale: 1.05, duration: 0.1, yoyo: true, repeat: 1 });
        });

        runBtn.addEventListener('click', () => {
            if (this.onUpdate) {
                // Calculate deltas relative to baseline
                const deltas = {
                    aqi_delta: this.currentValues.aqi - this.baselineValues.aqi,
                    temperature_delta: this.currentValues.temperature - this.baselineValues.temperature,
                    hospital_load_delta: this.currentValues.hospital_load - this.baselineValues.hospital_load,
                    crop_supply_delta: this.currentValues.crop_supply - this.baselineValues.crop_supply
                };
                this.onUpdate(deltas);
            }
        });

        // Animate presence
        gsap.from(this.container.querySelector('.scenario-sliders'), {
            opacity: 0,
            x: -20,
            duration: 0.6,
            ease: 'power2.out'
        });
    }

    updateValueDisplay(id, val) {
        const display = this.container.querySelector(`#val-${id}`);
        if (display) display.textContent = val.toFixed(1);

        // Update track fill
        const input = this.container.querySelector(`#slider-${id}`);
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);
        const percent = ((val - min) / (max - min)) * 100;

        // Check if it's different from baseline to color the text
        const baseline = this.baselineValues[id];
        if (Math.abs(val - baseline) > 0.05) {
            display.classList.add('value-changed');
        } else {
            display.classList.remove('value-changed');
        }
    }

    updateSliderUI() {
        if (!this.container) return;

        Object.keys(this.currentValues).forEach(id => {
            const input = this.container.querySelector(`#slider-${id}`);
            if (input) {
                input.value = this.currentValues[id];
                this.updateValueDisplay(id, this.currentValues[id]);
            }

            const ref = this.container.querySelector(`#ref-${id}`);
            if (ref) {
                ref.textContent = `/ ${this.baselineValues[id]?.toFixed(1) || '0.0'}`;
            }
        });
    }
}
