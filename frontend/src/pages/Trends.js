import React, { useEffect, useRef } from 'react';
import { TrendAnalysis } from '../components/TrendAnalysis.js';
import '../styles/pages/trends.css';

const Trends = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
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

    const trendAnalysis = new TrendAnalysis();
    trendAnalysis.render(container.querySelector('#trend-container'));

    return () => {
      if (trendAnalysis.cleanup) trendAnalysis.cleanup();
    };
  }, []);

  return <div ref={containerRef}></div>;
};

export default Trends;
