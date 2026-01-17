import { getPageContent } from './app.js';
import { PageTransition } from '../components/PageTransition.js';
import { HomePage } from '../pages/Home.js';
import { PlatformPage } from '../pages/Platform.js';
import { ScenariosPage } from '../pages/Scenarios.js';
import { ImpactPage } from '../pages/Impact.js';
import { AboutPage } from '../pages/About.js';
import { TrendsPage } from '../pages/Trends.js';
import { MapPage } from '../pages/Map.js';
import { CascadePage } from '../pages/Cascade.js';

export class Router {
  constructor() {
    this.currentPage = null;
    this.pages = {
      '/': HomePage,
      '/platform': PlatformPage,
      '/scenarios': ScenariosPage,
      '/impact': ImpactPage,
      '/about': AboutPage,
      '/trends': TrendsPage,
      '/map': MapPage,
      '/cascade': CascadePage
    };
  }

  init() {
    // Handle initial route
    this.navigate(window.location.pathname);

    // Handle navigation
    window.addEventListener('popstate', () => {
      this.navigate(window.location.pathname);
    });

    // Handle link clicks
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[data-link]');
      if (link) {
        e.preventDefault();
        const href = link.getAttribute('href');
        this.navigate(href);
      }
    });
  }

  async navigate(path) {
    const PageClass = this.pages[path] || this.pages['/'];
    
    // Trigger transition
    PageTransition.start();

    // Cleanup current page
    if (this.currentPage && this.currentPage.cleanup) {
      this.currentPage.cleanup();
    }

    // Update URL
    window.history.pushState(null, '', path);

    // Update navigation active state
    this.updateNavigation(path);

    // Wait for transition
    await new Promise(resolve => setTimeout(resolve, 300));

    // Render new page
    const pageContent = getPageContent();
    pageContent.innerHTML = '';
    
    this.currentPage = new PageClass();
    this.currentPage.render(pageContent);

    // End transition
    PageTransition.end();

    // Scroll to top
    window.scrollTo(0, 0);
  }

  updateNavigation(path) {
    document.querySelectorAll('[data-link]').forEach(link => {
      const href = link.getAttribute('href');
      if (href === path) {
        link.classList.add('active');
      } else {
        link.classList.remove('active');
      }
    });
  }
}
