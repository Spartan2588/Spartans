import React, { useEffect, useRef } from 'react';
import { DataDashboard } from '../components/DataDashboard.js';
import '../styles/pages/platform.css';

const Platform = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
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

    const dashboard = new DataDashboard();
    dashboard.render(container.querySelector('#dashboard-container'));

    return () => {
      if (dashboard.cleanup) dashboard.cleanup();
    };
  }, []);

  return <div ref={containerRef}></div>;
};

export default Platform;
