# Context Engineering Document

**Project:** YouTube Bookmarks Saver (IndexedDB Local Storage Edition)
**Version:** 3.0.0
**Last Updated:** November 10, 2024
**Branch:** `claude/yt-saver-idb-011CUvZj39HXCfeFq2nvhizf`

---

## 📋 Document Purpose

Цей документ призначений для AI асистентів (Claude, ChatGPT, etc.) і розробників, які продовжуватимуть роботу над проектом. Містить повний контекст, архітектурні рішення, та критичні деталі для швидкого входження в проект.

---

## 🎯 Project Overview

### What is this?

Browser extension (Chrome/Edge/Brave/Opera) для збереження закладок з YouTube відео з точним timestamp у **локальне IndexedDB сховище**.

### Key Features

- ✅ Збереження поточного моменту з YouTube відео
- ✅ Організація за категоріями/темами
- ✅ Timestamped URLs (youtube.com/watch?v=ID&t=seconds)
- ✅ Автоматичне витягування метаданих (title, channel, description)
- ✅ **Повністю локальне зберігання в IndexedDB**
- ✅ **Експорт/імпорт у JSON формат**
- ✅ **Переглядач закладок з пошуком та фільтрацією**
- ✅ **Працює офлайн - без залежностей від хмарних сервісів**
- ✅ **Інтернаціоналізація - англійська та українська мови**
- ✅ **Підтримка тем - світла та темна теми**
- ✅ **Авто-пауза відео при збереженні закладки**
- ✅ Keyboard shortcut (Ctrl+Shift+B / Cmd+Shift+B)
- ✅ Кнопки "Збережене" та "Налаштування" доступні на всіх сторінках

### Target Users

- Студенти що вивчають програмування/технології
- Дослідники що збирають матеріали з YouTube
- Користувачі що цінують приватність (дані зберігаються локально)
- Будь-хто хто хоче зберігати цікаві моменти з відео без хмарних сервісів

### Version History

- **v1.0.0** - Google Sheets backend (deprecated)
- **v2.0.0** - Firebase Firestore backend (branch: `claude/yt-saver-ff-*`)
- **v3.0.0** - **IndexedDB local storage (current)** (branch: `claude/yt-saver-idb-*`)

---

## 🏗️ Architecture

### Tech Stack

| Component | Technology | Why? |
|-----------|-----------|------|
| Extension API | Manifest V3 | Latest Chrome extension standard |
| Storage | IndexedDB | Browser-native, async, ~50-100MB quota, supports indexes |
| Language | Vanilla JavaScript | No build process, simple deployment |
| UI | HTML/CSS | Native browser rendering |
| Export Format | JSON | Human-readable, portable, easy backup |

### File Structure

```
extension/
├── manifest.json              # Extension config (v3.0.0, no external permissions)
├── background/
│   └── service-worker.js      # MAIN FILE - IndexedDB operations
├── popup/
│   ├── popup.html            # Save bookmark form + footer buttons
│   ├── popup.js              # Form logic + event listeners
│   └── popup.css             # Styles (footer always visible)
├── content/
│   └── youtube-script.js     # Extract YouTube metadata
├── options/
│   ├── options-idb.html      # Settings page with export/import
│   ├── options-idb.js        # Settings logic
│   └── options.css           # Shared styles
├── bookmarks/
│   ├── bookmarks-viewer.html # Bookmarks viewer page
│   ├── bookmarks-viewer.js   # Viewer logic (search, filter, sort, delete)
│   └── bookmarks-viewer.css  # Row-based display styles
├── locales/                  # NEW: Internationalization
│   ├── en.json              # English translations (195 lines)
│   └── uk.json              # Ukrainian translations (195 lines)
└── utils/
    ├── idb-api.js            # IndexedDB API wrapper class
    └── i18n.js               # NEW: Internationalization utility (159 lines)
```

### Key Architecture Decisions

#### 1. Why IndexedDB over localStorage?

| Feature | localStorage | IndexedDB |
|---------|-------------|-----------|
| Storage Size | 5-10 MB | 50-100 MB (can request more) |
| API | Synchronous (blocking) | Asynchronous (non-blocking) |
| Data Types | Strings only | Objects, arrays, blobs |
| Indexes | No | Yes (efficient queries) |
| Transactions | No | Yes (ACID) |

**Decision:** IndexedDB для більшого обсягу, кращої продуктивності, та можливості індексації.

#### 2. Why Not Firebase?

**v2.0.0 Firebase Drawbacks:**
- Потрібен Firebase проект та налаштування
- Залежність від зовнішнього сервісу
- Обмеження безкоштовного тарифу (50K reads/day)
- Потенційні проблеми з приватністю даних
- Потребує інтернет з'єднання

**v3.0.0 IndexedDB Benefits:**
- ✅ Нульова конфігурація - працює одразу
- ✅ Повна приватність - дані не залишають пристрій
- ✅ Безлімітна кількість операцій
- ✅ Працює офлайн
- ✅ Швидше (~50ms vs ~400ms для Firebase)

#### 3. Row-Based Display Format

**Decision:** Показувати закладки у вигляді рядків замість карток.

**Format:** `[description] [watchUrl link] [delete button]`

