// Background Service Worker
// Handles Firebase Firestore integration and background tasks

// Firebase Configuration - EMBEDDED
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDJnaFR4pXR7fe2BfdZFUzC_lz-qencRr8",
  authDomain: "bookmarks-74022.firebaseapp.com",
  projectId: "bookmarks-74022",
  storageBucket: "bookmarks-74022.firebasestorage.app",
  messagingSenderId: "183006097407",
  appId: "1:183006097407:web:6de997b7410e527bb381ca"
};

// Firebase Firestore REST API Class - EMBEDDED
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

// Initialize
chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    console.log('Extension installed');
    initializeExtension();
  } else if (details.reason === 'update') {
    console.log('Extension updated');
  }
});

// Initialize default settings
async function initializeExtension() {
  const defaults = {
    themes: ['Програмування', 'Python', 'Arduino', 'Web Development', 'JavaScript'],
    firebaseConfigured: false
  };

  chrome.storage.sync.set(defaults);

  // Open options page on first install
  chrome.runtime.openOptionsPage();
}

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'saveBookmark') {
    handleSaveBookmark(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true; // Keep message channel open for async response
  }

  if (request.action === 'testFirebaseConnection') {
    handleTestConnection()
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'getBookmarks') {
    handleGetBookmarks(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'getStats') {
    handleGetStats()
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'deleteBookmark') {
    handleDeleteBookmark(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'openPopup') {
    // This is called from content script via keyboard shortcut
    chrome.action.openPopup();
    sendResponse({ success: true });
  }
});

// Handle keyboard commands
chrome.commands.onCommand.addListener((command) => {
  if (command === 'save-bookmark') {
    // Open popup when keyboard shortcut is pressed
    chrome.action.openPopup();
  }
});

// Save bookmark to Firebase Firestore
async function handleSaveBookmark(bookmarkData) {
  try {
    // Check if Firebase is configured
    if (!FirebaseAPI.isConfigured(FIREBASE_CONFIG)) {
      throw new Error('Firebase не налаштовано. Будь ласка, налаштуйте Firebase у налаштуваннях');
    }

    // Create FirebaseAPI instance
    const firebaseAPI = new FirebaseAPI(FIREBASE_CONFIG);

    // Add bookmark to Firestore
    const result = await firebaseAPI.addBookmark(bookmarkData);

    // Mark as configured
    await chrome.storage.sync.set({ firebaseConfigured: true });

    return {
      message: 'Bookmark saved successfully',
      bookmarkId: result.id,
      category: bookmarkData.theme
    };
  } catch (error) {
    console.error('Error saving bookmark:', error);
    throw error;
  }
}

// Test Firebase connection
async function handleTestConnection() {
  try {
    if (!FirebaseAPI.isConfigured(FIREBASE_CONFIG)) {
      throw new Error('Firebase не налаштовано');
    }

    const firebaseAPI = new FirebaseAPI(FIREBASE_CONFIG);
    const isConnected = await firebaseAPI.testConnection();

    if (isConnected) {
      await chrome.storage.sync.set({ firebaseConfigured: true });
      return {
        message: 'З\'єднання успішне',
        configured: true
      };
    } else {
      throw new Error('Не вдалося під\'єднатися до Firebase');
    }
  } catch (error) {
    console.error('Connection test error:', error);
    throw error;
  }
}

// Get bookmarks (all or by category)
async function handleGetBookmarks(data) {
  try {
    if (!FirebaseAPI.isConfigured(FIREBASE_CONFIG)) {
      throw new Error('Firebase не налаштовано');
    }

    const firebaseAPI = new FirebaseAPI(FIREBASE_CONFIG);

    if (data && data.category) {
      return await firebaseAPI.getBookmarksByCategory(data.category);
    } else {
      return await firebaseAPI.getAllBookmarks();
    }
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    throw error;
  }
}

// Get statistics
async function handleGetStats() {
  try {
    if (!FirebaseAPI.isConfigured(FIREBASE_CONFIG)) {
      throw new Error('Firebase не налаштовано');
    }

    const firebaseAPI = new FirebaseAPI(FIREBASE_CONFIG);
    return await firebaseAPI.getStats();
  } catch (error) {
    console.error('Error getting stats:', error);
    throw error;
  }
}

// Delete bookmark
async function handleDeleteBookmark(data) {
  try {
    if (!FirebaseAPI.isConfigured(FIREBASE_CONFIG)) {
      throw new Error('Firebase не налаштовано');
    }

    const firebaseAPI = new FirebaseAPI(FIREBASE_CONFIG);
    await firebaseAPI.deleteBookmark(data.bookmarkId);

    return {
      message: 'Закладку видалено',
      bookmarkId: data.bookmarkId
    };
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    throw error;
  }
}

console.log('Background service worker loaded (Firebase mode) - Config embedded');
