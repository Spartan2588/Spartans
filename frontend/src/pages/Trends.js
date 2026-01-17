import { TrendAnalysis } from '../components/TrendAnalysis.js';
import '../styles/pages/trends.css';

export class TrendsPage {
  constructor() {
    this.trendAnalysis = null;
  }

  async render(container) {
    container.innerHTML = `
      <div class="trends-page">
        <div class="trends-hero">
          <div class="trends-hero-content">
            <h1>Trend Analysis</h1>
            <p>Monitor how metrics and risks evolve over time</p>
          </div>
        </div>

        <section class="trends-section">
          <div id="trend-container"></div>
        </section>
      </div>
    `;

    // Initialize TrendAnalysis
    this.trendAnalysis = new TrendAnalysis();
    await this.trendAnalysis.render(container.querySelector('#trend-container'));
  }

  cleanup() {
    if (this.trendAnalysis) {
      this.trendAnalysis.cleanup();
    }
  }
}
