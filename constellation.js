// TRAIL Constellation Visualization with Favicon Stars
// Built by Wizardrytezch | github.com/CrazhHolmes

// Configuration
const CONFIG = {
  timeRanges: {
    '1h': 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    'all': Infinity
  }
};

// Current filter state
let currentFilter = 'all';

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  console.log('[TRAIL] DOM ready, initializing...');
  
  // Check if D3 is loaded
  if (typeof d3 === 'undefined') {
    console.error('[TRAIL] D3 not loaded! Checking path...');
    showLoadingError('D3 library not loaded. Please refresh.');
    return;
  }
  console.log('[TRAIL] D3 loaded:', d3.version);
  
  // Create background stars
  createStarField();
  
  // Start loading with timeout protection
  loadConstellationData();
  
  // Failsafe: Force demo data after 5 seconds if still loading
  setTimeout(() => {
    const loading = document.getElementById('loading');
    if (loading && loading.style.display !== 'none') {
      console.warn('[TRAIL] Loading timeout - forcing demo data');
      document.getElementById('loading').style.display = 'none';
      const demoData = getDemoData();
      document.getElementById('node-count').textContent = demoData.nodes.length;
      renderConstellation(demoData);
      setupTimeFilters();
      setupSearch();
    }
  }, 5000);
});

function createStarField() {
  const starField = document.getElementById('star-field');
  if (!starField) return;
  
  for (let i = 0; i < 150; i++) {
    const star = document.createElement('div');
    star.className = 'bg-star';
    star.style.left = Math.random() * 100 + '%';
    star.style.top = Math.random() * 100 + '%';
    star.style.width = Math.random() * 3 + 'px';
    star.style.height = star.style.width;
    star.style.animationDelay = Math.random() * 3 + 's';
    starField.appendChild(star);
  }
}

function showLoadingError(message) {
  const loading = document.getElementById('loading');
  if (loading) {
    loading.textContent = 'ERROR: ' + message;
    loading.style.color = '#ff6b6b';
  }
}

// Get favicon URL from DuckDuckGo (transparent PNGs)
function getFaviconUrl(domain) {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

// Get category-based color
function getNodeColor(visits, lastVisit, category) {
  const now = Date.now();
  const dayAgo = now - (24 * 60 * 60 * 1000);
  
  const categoryColors = {
    'tech': '#3b82f6',
    'social': '#ec4899',
    'news': '#f59e0b',
    'edu': '#10b981',
    'shopping': '#ef4444',
    'entertainment': '#8b5cf6',
    'finance': '#14b8a6',
    'other': '#45b7d1'
  };
  
  if (category && categoryColors[category]) {
    return categoryColors[category];
  }
  
  if (lastVisit > dayAgo) return '#96ceb4';
  if (visits >= 50) return '#ff6b6b';
  if (visits >= 10) return '#4ecdc4';
  return '#45b7d1';
}

// Node size based on visits
function getNodeSize(visits) {
  return Math.max(20, Math.min(40, 20 + Math.sqrt(visits || 1) * 4));
}

// Filter nodes by time range
function filterNodesByTime(nodes, range) {
  if (range === 'all') return nodes;
  const cutoff = Date.now() - CONFIG.timeRanges[range];
  return nodes.filter(n => n.lastVisit >= cutoff);
}

async function loadConstellationData() {
  try {
    console.log('[TRAIL] Loading constellation data...');
    let data = null;
    
    // Try to load from Chrome storage
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      try {
        const result = await Promise.race([
          chrome.storage.local.get(['trail_nodes', 'trail_links']),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Storage timeout')), 3000)
          )
        ]);
        
        console.log('[TRAIL] Storage result:', result);
        
        if (result && result.trail_nodes && result.trail_nodes.length > 0) {
          data = { 
            nodes: result.trail_nodes || [], 
            links: result.trail_links || [] 
          };
        }
      } catch (storageErr) {
        console.warn('[TRAIL] Storage access failed:', storageErr.message);
      }
    } else {
      console.log('[TRAIL] Chrome storage not available');
    }
    
    // Use demo data if no storage data
    if (!data || data.nodes.length === 0) {
      console.log('[TRAIL] Using demo data');
      data = getDemoData();
    }
    
    console.log(`[TRAIL] Loaded ${data.nodes.length} nodes, ${data.links.length} links`);
    
    // Hide loading
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'none';
    
    // Update node count
    const nodeCountEl = document.getElementById('node-count');
    if (nodeCountEl) nodeCountEl.textContent = data.nodes.length;
    
    // Store and render
    window.fullConstellationData = data;
    renderConstellation(data);
    setupTimeFilters();
    setupSearch();
    
    console.log('[TRAIL] Constellation initialized successfully');
    
  } catch (err) {
    console.error('[TRAIL] Critical error:', err);
    
    // Emergency fallback
    const loadingEl = document.getElementById('loading');
    if (loadingEl) loadingEl.style.display = 'none';
    
    const demoData = getDemoData();
    const nodeCountEl = document.getElementById('node-count');
    if (nodeCountEl) nodeCountEl.textContent = demoData.nodes.length;
    
    window.fullConstellationData = demoData;
    renderConstellation(demoData);
    setupTimeFilters();
    setupSearch();
  }
}

