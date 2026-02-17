// TRAIL Background Script
// Tracks browsing history and builds constellation data

// Category detection based on domain/URL patterns
const CATEGORY_PATTERNS = {
  tech: [
    /github\.com/i, /stackoverflow\.com/i, /gitlab\.com/i, /bitbucket\.org/i,
    /developer\.mozilla\.org/i, /docs\.google\.com/i, /codepen\.io/i,
    /jsfiddle\.net/i, /repl\.it/i, /codesandbox\.io/i, /stackblitz\.com/i,
    /npmjs\.com/i, /pypi\.org/i, /mvnrepository\.com/i, /nuget\.org/i,
    /docker\.com/i, /kubernetes\.io/i, /aws\.amazon\.com/i, /azure\.microsoft\.com/i,
    /cloud\.google\.com/i, /heroku\.com/i, /vercel\.com/i, /netlify\.com/i,
    /jetbrains\.com/i, /visualstudio\.com/i, /vscode\.dev/i, /atom\.io/i,
    /sublimetext\.com/i, /vim\.org/i, /neovim\.io/i, /emacs\.org/i,
    /mdn\.web\.docs/i, /w3schools\.com/i, /freecodecamp\.org/i, /codecademy\.com/i,
    /coursera\.org/i, /udemy\.com/i, /udacity\.com/i, /edx\.org/i,
    /pluralsight\.com/i, /linkedin\.com\/learning/i, /skillshare\.com/i,
    /hackerrank\.com/i, /leetcode\.com/i, /codewars\.com/i, /exercism\.org/i
  ],
  social: [
    /reddit\.com/i, /twitter\.com/i, /x\.com/i, /facebook\.com/i, /instagram\.com/i,
    /linkedin\.com/i, /tiktok\.com/i, /snapchat\.com/i, /pinterest\.com/i,
    /tumblr\.com/i, /discord\.com/i, /slack\.com/i, /telegram\.org/i,
    /whatsapp\.com/i, /signal\.org/i, /mastodon\.social/i, /bluesky\.web/i,
    /threads\.net/i, /youtube\.com\/community/i, /youtube\.com\/channel/i
  ],
  news: [
    /news\.google\.com/i, /cnn\.com/i, /bbc\.com/i, /nytimes\.com/i,
    /washingtonpost\.com/i, /guardian\.com/i, /reuters\.com/i, /apnews\.com/i,
    /npr\.org/i, /pbs\.org/i, /aljazeera\.com/i, /ft\.com/i,
    /economist\.com/i, /bloomberg\.com/i, /wsj\.com/i, /techcrunch\.com/i,
    /theverge\.com/i, /wired\.com/i, /arstechnica\.com/i, /engadget\.com/i,
    /gizmodo\.com/i, /slashdot\.org/i, /hackernews\.iitty/i, /lobste\.rs/i,
    /news\.ycombinator\.com/i, /producthunt\.com/i
  ],
  entertainment: [
    /youtube\.com/i, /netflix\.com/i, /twitch\.tv/i, /spotify\.com/i,
    /soundcloud\.com/i, /bandcamp\.com/i, /apple\.music/i, /music\.youtube\.com/i,
    /hulu\.com/i, /disney\.plus/i, /hbo\.max/i, /primevideo\.com/i,
    /crunchyroll\.com/i, /funimation\.com/i, /vrv\.co/i, /tubi\.tv/i,
    /peacocktv\.com/i, /paramount\.plus/i, /roku\.com/i, /imdb\.com/i,
    /rottentomatoes\.com/i, /letterboxd\.com/i, /goodreads\.com/i,
    /fanfiction\.net/i, /archiveofourown\.org/i, /wattpad\.com/i
  ],
  shopping: [
    /amazon\.com/i, /ebay\.com/i, /etsy\.com/i, /shopify\.com/i,
    /aliexpress\.com/i, /taobao\.com/i, /alibaba\.com/i, /wish\.com/i,
    /target\.com/i, /walmart\.com/i, /bestbuy\.com/i, /costco\.com/i,
    /homedepot\.com/i, /lowes\.com/i, /ikea\.com/i, /wayfair\.com/i,
    /asos\.com/i, /zappos\.com/i, /nike\.com/i, /adidas\.com/i,
    /shein\.com/i, /fashionnova\.com/i, /revolve\.com/i, /ssense\.com/i,
    /grailed\.com/i, /stockx\.com/i, /goat\.com/i, /depop\.com/i
  ],
  finance: [
    /paypal\.com/i, /stripe\.com/i, /venmo\.com/i, /cash\.app/i,
    /robinhood\.com/i, /coinbase\.com/i, /binance\.com/i, /kraken\.com/i,
    /fidelity\.com/i, /vanguard\.com/i, /schwab\.com/i, /etrade\.com/i,
    /mint\.intuit\.com/i, /creditkarma\.com/i, /nerdwallet\.com/i,
    /bankofamerica\.com/i, /chase\.com/i, /wellsfargo\.com/i,
    /citi\.com/i, /capitalone\.com/i, /discover\.com/i, /americanexpress\.com/i
  ],
  edu: [
    /\.edu$/i, /coursera\.org/i, /khanacademy\.org/i, /duolingo\.com/i,
    /udemy\.com/i, /edx\.org/i, /mit\.opencourseware/i, /harvard\.edu/i,
    /stanford\.edu/i, /yale\.edu/i, /princeton\.edu/i, /berkeley\.edu/i,
    /quizlet\.com/i, /chegg\.com/i, /brainly\.com/i, /sparknotes\.com/i,
    /cliffsnotes\.com/i, /gradesaver\.com/i, /scholar\.google\.com/i,
    /jstor\.org/i, /researchgate\.net/i, /academia\.edu/i, /arxiv\.org/i
  ]
};

