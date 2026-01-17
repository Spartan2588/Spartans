import { ScenarioChat } from '../components/ScenarioChat.js';
import '../styles/pages/scenarios.css';

export class ScenariosPage {
  constructor() {
  }

  render(container) {
    container.innerHTML = `
      <div class="scenarios">
        <div class="scenarios-hero">
          <div class="scenarios-hero-content">
            <h1>Scenario Simulation</h1>
            <p>Model futures. Understand interventions. Plan with confidence.</p>
          </div>
        </div>

        <section class="scenarios-section">
          <div class="container">
            <div class="chat-container"></div>
            <div class="scenarios-content">
              <h2>What-If Analysis</h2>
              <p>Use the chat interface above to explore different scenarios and see how urban systems respond.</p>
            </div>
          </div>
        </section>
      </div>
    `;

    // Initialize chat
    const chatContainer = container.querySelector('.chat-container');
    const chat = new ScenarioChat();
    chat.render(chatContainer);
  }

  cleanup() {
    // City persists across pages
  }
}
