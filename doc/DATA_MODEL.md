# Data Model Documentation

**Project:** YouTube Bookmarks Saver (Firebase Edition)
**Version:** 2.0.0
**Last Updated:** November 9, 2024

---

## 📊 Overview

This document defines the complete data model for the YouTube Bookmarks Saver extension, including Firestore schema, Chrome Storage schema, and data transformation logic.

---

## 🔥 Firestore Data Model

### Collection: `bookmarks`

**Type:** Root-level collection

**Purpose:** Store all YouTube video bookmarks with metadata

### Document Schema

Each bookmark is stored as a Firestore document with the following structure:

#### Firestore REST API Format (Wire Format)

```javascript
{
  "name": "projects/{project}/databases/(default)/documents/bookmarks/{documentId}",
  "fields": {
    // === Core Video Data ===
    "title": {
      "stringValue": "Video title from YouTube"
    },
    "videoId": {
      "stringValue": "abc123def45"  // YouTube video ID (11 chars)
    },
    "videoUrl": {
      "stringValue": "https://www.youtube.com/watch?v=abc123def45"
    },
    "watchUrl": {
      "stringValue": "https://youtu.be/abc123def45?t=91"  // Timestamped short URL
    },

    // === Timing ===
    "currentTime": {
      "integerValue": "91"  // Seconds from video start (stored as string in Firestore)
    },

    // === Channel Information ===
    "channelName": {
      "stringValue": "Channel Name"
    },
    "channelUrl": {
      "stringValue": "https://www.youtube.com/@channelname"
    },

    // === User Input ===
    "category": {
      "stringValue": "Python"  // User-selected theme/category
    },
    "description": {
      "stringValue": "My notes about this video"  // Optional user notes
    },

    // === Metadata ===
    "createdAt": {
      "timestampValue": "2024-11-09T18:36:35.123456789Z"  // ISO 8601
    },
    "updatedAt": {
      "timestampValue": "2024-11-09T18:36:35.123456789Z"  // ISO 8601
    }
  },
  "createTime": "2024-11-09T18:36:35.123456789Z",
  "updateTime": "2024-11-09T18:36:35.123456789Z"
}
```

#### JavaScript Object Format (After Parsing)

```javascript
{
  id: "abc123",                  // Document ID (extracted from name field)
  title: "Video title",
  videoId: "abc123def45",
  videoUrl: "https://www.youtube.com/watch?v=abc123def45",
  watchUrl: "https://youtu.be/abc123def45?t=91",
  currentTime: 91,               // Parsed to number
  channelName: "Channel Name",
  channelUrl: "https://www.youtube.com/@channelname",
  category: "Python",
  description: "My notes",
  createdAt: "2024-11-09T18:36:35.123456789Z",
  updatedAt: "2024-11-09T18:36:35.123456789Z"
}
```

---

### Field Definitions

| Field | Type | Required | Max Length | Description |
|-------|------|----------|------------|-------------|
| `title` | string | ✅ | ~1000 | Video title from YouTube `<h1>` element |
| `videoId` | string | ✅ | 11 | YouTube video ID (e.g., "dQw4w9WgXcQ") |
| `videoUrl` | string | ✅ | ~100 | Full YouTube watch URL |
| `watchUrl` | string | ✅ | ~100 | Short timestamped URL (youtu.be) |
| `currentTime` | integer | ✅ | - | Timestamp in seconds (0 to video length) |
| `channelName` | string | ✅ | ~500 | Channel display name |
| `channelUrl` | string | ✅ | ~100 | Channel page URL |
| `category` | string | ✅ | ~100 | User's custom category/theme |
| `description` | string | ⬜ | ~500 | User's personal notes (optional) |
| `createdAt` | timestamp | ✅ | - | Auto-generated on creation |
| `updatedAt` | timestamp | ✅ | - | Auto-generated on creation/update |

---

### Field Validation Rules

#### title
- **Source:** YouTube page `<h1>` element
- **Validation:** Non-empty string
- **Examples:**
  - ✅ "Learn JavaScript in 10 Minutes"
  - ✅ "🔥 Hot Take on AI"
  - ❌ "" (empty)

#### videoId
- **Source:** Extracted from URL
- **Format:** 11-character alphanumeric string
- **Regex:** `^[a-zA-Z0-9_-]{11}$`
- **Examples:**
  - ✅ "dQw4w9WgXcQ"
  - ✅ "_2wf5RY980I"
  - ❌ "abc" (too short)
  - ❌ "12345678901234" (too long)