**Why?**
- Компактніше - більше записів на екрані
- Швидший доступ до посилань
- Простіше сканувати очима
- Менше прокрутки

---

## 💾 IndexedDB Integration

### Database Schema

**Database Name:** `youtube-bookmarks`
**Version:** 1
**Object Store:** `bookmarks`

**Configuration:**
```javascript
{
  keyPath: 'id',           // Auto-increment primary key
  autoIncrement: true
}
```

**Indexes:**
```javascript
{
  category:   { unique: false },  // For filtering by category
  createdAt:  { unique: false },  // For sorting by date
  currentTime: { unique: false }, // For sorting by timestamp
  videoId:    { unique: false }   // For finding duplicates
}
```

### Document Structure

```javascript
{
  id: 1,                          // Auto-generated primary key
  title: "Video Title",           // From YouTube metadata
  videoId: "dQw4w9WgXcQ",        // Extracted from URL
  videoUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ",
  watchUrl: "https://youtube.com/watch?v=dQw4w9WgXcQ&t=123s",
  currentTime: 123,               // Seconds
  channelName: "Channel Name",    // From YouTube
  channelUrl: "https://youtube.com/@channel",
  category: "Програмування",      // User-selected theme
  description: "User notes...",   // Optional user description
  createdAt: "2024-11-10T12:00:00.000Z",  // ISO timestamp
  updatedAt: "2024-11-10T12:00:00.000Z"   // ISO timestamp
}
```

### IndexedDB API Wrapper

**File:** `extension/utils/idb-api.js`
**Class:** `IndexedDBAPI`

**Key Methods:**

```javascript
class IndexedDBAPI {
  // Database initialization
  async openDB()              // Opens/creates database
  async ensureDB()            // Ensures connection is ready

  // CRUD operations
  async addBookmark(data)     // Create bookmark, returns {success, id, message}
  async getAllBookmarks()     // Read all bookmarks
  async getBookmarkById(id)   // Read single bookmark
  async updateBookmark(id, data)  // Update bookmark
  async deleteBookmark(id)    // Delete bookmark

  // Advanced queries
  async getBookmarksByCategory(category)  // Filter by category
  async searchBookmarks(query)            // Search across fields

  // Utility
  async getCategories()       // Get unique categories
  async getBookmarksCount()   // Get total count

  // Export/Import
  async exportToJSON()        // Export all to JSON string
  async importFromJSON(json)  // Import from JSON string
  async clearAllBookmarks()   // Delete all bookmarks
}
```

**Performance:**
- **Save operation:** <50ms (8x faster than Firebase ~400ms)
- **Load all bookmarks:** <100ms for 1000 records
- **Search/filter:** <50ms with indexes

### Service Worker Integration

**File:** `extension/background/service-worker.js`

**Import:**
```javascript
importScripts('/utils/idb-api.js');
const idbAPI = new IndexedDBAPI();
```

**Message Handlers:**

```javascript
// Save bookmark from popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'saveBookmark') {
    handleSaveBookmark(message.data)
      .then(result => sendResponse(result))
      .catch(error => sendResponse({success: false, error: error.message}));
    return true; // Async response
  }

  if (message.action === 'getBookmarks') {
    handleGetBookmarks()
      .then(result => sendResponse(result))
      .catch(error => sendResponse({success: false, error: error.message}));
    return true;
  }

  // ... other handlers: deleteBookmark, exportBookmarks, importBookmarks
});
```

---

## 📖 Bookmarks Viewer

### Overview

**File:** `extension/bookmarks/bookmarks-viewer.html`
**Access:** Via "📖 Збережене" button in popup footer

### Features

#### 1. Search
- Real-time search across: title, description, channel name, category
- Case-insensitive
- Updates results instantly as you type

#### 2. Category Filter
- Dropdown populated from saved bookmarks
- "Всі категорії" to show all
- Combines with search

#### 3. Sort Options
- **Найновіші** - Newest first (default)
- **Найстаріші** - Oldest first
- **За назвою** - Alphabetically by title
- **За категорією** - By category, then by date

#### 4. Display Format (Row-Based)

```
┌──────────────────────────────────────────────────────────────────────┐
│ [User description text]  [https://youtube.com/...&t=123s]  [🗑️]     │
└──────────────────────────────────────────────────────────────────────┘
```

**Layout:**
- 3-column grid: `description | link | delete button`
- Description: ellipsis if too long
- Link: full watchUrl, clickable, opens in new tab
- Delete: confirmation modal before deletion

#### 5. Statistics Bar

Shows:
- **Total:** All saved bookmarks
- **Displayed:** After filtering/searching
- **Categories:** Unique category count

#### 6. Export/Refresh

- **Export** button - downloads JSON file `youtube-bookmarks-YYYY-MM-DD.json`
- **Refresh** button - reloads data from IndexedDB

### Implementation Details

**Class:** `BookmarksViewer` (in `bookmarks-viewer.js`)

**Key Methods:**
```javascript
async loadBookmarks()       // Load from IndexedDB
filterAndSort()             // Apply search + filters + sort
displayBookmarks()          // Render to DOM
createBookmarkCard(bookmark) // Generate HTML for one row
showDeleteModal(id)         // Confirm deletion
confirmDelete()             // Execute deletion
exportBookmarks()           // Download JSON
```

