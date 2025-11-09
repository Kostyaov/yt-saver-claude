# Architecture Documentation

**Project:** YouTube Bookmarks Saver (Firebase Edition)
**Version:** 2.0.0
**Last Updated:** November 9, 2024

---

## 📐 System Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        User Browser                          │
│                                                              │
│  ┌────────────────┐      ┌──────────────────┐             │
│  │  YouTube Page  │      │  Extension Icon  │             │
│  │                │      │    (Popup)       │             │
│  │  [Watch Video] │◄────►│  [Save Form]     │             │
│  │                │      │                  │             │
│  └────────┬───────┘      └────────┬─────────┘             │
│           │                       │                        │
│           │ Extract Metadata      │ Save Request          │
│           ▼                       ▼                        │
│  ┌────────────────┐      ┌──────────────────┐             │
│  │Content Script  │      │  Service Worker  │             │
│  │(youtube-script)│      │ + Firebase API   │             │
│  └────────────────┘      └────────┬─────────┘             │
│                                   │                        │
└───────────────────────────────────┼────────────────────────┘
                                    │
                                    │ HTTPS REST API
                                    ▼
                          ┌─────────────────────┐
                          │  Firebase Firestore │
                          │                     │
                          │  Collection:        │
                          │    bookmarks/       │
                          │      - doc1         │
                          │      - doc2         │
                          │      - doc3         │
                          └─────────────────────┘
```

---

## 🏛️ Component Architecture

### 1. Manifest V3 Extension Structure

**Manifest.json** - Extension configuration
- Defines permissions, background service worker, content scripts
- No OAuth configuration (unlike v1.0)
- Host permissions for YouTube and Firestore

### 2. Background Service Worker

**File:** `extension/background/service-worker.js`

**Responsibilities:**
- Firebase configuration management (embedded)
- Firestore REST API communication
- Message handling from popup/content scripts
- Data persistence and retrieval
- Statistics aggregation

**Architecture Pattern:** Service Layer
- Handles all business logic
- Single point of Firebase communication
- Stateless request handling

**Key Components:**
```javascript
// 1. Configuration (lines 4-12)
FIREBASE_CONFIG = { ... }

// 2. API Client (lines 14-289)
class FirebaseAPI { ... }

// 3. Message Handlers (lines 291-472)
handleSaveBookmark()
handleTestConnection()
handleGetBookmarks()
handleGetStats()
handleDeleteBookmark()

// 4. Chrome Extension Listeners
chrome.runtime.onMessage.addListener()
chrome.commands.onCommand.addListener()
chrome.runtime.onInstalled.addListener()
```

### 3. Content Script

**File:** `extension/content/youtube-script.js`

**Responsibilities:**
- Run on every YouTube watch page
- Extract video metadata from DOM
- Auto-expand video description
- Get current playback timestamp
- Extract channel information

**Execution Context:** Isolated from page scripts, has DOM access

**DOM Selectors Used:**
```javascript
// Video title
'h1.ytd-video-primary-info-renderer yt-formatted-string'

// Channel name & URL
'ytd-channel-name a'

// Video description
'#description-inner'

// Expand button
'#expand'

// Video player
'video'
```

**Critical Functions:**
```javascript
getVideoInfo()          // Main extraction function
getVideoDescription()   // Auto-expand + extract
formatTimestamp()       // Convert seconds to MM:SS
```

### 4. Popup UI

**Files:**
- `extension/popup/popup.html` - Structure
- `extension/popup/popup.js` - Logic
- `extension/popup/popup.css` - Styles

**Responsibilities:**
- Display save bookmark form
- Show video preview information
- Theme/category selection
- User description input
- Communicate with service worker
- Show success/error notifications

**UI States:**
1. **Loading:** Fetching video info from content script
2. **Ready:** Form ready for input
3. **Saving:** Submitting to Firebase
4. **Success:** Bookmark saved
5. **Error:** Display error message

**Communication Flow:**
```javascript
Popup → Content Script (getVideoInfo)
Content Script → Popup (video data)
Popup → Service Worker (saveBookmark)
Service Worker → Firebase (POST /bookmarks)
Service Worker → Popup (success/error)
Popup → User (notification)
```

### 5. Options Page

**Files:**
- `extension/options/options-firebase.html` - Structure
- `extension/options/options-firebase.js` - Logic
- `extension/options/options.css` - Styles

**Responsibilities:**
- Display Firebase connection status
- Test Firebase connectivity
- Show bookmark statistics
- Manage themes/categories
- Display setup instructions

**Data Sources:**
- Chrome Storage (themes)
- Firebase Firestore (statistics, bookmarks count)

---

## 🔄 Data Flow Diagrams

### Saving a Bookmark

```
┌──────────┐
│  USER    │ Opens YouTube video, clicks extension icon
└────┬─────┘
     │
     ▼