function getDemoData() {
  console.log('[TRAIL] Generating demo data');
  return {
    nodes: [
      { id: 'github.com', domain: 'github.com', visitCount: 45, lastVisit: Date.now(), firstVisit: Date.now() - 7*24*60*60*1000, category: 'tech' },
      { id: 'stackoverflow.com', domain: 'stackoverflow.com', visitCount: 32, lastVisit: Date.now() - 3600000, firstVisit: Date.now() - 5*24*60*60*1000, category: 'tech' },
      { id: 'google.com', domain: 'google.com', visitCount: 120, lastVisit: Date.now() - 60000, firstVisit: Date.now() - 30*24*60*60*1000, category: 'tech' },
      { id: 'reddit.com', domain: 'reddit.com', visitCount: 25, lastVisit: Date.now() - 1800000, firstVisit: Date.now() - 10*24*60*60*1000, category: 'social' },
      { id: 'youtube.com', domain: 'youtube.com', visitCount: 60, lastVisit: Date.now() - 900000, firstVisit: Date.now() - 14*24*60*60*1000, category: 'entertainment' },
      { id: 'twitter.com', domain: 'twitter.com', visitCount: 15, lastVisit: Date.now() - 7200000, firstVisit: Date.now() - 3*24*60*60*1000, category: 'social' },
      { id: 'netflix.com', domain: 'netflix.com', visitCount: 8, lastVisit: Date.now() - 86400000, firstVisit: Date.now() - 21*24*60*60*1000, category: 'entertainment' },
      { id: 'amazon.com', domain: 'amazon.com', visitCount: 12, lastVisit: Date.now() - 43200000, firstVisit: Date.now() - 14*24*60*60*1000, category: 'shopping' },
      { id: 'docs.google.com', domain: 'docs.google.com', visitCount: 28, lastVisit: Date.now() - 14400000, firstVisit: Date.now() - 10*24*60*60*1000, category: 'tech' }
    ],
    links: [
      { source: 'github.com', target: 'stackoverflow.com' },
      { source: 'google.com', target: 'github.com' },
      { source: 'reddit.com', target: 'youtube.com' },
      { source: 'google.com', target: 'reddit.com' },
      { source: 'twitter.com', target: 'reddit.com' },
      { source: 'youtube.com', target: 'netflix.com' },
      { source: 'google.com', target: 'amazon.com' },
      { source: 'docs.google.com', target: 'github.com' }
    ]
  };
}

