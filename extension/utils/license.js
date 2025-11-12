// License Management Utility
// Handles PRO license activation and validation

class LicenseManager {
  constructor() {
    this.FREE_LIMITS = {
      MAX_BOOKMARKS: 100,
      MAX_THEMES: 5
    };
  }

  /**
   * Check if user has PRO license
   * @returns {Promise<boolean>}
   */
  async isPro() {
    try {
      const result = await chrome.storage.sync.get(['proLicense']);
      return result.proLicense?.active === true;
    } catch (error) {
      console.error('Error checking PRO status:', error);
      return false;
    }
  }

  /**
   * Get license information
   * @returns {Promise<Object>}
   */
  async getLicenseInfo() {
    try {
      const result = await chrome.storage.sync.get(['proLicense']);
      return result.proLicense || {
        active: false,
        code: null,
        activatedAt: null
      };
    } catch (error) {
      console.error('Error getting license info:', error);
      return { active: false, code: null, activatedAt: null };
    }
  }

  /**
   * Validate license code format
   * Format: YTBS-XXXX-XXXX-XXXX (16 chars + 3 dashes)
   * @param {string} code
   * @returns {boolean}
   */
  isValidCodeFormat(code) {
    if (!code || typeof code !== 'string') return false;

    // Remove whitespace
    code = code.trim().toUpperCase();

    // Check format: YTBS-XXXX-XXXX-XXXX
    const pattern = /^YTBS-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;
    return pattern.test(code);
  }

  /**
   * Validate license code using checksum algorithm
   * This is a simple validation - in production you'd verify with backend
   * @param {string} code
   * @returns {boolean}
   */
  validateLicenseCode(code) {
    if (!this.isValidCodeFormat(code)) return false;

    code = code.trim().toUpperCase();

    // Extract parts: YTBS-XXXX-XXXX-XXXX
    const parts = code.split('-');
    if (parts.length !== 4 || parts[0] !== 'YTBS') return false;

    // Simple checksum validation
    // Part 4 (last segment) should be checksum of parts 2 and 3
    const data = parts[1] + parts[2];
    const expectedChecksum = this.calculateChecksum(data);

    return parts[3] === expectedChecksum;
  }

  /**
   * Calculate checksum for license code
   * @private
   * @param {string} data
   * @returns {string} 4-character checksum
   */
  calculateChecksum(data) {
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data.charCodeAt(i) * (i + 1);
    }

    // Convert to base-36 and take 4 chars
    const checksum = sum.toString(36).toUpperCase().padStart(4, '0').slice(-4);
    return checksum;
  }

  /**
   * Generate a valid license code (for testing/demo)
   * @returns {string}
   */
  generateLicenseCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    // Generate random parts
    let part1 = '';
    let part2 = '';

    for (let i = 0; i < 4; i++) {
      part1 += chars[Math.floor(Math.random() * chars.length)];
      part2 += chars[Math.floor(Math.random() * chars.length)];
    }

    // Calculate checksum
    const checksum = this.calculateChecksum(part1 + part2);

    return `YTBS-${part1}-${part2}-${checksum}`;
  }

  /**
   * Activate PRO license with code
   * @param {string} code
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async activateLicense(code) {
    try {
      // Validate code format
      if (!this.isValidCodeFormat(code)) {
        return {
          success: false,
          message: 'Invalid license code format. Expected: YTBS-XXXX-XXXX-XXXX'
        };
      }

      // Validate code checksum
      if (!this.validateLicenseCode(code)) {
        return {
          success: false,
          message: 'Invalid license code. Please check and try again.'
        };
      }

      // Check if already activated
      const currentLicense = await this.getLicenseInfo();
      if (currentLicense.active && currentLicense.code === code.trim().toUpperCase()) {
        return {
          success: true,
          message: 'This license is already activated.'
        };
      }

      // Activate license
      const licenseData = {
        active: true,
        code: code.trim().toUpperCase(),
        activatedAt: new Date().toISOString()
      };

      await chrome.storage.sync.set({ proLicense: licenseData });

      return {
        success: true,
        message: 'PRO license activated successfully! All limits removed.'
      };
    } catch (error) {
      console.error('Error activating license:', error);
      return {
        success: false,
        message: 'Error activating license: ' + error.message
      };
    }
  }

  /**
   * Deactivate PRO license
   * @returns {Promise<{success: boolean, message: string}>}
   */
  async deactivateLicense() {
    try {
      const licenseData = {
        active: false,
        code: null,
        activatedAt: null
      };

      await chrome.storage.sync.set({ proLicense: licenseData });

      return {
        success: true,
        message: 'PRO license deactivated.'
      };
    } catch (error) {
      console.error('Error deactivating license:', error);
      return {
        success: false,
        message: 'Error deactivating license: ' + error.message
      };
    }
  }

  /**
   * Check if bookmark limit reached (FREE tier only)
   * @param {number} currentCount
   * @returns {Promise<{allowed: boolean, limit: number, message: string}>}
   */
  async checkBookmarkLimit(currentCount) {
    const isPro = await this.isPro();

    if (isPro) {
      return {
        allowed: true,
        limit: null,
        message: 'Unlimited (PRO)'
      };
    }

    const allowed = currentCount < this.FREE_LIMITS.MAX_BOOKMARKS;

    return {
      allowed,
      limit: this.FREE_LIMITS.MAX_BOOKMARKS,
      message: allowed
        ? `${currentCount}/${this.FREE_LIMITS.MAX_BOOKMARKS} bookmarks`
        : `Limit reached (${this.FREE_LIMITS.MAX_BOOKMARKS}). Upgrade to PRO for unlimited bookmarks.`
    };
  }

  /**
   * Check if theme limit reached (FREE tier only)
   * @param {number} currentCount
   * @returns {Promise<{allowed: boolean, limit: number, message: string}>}
   */
  async checkThemeLimit(currentCount) {
    const isPro = await this.isPro();

    if (isPro) {
      return {
        allowed: true,
        limit: null,
        message: 'Unlimited (PRO)'
      };
    }

    const allowed = currentCount < this.FREE_LIMITS.MAX_THEMES;

    return {
      allowed,
      limit: this.FREE_LIMITS.MAX_THEMES,
      message: allowed
        ? `${currentCount}/${this.FREE_LIMITS.MAX_THEMES} themes`
        : `Limit reached (${this.FREE_LIMITS.MAX_THEMES}). Upgrade to PRO for unlimited themes.`
    };
  }

  /**
   * Get limits summary
   * @returns {Promise<Object>}
   */
  async getLimitsSummary() {
    const isPro = await this.isPro();

    return {
      isPro,
      bookmarks: isPro ? 'Unlimited' : this.FREE_LIMITS.MAX_BOOKMARKS,
      themes: isPro ? 'Unlimited' : this.FREE_LIMITS.MAX_THEMES
    };
  }
}

// Create global instance
const licenseManager = new LicenseManager();
