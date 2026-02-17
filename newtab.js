/* TRAIL v1.0 | Built by Wizardrytezch | github.com/CrazhHolmes | Patent Pending */

/**
 * TRAIL - New Tab Visualization Engine
 * 
 * Components:
 * - THE CARTOGRAPHER: Force-directed graph visualization
 * - THE STORYTELLER: NLP entity extraction and journey summaries
 * - THE TIME MACHINE: Timeline replay and scrubbing
 * 
 * BLACK BOX NOTICE: calculateSemanticProximity() is a placeholder
 * for the temporal-semantic clustering algorithm (Patent Pending)
 */

// ============================================
// CONFIGURATION & STATE
// ============================================

const CONFIG = {
  NODE_SIZE_MIN: 6,
  NODE_SIZE_MAX: 30,
  CONNECTION_DISTANCE: 150,
  CONNECTION_TIME_WINDOW: 10 * 60 * 1000, // 10 minutes
  FORCE_REPULSION: 200,
  FORCE_SPRING: 0.05,
  FORCE_DAMPING: 0.9,
  ZOOM_MIN: 0.1,
  ZOOM_MAX: 5,
  ANIMATION_SPEED: 50, // ms per frame in replay
  CATEGORY_COLORS: {
    tech: '#3b82f6',
    social: '#ec4899',
    news: '#f59e0b',
    edu: '#10b981',
    shopping: '#ef4444',
    entertainment: '#8b5cf6',
    finance: '#14b8a6',
    other: '#6b7280'
  }
};

const state = {
  nodes: [],
  edges: [],
  historyData: [],
  camera: { x: 0, y: 0, zoom: 1 },
  isDragging: false,
  draggedNode: null,
  hoverNode: null,
  selectedNode: null,
  mouse: { x: 0, y: 0 },
  lastMouse: { x: 0, y: 0 },
  isReplayPlaying: false,
  replayIndex: 0,
  replayTimer: null,
  currentTimeRange: '24h',
  animationId: null,
  canvas: null,
  ctx: null,
  canvasBounds: null
};

// ============================================
// BLACK BOX: SEMANTIC SIMILARITY (PLACEHOLDER)
// ============================================

/**
 * BLACK BOX - Temporal-Semantic Clustering
 * 
 * This function will be implemented with the actual TF-IDF similarity
 * algorithm in Day 2. For now, returns placeholder values.
 * 
 * CLASSIFICATION: BLACK - Algorithm disclosed post-patent filing
 * PATENT: Provisional #019
 * 
 * @param {string} text1 - First text snippet
 * @param {string} text2 - Second text snippet
 * @returns {number} - Similarity score between 0 and 1
 */
function calculateSemanticProximity(text1, text2) {
  // PLACEHOLDER: Returns random value for Day 1 testing
  // Day 2 implementation: TF-IDF vectorization + cosine similarity
  // with temporal decay weighting
  return Math.random() * 0.8 + 0.1;
}

// ============================================
// THE CARTOGRAPHER - VISUALIZATION ENGINE
// ============================================

class ConstellationMap {
  constructor(canvas) {
    state.canvas = canvas;
    state.ctx = canvas.getContext('2d');
    this.resize();
    this.setupEventListeners();
    this.startAnimationLoop();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    const rect = state.canvas.getBoundingClientRect();
    
    state.canvas.width = rect.width * dpr;
    state.canvas.height = rect.height * dpr;
    state.canvas.style.width = `${rect.width}px`;
    state.canvas.style.height = `${rect.height}px`;
    state.canvasBounds = rect;
    
    state.ctx.scale(dpr, dpr);
  }

  setupEventListeners() {
    // Mouse events
    state.canvas.addEventListener('mousedown', this.onMouseDown.bind(this));
    state.canvas.addEventListener('mousemove', this.onMouseMove.bind(this));
    state.canvas.addEventListener('mouseup', this.onMouseUp.bind(this));
    state.canvas.addEventListener('mouseleave', this.onMouseUp.bind(this));
    state.canvas.addEventListener('wheel', this.onWheel.bind(this), { passive: false });
    
    // Touch events for mobile
    state.canvas.addEventListener('touchstart', this.onTouchStart.bind(this), { passive: false });
    state.canvas.addEventListener('touchmove', this.onTouchMove.bind(this), { passive: false });
    state.canvas.addEventListener('touchend', this.onMouseUp.bind(this));
    
    // Window resize
    window.addEventListener('resize', () => this.resize());
  }

