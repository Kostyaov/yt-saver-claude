# Deployment Guide

**Project:** YouTube Bookmarks Saver (Firebase Edition)
**Version:** 2.0.0
**Last Updated:** November 9, 2024

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Firebase Setup](#firebase-setup)
3. [Extension Configuration](#extension-configuration)
4. [Browser Installation](#browser-installation)
5. [Testing](#testing)
6. [Troubleshooting](#troubleshooting)
7. [Distribution](#distribution)

---

## Prerequisites

### Required

- **Browser:** Chrome 88+, Edge 88+, Brave 1.20+, or Opera 74+
- **Google Account:** For Firebase Console access
- **Git:** For cloning repository
- **Text Editor:** For editing configuration

### Optional

- **Firebase CLI:** For advanced setup
- **Node.js:** For future build process (not currently required)

---

## Firebase Setup

### Step 1: Create Firebase Project

1. Go to **Firebase Console:** https://console.firebase.google.com/

2. Click **"Add project"**

3. **Project name:** Enter any name (e.g., "YouTube Bookmarks")
   - Click **Continue**

4. **Google Analytics:** Optional (can disable)
   - Click **Create project**

5. Wait for project creation (~30 seconds)

6. Click **Continue** to enter project dashboard

---

### Step 2: Create Firestore Database

1. In left sidebar, click **"Firestore Database"**
   - Or: **Build** → **Firestore Database**

2. Click **"Create database"**

3. **Select location:**
   - Choose closest to your location (e.g., `us-central`, `europe-west`)
   - ⚠️ **Cannot be changed later!**
   - Click **Next**

4. **Security rules:** Start in **production mode**
   - Click **Enable**

5. Wait for database creation (~30 seconds)

---

### Step 3: Configure Security Rules

1. In Firestore Database, click **"Rules"** tab (top)

2. Replace existing rules with:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /bookmarks/{document=**} {
      allow read, write: if true;
    }
  }
}
```

3. Click **"Publish"**

⚠️ **Security Warning:** These rules allow public read/write. For production:
- Add Firebase Authentication
- Update rules to: `if request.auth != null`

---

### Step 4: Register Web App

1. In Firebase Console, click **⚙️ Settings** (top left, near "Project Overview")

2. Scroll to **"Your apps"** section

3. Click **Web icon** `</>`

4. **App nickname:** Enter "YouTube Bookmarks Extension"
   - ⬜ **Do NOT** check "Firebase Hosting"
   - Click **Register app**

5. **Copy Firebase configuration:**

You'll see code like:
```javascript
const firebaseConfig = {
  apiKey: "AIzaSyDJnaFR4pXR7fe2BfdZFUzC_lz-qencRr8",
  authDomain: "bookmarks-74022.firebaseapp.com",
  projectId: "bookmarks-74022",
  storageBucket: "bookmarks-74022.firebasestorage.app",
  messagingSenderId: "183006097407",
  appId: "1:183006097407:web:6de997b7410e527bb381ca"
};
```

6. **Copy this entire object** (you'll need it in next step)

7. Click **Continue to console**

---

## Extension Configuration

### Step 1: Clone Repository

```bash
git clone https://github.com/Kostyaov/yt-saver-claude.git
cd yt-saver-claude
```

### Step 2: Checkout Firebase Branch

```bash
git checkout claude/yt-saver-ff-011CUvZj39HXCfeFq2nvhizf
```

### Step 3: Configure Firebase in Extension

**⚠️ CRITICAL:** You must edit the service worker file with your Firebase config.

1. **Open file:** `extension/background/service-worker.js`

2. **Find lines 5-11:**
```javascript
const FIREBASE_CONFIG = {
  apiKey: "AIzaSyDJnaFR4pXR7fe2BfdZFUzC_lz-qencRr8",
  authDomain: "bookmarks-74022.firebaseapp.com",
  projectId: "bookmarks-74022",
  storageBucket: "bookmarks-74022.firebasestorage.app",
  messagingSenderId: "183006097407",
  appId: "1:183006097407:web:6de997b7410e527bb381ca"
};
```

3. **Replace with YOUR config** from Firebase Console (Step 4 above)

4. **Save file**

⚠️ **Important:** Keep quotes and commas exactly as shown. Only replace the values.

---

## Browser Installation

### Chrome / Edge / Brave / Opera

#### Step 1: Enable Developer Mode

1. Open browser and go to extensions page:
   - **Chrome:** `chrome://extensions/`
   - **Edge:** `edge://extensions/`
   - **Brave:** `brave://extensions/`
   - **Opera:** `opera://extensions/`

2. **Enable "Developer mode"**
   - Toggle switch in top right corner

#### Step 2: Load Extension

1. Click **"Load unpacked"** button

2. **Select folder:** Navigate to `yt-saver-claude/extension/` directory
   - ⚠️ Select the `extension` folder, NOT the root project folder
   - Click **"Select Folder"** / **"Open"**

3. Extension appears in list with:
   - Name: "YouTube Bookmarks Saver (Firebase)"
   - Version: "2.0.0"
   - ID: Random letters (e.g., `abcdefghijklmnop`)

#### Step 3: Pin Extension (Optional but Recommended)

1. Click **puzzle piece icon** in browser toolbar

2. Find "YouTube Bookmarks Saver (Firebase)"

3. Click **pin icon** to keep it visible in toolbar

---

### Safari (Not Currently Supported)

Safari requires converting to Safari Web Extension format. Not covered in this guide.

---

## Testing

### Test 1: Extension Loaded

**✅ Check:**
- Extension appears in `chrome://extensions/`
- No errors shown in red
- "Service worker" link is clickable

**🐛 If errors:**
- Check that `firebase-config.js` is properly formatted
- Look at service worker console for specific errors

---

### Test 2: Service Worker Console

1. Go to `chrome://extensions/`

2. Find extension → click **"service worker"** (blue link)

3. **DevTools opens**

4. **✅ Check console shows:**
   ```
   Background service worker loaded (Firebase mode) - Config embedded
   ```

5. **❌ Check for NO errors like:**
   - "FIREBASE_CONFIG is not defined"
   - "Failed to load script"
   - Syntax errors

---

### Test 3: Firebase Connection

1. **Right-click** extension icon → **Options**

2. Click **"Перевірити з'єднання"** (Test Connection) button

3. **✅ Expected:**
   - Green success message: "З'єднання успішне! Firebase працює."
   - Status changes to green checkmark

4. **❌ If fails:**
   - Check Firebase config in `service-worker.js`
   - Verify Firestore Database is created
   - Check Security Rules are published
   - See [Troubleshooting](#troubleshooting) section

---

### Test 4: Save Bookmark

1. **Open YouTube video:**
   - Go to https://www.youtube.com/watch?v=dQw4w9WgXcQ
   - Or any video you like

2. **Wait for video to load** (a few seconds)

3. **Click extension icon** in toolbar
   - Popup should open showing video info

4. **Fill form:**
   - **Тема:** Select "Програмування" (or create new theme)
   - **Опис:** Type "Test bookmark"

5. **Click "Зберегти" (Save)**

6. **✅ Expected:**
   - Success message appears
   - Popup closes (or shows success)

---

### Test 5: Verify in Firebase

1. Go to **Firebase Console:**
   - https://console.firebase.google.com/

2. Select your project

3. **Firestore Database** → **Data** tab

4. **✅ Check:**
   - Collection `bookmarks` exists
   - At least 1 document inside
   - Document has all fields (title, watchUrl, category, etc.)

5. **Click on document** to see details

6. **Verify fields:**
   - `title` = YouTube video title
   - `watchUrl` = `https://youtu.be/...?t=...`
   - `category` = "Програмування"
   - `description` = "Test bookmark"
   - `currentTime` = number (seconds)
   - `createdAt` = recent timestamp

---

### Test 6: Keyboard Shortcut

1. **Open YouTube video**

2. **Press:** `Ctrl+Shift+B` (Windows/Linux) or `Cmd+Shift+B` (Mac)

3. **✅ Expected:**
   - Popup opens automatically
   - Same as clicking icon

4. **❌ If doesn't work:**
   - Check `chrome://extensions/shortcuts`
   - Ensure shortcut is assigned
   - Check for conflicting shortcuts

---

### Test 7: Statistics

1. **Open Options page:**
   - Right-click icon → Options

2. **Scroll to "Статистика" section**

3. **✅ Check:**
   - "Всього закладок" shows count (e.g., 1)
   - "Категорій" shows count (e.g., 1)

4. **Click "Оновити статистику"**
   - Numbers update (should stay same or increase)

---

## Troubleshooting

### Issue: Service Worker Registration Failed

**Error:** "Service worker registration failed. Status code: 15"

**Cause:** Code syntax error or file not found

**Fix:**
1. Check `service-worker.js` for syntax errors
2. Ensure Firebase config is properly formatted (no missing commas/quotes)
3. Reload extension: `chrome://extensions/` → 🔄 Reload

---

### Issue: FIREBASE_CONFIG is not defined

**Error:** In console: "FIREBASE_CONFIG is not defined"

**Cause:** Config not embedded in service worker

**Fix:**
1. Ensure you're on correct branch: `claude/yt-saver-ff-011CUvZj39HXCfeFq2nvhizf`
2. Check `service-worker.js` lines 5-11 have your Firebase config
3. Reload extension

---

### Issue: Test Connection Fails - Permission Denied

**Error:** "PERMISSION_DENIED"

**Cause:** Firestore Security Rules too restrictive

**Fix:**
1. Firebase Console → Firestore → Rules
2. Ensure rules allow write: `allow read, write: if true;`
3. Click **Publish**
4. Wait 1 minute for propagation
5. Test again

---

### Issue: Test Connection Fails - Invalid API Key

**Error:** "API key not valid"

**Cause:** Wrong API key or project ID

**Fix:**
1. Firebase Console → ⚙️ Settings → Your apps
2. Copy correct `firebaseConfig` object
3. Replace in `service-worker.js` lines 5-11
4. **Double-check:** No typos in API key
5. Reload extension

---

### Issue: Popup Not Opening

**Symptoms:** Clicking icon does nothing

**Causes & Fixes:**

1. **Extension not loaded:**
   - Go to `chrome://extensions/`
   - Ensure extension is **enabled** (toggle on)

2. **Not on YouTube page:**
   - Extension only activates on `youtube.com/watch*` pages
   - Open a video first

3. **JavaScript error:**
   - Right-click popup area → Inspect
   - Check console for errors

---

### Issue: Video Info Not Extracted

**Symptoms:** Popup opens but shows "Loading..." forever

**Causes & Fixes:**

1. **Content script not loaded:**
   - Refresh YouTube page (F5)
   - Reload extension
   - Reload YouTube page again

2. **YouTube layout changed:**
   - Check DevTools console on YouTube page
   - Look for errors from content script

3. **Video not fully loaded:**
   - Wait a few more seconds for video to load
   - Try clicking extension icon again

---

### Issue: Bookmark Saved but Not in Firebase

**Symptoms:** Success message shown, but document missing

**Causes & Fixes:**

1. **Check Firestore collection name:**
   - Should be exactly `bookmarks` (lowercase)

2. **Network error:**
   - Check service worker console for errors
   - Verify internet connection

3. **Asynchronous timing:**
   - Wait 5-10 seconds
   - Refresh Firebase Console page

---

## Distribution

### Option 1: Personal Use (Current Method)

**Steps:**
1. Each user clones repository
2. Each user creates their own Firebase project
3. Each user edits `service-worker.js` with their config
4. Each user loads unpacked extension

**Pros:**
- Simple
- Full control
- No review process

**Cons:**
- Manual setup required
- Not discoverable in Chrome Web Store
- No auto-updates

---

### Option 2: Chrome Web Store (Future)

**Requirements:**
1. **Developer account:** $5 one-time fee
2. **Privacy policy:** Required for extensions
3. **Store listing:** Screenshots, description, etc.
4. **Review:** Google reviews extension (~1-3 days)

**Changes needed:**
1. **Firebase config via UI:**
   - Remove hardcoded config
   - Add settings page for users to input their config
   - Store in `chrome.storage`

2. **Package extension:**
   ```bash
   zip -r extension.zip extension/
   ```

3. **Upload to Chrome Web Store:**
   - https://chrome.google.com/webstore/devconsole

**Pros:**
- Easy installation for users
- Auto-updates
- Discoverable
- Trust indicators

**Cons:**
- Review process
- More complex setup UI needed
- $5 developer fee

---

### Option 3: Self-Hosted with Build Process

**Setup:**
1. Add build script (webpack/rollup)
2. Environment variables for Firebase config
3. Automated builds via GitHub Actions
4. Distribute .crx file via GitHub Releases

**Example:**
```bash
npm run build -- --firebase-api-key="YOUR_KEY" --project-id="YOUR_PROJECT"
```

**Pros:**
- Automated builds
- Version control
- Easy distribution

**Cons:**
- Requires build setup
- Users still need Firebase project

---

## Production Checklist

Before deploying to production or sharing with others:

### Security

- [ ] Implement Firebase Authentication
- [ ] Update Security Rules to require authentication
- [ ] Add rate limiting
- [ ] Add input validation
- [ ] Review permissions in manifest.json

### Testing

- [ ] Test on multiple browsers (Chrome, Edge, Brave)
- [ ] Test with various YouTube videos
- [ ] Test with long video titles/descriptions
- [ ] Test keyboard shortcuts
- [ ] Test offline behavior

### Documentation

- [ ] Update README with installation steps
- [ ] Create user guide
- [ ] Document known issues
- [ ] Add privacy policy (if distributing)

### Code Quality

- [ ] Remove console.log statements (or use proper logging)
- [ ] Add error handling
- [ ] Add loading states in UI
- [ ] Optimize Firebase queries
- [ ] Add telemetry (optional)

### Distribution

- [ ] Choose distribution method
- [ ] Create promotional materials (screenshots, video)
- [ ] Set up support channels (email, GitHub issues)
- [ ] Create changelog

---

## Maintenance

### Regular Tasks

**Weekly:**
- Check Firebase usage (Firestore reads/writes)
- Monitor error logs (if telemetry added)

**Monthly:**
- Review Firebase quotas
- Update dependencies (if any added)
- Check for YouTube DOM changes

**Quarterly:**
- Review Security Rules
- Update documentation
- Plan new features

---

## Rollback Procedure

If deployment fails or issues arise:

### Rollback Extension

1. **Uninstall current version:**
   - `chrome://extensions/` → Remove

2. **Checkout previous version:**
   ```bash
   git checkout <previous-commit-hash>
   ```

3. **Reload extension:**
   - Load unpacked again

### Rollback Firestore Rules

1. Firebase Console → Firestore → Rules

2. Click **"View history"**

3. Select previous version

4. Click **"Restore"**

### Rollback Data (if needed)

**⚠️ Firestore has no built-in backup!**

**Prevention:**
- Export data regularly:
  ```bash
  gcloud firestore export gs://[BUCKET_NAME]
  ```

**Recovery:**
- Import from export:
  ```bash
  gcloud firestore import gs://[BUCKET_NAME]/[EXPORT_FOLDER]
  ```

---

## Support

### User Support

- **Documentation:** FIREBASE_SETUP.md
- **Issues:** GitHub Issues
- **Email:** (Add if providing support)

### Developer Support

- **Context:** doc/CONTEXT_ENGINEERING.md
- **Architecture:** doc/ARCHITECTURE.md
- **API Reference:** doc/API_REFERENCE.md

---

**Last Updated:** November 9, 2024
**Version:** 2.0.0
**Deployment Method:** Personal use, unpacked extension
