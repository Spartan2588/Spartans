import { DataDashboard } from '../components/DataDashboard.js';
import '../styles/pages/platform.css';

export class PlatformPage {
  constructor() {
    this.dashboard = null;
  }

  async render(container) {
    container.innerHTML = `
      <div class="platform">
        <div class="platform-hero">
          <div class="platform-hero-content">
            <h1>The Platform</h1>
            <p>Real-time urban risk intelligence</p>
          </div>
        </div>

        <section class="platform-section">
          <div id="dashboard-container"></div>
        </section>
      </div>
    `;

    // Initialize DataDashboard
    this.dashboard = new DataDashboard();
    await this.dashboard.render(container.querySelector('#dashboard-container'));
  }

  cleanup() {
    if (this.dashboard) {
      this.dashboard.cleanup();
    }
  }
}
