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

// Background stars
const starField = document.getElementById('star-field');
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

// Get favicon URL from DuckDuckGo (transparent PNGs)
function getFaviconUrl(domain) {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

// Get category-based color
function getNodeColor(visits, lastVisit, category) {
  const now = Date.now();
  const dayAgo = now - (24 * 60 * 60 * 1000);
  
  // Category colors take precedence for known categories
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
  
  // Fallback to time/recency based
  if (lastVisit > dayAgo) return '#96ceb4';
  if (visits >= 50) return '#ff6b6b';
  if (visits >= 10) return '#4ecdc4';
  return '#45b7d1';
}

// Node size based on visits (larger minimum for favicon visibility)
function getNodeSize(visits) {
  return Math.max(20, Math.min(40, 20 + Math.sqrt(visits || 1) * 4));
}

// Filter nodes by time range
function filterNodesByTime(nodes, range) {
  if (range === 'all') return nodes;
  const cutoff = Date.now() - CONFIG.timeRanges[range];
  return nodes.filter(n => n.lastVisit >= cutoff);
}

// Create shooting star animation
function createShootingStar(targetNode) {
  const svg = d3.select('#constellation-svg');
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Start from random edge position
  const startX = Math.random() < 0.5 ? 0 : width;
  const startY = Math.random() * height;
  
  const trail = svg.append('line')
    .attr('class', 'shooting-star')
    .attr('x1', startX)
    .attr('y1', startY)
    .attr('x2', startX)
    .attr('y2', startY)
    .attr('stroke', '#ffd700')
    .attr('stroke-width', 2)
    .attr('opacity', 0.8);
  
  // Animate to target
  trail.transition()
    .duration(1000)
    .ease(d3.easeQuadOut)
    .attr('x2', targetNode.x || width/2)
    .attr('y2', targetNode.y || height/2)
    .attr('opacity', 0)
    .remove();
}

async function loadConstellationData() {
  try {
    let data;
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      const result = await chrome.storage.local.get(['trail_nodes', 'trail_links']);
      data = { nodes: result.trail_nodes || [], links: result.trail_links || [] };
    } else {
      data = getDemoData();
    }
    
    document.getElementById('loading').style.display = 'none';
    
    if (!data.nodes || data.nodes.length === 0) {
      d3.select('#constellation-svg').append('text')
        .attr('x', window.innerWidth / 2)
        .attr('y', window.innerHeight / 2)
        .attr('text-anchor', 'middle')
        .style('fill', '#444466')
        .style('font-size', '20px')
        .text('No data yet. Browse to map the cosmos.');
      return;
    }
    
    // Store full data for filtering
    window.fullConstellationData = data;
    
    document.getElementById('node-count').textContent = data.nodes.length;
    renderConstellation(data);
    
    // Setup time filter buttons
    setupTimeFilters();
    
    // Setup search
    setupSearch();
    
  } catch (err) {
    console.error('Error:', err);
    document.getElementById('loading').textContent = 'ERROR LOADING COSMOS';
  }
}

function getDemoData() {
  return {
    nodes: [
      { id: 'github.com', domain: 'github.com', visitCount: 45, lastVisit: Date.now(), firstVisit: Date.now() - 7*24*60*60*1000, category: 'tech' },
      { id: 'stackoverflow.com', domain: 'stackoverflow.com', visitCount: 32, lastVisit: Date.now() - 3600000, firstVisit: Date.now() - 5*24*60*60*1000, category: 'tech' },
      { id: 'google.com', domain: 'google.com', visitCount: 120, lastVisit: Date.now() - 60000, firstVisit: Date.now() - 30*24*60*60*1000, category: 'tech' },
      { id: 'reddit.com', domain: 'reddit.com', visitCount: 25, lastVisit: Date.now() - 1800000, firstVisit: Date.now() - 10*24*60*60*1000, category: 'social' },
      { id: 'youtube.com', domain: 'youtube.com', visitCount: 60, lastVisit: Date.now() - 900000, firstVisit: Date.now() - 14*24*60*60*1000, category: 'entertainment' }
    ],
    links: [
      { source: 'github.com', target: 'stackoverflow.com' },
      { source: 'google.com', target: 'github.com' },
      { source: 'reddit.com', target: 'youtube.com' },
      { source: 'google.com', target: 'reddit.com' }
    ]
  };
}

