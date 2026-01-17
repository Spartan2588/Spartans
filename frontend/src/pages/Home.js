import { ScenarioChat } from '../components/ScenarioChat.js';
import gsap from 'gsap';
import '../styles/pages/home.css';

export class HomePage {
  constructor() {
    this.chat = null;
  }

  render(container) {
    container.innerHTML = `
      <div class="home">
        <div class="hero-content">
          <div class="hero-text">
            <h1 class="hero-headline">
              See Risk<br>
              <span class="gradient-text">Before It Emerges</span>
            </h1>
            <p class="hero-subheading">
              A living system for understanding urban futures.
            </p>
            <a href="/platform" class="btn btn-primary" data-link>
              Explore the Platform
            </a>
          </div>
          <div class="scroll-indicator">
            <div class="scroll-dot"></div>
            <p>Scroll to discover</p>
          </div>
        </div>

        <div class="chat-container"></div>

        <section class="vision-section">
          <div class="container">
            <div class="vision-grid">
              <div class="vision-card glass">
                <h2>See what's coming.</h2>
                <p>Real-time environmental intelligence reveals emerging risks before they cascade.</p>
              </div>
              <div class="vision-card glass">
                <h2>Simulate outcomes.</h2>
                <p>Model interventions and understand how changes cascade through interconnected systems.</p>
              </div>
              <div class="vision-card glass">
                <h2>Act with confidence.</h2>
                <p>Backed by data. Guided by intelligence. Designed for cities that lead.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    `;

    // Initialize chat
    const chatContainer = container.querySelector('.chat-container');
    this.chat = new ScenarioChat();
    this.chat.render(chatContainer);

    // Animate vision cards on scroll
    this.animateOnScroll();
  }

  animateOnScroll() {
    const cards = document.querySelectorAll('.vision-card');
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry, index) => {
        if (entry.isIntersecting) {
          gsap.to(entry.target, {
            opacity: 1,
            y: 0,
            duration: 0.6,
            delay: index * 0.1,
            ease: 'power2.out'
          });
        }
      });
    }, { threshold: 0.1 });

    cards.forEach(card => {
      gsap.set(card, { opacity: 0, y: 30 });
      observer.observe(card);
    });
  }

  cleanup() {
    // City persists across pages
  }
}
