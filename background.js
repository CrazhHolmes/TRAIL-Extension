/**
 * TRAIL Background Script
 * Captures browsing history, stores locally in IndexedDB
 * Privacy-First: Zero external API calls. All data stays local.
 */

// Database configuration
const DB_NAME = 'TRAIL_Database';
const DB_VERSION = 1;
const STORE_NAME = 'browsing_history';
const PURGE_DAYS = 30; // Auto-purge after 30 days (configurable)

// Domain categories for color coding
const DOMAIN_CATEGORIES = {
  'tech': ['github.com', 'stackoverflow.com', 'stackoverflow.blog', 'developer.mozilla.org', 'docs.google.com', 'gitlab.com', 'bitbucket.org', 'codepen.io', 'jsfiddle.net', 'replit.com', 'vercel.com', 'netlify.com', 'aws.amazon.com', 'azure.microsoft.com', 'cloud.google.com', 'digitalocean.com', 'heroku.com'],
  'social': ['twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'linkedin.com', 'reddit.com', 'tiktok.com', 'youtube.com', 'twitch.tv', 'discord.com', 'whatsapp.com', 'telegram.org', 'snapchat.com', 'pinterest.com'],
  'news': ['cnn.com', 'bbc.com', 'reuters.com', 'apnews.com', 'npr.org', 'theguardian.com', 'nytimes.com', 'washingtonpost.com', 'wsj.com', 'bloomberg.com', 'techcrunch.com', 'theverge.com', 'engadget.com', 'arstechnica.com', 'hackernews.ycombinator.com', 'news.ycombinator.com'],
  'edu': ['wikipedia.org', 'wikimedia.org', 'khanacademy.org', 'coursera.org', 'edx.org', 'udemy.com', 'mit.edu', 'harvard.edu', 'stanford.edu', 'berkeley.edu', 'scholar.google.com', 'jstor.org', 'arxiv.org', 'researchgate.net', 'academia.edu'],
  'shopping': ['amazon.com', 'ebay.com', 'walmart.com', 'target.com', 'bestbuy.com', 'etsy.com', 'shopify.com', 'aliexpress.com', 'alibaba.com', 'newegg.com', 'wayfair.com', 'overstock.com'],
  'entertainment': ['netflix.com', 'hulu.com', 'disneyplus.com', 'hbomax.com', 'primevideo.com', 'spotify.com', 'apple.com/apple-music', 'soundcloud.com', 'bandcamp.com', 'crunchyroll.com', 'funimation.com', 'imdb.com', 'letterboxd.com'],
  'finance': ['paypal.com', 'stripe.com', 'venmo.com', 'cash.app', 'robinhood.com', 'coinbase.com', 'binance.com', 'kraken.com', 'fidelity.com', 'schwab.com', 'vanguard.com', 'bankofamerica.com', 'chase.com', 'wellsfargo.com']
};

// Initialize IndexedDB
function initDatabase() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    
    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
        store.createIndex('url', 'url', { unique: false });
        store.createIndex('timestamp', 'timestamp', { unique: false });
        store.createIndex('domain', 'domain', { unique: false });
      }
    };
  });
}

// Get category for a domain
function getDomainCategory(domain) {
  for (const [category, domains] of Object.entries(DOMAIN_CATEGORIES)) {
    if (domains.some(d => domain.includes(d))) {
      return category;
    }
  }
  return 'other';
}

// Extract domain from URL
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.replace('www.', '');
  } catch {
    return 'unknown';
  }
}

