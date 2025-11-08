// Options Page Script
// Handles settings and configuration

class OptionsManager {
  constructor() {
    this.themes = [];
    this.spreadsheetId = null;
    this.isAuthenticated = false;

    this.init();
  }

  async init() {
    // Load current settings
    await this.loadSettings();

    // Setup event listeners
    this.setupEventListeners();

    // Check authentication status
    await this.checkAuthStatus();

    // Load spreadsheet info if available
    if (this.spreadsheetId) {
      await this.loadSpreadsheetInfo();
    }
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.sync.get(['themes', 'spreadsheetId', 'isAuthenticated']);

      this.themes = result.themes || [];
      this.spreadsheetId = result.spreadsheetId || null;
      this.isAuthenticated = result.isAuthenticated || false;

      this.displayThemes();
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  }

  setupEventListeners() {
    // Sign In button
    document.getElementById('signInBtn').addEventListener('click', () => {
      this.handleSignIn();
    });

    // Sign Out button
    document.getElementById('signOutBtn').addEventListener('click', () => {
      this.handleSignOut();
    });

    // Create Spreadsheet button
    document.getElementById('createSpreadsheetBtn').addEventListener('click', () => {
      this.handleCreateSpreadsheet();
    });

    // Connect Spreadsheet button
    document.getElementById('connectSpreadsheetBtn').addEventListener('click', () => {
      this.handleConnectSpreadsheet();
    });

    // Open Spreadsheet button
    document.getElementById('openSpreadsheetBtn').addEventListener('click', () => {
      this.handleOpenSpreadsheet();
    });

    // Add Theme button
    document.getElementById('addThemeBtn').addEventListener('click', () => {
      this.handleAddTheme();
    });

    // Enter key in theme input
    document.getElementById('newThemeInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleAddTheme();
      }
    });

    // Enter key in spreadsheet ID input
    document.getElementById('spreadsheetIdInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleConnectSpreadsheet();
      }
    });
  }

  async checkAuthStatus() {
    const statusIcon = document.getElementById('authStatusIcon');
    const statusText = document.getElementById('authStatusText');
    const signInBtn = document.getElementById('signInBtn');
    const signOutBtn = document.getElementById('signOutBtn');

    if (this.isAuthenticated) {
      statusIcon.textContent = '✓';
      statusIcon.style.color = '#4caf50';
      statusText.textContent = 'Авторизовано';
      signInBtn.classList.add('hidden');
      signOutBtn.classList.remove('hidden');
    } else {
      statusIcon.textContent = '⚠';
      statusIcon.style.color = '#ff9800';
      statusText.textContent = 'Не авторизовано';
      signInBtn.classList.remove('hidden');
      signOutBtn.classList.add('hidden');
    }
  }

  async handleSignIn() {
    const btn = document.getElementById('signInBtn');
    const originalText = btn.textContent;

    try {
      btn.disabled = true;
      btn.textContent = 'Авторизація...';

      const response = await chrome.runtime.sendMessage({ action: 'authenticate' });

      if (response.success) {
        this.isAuthenticated = true;
        await chrome.storage.sync.set({ isAuthenticated: true });
        await this.checkAuthStatus();
        this.showNotification('Успішно авторизовано!', 'success');
      } else {
        throw new Error(response.error || 'Помилка авторизації');
      }
    } catch (error) {
      console.error('Sign in error:', error);
      this.showNotification('Помилка авторизації: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  async handleSignOut() {
    if (!confirm('Ви впевнені, що хочете вийти?')) {
      return;
    }

    try {
      // Clear authentication
      await chrome.storage.sync.set({ isAuthenticated: false });
      this.isAuthenticated = false;

      // Remove cached auth token
      chrome.identity.clearAllCachedAuthTokens(() => {
        this.checkAuthStatus();
        this.showNotification('Ви вийшли з облікового запису', 'success');
      });
    } catch (error) {
      console.error('Sign out error:', error);
      this.showNotification('Помилка виходу: ' + error.message, 'error');
    }
  }

  async handleCreateSpreadsheet() {
    const btn = document.getElementById('createSpreadsheetBtn');
    const originalText = btn.textContent;

    try {
      if (!this.isAuthenticated) {
        throw new Error('Спочатку увійдіть в обліковий запис Google');
      }

      btn.disabled = true;
      btn.textContent = 'Створення...';

      const response = await chrome.runtime.sendMessage({
        action: 'createSpreadsheet',
        data: { name: 'YouTube Bookmarks' }
      });

      if (response.success) {
        this.spreadsheetId = response.data.spreadsheetId;
        await this.loadSpreadsheetInfo();
        this.showNotification('Таблицю успішно створено!', 'success');

        // Clear the input field
        document.getElementById('spreadsheetIdInput').value = '';
      } else {
        throw new Error(response.error || 'Помилка створення таблиці');
      }
    } catch (error) {
      console.error('Create spreadsheet error:', error);
      this.showNotification('Помилка: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  async handleConnectSpreadsheet() {
    const input = document.getElementById('spreadsheetIdInput');
    const btn = document.getElementById('connectSpreadsheetBtn');
    const originalText = btn.textContent;

    try {
      const spreadsheetId = input.value.trim();

      if (!spreadsheetId) {
        throw new Error('Введіть ID таблиці');
      }

      if (!this.isAuthenticated) {
        throw new Error('Спочатку увійдіть в обліковий запис Google');
      }

      btn.disabled = true;
      btn.textContent = 'Підключення...';

      // Verify the spreadsheet exists
      const response = await chrome.runtime.sendMessage({
        action: 'getSpreadsheetInfo',
        data: { spreadsheetId: spreadsheetId }
      });

      if (response.success) {
        this.spreadsheetId = spreadsheetId;
        await chrome.storage.sync.set({ spreadsheetId: spreadsheetId });
        await this.loadSpreadsheetInfo();
        this.showNotification('Таблицю успішно підключено!', 'success');
        input.value = '';
      } else {
        throw new Error(response.error || 'Не вдалося підключити таблицю');
      }
    } catch (error) {
      console.error('Connect spreadsheet error:', error);
      this.showNotification('Помилка: ' + error.message, 'error');
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  async loadSpreadsheetInfo() {
    const statusIcon = document.getElementById('spreadsheetStatusIcon');
    const statusText = document.getElementById('spreadsheetStatusText');
    const infoBox = document.getElementById('spreadsheetInfo');
    const openBtn = document.getElementById('openSpreadsheetBtn');

    if (!this.spreadsheetId) {
      statusIcon.textContent = '⚠';
      statusText.textContent = 'Не підключено';
      infoBox.classList.add('hidden');
      openBtn.classList.add('hidden');
      return;
    }

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getSpreadsheetInfo',
        data: { spreadsheetId: this.spreadsheetId }
      });

      if (response.success) {
        const info = response.data;

        statusIcon.textContent = '✓';
        statusIcon.style.color = '#4caf50';
        statusText.textContent = 'Підключено';

        document.getElementById('spreadsheetName').textContent = info.title;
        document.getElementById('spreadsheetSheets').textContent = info.sheets.map(s => s.name).join(', ');
        document.getElementById('spreadsheetUrl').href = info.url;

        infoBox.classList.remove('hidden');
        openBtn.classList.remove('hidden');
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Load spreadsheet info error:', error);
      statusIcon.textContent = '✗';
      statusIcon.style.color = '#f44336';
      statusText.textContent = 'Помилка підключення';
    }
  }

  handleOpenSpreadsheet() {
    if (this.spreadsheetId) {
      const url = `https://docs.google.com/spreadsheets/d/${this.spreadsheetId}`;
      chrome.tabs.create({ url: url });
    }
  }

  async handleAddTheme() {
    const input = document.getElementById('newThemeInput');
    const theme = input.value.trim();

    if (!theme) {
      return;
    }

    if (this.themes.includes(theme)) {
      this.showNotification('Ця тема вже існує', 'error');
      return;
    }

    try {
      this.themes.push(theme);
      await chrome.storage.sync.set({ themes: this.themes });

      this.displayThemes();
      input.value = '';
      this.showNotification('Тему додано!', 'success');
    } catch (error) {
      console.error('Add theme error:', error);
      this.showNotification('Помилка додавання теми', 'error');
    }
  }

  async handleDeleteTheme(theme) {
    if (!confirm(`Видалити тему "${theme}"?`)) {
      return;
    }

    try {
      this.themes = this.themes.filter(t => t !== theme);
      await chrome.storage.sync.set({ themes: this.themes });

      this.displayThemes();
      this.showNotification('Тему видалено', 'success');
    } catch (error) {
      console.error('Delete theme error:', error);
      this.showNotification('Помилка видалення теми', 'error');
    }
  }

  displayThemes() {
    const list = document.getElementById('themesList');

    if (this.themes.length === 0) {
      list.innerHTML = '<li class="list-item loading">Немає тем. Додайте нову тему вище.</li>';
      return;
    }

    list.innerHTML = this.themes.map(theme => `
      <li class="list-item">
        <span class="theme-name">${this.escapeHtml(theme)}</span>
        <button class="delete-btn" data-theme="${this.escapeHtml(theme)}">×</button>
      </li>
    `).join('');

    // Add event listeners to delete buttons
    list.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const theme = e.target.getAttribute('data-theme');
        this.handleDeleteTheme(theme);
      });
    });
  }

  showNotification(message, type = 'info') {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;

    // Style
    Object.assign(notification.style, {
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '16px 24px',
      borderRadius: '8px',
      backgroundColor: type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3',
      color: 'white',
      fontWeight: '500',
      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
      zIndex: 10000,
      animation: 'slideIn 0.3s ease-out'
    });

    document.body.appendChild(notification);

    // Remove after 3 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideIn {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }

  @keyframes slideOut {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new OptionsManager();
  });
} else {
  new OptionsManager();
}
