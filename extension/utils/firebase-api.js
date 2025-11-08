// Firebase Firestore REST API
// Handles all interactions with Firebase Firestore using REST API
// This approach works better with Chrome Extension service workers

class FirebaseAPI {
  constructor(config) {
    this.config = config;
    this.projectId = config.projectId;
    this.apiKey = config.apiKey;
    this.baseUrl = `https://firestore.googleapis.com/v1/projects/${this.projectId}/databases/(default)/documents`;
  }

  // Add a bookmark
  async addBookmark(bookmarkData) {
    try {
      // Prepare bookmark document
      const document = {
        fields: {
          title: { stringValue: bookmarkData.title },
          watchUrl: { stringValue: bookmarkData.watchUrl },
          videoUrl: { stringValue: bookmarkData.url },
          videoId: { stringValue: bookmarkData.videoId },
          description: { stringValue: bookmarkData.description || '' },
          channelUrl: { stringValue: bookmarkData.channelUrl },
          channelName: { stringValue: bookmarkData.channelName },
          category: { stringValue: bookmarkData.theme },
          currentTime: { integerValue: bookmarkData.currentTime.toString() },
          createdAt: { timestampValue: new Date().toISOString() },
          updatedAt: { timestampValue: new Date().toISOString() }
        }
      };

      const url = `${this.baseUrl}/bookmarks?key=${this.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(document)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to add bookmark');
      }

      const result = await response.json();
      const docId = result.name.split('/').pop();

      console.log('Bookmark added with ID:', docId);

      return {
        id: docId,
        ...this.parseDocument(result)
      };
    } catch (error) {
      console.error('Error adding bookmark:', error);
      throw new Error(`Failed to add bookmark: ${error.message}`);
    }
  }

  // Get bookmarks by category
  async getBookmarksByCategory(category) {
    try {
      // Build structured query
      const structuredQuery = {
        structuredQuery: {
          from: [{ collectionId: 'bookmarks' }],
          where: {
            fieldFilter: {
              field: { fieldPath: 'category' },
              op: 'EQUAL',
              value: { stringValue: category }
            }
          },
          orderBy: [
            {
              field: { fieldPath: 'createdAt' },
              direction: 'DESCENDING'
            }
          ]
        }
      };

      const url = `${this.baseUrl}:runQuery?key=${this.apiKey}`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(structuredQuery)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get bookmarks');
      }

      const results = await response.json();
      const bookmarks = [];

      for (const result of results) {
        if (result.document) {
          const docId = result.document.name.split('/').pop();
          bookmarks.push({
            id: docId,
            ...this.parseDocument(result.document)
          });
        }
      }

      return bookmarks;
    } catch (error) {
      console.error('Error getting bookmarks by category:', error);
      throw new Error(`Failed to get bookmarks: ${error.message}`);
    }
  }

  // Get all bookmarks
  async getAllBookmarks() {
    try {
      const url = `${this.baseUrl}/bookmarks?key=${this.apiKey}&pageSize=1000&orderBy=createdAt desc`;

      const response = await fetch(url);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to get bookmarks');
      }

      const result = await response.json();
      const bookmarks = [];

      if (result.documents) {
        for (const doc of result.documents) {
          const docId = doc.name.split('/').pop();
          bookmarks.push({
            id: docId,
            ...this.parseDocument(doc)
          });
        }
      }

      return bookmarks;
    } catch (error) {
      console.error('Error getting all bookmarks:', error);
      throw new Error(`Failed to get all bookmarks: ${error.message}`);
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
      throw new Error(`Failed to get categories: ${error.message}`);
    }
  }

  // Delete a bookmark
  async deleteBookmark(bookmarkId) {
    try {
      const url = `${this.baseUrl}/bookmarks/${bookmarkId}?key=${this.apiKey}`;

      const response = await fetch(url, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'Failed to delete bookmark');
      }

      console.log('Bookmark deleted:', bookmarkId);
      return true;
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      throw new Error(`Failed to delete bookmark: ${error.message}`);
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
      throw new Error(`Failed to search bookmarks: ${error.message}`);
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
        categories: {}
      };

      // Count bookmarks per category
      allBookmarks.forEach(bookmark => {
        const cat = bookmark.category || 'Uncategorized';
        stats.categories[cat] = (stats.categories[cat] || 0) + 1;
      });

      return stats;
    } catch (error) {
      console.error('Error getting stats:', error);
      throw new Error(`Failed to get stats: ${error.message}`);
    }
  }

  // Parse Firestore document format to JavaScript object
  parseDocument(document) {
    const data = {};
    const fields = document.fields || {};

    for (const [key, value] of Object.entries(fields)) {
      if (value.stringValue !== undefined) {
        data[key] = value.stringValue;
      } else if (value.integerValue !== undefined) {
        data[key] = parseInt(value.integerValue);
      } else if (value.doubleValue !== undefined) {
        data[key] = value.doubleValue;
      } else if (value.booleanValue !== undefined) {
        data[key] = value.booleanValue;
      } else if (value.timestampValue !== undefined) {
        data[key] = value.timestampValue;
      } else if (value.nullValue !== undefined) {
        data[key] = null;
      }
    }

    return data;
  }

  // Check if Firebase is configured
  static isConfigured(config) {
    return config &&
           config.apiKey &&
           config.apiKey !== 'YOUR_API_KEY' &&
           config.projectId &&
           config.projectId !== 'YOUR_PROJECT_ID';
  }

  // Test connection
  async testConnection() {
    try {
      await this.getAllBookmarks();
      return true;
    } catch (error) {
      console.error('Connection test failed:', error);
      return false;
    }
  }
}

// Export for use in service worker and other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = FirebaseAPI;
}