  // Coordinate transformations
  worldToScreen(x, y) {
    return {
      x: (x - state.camera.x) * state.camera.zoom + state.canvasBounds.width / 2,
      y: (y - state.camera.y) * state.camera.zoom + state.canvasBounds.height / 2
    };
  }

  screenToWorld(x, y) {
    return {
      x: (x - state.canvasBounds.width / 2) / state.camera.zoom + state.camera.x,
      y: (y - state.canvasBounds.height / 2) / state.camera.zoom + state.camera.y
    };
  }

  getMouseWorldPos(e) {
    const rect = state.canvas.getBoundingClientRect();
    return this.screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
  }

  // Event handlers
  onMouseDown(e) {
    const worldPos = this.getMouseWorldPos(e);
    
    // Check if clicking on a node
    const clickedNode = this.findNodeAt(worldPos.x, worldPos.y);
    
    if (clickedNode) {
      state.isDragging = true;
      state.draggedNode = clickedNode;
      state.draggedNode.vx = 0;
      state.draggedNode.vy = 0;
      state.selectedNode = clickedNode;
      this.showNodeDetails(clickedNode);
    } else {
      state.isDragging = true;
      state.lastMouse = { x: e.clientX, y: e.clientY };
    }
  }

  onMouseMove(e) {
    const worldPos = this.getMouseWorldPos(e);
    state.mouse = worldPos;
    
    // Update hover state
    const prevHover = state.hoverNode;
    state.hoverNode = this.findNodeAt(worldPos.x, worldPos.y);
    state.canvas.style.cursor = state.hoverNode ? 'pointer' : (state.isDragging && !state.draggedNode ? 'grabbing' : 'grab');
    
    if (state.isDragging) {
      if (state.draggedNode) {
        // Dragging a node
        state.draggedNode.x = worldPos.x;
        state.draggedNode.y = worldPos.y;
        state.draggedNode.vx = 0;
        state.draggedNode.vy = 0;
      } else {
        // Panning the camera
        const dx = e.clientX - state.lastMouse.x;
        const dy = e.clientY - state.lastMouse.y;
        state.camera.x -= dx / state.camera.zoom;
        state.camera.y -= dy / state.camera.zoom;
        state.lastMouse = { x: e.clientX, y: e.clientY };
      }
    }
  }

  onMouseUp() {
    state.isDragging = false;
    state.draggedNode = null;
  }

  onWheel(e) {
    e.preventDefault();
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    const newZoom = Math.max(CONFIG.ZOOM_MIN, Math.min(CONFIG.ZOOM_MAX, state.camera.zoom * zoomFactor));
    
    // Zoom towards mouse position
    const rect = state.canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldBefore = this.screenToWorld(mouseX, mouseY);
    
    state.camera.zoom = newZoom;
    
    const worldAfter = this.screenToWorld(mouseX, mouseY);
    state.camera.x += worldBefore.x - worldAfter.x;
    state.camera.y += worldBefore.y - worldAfter.y;
  }

