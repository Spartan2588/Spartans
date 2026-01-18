import gsap from 'gsap';
import '../styles/components/scenario-sliders.css';

/**
 * ScenarioSliders Component
 * Provides slider controls for manual metric adjustment.
 * Sliders are initialized from current metrics and update on scenario simulation.
 */
export class ScenarioSliders {
    constructor(onUpdate) {
        this.onUpdate = onUpdate; // Callback for re-simulation
        this.container = null;
        this.values = {
            aqi: 100,
            temperature: 30,
            hospital_load: 50,
            crop_supply: 70
        };
        this.baseline = null;
    }

    /**
     * Set slider values from metrics
     * @param {Object} metrics - Metrics object with aqi, temperature, hospital_load, crop_supply
     * @param {boolean} isBaseline - If true, also update baseline reference
     */
    setValues(metrics, isBaseline = false) {
        if (metrics) {
            this.values = {
                aqi: metrics.aqi ?? 100,
                temperature: metrics.temperature ?? 30,
                hospital_load: metrics.hospital_load ?? 50,
                crop_supply: metrics.crop_supply ?? 70
            };

            if (isBaseline) {
                this.baseline = { ...this.values };
            }
        }
        this.updateSliderDisplays();
    }

    /**
     * Update slider UI to reflect current values
     */
    updateSliderDisplays() {
        if (!this.container) return;

        const sliders = {
            aqi: this.container.querySelector('#slider-aqi'),
            temperature: this.container.querySelector('#slider-temperature'),
            hospital_load: this.container.querySelector('#slider-hospital_load'),
            crop_supply: this.container.querySelector('#slider-crop_supply')
        };

        const displays = {
            aqi: this.container.querySelector('#value-aqi'),
            temperature: this.container.querySelector('#value-temperature'),
            hospital_load: this.container.querySelector('#value-hospital_load'),
            crop_supply: this.container.querySelector('#value-crop_supply')
        };

        for (const [key, slider] of Object.entries(sliders)) {
            if (slider) {
                slider.value = this.values[key];
            }
            if (displays[key]) {
                const unit = key === 'temperature' ? '°C' : key === 'aqi' ? '' : '%';
                displays[key].textContent = `${Math.round(this.values[key])}${unit}`;
            }
        }

        // Update delta badges
        this.updateDeltaBadges();
    }

    /**
     * Update delta badges showing difference from baseline
     */
    updateDeltaBadges() {
        if (!this.container || !this.baseline) return;

        const deltas = {
            aqi: this.container.querySelector('#delta-aqi'),
            temperature: this.container.querySelector('#delta-temperature'),
            hospital_load: this.container.querySelector('#delta-hospital_load'),
            crop_supply: this.container.querySelector('#delta-crop_supply')
        };

        for (const [key, deltaEl] of Object.entries(deltas)) {
            if (deltaEl) {
                const diff = this.values[key] - this.baseline[key];
                const sign = diff >= 0 ? '+' : '';
                const unit = key === 'temperature' ? '°C' : key === 'aqi' ? '' : '%';
                deltaEl.textContent = `${sign}${Math.round(diff)}${unit}`;
                deltaEl.className = `slider-delta ${diff > 0 ? 'delta-up' : diff < 0 ? 'delta-down' : 'delta-neutral'}`;
            }
        }
    }

    /**
     * Render sliders
     * @param {HTMLElement} container - Container element
     */
    render(container) {
        this.container = container;

        container.innerHTML = `
      <div class="scenario-sliders">
        <div class="sliders-header">
          <h4>Adjust Parameters</h4>
          <button class="reset-btn" id="reset-sliders">Reset to Baseline</button>
        </div>
        
        <div class="sliders-grid">
          ${this.renderSlider('aqi', 'AQI', 0, 500, 1, '', 'Air Quality Index')}
          ${this.renderSlider('temperature', 'Temperature', -10, 55, 0.5, '°C', 'Ambient Temperature')}
          ${this.renderSlider('hospital_load', 'Hospital Load', 0, 100, 1, '%', 'Healthcare System Load')}
          ${this.renderSlider('crop_supply', 'Crop Supply', 0, 100, 1, '%', 'Agricultural Supply Index')}
        </div>

        <button class="simulate-btn" id="run-simulation">
          <span class="btn-icon">⚡</span>
          Run Simulation
        </button>
      </div>
    `;

        this.setupEventListeners();
        this.updateSliderDisplays();
    }

