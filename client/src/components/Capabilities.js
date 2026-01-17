import React from 'react';
import './Capabilities.css';

function Capabilities() {
  const capabilities = [
    {
      icon: '🌍',
      title: 'Real-Time Monitoring',
      description: 'Track environmental, health, and food security risks as they unfold.'
    },
    {
      icon: '🔮',
      title: 'Scenario Simulation',
      description: 'Model outcomes. Understand impact. Plan interventions with precision.'
    },
    {
      icon: '📊',
      title: 'Economic Clarity',
      description: 'See costs, savings, and ROI. Make the business case for action.'
    },
    {
      icon: '🎯',
      title: 'Actionable Insights',
      description: 'Get recommendations tailored to your city\'s unique risk profile.'
    }
  ];

  return (
    <section className="capabilities">
      <div className="capabilities-container">
        <div className="capabilities-grid">
          {capabilities.map((cap, idx) => (
            <div key={idx} className="capability-card">
              <div className="capability-icon">{cap.icon}</div>
              <h3 className="capability-title">{cap.title}</h3>
              <p className="capability-description">{cap.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export default Capabilities;