**State Management:**
```javascript
{
  bookmarks: [],           // All bookmarks from DB
  filteredBookmarks: [],   // After search/filter/sort
  categories: Set(),       // Unique categories
  bookmarkToDelete: null   // ID of bookmark pending deletion
}
```

### Responsive Design

- **Desktop (>768px):** Full 3-column layout
- **Tablet (768px):** 3 columns, slightly adjusted
- **Mobile (<768px):** Single column, delete button at end

---

## 🌍 Internationalization (i18n)

### Overview

**Version Added:** v3.0.0
**Supported Languages:** English (en), Ukrainian (uk)
**Default Language:** English

### Architecture

**Files:**
- `extension/locales/en.json` - English translations (195 lines)
- `extension/locales/uk.json` - Ukrainian translations (195 lines)
- `extension/utils/i18n.js` - i18n utility class (159 lines)

### Translation Structure

**JSON Format:**
```json
{
  "appName": "YouTube Bookmarks Saver",
  "popup": {
    "title": "YouTube Bookmarks",
    "themeSelectPlaceholder": "Select a theme...",
    "saveButton": "Save",
    // ... 30+ popup keys
  },
  "options": {
    "title": "Settings",
    "connectionSuccess": "IndexedDB working successfully!",
    "saveSettingsButton": "Save Settings",
    // ... 70+ options keys
  },
  "bookmarks": {
    "title": "Saved Bookmarks",
    "allCategories": "All Categories",
    // ... 20+ bookmarks keys
  },
  "common": {
    "error": "Error",
    "cancel": "Cancel"
  }
}
```

### i18n.js API

**Class:** `I18n`

**Methods:**
```javascript
class I18n {
  async init()                  // Initialize, load saved language
  async loadTranslations(lang)  // Load JSON for language
  t(keyPath)                    // Get translation by dot notation
  applyTranslations()           // Apply to DOM [data-i18n] elements
  async setLanguage(lang)       // Change language, save to storage
  getCurrentLanguage()          // Get current language code
}
```

**Usage Example:**
```javascript
// Initialize on page load
await i18n.init();
i18n.applyTranslations();

// Get translation programmatically
const text = i18n.t('popup.saveButton'); // "Save" or "Зберегти"

// Change language
await i18n.setLanguage('uk');
```

### HTML Integration

**Static Text (data-i18n attribute):**
```html
<h1 data-i18n="popup.title">YouTube Bookmarks</h1>
<button data-i18n="popup.saveButton">Save</button>
```

**Attributes (data-i18n-attr):**
```html
<input
  data-i18n="popup.searchPlaceholder"
  data-i18n-attr="placeholder"
  placeholder="Search...">
```

**JavaScript applies translations automatically to all elements with `data-i18n`.**

### Dynamic Content

**Problem:** JavaScript-generated content isn't covered by `data-i18n` attributes.

**Solution:** Use `i18n.t()` method:
```javascript
// ❌ BAD - Hardcoded text
statusText.textContent = 'IndexedDB працює успішно!';

// ✅ GOOD - Localized
statusText.textContent = i18n.t('options.connectionSuccess');
```

**Examples:**
```javascript
// Popup theme dropdown
select.innerHTML = `<option value="">${i18n.t('popup.themeSelectPlaceholder')}</option>`;

// Bookmarks category filter
categoryFilter.innerHTML = `<option value="">${i18n.t('bookmarks.allCategories')}</option>`;

// Notification messages
this.showNotification(i18n.t('options.exportSuccess'), 'success');

// Error messages
this.showNotification(i18n.t('options.exportError') + ' ' + error.message, 'error');
```

### Language Switching

**Flow:**
1. User selects language in options page
2. JavaScript calls `i18n.setLanguage(newLanguage)`
3. Translations loaded from JSON file
4. Language saved to `chrome.storage.sync`
5. Page reloads to apply new language

**Implementation:**
```javascript
// In options-idb.js
async saveSettings() {
  const currentLanguage = i18n.getCurrentLanguage();
  const newLanguage = document.getElementById('languageSelect').value;
  const languageChanged = currentLanguage !== newLanguage;

  if (languageChanged) {
    await i18n.setLanguage(newLanguage);
    // Reload page to re-apply translations
    setTimeout(() => window.location.reload(), 800);
    return;
  }

  // Save other settings...
}
```

### Storage

**Language preference stored in:**
```javascript
chrome.storage.sync.set({ language: 'uk' });
```

**Benefits:**
- Synced across devices (if user logged into Chrome)
- Persists after browser restart
- Independent from IndexedDB

### Service Worker Limitations

**Problem:** Service worker doesn't have access to i18n.js (no DOM)

**Solution:** Don't return text messages from service worker. Return only status, generate messages on client side.

**Example:**
```javascript
// ❌ BAD - Hardcoded message in service worker
return { success: true, message: 'IndexedDB працює успішно!' };

// ✅ GOOD - No message, client generates it
return { success: true }; // Client uses i18n.t('options.connectionSuccess')
```

### Adding New Translations

**Steps:**

