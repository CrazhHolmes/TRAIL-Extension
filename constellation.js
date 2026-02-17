// TRAIL Constellation Visualization with Favicon Stars
// Built by Wizardrytezch | github.com/CrazhHolmes

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

// Get favicon URL from DuckDuckGo (transparent PNGs, better for dark theme)
function getFaviconUrl(domain) {
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`;
}

function getNodeColor(visits, lastVisit) {
    const now = Date.now();
    const dayAgo = now - (24 * 60 * 60 * 1000);
    if (lastVisit > dayAgo) return '#96ceb4';  // Green - recent
    if (visits >= 50) return '#ff6b6b';        // Red - high traffic
    if (visits >= 10) return '#4ecdc4';        // Teal - medium
    return '#45b7d1';                          // Blue - low
}

// Larger minimum size for better favicon visibility
function getNodeSize(visits) {
    return Math.max(20, Math.min(40, 20 + Math.sqrt(visits || 1) * 4));
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
        
        document.getElementById('node-count').textContent = data.nodes.length;
        renderConstellation(data);
    } catch (err) {
        console.error('Error:', err);
        document.getElementById('loading').textContent = 'ERROR LOADING COSMOS';
    }
}

function getDemoData() {
    return {
        nodes: [
            { id: 'github.com', domain: 'github.com', visitCount: 45, lastVisit: Date.now(), firstVisit: Date.now() - 7*24*60*60*1000 },
            { id: 'stackoverflow.com', domain: 'stackoverflow.com', visitCount: 32, lastVisit: Date.now() - 3600000, firstVisit: Date.now() - 5*24*60*60*1000 },
            { id: 'google.com', domain: 'google.com', visitCount: 120, lastVisit: Date.now() - 60000, firstVisit: Date.now() - 30*24*60*60*1000 }
        ],
        links: [
            { source: 'github.com', target: 'stackoverflow.com' },
            { source: 'google.com', target: 'github.com' }
        ]
    };
}

function renderConstellation(data) {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    const svg = d3.select('#constellation-svg').attr('viewBox', [0, 0, width, height]);
    const g = svg.append('g');
    
    const zoom = d3.zoom().scaleExtent([0.1, 4]).on('zoom', (event) => {
        g.attr('transform', event.transform);
    });
    svg.call(zoom);
    
    // Prepare nodes with favicon URLs
    const nodes = data.nodes.map(d => ({
        ...d,
        color: getNodeColor(d.visitCount || 1, d.lastVisit || 0),
        radius: getNodeSize(d.visitCount || 1),
        faviconUrl: getFaviconUrl(d.domain)
    }));
    
    const links = data.links.map(d => ({ source: d.source, target: d.target }));
    
    const simulation = d3.forceSimulation(nodes)
        .force('link', d3.forceLink(links).id(d => d.id).distance(150))
        .force('charge', d3.forceManyBody().strength(-400))
        .force('center', d3.forceCenter(width / 2, height / 2))
        .force('collision', d3.forceCollide().radius(d => d.radius + 15));
    
    // Draw constellation lines
    const link = g.append('g').selectAll('line').data(links).join('line')
        .attr('class', 'constellation-line');
    
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
    
    // Add glow effect (outer colored ring)
    nodeGroup.append('circle')
        .attr('r', d => d.radius + 4)
        .attr('fill', 'none')
        .attr('stroke', d => d.color)
        .attr('stroke-width', 3)
        .attr('opacity', 0.6)
        .style('filter', d => `drop-shadow(0 0 ${d.radius/2}px ${d.color})`);
    
    // Add white border circle
    nodeGroup.append('circle')
        .attr('r', d => d.radius)
        .attr('fill', '#fff')
        .attr('stroke', d => d.color)
        .attr('stroke-width', 2);
    
    // Add dark background behind favicon (helps with white backgrounds)
    nodeGroup.append('circle')
        .attr('r', d => d.radius - 2)
        .attr('fill', '#0a0a0f')
        .attr('stroke', 'none');
    
    // Add favicon image
    nodeGroup.each(function(d) {
        const node = d3.select(this);
        const size = d.radius * 2 - 4;
        
        // Create clip path for circular favicon
        const clipId = `clip-${d.id.replace(/[^a-zA-Z0-9]/g, '-')}`;
        
        svg.append('defs')
            .append('clipPath')
            .attr('id', clipId)
            .append('circle')
            .attr('r', d.radius - 2);
        
        // Add favicon image with clip and filters
        const img = node.append('image')
            .attr('href', d.faviconUrl)
            .attr('width', size)
            .attr('height', size)
            .attr('x', -(d.radius - 2))
            .attr('y', -(d.radius - 2))
            .attr('clip-path', `url(#${clipId})`)
            .style('filter', 'contrast(1.1) brightness(1.05)');
        
        // Error fallback
        img.on('error', function() {
            d3.select(this).style('display', 'none');
            node.append('circle')
                .attr('r', d.radius - 4)
                .attr('fill', d.color);
        });
    });
    
    // Add domain label below favicon
    nodeGroup.append('text')
        .attr('class', 'node-label')
        .attr('dy', d => d.radius + 18)
        .attr('text-anchor', 'middle')
        .style('fill', '#fff')
        .style('font-size', '13px')
        .style('font-weight', '500')
        .style('text-shadow', '0 2px 4px rgba(0,0,0,0.8)')
        .text(d => d.domain.length > 20 ? d.domain.substring(0, 18) + '...' : d.domain);
    
    // Click handler
    nodeGroup.on('click', (event, d) => {
        event.stopPropagation();
        showNodeInfo(d, nodes, links);
    });
    
    // Update positions on tick
    simulation.on('tick', () => {
        link.attr('x1', d => d.source.x).attr('y1', d => d.source.y)
            .attr('x2', d => d.target.x).attr('y2', d => d.target.y);
        nodeGroup.attr('transform', d => `translate(${d.x},${d.y})`);
    });
    
    svg.on('click', () => closePanel());
}

function showNodeInfo(node, allNodes, allLinks) {
    const panel = document.getElementById('info-panel');
    const connected = allLinks.filter(l => l.source.id === node.id || l.target.id === node.id);
    const connectedDomains = connected.map(l => {
        const otherId = l.source.id === node.id ? l.target.id : l.source.id;
        const otherNode = allNodes.find(n => n.id === otherId);
        return otherNode ? otherNode.domain : otherId;
    });
    
    // Add favicon to panel header
    const faviconUrl = getFaviconUrl(node.domain);
    document.getElementById('panel-domain').innerHTML = `
        <img src="${faviconUrl}" style="width: 24px; height: 24px; vertical-align: middle; margin-right: 8px; border-radius: 4px;">
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
