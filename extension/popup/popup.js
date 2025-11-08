// Popup Script
// Handles the bookmark saving form and UI interactions

class BookmarkPopup {
  constructor() {
    this.videoInfo = null;
    this.savedFragments = {
      start: null,
      end: null
    };
    this.themes = [];

    this.init();
  }

  async init() {
    // Load themes from storage
    await this.loadThemes();

    // Load video information
    await this.loadVideoInfo();

    // Setup event listeners
    this.setupEventListeners();

    // Load saved fragment data if exists
    this.loadSavedFragmentData();
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
    document.getElementById('videoChannel').textContent = this.videoInfo.channel;
    document.getElementById('videoTime').textContent = this.formatTime(this.videoInfo.currentTime);
    document.getElementById('currentTimestamp').textContent = this.formatTime(this.videoInfo.currentTime);
    document.getElementById('currentTimestampSeconds').textContent = `(${this.videoInfo.currentTime} сек)`;

    const autoDesc = this.videoInfo.description.substring(0, 200);
    document.getElementById('autoDescription').textContent = autoDesc + (this.videoInfo.description.length > 200 ? '...' : '');
  }

  setupEventListeners() {
    // Add theme button
    document.getElementById('addThemeBtn').addEventListener('click', () => {
      this.toggleNewThemeInput(true);
    });

    // Cancel theme button
    document.getElementById('cancelThemeBtn').addEventListener('click', () => {
      this.toggleNewThemeInput(false);
    });

    // Theme select change
    document.getElementById('themeSelect').addEventListener('change', () => {
      this.toggleNewThemeInput(false);
    });

    // Description character counter
    document.getElementById('description').addEventListener('input', (e) => {
      document.getElementById('charCount').textContent = e.target.value.length;
    });

    // Fragment type change
    document.querySelectorAll('input[name="fragmentType"]').forEach(radio => {
      radio.addEventListener('change', (e) => {
        this.handleFragmentTypeChange(e.target.value);
      });
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

    // Retry button
    document.getElementById('retryBtn').addEventListener('click', () => {
      this.loadVideoInfo();
    });

    // Settings link
    document.getElementById('settingsLink').addEventListener('click', (e) => {
      e.preventDefault();
      chrome.runtime.openOptionsPage();
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

  handleFragmentTypeChange(type) {
    // Store the current timestamp based on fragment type
    if (this.videoInfo) {
      if (type === 'start') {
        this.savedFragments.start = this.videoInfo.currentTime;
      } else {
        this.savedFragments.end = this.videoInfo.currentTime;
      }
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

      const fragmentType = document.querySelector('input[name="fragmentType"]:checked').value;
      const description = document.getElementById('description').value.trim();

      // Prepare bookmark data
      const bookmark = {
        url: this.videoInfo.url,
        videoId: this.videoInfo.videoId,
        title: this.videoInfo.title,
        channel: this.videoInfo.channel,
        theme: theme,
        startTime: fragmentType === 'start' ? this.videoInfo.currentTime : (this.savedFragments.start || 0),
        endTime: fragmentType === 'end' ? this.videoInfo.currentTime : (this.savedFragments.end || this.videoInfo.duration),
        description: description,
        autoDescription: this.videoInfo.description,
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

  loadSavedFragmentData() {
    // Check if there's saved fragment data in session storage
    chrome.storage.session.get(['currentBookmark'], (result) => {
      if (result.currentBookmark) {
        this.savedFragments = result.currentBookmark.fragments || { start: null, end: null };
      }
    });
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
