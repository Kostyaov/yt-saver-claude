// Background Service Worker
// Handles IndexedDB local storage for bookmarks

// Import IndexedDB API
importScripts('/utils/idb-api.js');

// Initialize IndexedDB API instance
const idbAPI = new IndexedDBAPI();

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
    storageType: 'indexeddb'
  };

  chrome.storage.sync.set(defaults);

  // Initialize IndexedDB
  try {
    await idbAPI.openDB();
    console.log('IndexedDB initialized successfully');
  } catch (error) {
    console.error('Failed to initialize IndexedDB:', error);
  }

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

  if (request.action === 'testConnection') {
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

  if (request.action === 'exportBookmarks') {
    handleExportBookmarks()
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'importBookmarks') {
    handleImportBookmarks(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'clearAllBookmarks') {
    handleClearAllBookmarks()
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'getDatabaseSize') {
    handleGetDatabaseSize()
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

// Save bookmark to IndexedDB
async function handleSaveBookmark(bookmarkData) {
  try {
    const result = await idbAPI.addBookmark(bookmarkData);

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

// Test IndexedDB connection
async function handleTestConnection() {
  try {
    const isConnected = await idbAPI.testConnection();

    if (isConnected) {
      return {
        message: 'IndexedDB працює успішно',
        available: true
      };
    } else {
      throw new Error('IndexedDB не доступний');
    }
  } catch (error) {
    console.error('Connection test error:', error);
    throw error;
  }
}

// Get bookmarks (all or by category)
async function handleGetBookmarks(data) {
  try {
    if (data && data.category) {
      return await idbAPI.getBookmarksByCategory(data.category);
    } else {
      return await idbAPI.getAllBookmarks();
    }
  } catch (error) {
    console.error('Error getting bookmarks:', error);
    throw error;
  }
}

// Get statistics
async function handleGetStats() {
  try {
    return await idbAPI.getStats();
  } catch (error) {
    console.error('Error getting stats:', error);
    throw error;
  }
}

// Delete bookmark
async function handleDeleteBookmark(data) {
  try {
    await idbAPI.deleteBookmark(data.bookmarkId);

    return {
      message: 'Закладку видалено',
      bookmarkId: data.bookmarkId
    };
  } catch (error) {
    console.error('Error deleting bookmark:', error);
    throw error;
  }
}

// Export bookmarks to JSON
async function handleExportBookmarks() {
  try {
    const jsonData = await idbAPI.exportToJSON();

    return {
      message: 'Bookmarks exported successfully',
      data: jsonData
    };
  } catch (error) {
    console.error('Error exporting bookmarks:', error);
    throw error;
  }
}

// Import bookmarks from JSON
async function handleImportBookmarks(data) {
  try {
    const result = await idbAPI.importFromJSON(data.jsonData);

    return {
      message: `Імпортовано ${result.imported} закладок`,
      imported: result.imported,
      errors: result.errors,
      total: result.total
    };
  } catch (error) {
    console.error('Error importing bookmarks:', error);
    throw error;
  }
}

// Clear all bookmarks
async function handleClearAllBookmarks() {
  try {
    await idbAPI.clearAllBookmarks();

    return {
      message: 'Всі закладки видалено'
    };
  } catch (error) {
    console.error('Error clearing bookmarks:', error);
    throw error;
  }
}

// Get database size
async function handleGetDatabaseSize() {
  try {
    const sizeInfo = await idbAPI.getDatabaseSize();

    return {
      message: 'Database size retrieved',
      sizeInfo
    };
  } catch (error) {
    console.error('Error getting database size:', error);
    throw error;
  }
}

console.log('Background service worker loaded (IndexedDB mode)');
