import { authService } from '../utils/auth.js';
import { LoginModal } from './LoginModal.js';
import '../styles/navigation.css';

export class Navigation {
  constructor() {
    this.loginModal = new LoginModal();
    this.currentUser = authService.getCurrentUser();
    
    // Listen for auth events
    window.addEventListener('user-signed-in', (e) => {
      this.currentUser = e.detail;
      this.updateUserDisplay();
    });
    
    window.addEventListener('user-signed-out', () => {
      this.currentUser = null;
      this.updateUserDisplay();
    });
  }

  render(container) {
    container.innerHTML = `
      <div class="nav-container">
        <a href="/" class="nav-logo" data-link>
          <span class="logo-icon">◆</span>
          <span class="logo-text">Urban Risk</span>
        </a>

        <button class="nav-toggle" id="nav-toggle">
          <span></span>
          <span></span>
          <span></span>
        </button>

        <ul class="nav-menu" id="nav-menu">
          <li><a href="/" class="nav-link active" data-link>Home</a></li>
          <li><a href="/platform" class="nav-link" data-link>Platform</a></li>
          <li><a href="/trends" class="nav-link" data-link>Trends</a></li>
          <li><a href="/map" class="nav-link" data-link>Map</a></li>
          <li><a href="/cascade" class="nav-link" data-link>Cascade</a></li>
          <li><a href="/scenarios" class="nav-link" data-link>Scenarios</a></li>
          <li><a href="/about" class="nav-link" data-link>About</a></li>
        </ul>

        <!-- User Authentication Section -->
        <div class="nav-auth" id="nav-auth">
          ${this.renderAuthSection()}
        </div>
      </div>
    `;

    this.setupEventListeners(container);
  }

  renderAuthSection() {
    if (this.currentUser) {
      return `
        <div class="user-info">
          <span class="user-name">${this.currentUser.displayName}</span>
          <button class="sign-out-btn" id="sign-out-btn">Sign Out</button>
        </div>
      `;
    } else {
      return `
        <button class="sign-in-btn" id="sign-in-btn">Sign In</button>
      `;
    }
  }

  setupEventListeners(container) {
    // Mobile menu toggle
    const toggle = container.querySelector('#nav-toggle');
    const menu = container.querySelector('#nav-menu');

    toggle.addEventListener('click', () => {
      toggle.classList.toggle('active');
      menu.classList.toggle('active');
    });

    // Close menu on link click
    menu.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        toggle.classList.remove('active');
        menu.classList.remove('active');
      });
    });

    // Auth button event listeners
    const signInBtn = container.querySelector('#sign-in-btn');
    const signOutBtn = container.querySelector('#sign-out-btn');

    if (signInBtn) {
      signInBtn.addEventListener('click', () => {
        this.loginModal.show();
      });
    }

    if (signOutBtn) {
      signOutBtn.addEventListener('click', () => {
        this.handleSignOut();
      });
    }
  }

  updateUserDisplay() {
    const authSection = document.querySelector('#nav-auth');
    if (authSection) {
      authSection.innerHTML = this.renderAuthSection();
      
      // Re-setup auth event listeners
      const signInBtn = authSection.querySelector('#sign-in-btn');
      const signOutBtn = authSection.querySelector('#sign-out-btn');

      if (signInBtn) {
        signInBtn.addEventListener('click', () => {
          this.loginModal.show();
        });
      }

      if (signOutBtn) {
        signOutBtn.addEventListener('click', () => {
          this.handleSignOut();
        });
      }
    }
  }

  handleSignOut() {
    const result = authService.signOut();
    if (result.success) {
      this.showSignOutMessage();
    }
  }

  showSignOutMessage() {
    const successHTML = `
      <div class="success-toast" id="signout-success">
        <div class="success-content">
          <span class="success-icon">👋</span>
          <span class="success-text">Successfully signed out</span>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', successHTML);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      const toast = document.querySelector('#signout-success');
      if (toast) {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
      }
    }, 3000);
  }
}
