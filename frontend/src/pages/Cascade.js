import React, { useEffect, useRef } from 'react';
import { CascadingFailureViz } from '../components/CascadingFailureViz.js';
import '../styles/pages/cascade.css';

const Cascade = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = `
      <div class="cascade-page">
        <div class="cascade-hero">
          <div class="cascade-hero-content">
            <h1>Cascading Failure Analysis</h1>
            <p>Understand how failures propagate through interconnected systems</p>
          </div>
        </div>

        <section class="cascade-section">
          <div id="cascade-container"></div>
        </section>
      </div>
    `;

    const cascadeViz = new CascadingFailureViz();
    cascadeViz.render(container.querySelector('#cascade-container'));

    return () => {
      if (cascadeViz.cleanup) cascadeViz.cleanup();
    };
  }, []);

  return <div ref={containerRef}></div>;
};

export default Cascade;