function renderConstellation(data) {
  console.log('[TRAIL] Rendering constellation...');
  
  const width = window.innerWidth;
  const height = window.innerHeight;
  const centerX = width / 2;
  const centerY = height / 2;
  
  // Clear previous
  d3.select('#constellation-svg').selectAll('*').remove();
  
  const svg = d3.select('#constellation-svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', [0, 0, width, height]);
  
  // Add gradient definition for lines
  const defs = svg.append('defs');
  const gradient = defs.append('linearGradient')
    .attr('id', 'line-gradient')
    .attr('gradientUnits', 'userSpaceOnUse');
  gradient.append('stop').attr('offset', '0%').attr('stop-color', '#667eea').attr('stop-opacity', 0.6);
  gradient.append('stop').attr('offset', '100%').attr('stop-color', '#764ba2').attr('stop-opacity', 0.3);
  
  const g = svg.append('g');
  
  // Setup zoom
  const zoom = d3.zoom()
    .scaleExtent([0.1, 4])
    .on('zoom', (event) => {
      g.attr('transform', event.transform);
    });
  svg.call(zoom);
  
  // Prepare nodes with initial positions
  const nodes = data.nodes.map((d, i) => {
    const nodeId = d.id || d.domain || `node-${i}`;
    const angle = (i / Math.max(data.nodes.length, 1)) * 2 * Math.PI;
    const radius = Math.min(width, height) * 0.25;
    
    return {
      ...d,
      id: nodeId,
      x: typeof d.x === 'number' ? d.x : centerX + Math.cos(angle) * radius,
      y: typeof d.y === 'number' ? d.y : centerY + Math.sin(angle) * radius,
      vx: 0,
      vy: 0,
      color: getNodeColor(d.visitCount || 1, d.lastVisit || 0, d.category),
      radius: getNodeSize(d.visitCount || 1),
      faviconUrl: getFaviconUrl(d.domain)
    };
  });
  
  // Prepare links
  const links = data.links.map((d, i) => {
    const sourceId = typeof d.source === 'string' ? d.source : (d.source?.id || d.source);
    const targetId = typeof d.target === 'string' ? d.target : (d.target?.id || d.target);
    
    const sourceNode = nodes.find(n => n.id === sourceId || n.domain === sourceId);
    const targetNode = nodes.find(n => n.id === targetId || n.domain === targetId);
    
    if (!sourceNode || !targetNode) {
      console.warn(`[TRAIL] Link ${i}: could not find nodes for ${sourceId} -> ${targetId}`);
    }
    
    return {
      source: sourceNode || sourceId,
      target: targetNode || targetId,
      strength: d.strength || 1
    };
  }).filter(l => typeof l.source === 'object' && typeof l.target === 'object');
  
  console.log(`[TRAIL] Prepared ${nodes.length} nodes, ${links.length} valid links`);
  
  // Create simulation
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(120))
    .force('charge', d3.forceManyBody().strength(-500))
    .force('center', d3.forceCenter(centerX, centerY))
    .force('collision', d3.forceCollide().radius(d => d.radius + 10))
    .alpha(1)
    .alphaDecay(0.02)
    .alphaMin(0.001);
  
  // Draw links
  const link = g.append('g')
    .attr('class', 'links')
    .selectAll('line')
    .data(links)
    .join('line')
    .attr('class', 'constellation-line')
    .attr('stroke', 'url(#line-gradient)')
    .attr('stroke-width', 2)
    .attr('opacity', 0.6);
  
  // Create node groups
  const nodeGroup = g.append('g')
    .attr('class', 'nodes')
    .selectAll('g')
    .data(nodes)
    .join('g')
    .attr('class', 'node-group')
    .style('cursor', 'pointer');
  
  // Drag behavior
  const dragBehavior = d3.drag()
    .on('start', (event, d) => {
      if (!event.active) simulation.alphaTarget(0.3).restart();
      d.fx = d.x;
      d.fy = d.y;
    })
    .on('drag', (event, d) => {
      d.fx = event.x;
      d.fy = event.y;
    })
    .on('end', (event, d) => {
      if (!event.active) simulation.alphaTarget(0);
      d.fx = null;
      d.fy = null;
    });
  
  nodeGroup.call(dragBehavior);
  
  // Glow effect
  nodeGroup.append('circle')
    .attr('class', 'node-glow')
    .attr('r', d => d.radius + 4)
    .attr('fill', 'none')
    .attr('stroke', d => d.color)
    .attr('stroke-width', 3)
    .attr('opacity', 0.6)
    .style('filter', d => `drop-shadow(0 0 ${d.radius/2}px ${d.color})`);
  
  // Background circle
  nodeGroup.append('circle')
    .attr('class', 'node-bg')
    .attr('r', d => d.radius - 2)
    .attr('fill', '#0a0a0f')
    .attr('stroke', 'none');
  
  // Favicon image
  nodeGroup.each(function(d) {
    const node = d3.select(this);
    const size = d.radius * 2 - 4;
    const clipId = `clip-${String(d.id).replace(/[^a-zA-Z0-9]/g, '-')}`;
    
    defs.append('clipPath')
      .attr('id', clipId)
      .append('circle')
      .attr('r', d.radius - 2);
    
    const img = node.append('image')
      .attr('class', 'node-favicon')
      .attr('href', d.faviconUrl)
      .attr('width', size)
      .attr('height', size)
      .attr('x', -(d.radius - 2))
      .attr('y', -(d.radius - 2))
      .attr('clip-path', `url(#${clipId})`)
      .style('filter', 'contrast(1.1) brightness(1.05)');
    
    img.on('error', function() {
      d3.select(this).style('display', 'none');
      node.append('circle')
        .attr('class', 'node-fallback')
        .attr('r', d.radius - 4)
        .attr('fill', d.color);
    });
  });
  
  // Visit count badge
  nodeGroup.append('circle')
    .attr('class', 'visit-badge-bg')
    .attr('cx', d => d.radius * 0.6)
    .attr('cy', d => -d.radius * 0.6)
    .attr('r', 10)
    .attr('fill', d => d.color)
    .attr('stroke', '#0a0a0f')
    .attr('stroke-width', 2);
  
  nodeGroup.append('text')
    .attr('class', 'visit-badge-text')
    .attr('x', d => d.radius * 0.6)
    .attr('y', d => -d.radius * 0.6 + 4)
    .attr('text-anchor', 'middle')
    .style('fill', '#fff')
    .style('font-size', '10px')
    .style('font-weight', 'bold')
    .style('pointer-events', 'none')
    .text(d => Math.min(99, d.visitCount || 1));
  
  // Domain label
  nodeGroup.append('text')
    .attr('class', 'node-label')
    .attr('dy', d => d.radius + 20)
    .attr('text-anchor', 'middle')
    .style('fill', '#fff')
    .style('font-size', '12px')
    .style('font-weight', '500')
    .style('text-shadow', '0 2px 4px rgba(0,0,0,0.9)')
    .style('opacity', 0)
    .style('pointer-events', 'none')
    .text(d => d.domain.length > 22 ? d.domain.substring(0, 20) + '...' : d.domain);
  
  // Interactions
  nodeGroup
    .on('mouseenter', function(event, d) {
      d3.select(this).transition().duration(200)
        .attr('transform', `translate(${d.x},${d.y}) scale(1.15)`);
      d3.select(this).select('.node-label').transition().duration(200)
        .style('opacity', 1);
    })
    .on('mouseleave', function(event, d) {
      d3.select(this).transition().duration(200)
        .attr('transform', `translate(${d.x},${d.y}) scale(1)`);
      d3.select(this).select('.node-label').transition().duration(200)
        .style('opacity', 0);
    })
    .on('click', (event, d) => {
      event.stopPropagation();
      showNodeInfo(d, nodes, links);
    });
  
  // Update positions
  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);
    
    nodeGroup.attr('transform', d => `translate(${d.x},${d.y})`);
  });
  
  svg.on('click', () => closePanel());
  
  window.constellationSimulation = simulation;
  window.constellationNodes = nodes;
  window.constellationLinks = links;
  
  console.log('[TRAIL] Constellation rendered successfully');
  simulation.alpha(1).restart();
}