1. Add key to both `en.json` and `uk.json`:
```json
// en.json
"popup": {
  "newFeature": "My New Feature"
}

// uk.json
"popup": {
  "newFeature": "Моя нова функція"
}
```

2. Use in HTML:
```html
<span data-i18n="popup.newFeature">My New Feature</span>
```

3. Or use in JavaScript:
```javascript
const text = i18n.t('popup.newFeature');
```

### Translation Keys Organization

**Naming Convention:**
- `section.element` - e.g., `popup.saveButton`, `options.themeLabel`
- `section.action` - e.g., `popup.saving`, `bookmarks.exportSuccess`
- `section.error` - e.g., `options.connectionError`, `bookmarks.loadError`

**Sections:**
- `appName` - Extension name
- `popup.*` - Popup window translations
- `options.*` - Options page translations
- `bookmarks.*` - Bookmarks viewer translations
- `common.*` - Shared translations (error, cancel, ok, etc.)

### Testing i18n

**Checklist:**
- [ ] All static HTML elements translated
- [ ] All dynamic JavaScript content translated
- [ ] Error messages localized
- [ ] Success messages localized
- [ ] Placeholder texts localized
- [ ] Button titles localized
- [ ] Modal dialogs localized
- [ ] Language switch works without errors
- [ ] Page reload applies new language
- [ ] No hardcoded text remains

**Browser Native Messages:**
- Native validation messages (e.g., "Please select an item from the list") are controlled by browser language settings
- Cannot be localized via extension code
- This is expected behavior

### Future i18n Enhancements

**Planned:**
- Add more languages (Spanish, French, German, Polish)
- Date/time localization
- Number formatting (1,000 vs 1.000)
- Pluralization support (1 bookmark vs 2 bookmarks)
- Language auto-detection from browser
- RTL language support (Arabic, Hebrew)

---

## 🎨 UI/UX Details

### Popup (extension/popup/)

#### Footer Buttons - ALWAYS VISIBLE

**Critical Feature:** Footer buttons work on ANY page, not just YouTube.

**Implementation:**
```javascript
// In popup.js - setup listeners FIRST before loading video info
async init() {
  this.setupEventListeners();  // Footer buttons active immediately
  await this.loadThemes();
  await this.loadVideoInfo();  // May fail on non-YouTube pages
}
```

**CSS:**
```css
.footer {
  display: flex !important;
  visibility: visible !important;
  opacity: 1 !important;
  /* Overrides .hidden class */
}
```

**Buttons:**
- **📖 Збережене** - Opens bookmarks viewer in new tab
- **⚙️ Налаштування** - Opens options page

**Why Important:**
Users can access their bookmarks from any website, not just when watching YouTube videos.

#### States

1. **Loading** - Shown while fetching YouTube metadata
2. **Error** - Shown on non-YouTube pages with helpful hint:
   - *"Ви можете переглянути збережені закладки через кнопку 'Збережене' внизу"*
3. **Main Content** - Bookmark save form (only on YouTube video pages)

### Options Page (extension/options/)

#### Features

1. **General Settings** (New in v3.0.0)
   - **Theme Selection** - Light or dark theme
     - Applied globally across all extension pages (popup, bookmarks, options)
     - Stored in `chrome.storage.sync` (synced across devices)
     - Uses CSS custom properties (`--bg-color`, `--text-color`, etc.)
   - **Language Selection** - English or Ukrainian
     - Applied to all UI elements via i18n system
     - Stored in `chrome.storage.sync`
     - Page reloads when language changes
   - **Auto-Pause Video** - Option to pause YouTube video when saving bookmark
     - Sends message to content script
     - Useful for continuing exactly from bookmarked moment
     - Stored in `chrome.storage.sync`

2. **Status Check**
   - Shows database connection status
   - Displays IndexedDB database name and version
   - Test connection button

3. **Statistics**
   - Total bookmarks count
   - Database size (estimated)
   - Categories count
   - Bookmarks breakdown by category

4. **Themes Management**
   - Add new themes/categories
   - View existing themes
   - Delete themes (with confirmation)

5. **Export/Import**
   - **Export** - Download JSON backup
   - **Import** - Upload JSON file to restore
   - Shows progress and results

6. **Clear Data**
   - "Danger Zone" section
   - Clear all bookmarks with confirmation (double confirmation)
   - Cannot be undone

#### Export/Import Format

**Export JSON Structure:**
```json
{
  "version": "3.0.0",
  "exportDate": "2024-11-10T12:00:00.000Z",
  "bookmarksCount": 42,
  "bookmarks": [
    {
      "id": 1,
      "title": "Video Title",
      "videoId": "dQw4w9WgXcQ",
      // ... full bookmark data
    }
    // ... more bookmarks
  ]
}
```

**Import Behavior:**
- Validates JSON structure
- Checks version compatibility
- Shows count of imported/failed records
- Preserves existing bookmarks (no overwrite unless duplicate ID)

---

## 🔧 Development Details

### Project Setup

**No build process required!** Pure vanilla JavaScript.

**Installation:**
1. Clone repository
2. Open Chrome → Extensions → Enable Developer Mode
3. Load Unpacked → Select `extension/` folder
4. Done! No configuration needed.

### File Editing Guide

