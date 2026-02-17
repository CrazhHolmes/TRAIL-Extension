# ✦ TRAIL - Visual History Mapper

Transform your browsing history into an interactive cosmic constellation map.

![TRAIL Constellation](https://img.shields.io/badge/TRAIL-Constellation-blueviolet?style=flat-square)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-green?style=flat-square)
![D3.js](https://img.shields.io/badge/D3.js-Visualization-orange?style=flat-square)

## Features

### 🌌 Constellation Map
- **Favicon Stars**: Each website is a star with its actual favicon
- **Constellation Lines**: Temporal connections between sites visited together
- **Nebula Background**: Animated cosmic atmosphere with twinkling stars
- **Force-Directed Layout**: Physics-based positioning for natural clustering

### 🎨 Visual Design
- **Glassmorphism UI**: Frosted glass panels with backdrop blur
- **Category Colors**: Auto-detected categories with unique colors
  - 🔵 Tech (GitHub, Stack Overflow, docs)
  - 💗 Social (Reddit, Twitter, Discord)
  - 🟠 News (CNN, NYT, TechCrunch)
  - 🟢 Education (Coursera, Khan Academy)
  - 🔴 Shopping (Amazon, eBay)
  - 🟣 Entertainment (YouTube, Netflix)
  - 🩵 Finance (PayPal, Robinhood)

### 🎛️ Interactive Controls
- **Time Filters**: View 1h, 24h, 7d, 30d, or all time
- **Search**: Find specific domains instantly
- **Zoom & Pan**: Navigate the cosmos freely
- **Export PNG**: Save your constellation as an image

### 📊 Statistics
- Total stars (unique domains)
- Visit counts per site
- First/last visit timestamps
- Connection strength between sites

## Installation

### Chrome Web Store (Coming Soon)

### Developer Mode
1. Download the latest release
2. Open Chrome → Extensions → Developer mode ON
3. Click "Load unpacked"
4. Select the extension folder

## Usage

1. **Browse normally** - TRAIL silently tracks your journey
2. **Click the extension icon** - Opens the cosmic control center popup
3. **View your map** - Click "Open Constellation Map"
4. **Explore** - Click stars to see details, drag to rearrange

## Privacy

- All data stored locally in Chrome storage
- No external servers or tracking
- Optional: Data can be encrypted and scattered to DuckDNS for cross-device sync

## Architecture

```
Chrome Extension
├── Background Script    → Tracks history & categorizes sites
├── Popup              → Cosmic control center with stats
├── Constellation      → D3.js visualization
└── Storage            → IndexedDB for local persistence
```

## Category Detection

TRAIL automatically categorizes websites using URL pattern matching:

```javascript
// Example patterns
/stackoverflow\.com/i → 'tech'
/reddit\.com/i         → 'social'
/youtube\.com/i        → 'entertainment'
/\.edu$/i              → 'edu'
```

## Tech Stack

- **Manifest V3** - Latest Chrome extension format
- **D3.js v7** - Force-directed graph visualization
- **Chrome Storage API** - Local data persistence
- **Chrome History API** - Browsing data access

## Development

```bash
# Clone
git clone https://github.com/CrazhHolmes/TRAIL-Extension.git

# Load in Chrome
# 1. Open chrome://extensions/
# 2. Enable Developer Mode
# 3. Load unpacked → Select folder
```

## Roadmap

- [x] Core constellation visualization
- [x] Category-based coloring
- [x] Time range filters
- [x] Search functionality
- [x] PNG export
- [ ] Session analytics (dwell time)
- [ ] Cross-device sync via DuckDNS
- [ ] Trending constellations
- [ ] Shareable constellation links

## License

MIT - Built by Wizardrytezch

---

> "Every website is a star. Your browsing history is a galaxy."