// Store browsing data
async function storeBrowsingData(data) {
  const db = await initDatabase();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const record = {
      url: data.url,
      title: data.title || 'Untitled',
      timestamp: data.timestamp || Date.now(),
      content_snippet: data.content_snippet ? data.content_snippet.substring(0, 5000) : '',
      domain: extractDomain(data.url),
      category: getDomainCategory(extractDomain(data.url)),
      dwell_time: data.dwell_time || 0,
      entities: data.entities || []
    };
    
    const request = store.add(record);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Clean up old data (auto-purge)
async function purgeOldData() {
  const db = await initDatabase();
  const cutoffTime = Date.now() - (PURGE_DAYS * 24 * 60 * 60 * 1000);
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const range = IDBKeyRange.upperBound(cutoffTime);
    
    const request = index.openCursor(range);
    let deletedCount = 0;
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        store.delete(cursor.primaryKey);
        deletedCount++;
        cursor.continue();
      } else {
        console.log(`[TRAIL] Purged ${deletedCount} old records`);
        resolve(deletedCount);
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Listen for history updates
chrome.history.onVisited.addListener(async (historyItem) => {
  if (!historyItem.url || historyItem.url.startsWith('chrome://')) {
    return;
  }
  
  try {
    // Check if we already have this URL recently (within 5 minutes)
    const existing = await getRecentVisit(historyItem.url, 5 * 60 * 1000);
    if (existing) {
      return; // Skip duplicates within 5 minutes
    }
    
    // Store initial record (content will be updated by content script)
    await storeBrowsingData({
      url: historyItem.url,
      title: historyItem.title,
      timestamp: historyItem.lastVisitTime || Date.now()
    });
    
    console.log(`[TRAIL] Captured: ${historyItem.url}`);
  } catch (error) {
    console.error('[TRAIL] Error storing history:', error);
  }
});

// Check for recent visit
async function getRecentVisit(url, timeWindow) {
  const db = await initDatabase();
  const cutoff = Date.now() - timeWindow;
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('url');
    const request = index.openCursor(IDBKeyRange.only(url));
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        if (cursor.value.timestamp > cutoff) {
          resolve(cursor.value);
          return;
        }
        cursor.continue();
      } else {
        resolve(null);
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Update record with content from content script
async function updateRecordWithContent(url, contentData) {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('url');
    const request = index.openCursor(IDBKeyRange.only(url));
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        const record = cursor.value;
        record.content_snippet = contentData.content_snippet;
        record.title = contentData.title || record.title;
        record.entities = contentData.entities || [];
        
        const updateRequest = cursor.update(record);
        updateRequest.onsuccess = () => resolve();
        updateRequest.onerror = () => reject(updateRequest.error);
      } else {
        // No existing record, create new one
        storeBrowsingData({
          url: url,
          title: contentData.title,
          content_snippet: contentData.content_snippet,
          entities: contentData.entities,
          timestamp: Date.now()
        }).then(resolve).catch(reject);
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'CONTENT_EXTRACTED') {
    updateRecordWithContent(sender.tab.url, message.data)
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep message channel open for async
  }
  
  if (message.type === 'GET_HISTORY') {
    getHistoryData(message.timeRange)
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
  
  if (message.type === 'EXPORT_DATA') {
    exportAllData()
      .then(data => sendResponse({ success: true, data }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
  
  if (message.type === 'CLEAR_DATA') {
    clearAllData()
      .then(() => sendResponse({ success: true }))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
});

// Get history data with time range filter
async function getHistoryData(timeRange = 'all') {
  const db = await initDatabase();
  let cutoff = 0;
  
  const now = Date.now();
  switch (timeRange) {
    case '24h':
      cutoff = now - (24 * 60 * 60 * 1000);
      break;
    case '7d':
      cutoff = now - (7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      cutoff = now - (30 * 24 * 60 * 60 * 1000);
      break;
    default:
      cutoff = 0;
  }
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const index = store.index('timestamp');
    const range = IDBKeyRange.lowerBound(cutoff);
    
    const request = index.openCursor(range);
    const results = [];
    
    request.onsuccess = (event) => {
      const cursor = event.target.result;
      if (cursor) {
        results.push(cursor.value);
        cursor.continue();
      } else {
        resolve(results.sort((a, b) => a.timestamp - b.timestamp));
      }
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Export all data as JSON
async function exportAllData() {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    
    request.onsuccess = () => {
      const data = {
        export_date: new Date().toISOString(),
        version: '1.0.0',
        records: request.result,
        total_records: request.result.length
      };
      resolve(data);
    };
    
    request.onerror = () => reject(request.error);
  });
}

// Clear all data
async function clearAllData() {
  const db = await initDatabase();
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

// Initialize on install/update
chrome.runtime.onInstalled.addListener(() => {
  console.log('[TRAIL] Extension installed/updated');
  purgeOldData();
});

// Periodic cleanup (once per day)
setInterval(purgeOldData, 24 * 60 * 60 * 1000);

console.log('[TRAIL] THE GHOST is watching...');
