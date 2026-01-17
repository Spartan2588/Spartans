import React, { useState } from 'react';
import './Hero.css';

function Hero({ scrollY }) {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Email:', email);
    setEmail('');
  };

  return (
    <section className="hero">
      {/* Animated background */}
      <div className="hero-bg">
        <div className="hero-gradient" style={{ transform: `translateY(${scrollY * 0.5}px)` }}></div>
        <div className="hero-orb hero-orb-1" style={{ transform: `translateY(${scrollY * 0.3}px)` }}></div>
        <div className="hero-orb hero-orb-2" style={{ transform: `translateY(${scrollY * 0.4}px)` }}></div>
      </div>

      {/* Content */}
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-headline">
            Understand Risk.<br />
            <span className="gradient-text">Simulate Tomorrow.</span>
          </h1>
          
          <p className="hero-subheading">
            Real-time environmental intelligence for cities that lead.
          </p>

          <form className="hero-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <input
                type="email"
                placeholder="Get early access"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="hero-input"
                required
              />
              <button type="submit" className="hero-cta">
                Explore
              </button>
            </div>
          </form>

          <p className="hero-footnote">
            No credit card required. Start in seconds.
          </p>
        </div>

        {/* Scroll indicator */}
        <div className="scroll-indicator">
          <div className="scroll-dot"></div>
          <p>Scroll to explore</p>
        </div>
      </div>
    </section>
  );
}

export default Hero;