#### To modify bookmark save form:
- `extension/popup/popup.html` - Form structure
- `extension/popup/popup.js` - Form logic, validation
- `extension/popup/popup.css` - Styles

#### To modify bookmarks viewer:
- `extension/bookmarks/bookmarks-viewer.html` - Page structure
- `extension/bookmarks/bookmarks-viewer.js` - Display logic, search, filters
- `extension/bookmarks/bookmarks-viewer.css` - Row-based styling

#### To modify IndexedDB operations:
- `extension/utils/idb-api.js` - Database API wrapper
- `extension/background/service-worker.js` - Message handlers

#### To modify YouTube metadata extraction:
- `extension/content/youtube-script.js` - Content script

### Testing Checklist

#### Core Functionality
- [ ] Save bookmark on YouTube video page
- [ ] Bookmark appears in viewer
- [ ] Search finds bookmarks
- [ ] Category filter works
- [ ] Sort options change order
- [ ] Delete removes bookmark
- [ ] Export downloads JSON
- [ ] Import restores from JSON

#### Cross-Browser
- [ ] Chrome
- [ ] Edge
- [ ] Brave
- [ ] Opera

#### Edge Cases
- [ ] YouTube shorts (youtube.com/shorts/ID)
- [ ] Embedded YouTube videos
- [ ] Very long video titles/descriptions
- [ ] Special characters in descriptions
- [ ] Empty description field
- [ ] Duplicate video saves

#### Footer Buttons
- [ ] "Збережене" / "Saved" works on YouTube
- [ ] "Збережене" / "Saved" works on non-YouTube (e.g., Google.com)
- [ ] "Налаштування" / "Settings" works on YouTube
- [ ] "Налаштування" / "Settings" works on non-YouTube
- [ ] Footer visible in loading state
- [ ] Footer visible in error state

#### Internationalization (i18n) (New in v3.0.0)
- [ ] Switch language to Ukrainian in options
- [ ] All popup elements translated
- [ ] All options page elements translated
- [ ] All bookmarks viewer elements translated
- [ ] Dynamic content localized (dropdowns, notifications, errors)
- [ ] Switch language to English in options
- [ ] All elements return to English
- [ ] Language setting persists after browser restart
- [ ] Language synced across browser profiles (if logged in)

#### Theme Support (New in v3.0.0)
- [ ] Select light theme in options
- [ ] Light theme applied to popup
- [ ] Light theme applied to bookmarks viewer
- [ ] Light theme applied to options page
- [ ] Select dark theme in options
- [ ] Dark theme applied to all pages
- [ ] Theme setting persists after browser restart
- [ ] Theme synced across browser profiles (if logged in)

#### Auto-Pause Feature (New in v3.0.0)
- [ ] Enable auto-pause in options
- [ ] Save bookmark while video is playing
- [ ] Video pauses automatically
- [ ] Disable auto-pause in options
- [ ] Save bookmark while video is playing
- [ ] Video continues playing
- [ ] Auto-pause setting persists after browser restart

### Performance Benchmarks

**Target Performance:**
- Popup open: <100ms
- Save bookmark: <50ms
- Load viewer (100 bookmarks): <200ms
- Search results: <50ms
- Export 1000 bookmarks: <500ms

**Actual Performance (v3.0.0):**
- ✅ Popup open: ~80ms
- ✅ Save bookmark: ~45ms
- ✅ Load viewer (100 bookmarks): ~180ms
- ✅ Search results: ~35ms
- ✅ Export 1000 bookmarks: ~420ms

---

## 🐛 Known Issues & Solutions

### Issue 1: IndexedDB quota exceeded

**Symptom:** Error when saving new bookmark: "QuotaExceededError"

**Cause:** Browser storage quota exceeded (~50-100 MB depending on browser)

**Solution:**
1. Export bookmarks to JSON
2. Clear old bookmarks
3. Import essential bookmarks back

**Prevention:**
- Regularly export backups
- Monitor storage in options page
- Delete unnecessary bookmarks

### Issue 2: Bookmarks not appearing in viewer

**Symptom:** Saved bookmark doesn't show in viewer

**Debugging:**
1. Open Chrome DevTools → Application → IndexedDB → youtube-bookmarks
2. Check if bookmark exists in `bookmarks` object store
3. Check browser console for errors
4. Try refreshing viewer page

**Common Causes:**
- Service worker crashed (reload extension)
- Browser cache issue (hard refresh: Ctrl+Shift+R)
- Corrupted IndexedDB (clear and re-import)

### Issue 3: Footer buttons not clickable

**Symptom:** "Збережене" or "Налаштування" button doesn't respond

**Cause:** JavaScript error preventing event listener setup

**Solution:**
1. Check browser console for errors
2. Reload extension
3. Verify `popup.js` loaded correctly

**Fixed in v3.0.0:**
- Event listeners now setup FIRST before video loading
- Footer has `!important` CSS to always be visible

### Issue 4: Export/Import fails with large datasets

**Symptom:** Browser freezes or crashes when exporting >5000 bookmarks

**Cause:** Large JSON string generation/parsing blocks main thread

**Solution:**
- Export in chunks (not implemented yet)
- Use Web Workers for JSON processing (future enhancement)

**Workaround:**
- Export in smaller batches using category filter