    /**
     * Render a single slider
     */
    renderSlider(key, label, min, max, step, unit, tooltip) {
        return `
      <div class="slider-item" data-slider="${key}">
        <div class="slider-header">
          <label for="slider-${key}" title="${tooltip}">${label}</label>
          <div class="slider-values">
            <span class="slider-delta" id="delta-${key}">±0${unit}</span>
            <span class="slider-value" id="value-${key}">${Math.round(this.values[key])}${unit}</span>
          </div>
        </div>
        <div class="slider-track-wrapper">
          <input 
            type="range" 
            id="slider-${key}"
            min="${min}"
            max="${max}"
            step="${step}"
            value="${this.values[key]}"
            class="slider-input"
          />
          <div class="slider-marks">
            <span class="mark">${min}</span>
            <span class="mark">${Math.round((max + min) / 2)}</span>
            <span class="mark">${max}</span>
          </div>
        </div>
      </div>
    `;
    }

    /**
     * Set up event listeners
     */
    setupEventListeners() {
        if (!this.container) return;

        // Slider change events
        const sliders = this.container.querySelectorAll('.slider-input');
        sliders.forEach(slider => {
            slider.addEventListener('input', (e) => {
                const key = e.target.id.replace('slider-', '');
                this.values[key] = parseFloat(e.target.value);
                this.updateSliderDisplays();
            });

            // Add visual feedback on drag
            slider.addEventListener('mousedown', () => {
                gsap.to(slider.closest('.slider-item'), {
                    boxShadow: '0 0 20px rgba(167, 139, 250, 0.2)',
                    duration: 0.2
                });
            });

            slider.addEventListener('mouseup', () => {
                gsap.to(slider.closest('.slider-item'), {
                    boxShadow: 'none',
                    duration: 0.2
                });
            });
        });

        // Reset button
        const resetBtn = this.container.querySelector('#reset-sliders');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => {
                if (this.baseline) {
                    this.values = { ...this.baseline };
                    this.updateSliderDisplays();

                    // Animate reset
                    gsap.to(sliders, {
                        scale: 1.02,
                        duration: 0.1,
                        yoyo: true,
                        repeat: 1
                    });
                }
            });
        }

        // Simulate button
        const simulateBtn = this.container.querySelector('#run-simulation');
        if (simulateBtn) {
            simulateBtn.addEventListener('click', () => {
                if (this.onUpdate) {
                    // Calculate deltas from current values
                    const customDeltas = this.baseline ? {
                        aqi_delta: this.values.aqi - this.baseline.aqi,
                        temperature_delta: this.values.temperature - this.baseline.temperature,
                        hospital_load_delta: this.values.hospital_load - this.baseline.hospital_load,
                        crop_supply_delta: this.values.crop_supply - this.baseline.crop_supply
                    } : null;

                    this.onUpdate(customDeltas);

                    // Button feedback
                    gsap.to(simulateBtn, {
                        scale: 0.95,
                        duration: 0.1,
                        yoyo: true,
                        repeat: 1
                    });
                }
            });
        }
    }

    /**
     * Get current slider values as custom deltas
     */
    getCurrentDeltas() {
        if (!this.baseline) return null;

        return {
            aqi_delta: this.values.aqi - this.baseline.aqi,
            temperature_delta: this.values.temperature - this.baseline.temperature,
            hospital_load_delta: this.values.hospital_load - this.baseline.hospital_load,
            crop_supply_delta: this.values.crop_supply - this.baseline.crop_supply
        };
    }
}
