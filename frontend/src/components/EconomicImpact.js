import React from 'react';
import './EconomicImpact.css';

function EconomicImpact({ impact }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="economic-impact">
      <h2>Economic Impact</h2>
      <div className="impact-cards">
        <div className="impact-card">
          <div className="impact-icon">💰</div>
          <div className="impact-label">Intervention Cost</div>
          <div className="impact-value">
            {formatCurrency(impact.intervention_cost)}
          </div>
        </div>

        <div className="impact-card">
          <div className="impact-icon">💵</div>
          <div className="impact-label">Total Savings</div>
          <div className="impact-value">
            {formatCurrency(impact.total_savings)}
          </div>
        </div>

        <div className="impact-card highlight">
          <div className="impact-icon">📈</div>
          <div className="impact-label">ROI</div>
          <div className="impact-value">
            {impact.roi}x
          </div>
        </div>
      </div>
    </div>
  );
}

export default EconomicImpact;
