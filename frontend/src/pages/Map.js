import { MapView } from '../components/MapView.js';
import '../styles/pages/map.css';

export class MapPage {
  constructor() {
    this.mapView = null;
  }

  async render(container) {
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

    // Initialize MapView
    this.mapView = new MapView();
    await this.mapView.render(container.querySelector('#map-container'));
  }

  cleanup() {
    if (this.mapView) {
      this.mapView.cleanup();
    }
  }
}
