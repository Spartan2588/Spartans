import React from 'react';
import './CTA.css';

function CTA() {
  return (
    <section className="cta-section">
      <div className="cta-container">
        <div className="cta-content">
          <h2>Ready to Lead?</h2>
          <p>Join cities that are making smarter decisions about risk.</p>
          
          <div className="cta-buttons">
            <button className="cta-primary">Start Free Trial</button>
            <button className="cta-secondary">Schedule Demo</button>
          </div>

          <p className="cta-footnote">
            No credit card required. Full access for 14 days.
          </p>
        </div>
      </div>

      <footer className="footer">
        <div className="footer-content">
          <div className="footer-section">
            <h4>Product</h4>
            <ul>
              <li><a href="#features">Features</a></li>
              <li><a href="#pricing">Pricing</a></li>
              <li><a href="#docs">Documentation</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Company</h4>
            <ul>
              <li><a href="#about">About</a></li>
              <li><a href="#blog">Blog</a></li>
              <li><a href="#careers">Careers</a></li>
            </ul>
          </div>
          <div className="footer-section">
            <h4>Legal</h4>
            <ul>
              <li><a href="#privacy">Privacy</a></li>
              <li><a href="#terms">Terms</a></li>
              <li><a href="#security">Security</a></li>
            </ul>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2024 Urban Risk Intelligence. All rights reserved.</p>
        </div>
      </footer>
    </section>
  );
}

export default CTA;
