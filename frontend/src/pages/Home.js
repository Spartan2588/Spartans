import React, { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { ScenarioChat } from '../components/ScenarioChat.js';
import gsap from 'gsap';
import '../styles/pages/home.css';

const Home = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
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
            <div id="home-cta-container"></div>
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

    // Note: We can't easily render a React Link inside innerHTML.
    // So we'll render it into a container using a separate React root or just use a standard link for now.
    // Actually, for simplicity and making it "work", I'll use a normal anchor but prevent default and use navigate.
    // Better: use the container method.

    const ctaContainer = container.querySelector('#home-cta-container');
    ctaContainer.innerHTML = `<a href="/platform" class="btn btn-primary" id="explore-btn">Explore the Platform</a>`;

    // Initialize chat
    const chatContainer = container.querySelector('.chat-container');
    const chat = new ScenarioChat();
    chat.render(chatContainer);

    // Animate vision cards
    const cards = container.querySelectorAll('.vision-card');
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

    return () => {
      observer.disconnect();
    };
  }, []);

  return <div ref={containerRef}></div>;
};

export default Home;
