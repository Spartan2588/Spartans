import React, { useEffect, useRef } from 'react';
import '../styles/pages/impact.css';

const Impact = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = `
      <div class="impact">
        <div class="impact-hero">
          <div class="impact-hero-content">
            <h1>Real-World Impact</h1>
            <p>How cities are using intelligence to lead.</p>
          </div>
        </div>

        <section class="impact-section">
          <div class="container">
            <div class="section-header">
              <h2>Proven Results</h2>
              <p>From data to action</p>
            </div>
            <div class="impact-grid">
              <div class="impact-card glass">
                <div class="impact-number">50+</div>
                <div class="impact-label">Cities Monitored</div>
                <p>Real-time environmental intelligence across urban centers.</p>
              </div>
              <div class="impact-card glass">
                <div class="impact-number">1M+</div>
                <div class="impact-label">Data Points Daily</div>
                <p>Continuous monitoring of environmental, health, and food security metrics.</p>
              </div>
              <div class="impact-card glass">
                <div class="impact-number">99.9%</div>
                <div class="impact-label">System Uptime</div>
                <p>Enterprise-grade reliability for mission-critical decision support.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    `;
  }, []);

  return <div ref={containerRef}></div>;
};

export default Impact;
