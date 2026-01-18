/**
 * Simple Authentication Service for Demo/UX purposes
 * Handles role-based sign-in/sign-out with local storage
 */

export class AuthService {
  constructor() {
    this.currentUser = this.loadUser();
  }

  /**
   * Sign in with role-based credentials
   * @param {Object} credentials - User credentials
   * @param {string} credentials.name - User's name
   * @param {string} credentials.role - User's role (government, medical, citizen)
   * @param {string} credentials.licenseNumber - License number (for government/medical)
   * @returns {Object} Result with success status and user data
   */
  signIn(credentials) {
    const { name, role, licenseNumber } = credentials;

    // Basic validation
    if (!name || !name.trim()) {
      return { success: false, error: 'Name is required' };
    }

    if (!role || !['government', 'medical', 'citizen'].includes(role)) {
      return { success: false, error: 'Invalid role selected' };
    }

    // Role-specific validation
    if (role === 'government') {
      if (!licenseNumber || !licenseNumber.trim()) {
        return { success: false, error: 'Government ID/License Number is required' };
      }
      // Basic format validation for government ID (alphanumeric, 6-20 chars)
      if (!/^[A-Za-z0-9]{6,20}$/.test(licenseNumber.trim())) {
        return { success: false, error: 'Government ID must be 6-20 alphanumeric characters' };
      }
    }

    if (role === 'medical') {
      if (!licenseNumber || !licenseNumber.trim()) {
        return { success: false, error: 'Medical License Number is required' };
      }
      // Basic format validation for medical license (alphanumeric, 8-15 chars)
      if (!/^[A-Za-z0-9]{8,15}$/.test(licenseNumber.trim())) {
        return { success: false, error: 'Medical License must be 8-15 alphanumeric characters' };
      }
    }

    // Create user object
    const user = {
      name: name.trim(),
      role: role,
      licenseNumber: licenseNumber ? licenseNumber.trim() : null,
      signInTime: new Date().toISOString(),
      displayName: this.getDisplayName(name.trim(), role)
    };

    // Store user data
    this.currentUser = user;
    this.saveUser(user);

    // Dispatch sign-in event for other components
    window.dispatchEvent(new CustomEvent('user-signed-in', { detail: user }));

    return { success: true, user };
  }

  /**
   * Sign out current user
   */
  signOut() {
    const wasSignedIn = !!this.currentUser;
    
    this.currentUser = null;
    localStorage.removeItem('urbanIntelligence_user');

    if (wasSignedIn) {
      // Dispatch sign-out event for other components
      window.dispatchEvent(new CustomEvent('user-signed-out'));
    }

    return { success: true };
  }

  /**
   * Get current user
   * @returns {Object|null} Current user or null if not signed in
   */
  getCurrentUser() {
    return this.currentUser;
  }

  /**
   * Check if user is signed in
   * @returns {boolean} True if user is signed in
   */
  isSignedIn() {
    return !!this.currentUser;
  }

  /**
   * Get user's role
   * @returns {string|null} User's role or null if not signed in
   */
  getUserRole() {
    return this.currentUser ? this.currentUser.role : null;
  }

  /**
   * Get display name based on role
   * @param {string} name - User's name
   * @param {string} role - User's role
   * @returns {string} Formatted display name
   */
  getDisplayName(name, role) {
    switch (role) {
      case 'government':
        return `${name} (Government)`;
      case 'medical':
        return `Dr. ${name}`;
      case 'citizen':
        return name;
      default:
        return name;
    }
  }

  /**
   * Save user to local storage
   * @param {Object} user - User object to save
   */
  saveUser(user) {
    try {
      localStorage.setItem('urbanIntelligence_user', JSON.stringify(user));
    } catch (error) {
      console.warn('Failed to save user to localStorage:', error);
    }
  }

  /**
   * Load user from local storage
   * @returns {Object|null} User object or null
   */
  loadUser() {
    try {
      const userData = localStorage.getItem('urbanIntelligence_user');
      if (userData) {
        const user = JSON.parse(userData);
        // Validate loaded user data
        if (user.name && user.role && ['government', 'medical', 'citizen'].includes(user.role)) {
          return user;
        }
      }
    } catch (error) {
      console.warn('Failed to load user from localStorage:', error);
    }
    return null;
  }

  /**
   * Get role-specific dashboard access
   * @returns {Array} Array of accessible dashboard types
   */
  getAccessibleDashboards() {
    if (!this.currentUser) return ['citizen']; // Default access

    switch (this.currentUser.role) {
      case 'government':
        return ['government', 'citizen', 'trends', 'scenarios'];
      case 'medical':
        return ['hospital', 'citizen', 'trends'];
      case 'citizen':
        return ['citizen', 'trends'];
      default:
        return ['citizen'];
    }
  }

  /**
   * Check if user has access to specific dashboard
   * @param {string} dashboardType - Type of dashboard
   * @returns {boolean} True if user has access
   */
  hasAccess(dashboardType) {
    return this.getAccessibleDashboards().includes(dashboardType);
  }
}

// Create singleton instance
export const authService = new AuthService();