import { CascadingFailureViz } from '../components/CascadingFailureViz.js';
import '../styles/pages/cascade.css';

export class CascadePage {
  constructor() {
    this.cascadeViz = null;
  }

  async render(container) {
    container.innerHTML = `
      <div class="cascade-page">
        <div class="cascade-hero">
          <div class="cascade-hero-content">
            <h1>Cascading Failure Analysis</h1>
            <p>Understand how failures propagate through interconnected systems</p>
          </div>
        </div>

        <section class="cascade-section">
          <div id="cascade-container"></div>
        </section>
      </div>
    `;

    // Initialize CascadingFailureViz
    this.cascadeViz = new CascadingFailureViz();
    await this.cascadeViz.render(container.querySelector('#cascade-container'));
  }

  cleanup() {
    if (this.cascadeViz) {
      this.cascadeViz.cleanup();
    }
  }
}
