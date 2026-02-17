/* TRAIL v1.0 | Built by Wizardrytezch | github.com/CrazhHolmes | Patent Pending */

/**
 * TRAIL Constellation Visualization
 * Force-directed graph of browsing history
 */

const CONFIG = {
  NODE_SIZE_MIN: 8,
  NODE_SIZE_MAX: 35,
  CONNECTION_DISTANCE: 200,
  FORCE_REPULSION: 300,
  FORCE_SPRING: 0.03,
  FORCE_DAMPING: 0.92,
  ZOOM_MIN: 0.1,
  ZOOM_MAX: 5,
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

class ConstellationMap {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.nodes = [];
    this.edges = [];
    this.camera = { x: 0, y: 0, zoom: 1 };
    this.isDragging = false;
    this.draggedNode = null;
    this.hoverNode = null;
    this.mouse = { x: 0, y: 0 };
    
    this.resize();
    this.setupEvents();
    this.loadData();
    this.animate();
  }

  resize() {
    const dpr = window.devicePixelRatio || 1;
    this.canvas.width = window.innerWidth * dpr;
    this.canvas.height = window.innerHeight * dpr;
    this.canvas.style.width = '100vw';
    this.canvas.style.height = '100vh';
    this.ctx.scale(dpr, dpr);
  }

  setupEvents() {
    window.addEventListener('resize', () => this.resize());
    
    this.canvas.addEventListener('mousedown', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - window.innerWidth/2) / this.camera.zoom + this.camera.x;
      const y = (e.clientY - rect.top - window.innerHeight/2) / this.camera.zoom + this.camera.y;
      
      const clicked = this.nodes.find(n => {
        const dx = n.x - x, dy = n.y - y;
        return Math.sqrt(dx*dx + dy*dy) < n.radius + 10;
      });
      
      if (clicked) {
        this.isDragging = true;
        this.draggedNode = clicked;
      } else {
        this.isDragging = true;
        this.lastMouse = { x: e.clientX, y: e.clientY };
      }
    });

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left - window.innerWidth/2) / this.camera.zoom + this.camera.x;
      const y = (e.clientY - rect.top - window.innerHeight/2) / this.camera.zoom + this.camera.y;
      
      this.hoverNode = this.nodes.find(n => {
        const dx = n.x - x, dy = n.y - y;
        return Math.sqrt(dx*dx + dy*dy) < n.radius + 10;
      });
      
      this.canvas.style.cursor = this.hoverNode ? 'pointer' : 'grab';
      
      if (this.isDragging) {
        if (this.draggedNode) {
          this.draggedNode.x = x;
          this.draggedNode.y = y;
          this.draggedNode.vx = 0;
          this.draggedNode.vy = 0;
        } else if (this.lastMouse) {
          this.camera.x -= (e.clientX - this.lastMouse.x) / this.camera.zoom;
          this.camera.y -= (e.clientY - this.lastMouse.y) / this.camera.zoom;
          this.lastMouse = { x: e.clientX, y: e.clientY };
        }
      }
    });

    this.canvas.addEventListener('mouseup', () => {
      this.isDragging = false;
      this.draggedNode = null;
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
      this.camera.zoom = Math.max(CONFIG.ZOOM_MIN, Math.min(CONFIG.ZOOM_MAX, this.camera.zoom * zoomFactor));
    });
  }

  async loadData() {
    // Mock data for visualization - in real extension this comes from IndexedDB
    const mockData = [
      { id: 1, title: 'GitHub', url: 'github.com', category: 'tech', timestamp: Date.now() - 100000 },
      { id: 2, title: 'Stack Overflow', url: 'stackoverflow.com', category: 'tech', timestamp: Date.now() - 200000 },
      { id: 3, title: 'Twitter', url: 'twitter.com', category: 'social', timestamp: Date.now() - 300000 },
      { id: 4, title: 'Wikipedia', url: 'wikipedia.org', category: 'edu', timestamp: Date.now() - 400000 },
      { id: 5, title: 'YouTube', url: 'youtube.com', category: 'entertainment', timestamp: Date.now() - 500000 },
      { id: 6, title: 'Reddit', url: 'reddit.com', category: 'social', timestamp: Date.now() - 600000 },
      { id: 7, title: 'MDN', url: 'developer.mozilla.org', category: 'tech', timestamp: Date.now() - 700000 },
      { id: 8, title: 'Hacker News', url: 'news.ycombinator.com', category: 'news', timestamp: Date.now() - 800000 },
    ];

    // Create nodes in spiral pattern
    mockData.forEach((item, i) => {
      const angle = i * 0.8;
      const distance = 100 + i * 50;
      this.nodes.push({
        id: item.id,
        x: Math.cos(angle) * distance,
        y: Math.sin(angle) * distance,
        vx: 0, vy: 0,
        radius: CONFIG.NODE_SIZE_MIN + Math.random() * 15,
        color: CONFIG.CATEGORY_COLORS[item.category] || CONFIG.CATEGORY_COLORS.other,
        title: item.title,
        category: item.category,
        data: item
      });
    });

    // Create edges between nearby nodes
    for (let i = 0; i < this.nodes.length; i++) {
      for (let j = i + 1; j < this.nodes.length; j++) {
        const dx = this.nodes[i].x - this.nodes[j].x;
        const dy = this.nodes[i].y - this.nodes[j].y;
        const dist = Math.sqrt(dx*dx + dy*dy);
        if (dist < 300) {
          this.edges.push({
            source: this.nodes[i],
            target: this.nodes[j],
            strength: 1 - dist/300
          });
        }
      }
    }
  }

  updatePhysics() {
    // Repulsion
    for (let i = 0; i < this.nodes.length; i++) {
      const a = this.nodes[i];
      if (a === this.draggedNode) continue;
      
      for (let j = i + 1; j < this.nodes.length; j++) {
        const b = this.nodes[j];
        const dx = b.x - a.x, dy = b.y - a.y;
        const dist = Math.sqrt(dx*dx + dy*dy) || 1;
        
        if (dist < CONFIG.CONNECTION_DISTANCE * 2) {
          const force = CONFIG.FORCE_REPULSION / (dist * dist);
          const fx = (dx/dist) * force;
          const fy = (dy/dist) * force;
          a.vx -= fx; a.vy -= fy;
          b.vx += fx; b.vy += fy;
        }
      }
    }

    // Spring attraction along edges
    this.edges.forEach(edge => {
      const dx = edge.target.x - edge.source.x;
      const dy = edge.target.y - edge.source.y;
      const dist = Math.sqrt(dx*dx + dy*dy) || 1;
      const force = (dist - 100) * CONFIG.FORCE_SPRING;
      
      const fx = (dx/dist) * force;
      const fy = (dy/dist) * force;
      
      if (edge.source !== this.draggedNode) {
        edge.source.vx += fx;
        edge.source.vy += fy;
      }
      if (edge.target !== this.draggedNode) {
        edge.target.vx -= fx;
        edge.target.vy -= fy;
      }
    });

    // Center gravity + apply velocity
    this.nodes.forEach(node => {
      if (node === this.draggedNode) return;
      
      node.vx -= node.x * 0.0005;
      node.vy -= node.y * 0.0005;
      node.vx *= CONFIG.FORCE_DAMPING;
      node.vy *= CONFIG.FORCE_DAMPING;
      node.x += node.vx;
      node.y += node.vy;
    });
  }

  render() {
    this.ctx.fillStyle = '#0a0a0f';
    this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);

    const cx = window.innerWidth / 2;
    const cy = window.innerHeight / 2;

    // Draw edges
    this.edges.forEach(edge => {
      const x1 = (edge.source.x - this.camera.x) * this.camera.zoom + cx;
      const y1 = (edge.source.y - this.camera.y) * this.camera.zoom + cy;
      const x2 = (edge.target.x - this.camera.x) * this.camera.zoom + cx;
      const y2 = (edge.target.y - this.camera.y) * this.camera.zoom + cy;
      
      this.ctx.beginPath();
      this.ctx.moveTo(x1, y1);
      this.ctx.lineTo(x2, y2);
      this.ctx.strokeStyle = `rgba(99, 102, 241, ${edge.strength * 0.4})`;
      this.ctx.lineWidth = edge.strength * 2 * this.camera.zoom;
      this.ctx.stroke();
    });

    // Draw nodes
    this.nodes.forEach(node => {
      const x = (node.x - this.camera.x) * this.camera.zoom + cx;
      const y = (node.y - this.camera.y) * this.camera.zoom + cy;
      const r = node.radius * this.camera.zoom;
      
      // Glow
      const grad = this.ctx.createRadialGradient(x, y, 0, x, y, r * 2);
      grad.addColorStop(0, node.color + '60');
      grad.addColorStop(1, 'transparent');
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(x, y, r * 2, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Node body
      this.ctx.fillStyle = node.color;
      this.ctx.beginPath();
      this.ctx.arc(x, y, r, 0, Math.PI * 2);
      this.ctx.fill();
      
      // Border
      this.ctx.strokeStyle = node === this.hoverNode ? '#fff' : node.color;
      this.ctx.lineWidth = node === this.hoverNode ? 3 : 1;
      this.ctx.stroke();
      
      // Label for hovered node
      if (node === this.hoverNode) {
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '14px sans-serif';
        this.ctx.textAlign = 'center';
        this.ctx.fillText(node.title, x, y + r + 20);
      }
    });
  }

  animate() {
    this.updatePhysics();
    this.render();
    requestAnimationFrame(() => this.animate());
  }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  const canvas = document.getElementById('constellation-canvas');
  new ConstellationMap(canvas);
});