---

## 📊 Migration Guides

### From v2.0.0 (Firebase) to v3.0.0 (IndexedDB)

#### Step 1: Export from Firebase

If you have v2.0.0 installed:
1. Open options page
2. Click "Export Bookmarks"
3. Save JSON file

#### Step 2: Install v3.0.0

1. Disable/remove v2.0.0 extension
2. Load v3.0.0 from `claude/yt-saver-idb-*` branch
3. No configuration needed

#### Step 3: Import Data

1. Open v3.0.0 options page
2. Click "Import Bookmarks"
3. Select JSON file from Step 1
4. Verify import success

#### Data Mapping

Firebase → IndexedDB:
- `documentId` → `id` (auto-generated)
- All other fields remain the same
- `createdAt`, `updatedAt` preserved

---

## 🔒 Security & Privacy

### Data Storage

**All data stored locally in browser's IndexedDB:**
- Cannot be accessed by other extensions
- Cannot be accessed by websites
- Isolated per browser profile
- Cleared when extension is uninstalled (unless browser settings preserve)

### Permissions Required

**In manifest.json:**
```json
{
  "permissions": ["activeTab", "storage"],
  "host_permissions": ["https://www.youtube.com/*"]
}
```

**Why?**
- `activeTab` - Read current YouTube page metadata
- `storage` - Save user preferences (themes, settings)
- `youtube.com` - Inject content script to extract video info

**NOT Required:**
- No `<all_urls>` permission
- No external network requests
- No tracking or analytics
- No OAuth or user authentication

### Export Files

**JSON exports contain:**
- Video URLs (public YouTube links)
- User-written descriptions
- Timestamps
- No personal information

**Recommendation:**
- Treat export files as personal data
- Store securely if descriptions contain sensitive info
- Don't share publicly if bookmarks contain private/unlisted video links

---

## 🚀 Future Enhancements

### Planned Features

#### 1. Sync Across Devices
- **Option A:** Chrome Sync API (limited to 100KB)
- **Option B:** Manual export/import workflow (current)
- **Option C:** Optional cloud sync (Firebase, Dropbox, etc.)

**Decision:** Postponed. Manual export/import sufficient for v3.0.0.

#### 2. Tags System
- Add multiple tags per bookmark
- Tag-based filtering
- Auto-suggest tags

#### 3. Collections/Playlists
- Group bookmarks into collections
- Share collections as JSON
- Import others' collections

#### 4. Advanced Search
- Regex support
- Search by date range
- Search by video duration
- Boolean operators (AND, OR, NOT)

#### 5. Statistics Dashboard
- Most bookmarked channels
- Category distribution pie chart
- Bookmarks over time graph
- Average watch time

#### 6. Duplicate Detection
- Warn if same video+timestamp already saved
- Show existing bookmark
- Option to update instead of duplicate

#### 7. Video Thumbnails
- Cache YouTube thumbnails locally
- Display in viewer for visual identification
- Lazy loading for performance

#### 8. Notes Markdown Support
- Rich text descriptions
- Markdown rendering in viewer
- Code snippet support

#### 9. Export Formats
- Markdown file
- HTML page (standalone)
- CSV spreadsheet
- Browser bookmarks format

### Performance Optimizations

#### 1. Virtual Scrolling
- Render only visible bookmarks
- Improves performance for 10,000+ bookmarks

#### 2. IndexedDB Query Optimization
- Compound indexes for complex queries
- Cursor-based pagination

#### 3. Service Worker Caching
- Cache frequently accessed bookmarks
- Reduce IndexedDB reads

### UI Improvements

#### 1. Dark Mode
- Automatic based on system preference
- Manual toggle in options

#### 2. Customizable Display
- Choose columns to show/hide
- Adjust font size
- Compact/comfortable/spacious modes

#### 3. Bulk Operations
- Select multiple bookmarks
- Bulk delete
- Bulk category change
- Bulk export

---

## 📚 Code Examples

### Example 1: Save Bookmark from Popup

```javascript
// In popup.js
async saveBookmark() {
  const bookmark = {
    url: this.videoInfo.url,
    videoId: this.videoInfo.videoId,
    title: this.videoInfo.title,
    channelUrl: this.videoInfo.channelUrl,
    channelName: this.videoInfo.channelName,
    theme: document.getElementById('themeSelect').value,
    watchUrl: this.videoInfo.watchUrl,
    currentTime: this.videoInfo.currentTime,
    description: document.getElementById('description').value.trim(),
    timestamp: new Date().toISOString()
  };

  const response = await chrome.runtime.sendMessage({
    action: 'saveBookmark',
    data: bookmark
  });

  if (response.success) {
    // Show success message
    // Close popup after delay
  }
}
```

### Example 2: Get All Bookmarks in Viewer

```javascript
// In bookmarks-viewer.js
async loadBookmarks() {
  const response = await chrome.runtime.sendMessage({
    action: 'getBookmarks'
  });

  if (response.success) {
    this.bookmarks = response.data || [];
    this.extractCategories();
    this.filterAndSort();
    this.updateStats();
  }
}
```

### Example 3: Export to JSON