function detectCategory(domain, url) {
  for (const [category, patterns] of Object.entries(CATEGORY_PATTERNS)) {
    for (const pattern of patterns) {
      if (pattern.test(domain) || pattern.test(url)) {
        return category;
      }
    }
  }
  return 'other';
}

// Initialize storage
chrome.runtime.onInstalled.addListener(async () => {
  await chrome.storage.local.set({
    trail_nodes: [],
    trail_links: [],
    trail_sessions: [],
    last_update: Date.now()
  });
  console.log('✦ TRAIL initialized');
});

// Track active tab for session timing
let activeTabId = null;
let activeTabStartTime = null;

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  // End previous session
  if (activeTabId && activeTabStartTime) {
    await endSession(activeTabId, activeTabStartTime);
  }
  
  // Start new session
  activeTabId = activeTabId;
  activeTabStartTime = Date.now();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url && tab.url.startsWith('http')) {
    updateConstellationData(tab.url, tab.title, tab.favIconUrl);
  }
});

chrome.tabs.onRemoved.addListener(async (tabId, removeInfo) => {
  if (tabId === activeTabId && activeTabStartTime) {
    await endSession(tabId, activeTabStartTime);
    activeTabId = null;
    activeTabStartTime = null;
  }
});

async function endSession(tabId, startTime) {
  const duration = Date.now() - startTime;
  if (duration > 5000) { // Only track sessions > 5 seconds
    try {
      const tab = await chrome.tabs.get(tabId);
      if (tab && tab.url && tab.url.startsWith('http')) {
        const url = new URL(tab.url);
        const domain = url.hostname.replace(/^www\./, '');
        
        const { trail_sessions = [] } = await chrome.storage.local.get(['trail_sessions']);
        trail_sessions.push({
          domain,
          startTime,
          duration,
          url: tab.url
        });
        
        // Keep only last 1000 sessions
        if (trail_sessions.length > 1000) {
          trail_sessions.shift();
        }
        
        await chrome.storage.local.set({ trail_sessions });
      }
    } catch (e) {
      // Tab may not exist
    }
  }
}

async function updateConstellationData(url, title, favIconUrl) {
  try {
    const urlObj = new URL(url);
    const domain = urlObj.hostname.replace(/^www\./, '');
    const category = detectCategory(domain, url);
    const now = Date.now();
    
    const { trail_nodes = [], trail_links = [] } = await chrome.storage.local.get(['trail_nodes', 'trail_links']);
    
    // Find or create node
    let nodeIndex = trail_nodes.findIndex(n => n.domain === domain);
    if (nodeIndex === -1) {
      trail_nodes.push({
        id: domain,
        domain,
        visitCount: 1,
        firstVisit: now,
        lastVisit: now,
        category,
        title: title || domain
      });
    } else {
      trail_nodes[nodeIndex].visitCount = (trail_nodes[nodeIndex].visitCount || 0) + 1;
      trail_nodes[nodeIndex].lastVisit = now;
      trail_nodes[nodeIndex].category = category;
      if (title) trail_nodes[nodeIndex].title = title;
    }
    
    // Find recent connections (within 10 min)
    const recentNodes = trail_nodes.filter(n => 
      n.domain !== domain && 
      now - n.lastVisit < 600000
    );
    
    // Create links to recent nodes
    recentNodes.forEach(recentNode => {
      const existingLink = trail_links.find(l => 
        (l.source === domain && l.target === recentNode.domain) ||
        (l.source === recentNode.domain && l.target === domain)
      );
      
      if (!existingLink) {
        trail_links.push({
          source: domain,
          target: recentNode.domain,
          strength: 1,
          firstConnection: now
        });
      } else {
        existingLink.strength = (existingLink.strength || 1) + 1;
      }
    });
    
    await chrome.storage.local.set({
      trail_nodes,
      trail_links,
      last_update: now
    });
    
  } catch (e) {
    console.error('TRAIL error:', e);
  }
}

// Handle messages from popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'openConstellation') {
    chrome.tabs.create({ url: chrome.runtime.getURL('constellation.html') });
  }
  if (request.action === 'getData') {
    chrome.storage.local.get(['trail_nodes', 'trail_links', 'last_update']).then(data => {
      sendResponse(data);
    });
    return true; // Keep channel open for async
  }
  if (request.action === 'clearData') {
    chrome.storage.local.set({
      trail_nodes: [],
      trail_links: [],
      trail_sessions: [],
      last_update: Date.now()
    }).then(() => {
      sendResponse({ success: true });
    });
    return true;
  }
});
