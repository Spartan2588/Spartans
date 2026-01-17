import './styles/global.css';
import { Router } from './core/router.js';
import { initializeApp } from './core/app.js';
import { CityEnvironment } from './utils/CityEnvironment.js';

// Initialize the application
initializeApp();

// Create persistent city environment
const cityContainer = document.createElement('div');
cityContainer.id = 'city-environment';
cityContainer.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
`;
document.body.insertBefore(cityContainer, document.body.firstChild);

const cityEnvironment = new CityEnvironment(cityContainer);

// Make city accessible globally for updates
window.cityEnvironment = cityEnvironment;

// Initialize router
const router = new Router();
router.init();