┌──────────────────┐
│  Popup Opens     │ Shows loading state
└────┬─────────────┘
     │
     │ sendMessage({action: 'getVideoInfo'})
     ▼
┌──────────────────┐
│ Content Script   │ Extracts metadata from YouTube DOM
└────┬─────────────┘
     │
     │ Returns: {title, videoId, channelName, currentTime, ...}
     ▼
┌──────────────────┐
│  Popup           │ Displays video info, shows form
└────┬─────────────┘
     │
     │ User fills: theme, description
     │ User clicks "Save"
     ▼
┌──────────────────┐
│  Popup.js        │ Validates input, prepares data
└────┬─────────────┘
     │
     │ sendMessage({action: 'saveBookmark', data: {...}})
     ▼
┌──────────────────┐
│ Service Worker   │ handleSaveBookmark()
└────┬─────────────┘
     │
     │ 1. Check Firebase config
     │ 2. Create FirebaseAPI instance
     │ 3. Format document
     ▼
┌──────────────────┐
│  FirebaseAPI     │ addBookmark()
└────┬─────────────┘
     │
     │ POST https://firestore.googleapis.com/v1/...
     │ Body: {fields: {...}}
     ▼
┌──────────────────┐
│  Firebase        │ Validates, stores document
│  Firestore       │ Returns: {name: "projects/.../documents/bookmarks/abc123"}
└────┬─────────────┘
     │
     │ Success response
     ▼
┌──────────────────┐
│ Service Worker   │ Returns {success: true, bookmarkId: "abc123"}
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│  Popup           │ Shows success notification
└────┬─────────────┘
     │
     ▼
┌──────────┐
│  USER    │ Sees "Bookmark saved!" message
└──────────┘
```

### Testing Firebase Connection

```
┌──────────┐
│  USER    │ Opens Options page
└────┬─────┘
     │
     ▼
┌──────────────────┐
│ Options Page     │ Loads, displays status
└────┬─────────────┘
     │
     │ checkFirebaseStatus()
     ▼
┌──────────────────┐
│ Options.js       │ Checks chrome.storage.firebaseConfigured
└────┬─────────────┘
     │
     │ User clicks "Test Connection"
     ▼
┌──────────────────┐
│ Options.js       │ sendMessage({action: 'testFirebaseConnection'})
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Service Worker   │ handleTestConnection()
└────┬─────────────┘
     │
     │ 1. Check FIREBASE_CONFIG validity
     │ 2. Create FirebaseAPI instance
     │ 3. Call testConnection()
     ▼
┌──────────────────┐
│  FirebaseAPI     │ testConnection() → getAllBookmarks()
└────┬─────────────┘
     │
     │ GET https://firestore.googleapis.com/v1/.../bookmarks
     ▼
┌──────────────────┐
│  Firebase        │ Returns list of documents (or empty array)
│  Firestore       │
└────┬─────────────┘
     │
     │ Success (200 OK)
     ▼
┌──────────────────┐
│ Service Worker   │ Returns {success: true, message: "З'єднання успішне"}
└────┬─────────────┘
     │
     ▼
┌──────────────────┐
│ Options Page     │ Shows success notification, updates status
└────┬─────────────┘
     │
     ▼
┌──────────┐
│  USER    │ Sees green checkmark and success message
└──────────┘
```

---

## 🗄️ Data Architecture

### Chrome Storage (Local/Sync)

**Storage Type:** `chrome.storage.sync`

**Schema:**
```javascript
{
  themes: string[],              // ["Python", "Arduino", "JavaScript"]
  firebaseConfigured: boolean    // true if Firebase connection successful
}
```

**Usage:**
- Themes: User's custom categories
- firebaseConfigured: Flag for showing setup prompts

### Firestore Document Structure

**Collection:** `bookmarks`

**Document Schema:**
```javascript
{
  fields: {
    // Core video data
    title: { stringValue: string },
    videoId: { stringValue: string },
    videoUrl: { stringValue: string },
    watchUrl: { stringValue: string },  // youtu.be with timestamp

    // Timing
    currentTime: { integerValue: number },

    // Channel
    channelName: { stringValue: string },
    channelUrl: { stringValue: string },

    // User input
    category: { stringValue: string },
    description: { stringValue: string },

    // Metadata
    createdAt: { timestampValue: ISO8601 string },
    updatedAt: { timestampValue: ISO8601 string }
  }
}
```

**Indexes:** Default (createdAt for sorting)

**Queries Supported:**
- Get all bookmarks (ordered by createdAt desc)
- Get bookmarks by category (filtered + ordered)
- Get single bookmark by ID

---

## 🔐 Security Architecture

### Current Implementation (Development Mode)

**Firestore Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookmarks/{document=**} {
      allow read, write: if true;  // ⚠️ OPEN ACCESS
    }
  }
}
```

