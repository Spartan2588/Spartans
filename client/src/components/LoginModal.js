import { authService } from '../utils/auth.js';
import '../styles/components/login-modal.css';

/**
 * LoginModal Component
 * Handles role-based sign-in with different credential requirements
 */
export class LoginModal {
  constructor() {
    this.isVisible = false;
    this.currentRole = 'citizen';
  }

  /**
   * Show the login modal
   */
  show() {
    if (this.isVisible) return;
    
    this.isVisible = true;
    this.render();
  }

  /**
   * Hide the login modal
   */
  hide() {
    if (!this.isVisible) return;
    
    this.isVisible = false;
    const modal = document.querySelector('.login-modal-overlay');
    if (modal) {
      modal.remove();
    }
  }

  /**
   * Render the login modal
   */
  render() {
    // Remove existing modal if any
    const existingModal = document.querySelector('.login-modal-overlay');
    if (existingModal) {
      existingModal.remove();
    }

    const modalHTML = `
      <div class="login-modal-overlay">
        <div class="login-modal">
          <div class="login-modal-header">
            <h2>Sign In to Urban Intelligence Platform</h2>
            <button class="close-btn" id="close-login-modal">&times;</button>
          </div>

          <div class="login-modal-body">
            <form id="login-form" class="login-form">
              <!-- Role Selection -->
              <div class="form-group">
                <label class="form-label">Select Your Role</label>
                <div class="role-selector">
                  <label class="role-option">
                    <input type="radio" name="role" value="citizen" checked>
                    <span class="role-card">
                      <span class="role-icon">👤</span>
                      <span class="role-title">Citizen</span>
                      <span class="role-desc">General public access</span>
                    </span>
                  </label>
                  <label class="role-option">
                    <input type="radio" name="role" value="government">
                    <span class="role-card">
                      <span class="role-icon">🏛️</span>
                      <span class="role-title">Government</span>
                      <span class="role-desc">Policy & planning access</span>
                    </span>
                  </label>
                  <label class="role-option">
                    <input type="radio" name="role" value="medical">
                    <span class="role-card">
                      <span class="role-icon">⚕️</span>
                      <span class="role-title">Medical Professional</span>
                      <span class="role-desc">Healthcare system access</span>
                    </span>
                  </label>
                </div>
              </div>

              <!-- Name Field -->
              <div class="form-group">
                <label for="user-name" class="form-label">Full Name</label>
                <input 
                  type="text" 
                  id="user-name" 
                  name="name" 
                  class="form-input" 
                  placeholder="Enter your full name"
                  required
                >
              </div>

              <!-- License Number Field (conditional) -->
              <div class="form-group" id="license-group" style="display: none;">
                <label for="license-number" class="form-label" id="license-label">License Number</label>
                <input 
                  type="text" 
                  id="license-number" 
                  name="licenseNumber" 
                  class="form-input" 
                  placeholder="Enter your license number"
                >
                <div class="form-help" id="license-help"></div>
              </div>

              <!-- Error Message -->
              <div class="error-message" id="login-error" style="display: none;"></div>

              <!-- Submit Button -->
              <button type="submit" class="login-btn" id="login-submit">
                <span class="btn-text">Sign In</span>
                <span class="btn-icon">→</span>
              </button>
            </form>
          </div>

          <div class="login-modal-footer">
            <p class="demo-notice">
              <span class="demo-icon">ℹ️</span>
              This is a demo authentication system for UX purposes only.
            </p>
          </div>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', modalHTML);
    this.setupEventListeners();
    
    // Focus on name input
    setTimeout(() => {
      const nameInput = document.querySelector('#user-name');
      if (nameInput) nameInput.focus();
    }, 100);
  }

  /**
   * Setup event listeners for the modal
   */
  setupEventListeners() {
    const modal = document.querySelector('.login-modal-overlay');
    const closeBtn = document.querySelector('#close-login-modal');
    const form = document.querySelector('#login-form');
    const roleInputs = document.querySelectorAll('input[name="role"]');

    // Close modal events
    closeBtn.addEventListener('click', () => this.hide());
    modal.addEventListener('click', (e) => {
      if (e.target === modal) this.hide();
    });

    // Escape key to close
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.isVisible) {
        this.hide();
      }
    });

    // Role change events
    roleInputs.forEach(input => {
      input.addEventListener('change', (e) => {
        this.currentRole = e.target.value;
        this.updateLicenseField();
      });
    });

    // Form submission
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      this.handleSignIn();
    });

    // Initial license field update
    this.updateLicenseField();
  }

  /**
   * Update license field based on selected role
   */
  updateLicenseField() {
    const licenseGroup = document.querySelector('#license-group');
    const licenseLabel = document.querySelector('#license-label');
    const licenseInput = document.querySelector('#license-number');
    const licenseHelp = document.querySelector('#license-help');

    if (this.currentRole === 'citizen') {
      licenseGroup.style.display = 'none';
      licenseInput.required = false;
    } else {
      licenseGroup.style.display = 'block';
      licenseInput.required = true;

      if (this.currentRole === 'government') {
        licenseLabel.textContent = 'Government ID / License Number';
        licenseInput.placeholder = 'Enter your government ID or license number';
        licenseHelp.textContent = 'Must be 6-20 alphanumeric characters';
      } else if (this.currentRole === 'medical') {
        licenseLabel.textContent = 'Medical License Number';
        licenseInput.placeholder = 'Enter your medical license number';
        licenseHelp.textContent = 'Must be 8-15 alphanumeric characters';
      }
    }
  }

  /**
   * Handle sign-in form submission
   */
  async handleSignIn() {
    const form = document.querySelector('#login-form');
    const errorDiv = document.querySelector('#login-error');
    const submitBtn = document.querySelector('#login-submit');

    // Clear previous errors
    errorDiv.style.display = 'none';
    errorDiv.textContent = '';

    // Show loading state
    submitBtn.disabled = true;
    submitBtn.querySelector('.btn-text').textContent = 'Signing In...';

    try {
      // Get form data
      const formData = new FormData(form);
      const credentials = {
        name: formData.get('name'),
        role: formData.get('role'),
        licenseNumber: formData.get('licenseNumber')
      };

      // Attempt sign-in
      const result = authService.signIn(credentials);

      if (result.success) {
        // Success - hide modal and show success message
        this.hide();
        this.showSuccessMessage(result.user);
      } else {
        // Show error
        errorDiv.textContent = result.error;
        errorDiv.style.display = 'block';
      }
    } catch (error) {
      console.error('Sign-in error:', error);
      errorDiv.textContent = 'An unexpected error occurred. Please try again.';
      errorDiv.style.display = 'block';
    } finally {
      // Reset button state
      submitBtn.disabled = false;
      submitBtn.querySelector('.btn-text').textContent = 'Sign In';
    }
  }

  /**
   * Show success message after sign-in
   * @param {Object} user - User object
   */
  showSuccessMessage(user) {
    const successHTML = `
      <div class="success-toast" id="signin-success">
        <div class="success-content">
          <span class="success-icon">✅</span>
          <span class="success-text">Welcome, ${user.displayName}!</span>
        </div>
      </div>
    `;

    document.body.insertAdjacentHTML('beforeend', successHTML);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      const toast = document.querySelector('#signin-success');
      if (toast) {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
      }
    }, 3000);
  }
}