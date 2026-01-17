import '../styles/components/risk-cards.css';

export class RiskCards {
  getRiskColor(level) {
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
  }

  render(container, risks) {
    const cards = [
      {
        title: 'Environmental Risk',
        data: risks.environmental_risk,
        icon: '🌍'
      },
      {
        title: 'Health Risk',
        data: risks.health_risk,
        icon: '🏥'
      },
      {
        title: 'Food Security Risk',
        data: risks.food_security_risk,
        icon: '🌾'
      }
    ];

    container.innerHTML = `
      <div class="risk-cards">
        ${cards.map(card => `
          <div class="risk-card glass">
            <div class="risk-card-header">
              <span class="risk-icon">${card.icon}</span>
              <h3>${card.title}</h3>
            </div>
            <div class="risk-card-content">
              <div class="risk-level" style="color: ${this.getRiskColor(card.data.level)}">
                ${card.data.level.toUpperCase()}
              </div>
              <div class="risk-probability">
                <span class="label">Probability</span>
                <span class="value">${card.data.probability}%</span>
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    `;
  }
}
