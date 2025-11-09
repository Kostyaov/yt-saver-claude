// IndexedDB API
// Local storage for YouTube bookmarks using IndexedDB
// No external dependencies, works completely offline

class IndexedDBAPI {
  constructor() {
    this.dbName = 'youtube-bookmarks';
    this.version = 1;
    this.storeName = 'bookmarks';
    this.db = null;
  }

  // Open/Create database
  async openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.version);

      request.onerror = () => {
        reject(new Error('Failed to open IndexedDB'));
      };

      request.onsuccess = (event) => {
        this.db = event.target.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = event.target.result;

        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const objectStore = db.createObjectStore(this.storeName, {
            keyPath: 'id',
            autoIncrement: true
          });

          // Create indexes for efficient queries
          objectStore.createIndex('category', 'category', { unique: false });
          objectStore.createIndex('createdAt', 'createdAt', { unique: false });
          objectStore.createIndex('currentTime', 'currentTime', { unique: false });
          objectStore.createIndex('videoId', 'videoId', { unique: false });

          console.log('IndexedDB object store created');
        }
      };
    });
  }

  // Ensure database is open
  async ensureDB() {
    if (!this.db) {
      await this.openDB();
    }
    return this.db;
  }

  // Add a bookmark
  async addBookmark(bookmarkData) {
    try {
      const db = await this.ensureDB();

      // Prepare bookmark object
      const bookmark = {
        title: bookmarkData.title,
        videoId: bookmarkData.videoId,
        videoUrl: bookmarkData.url,
        watchUrl: bookmarkData.watchUrl,
        currentTime: bookmarkData.currentTime,
        channelName: bookmarkData.channelName,
        channelUrl: bookmarkData.channelUrl,
        category: bookmarkData.theme,
        description: bookmarkData.description || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.add(bookmark);

        request.onsuccess = () => {
          bookmark.id = request.result;
          console.log('Bookmark added with ID:', bookmark.id);
          resolve(bookmark);
        };

        request.onerror = () => {
          reject(new Error('Failed to add bookmark: ' + request.error));
        };
      });
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw error;
    }
  }

  // Get all bookmarks (sorted by creation date, newest first)
  async getAllBookmarks() {
    try {
      const db = await this.ensureDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.getAll();

        request.onsuccess = () => {
          const bookmarks = request.result;

          // Sort by createdAt desc (newest first)
          bookmarks.sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
          });

          resolve(bookmarks);
        };

        request.onerror = () => {
          reject(new Error('Failed to get bookmarks: ' + request.error));
        };
      });
    } catch (error) {
      console.error('Error getting all bookmarks:', error);
      throw error;
    }
  }

  // Get bookmarks by category
  async getBookmarksByCategory(category) {
    try {
      const db = await this.ensureDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readonly');
        const objectStore = transaction.objectStore(this.storeName);
        const index = objectStore.index('category');
        const request = index.getAll(category);

        request.onsuccess = () => {
          const bookmarks = request.result;

          // Sort by createdAt desc
          bookmarks.sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
          });

          resolve(bookmarks);
        };

        request.onerror = () => {
          reject(new Error('Failed to get bookmarks by category: ' + request.error));
        };
      });
    } catch (error) {
      console.error('Error getting bookmarks by category:', error);
      throw error;
    }
  }

  // Delete a bookmark
  async deleteBookmark(bookmarkId) {
    try {
      const db = await this.ensureDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.delete(bookmarkId);

        request.onsuccess = () => {
          console.log('Bookmark deleted:', bookmarkId);
          resolve(true);
        };

        request.onerror = () => {
          reject(new Error('Failed to delete bookmark: ' + request.error));
        };
      });
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      throw error;
    }
  }

  // Search bookmarks (client-side filtering)
  async searchBookmarks(searchTerm) {
    try {
      const allBookmarks = await this.getAllBookmarks();
      const searchLower = searchTerm.toLowerCase();

      return allBookmarks.filter(bookmark =>
        bookmark.title?.toLowerCase().includes(searchLower) ||
        bookmark.description?.toLowerCase().includes(searchLower) ||
        bookmark.channelName?.toLowerCase().includes(searchLower) ||
        bookmark.category?.toLowerCase().includes(searchLower)
      );
    } catch (error) {
      console.error('Error searching bookmarks:', error);
      throw error;
    }
  }

  // Get all unique categories
  async getCategories() {
    try {
      const allBookmarks = await this.getAllBookmarks();
      const categories = new Set();

      allBookmarks.forEach(bookmark => {
        if (bookmark.category) {
          categories.add(bookmark.category);
        }
      });

      return Array.from(categories).sort();
    } catch (error) {
      console.error('Error getting categories:', error);
      throw error;
    }
  }

  // Get bookmark statistics
  async getStats() {
    try {
      const allBookmarks = await this.getAllBookmarks();
      const categories = await this.getCategories();

      const stats = {
        totalBookmarks: allBookmarks.length,
        totalCategories: categories.length,
        categories: {},
        storageUsed: 0 // Will calculate approximate size
      };

      // Count bookmarks per category
      allBookmarks.forEach(bookmark => {
        const cat = bookmark.category || 'Uncategorized';
        stats.categories[cat] = (stats.categories[cat] || 0) + 1;
      });

      // Estimate storage size (rough approximation)
      const dataSize = JSON.stringify(allBookmarks).length;
      stats.storageUsed = Math.round(dataSize / 1024); // KB

      return stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      throw error;
    }
  }

  // Update a bookmark
  async updateBookmark(bookmarkId, updates) {
    try {
      const db = await this.ensureDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const objectStore = transaction.objectStore(this.storeName);
        const getRequest = objectStore.get(bookmarkId);

        getRequest.onsuccess = () => {
          const bookmark = getRequest.result;

          if (!bookmark) {
            reject(new Error('Bookmark not found'));
            return;
          }

          // Update fields
          Object.assign(bookmark, updates);
          bookmark.updatedAt = new Date().toISOString();

          const updateRequest = objectStore.put(bookmark);

          updateRequest.onsuccess = () => {
            resolve(bookmark);
          };

          updateRequest.onerror = () => {
            reject(new Error('Failed to update bookmark: ' + updateRequest.error));
          };
        };

        getRequest.onerror = () => {
          reject(new Error('Failed to get bookmark: ' + getRequest.error));
        };
      });
    } catch (error) {
      console.error('Error updating bookmark:', error);
      throw error;
    }
  }

  // Export all bookmarks to JSON
  async exportToJSON() {
    try {
      const allBookmarks = await this.getAllBookmarks();

      const exportData = {
        version: '3.0.0',
        exportDate: new Date().toISOString(),
        bookmarksCount: allBookmarks.length,
        bookmarks: allBookmarks
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Error exporting to JSON:', error);
      throw error;
    }
  }

  // Import bookmarks from JSON
  async importFromJSON(jsonString) {
    try {
      const importData = JSON.parse(jsonString);

      if (!importData.bookmarks || !Array.isArray(importData.bookmarks)) {
        throw new Error('Invalid import format');
      }

      const db = await this.ensureDB();
      let imported = 0;
      let errors = 0;

      for (const bookmark of importData.bookmarks) {
        try {
          // Remove id to let IndexedDB auto-generate
          const { id, ...bookmarkData } = bookmark;

          await new Promise((resolve, reject) => {
            const transaction = db.transaction([this.storeName], 'readwrite');
            const objectStore = transaction.objectStore(this.storeName);
            const request = objectStore.add(bookmarkData);

            request.onsuccess = () => {
              imported++;
              resolve();
            };

            request.onerror = () => {
              errors++;
              resolve(); // Continue with next bookmark
            };
          });
        } catch (err) {
          errors++;
        }
      }

      return {
        imported,
        errors,
        total: importData.bookmarks.length
      };
    } catch (error) {
      console.error('Error importing from JSON:', error);
      throw error;
    }
  }

  // Clear all bookmarks (use with caution!)
  async clearAllBookmarks() {
    try {
      const db = await this.ensureDB();

      return new Promise((resolve, reject) => {
        const transaction = db.transaction([this.storeName], 'readwrite');
        const objectStore = transaction.objectStore(this.storeName);
        const request = objectStore.clear();

        request.onsuccess = () => {
          console.log('All bookmarks cleared');
          resolve(true);
        };

        request.onerror = () => {
          reject(new Error('Failed to clear bookmarks: ' + request.error));
        };
      });
    } catch (error) {
      console.error('Error clearing bookmarks:', error);
      throw error;
    }
  }

  // Get database size estimate
  async getDatabaseSize() {
    try {
      if ('storage' in navigator && 'estimate' in navigator.storage) {
        const estimate = await navigator.storage.estimate();
        return {
          usage: Math.round(estimate.usage / 1024), // KB
          quota: Math.round(estimate.quota / (1024 * 1024)), // MB
          percentUsed: Math.round((estimate.usage / estimate.quota) * 100)
        };
      }
      return null;
    } catch (error) {
      console.error('Error getting database size:', error);
      return null;
    }
  }

  // Check if IndexedDB is available
  static isAvailable() {
    return 'indexedDB' in window;
  }

  // Test connection (always returns true if IndexedDB available)
  async testConnection() {
    try {
      await this.ensureDB();
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Export for use in service worker and other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = IndexedDBAPI;
}
