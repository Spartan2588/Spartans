import '../styles/pages/about.css';

export class AboutPage {
  constructor() {
  }

  render(container) {
    container.innerHTML = `
      <div class="about">
        <div class="about-hero">
          <div class="about-hero-content">
            <h1>Our Philosophy</h1>
            <p>Intelligence for cities that lead.</p>
          </div>
        </div>

        <section class="about-section">
          <div class="container">
            <div class="section-header">
              <h2>How We Think</h2>
              <p>Systems thinking. Data-driven. Human-centered.</p>
            </div>
            <div class="philosophy-grid">
              <div class="philosophy-card glass">
                <h3>Interconnected</h3>
                <p>Environmental, health, and food security risks are deeply connected. We model those connections.</p>
              </div>
              <div class="philosophy-card glass">
                <h3>Real-Time</h3>
                <p>Risks emerge and evolve. Our system monitors continuously, revealing changes as they happen.</p>
              </div>
              <div class="philosophy-card glass">
                <h3>Predictive</h3>
                <p>We don't just show what is. We model what could be, enabling proactive decision-making.</p>
              </div>
              <div class="philosophy-card glass">
                <h3>Transparent</h3>
                <p>Every insight is grounded in data. Every recommendation is explainable. Trust through clarity.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  cleanup() {
    // City persists across pages
  }
}
