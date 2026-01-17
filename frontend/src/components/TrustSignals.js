import React from 'react';
import './TrustSignals.css';

function TrustSignals() {
  return (
    <section className="trust-signals">
      <div className="trust-container">
        <div className="trust-header">
          <h2>Trusted by Leading Cities</h2>
        </div>

        <div className="trust-content">
          <div className="trust-stat">
            <div className="stat-number">50+</div>
            <div className="stat-label">Cities Monitored</div>
          </div>
          <div className="trust-stat">
            <div className="stat-number">1M+</div>
            <div className="stat-label">Data Points Daily</div>
          </div>
          <div className="trust-stat">
            <div className="stat-number">99.9%</div>
            <div className="stat-label">Uptime</div>
          </div>
        </div>

        <div className="trust-footer">
          <p>Enterprise-grade security. Real-time accuracy. Proven impact.</p>
        </div>
      </div>
    </section>
  );
}

export default TrustSignals;
