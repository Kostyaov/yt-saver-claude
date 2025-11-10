# 📚 YouTube Bookmarks Saver (Local Storage Edition)

**Version:** 3.0.0
**Storage:** IndexedDB (Local)
**Status:** ✅ Production Ready

---

## 🎯 Overview

Browser extension for Chrome/Edge/Brave/Opera that saves YouTube video bookmarks with precise timestamps to **local IndexedDB storage**. No cloud services, no configuration needed, complete privacy.

## ✨ Key Features

- ✅ **Local Storage** - All data stored in browser's IndexedDB
- ✅ **Zero Configuration** - Works immediately after installation
- ✅ **Offline Support** - No internet connection required
- ✅ **Fast** - Save bookmarks in <50ms
- ✅ **Privacy First** - Data never leaves your device
- ✅ **Export/Import** - JSON format for backups
- ✅ **Search & Filter** - Find bookmarks quickly
- ✅ **Organize** - Group by categories/themes
- ✅ **Portable** - Easy data migration between devices

## 🚀 Quick Start

### Installation

1. Clone this repository
2. Open Chrome → Extensions → Enable Developer Mode
3. Click "Load Unpacked" → Select `extension/` folder
4. Done! No configuration needed.

### Usage

1. **Open any YouTube video**
2. **Press Ctrl+Shift+B** (or Cmd+Shift+B on Mac)
3. **Select category** and add optional description
4. **Click Save** - bookmark saved instantly!

### View Bookmarks

- Click extension icon → **"📖 Збережене"** button (available on any page)
- Or open `chrome-extension://[your-id]/bookmarks/bookmarks-viewer.html`

## 📦 What's Included

```
extension/
├── manifest.json              # Extension config v3.0.0
├── background/
│   └── service-worker.js      # Background logic
├── popup/
│   ├── popup.html/js/css      # Save bookmark form
├── bookmarks/
│   ├── bookmarks-viewer.html  # View all bookmarks
│   ├── bookmarks-viewer.js    # Search, filter, sort
│   └── bookmarks-viewer.css   # Row-based display
├── content/
│   └── youtube-script.js      # Extract YouTube metadata
├── options/
│   ├── options-idb.html/js    # Settings & export/import
│   └── options.css
└── utils/
    └── idb-api.js             # IndexedDB API wrapper

doc/
└── CONTEXT_ENGINEERING.md     # Full documentation (1200+ lines)
```

## 💾 Storage Details

**Technology:** IndexedDB
**Database:** `youtube-bookmarks`
**Storage Quota:** ~50-100 MB (browser-dependent)
**Performance:** <50ms save time, <100ms load 1000 bookmarks

**Data Structure:**
```json
{
  "id": 1,
  "title": "Video Title",
  "videoId": "dQw4w9WgXcQ",
  "videoUrl": "https://youtube.com/watch?v=...",
  "watchUrl": "https://youtube.com/watch?v=...&t=123s",
  "currentTime": 123,
  "channelName": "Channel Name",
  "channelUrl": "https://youtube.com/@channel",
  "category": "Programming",
  "description": "User notes...",
  "createdAt": "2024-11-10T12:00:00.000Z",
  "updatedAt": "2024-11-10T12:00:00.000Z"
}
```

## 🔧 Features

### Bookmarks Viewer
- **Search** - Real-time search across all fields
- **Filter** - By category dropdown
- **Sort** - Newest, oldest, by title, by category
- **Display** - Clean row format: `[description] [link] [delete]`
- **Export** - Download JSON backup
- **Delete** - With confirmation modal

### Options Page
- View database status
- Statistics (total bookmarks, categories)
- Export all bookmarks to JSON
- Import from JSON file
- Clear all data (danger zone)

### Popup
- Save form (YouTube pages only)
- Footer buttons **always accessible**:
  - 📖 **Збережене** - Open bookmarks viewer
  - ⚙️ **Налаштування** - Open options page

## 📖 Documentation

**Full documentation:** [`doc/CONTEXT_ENGINEERING.md`](doc/CONTEXT_ENGINEERING.md) (1200+ lines)

Includes:
- Architecture & tech stack
- IndexedDB schema & API
- UI/UX details
- Development guide
- Code examples
- Debugging guide
- Migration guides
- Performance benchmarks

## 🔒 Privacy & Security

**All data stored locally:**
- Cannot be accessed by other extensions
- Cannot be accessed by websites
- No external network requests
- No tracking or analytics
- No user authentication required

**Permissions:**
- `activeTab` - Read YouTube page metadata
- `storage` - Save user preferences
- `youtube.com` - Inject content script

## 📊 Version History

| Version | Storage | Status |
|---------|---------|--------|
| v3.0.0 | **IndexedDB (current)** | ✅ Active |
| v2.0.0 | Firebase Firestore | 🗑️ Removed |
| v1.0.0 | Google Sheets | 🗑️ Removed |

## 🚀 Future Enhancements

Planned features (see CONTEXT_ENGINEERING.md for full list):
- Tags system
- Collections/Playlists
- Statistics dashboard
- Dark mode
- Video thumbnails
- Markdown notes support
- Advanced search (regex, date range)
- Bulk operations
- Multiple export formats

## 🤝 Contributing

1. Create branch: `claude/feature-name-SESSION_ID`
2. Make changes
3. Test thoroughly
4. Commit: `type: description` (feat/fix/docs/refactor)
5. Push and create pull request

**Code Style:**
- JavaScript: 2 spaces, single quotes, semicolons
- CSS: 2 spaces, alphabetical properties
- Comments: Explain why, not what

## 📞 Support

- **Documentation:** Read `doc/CONTEXT_ENGINEERING.md`
- **Issues:** Check existing GitHub issues
- **Debug:** Chrome DevTools → Application → IndexedDB → youtube-bookmarks

## 📄 License

MIT License (or specify your license)

## 🙏 Acknowledgments

- Built for privacy-conscious users
- No external dependencies
- Pure vanilla JavaScript
- Works completely offline

---

**Current Branch:** `claude/yt-saver-idb-011CUvZj39HXCfeFq2nvhizf`
**Last Updated:** November 10, 2024
**Maintained by:** AI-assisted development

---

**Note:** This is the IndexedDB local storage version (v3.0.0). Previous versions using Firebase (v2.0.0) and Google Sheets (v1.0.0) have been removed.
