# API Reference

**Project:** YouTube Bookmarks Saver (Firebase Edition)
**Version:** 2.0.0
**Last Updated:** November 9, 2024

---

## 📚 Table of Contents

1. [FirebaseAPI Class](#firebaseapi-class)
2. [Service Worker Message API](#service-worker-message-api)
3. [Content Script API](#content-script-api)
4. [Chrome Storage API Usage](#chrome-storage-api-usage)
5. [Firestore REST API](#firestore-rest-api)

---

## FirebaseAPI Class

**Location:** `extension/background/service-worker.js` (lines 14-289)

**Purpose:** Wrapper around Firebase Firestore REST API for bookmark management.

### Constructor

```javascript
constructor(config)
```

**Parameters:**
- `config` (Object): Firebase configuration object

**Example:**
```javascript
const firebaseAPI = new FirebaseAPI({
  apiKey: "AIzaSy...",
  projectId: "my-project-123",
  authDomain: "my-project-123.firebaseapp.com",
  storageBucket: "my-project-123.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
});
```

**Properties Set:**
- `this.config` - Full Firebase config
- `this.projectId` - Extracted project ID
- `this.apiKey` - Extracted API key
- `this.baseUrl` - Firestore REST API base URL

---

### Methods

#### addBookmark()

Add a new bookmark to Firestore.

```javascript
async addBookmark(bookmarkData)
```

**Parameters:**

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | ✅ | Video title from YouTube |
| `videoId` | string | ✅ | YouTube video ID |
| `url` | string | ✅ | Full YouTube URL |
| `watchUrl` | string | ✅ | Timestamped youtu.be URL |
| `channelName` | string | ✅ | Channel name |
| `channelUrl` | string | ✅ | Channel URL |
| `theme` | string | ✅ | Category/theme |
| `description` | string | ⬜ | User's notes (optional) |
| `currentTime` | number | ✅ | Timestamp in seconds |

**Returns:** `Promise<Object>`
```javascript
{
  id: string,              // Firestore document ID
  title: string,
  watchUrl: string,
  // ... all other fields
}
```

**Throws:**
- Error if Firebase request fails
- Error if API key invalid
- Error if network unavailable

**Example:**
```javascript
const result = await firebaseAPI.addBookmark({
  title: "Learn JavaScript",
  videoId: "abc123",
  url: "https://www.youtube.com/watch?v=abc123",
  watchUrl: "https://youtu.be/abc123?t=120",
  channelName: "CodeChannel",
  channelUrl: "https://www.youtube.com/@CodeChannel",
  theme: "JavaScript",
  description: "Introduction to promises",
  currentTime: 120
});

console.log(result.id); // "xG7kP2mQ9nL..."
```

**Internal Process:**
1. Format data as Firestore document with typed fields
2. POST to `/bookmarks` endpoint
3. Parse response
4. Extract document ID
5. Return parsed document with ID

---

#### getAllBookmarks()

Retrieve all bookmarks, ordered by creation date (newest first).

```javascript
async getAllBookmarks()
```

**Parameters:** None

**Returns:** `Promise<Bookmark[]>`
```javascript
[
  {
    id: string,
    title: string,
    watchUrl: string,
    videoUrl: string,
    videoId: string,
    channelName: string,
    channelUrl: string,
    category: string,
    description: string,
    currentTime: number,
    createdAt: string,      // ISO 8601 timestamp
    updatedAt: string
  },
  // ... more bookmarks
]
```

**Throws:**
- Error if Firebase request fails
- Error if API key invalid

**Example:**
```javascript
const bookmarks = await firebaseAPI.getAllBookmarks();

console.log(`Found ${bookmarks.length} bookmarks`);

bookmarks.forEach(bookmark => {
  console.log(`${bookmark.title} - ${bookmark.category}`);
});
```

**Query Parameters:**
- `pageSize=1000` - Maximum results
- `orderBy=createdAt desc` - Sorting order

**Note:** If collection is empty, returns empty array `[]`.

---

#### getBookmarksByCategory()

Get bookmarks filtered by category.

```javascript
async getBookmarksByCategory(category)
```

**Parameters:**
- `category` (string): Category name to filter by

**Returns:** `Promise<Bookmark[]>`

Same structure as `getAllBookmarks()`, but filtered.

**Example:**
```javascript
const pythonBookmarks = await firebaseAPI.getBookmarksByCategory('Python');

console.log(`Python bookmarks: ${pythonBookmarks.length}`);
```

**Internal Process:**
Uses Firestore structured query with `where` filter:
```javascript
{
  structuredQuery: {
    from: [{ collectionId: 'bookmarks' }],
    where: {
      fieldFilter: {
        field: { fieldPath: 'category' },
        op: 'EQUAL',
        value: { stringValue: category }
      }
    },
    orderBy: [{ field: { fieldPath: 'createdAt' }, direction: 'DESCENDING' }]
  }
}
```

---

#### deleteBookmark()

Delete a bookmark by ID.

```javascript
async deleteBookmark(bookmarkId)
```

**Parameters:**
- `bookmarkId` (string): Firestore document ID

**Returns:** `Promise<boolean>`
- `true` if deleted successfully

**Throws:**
- Error if bookmark doesn't exist
- Error if API key invalid
- Error if permission denied

**Example:**
```javascript
await firebaseAPI.deleteBookmark('xG7kP2mQ9nL...');
console.log('Bookmark deleted');
```

---

#### searchBookmarks()

Client-side search across bookmarks.

```javascript
async searchBookmarks(searchTerm)
```

**Parameters:**
- `searchTerm` (string): Search query (case-insensitive)

**Returns:** `Promise<Bookmark[]>`

Matches against:
- Title
- Description
- Channel name
- Category

**Example:**
```javascript
const results = await firebaseAPI.searchBookmarks('javascript');

// Returns all bookmarks with "javascript" in any field
```

**Note:** Downloads all bookmarks first, then filters client-side. Not suitable for large datasets (>1000 bookmarks).

---

#### getCategories()

Get list of all unique categories.

```javascript
async getCategories()
```

**Parameters:** None

**Returns:** `Promise<string[]>`

Sorted alphabetically.

**Example:**
```javascript
const categories = await firebaseAPI.getCategories();

// ["Arduino", "JavaScript", "Python", "Web Development"]
```

**Implementation:** Client-side aggregation from all bookmarks.

---

#### getStats()

Get bookmark statistics.

```javascript
async getStats()
```

**Parameters:** None

**Returns:** `Promise<Object>`
```javascript
{
  totalBookmarks: number,
  totalCategories: number,
  categories: {
    "Python": number,
    "JavaScript": number,
    // ... count per category
  }
}
```

**Example:**
```javascript
const stats = await firebaseAPI.getStats();

console.log(`Total: ${stats.totalBookmarks}`);
console.log(`Categories: ${stats.totalCategories}`);

Object.entries(stats.categories).forEach(([cat, count]) => {
  console.log(`${cat}: ${count}`);
});

// Output:
// Total: 42
// Categories: 5
// Python: 15
// JavaScript: 20
// Arduino: 7
```

---

#### testConnection()

Test Firebase connectivity.

```javascript
async testConnection()
```

**Parameters:** None

**Returns:** `Promise<boolean>`
- `true` if connection successful
- `false` if connection failed

**Example:**
```javascript
const isConnected = await firebaseAPI.testConnection();

if (isConnected) {
  console.log('Firebase is working!');
} else {
  console.error('Firebase connection failed');
}
```

**Implementation:** Attempts to fetch all bookmarks. If no error, connection is valid.

---

#### parseDocument()

Convert Firestore document format to JavaScript object.

```javascript
parseDocument(document)
```

**Parameters:**
- `document` (Object): Firestore document with `fields` property

**Returns:** `Object` - Plain JavaScript object

**Example:**
```javascript
const firestoreDoc = {
  fields: {
    title: { stringValue: "My Video" },
    currentTime: { integerValue: "91" },
    createdAt: { timestampValue: "2024-11-09T18:36:35Z" }
  }
};

const parsed = firebaseAPI.parseDocument(firestoreDoc);

console.log(parsed);
// {
//   title: "My Video",
//   currentTime: 91,
//   createdAt: "2024-11-09T18:36:35Z"
// }
```

**Supported Types:**
- `stringValue` → `string`
- `integerValue` → `number` (parsed)
- `doubleValue` → `number`
- `booleanValue` → `boolean`
- `timestampValue` → `string` (ISO 8601)
- `nullValue` → `null`

---

#### isConfigured() [Static]

Check if Firebase config is valid.

```javascript
static isConfigured(config)
```

**Parameters:**
- `config` (Object): Firebase configuration

**Returns:** `boolean`
- `true` if config has all required fields and not placeholder values
- `false` otherwise

**Example:**
```javascript
const config = {
  apiKey: "AIzaSy...",
  projectId: "my-project"
};

if (FirebaseAPI.isConfigured(config)) {
  const api = new FirebaseAPI(config);
} else {
  console.error('Please configure Firebase first');
}
```

**Checks:**
- `config` exists
- `apiKey` exists and not `"YOUR_API_KEY"`
- `projectId` exists and not `"YOUR_PROJECT_ID"`

---

## Service Worker Message API

**Location:** `extension/background/service-worker.js`

Messages handled by service worker via `chrome.runtime.sendMessage()`.

### saveBookmark

Save a bookmark to Firebase.

**Request:**
```javascript
chrome.runtime.sendMessage({
  action: 'saveBookmark',
  data: {
    title: string,
    videoId: string,
    url: string,
    watchUrl: string,
    channelName: string,
    channelUrl: string,
    theme: string,
    description: string,
    currentTime: number
  }
}, (response) => {
  if (response.success) {
    console.log('Saved!', response.data);
  } else {
    console.error('Error:', response.error);
  }
});
```

**Response (success):**
```javascript
{
  success: true,
  data: {
    message: "Bookmark saved successfully",
    bookmarkId: string,
    category: string
  }
}
```

**Response (error):**
```javascript
{
  success: false,
  error: string  // Error message
}
```

---

### testFirebaseConnection

Test Firebase connectivity.

**Request:**
```javascript
chrome.runtime.sendMessage({
  action: 'testFirebaseConnection'
}, (response) => {
  if (response.success) {
    console.log('Connected!');
  }
});
```

**Response (success):**
```javascript
{
  success: true,
  data: {
    message: "З'єднання успішне",
    configured: true
  }
}
```

**Response (error):**
```javascript
{
  success: false,
  error: "Firebase не налаштовано"
}
```

---

### getBookmarks

Get all bookmarks or filter by category.

**Request (all):**
```javascript
chrome.runtime.sendMessage({
  action: 'getBookmarks'
}, (response) => {
  console.log(response.data); // Array of bookmarks
});
```

**Request (filtered):**
```javascript
chrome.runtime.sendMessage({
  action: 'getBookmarks',
  data: { category: 'Python' }
}, (response) => {
  console.log(response.data); // Python bookmarks only
});
```

**Response:**
```javascript
{
  success: true,
  data: Bookmark[]  // Array of bookmark objects
}
```

---

### getStats

Get bookmark statistics.

**Request:**
```javascript
chrome.runtime.sendMessage({
  action: 'getStats'
}, (response) => {
  console.log(response.data.totalBookmarks);
});
```

**Response:**
```javascript
{
  success: true,
  data: {
    totalBookmarks: number,
    totalCategories: number,
    categories: { [key: string]: number }
  }
}
```

---

### deleteBookmark

Delete a bookmark.

**Request:**
```javascript
chrome.runtime.sendMessage({
  action: 'deleteBookmark',
  data: { bookmarkId: 'xG7kP2mQ9nL...' }
}, (response) => {
  if (response.success) {
    console.log('Deleted!');
  }
});
```

**Response:**
```javascript
{
  success: true,
  data: {
    message: "Закладку видалено",
    bookmarkId: string
  }
}
```

---

## Content Script API

**Location:** `extension/content/youtube-script.js`

### getVideoInfo

Extract metadata from current YouTube page.

**Usage:**
```javascript
chrome.tabs.query({active: true, currentWindow: true}, (tabs) => {
  chrome.tabs.sendMessage(tabs[0].id, {action: 'getVideoInfo'}, (response) => {
    if (response) {
      console.log('Video info:', response);
    }
  });
});
```

**Response:**
```javascript
{
  title: string,              // "Video Title"
  videoId: string,            // "abc123def45"
  url: string,                // "https://www.youtube.com/watch?v=abc123def45"
  videoUrl: string,           // Same as url
  watchUrl: string,           // "https://youtu.be/abc123def45?t=91"
  channelName: string,        // "Channel Name"
  channelUrl: string,         // "https://www.youtube.com/@channelname"
  currentTime: number,        // 91 (seconds)
  description: string         // Full video description
}
```

**Extracted From:**
- Title: `h1.ytd-video-primary-info-renderer yt-formatted-string`
- Channel: `ytd-channel-name a`
- Current time: `video` element `.currentTime`
- Video ID: URL parsing
- Description: `#description-inner` (auto-expanded)

---

## Chrome Storage API Usage

### Storage Schema

**Type:** `chrome.storage.sync`

```javascript
{
  themes: string[],           // User's custom categories
  firebaseConfigured: boolean // Connection status
}
```

### Get Themes

```javascript
chrome.storage.sync.get(['themes'], (result) => {
  const themes = result.themes || [];
  console.log('Themes:', themes);
});
```

### Add Theme

```javascript
chrome.storage.sync.get(['themes'], (result) => {
  const themes = result.themes || [];
  themes.push('New Theme');

  chrome.storage.sync.set({ themes }, () => {
    console.log('Theme added');
  });
});
```

### Remove Theme

```javascript
chrome.storage.sync.get(['themes'], (result) => {
  let themes = result.themes || [];
  themes = themes.filter(t => t !== 'Old Theme');

  chrome.storage.sync.set({ themes }, () => {
    console.log('Theme removed');
  });
});
```

### Check Firebase Status

```javascript
chrome.storage.sync.get(['firebaseConfigured'], (result) => {
  if (result.firebaseConfigured) {
    console.log('Firebase is configured');
  } else {
    console.log('Firebase needs setup');
  }
});
```

---

## Firestore REST API

Direct REST API calls (used internally by FirebaseAPI).

### Base URL

```
https://firestore.googleapis.com/v1/projects/{projectId}/databases/(default)/documents
```

### Authentication

All requests require API key as query parameter:
```
?key={apiKey}
```

### Create Document

**Endpoint:** `POST /bookmarks`

**Request:**
```http
POST /bookmarks?key=AIzaSy...
Content-Type: application/json

{
  "fields": {
    "title": { "stringValue": "My Video" },
    "currentTime": { "integerValue": "91" }
  }
}
```

**Response:**
```json
{
  "name": "projects/.../documents/bookmarks/abc123",
  "fields": {
    "title": { "stringValue": "My Video" },
    "currentTime": { "integerValue": "91" }
  },
  "createTime": "2024-11-09T18:36:35.123456Z",
  "updateTime": "2024-11-09T18:36:35.123456Z"
}
```

---

### List Documents

**Endpoint:** `GET /bookmarks`

**Request:**
```http
GET /bookmarks?key=AIzaSy...&pageSize=1000&orderBy=createdAt desc
```

**Response:**
```json
{
  "documents": [
    {
      "name": "projects/.../documents/bookmarks/abc123",
      "fields": { ... }
    }
  ]
}
```

**Empty Collection:**
```json
{}
```

---

### Structured Query

**Endpoint:** `POST /:runQuery`

**Request:**
```http
POST /:runQuery?key=AIzaSy...
Content-Type: application/json

{
  "structuredQuery": {
    "from": [{ "collectionId": "bookmarks" }],
    "where": {
      "fieldFilter": {
        "field": { "fieldPath": "category" },
        "op": "EQUAL",
        "value": { "stringValue": "Python" }
      }
    }
  }
}
```

**Response:**
```json
[
  {
    "document": {
      "name": "projects/.../documents/bookmarks/abc123",
      "fields": { ... }
    }
  }
]
```

---

### Delete Document

**Endpoint:** `DELETE /bookmarks/{documentId}`

**Request:**
```http
DELETE /bookmarks/abc123?key=AIzaSy...
```

**Response:** Empty (204 No Content)

---

## Error Handling

### Common Errors

**Firebase Not Configured:**
```javascript
{
  success: false,
  error: "Firebase не налаштовано"
}
```

**Permission Denied:**
```javascript
{
  success: false,
  error: "Failed to add bookmark: PERMISSION_DENIED"
}
```

**Invalid API Key:**
```javascript
{
  success: false,
  error: "Failed to add bookmark: API key not valid"
}
```

**Network Error:**
```javascript
{
  success: false,
  error: "Failed to add bookmark: Failed to fetch"
}
```

### Error Handling Best Practices

```javascript
try {
  const result = await firebaseAPI.addBookmark(data);
  console.log('Success:', result);
} catch (error) {
  console.error('Error:', error);

  if (error.message.includes('PERMISSION_DENIED')) {
    alert('Check Firebase Security Rules');
  } else if (error.message.includes('API key not valid')) {
    alert('Invalid Firebase API key');
  } else {
    alert('Error: ' + error.message);
  }
}
```

---

## TypeScript Definitions (Reference)

For future TypeScript migration:

```typescript
// Types
interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
}

interface Bookmark {
  id: string;
  title: string;
  videoId: string;
  videoUrl: string;
  watchUrl: string;
  channelName: string;
  channelUrl: string;
  category: string;
  description: string;
  currentTime: number;
  createdAt: string;
  updatedAt: string;
}

interface BookmarkData {
  title: string;
  videoId: string;
  url: string;
  watchUrl: string;
  channelName: string;
  channelUrl: string;
  theme: string;
  description?: string;
  currentTime: number;
}

interface Stats {
  totalBookmarks: number;
  totalCategories: number;
  categories: { [key: string]: number };
}

// FirebaseAPI Class
class FirebaseAPI {
  constructor(config: FirebaseConfig);

  addBookmark(data: BookmarkData): Promise<Bookmark>;
  getAllBookmarks(): Promise<Bookmark[]>;
  getBookmarksByCategory(category: string): Promise<Bookmark[]>;
  deleteBookmark(bookmarkId: string): Promise<boolean>;
  searchBookmarks(term: string): Promise<Bookmark[]>;
  getCategories(): Promise<string[]>;
  getStats(): Promise<Stats>;
  testConnection(): Promise<boolean>;

  parseDocument(doc: any): Partial<Bookmark>;
  static isConfigured(config: FirebaseConfig): boolean;
}
```

---

**Last Updated:** November 9, 2024
**Version:** 2.0.0
**Status:** Complete and production-ready
