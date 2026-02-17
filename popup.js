// TRAIL Popup Control Center
// Built by Wizardrytezch | github.com/CrazhHolmes

// Generate random stars for background
function createBackgroundStars() {
  const container = document.getElementById('stars');
  for (let i = 0; i < 30; i++) {
    const star = document.createElement('div');
    star.className = 'star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.animationDelay = Math.random() * 3 + 's';
    star.style.opacity = Math.random() * 0.5 + 0.2;
    container.appendChild(star);
  }
}

// Get favicon URL
function getFaviconUrl(domain) {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

// Format domain name
function formatDomain(domain) {
  return domain.replace(/^www\./, '').split('.')[0];
}

// Animate number counting
function animateValue(id, start, end, duration) {
  const obj = document.getElementById(id);
  if (!obj) return;
  
  const range = end - start;
  const increment = range / (duration / 16);
  let current = start;
  
  const timer = setInterval(() => {
    current += increment;
    if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
      current = end;
      clearInterval(timer);
    }
    obj.textContent = Math.floor(current);
  }, 16);
}

// Load and display stats
async function loadStats() {
  try {
    // Get data from storage
    const result = await chrome.storage.local.get(['trail_nodes', 'trail_links']);
    const nodes = result.trail_nodes || [];
    const links = result.trail_links || [];
    
    // Count today's visits
    const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
    const todayVisits = nodes.filter(n => n.lastVisit > dayAgo).length;
    
    // Animate stats
    animateValue('stat-stars', 0, nodes.length, 800);
    animateValue('stat-links', 0, links.length, 800);
    animateValue('stat-today', 0, todayVisits, 800);
    
    // Find top domain
    if (nodes.length > 0) {
      const topNode = nodes.reduce((max, n) => n.visitCount > max.visitCount ? n : max, nodes[0]);
      document.getElementById('top-domain').textContent = formatDomain(topNode.domain);
      document.getElementById('top-favicon').src = getFaviconUrl(topNode.domain);
    } else {
      document.getElementById('top-domain').textContent = 'None';
      document.getElementById('top-favicon').src = '';
    }
    
    // Load recent stars
    loadRecentStars(nodes);
    
  } catch (err) {
    console.error('Error loading stats:', err);
    document.getElementById('stat-stars').textContent = '?';
    document.getElementById('stat-links').textContent = '?';
  }
}

// Load recent stars
function loadRecentStars(nodes) {
  const container = document.getElementById('recent-stars');
  container.innerHTML = '';
  
  // Sort by last visit, take top 5
  const recent = [...nodes]
    .sort((a, b) => b.lastVisit - a.lastVisit)
    .slice(0, 5);
  
  if (recent.length === 0) {
    container.innerHTML = '<div style="color: #555; font-size: 12px;">No recent sites</div>';
    return;
  }
  
  recent.forEach(node => {
    const item = document.createElement('div');
    item.className = 'recent-item';
    item.innerHTML = `
      <img class="recent-favicon" src="${getFaviconUrl(node.domain)}" 
           onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
      <div style="width: 28px; height: 28px; border-radius: 6px; background: linear-gradient(135deg, #667eea, #764ba2); display: none; align-items: center; justify-content: center; font-size: 14px;">◉</div>
      <span class="recent-domain">${formatDomain(node.domain)}</span>
    `;
    
    // Click to open site
    item.addEventListener('click', () => {
      chrome.tabs.create({ url: `https://${node.domain}` });
      window.close();
    });
    
    container.appendChild(item);
  });
}

// Update time display
function updateTime() {
  const now = new Date();
  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  document.getElementById('update-time').textContent = `Updated ${timeStr}`;
}

// Initialize
function init() {
  createBackgroundStars();
  loadStats();
  updateTime();
  
  // Open constellation map button
  document.getElementById('open-map').addEventListener('click', () => {
    chrome.tabs.create({ url: chrome.runtime.getURL('constellation.html') });
    window.close();
  });
  
  // Settings icon click
  document.querySelector('.settings-icon').addEventListener('click', () => {
    chrome.runtime.openOptionsPage?.() || alert('Settings coming soon!');
  });
}

// Run when DOM ready
document.addEventListener('DOMContentLoaded', init);