  onTouchStart(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      this.onMouseDown({ clientX: touch.clientX, clientY: touch.clientY });
    }
  }

  onTouchMove(e) {
    if (e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      this.onMouseMove({ clientX: touch.clientX, clientY: touch.clientY });
    }
  }

  findNodeAt(x, y) {
    const threshold = 20 / state.camera.zoom;
    for (const node of state.nodes) {
      const dx = node.x - x;
      const dy = node.y - y;
      if (Math.sqrt(dx * dx + dy * dy) < node.radius + threshold) {
        return node;
      }
    }
    return null;
  }

  // Physics simulation
  updatePhysics() {
    if (state.nodes.length === 0) return;
    
    // Apply forces
    for (let i = 0; i < state.nodes.length; i++) {
      const nodeA = state.nodes[i];
      if (nodeA === state.draggedNode) continue;
      
      // Repulsion between all nodes
      for (let j = i + 1; j < state.nodes.length; j++) {
        const nodeB = state.nodes[j];
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        
        if (dist < CONFIG.CONNECTION_DISTANCE * 2) {
          const force = CONFIG.FORCE_REPULSION / (dist * dist);
          const fx = (dx / dist) * force;
          const fy = (dy / dist) * force;
          
          nodeA.vx -= fx;
          nodeA.vy -= fy;
          nodeB.vx += fx;
          nodeB.vy += fy;
        }
      }
    }
    
    // Spring forces along edges
    for (const edge of state.edges) {
      if (edge.isTemporal) {
        const dx = edge.target.x - edge.source.x;
        const dy = edge.target.y - edge.source.y;
        const dist = Math.sqrt(dx * dx + dy * dy) || 1;
        const force = (dist - 80) * CONFIG.FORCE_SPRING;
        
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;
        
        if (edge.source !== state.draggedNode) {
          edge.source.vx += fx;
          edge.source.vy += fy;
        }
        if (edge.target !== state.draggedNode) {
          edge.target.vx -= fx;
          edge.target.vy -= fy;
        }
      }
    }
    
    // Center gravity
    for (const node of state.nodes) {
      if (node === state.draggedNode) continue;
      
      node.vx -= node.x * 0.001;
      node.vy -= node.y * 0.001;
      
      // Apply velocity with damping
      node.vx *= CONFIG.FORCE_DAMPING;
      node.vy *= CONFIG.FORCE_DAMPING;
      
      node.x += node.vx;
      node.y += node.vy;
    }
  }

  // Rendering
  render() {
    const { ctx, canvasBounds } = state;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvasBounds.width, canvasBounds.height);
    
    // Draw background grid
    this.drawGrid();
    
    // Draw edges
    for (const edge of state.edges) {
      this.drawEdge(edge);
    }
    
    // Draw nodes
    for (const node of state.nodes) {
      this.drawNode(node);
    }
    
    // Draw labels for hovered/selected nodes
    if (state.hoverNode) {
      this.drawNodeLabel(state.hoverNode);
    }
  }

  drawGrid() {
    const { ctx } = state;
    const gridSize = 50 * state.camera.zoom;
    const offsetX = (-state.camera.x * state.camera.zoom + state.canvasBounds.width / 2) % gridSize;
    const offsetY = (-state.camera.y * state.camera.zoom + state.canvasBounds.height / 2) % gridSize;
    
    ctx.strokeStyle = 'rgba(99, 102, 241, 0.05)';
    ctx.lineWidth = 1;
    
    ctx.beginPath();
    for (let x = offsetX; x < state.canvasBounds.width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, state.canvasBounds.height);
    }
    for (let y = offsetY; y < state.canvasBounds.height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(state.canvasBounds.width, y);
    }
    ctx.stroke();
  }

  drawEdge(edge) {
    const { ctx } = state;
    const start = this.worldToScreen(edge.source.x, edge.source.y);
    const end = this.worldToScreen(edge.target.x, edge.target.y);
    
    // Check if line is visible
    if (!this.isLineVisible(start, end)) return;
    
    ctx.beginPath();
    ctx.moveTo(start.x, start.y);
    ctx.lineTo(end.x, end.y);
    
    if (edge.isWormhole) {
      // Wormhole connection - surprising jump
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2 * state.camera.zoom;
      ctx.setLineDash([5, 5]);
    } else if (edge.isTemporal) {
      // Temporal connection - visited within time window
      const alpha = Math.min(1, edge.strength * 2);
      ctx.strokeStyle = `rgba(99, 102, 241, ${alpha * 0.5})`;
      ctx.lineWidth = edge.strength * 2 * state.camera.zoom;
      ctx.setLineDash([]);
    } else {
      // Semantic connection
      ctx.strokeStyle = `rgba(139, 92, 246, ${edge.strength * 0.3})`;
      ctx.lineWidth = edge.strength * state.camera.zoom;
      ctx.setLineDash([]);
    }
    
    ctx.stroke();
    ctx.setLineDash([]);
  }

  isLineVisible(start, end) {
    const margin = 100;
    return (
      (start.x >= -margin && start.x <= state.canvasBounds.width + margin &&
       start.y >= -margin && start.y <= state.canvasBounds.height + margin) ||
      (end.x >= -margin && end.x <= state.canvasBounds.width + margin &&
       end.y >= -margin && end.y <= state.canvasBounds.height + margin)
    );
  }

  drawNode(node) {
    const { ctx } = state;
    const screen = this.worldToScreen(node.x, node.y);
    const radius = node.radius * state.camera.zoom;
    
    // Skip if off-screen
    if (screen.x < -radius || screen.x > state.canvasBounds.width + radius ||
        screen.y < -radius || screen.y > state.canvasBounds.height + radius) {
      return;
    }
    
    // Glow effect for selected/hovered nodes
    if (node === state.selectedNode || node === state.hoverNode) {
      const gradient = ctx.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, radius * 2);
      gradient.addColorStop(0, node.color + '80');
      gradient.addColorStop(1, 'transparent');
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(screen.x, screen.y, radius * 2, 0, Math.PI * 2);
      ctx.fill();
    }
    
    // Node body
    ctx.fillStyle = node.color;
    ctx.beginPath();
    ctx.arc(screen.x, screen.y, radius, 0, Math.PI * 2);
    ctx.fill();
    
    // Node border
    ctx.strokeStyle = node === state.selectedNode ? '#ffffff' : node.color + 'CC';
    ctx.lineWidth = node === state.selectedNode ? 3 : 1;
    ctx.stroke();
    
    // Inner highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(screen.x - radius * 0.3, screen.y - radius * 0.3, radius * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  drawNodeLabel(node) {
    const { ctx } = state;
    const screen = this.worldToScreen(node.x, node.y);
    const radius = node.radius * state.camera.zoom;
    
    ctx.font = '12px Segoe UI, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    
    const text = node.title.length > 30 ? node.title.substring(0, 30) + '...' : node.title;
    const textWidth = ctx.measureText(text).width;
    
    // Background
    ctx.fillStyle = 'rgba(18, 18, 26, 0.95)';
    ctx.beginPath();
    ctx.roundRect(screen.x - textWidth / 2 - 8, screen.y + radius + 8, textWidth + 16, 22, 4);
    ctx.fill();
    
    // Text
    ctx.fillStyle = '#f1f5f9';
    ctx.fillText(text, screen.x, screen.y + radius + 12);
  }

  startAnimationLoop() {
    const loop = () => {
      this.updatePhysics();
      this.render();
      state.animationId = requestAnimationFrame(loop);
    };
    loop();
  }

  showNodeDetails(node) {
    const panel = document.getElementById('info-panel');
    const title = document.getElementById('panel-title');
    const url = document.getElementById('panel-url');
    const time = document.getElementById('panel-time');
    const category = document.getElementById('panel-category');
    const entities = document.getElementById('panel-entities');
    
    title.textContent = node.title;
    url.textContent = node.data.url;
    url.onclick = () => window.open(node.data.url, '_blank');
    url.style.cursor = 'pointer';
    
    const date = new Date(node.data.timestamp);
    time.textContent = date.toLocaleString();
    
    category.textContent = node.data.category || 'other';
    category.style.backgroundColor = CONFIG.CATEGORY_COLORS[node.data.category] || CONFIG.CATEGORY_COLORS.other;
    category.style.color = '#fff';
    
    // Entities
    let entitiesHtml = '';
    if (node.data.entities) {
      const allEntities = [
        ...(node.data.entities.people || []),
        ...(node.data.entities.places || []),
        ...(node.data.entities.organizations || []),
        ...(node.data.entities.topics || [])
      ];
      
      if (allEntities.length > 0) {
        entitiesHtml = '<h4>Related Topics</h4>';
        allEntities.forEach(entity => {
          entitiesHtml += `<span class="entity-tag">${entity}</span>`;
        });
      }
    }
    entities.innerHTML = entitiesHtml;
    
    panel.classList.remove('hidden');
  }
}


