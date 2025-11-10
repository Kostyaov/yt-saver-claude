// Popup Script
// Handles the bookmark saving form and UI interactions

class BookmarkPopup {
  constructor() {
    this.videoInfo = null;
    this.themes = [];

    this.init();
  }

  async init() {
    // Setup event listeners first (so footer buttons always work)
    this.setupEventListeners();

    // Load themes from storage
    await this.loadThemes();

    // Load video information
    await this.loadVideoInfo();
  }

  async loadThemes() {
    try {
      const result = await chrome.storage.sync.get(['themes']);
      this.themes = result.themes || ['Програмування', 'Arduino', 'Python', 'Web Development'];
      this.populateThemeSelect();
    } catch (error) {
      console.error('Error loading themes:', error);
      this.themes = ['Програмування', 'Arduino', 'Python'];
      this.populateThemeSelect();
    }
  }

  populateThemeSelect() {
    const select = document.getElementById('themeSelect');
    select.innerHTML = '<option value="">Виберіть тему...</option>';

    this.themes.forEach(theme => {
      const option = document.createElement('option');
      option.value = theme;
      option.textContent = theme;
      select.appendChild(option);
    });
  }

  async loadVideoInfo() {
    const loading = document.getElementById('loading');
    const error = document.getElementById('error');
    const mainContent = document.getElementById('mainContent');

    try {
      loading.classList.remove('hidden');
      error.classList.add('hidden');

      // Get active tab
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

      if (!tab.url.includes('youtube.com/watch')) {
        throw new Error('Це не сторінка відео YouTube');
      }

      // Send message to content script
      const response = await chrome.tabs.sendMessage(tab.id, { action: 'getVideoInfo' });

      if (response.success) {
        this.videoInfo = response.data;
        this.displayVideoInfo();

        loading.classList.add('hidden');
        mainContent.classList.remove('hidden');
      } else {
        throw new Error(response.error || 'Не вдалося отримати інформацію про відео');
      }
    } catch (error) {
      console.error('Error loading video info:', error);
      loading.classList.add('hidden');
      error.classList.remove('hidden');
      document.getElementById('errorMessage').textContent = error.message;
    }
  }

  displayVideoInfo() {
    if (!this.videoInfo) return;

    document.getElementById('videoTitle').textContent = this.videoInfo.title;
    document.getElementById('videoChannel').textContent = this.videoInfo.channelName;
    document.getElementById('videoTime').textContent = this.formatTime(this.videoInfo.currentTime);
    document.getElementById('currentTimestamp').textContent = this.formatTime(this.videoInfo.currentTime);
    document.getElementById('currentTimestampSeconds').textContent = `(${this.videoInfo.currentTime} сек)`;
  }

  setupEventListeners() {
    // Add theme button (+ icon)
    document.getElementById('addThemeBtn').addEventListener('click', () => {
      this.toggleNewThemeInput(true);
    });

    // Add new theme button (Додати button)
    document.getElementById('addNewThemeBtn').addEventListener('click', () => {
      this.handleAddNewTheme();
    });

    // Cancel theme button
    document.getElementById('cancelThemeBtn').addEventListener('click', () => {
      this.toggleNewThemeInput(false);
    });

    // Theme select change
    document.getElementById('themeSelect').addEventListener('change', () => {
      this.toggleNewThemeInput(false);
    });

    // New theme input - Enter key
    document.getElementById('newThemeInput').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        this.handleAddNewTheme();
      }
    });

    // Description character counter
    document.getElementById('description').addEventListener('input', (e) => {
      document.getElementById('charCount').textContent = e.target.value.length;
    });

    // Form submit
    document.getElementById('bookmarkForm').addEventListener('submit', (e) => {
      e.preventDefault();
      this.saveBookmark();
    });

    // Cancel button
    document.getElementById('cancelBtn').addEventListener('click', () => {
      window.close();
    });

    // Settings link
    document.getElementById('settingsLink').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
    });

    // View bookmarks button
    document.getElementById('viewBookmarksBtn').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.tabs.create({ url: chrome.runtime.getURL('bookmarks/bookmarks-viewer.html') });
    });
  }

  toggleNewThemeInput(show) {
    const newThemeGroup = document.getElementById('newThemeGroup');
    const themeSelect = document.getElementById('themeSelect');

    if (show) {
      newThemeGroup.classList.remove('hidden');
      themeSelect.value = '';
      document.getElementById('newThemeInput').focus();
    } else {
      newThemeGroup.classList.add('hidden');
      document.getElementById('newThemeInput').value = '';
    }
  }

  async handleAddNewTheme() {
    const input = document.getElementById('newThemeInput');
    const themeSelect = document.getElementById('themeSelect');
    const newTheme = input.value.trim();

    if (!newTheme) {
      return;
    }

    try {
      // Add new theme to list if it doesn't exist
      if (!this.themes.includes(newTheme)) {
        this.themes.push(newTheme);
        await chrome.storage.sync.set({ themes: this.themes });

        // Refresh theme dropdown
        this.populateThemeSelect();
      }

      // Select the new theme
      themeSelect.value = newTheme;

      // Hide the new theme input
      this.toggleNewThemeInput(false);
    } catch (error) {
      console.error('Error adding theme:', error);
      alert('Помилка додавання теми: ' + error.message);
    }
  }

  async saveBookmark() {
    const saveBtn = document.getElementById('saveBtn');
    const statusMessage = document.getElementById('statusMessage');

    try {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Збереження...';

      // Get form data
      let theme = document.getElementById('themeSelect').value;
      const newTheme = document.getElementById('newThemeInput').value.trim();

      if (newTheme) {
        theme = newTheme;
        // Add new theme to list
        if (!this.themes.includes(theme)) {
          this.themes.push(theme);
          await chrome.storage.sync.set({ themes: this.themes });
        }
      }

      if (!theme) {
        throw new Error('Будь ласка, виберіть або додайте тему');
      }

      const description = document.getElementById('description').value.trim();

      // Prepare bookmark data
      const bookmark = {
        url: this.videoInfo.url,
        videoId: this.videoInfo.videoId,
        title: this.videoInfo.title,
        channelUrl: this.videoInfo.channelUrl,
        channelName: this.videoInfo.channelName,
        theme: theme,
        watchUrl: this.videoInfo.watchUrl,
        currentTime: this.videoInfo.currentTime,
        description: description,
        timestamp: new Date().toISOString()
      };

      // Send to background script to save to Google Sheets
      const response = await chrome.runtime.sendMessage({
        action: 'saveBookmark',
        data: bookmark
      });

      if (response.success) {
        statusMessage.textContent = '✓ Закладку успішно збережено!';
        statusMessage.className = 'status-message success';
        statusMessage.classList.remove('hidden');

        // Close popup after 1.5 seconds
        setTimeout(() => window.close(), 1500);
      } else {
        throw new Error(response.error || 'Помилка збереження');
      }
    } catch (error) {
      console.error('Error saving bookmark:', error);
      statusMessage.textContent = '✗ ' + error.message;
      statusMessage.className = 'status-message error';
      statusMessage.classList.remove('hidden');

      saveBtn.disabled = false;
      saveBtn.textContent = 'Зберегти';
    }
  }

  formatTime(seconds) {
    if (!seconds && seconds !== 0) return '0:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }
}

// Initialize popup when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new BookmarkPopup();
  });
} else {
  new BookmarkPopup();
}
