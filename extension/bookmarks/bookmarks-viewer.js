// Bookmarks Viewer
// Displays all saved bookmarks with search, filter, and sort functionality

class BookmarksViewer {
  constructor() {
    this.bookmarks = [];
    this.filteredBookmarks = [];
    this.categories = new Set();
    this.bookmarkToDelete = null;

    this.init();
  }

  async init() {
    // Initialize i18n
    if (typeof i18n !== 'undefined') {
      await i18n.init();
      i18n.applyTranslations();
    }

    // Load and apply theme from settings
    await this.loadTheme();

    // Setup event listeners
    this.setupEventListeners();

    // Load bookmarks
    await this.loadBookmarks();
  }

  setupEventListeners() {
    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', () => {
      this.loadBookmarks();
    });

    // Export button
    document.getElementById('exportBtn').addEventListener('click', () => {
      this.exportBookmarks();
    });

    // Search input
    document.getElementById('searchInput').addEventListener('input', (e) => {
      this.filterAndSort();
    });

    // Category filter
    document.getElementById('categoryFilter').addEventListener('change', (e) => {
      this.filterAndSort();
    });

    // Sort select
    document.getElementById('sortSelect').addEventListener('change', (e) => {
      this.filterAndSort();
    });

    // Delete modal buttons
    document.getElementById('cancelDelete').addEventListener('click', () => {
      this.hideDeleteModal();
    });

    document.getElementById('confirmDelete').addEventListener('click', () => {
      this.confirmDelete();
    });
  }

  async loadBookmarks() {
    const loading = document.getElementById('loading');
    const emptyState = document.getElementById('emptyState');
    const bookmarksList = document.getElementById('bookmarksList');
    const noResults = document.getElementById('noResults');

    try {
      // Show loading
      loading.classList.remove('hidden');
      bookmarksList.classList.add('hidden');
      emptyState.classList.add('hidden');
      noResults.classList.add('hidden');

      // Get bookmarks from service worker
      const response = await chrome.runtime.sendMessage({
        action: 'getBookmarks'
      });

      if (response.success) {
        this.bookmarks = response.data || [];

        // Extract unique categories
        this.categories.clear();
        this.bookmarks.forEach(bookmark => {
          if (bookmark.category) {
            this.categories.add(bookmark.category);
          }
        });

        // Populate category filter
        this.populateCategoryFilter();

        // Update stats
        this.updateStats();

        // Hide loading
        loading.classList.add('hidden');

        if (this.bookmarks.length === 0) {
          emptyState.classList.remove('hidden');
        } else {
          // Filter and display bookmarks
          this.filterAndSort();
        }
      } else {
        throw new Error(response.error || 'Помилка завантаження закладок');
      }
    } catch (error) {
      console.error('Error loading bookmarks:', error);
      loading.classList.add('hidden');
      this.showToast('Помилка завантаження: ' + error.message, 'error');
    }
  }

  populateCategoryFilter() {
    const categoryFilter = document.getElementById('categoryFilter');

    // Clear existing options (except "Всі категорії")
    categoryFilter.innerHTML = '<option value="">Всі категорії</option>';

    // Add categories
    const sortedCategories = Array.from(this.categories).sort();
    sortedCategories.forEach(category => {
      const option = document.createElement('option');
      option.value = category;
      option.textContent = category;
      categoryFilter.appendChild(option);
    });
  }

  filterAndSort() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase().trim();
    const selectedCategory = document.getElementById('categoryFilter').value;
    const sortBy = document.getElementById('sortSelect').value;

    // Filter bookmarks
    this.filteredBookmarks = this.bookmarks.filter(bookmark => {
      // Category filter
      if (selectedCategory && bookmark.category !== selectedCategory) {
        return false;
      }

      // Search filter
      if (searchTerm) {
        const searchableText = [
          bookmark.title,
          bookmark.description,
          bookmark.channelName,
          bookmark.category
        ].join(' ').toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      return true;
    });

    // Sort bookmarks
    this.sortBookmarks(sortBy);

    // Display bookmarks
    this.displayBookmarks();

    // Update displayed count
    document.getElementById('displayedCount').textContent = this.filteredBookmarks.length;
  }

  sortBookmarks(sortBy) {
    switch (sortBy) {
      case 'newest':
        this.filteredBookmarks.sort((a, b) => {
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        break;

      case 'oldest':
        this.filteredBookmarks.sort((a, b) => {
          return new Date(a.createdAt) - new Date(b.createdAt);
        });
        break;

      case 'title':
        this.filteredBookmarks.sort((a, b) => {
          return (a.title || '').localeCompare(b.title || '');
        });
        break;

      case 'category':
        this.filteredBookmarks.sort((a, b) => {
          const categoryCompare = (a.category || '').localeCompare(b.category || '');
          if (categoryCompare !== 0) return categoryCompare;
          // Secondary sort by date
          return new Date(b.createdAt) - new Date(a.createdAt);
        });
        break;
    }
  }

  displayBookmarks() {
    const bookmarksList = document.getElementById('bookmarksList');
    const emptyState = document.getElementById('emptyState');
    const noResults = document.getElementById('noResults');

    if (this.filteredBookmarks.length === 0) {
      bookmarksList.classList.add('hidden');

      if (this.bookmarks.length === 0) {
        emptyState.classList.remove('hidden');
        noResults.classList.add('hidden');
      } else {
        emptyState.classList.add('hidden');
        noResults.classList.remove('hidden');
      }
      return;
    }

    // Show bookmarks list
    bookmarksList.classList.remove('hidden');
    emptyState.classList.add('hidden');
    noResults.classList.add('hidden');

    // Render bookmarks
    bookmarksList.innerHTML = this.filteredBookmarks.map(bookmark => {
      return this.createBookmarkCard(bookmark);
    }).join('');

    // Add event listeners to delete buttons
    bookmarksList.querySelectorAll('.delete-bookmark-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const bookmarkId = parseInt(btn.dataset.bookmarkId);
        this.showDeleteModal(bookmarkId);
      });
    });
  }

  createBookmarkCard(bookmark) {
    const watchUrl = bookmark.watchUrl || `${bookmark.videoUrl}&t=${Math.floor(bookmark.currentTime)}s`;
    const description = bookmark.description || '';

    return `
      <div class="bookmark-row" data-bookmark-id="${bookmark.id}">
        <div class="bookmark-description">${this.escapeHtml(description)}</div>
        <div class="bookmark-link">
          <a href="${this.escapeHtml(watchUrl)}" target="_blank" rel="noopener noreferrer">
            ${this.escapeHtml(watchUrl)}
          </a>
        </div>
        <button class="delete-bookmark-btn" data-bookmark-id="${bookmark.id}" title="Видалити">
          🗑️
        </button>
      </div>
    `;
  }

  updateStats() {
    document.getElementById('totalCount').textContent = this.bookmarks.length;
    document.getElementById('displayedCount').textContent = this.filteredBookmarks.length || this.bookmarks.length;
    document.getElementById('categoriesCount').textContent = this.categories.size;
  }

  showDeleteModal(bookmarkId) {
    const bookmark = this.bookmarks.find(b => b.id === bookmarkId);
    if (!bookmark) return;

    this.bookmarkToDelete = bookmarkId;

    const modal = document.getElementById('deleteModal');
    const message = document.getElementById('deleteMessage');

    message.textContent = `Ви впевнені що хочете видалити закладку "${bookmark.title}"?`;
    modal.classList.remove('hidden');
  }

  hideDeleteModal() {
    const modal = document.getElementById('deleteModal');
    modal.classList.add('hidden');
    this.bookmarkToDelete = null;
  }

  async confirmDelete() {
    if (!this.bookmarkToDelete) return;

    try {
      const response = await chrome.runtime.sendMessage({
        action: 'deleteBookmark',
        data: { bookmarkId: this.bookmarkToDelete }
      });

      if (response.success) {
        this.showToast('Закладку видалено', 'success');

        // Remove from local arrays
        this.bookmarks = this.bookmarks.filter(b => b.id !== this.bookmarkToDelete);

        // Reload to update everything
        await this.loadBookmarks();
      } else {
        throw new Error(response.error || 'Помилка видалення');
      }
    } catch (error) {
      console.error('Error deleting bookmark:', error);
      this.showToast('Помилка: ' + error.message, 'error');
    } finally {
      this.hideDeleteModal();
    }
  }

  async exportBookmarks() {
    try {
      const response = await chrome.runtime.sendMessage({
        action: 'exportBookmarks'
      });

      if (response.success) {
        // Create download
        const blob = new Blob([response.data.data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;

        const date = new Date().toISOString().split('T')[0];
        a.download = `youtube-bookmarks-${date}.json`;

        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('Експорт успішний!', 'success');
      } else {
        throw new Error(response.error || 'Помилка експорту');
      }
    } catch (error) {
      console.error('Error exporting:', error);
      this.showToast('Помилка експорту: ' + error.message, 'error');
    }
  }

  showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toastMessage');

    toastMessage.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.remove('hidden');

    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
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

  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  async loadTheme() {
    try {
      // Load theme from settings
      const result = await chrome.storage.sync.get(['theme']);
      const theme = result.theme || 'light';

      // Apply theme to body
      document.body.setAttribute('data-theme', theme);
    } catch (error) {
      console.log('Error loading theme:', error);
      // Default to light theme
      document.body.setAttribute('data-theme', 'light');
    }
  }
}

// Initialize viewer when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => {
    new BookmarksViewer();
  });
} else {
  new BookmarksViewer();
}