// Setup time filter buttons
function setupTimeFilters() {
  const filters = document.querySelectorAll('.time-filter');
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      filters.forEach(f => f.classList.remove('active'));
      btn.classList.add('active');
      
      const range = btn.dataset.range;
      currentFilter = range;
      
      if (window.fullConstellationData) {
        const filtered = {
          nodes: filterNodesByTime(window.fullConstellationData.nodes, range),
          links: window.fullConstellationData.links
        };
        renderConstellation(filtered);
      }
    });
  });
}

// Setup search functionality
function setupSearch() {
  const searchInput = document.getElementById('search-constellation');
  if (!searchInput) return;
  
  searchInput.addEventListener('input', (e) => {
    const term = e.target.value.toLowerCase();
    
    if (!window.fullConstellationData) return;
    
    if (term === '') {
      renderConstellation(window.fullConstellationData);
      return;
    }
    
    const filtered = {
      nodes: window.fullConstellationData.nodes.filter(n => 
        n.domain.toLowerCase().includes(term)
      ),
      links: window.fullConstellationData.links.filter(l => {
        const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
        const targetId = typeof l.target === 'string' ? l.target : l.target.id;
        const source = window.fullConstellationData.nodes.find(n => n.id === sourceId || n.domain === sourceId);
        const target = window.fullConstellationData.nodes.find(n => n.id === targetId || n.domain === targetId);
        return source && target && 
          (source.domain.toLowerCase().includes(term) || 
           target.domain.toLowerCase().includes(term));
      })
    };
    
    renderConstellation(filtered);
  });
}

