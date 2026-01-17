import React from 'react';
import './ComparisonDisplay.css';

function ComparisonDisplay({ comparison }) {
  const getRiskColor = (level) => {
    switch (level) {
      case 'low':
        return '#10b981';
      case 'medium':
        return '#f59e0b';
      case 'high':
        return '#ef4444';
      default:
        return '#6b7280';
    }
  };

  const risks = [
    { key: 'environmental_risk', label: 'Environmental Risk', icon: '🌍' },
    { key: 'health_risk', label: 'Health Risk', icon: '🏥' },
    { key: 'food_security_risk', label: 'Food Security Risk', icon: '🌾' }
  ];

  return (
    <div className="comparison-display">
      <h2>Scenario Comparison</h2>
      <div className="comparison-grid">
        {risks.map((risk) => {
          const baseline = comparison.baseline[risk.key];
          const intervention = comparison.intervention[risk.key];
          const probChange = baseline.probability - intervention.probability;

          return (
            <div key={risk.key} className="comparison-card">
              <div className="comparison-header">
                <span className="comparison-icon">{risk.icon}</span>
                <h3>{risk.label}</h3>
              </div>

              <div className="comparison-content">
                <div className="comparison-column">
                  <h4>Baseline</h4>
                  <div className="risk-item">
                    <span className="label">Level</span>
                    <span
                      className="level"
                      style={{ color: getRiskColor(baseline.level) }}
                    >
                      {baseline.level.toUpperCase()}
                    </span>
                  </div>
                  <div className="risk-item">
                    <span className="label">Probability</span>
                    <span className="value">{baseline.probability}%</span>
                  </div>
                </div>

                <div className="comparison-column">
                  <h4>With Intervention</h4>
                  <div className="risk-item">
                    <span className="label">Level</span>
                    <span
                      className="level"
                      style={{ color: getRiskColor(intervention.level) }}
                    >
                      {intervention.level.toUpperCase()}
                    </span>
                  </div>
                  <div className="risk-item">
                    <span className="label">Probability</span>
                    <span className="value">{intervention.probability}%</span>
                  </div>
                </div>

                <div className="comparison-change">
                  <span className="label">Change</span>
                  <span className={`change-value ${probChange > 0 ? 'positive' : 'negative'}`}>
                    {probChange > 0 ? '+' : ''}{probChange}%
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default ComparisonDisplay;
