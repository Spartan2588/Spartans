import '../styles/pages/about.css';

export class AboutPage {
  constructor() {
  }

  render(container) {
    container.innerHTML = `
      <div class="about">
        <!-- Hero Section -->
        <div class="about-hero">
          <div class="about-hero-content">
            <div class="hero-badge">Urban Intelligence</div>
            <h1>See Risk Before It Emerges</h1>
            <p class="hero-subtitle">A living system for understanding urban futures through real-time risk intelligence</p>
          </div>
        </div>

        <!-- Mission Section -->
        <section class="about-section mission-section">
          <div class="container">
            <div class="section-header">
              <h2>Our Mission</h2>
              <p>Empowering cities to anticipate, understand, and mitigate systemic risks before they cascade into crises</p>
            </div>
            <div class="mission-content">
              <p>Urban environments face interconnected challenges—environmental degradation, health emergencies, food security threats. Traditional approaches analyze these risks in isolation, missing the critical cascading effects that amplify their impact.</p>
              <p>Our platform bridges this gap by providing real-time, integrated risk intelligence that reveals how environmental, health, and food security risks interact, evolve, and compound across urban systems.</p>
            </div>
          </div>
        </section>

        <!-- Core Capabilities -->
        <section class="about-section capabilities-section">
          <div class="container">
            <div class="section-header">
              <h2>Platform Capabilities</h2>
              <p>Comprehensive risk intelligence across multiple domains</p>
            </div>
            <div class="capabilities-grid">
              <div class="capability-card glass">
                <div class="capability-icon">🌍</div>
                <h3>Real-Time Monitoring</h3>
                <p>Continuous tracking of Air Quality Index (AQI), temperature patterns, hospital capacity, crop supply levels, food price indices, and traffic density across major Indian cities.</p>
              </div>
              <div class="capability-card glass">
                <div class="capability-icon">🔮</div>
                <h3>Risk Assessment</h3>
                <p>Multi-dimensional risk scoring across environmental, health, and food security domains using weighted algorithms that reflect real interdependencies.</p>
              </div>
              <div class="capability-card glass">
                <div class="capability-icon">⚡</div>
                <h3>Cascade Analysis</h3>
                <p>Simulate cascading failures to understand how trigger events propagate through interconnected urban systems, revealing hidden vulnerabilities.</p>
              </div>
              <div class="capability-card glass">
                <div class="capability-icon">📊</div>
                <h3>Scenario Simulation</h3>
                <p>Model intervention impacts with economic analysis including ROI, payback periods, and cost-benefit comparisons for informed decision-making.</p>
              </div>
              <div class="capability-card glass">
                <div class="capability-icon">📈</div>
                <h3>Trend Visualization</h3>
                <p>Interactive charts displaying 24-hour historical trends, enabling pattern recognition and anomaly detection across all metrics.</p>
              </div>
              <div class="capability-card glass">
                <div class="capability-icon">🗺️</div>
                <h3>Geospatial Intelligence</h3>
                <p>3D city visualization with data-driven environmental effects that respond to real-time conditions, making risk tangible and actionable.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Key Features -->
        <section class="about-section features-section">
          <div class="container">
            <div class="section-header">
              <h2>Key Features</h2>
              <p>Built for decision-makers who need clarity in complexity</p>
            </div>
            <div class="features-list">
              <div class="feature-item">
                <div class="feature-number">01</div>
                <div class="feature-content">
                  <h3>Integrated Risk Dashboard</h3>
                  <p>Unified view of environmental, health, and food security risks with real-time metrics, probability scores, and severity indicators for Mumbai, Delhi, and Bangalore.</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-number">02</div>
                <div class="feature-content">
                  <h3>Cascading Failure Simulation</h3>
                  <p>Explore how power outages, water crises, or health emergencies trigger chain reactions across infrastructure, revealing systemic vulnerabilities.</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-number">03</div>
                <div class="feature-content">
                  <h3>Interactive 3D City Environment</h3>
                  <p>Persistent 3D city visualization with data-reactive elements—fog density responds to AQI, lighting reflects temperature, zones pulse with activity levels.</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-number">04</div>
                <div class="feature-content">
                  <h3>Economic Impact Analysis</h3>
                  <p>Every intervention scenario includes cost analysis, savings projections, ROI calculations, and payback timelines for budget-conscious planning.</p>
                </div>
              </div>
              <div class="feature-item">
                <div class="feature-number">05</div>
                <div class="feature-content">
                  <h3>Historical Trend Analysis</h3>
                  <p>24-hour time-series data visualization for all metrics, enabling pattern recognition and informed forecasting.</p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <!-- Technology Stack -->
        <section class="about-section tech-section">
          <div class="container">
            <div class="section-header">
              <h2>Technology Stack</h2>
              <p>Built with modern, performant technologies for real-time intelligence</p>
            </div>
            <div class="tech-grid">
              <div class="tech-category">
                <h3>Frontend</h3>
                <ul class="tech-list">
                  <li><span class="tech-name">Vite</span> - Lightning-fast build tool with HMR</li>
                  <li><span class="tech-name">Vanilla JavaScript</span> - ES6 modules for performance</li>
                  <li><span class="tech-name">Three.js</span> - 3D visualization engine</li>
                  <li><span class="tech-name">GSAP</span> - GPU-accelerated animations</li>
                  <li><span class="tech-name">Plotly.js</span> - Interactive data charts</li>
                </ul>
              </div>
              <div class="tech-category">
                <h3>Backend</h3>
                <ul class="tech-list">
                  <li><span class="tech-name">Node.js</span> - High-performance runtime</li>
                  <li><span class="tech-name">Express.js</span> - RESTful API framework</li>
                  <li><span class="tech-name">Real-time Data Store</span> - In-memory analytics</li>
                </ul>
              </div>
              <div class="tech-category">
                <h3>Architecture</h3>
                <ul class="tech-list">
                  <li><span class="tech-name">RESTful API</span> - 6 core endpoints</li>
                  <li><span class="tech-name">Component-based</span> - Modular frontend architecture</li>
                  <li><span class="tech-name">SPA Router</span> - Client-side navigation</li>
                  <li><span class="tech-name">Responsive Design</span> - Mobile-first approach</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <!-- Philosophy -->
        <section class="about-section philosophy-section">
          <div class="container">
            <div class="section-header">
              <h2>Our Approach</h2>
              <p>Three principles that guide everything we build</p>
            </div>
            <div class="philosophy-grid">
              <div class="philosophy-card glass">
                <div class="philosophy-number">01</div>
                <h3>Interconnected</h3>
                <p>Environmental, health, and food security risks are deeply connected. We model those connections to reveal cascading effects invisible to siloed analysis.</p>
              </div>
              <div class="philosophy-card glass">
                <div class="philosophy-number">02</div>
                <h3>Predictive</h3>
                <p>We don't just show what is—we model what could be. Scenario simulation enables proactive decision-making before crises unfold.</p>
              </div>
              <div class="philosophy-card glass">
                <div class="philosophy-number">03</div>
                <h3>Transparent</h3>
                <p>Every insight is grounded in data. Every recommendation is explainable. Trust through clarity, not black boxes.</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Cities Covered -->
        <section class="about-section cities-section">
          <div class="container">
            <div class="section-header">
              <h2>City We Monitor</h2>
              <p>Real-time intelligence for India's financial capital</p>
            </div>
            <div class="cities-grid">
              <div class="city-card glass">
                <h3>Mumbai</h3>
                <p class="city-coords">19.0760°N, 72.8777°E</p>
                <p class="city-desc">India's financial capital, facing coastal climate risks and air quality challenges</p>
              </div>
            </div>
          </div>
        </section>

        <!-- Call to Action -->
        <section class="about-section cta-section">
          <div class="container">
            <div class="cta-content">
              <h2>Ready to explore the platform?</h2>
              <p>Experience real-time urban risk intelligence in action</p>
              <a href="/platform" class="cta-button" data-link>Explore Platform</a>
            </div>
          </div>
        </section>
      </div>
    `;

    // Initialize scroll animations
    this.initScrollAnimations();
  }

  initScrollAnimations() {
    const observerOptions = {
      threshold: 0.1,
      rootMargin: '0px 0px -100px 0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-in');
          observer.unobserve(entry.target);
        }
      });
    }, observerOptions);

    // Observe all sections and cards
    const elementsToAnimate = document.querySelectorAll(
      '.about-section, .capability-card, .feature-item, .philosophy-card, .city-card'
    );

    elementsToAnimate.forEach(el => {
      el.classList.add('fade-in-element');
      observer.observe(el);
    });
  }

  cleanup() {
    // City persists across pages
  }
}