// ============================================
// DATA PROCESSING & GRAPH BUILDING
// ============================================

function processHistoryData(historyData) {
  if (!historyData || historyData.length === 0) {
    return { nodes: [], edges: [] };
  }
  
  const nodes = [];
  const edges = [];
  const nodeMap = new Map();
  
  // Create nodes from history data
  historyData.forEach((item, index) => {
    // Calculate node size based on dwell time (or default)
    const dwellTime = item.dwell_time || Math.random() * 300 + 30;
    const sizeRatio = Math.min(dwellTime / 300, 1);
    const radius = CONFIG.NODE_SIZE_MIN + (CONFIG.NODE_SIZE_MAX - CONFIG.NODE_SIZE_MIN) * sizeRatio;
    
    // Assign position in a spiral pattern initially
    const angle = index * 0.5;
    const distance = 50 + index * 10;
    
    const node = {
      id: item.id || index,
      x: Math.cos(angle) * distance + (Math.random() - 0.5) * 50,
      y: Math.sin(angle) * distance + (Math.random() - 0.5) * 50,
      vx: 0,
      vy: 0,
      radius: radius,
      color: CONFIG.CATEGORY_COLORS[item.category] || CONFIG.CATEGORY_COLORS.other,
      title: item.title || 'Untitled',
      timestamp: item.timestamp,
      data: item
    };
    
    nodes.push(node);
    nodeMap.set(item.id || index, node);
  });
  
  // Create temporal edges (visited within time window)
  for (let i = 0; i < historyData.length - 1; i++) {
    const current = historyData[i];
    const next = historyData[i + 1];
    
    const timeDiff = next.timestamp - current.timestamp;
    
    if (timeDiff < CONFIG.CONNECTION_TIME_WINDOW) {
      const source = nodeMap.get(current.id || i);
      const target = nodeMap.get(next.id || (i + 1));
      
      if (source && target) {
        const strength = 1 - (timeDiff / CONFIG.CONNECTION_TIME_WINDOW);
        edges.push({
          source,
          target,
          strength,
          isTemporal: true,
          isWormhole: false
        });
      }
    }
  }
  
  // Create semantic edges based on content similarity
  // Only connect nodes that are close in time (within 1 hour)
  const SEMANTIC_TIME_WINDOW = 60 * 60 * 1000;
  
  for (let i = 0; i < historyData.length; i++) {
    for (let j = i + 1; j < historyData.length; j++) {
      const itemA = historyData[i];
      const itemB = historyData[j];
      
      const timeDiff = Math.abs(itemB.timestamp - itemA.timestamp);
      
      // Only check semantic similarity for nearby visits
      if (timeDiff < SEMANTIC_TIME_WINDOW && timeDiff > CONFIG.CONNECTION_TIME_WINDOW) {
        const textA = itemA.content_snippet || itemA.title || '';
        const textB = itemB.content_snippet || itemB.title || '';
        
        if (textA.length > 50 && textB.length > 50) {
          // BLACK BOX: Semantic proximity calculation
          const similarity = calculateSemanticProximity(textA, textB);
          
          if (similarity > 0.6) {
            const source = nodeMap.get(itemA.id || i);
            const target = nodeMap.get(itemB.id || j);
            
            if (source && target) {
              edges.push({
                source,
                target,
                strength: similarity,
                isTemporal: false,
                isWormhole: false
              });
            }
          }
        }
      }
    }
  }
  
  // Detect wormholes (surprising jumps between unrelated topics)
  detectWormholes(nodes, edges, historyData);
  
  return { nodes, edges };
}