#### videoUrl
- **Source:** Browser URL bar
- **Format:** Full YouTube watch URL
- **Examples:**
  - ✅ "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
  - ✅ "https://www.youtube.com/watch?v=abc123&t=30s"

#### watchUrl
- **Source:** Generated from videoId + currentTime
- **Format:** `https://youtu.be/{videoId}?t={seconds}`
- **Purpose:** Short, shareable, timestamped link
- **Examples:**
  - ✅ "https://youtu.be/dQw4w9WgXcQ?t=0"
  - ✅ "https://youtu.be/dQw4w9WgXcQ?t=91"

#### currentTime
- **Source:** Video player `currentTime` property
- **Type:** Integer (seconds)
- **Range:** 0 to video duration
- **Examples:**
  - ✅ 0 (start)
  - ✅ 91 (1 minute 31 seconds)
  - ✅ 3661 (1 hour 1 minute 1 second)

#### channelName
- **Source:** YouTube page channel link
- **Format:** Display name as shown on YouTube
- **Examples:**
  - ✅ "Fireship"
  - ✅ "AI Прорыв"
  - ✅ "freeCodeCamp.org"

#### channelUrl
- **Source:** YouTube page channel link `href`
- **Format:** `https://www.youtube.com/@{handle}` or `/channel/{id}`
- **Examples:**
  - ✅ "https://www.youtube.com/@fireship"
  - ✅ "https://www.youtube.com/channel/UCsBjURrPoezykLs9EqgamOA"

#### category
- **Source:** User selection in popup
- **Validation:** Must be one of user's themes
- **Examples:**
  - ✅ "Python"
  - ✅ "Програмування"
  - ✅ "Web Development"

#### description
- **Source:** User input in popup
- **Optional:** Yes
- **Max length:** 500 characters
- **Examples:**
  - ✅ "Important example of async/await"
  - ✅ "" (empty is valid)
  - ⬜ null (not stored if empty)

#### createdAt / updatedAt
- **Source:** Auto-generated by code
- **Format:** ISO 8601 timestamp
- **Timezone:** UTC
- **Example:** "2024-11-09T18:36:35.123456789Z"

---

### Indexes

**Default Indexes:**
- Single field index on `createdAt` (for ordering)
- Document ID (automatic)

**Composite Indexes Needed:**
- `category` + `createdAt` (for filtered queries)

**Creating Composite Index:**
```javascript
// Firestore Console → Indexes → Create Index
Collection ID: bookmarks
Fields:
  - category (Ascending)
  - createdAt (Descending)
Query scope: Collection
```

**Or via Firebase CLI:**
```json
{
  "indexes": [
    {
      "collectionGroup": "bookmarks",
      "queryScope": "COLLECTION",
      "fields": [
        { "fieldPath": "category", "order": "ASCENDING" },
        { "fieldPath": "createdAt", "order": "DESCENDING" }
      ]
    }
  ]
}
```

---

## 💾 Chrome Storage Data Model

### Storage Type: `chrome.storage.sync`

**Synced across:** User's Chrome browsers (if signed in)
**Quota:** 100 KB total, 8 KB per item

### Schema

```javascript
{
  "themes": [
    "Програмування",
    "Python",
    "Arduino",
    "Web Development",
    "JavaScript"
  ],
  "firebaseConfigured": true
}
```

### Field Definitions

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `themes` | string[] | ✅ | User's custom categories |
| `firebaseConfigured` | boolean | ✅ | Connection status flag |

#### themes
- **Default:** `["Програмування", "Python", "Arduino", "Web Development", "JavaScript"]`
- **Max items:** Unlimited (within quota)
- **Max length per item:** ~8000 characters
- **Operations:**
  - Add theme: `themes.push(newTheme)`
  - Remove theme: `themes = themes.filter(t => t !== oldTheme)`
  - Get themes: `chrome.storage.sync.get(['themes'])`

#### firebaseConfigured
- **Default:** `false`
- **Set to `true`:** After successful Firebase operation
- **Purpose:** Show/hide setup prompts in UI

---

## 🔄 Data Transformations

### 1. YouTube DOM → Bookmark Data

**Input:** YouTube page DOM
**Output:** JavaScript object for saving

