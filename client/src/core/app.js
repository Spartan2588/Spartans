import { Navigation } from '../components/Navigation.js';
import { PageTransition } from '../components/PageTransition.js';

export function initializeApp() {
  const app = document.getElementById('app');
  
  // Create main structure
  app.innerHTML = `
    <nav id="navigation"></nav>
    <div id="page-transition"></div>
    <main id="page-content"></main>
  `;

  // Initialize navigation
  const navContainer = document.getElementById('navigation');
  Navigation.render(navContainer);

  // Initialize page transition
  const transitionContainer = document.getElementById('page-transition');
  PageTransition.init(transitionContainer);
}

export function getPageContent() {
  return document.getElementById('page-content');
}