function detectWormholes(nodes, edges, historyData) {
  for (let i = 0; i < historyData.length - 1; i++) {
    const current = historyData[i];
    const next = historyData[i + 1];
    
    const timeDiff = next.timestamp - current.timestamp;
    
    // Quick transitions between different categories
    if (timeDiff < 5 * 60 * 1000 && current.category !== next.category) {
      // Check if categories are vastly different
      const categoryJump = isSignificantCategoryJump(current.category, next.category);
      
      if (categoryJump) {
        // Find existing edge and mark as wormhole, or create new one
        const sourceNode = nodes.find(n => n.data === current);
        const targetNode = nodes.find(n => n.data === next);
        
        if (sourceNode && targetNode) {
          const existingEdge = edges.find(e => 
            (e.source === sourceNode && e.target === targetNode) ||
            (e.source === targetNode && e.target === sourceNode)
          );
          
          if (existingEdge) {
            existingEdge.isWormhole = true;
          } else {
            edges.push({
              source: sourceNode,
              target: targetNode,
              strength: 0.5,
              isTemporal: true,
              isWormhole: true
            });
          }
          
          // Show wormhole notification
          showWormholeNotification(current, next);
        }
      }
    }
  }
}

function isSignificantCategoryJump(cat1, cat2) {
  // Define which category jumps are considered "surprising"
  const surprisingJumps = [
    ['edu', 'entertainment'],
    ['tech', 'entertainment'],
    ['news', 'shopping'],
    ['finance', 'entertainment'],
    ['social', 'edu']
  ];
  
  return surprisingJumps.some(pair => 
    (pair[0] === cat1 && pair[1] === cat2) ||
    (pair[0] === cat2 && pair[1] === cat1)
  );
}

// ============================================
// THE STORYTELLER - NLP LAYER
// ============================================

function extractEntitiesWithCompromise(text) {
  if (!window.nlp || !text) {
    return { people: [], places: [], organizations: [], topics: [] };
  }
  
  try {
    const doc = window.nlp(text);
    
    return {
      people: doc.people().out('array').slice(0, 5),
      places: doc.places().out('array').slice(0, 5),
      organizations: doc.organizations().out('array').slice(0, 5),
      topics: doc.topics().out('array').slice(0, 5)
    };
  } catch (e) {
    console.error('[TRAIL] NLP extraction error:', e);
    return { people: [], places: [], organizations: [], topics: [] };
  }
}

