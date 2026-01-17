import React from 'react';
import './RecommendationsList.css';

function RecommendationsList({ risks }) {
  const getRecommendations = () => {
    const recommendations = [];

    if (risks.environmental_risk.level === 'high') {
      recommendations.push({
        icon: '🌍',
        title: 'Reduce Air Pollution',
        description: 'Implement emergency traffic restrictions and industrial emission controls'
      });
    }

    if (risks.health_risk.level === 'high') {
      recommendations.push({
        icon: '🏥',
        title: 'Increase Hospital Capacity',
        description: 'Activate emergency protocols and prepare additional medical resources'
      });
    }

    if (risks.food_security_risk.level === 'high') {
      recommendations.push({
        icon: '🌾',
        title: 'Secure Food Supply',
        description: 'Activate emergency food reserves and coordinate with suppliers'
      });
    }

    if (risks.environmental_risk.level === 'medium') {
      recommendations.push({
        icon: '💨',
        title: 'Monitor Air Quality',
        description: 'Increase monitoring frequency and public awareness campaigns'
      });
    }

    if (risks.health_risk.level === 'medium') {
      recommendations.push({
        icon: '⚕️',
        title: 'Prepare Health Services',
        description: 'Brief medical staff and ensure adequate supplies are available'
      });
    }

    return recommendations.slice(0, 5);
  };

  const recommendations = getRecommendations();

  return (
    <div className="recommendations-list">
      <h2>Recommended Actions</h2>
      <div className="recommendations-container">
        {recommendations.length > 0 ? (
          recommendations.map((rec, idx) => (
            <div key={idx} className="recommendation-item">
              <div className="rec-icon">{rec.icon}</div>
              <div className="rec-content">
                <h3>{rec.title}</h3>
                <p>{rec.description}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="no-recommendations">
            <p>All risk levels are low. Continue monitoring.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default RecommendationsList;
