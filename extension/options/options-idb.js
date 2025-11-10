// Options Page Script (IndexedDB Version)
// Handles IndexedDB settings and management

class IndexedDBOptionsManager {
  constructor() {
    this.themes = [];
    this.stats = null;

    this.init();
  }

  async init() {
    // Load themes from storage
    await this.loadThemes();

    // Load general settings (theme, language, auto-pause)
    await this.loadSettings();

    // Setup event listeners
    this.setupEventListeners();

    // Check IndexedDB status
    await this.checkIndexedDBStatus();

    // Load stats
    await this.loadStats();

    // Load database size
    await this.loadDatabaseSize();
  }

  setupEventListeners() {
    // Test connection button
    document.getElementById('testConnectionBtn').addEventListener('click', () => {
      this.testConnection();
    });

    // Refresh stats button
    document.getElementById('refreshStatsBtn').addEventListener('click', () => {
      this.loadStats();
    });

    // Export button
    document.getElementById('exportBtn').addEventListener('click', () => {
      this.exportBookmarks();
    });

    // Import button
    document.getElementById('importBtn').addEventListener('click', () => {
      document.getElementById('importFileInput').click();
    });

    // File input change
    document.getElementById('importFileInput').addEventListener('change', (e) => {
      this.handleFileSelect(e);
    });

    // Add theme button
    document.getElementById('addThemeBtn').addEventListener('click', () => {
      this.addTheme();
    });

    // Clear all button
    document.getElementById('clearAllBtn').addEventListener('click', () => {
      this.confirmClearAll();
    });

    // Enter key in theme input
    document.getElementById('newThemeInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.addTheme();
      }
    });

    // General Settings - Save button
    document.getElementById('saveSettingsBtn').addEventListener('click', () => {
      this.saveSettings();
    });

    // General Settings - Theme change (apply immediately)
    document.getElementById('themeSelect').addEventListener('change', (e) => {
      this.applyTheme(e.target.value);
    });
  }

  async checkIndexedDBStatus() {
    const statusIcon = document.getElementById('idbStatusIcon');
    const statusText = document.getElementById('idbStatusText');

    // Check if IndexedDB is available
    if ('indexedDB' in window) {
      statusIcon.textContent = '✅';
      statusText.textContent = 'IndexedDB доступний';
      statusIcon.style.color = '#4caf50';
    } else {
      statusIcon.textContent = '❌';
      statusText.textContent = 'IndexedDB не підтримується';
      statusIcon.style.color = '#f44336';
      return;
    }

    // Test connection
    await this.testConnection();
  }

  async testConnection() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'testConnection'
      });

      const statusIcon = document.getElementById('idbStatusIcon');
      const statusText = document.getElementById('idbStatusText');

      if (response.success) {
        statusIcon.textContent = '✅';
        statusText.textContent = response.data.message;
        statusIcon.style.color = '#4caf50';
        this.showNotification('IndexedDB працює успішно!', 'success');
      } else {
        statusIcon.textContent = '❌';
        statusText.textContent = 'Помилка: ' + response.error;
        statusIcon.style.color = '#f44336';
        this.showNotification('Помилка з\'єднання: ' + response.error, 'error');
      }
    } catch (error) {
      console.error('Test connection error:', error);
      this.showNotification('Помилка перевірки: ' + error.message, 'error');
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
      } else {
        console.error('Failed to load stats:', response.error);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  }

  displayStats() {
    if (!this.stats) return;

    document.getElementById('totalBookmarks').textContent = this.stats.totalBookmarks;
    document.getElementById('totalCategories').textContent = this.stats.totalCategories;

    // Display storage used
    if (this.stats.storageUsed !== undefined) {
      document.getElementById('storageUsed').textContent = this.stats.storageUsed + ' KB';
    }

    // Display categories breakdown
    const categoryList = document.getElementById('categoryList');
    categoryList.innerHTML = '';

    if (this.stats.totalBookmarks === 0) {
      categoryList.innerHTML = '<li class="list-item">Закладок ще немає</li>';
      return;
    }

    const sortedCategories = Object.entries(this.stats.categories)
      .sort((a, b) => b[1] - a[1]); // Sort by count desc

    sortedCategories.forEach(([category, count]) => {
      const li = document.createElement('li');
      li.className = 'list-item';
      li.innerHTML = `
        <span class="category-name">${category}</span>
        <span class="category-count">${count} шт.</span>
      `;
      categoryList.appendChild(li);
    });
  }

  async loadDatabaseSize() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'getDatabaseSize'
      });

      if (response.success && response.data.sizeInfo) {
        const { usage, quota, percentUsed } = response.data.sizeInfo;
        const quotaElement = document.getElementById('storageQuota');

        if (quota) {
          quotaElement.textContent = `${quota} MB (використано ${percentUsed}%)`;
        } else {
          quotaElement.textContent = 'Інформація недоступна';
        }
      }
    } catch (error) {
      console.error('Error loading database size:', error);
    }
  }

  async exportBookmarks() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'exportBookmarks'
      });

      if (response.success) {
        // Create download link
        const blob = new Blob([response.data.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        // Generate filename with date
        const date = new Date().toISOString().split('T')[0];
        a.download = `youtube-bookmarks-${date}.json`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showNotification('Закладки експортовано успішно!', 'success');
      } else {
        this.showNotification('Помилка експорту: ' + response.error, 'error');
      }
    } catch (error) {
      console.error('Export error:', error);
      this.showNotification('Помилка експорту: ' + error.message, 'error');
    }
  }

  async handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const jsonData = e.target.result;

        // Validate JSON
        JSON.parse(jsonData);

        // Import bookmarks
        const response = await chrome.runtime.sendMessage({
          action: 'importBookmarks',
          data: { jsonData }
        });

        if (response.success) {
          const statusDiv = document.getElementById('importStatus');
          statusDiv.className = 'status-message success';
          statusDiv.textContent = `✅ ${response.data.message}. Всього: ${response.data.total}, Помилок: ${response.data.errors}`;
          statusDiv.classList.remove('hidden');

          // Reload stats
          await this.loadStats();

          this.showNotification('Імпорт завершено успішно!', 'success');

          // Hide status after 5 seconds
          setTimeout(() => {
            statusDiv.classList.add('hidden');
          }, 5000);
        } else {
          this.showNotification('Помилка імпорту: ' + response.error, 'error');
        }
      } catch (error) {
        console.error('Import error:', error);
        this.showNotification('Невалідний JSON файл: ' + error.message, 'error');
      }
    };

    reader.readAsText(file);

    // Reset file input
    event.target.value = '';
  }

  async loadThemes() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['themes'], (result) => {
        this.themes = result.themes || [];
        this.displayThemes();
        resolve();
      });
    });
  }

  displayThemes() {
    const themesList = document.getElementById('themesList');
    themesList.innerHTML = '';

    if (this.themes.length === 0) {
      themesList.innerHTML = '<li class="list-item">Тем ще немає</li>';
      return;
    }

    this.themes.forEach((theme, index) => {
      const li = document.createElement('li');
      li.className = 'list-item';
      li.innerHTML = `
        <span class="theme-name">${theme}</span>
        <button class="btn-icon delete-btn" data-index="${index}" title="Видалити">×</button>
      `;

      // Add delete handler
      li.querySelector('.delete-btn').addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        this.deleteTheme(index);
      });

      themesList.appendChild(li);
    });
  }

  async addTheme() {
    const input = document.getElementById('newThemeInput');
    const themeName = input.value.trim();

    if (!themeName) {
      this.showNotification('Введіть назву теми', 'error');
      return;
    }

    if (this.themes.includes(themeName)) {
      this.showNotification('Ця тема вже існує', 'error');
      return;
    }

    this.themes.push(themeName);

    chrome.storage.sync.set({ themes: this.themes }, () => {
      this.displayThemes();
      input.value = '';
      this.showNotification(`Тему "${themeName}" додано`, 'success');
    });
  }

  async deleteTheme(index) {
    const themeName = this.themes[index];

    if (!confirm(`Видалити тему "${themeName}"?`)) {
      return;
    }

    this.themes.splice(index, 1);

    chrome.storage.sync.set({ themes: this.themes }, () => {
      this.displayThemes();
      this.showNotification(`Тему "${themeName}" видалено`, 'success');
    });
  }

  async confirmClearAll() {
    const confirmation = confirm(
      'Ви впевнені що хочете видалити ВСІ закладки?\n\n' +
      'Ця дія незворотня!\n\n' +
      'Рекомендуємо спочатку зробити експорт даних.'
    );

    if (!confirmation) return;

    const doubleCheck = confirm(
      'Це остання перевірка!\n\n' +
      'Всі ваші закладки будуть видалені назавжди.\n\n' +
      'Продовжити?'
    );

    if (!doubleCheck) return;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'clearAllBookmarks'
      });

      if (response.success) {
        this.showNotification('Всі закладки видалено', 'success');
        await this.loadStats();
      } else {
        this.showNotification('Помилка видалення: ' + response.error, 'error');
      }
    } catch (error) {
      console.error('Clear all error:', error);
      this.showNotification('Помилка: ' + error.message, 'error');
    }
  }

  showNotification(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');

    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }

  async loadSettings() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['theme', 'language', 'autoPause'], (result) => {
        // Load theme (default: light)
        const theme = result.theme || 'light';
        document.getElementById('themeSelect').value = theme;
        this.applyTheme(theme);

        // Load language (default: en)
        const language = result.language || 'en';
        document.getElementById('languageSelect').value = language;

        // Load auto-pause (default: false)
        const autoPause = result.autoPause || false;
        document.getElementById('autoPauseCheckbox').checked = autoPause;

        resolve();
      });
    });
  }

  async saveSettings() {
    const saveBtn = document.getElementById('saveSettingsBtn');
    const statusDiv = document.getElementById('settingsSaveStatus');

    try {
      // Disable button during save
      saveBtn.disabled = true;
      saveBtn.textContent = '💾 Збереження...';

      // Get current values
      const settings = {
        theme: document.getElementById('themeSelect').value,
        language: document.getElementById('languageSelect').value,
        autoPause: document.getElementById('autoPauseCheckbox').checked
      };

      // Save to chrome.storage.sync
      await new Promise((resolve, reject) => {
        chrome.storage.sync.set(settings, () => {
          if (chrome.runtime.lastError) {
            reject(chrome.runtime.lastError);
          } else {
            resolve();
          }
        });
      });

      // Apply theme immediately
      this.applyTheme(settings.theme);

      // Show success message
      statusDiv.textContent = '✅ Налаштування збережено успішно!';
      statusDiv.className = 'status-message success';
      statusDiv.classList.remove('hidden');

      this.showNotification('Налаштування збережено', 'success');

      // Hide message after 3 seconds
      setTimeout(() => {
        statusDiv.classList.add('hidden');
      }, 3000);

    } catch (error) {
      console.error('Error saving settings:', error);
      statusDiv.textContent = '❌ Помилка збереження: ' + error.message;
      statusDiv.className = 'status-message error';
      statusDiv.classList.remove('hidden');

      this.showNotification('Помилка збереження: ' + error.message, 'error');
    } finally {
      // Re-enable button
      saveBtn.disabled = false;
      saveBtn.textContent = '💾 Зберегти налаштування';
    }
  }

  applyTheme(theme) {
    // Apply theme to body element
    document.body.setAttribute('data-theme', theme);

    // Also save to storage if called directly
    chrome.storage.sync.set({ theme: theme });
  }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  new IndexedDBOptionsManager();
});