// Export constellation as PNG
function exportConstellation() {
  const svg = document.getElementById('constellation-svg');
  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();
  
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  img.onload = () => {
    ctx.drawImage(img, 0, 0);
    const pngFile = canvas.toDataURL('image/png');
    const downloadLink = document.createElement('a');
    downloadLink.download = `trail-constellation-${Date.now()}.png`;
    downloadLink.href = pngFile;
    downloadLink.click();
  };
  
  img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
}

function showNodeInfo(node, allNodes, allLinks) {
  const panel = document.getElementById('info-panel');
  if (!panel) return;
  
  const connected = allLinks.filter(l => {
    const sourceId = l.source.id || l.source;
    const targetId = l.target.id || l.target;
    return sourceId === node.id || targetId === node.id;
  });
  
  const connectedDomains = connected.map(l => {
    const sourceId = l.source.id || l.source;
    const targetId = l.target.id || l.target;
    const otherId = sourceId === node.id ? targetId : sourceId;
    const otherNode = allNodes.find(n => n.id === otherId);
    return otherNode ? otherNode.domain : otherId;
  });
  
  const panelDomain = document.getElementById('panel-domain');
  if (panelDomain) {
    panelDomain.innerHTML = `
      <img src="${getFaviconUrl(node.domain)}" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px; border-radius: 4px;" onerror="this.style.display='none'">
      ${node.domain}
    `;
  }
  
  const panelVisits = document.getElementById('panel-visits');
  if (panelVisits) panelVisits.textContent = node.visitCount || 1;
  
  const panelFirst = document.getElementById('panel-first');
  if (panelFirst) panelFirst.textContent = formatDate(node.firstVisit);
  
  const panelLast = document.getElementById('panel-last');
  if (panelLast) panelLast.textContent = formatDate(node.lastVisit);
  
  const panelConnections = document.getElementById('panel-connections');
  if (panelConnections) panelConnections.textContent = connected.length;
  
  const linksContainer = document.getElementById('panel-links');
  if (linksContainer) {
    linksContainer.innerHTML = '';
    
    if (connectedDomains.length === 0) {
      linksContainer.innerHTML = '<div style="color: #666688;">No connections</div>';
    } else {
      connectedDomains.forEach(domain => {
        const div = document.createElement('div');
        div.className = 'connection-item';
        div.style.cssText = `border-left: 2px solid ${node.color}; padding: 8px 12px; margin-bottom: 6px; cursor: pointer; background: rgba(255,255,255,0.03); border-radius: 0 6px 6px 0; display: flex; align-items: center; gap: 8px; font-size: 13px;';
        div.innerHTML = `
          <img src="${getFaviconUrl(domain)}" style="width: 16px; height: 16px; border-radius: 2px;" onerror="this.style.display='none'">
          <span>${domain}</span>
        `;
        div.onclick = () => {
          const targetNode = allNodes.find(n => n.domain === domain);
          if (targetNode) showNodeInfo(targetNode, allNodes, allLinks);
        };
        linksContainer.appendChild(div);
      });
    }
  }
  
  panel.classList.add('active');
}

function closePanel() {
  const panel = document.getElementById('info-panel');
  if (panel) panel.classList.remove('active');
}

function formatDate(timestamp) {
  if (!timestamp) return 'Unknown';
  const date = new Date(timestamp);
  const diff = Date.now() - date;
  if (diff < 60000) return 'Just now';
  if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
  if (diff < 86400000) return Math.floor(diff/3600000) + 'h ago';
  if (diff < 604800000) return Math.floor(diff/86400000) + 'd ago';
  return date.toLocaleDateString();
}

// Expose emergency functions to console
window.forceLoadDemo = function() {
  console.log('[TRAIL] Force loading demo data');
  document.getElementById('loading').style.display = 'none';
  const demoData = getDemoData();
  document.getElementById('node-count').textContent = demoData.nodes.length;
  renderConstellation(demoData);
  setupTimeFilters();
  setupSearch();
};