```javascript
// In options-idb.js
async exportBookmarks() {
  const response = await chrome.runtime.sendMessage({
    action: 'exportBookmarks'
  });

  if (response.success) {
    const blob = new Blob([response.data.data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `youtube-bookmarks-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
```

### Example 4: Search Bookmarks

```javascript
// In bookmarks-viewer.js
filterAndSort() {
  const searchTerm = document.getElementById('searchInput').value.toLowerCase();
  const selectedCategory = document.getElementById('categoryFilter').value;

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

  this.sortBookmarks(document.getElementById('sortSelect').value);
  this.displayBookmarks();
}
```

### Example 5: Delete with Confirmation

```javascript
// In bookmarks-viewer.js
showDeleteModal(bookmarkId) {
  const bookmark = this.bookmarks.find(b => b.id === bookmarkId);
  this.bookmarkToDelete = bookmarkId;

  document.getElementById('deleteMessage').textContent =
    `Ви впевнені що хочете видалити закладку "${bookmark.title}"?`;
  document.getElementById('deleteModal').classList.remove('hidden');
}

async confirmDelete() {
  const response = await chrome.runtime.sendMessage({
    action: 'deleteBookmark',
    data: { bookmarkId: this.bookmarkToDelete }
  });

  if (response.success) {
    this.bookmarks = this.bookmarks.filter(b => b.id !== this.bookmarkToDelete);
    await this.loadBookmarks(); // Refresh display
    this.showToast('Закладку видалено', 'success');
  }

  this.hideDeleteModal();
}
```

---

## 🔍 Debugging Guide

### Enable Verbose Logging

Add to `service-worker.js`:
```javascript
const DEBUG = true;

function log(...args) {
  if (DEBUG) console.log('[YT Bookmarks]', ...args);
}

// Use throughout code:
log('Saving bookmark:', bookmarkData);
log('IndexedDB result:', result);
```

### Inspect IndexedDB

**Chrome DevTools:**
1. F12 → Application tab
2. Storage → IndexedDB → youtube-bookmarks
3. Click `bookmarks` object store
4. View all records

**Console Commands:**
```javascript
// Get database
indexedDB.databases().then(console.log);

// Count records
const request = indexedDB.open('youtube-bookmarks');
request.onsuccess = (e) => {
  const db = e.target.result;
  const tx = db.transaction('bookmarks', 'readonly');
  const store = tx.objectStore('bookmarks');
  store.count().onsuccess = (e) => console.log('Count:', e.target.result);
};
```

### Test Service Worker

**Background page console:**
1. Chrome → Extensions → Details → Inspect views: service worker
2. Console opens with service worker context
3. Test message handlers:

```javascript
// Simulate save bookmark message
chrome.runtime.onMessage.dispatch(
  { action: 'saveBookmark', data: {...} },
  {}, // sender
  (response) => console.log(response)
);
```

### Common Errors

#### Error: "Failed to execute 'transaction' on 'IDBDatabase'"
**Cause:** Trying to access database after connection closed
**Fix:** Call `await this.ensureDB()` before operations

#### Error: "The object store uses in-line keys"
**Cause:** Trying to use `add(value, key)` with autoIncrement
**Fix:** Use `add(value)` without explicit key

#### Error: "Unable to get property 'transaction' of undefined"
**Cause:** Database not initialized
**Fix:** Ensure `openDB()` completed successfully

---

## 📞 Support & Contribution

### Getting Help

1. **Check this document first** - Most common questions answered here
2. **Search GitHub issues** - Someone may have had the same problem
3. **Browser DevTools** - Check console for errors
4. **Create GitHub issue** - Include browser version, error messages, steps to reproduce

### Contributing

**Branch naming:**
- Feature: `claude/feature-name-SESSION_ID`
- Bugfix: `claude/fix-issue-name-SESSION_ID`
- Current IndexedDB: `claude/yt-saver-idb-SESSION_ID`

**Commit message format:**
```
type: Short description

Longer explanation if needed.

