// YouTube Content Script
// Extracts video information and current timestamp

class YouTubeBookmarkHelper {
  constructor() {
    this.videoPlayer = null;
    this.init();
  }

  init() {
    // Wait for YouTube player to load
    this.waitForPlayer();

    // Listen for messages from popup
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'getVideoInfo') {
        this.getVideoInfo().then(info => {
          sendResponse({ success: true, data: info });
        }).catch(error => {
          sendResponse({ success: false, error: error.message });
        });
        return true; // Keep message channel open for async response
      }

      // Handle pause/play video
      if (request.action === 'pauseVideo') {
        this.pauseVideo();
        sendResponse({ success: true });
        return true;
      }

      if (request.action === 'playVideo') {
        this.playVideo();
        sendResponse({ success: true });
        return true;
      }
    });

    // Listen for keyboard shortcut
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === 'openPopupWithInfo') {
        this.openSaveDialog();
      }
    });
  }

  waitForPlayer() {
    const checkPlayer = setInterval(() => {
      this.videoPlayer = document.querySelector('video');
      if (this.videoPlayer) {
        clearInterval(checkPlayer);
        console.log('YouTube player found');
      }
    }, 500);

    // Stop checking after 10 seconds
    setTimeout(() => clearInterval(checkPlayer), 10000);
  }

  async getVideoInfo() {
    if (!this.videoPlayer) {
      this.videoPlayer = document.querySelector('video');
    }

    if (!this.videoPlayer) {
      throw new Error('Video player not found');
    }

    // Get current video URL
    const url = window.location.href;
    const videoId = this.extractVideoId(url);

    // Get video title
    const titleElement = document.querySelector('h1.ytd-watch-metadata yt-formatted-string');
    const title = titleElement ? titleElement.textContent.trim() : 'Unknown Title';

    // Get video description - try to expand it first
    let description = '';
    try {
      // Try to click "Show more" button to expand description
      const expandButton = document.querySelector('ytd-text-inline-expander#description-inline-expander tp-yt-paper-button#expand');
      if (expandButton && expandButton.getAttribute('aria-label')?.includes('more')) {
        expandButton.click();
        // Wait a bit for description to expand
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // Get full description including timestamps
      const descriptionElement = document.querySelector('ytd-text-inline-expander#description-inline-expander yt-attributed-string span');
      if (descriptionElement) {
        description = descriptionElement.innerText || descriptionElement.textContent || '';
      }
    } catch (error) {
      console.warn('Could not get full description:', error);
      // Fallback to short description
      const descriptionElement = document.querySelector('ytd-text-inline-expander#description-inline-expander span.yt-core-attributed-string');
      description = descriptionElement ? descriptionElement.textContent.trim() : '';
    }

    // Get current timestamp
    const currentTime = Math.floor(this.videoPlayer.currentTime);

    // Get video duration
    const duration = Math.floor(this.videoPlayer.duration);

    // Get channel name and URL
    const channelElement = document.querySelector('ytd-channel-name a');
    const channelName = channelElement ? channelElement.textContent.trim() : 'Unknown Channel';
    const channelUrl = channelElement ? 'https://www.youtube.com' + channelElement.getAttribute('href') : '';

    // Generate short URL with timestamp
    const watchUrl = this.generateTimestampUrl(videoId, currentTime);

    return {
      url: url,
      videoId: videoId,
      title: title,
      description: description,
      currentTime: currentTime,
      duration: duration,
      channelName: channelName,
      channelUrl: channelUrl,
      watchUrl: watchUrl,
      timestamp: new Date().toISOString()
    };
  }

  extractVideoId(url) {
    const urlParams = new URLSearchParams(new URL(url).search);
    return urlParams.get('v') || '';
  }

  generateTimestampUrl(videoId, seconds) {
    // Generate short URL with timestamp: https://youtu.be/VIDEO_ID?t=SECONDS
    return `https://youtu.be/${videoId}?t=${seconds}`;
  }

  formatTime(seconds) {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }

  openSaveDialog() {
    // This will trigger the popup to open
    chrome.runtime.sendMessage({ action: 'openPopup' });
  }

  pauseVideo() {
    if (this.videoPlayer && !this.videoPlayer.paused) {
      this.videoPlayer.pause();
    }
  }

  playVideo() {
    if (this.videoPlayer && this.videoPlayer.paused) {
      this.videoPlayer.play();
    }
  }
}

// Initialize the helper
const youtubeHelper = new YouTubeBookmarkHelper();

console.log('YouTube Bookmarks Saver content script loaded');