function generateJourneySummary(historyData) {
  if (historyData.length < 2) return null;
  
  const recent = historyData.slice(-5);
  const entities = [];
  
  // Extract key entities from recent pages
  recent.forEach(item => {
    if (item.entities) {
      if (item.entities.people && item.entities.people.length > 0) {
        entities.push(...item.entities.people.slice(0, 2));
      }
      if (item.entities.places && item.entities.places.length > 0) {
        entities.push(...item.entities.places.slice(0, 2));
      }
      if (item.entities.topics && item.entities.topics.length > 0) {
        entities.push(...item.entities.topics.slice(0, 2));
      }
    }
  });
  
  // Remove duplicates
  const uniqueEntities = [...new Set(entities)].slice(0, 3);
  
  if (uniqueEntities.length >= 2) {
    const connectors = ['explored', 'discovered', 'ventured into', 'journeyed through', 'navigated'];
    const connector = connectors[Math.floor(Math.random() * connectors.length)];
    
    return `You ${connector} from "${uniqueEntities[0]}" to "${uniqueEntities[uniqueEntities.length - 1]}"`;
  }
  
  // Fallback to domain-based summary
  const domains = recent.map(r => r.domain).filter((d, i, arr) => arr.indexOf(d) === i);
  if (domains.length > 1) {
    return `You traveled from ${domains[0]} to ${domains[domains.length - 1]}`;
  }
  
  return null;
}

function showWormholeNotification(from, to) {
  const categoryLabels = {
    tech: 'Technology',
    social: 'Social Media',
    news: 'News',
    edu: 'Education',
    shopping: 'Shopping',
    entertainment: 'Entertainment',
    finance: 'Finance',
    other: 'Other'
  };
  
  const toast = document.getElementById('journey-toast');
  const text = document.getElementById('journey-text');
  
  text.textContent = `🌌 Wormhole detected: ${categoryLabels[from.category] || 'Unknown'} → ${categoryLabels[to.category] || 'Unknown'}`;
  
  toast.classList.remove('hidden');
  
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 4000);
}

// ============================================
// THE TIME MACHINE - TIMELINE & REPLAY
// ============================================

class TimeMachine {
  constructor() {
    this.slider = document.getElementById('timeline-slider');
    this.playBtn = document.getElementById('play-pause-btn');
    this.playIcon = document.getElementById('play-icon');
    this.pauseIcon = document.getElementById('pause-icon');
    this.timeDisplay = document.getElementById('current-time');
    this.replayBtn = document.getElementById('replay-btn');
    
    this.setupEventListeners();
  }
  
  setupEventListeners() {
    // Timeline slider
    this.slider.addEventListener('input', () => {
      this.onSliderChange();
    });
    
    // Play/Pause
    this.playBtn.addEventListener('click', () => {
      this.toggleReplay();
    });
    
    // Replay button
    this.replayBtn.addEventListener('click', () => {
      this.startFullReplay();
    });
    
    // Range buttons
    document.querySelectorAll('.range-btn').forEach(btn => {
      btn.addEventListener('click', (e) => {
        document.querySelectorAll('.range-btn').forEach(b => b.classList.remove('active'));
        e.target.classList.add('active');
        state.currentTimeRange = e.target.dataset.range;
        loadHistoryData(state.currentTimeRange);
      });
    });
  }
  
  onSliderChange() {
    if (!state.historyData.length) return;
    
    const progress = this.slider.value / 100;
    const index = Math.floor(progress * (state.historyData.length - 1));
    
    state.replayIndex = index;
    this.updateTimeDisplay(state.historyData[index]?.timestamp);
    
    // Highlight nodes up to this point
    this.highlightUpToIndex(index);
  }
  