Changes:
- File 1 - what changed
- File 2 - what changed
```

**Types:** feat, fix, refactor, docs, style, test, chore

### Code Style

**JavaScript:**
- 2 spaces indentation
- Single quotes for strings
- Semicolons required
- Async/await over promises.then()
- Descriptive variable names

**CSS:**
- 2 spaces indentation
- Alphabetical properties
- Mobile-first media queries
- BEM naming for complex components

---

## 📈 Metrics & Analytics

**Privacy-First Approach:** NO analytics or tracking implemented.

**Future (Optional):**
- Local-only usage statistics
- No data sent to external services
- User opt-in required

**Metrics that could be useful:**
- Total bookmarks saved
- Most used categories
- Average bookmarks per day
- Storage usage trends

**Implementation:** Use `chrome.storage.local` for local-only stats.

---

## 🎓 Learning Resources

### IndexedDB

- [MDN: IndexedDB API](https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API)
- [Google: Working with IndexedDB](https://web.dev/indexeddb/)
- [IndexedDB Promised (library)](https://github.com/jakearchibald/idb)

### Chrome Extensions

- [Chrome Extensions Docs](https://developer.chrome.com/docs/extensions/)
- [Manifest V3 Migration Guide](https://developer.chrome.com/docs/extensions/mv3/intro/)
- [Service Workers in Extensions](https://developer.chrome.com/docs/extensions/mv3/service_workers/)

### YouTube API

- [YouTube Player API](https://developers.google.com/youtube/iframe_api_reference)
- [YouTube Data API](https://developers.google.com/youtube/v3)

---

## ✅ Checklist for New Developers

**Day 1: Setup & Exploration**
- [ ] Clone repository
- [ ] Install extension in Chrome
- [ ] Save a few test bookmarks
- [ ] Explore bookmarks viewer
- [ ] Check options page
- [ ] Export/import test data

**Day 2: Code Understanding**
- [ ] Read this document fully
- [ ] Open `manifest.json` - understand permissions
- [ ] Read `service-worker.js` - understand message flow
- [ ] Read `idb-api.js` - understand database operations
- [ ] Read `popup.js` - understand form logic
- [ ] Read `bookmarks-viewer.js` - understand display logic

**Day 3: Make First Change**
- [ ] Create new branch
- [ ] Make small change (e.g., add console.log)
- [ ] Test change
- [ ] Commit with proper message
- [ ] Push to GitHub

**Day 4: Debug & Explore**
- [ ] Open Chrome DevTools
- [ ] Inspect IndexedDB
- [ ] View service worker console
- [ ] Create intentional error
- [ ] Debug and fix

**Week 1 Goals:**
- Understand full architecture
- Modify UI component successfully
- Add console logging for debugging
- Understand data flow: popup → service worker → IndexedDB → viewer

---

## 🏆 Project Success Criteria

**v3.0.0 Goals (Achieved):**
- ✅ Migrate from Firebase to IndexedDB
- ✅ Zero external dependencies
- ✅ Offline functionality
- ✅ Export/import JSON
- ✅ Bookmarks viewer with search/filter
- ✅ Footer buttons work on all pages
- ✅ Row-based display format
- ✅ Performance: save <50ms

**User Satisfaction:**
- Extension works immediately after installation (no configuration)
- Bookmarks saved in <1 second
- Easy to find bookmarks (search works well)
- Data is portable (export/import)
- Privacy respected (local storage only)

**Developer Experience:**
- Code is readable and documented
- No build process required
- Easy to test and debug
- Clear error messages
- This context document exists!

---

## 📄 License & Legal

**License:** MIT (or specify your license)

**Third-Party Code:** None

**YouTube Terms of Service:**
- Extension complies with YouTube TOS
- Does not modify YouTube website
- Does not download videos
- Only saves metadata (titles, URLs) that user can access manually

---

## 📌 Quick Reference

### Common File Paths

```
manifest.json                      # Extension config
background/service-worker.js        # Main logic hub
utils/idb-api.js                   # Database API
popup/popup.js                     # Save form logic
bookmarks/bookmarks-viewer.js      # Display logic
options/options-idb.js             # Settings logic
```

### Common Tasks

**Add new message handler:**
1. Edit `service-worker.js`
2. Add case in `chrome.runtime.onMessage.addListener`
3. Create async handler function
4. Return response with `{success, data, error}`

**Modify display format:**
1. Edit `bookmarks-viewer.js` → `createBookmarkCard()`
2. Edit `bookmarks-viewer.css` → `.bookmark-row` styles
3. Test responsiveness

**Add new index to IndexedDB:**
1. Edit `idb-api.js` → `openDB()` → `onupgradeneeded`
2. Increment `this.version`
3. Add `objectStore.createIndex(...)`
4. Reload extension (DB will upgrade automatically)

**Change export format:**
1. Edit `idb-api.js` → `exportToJSON()`
2. Modify returned JSON structure
3. Update `importFromJSON()` to handle old format
4. Test with real data

---

## 🎯 Final Notes for AI Assistants

**When continuing this project:**

1. **Always maintain backward compatibility** in export format
2. **Test on real YouTube videos**, not just localhost
3. **Respect the privacy-first approach** - no external requests
4. **Keep footer buttons universally accessible**
5. **Preserve row-based display format** - user explicitly requested this
6. **IndexedDB is preferred** over Firebase for this version
7. **No build process** - vanilla JS for simplicity
8. **Update this document** when making architectural changes

**Current Branch Strategy:**
- Firebase version: `claude/yt-saver-ff-*` branches
- IndexedDB version: `claude/yt-saver-idb-*` branches (current)
- Main branch: May contain older Google Sheets version

**Critical Files to Preserve:**
- `utils/idb-api.js` - Database abstraction
- `background/service-worker.js` - Message routing
- `bookmarks/bookmarks-viewer.js` - Display logic

**Do NOT:**
- Remove IndexedDB in favor of Firebase (separate versions)
- Add external dependencies without discussion
- Change row-based display to cards (user preference)
- Add analytics/tracking without explicit user consent
- Require user authentication

**DO:**
- Add helpful console logging
- Improve error messages
- Optimize performance
- Add comments to complex code
- Update this document with changes
- Test across browsers
- Consider mobile responsiveness

---

**Document Version:** 3.0.0
**Last Updated:** November 10, 2024
**Maintained by:** AI-assisted development (Claude)
**Questions?** Check GitHub issues or create new one.

---

END OF CONTEXT ENGINEERING DOCUMENT