function renderConstellation(data) {
  const width = window.innerWidth;
  const height = window.innerHeight;
  
  // Clear previous
  d3.select('#constellation-svg').selectAll('*').remove();
  
  const svg = d3.select('#constellation-svg')
    .attr('viewBox', [0, 0, width, height]);
  
  // Add gradient definition for lines
  const defs = svg.append('defs');
  const gradient = defs.append('linearGradient')
    .attr('id', 'line-gradient')
    .attr('gradientUnits', 'userSpaceOnUse');
  gradient.append('stop').attr('offset', '0%').attr('stop-color', '#667eea').attr('stop-opacity', 0.6);
  gradient.append('stop').attr('offset', '100%').attr('stop-color', '#764ba2').attr('stop-opacity', 0.3);
  
  const g = svg.append('g');
  
  const zoom = d3.zoom().scaleExtent([0.1, 4]).on('zoom', (event) => {
    g.attr('transform', event.transform);
  });
  svg.call(zoom);
  
  // Prepare nodes with favicon URLs
  const nodes = data.nodes.map(d => ({
    ...d,
    color: getNodeColor(d.visitCount || 1, d.lastVisit || 0, d.category),
    radius: getNodeSize(d.visitCount || 1),
    faviconUrl: getFaviconUrl(d.domain)
  }));
  
  const links = data.links.map(d => ({ 
    source: typeof d.source === 'string' ? nodes.find(n => n.id === d.source) : d.source,
    target: typeof d.target === 'string' ? nodes.find(n => n.id === d.target) : d.target
  })).filter(l => l.source && l.target);
  
  const simulation = d3.forceSimulation(nodes)
    .force('link', d3.forceLink(links).id(d => d.id).distance(150))
    .force('charge', d3.forceManyBody().strength(-400))
    .force('center', d3.forceCenter(width / 2, height / 2))
    .force('collision', d3.forceCollide().radius(d => d.radius + 15));
  
  // Draw constellation lines with gradient
  const link = g.append('g').selectAll('line').data(links).join('line')
    .attr('class', 'constellation-line')
    .attr('stroke', 'url(#line-gradient)')
    .attr('stroke-width', 2)
    .attr('opacity', 0.6);
  
  // Create node groups
  const nodeGroup = g.append('g').selectAll('g').data(nodes).join('g')
    .attr('class', 'node-group')
    .style('cursor', 'pointer')
    .call(d3.drag()
      .on('start', (event, d) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        d.fx = d.x; d.fy = d.y;
      })
      .on('drag', (event, d) => { d.fx = event.x; d.fy = event.y; })
      .on('end', (event, d) => {
        if (!event.active) simulation.alphaTarget(0);
        d.fx = null; d.fy = null;
      }));
  
  // Hover scale effect
  nodeGroup
    .on('mouseenter', function() {
      d3.select(this).transition().duration(200)
        .attr('transform', d => `translate(${d.x},${d.y}) scale(1.2)`);
    })
    .on('mouseleave', function() {
      d3.select(this).transition().duration(200)
        .attr('transform', d => `translate(${d.x},${d.y}) scale(1)`);
    });
  
  // Add glow effect (outer colored ring)
  nodeGroup.append('circle')
    .attr('r', d => d.radius + 4)
    .attr('fill', 'none')
    .attr('stroke', d => d.color)
    .attr('stroke-width', 3)
    .attr('opacity', 0.6)
    .style('filter', d => `drop-shadow(0 0 ${d.radius/2}px ${d.color})`);
  
  // Add dark background behind favicon
  nodeGroup.append('circle')
    .attr('r', d => d.radius - 2)
    .attr('fill', '#0a0a0f')
    .attr('stroke', 'none');
  
  // Add favicon image
  nodeGroup.each(function(d) {
    const node = d3.select(this);
    const size = d.radius * 2 - 4;
    
    const clipId = `clip-${d.id.replace(/[^a-zA-Z0-9]/g, '-')}`;
    
    defs.append('clipPath')
      .attr('id', clipId)
      .append('circle')
      .attr('r', d.radius - 2);
    
    const img = node.append('image')
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
        .attr('r', d.radius - 4)
        .attr('fill', d.color);
    });
  });
  
  // Add visit count badge
  nodeGroup.append('circle')
    .attr('cx', d => d.radius * 0.6)
    .attr('cy', d => -d.radius * 0.6)
    .attr('r', 10)
    .attr('fill', d => d.color)
    .attr('stroke', '#0a0a0f')
    .attr('stroke-width', 2);
  
  nodeGroup.append('text')
    .attr('x', d => d.radius * 0.6)
    .attr('y', d => -d.radius * 0.6 + 4)
    .attr('text-anchor', 'middle')
    .style('fill', '#fff')
    .style('font-size', '10px')
    .style('font-weight', 'bold')
    .text(d => Math.min(99, d.visitCount || 1));
  
  // Add domain label
  nodeGroup.append('text')
    .attr('class', 'node-label')
    .attr('dy', d => d.radius + 18)
    .attr('text-anchor', 'middle')
    .style('fill', '#fff')
    .style('font-size', '13px')
    .style('font-weight', '500')
    .style('text-shadow', '0 2px 4px rgba(0,0,0,0.8)')
    .style('opacity', 0)
    .text(d => d.domain.length > 20 ? d.domain.substring(0, 18) + '...' : d.domain);
  
  // Show label on hover
  nodeGroup
    .on('mouseenter', function() {
      d3.select(this).select('.node-label').transition().style('opacity', 1);
    })
    .on('mouseleave', function() {
      d3.select(this).select('.node-label').transition().style('opacity', 0);
    });
  
  // Click handler
  nodeGroup.on('click', (event, d) => {
    event.stopPropagation();
    showNodeInfo(d, nodes, links);
  });
  
  // Update positions on tick
  simulation.on('tick', () => {
    link
      .attr('x1', d => d.source.x)
      .attr('y1', d => d.source.y)
      .attr('x2', d => d.target.x)
      .attr('y2', d => d.target.y);
    
    nodeGroup.attr('transform', d => `translate(${d.x},${d.y})`);
  });
  
  svg.on('click', () => closePanel());
  
  // Store simulation for external access
  window.constellationSimulation = simulation;
}