```javascript
// From Content Script (youtube-script.js)
{
  title: extractedFromDOM,           // <h1> element
  videoId: extractedFromURL,         // URL parsing
  url: window.location.href,
  videoUrl: window.location.href,
  watchUrl: generateShortURL(),      // youtu.be format
  channelName: extractedFromDOM,     // channel link text
  channelUrl: extractedFromDOM,      // channel link href
  currentTime: videoElement.currentTime,  // number
  description: extractedFromDOM       // #description-inner
}
```

**From User Input (popup.js):**
```javascript
{
  theme: selectedCategory,           // dropdown value
  description: userNotes             // textarea value
}
```

**Combined for saving:**
```javascript
const bookmarkData = {
  ...videoInfo,      // from content script
  theme,             // from user
  description        // from user
};
```

---

### 2. JavaScript Object → Firestore Document

**Input:** JavaScript object
**Output:** Firestore REST API format

```javascript
// FirebaseAPI.addBookmark()
const document = {
  fields: {
    title: { stringValue: bookmarkData.title },
    watchUrl: { stringValue: bookmarkData.watchUrl },
    videoUrl: { stringValue: bookmarkData.url },
    videoId: { stringValue: bookmarkData.videoId },
    description: { stringValue: bookmarkData.description || '' },
    channelUrl: { stringValue: bookmarkData.channelUrl },
    channelName: { stringValue: bookmarkData.channelName },
    category: { stringValue: bookmarkData.theme },
    currentTime: { integerValue: bookmarkData.currentTime.toString() },
    createdAt: { timestampValue: new Date().toISOString() },
    updatedAt: { timestampValue: new Date().toISOString() }
  }
};
```

---

### 3. Firestore Document → JavaScript Object

**Input:** Firestore REST API response
**Output:** Clean JavaScript object

```javascript
// FirebaseAPI.parseDocument()
function parseDocument(document) {
  const data = {};
  const fields = document.fields || {};

  for (const [key, value] of Object.entries(fields)) {
    if (value.stringValue !== undefined) {
      data[key] = value.stringValue;
    } else if (value.integerValue !== undefined) {
      data[key] = parseInt(value.integerValue);  // string → number
    } else if (value.timestampValue !== undefined) {
      data[key] = value.timestampValue;
    }
    // ... other types
  }

  return data;
}
```

---

## 📈 Data Aggregations

### Statistics Calculation

**Calculated client-side from all bookmarks:**

```javascript
async getStats() {
  const allBookmarks = await this.getAllBookmarks();
  const categories = await this.getCategories();

  const stats = {
    totalBookmarks: allBookmarks.length,
    totalCategories: categories.length,
    categories: {}  // count per category
  };

  allBookmarks.forEach(bookmark => {
    const cat = bookmark.category || 'Uncategorized';
    stats.categories[cat] = (stats.categories[cat] || 0) + 1;
  });

  return stats;
}
```

**Example output:**
```javascript
{
  totalBookmarks: 42,
  totalCategories: 5,
  categories: {
    "Python": 15,
    "JavaScript": 20,
    "Arduino": 7
  }
}
```

---

## 🔍 Query Patterns

### Get All Bookmarks (Sorted)

```javascript
GET /bookmarks?orderBy=createdAt desc&pageSize=1000
```

**Returns:** All bookmarks, newest first

---

### Get Bookmarks by Category

```javascript
POST /:runQuery
{
  "structuredQuery": {
    "from": [{ "collectionId": "bookmarks" }],
    "where": {
      "fieldFilter": {
        "field": { "fieldPath": "category" },
        "op": "EQUAL",
        "value": { "stringValue": "Python" }
      }
    },
    "orderBy": [{
      "field": { "fieldPath": "createdAt" },
      "direction": "DESCENDING"
    }]
  }
}
```

**Returns:** Python bookmarks only, newest first

---

### Client-Side Search

```javascript
const allBookmarks = await getAllBookmarks();
const results = allBookmarks.filter(bookmark =>
  bookmark.title?.toLowerCase().includes(searchTerm) ||
  bookmark.description?.toLowerCase().includes(searchTerm) ||
  bookmark.channelName?.toLowerCase().includes(searchTerm) ||
  bookmark.category?.toLowerCase().includes(searchTerm)
);
```

**Note:** Not efficient for large datasets. Future: Firestore full-text search.

---