**Security Model:**
- Each user has their own Firebase project
- API key is personal (not shared)
- Data isolated by Firebase project
- No cross-user access concerns

**Limitations:**
- Anyone with API key can read/write
- No user authentication
- No data ownership validation

### Recommended Production Security

**1. Enable Firebase Authentication:**
```javascript
// In service worker
import { getAuth, signInWithCustomToken } from 'firebase/auth';
```

**2. Update Security Rules:**
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookmarks/{bookmarkId} {
      // Only authenticated users
      allow read, write: if request.auth != null;

      // Only owner can access their bookmarks
      allow read, write: if request.auth.uid == resource.data.userId;
    }
  }
}
```

**3. Add userId to documents:**
```javascript
{
  fields: {
    userId: { stringValue: request.auth.uid },
    // ... other fields
  }
}
```

---

## 🔌 API Architecture

### FirebaseAPI Class

**Design Pattern:** Repository Pattern
- Abstracts Firestore operations
- Single responsibility: Data access
- No business logic

**Methods:**

#### Data Operations
```javascript
// CREATE
async addBookmark(bookmarkData) → {id, ...data}

// READ
async getAllBookmarks() → Bookmark[]
async getBookmarksByCategory(category) → Bookmark[]

// DELETE
async deleteBookmark(bookmarkId) → boolean

// SEARCH
async searchBookmarks(searchTerm) → Bookmark[]
```

#### Utility Methods
```javascript
// Statistics
async getStats() → {totalBookmarks, totalCategories, categories: {}}
async getCategories() → string[]

// Testing
async testConnection() → boolean
static isConfigured(config) → boolean

// Parsing
parseDocument(firestoreDoc) → Object
```

### REST API Endpoints Used

**Base URL:** `https://firestore.googleapis.com/v1/projects/{projectId}/databases/(default)/documents`

**Endpoints:**

| Method | Endpoint | Purpose |
|--------|----------|---------|
| POST | `/bookmarks?key={apiKey}` | Create bookmark |
| GET | `/bookmarks?key={apiKey}&orderBy=createdAt desc` | List all |
| POST | `/:runQuery?key={apiKey}` | Structured query (filter by category) |
| DELETE | `/bookmarks/{docId}?key={apiKey}` | Delete bookmark |
| GET | `/bookmarks/{docId}?key={apiKey}` | Get single (not currently used) |

**Authentication:** API key in query parameter

**Request Format:**
```javascript
// POST /bookmarks
{
  "fields": {
    "title": { "stringValue": "Video Title" },
    "currentTime": { "integerValue": "91" }
  }
}
```

**Response Format:**
```javascript
{
  "name": "projects/.../databases/(default)/documents/bookmarks/abc123",
  "fields": { ... },
  "createTime": "2024-11-09T18:36:35.123Z",
  "updateTime": "2024-11-09T18:36:35.123Z"
}
```

---

## ⚡ Performance Architecture

### Optimization Strategies

**1. Minimal API Calls:**
- Cache themes in chrome.storage (no Firestore call)
- Batch statistics queries
- Client-side search for small datasets

**2. Service Worker Persistence:**
- Service worker stays alive during session
- No cold starts for bookmark saves

**3. Async/Await Pattern:**
- Non-blocking operations
- UI remains responsive

**4. REST API over SDK:**
- Smaller payload (no SDK overhead)
- Direct fetch() calls (fastest)
- No module loading time

### Performance Metrics

| Operation | Target | Actual |
|-----------|--------|--------|
| Extension startup | <100ms | ~50ms |
| Open popup | <200ms | ~100ms |
| Extract YouTube data | <500ms | ~300ms |
| Save bookmark | <1s | ~400ms |
| Load statistics | <2s | ~800ms |
| Test connection | <2s | ~600ms |

---

## 🧩 Extension Points

### Adding New Features

**1. New Bookmark Fields:**
- Update `FirebaseAPI.addBookmark()` document structure
- Update content script extraction
- Update popup form

**2. New Firestore Operations:**
- Add method to FirebaseAPI class
- Add message handler in service worker
- Call from popup/options

**3. New UI Components:**
- Add HTML in popup/options
- Add event listeners in JS
- Connect to existing service worker handlers