  updateTimeDisplay(timestamp) {
    if (!timestamp) {
      this.timeDisplay.textContent = 'Now';
      return;
    }
    
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60 * 1000) {
      this.timeDisplay.textContent = 'Just now';
    } else if (diff < 60 * 60 * 1000) {
      this.timeDisplay.textContent = `${Math.floor(diff / 60000)}m ago`;
    } else if (diff < 24 * 60 * 60 * 1000) {
      this.timeDisplay.textContent = `${Math.floor(diff / 3600000)}h ago`;
    } else {
      this.timeDisplay.textContent = date.toLocaleDateString();
    }
  }
  
  highlightUpToIndex(index) {
    // Dim nodes that come after the current time
    state.nodes.forEach((node, i) => {
      if (i <= index) {
        node.opacity = 1;
      } else {
        node.opacity = 0.2;
      }
    });
  }
  
  toggleReplay() {
    if (state.isReplayPlaying) {
      this.pauseReplay();
    } else {
      this.playReplay();
    }
  }
  
  playReplay() {
    state.isReplayPlaying = true;
    this.playIcon.classList.add('hidden');
    this.pauseIcon.classList.remove('hidden');
    
    // Start from beginning if at end
    if (state.replayIndex >= state.historyData.length - 1) {
      state.replayIndex = 0;
    }
    
    this.replayStep();
  }
  
  pauseReplay() {
    state.isReplayPlaying = false;
    this.playIcon.classList.remove('hidden');
    this.pauseIcon.classList.add('hidden');
    
    if (state.replayTimer) {
      clearTimeout(state.replayTimer);
    }
  }
  
  replayStep() {
    if (!state.isReplayPlaying || state.replayIndex >= state.historyData.length) {
      this.pauseReplay();
      return;
    }
    
    // Update slider
    const progress = (state.replayIndex / (state.historyData.length - 1)) * 100;
    this.slider.value = progress;
    
    // Update display
    this.updateTimeDisplay(state.historyData[state.replayIndex]?.timestamp);
    this.highlightUpToIndex(state.replayIndex);
    
    // Show journey summary at certain points
    if (state.replayIndex % 5 === 0) {
      const summary = generateJourneySummary(state.historyData.slice(0, state.replayIndex + 1));
      if (summary) {
        this.showJourneyToast(summary);
      }
    }
    
    state.replayIndex++;
    
    state.replayTimer = setTimeout(() => this.replayStep(), CONFIG.ANIMATION_SPEED);
  }
  
  startFullReplay() {
    state.replayIndex = 0;
    this.playReplay();
  }
  
  showJourneyToast(text) {
    const toast = document.getElementById('journey-toast');
    const toastText = document.getElementById('journey-text');
    
    toastText.textContent = text;
    toast.classList.remove('hidden');
    
    setTimeout(() => {
      toast.classList.add('hidden');
    }, 3000);
  }
}

// ============================================
// EXPORT FEATURES
// ============================================

function exportAsPNG() {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set high resolution
  canvas.width = 2400;
  canvas.height = 1600;
  
  // Fill background
  ctx.fillStyle = '#0a0a0f';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw grid
  ctx.strokeStyle = 'rgba(99, 102, 241, 0.05)';
  ctx.lineWidth = 1;
  const gridSize = 50;
  
  ctx.beginPath();
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
  }
  ctx.stroke();
  
  // Calculate bounds of all nodes
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  state.nodes.forEach(node => {
    minX = Math.min(minX, node.x - node.radius);
    maxX = Math.max(maxX, node.x + node.radius);
    minY = Math.min(minY, node.y - node.radius);
    maxY = Math.max(maxY, node.y + node.radius);
  });
  
  if (state.nodes.length === 0) {
    minX = 0; maxX = canvas.width;
    minY = 0; maxY = canvas.height;
  }
  
  // Add padding
  const padding = 100;
  minX -= padding; maxX += padding;
  minY -= padding; maxY += padding;
  
  // Calculate scale to fit
  const contentWidth = maxX - minX;
  const contentHeight = maxY - minY;
  const scale = Math.min(
    (canvas.width - 200) / contentWidth,
    (canvas.height - 300) / contentHeight
  );
  
  // Center content
  const offsetX = (canvas.width - contentWidth * scale) / 2 - minX * scale;
  const offsetY = (canvas.height - contentHeight * scale) / 2 - minY * scale;
  
  // Draw edges
  state.edges.forEach(edge => {
    const x1 = edge.source.x * scale + offsetX;
    const y1 = edge.source.y * scale + offsetY;
    const x2 = edge.target.x * scale + offsetX;
    const y2 = edge.target.y * scale + offsetY;
    
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    
    if (edge.isWormhole) {
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2;
    } else if (edge.isTemporal) {
      ctx.strokeStyle = `rgba(99, 102, 241, ${edge.strength * 0.5})`;
      ctx.lineWidth = edge.strength * 2;
    } else {
      ctx.strokeStyle = `rgba(139, 92, 246, ${edge.strength * 0.3})`;
      ctx.lineWidth = edge.strength;
    }
    
    ctx.stroke();
  });
  
  // Draw nodes
  state.nodes.forEach(node => {
    const x = node.x * scale + offsetX;
    const y = node.y * scale + offsetY;
    const r = node.radius * scale;
    
    // Glow
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, r * 2);
    gradient.addColorStop(0, node.color + '40');
    gradient.addColorStop(1, 'transparent');
    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, r * 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Node
    ctx.fillStyle = node.color;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
    
    // Border
    ctx.strokeStyle = node.color + 'CC';
    ctx.lineWidth = 1;
    ctx.stroke();
  });
  
  // Add watermark/title
  ctx.fillStyle = '#f1f5f9';
  ctx.font = 'bold 48px Segoe UI, sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText("Wizardrytezch's Digital Trail", 40, 60);
  
  ctx.fillStyle = '#64748b';
  ctx.font = '24px Segoe UI, sans-serif';
  ctx.fillText('Generated by TRAIL - github.com/CrazhHolmes', 40, 100);
  ctx.fillText(new Date().toLocaleString(), 40, 130);
  
  // TRAIL branding
  ctx.fillStyle = '#6366f1';
  ctx.font = 'bold 36px Segoe UI, sans-serif';
  ctx.textAlign = 'right';
  ctx.fillText('◉ TRAIL', canvas.width - 40, 60);
  
  ctx.fillStyle = '#64748b';
  ctx.font = '18px Segoe UI, sans-serif';
  ctx.fillText('Patent Pending', canvas.width - 40, 90);
  
  // Download
  const link = document.createElement('a');
  link.download = `trail-constellation-${Date.now()}.png`;
  link.href = canvas.toDataURL('image/png');
  link.click();
}

