// i18n - Internationalization utility
// Handles loading and applying translations

class I18n {
  constructor() {
    this.currentLanguage = 'en'; // Default language
    this.translations = {};
    this.initialized = false;
  }

  /**
   * Initialize i18n - load language from storage and fetch translations
   */
  async init() {
    try {
      // Load saved language preference
      const result = await chrome.storage.sync.get(['language']);
      this.currentLanguage = result.language || 'en';

      // Load translations
      await this.loadTranslations(this.currentLanguage);

      this.initialized = true;
      return true;
    } catch (error) {
      console.error('i18n initialization error:', error);
      // Fallback to English if there's an error
      this.currentLanguage = 'en';
      await this.loadTranslations('en');
      this.initialized = true;
      return false;
    }
  }

  /**
   * Load translation file for specified language
   */
  async loadTranslations(lang) {
    try {
      const response = await fetch(`../locales/${lang}.json`);
      if (!response.ok) {
        throw new Error(`Failed to load ${lang}.json`);
      }
      this.translations = await response.json();
      return true;
    } catch (error) {
      console.error(`Error loading translations for ${lang}:`, error);
      // If failed to load, try English as fallback
      if (lang !== 'en') {
        const response = await fetch('../locales/en.json');
        this.translations = await response.json();
      }
      return false;
    }
  }

  /**
   * Get translation by key path (e.g., "popup.title")
   */
  t(keyPath) {
    if (!this.initialized) {
      console.warn('i18n not initialized yet');
      return keyPath;
    }

    const keys = keyPath.split('.');
    let value = this.translations;

    for (const key of keys) {
      if (value && typeof value === 'object' && key in value) {
        value = value[key];
      } else {
        console.warn(`Translation key not found: ${keyPath}`);
        return keyPath;
      }
    }

    return value;
  }

  /**
   * Apply translations to all elements with data-i18n attribute
   */
  applyTranslations() {
    if (!this.initialized) {
      console.warn('i18n not initialized yet');
      return;
    }

    // Find all elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');

    elements.forEach(element => {
      const key = element.getAttribute('data-i18n');
      const translation = this.t(key);

      // Check if element has data-i18n-attr for attributes translation
      const attr = element.getAttribute('data-i18n-attr');

      if (attr) {
        // Translate attribute (e.g., placeholder, title)
        element.setAttribute(attr, translation);
      } else {
        // Translate text content
        element.textContent = translation;
      }
    });

    // Update page lang attribute
    document.documentElement.lang = this.currentLanguage === 'uk' ? 'uk' : 'en';
  }

  /**
   * Change language and reload translations
   */
  async setLanguage(lang) {
    if (lang === this.currentLanguage) {
      return; // No change needed
    }

    try {
      // Load new translations
      await this.loadTranslations(lang);
      this.currentLanguage = lang;

      // Save to storage
      await chrome.storage.sync.set({ language: lang });

      // Apply new translations
      this.applyTranslations();

      return true;
    } catch (error) {
      console.error('Error changing language:', error);
      return false;
    }
  }

  /**
   * Get current language code
   */
  getCurrentLanguage() {
    return this.currentLanguage;
  }

  /**
   * Format string with parameters (e.g., "Hello {name}" with {name: "World"})
   */
  format(template, params) {
    let result = template;
    for (const key in params) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), params[key]);
    }
    return result;
  }
}

// Create global instance
const i18n = new I18n();