**4. New Statistics:**
- Extend `getStats()` method
- Update options page display

### Plugin Architecture Possibilities

**Future:** Could modularize as:
```javascript
// plugins/youtube-extractor.js
class YouTubeExtractor { ... }

// plugins/firebase-storage.js
class FirebaseStorage { ... }

// plugins/stats-calculator.js
class StatsCalculator { ... }
```

---

## 🚀 Deployment Architecture

### Current Deployment: Manual

**Steps:**
1. User clones repository
2. User edits `service-worker.js` lines 5-11 (Firebase config)
3. User loads unpacked extension in browser
4. User creates Firebase project + Firestore
5. Extension connects to user's Firebase

**Artifacts:**
- `extension/` directory (unpacked)
- No build step
- No distribution package

### Future Deployment Options

**Option 1: Chrome Web Store**
- Package extension as .crx
- Require users to provide Firebase config via UI
- Store config in chrome.storage (not in code)

**Option 2: Self-hosted with Build**
- Webpack/Rollup bundle
- Environment variable for Firebase config
- Automated build process

**Option 3: Template Approach**
- Provide setup script
- Script prompts for Firebase config
- Auto-generates configured extension

---

## 📊 Monitoring & Observability

### Current Logging

**Service Worker Console:**
```javascript
console.log('Extension installed')
console.log('Bookmark added with ID:', docId)
console.error('Error saving bookmark:', error)
```

**Popup Console:**
```javascript
console.error('Failed to get video info:', error)
```

**Content Script Console:**
```javascript
console.log('YouTube bookmarks content script loaded')
```

### Recommended Additions

**1. Structured Logging:**
```javascript
logger.info('bookmark_saved', { id, category, time: currentTime })
logger.error('firebase_error', { code, message, operation })
```

**2. Error Tracking:**
- Sentry integration
- Firebase Crashlytics

**3. Analytics:**
- Firebase Analytics
- Track: saves per day, popular categories, error rates

**4. Performance Monitoring:**
- Firebase Performance Monitoring
- Track: API latency, extension load time

---

## 🔬 Testing Architecture

### Current State: Manual Testing Only

**No automated tests exist.**

### Recommended Testing Strategy

**1. Unit Tests (Jest):**
```javascript
// test/firebase-api.test.js
describe('FirebaseAPI', () => {
  test('parseDocument converts Firestore format', () => {
    const firestoreDoc = { fields: { title: { stringValue: 'Test' }}};
    const result = api.parseDocument(firestoreDoc);
    expect(result.title).toBe('Test');
  });
});
```

**2. Integration Tests (Playwright):**
```javascript
// test/extension.test.js
test('save bookmark flow', async ({ page, extensionId }) => {
  await page.goto('https://youtube.com/watch?v=test');
  await page.click(`chrome-extension://${extensionId}/popup/popup.html`);
  // ... test full flow
});
```

**3. E2E Tests:**
- Load extension in test browser
- Navigate to YouTube
- Save bookmark
- Verify in Firebase (test project)

---

## 📝 Documentation Architecture

### Documentation Structure

```
Repository Root
├── README.md                    # Project overview
├── FIREBASE_SETUP.md           # User setup guide
├── TESTING_FIREBASE.md         # Testing guide
└── doc/
    ├── CONTEXT_ENGINEERING.md  # THIS FILE - AI context
    ├── ARCHITECTURE.md         # System architecture (YOU ARE HERE)
    ├── API_REFERENCE.md        # FirebaseAPI documentation
    ├── DATA_MODEL.md           # Firestore schema
    ├── DEPLOYMENT.md           # Deployment guide
    └── TROUBLESHOOTING_FIREBASE.md  # Common issues
```

### Documentation Philosophy

- **Context-first:** AI assistants need full context
- **Example-driven:** Show code examples, not just descriptions
- **Decision-recorded:** Document WHY, not just WHAT
- **User-focused:** Separate user docs from dev docs

---

## 🎯 Design Principles

### 1. Simplicity Over Features
- Vanilla JS (no frameworks)
- No build process
- Direct API calls (no SDK)

### 2. Reliability Over Elegance
- Embedded config (reliable) vs. imported (elegant but flaky)
- REST API (simple) vs. SDK (powerful but complex)

### 3. User Privacy
- Personal Firebase projects (no shared backend)
- No telemetry by default
- Open source (auditable)

### 4. Developer Experience
- Clear error messages
- Comprehensive logging
- Extensive documentation

---

**Last Updated:** November 9, 2024
**Maintained By:** Project team
**Next Review:** When adding major features