async function exportAsJSON() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'EXPORT_DATA' });
    if (response.success) {
      const dataStr = JSON.stringify(response.data, null, 2);
      const blob = new Blob([dataStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.download = `trail-export-${Date.now()}.json`;
      link.href = url;
      link.click();
      
      URL.revokeObjectURL(url);
    }
  } catch (error) {
    console.error('[TRAIL] Export error:', error);
    alert('Export failed. Please try again.');
  }
}

// ============================================
// INITIALIZATION
// ============================================

let constellationMap;
let timeMachine;

async function loadHistoryData(timeRange = '24h') {
  // Show loading
  document.getElementById('loading-overlay').classList.remove('hidden');
  document.getElementById('empty-state').classList.add('hidden');
  
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_HISTORY', timeRange });
    
    if (response.success && response.data.length > 0) {
      state.historyData = response.data;
      
      // Process data into graph
      const { nodes, edges } = processHistoryData(response.data);
      state.nodes = nodes;
      state.edges = edges;
      
      // Update timeline
      const timeMachine = new TimeMachine();
      timeMachine.updateTimeDisplay();
      
      // Hide loading, show visualization
      document.getElementById('loading-overlay').classList.add('hidden');
      
      // Show journey summary
      setTimeout(() => {
        const summary = generateJourneySummary(response.data);
        if (summary) {
          timeMachine.showJourneyToast(summary);
        }
      }, 1000);
    } else {
      document.getElementById('loading-overlay').classList.add('hidden');
      document.getElementById('empty-state').classList.remove('hidden');
    }
  } catch (error) {
    console.error('[TRAIL] Load error:', error);
    document.getElementById('loading-overlay').classList.add('hidden');
  }
}

function init() {
  // Initialize constellation map
  const canvas = document.getElementById('constellation-canvas');
  constellationMap = new ConstellationMap(canvas);
  
  // Initialize time machine
  timeMachine = new TimeMachine();
  
  // Setup export buttons
  document.getElementById('export-png-btn').addEventListener('click', exportAsPNG);
  document.getElementById('export-json-btn').addEventListener('click', exportAsJSON);
  
  // Setup clear button
  document.getElementById('clear-btn').addEventListener('click', async () => {
    if (confirm('Clear all browsing history data? This cannot be undone.')) {
      try {
        await chrome.runtime.sendMessage({ type: 'CLEAR_DATA' });
        state.nodes = [];
        state.edges = [];
        document.getElementById('empty-state').classList.remove('hidden');
      } catch (error) {
        console.error('[TRAIL] Clear error:', error);
      }
    }
  });
  
  // Close panel button
  document.getElementById('close-panel').addEventListener('click', () => {
    document.getElementById('info-panel').classList.add('hidden');
    state.selectedNode = null;
  });
  
  // Load initial data
  loadHistoryData('24h');
}

// Start when DOM is ready
document.addEventListener('DOMContentLoaded', init);

console.log('[TRAIL] THE CARTOGRAPHER is mapping...');
