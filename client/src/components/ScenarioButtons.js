import React from 'react';
import './ScenarioButtons.css';

function ScenarioButtons({ onScenario }) {
  const scenarios = [
    { id: 'normal', label: 'Normal', icon: '☀️' },
    { id: 'heatwave', label: 'Heatwave', icon: '🔥' },
    { id: 'drought', label: 'Drought', icon: '🏜️' },
    { id: 'crisis', label: 'Crisis', icon: '⚠️' }
  ];

  return (
    <div className="scenario-buttons">
      {scenarios.map((scenario) => (
        <button
          key={scenario.id}
          className="scenario-btn"
          onClick={() => onScenario(scenario.id)}
        >
          <span className="scenario-icon">{scenario.icon}</span>
          <span className="scenario-label">{scenario.label}</span>
        </button>
      ))}
    </div>
  );
}

export default ScenarioButtons;
