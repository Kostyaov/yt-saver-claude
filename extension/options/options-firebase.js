// Options Page Script (Firebase Version)
// Handles Firebase settings and configuration

class FirebaseOptionsManager {
  constructor() {
    this.themes = [];
    this.stats = null;

    this.init();
  }

  async init() {
    // Load themes from storage
    await this.loadThemes();

    // Setup event listeners
    this.setupEventListeners();

    // Check Firebase status
    await this.checkFirebaseStatus();

    // Load stats
    await this.loadStats();
  }

  setupEventListeners() {
    // Test connection button
    document.getElementById('testConnectionBtn').addEventListener('click', () => {
      this.testConnection();
    });

    // Add theme button
    document.getElementById('addThemeBtn').addEventListener('click', () => {
      this.handleAddTheme();
    });

    // New theme input - Enter key
    document.getElementById('newThemeInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleAddTheme();
      }
    });

    // Refresh stats button
    document.getElementById('refreshStatsBtn').addEventListener('click', () => {
      this.loadStats();
    });

    // Open setup guide
    document.getElementById('openSetupGuide').addEventListener('click', (e) => {
      e.preventDefault();
      // Open FIREBASE_SETUP.md or relevant documentation
      chrome.tabs.create({
        url: 'https://github.com/Kostyaov/yt-saver-claude/blob/claude/yt-saver-ff-011CUvZj39HXCfeFq2nvhizf/FIREBASE_SETUP.md'
      });
    });
  }

  async checkFirebaseStatus() {
    const statusIcon = document.getElementById('firebaseStatusIcon');
    const statusText = document.getElementById('firebaseStatusText');
    const projectId = document.getElementById('projectId');
    const configStatus = document.getElementById('configStatus');

    try {
      // Check if Firebase is configured in storage
      const result = await chrome.storage.sync.get(['firebaseConfigured']);

      // Get config info from background
      const response = await chrome.runtime.sendMessage({
        action: 'testFirebaseConnection'
      });

      if (response.success) {
        statusIcon.textContent = '✅';
        statusIcon.style.color = '#4caf50';
        statusText.textContent = 'Firebase підключено';
        configStatus.textContent = 'Налаштовано ✓';

        // Try to get project ID from extension files
        // Note: This is a workaround since we can't directly access firebase-config.js
        projectId.textContent = 'Налаштовано';
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Firebase status check failed:', error);
      statusIcon.textContent = '⚠️';
      statusIcon.style.color = '#ff9800';
      statusText.textContent = 'Firebase не налаштовано';
      projectId.textContent = 'Не налаштовано';
      configStatus.textContent = 'Потребує налаштування';
    }
  }

  async testConnection() {
    const btn = document.getElementById('testConnectionBtn');
    const originalText = btn.textContent;

    try {
      btn.disabled = true;
      btn.textContent = 'Перевірка...';

      const response = await chrome.runtime.sendMessage({
        action: 'testFirebaseConnection'
      });

      if (response.success) {
        this.showNotification('З\'єднання успішне! Firebase працює.', 'success');
        await this.checkFirebaseStatus();
        await this.loadStats();
      } else {
        throw new Error(response.error || 'Помилка з\'єднання');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      this.showNotification(
        'Помилка з\'єднання: ' + error.message + '\n\nПеревірте налаштування Firebase у файлі firebase-config.js',
        'error'
      );
    } finally {
      btn.disabled = false;
      btn.textContent = originalText;
    }
  }

  async loadStats() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getStats'
      });

      if (response.success) {
        this.stats = response.data;
        this.displayStats();
      }
    } catch (error) {
      console.error('Error loading stats:', error);
      document.getElementById('totalBookmarks').textContent = '-';
      document.getElementById('totalCategories').textContent = '-';
    }
  }

  displayStats() {
    if (!this.stats) return;

    document.getElementById('totalBookmarks').textContent = this.stats.totalBookmarks || 0;
    document.getElementById('totalCategories').textContent = this.stats.totalCategories || 0;
  }

  async loadThemes() {
    try {
      const result = await chrome.storage.sync.get(['themes']);
      this.themes = result.themes || ['Програмування', 'Python', 'Arduino', 'Web Development', 'JavaScript'];
      this.displayThemes();
    } catch (error) {
      console.error('Error loading themes:', error);
      this.themes = ['Програмування', 'Python', 'Arduino'];
      this.displayThemes();
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
      animation: 'slideIn 0.3s ease-out',
      maxWidth: '400px',
      whiteSpace: 'pre-wrap'
    });

    document.body.appendChild(notification);

    // Remove after 5 seconds
    setTimeout(() => {
      notification.style.animation = 'slideOut 0.3s ease-out';
      setTimeout(() => notification.remove(), 300);
    }, 5000);
  }

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

// Add CSS for stats grid
const style = document.createElement('style');
style.textContent = `
  .stats-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
    gap: 16px;
    margin-bottom: 20px;
  }

  .stat-card {
    background: #f8f9fa;
    padding: 20px;
    border-radius: 8px;
    text-align: center;
  }

  .stat-value {
    font-size: 32px;
    font-weight: 700;
    color: #ff0000;
    margin-bottom: 8px;
  }

  .stat-label {
    font-size: 14px;
    color: #666;
  }

  .code-example {
    background: #f8f9fa;
    padding: 16px;
    border-radius: 8px;
    margin-top: 12px;
  }

  .code-example h4 {
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
  }

  .code-example pre {
    margin: 0;
    overflow-x: auto;
  }

  .code-example code {
    font-family: 'Courier New', Consolas, monospace;
    font-size: 12px;
    line-height: 1.6;
    color: #333;
  }

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
    new FirebaseOptionsManager();
  });
} else {
  new FirebaseOptionsManager();
}
