import gsap from 'gsap';
import { ApiClient } from '../utils/api.js';
import '../styles/components/scenario-chat.css';

export class ScenarioChat {
  constructor() {
    this.api = new ApiClient();
    this.isLoading = false;
  }

  render(container) {
    container.innerHTML = `
      <div class="scenario-chat">
        <div class="chat-input-wrapper">
          <form class="chat-form" id="scenario-form">
            <input
              type="text"
              class="chat-input"
              id="scenario-input"
              placeholder="What if a heatwave hits Delhi?"
              autocomplete="off"
            >
            <button type="submit" class="chat-submit">
              <span class="submit-text">Simulate</span>
              <span class="submit-icon">→</span>
            </button>
          </form>
          <div class="chat-suggestions">
            <button class="suggestion-btn" data-scenario="heatwave">
              🔥 Heatwave
            </button>
            <button class="suggestion-btn" data-scenario="drought">
              🏜️ Drought
            </button>
            <button class="suggestion-btn" data-scenario="crisis">
              ⚠️ Crisis
            </button>
          </div>
        </div>
      </div>
    `;

    this.setupEventListeners(container);
  }

  setupEventListeners(container) {
    const form = container.querySelector('#scenario-form');
    const input = container.querySelector('#scenario-input');
    const suggestions = container.querySelectorAll('.suggestion-btn');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const query = input.value.trim();
      if (query) {
        this.handleScenarioQuery(query);
        input.value = '';
      }
    });

    suggestions.forEach(btn => {
      btn.addEventListener('click', () => {
        const scenario = btn.dataset.scenario;
        this.handleScenarioQuery(`What if a ${scenario} hits Delhi?`);
      });
    });

    // Focus animation
    input.addEventListener('focus', () => {
      gsap.to(container.querySelector('.chat-input-wrapper'), {
        boxShadow: '0 0 30px rgba(167, 139, 250, 0.3)',
        duration: 0.3
      });
    });

    input.addEventListener('blur', () => {
      gsap.to(container.querySelector('.chat-input-wrapper'), {
        boxShadow: '0 0 0px rgba(167, 139, 250, 0)',
        duration: 0.3
      });
    });
  }

  async handleScenarioQuery(query) {
    if (this.isLoading) return;

    this.isLoading = true;
    const input = document.querySelector('#scenario-input');
    const btn = document.querySelector('.chat-submit');

    // Show loading state
    gsap.to(btn, { opacity: 0.5, duration: 0.2 });

    try {
      // Parse scenario from query
      const scenario = this.parseScenario(query);
      
      // Trigger scenario simulation
      const result = await this.api.simulateScenario(scenario);
      
      // Dispatch custom event for other components to listen
      window.dispatchEvent(new CustomEvent('scenario-updated', { detail: result }));

      // Show success feedback
      gsap.to(input, {
        borderColor: 'rgba(16, 185, 129, 0.5)',
        duration: 0.3
      });

      setTimeout(() => {
        gsap.to(input, {
          borderColor: 'rgba(167, 139, 250, 0.2)',
          duration: 0.3
        });
      }, 1000);
    } catch (error) {
      console.error('Scenario simulation failed:', error);
      gsap.to(input, {
        borderColor: 'rgba(239, 68, 68, 0.5)',
        duration: 0.3
      });
    } finally {
      this.isLoading = false;
      gsap.to(btn, { opacity: 1, duration: 0.2 });
    }
  }

  parseScenario(query) {
    const lower = query.toLowerCase();
    
    if (lower.includes('heatwave')) {
      return { aqi: 400, hospital_load: 85, crop_supply: 40, temperature: 45 };
    } else if (lower.includes('drought')) {
      return { aqi: 250, hospital_load: 60, crop_supply: 20, temperature: 38 };
    } else if (lower.includes('crisis')) {
      return { aqi: 450, hospital_load: 95, crop_supply: 10, temperature: 48 };
    } else {
      return { aqi: 100, hospital_load: 30, crop_supply: 85, temperature: 25 };
    }
  }
}
