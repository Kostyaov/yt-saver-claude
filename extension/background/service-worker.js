// Background Service Worker
// Handles Google Sheets API integration and background tasks

importScripts('../utils/google-sheets.js');

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
    spreadsheetId: null,
    isAuthenticated: false
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

  if (request.action === 'authenticate') {
    handleAuthentication()
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'createSpreadsheet') {
    handleCreateSpreadsheet(request.data)
      .then(result => sendResponse({ success: true, data: result }))
      .catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (request.action === 'getSpreadsheetInfo') {
    handleGetSpreadsheetInfo(request.data)
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

// Save bookmark to Google Sheets
async function handleSaveBookmark(bookmarkData) {
  try {
    // Check if authenticated
    const { isAuthenticated, spreadsheetId } = await chrome.storage.sync.get(['isAuthenticated', 'spreadsheetId']);

    if (!isAuthenticated) {
      throw new Error('Будь ласка, увійдіть в обліковий запис Google у налаштуваннях');
    }

    if (!spreadsheetId) {
      throw new Error('Будь ласка, створіть або підключіть таблицю у налаштуваннях');
    }

    // Get or create access token
    const token = await getAccessToken();

    // Create GoogleSheetsAPI instance
    const sheetsAPI = new GoogleSheetsAPI(token, spreadsheetId);

    // Ensure the theme sheet exists
    await sheetsAPI.ensureSheetExists(bookmarkData.theme);

    // Prepare row data
    // Structure: URL, Title, Watch (timestamped URL), Description, Auto Description, Channel URL, Date
    const rowData = [
      bookmarkData.url,
      bookmarkData.title,
      bookmarkData.watchUrl,
      bookmarkData.description,
      bookmarkData.autoDescription,
      bookmarkData.channelUrl,
      new Date().toLocaleString('uk-UA')
    ];

    // Append data to the sheet
    await sheetsAPI.appendRow(bookmarkData.theme, rowData);

    return {
      message: 'Bookmark saved successfully',
      spreadsheetId: spreadsheetId,
      theme: bookmarkData.theme
    };
  } catch (error) {
    console.error('Error saving bookmark:', error);
    throw error;
  }
}

// Get Google OAuth access token
async function getAccessToken() {
  return new Promise((resolve, reject) => {
    chrome.identity.getAuthToken({ interactive: true }, (token) => {
      if (chrome.runtime.lastError) {
        reject(new Error(chrome.runtime.lastError.message));
      } else if (token) {
        resolve(token);
      } else {
        reject(new Error('Failed to get access token'));
      }
    });
  });
}

// Handle authentication
async function handleAuthentication() {
  try {
    const token = await getAccessToken();

    // Mark as authenticated
    await chrome.storage.sync.set({ isAuthenticated: true });

    return {
      message: 'Authentication successful',
      token: token
    };
  } catch (error) {
    console.error('Authentication error:', error);
    throw error;
  }
}

// Create new spreadsheet
async function handleCreateSpreadsheet(data) {
  try {
    const token = await getAccessToken();
    const sheetsAPI = new GoogleSheetsAPI(token);

    const spreadsheetId = await sheetsAPI.createSpreadsheet(data.name || 'YouTube Bookmarks');

    // Save spreadsheet ID
    await chrome.storage.sync.set({ spreadsheetId: spreadsheetId });

    return {
      spreadsheetId: spreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}`
    };
  } catch (error) {
    console.error('Error creating spreadsheet:', error);
    throw error;
  }
}

// Get spreadsheet information
async function handleGetSpreadsheetInfo(data) {
  try {
    const token = await getAccessToken();
    const sheetsAPI = new GoogleSheetsAPI(token, data.spreadsheetId);

    const info = await sheetsAPI.getSpreadsheetInfo();

    return info;
  } catch (error) {
    console.error('Error getting spreadsheet info:', error);
    throw error;
  }
}

console.log('Background service worker loaded');