// Setup time filter buttons
function setupTimeFilters() {
  const filters = document.querySelectorAll('.time-filter');
  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      // Update active state
      filters.forEach(f => f.classList.remove('active'));
      btn.classList.add('active');
      
      // Filter data
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
    
    // Filter nodes that match search
    const filtered = {
      nodes: window.fullConstellationData.nodes.filter(n => 
        n.domain.toLowerCase().includes(term)
      ),
      links: window.fullConstellationData.links.filter(l => {
        const sourceId = typeof l.source === 'string' ? l.source : l.source.id;
        const targetId = typeof l.target === 'string' ? l.target : l.target.id;
        const source = window.fullConstellationData.nodes.find(n => n.id === sourceId);
        const target = window.fullConstellationData.nodes.find(n => n.id === targetId);
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
  
  // Fill dark background
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
  
  document.getElementById('panel-domain').innerHTML = `
    <img src="${getFaviconUrl(node.domain)}" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px; border-radius: 4px;">
    ${node.domain}
  `;
  document.getElementById('panel-visits').textContent = node.visitCount || 1;
  document.getElementById('panel-first').textContent = formatDate(node.firstVisit);
  document.getElementById('panel-last').textContent = formatDate(node.lastVisit);
  document.getElementById('panel-connections').textContent = connected.length;
  
  const linksContainer = document.getElementById('panel-links');
  linksContainer.innerHTML = '';
  
  if (connectedDomains.length === 0) {
    linksContainer.innerHTML = '<div style="color: #666688;">No connections</div>';
  } else {
    connectedDomains.forEach(domain => {
      const div = document.createElement('div');
      div.className = 'connection-item';
      div.style.borderLeftColor = node.color;
      div.style.display = 'flex';
      div.style.alignItems = 'center';
      div.style.gap = '8px';
      div.innerHTML = `
        <img src="${getFaviconUrl(domain)}" style="width: 16px; height: 16px; border-radius: 2px;">
        <span>${domain}</span>
      `;
      div.onclick = () => {
        const targetNode = allNodes.find(n => n.domain === domain);
        if (targetNode) showNodeInfo(targetNode, allNodes, allLinks);
      };
      linksContainer.appendChild(div);
    });
  }
  
  panel.classList.add('active');
}

function closePanel() {
  document.getElementById('info-panel').classList.remove('active');
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

// Initialize
loadConstellationData();
