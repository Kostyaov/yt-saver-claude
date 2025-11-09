// Background Service Worker
// Handles Firebase Firestore integration and background tasks

importScripts('utils/firebase-config.js');
importScripts('utils/firebase-api.js');

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

console.log('Background service worker loaded (Firebase mode)');
