// Storage Utilities
// Helper functions for working with Chrome Storage API

class StorageManager {
  constructor() {
    this.storage = chrome.storage.sync;
  }

  // Get a value from storage
  async get(key, defaultValue = null) {
    try {
      const result = await this.storage.get([key]);
      return result[key] !== undefined ? result[key] : defaultValue;
    } catch (error) {
      console.error(`Error getting ${key} from storage:`, error);
      return defaultValue;
    }
  }

  // Get multiple values from storage
  async getMultiple(keys) {
    try {
      const result = await this.storage.get(keys);
      return result;
    } catch (error) {
      console.error('Error getting values from storage:', error);
      return {};
    }
  }

  // Set a value in storage
  async set(key, value) {
    try {
      await this.storage.set({ [key]: value });
      return true;
    } catch (error) {
      console.error(`Error setting ${key} in storage:`, error);
      return false;
    }
  }

  // Set multiple values in storage
  async setMultiple(items) {
    try {
      await this.storage.set(items);
      return true;
    } catch (error) {
      console.error('Error setting values in storage:', error);
      return false;
    }
  }

  // Remove a value from storage
  async remove(key) {
    try {
      await this.storage.remove(key);
      return true;
    } catch (error) {
      console.error(`Error removing ${key} from storage:`, error);
      return false;
    }
  }

  // Clear all storage
  async clear() {
    try {
      await this.storage.clear();
      return true;
    } catch (error) {
      console.error('Error clearing storage:', error);
      return false;
    }
  }

  // Check if a key exists
  async has(key) {
    try {
      const result = await this.storage.get([key]);
      return result[key] !== undefined;
    } catch (error) {
      console.error(`Error checking if ${key} exists:`, error);
      return false;
    }
  }

  // Get all storage data
  async getAll() {
    try {
      const result = await this.storage.get(null);
      return result;
    } catch (error) {
      console.error('Error getting all storage:', error);
      return {};
    }
  }
}

// Singleton instance
const storageManager = new StorageManager();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = storageManager;
}
