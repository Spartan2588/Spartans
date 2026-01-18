import React, { useEffect, useRef } from 'react';
import { MapView } from '../components/MapView.js';
import '../styles/pages/map.css';

const Map = () => {
  const containerRef = useRef(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const container = containerRef.current;
    container.innerHTML = `
      <div class="map-page">
        <div class="map-hero">
          <div class="map-hero-content">
            <h1>Urban Risk Map</h1>
            <p>Visualize spatial distribution of risks and infrastructure</p>
          </div>
        </div>

        <section class="map-section">
          <div id="map-container"></div>
        </section>
      </div>
    `;

    const mapView = new MapView();
    mapView.render(container.querySelector('#map-container'));

    return () => {
      if (mapView.cleanup) mapView.cleanup();
    };
  }, []);

  return <div ref={containerRef}></div>;
};

export default Map;