## 🎨 Example Documents

### Example 1: Python Tutorial

```json
{
  "id": "xG7kP2mQ9nL",
  "title": "Async/Await in Python - Complete Tutorial",
  "videoId": "abc123def45",
  "videoUrl": "https://www.youtube.com/watch?v=abc123def45",
  "watchUrl": "https://youtu.be/abc123def45?t=120",
  "currentTime": 120,
  "channelName": "Corey Schafer",
  "channelUrl": "https://www.youtube.com/@coreyms",
  "category": "Python",
  "description": "Great explanation of asyncio basics",
  "createdAt": "2024-11-09T18:36:35.123Z",
  "updatedAt": "2024-11-09T18:36:35.123Z"
}
```

### Example 2: Arduino Project

```json
{
  "id": "yH8lQ3nR0oM",
  "title": "Build a Smart Home with ESP32",
  "videoId": "xyz789uvw12",
  "videoUrl": "https://www.youtube.com/watch?v=xyz789uvw12",
  "watchUrl": "https://youtu.be/xyz789uvw12?t=0",
  "currentTime": 0,
  "channelName": "Andreas Spiess",
  "channelUrl": "https://www.youtube.com/@AndreasSpiess",
  "category": "Arduino",
  "description": "",
  "createdAt": "2024-11-10T10:15:22.456Z",
  "updatedAt": "2024-11-10T10:15:22.456Z"
}
```

### Example 3: JavaScript (with emojis)

```json
{
  "id": "zI9mR4oS1pN",
  "title": "🔥 Modern JavaScript Features You MUST Know",
  "videoId": "pqr345stu67",
  "videoUrl": "https://www.youtube.com/watch?v=pqr345stu67",
  "watchUrl": "https://youtu.be/pqr345stu67?t=456",
  "currentTime": 456,
  "channelName": "Fireship",
  "channelUrl": "https://www.youtube.com/@fireship",
  "category": "JavaScript",
  "description": "Optional chaining and nullish coalescing examples",
  "createdAt": "2024-11-11T14:20:10.789Z",
  "updatedAt": "2024-11-11T14:20:10.789Z"
}
```

---

## ⚠️ Data Constraints & Limitations

### Firestore Limits

- **Max document size:** 1 MB (we use ~1-2 KB per bookmark)
- **Max field name size:** 1500 bytes
- **Max string field size:** 1 MB
- **Max writes per second:** 10,000 (plenty for personal use)
- **Max collections per document:** Not applicable (flat structure)

### Chrome Storage Limits

- **Total quota:** 100 KB for `chrome.storage.sync`
- **Max items:** 512
- **Max bytes per item:** 8 KB
- **Max writes:** 120 per minute

**Our usage:** ~100 bytes for themes array → plenty of room

---

## 🔄 Migration Path (Google Sheets → Firebase)

### Google Sheets Schema (v1.0)

```
| Title | Watch | Description | Channel | Date |
|-------|-------|-------------|---------|------|
| ...   | ...   | ...         | ...     | ...  |
```

### Mapping to Firebase

| Sheets Column | Firebase Field |
|---------------|----------------|
| Title | `title` |
| Watch | `watchUrl` |
| Description | `description` |
| Channel | Split into `channelName` + `channelUrl` |
| Date | `createdAt` |

**Additional fields in Firebase:**
- `videoId` (extracted from Watch URL)
- `videoUrl` (full URL)
- `currentTime` (extracted from Watch URL param `?t=`)
- `category` (from sheet name)
- `updatedAt` (same as createdAt on migration)

---

## 📐 Future Data Model Enhancements

### Planned Fields

**User Authentication:**
```javascript
{
  userId: string,              // Firebase Auth UID
  userEmail: string,           // User's email
  isPublic: boolean            // Share with others?
}
```

**Enhanced Metadata:**
```javascript
{
  thumbnailUrl: string,        // Video thumbnail
  videoDuration: number,       // Total video length
  viewCount: number,           // YouTube views (at time of save)
  tags: string[],              // User-defined tags
  rating: number,              // User rating (1-5 stars)
  notes: string[]              // Multiple notes with timestamps
}
```

**Social Features:**
```javascript
{
  sharedWith: string[],        // User IDs
  likes: number,
  comments: Comment[]
}
```

---

**Last Updated:** November 9, 2024
**Version:** 2.0.0
**Status:** Production schema, stable
