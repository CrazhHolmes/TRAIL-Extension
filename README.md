# TRAIL - Automatic Visual History Mapper

> **Built by [CrazhHolmes](https://github.com/CrazhHolmes)** | ⭐ [Star this repo](https://github.com/CrazhHolmes) | Patent Pending

TRAIL transforms your browsing history into an interactive constellation map, visualizing your digital journeys across the web.

![TRAIL Constellation Map](screenshot.png)

## 🌟 Features

### THE GHOST - Smart History Capture
- Automatically captures every URL you visit
- Extracts readable content using Mozilla's Readability.js
- Stores data locally in IndexedDB - **zero external APIs**
- Privacy-first: Your data never leaves your browser
- Auto-purges data after 30 days (configurable)

### THE CARTOGRAPHER - Constellation Visualization
- Beautiful force-directed graph on HTML5 Canvas
- Each website is a node (size = dwell time, color = category)
- Connections show your browsing flow
- Physics simulation with zoom, pan, and drag
- Detects "Wormholes": surprising jumps between topics

### THE STORYTELLER - NLP Insights
- Entity extraction (People, Places, Organizations) using compromise.js
- "Journey Summaries": "You traveled from [Topic A] to [Topic B]"
- Highlights interesting patterns in your browsing

### THE TIME MACHINE - Timeline Replay
- 24hr, 7-day, 30-day views
- Timeline slider to scrub through history
- Replay button: Animate your browsing session
- Pause/Play controls

### Export & Share
- **Share Your Trail**: Generate PNG of your constellation map
- **JSON Export**: Portable archive of your wanderings
- Watermarked with your digital identity

## 🚀 Installation

### Chrome/Edge (Chromium-based browsers)

1. **Download the extension**
   ```bash
   git clone https://github.com/CrazhHolmes/trail-extension.git
   cd trail-extension
   ```

2. **Open Chrome Extensions page**
   - Navigate to `chrome://extensions`
   - Enable "Developer mode" (toggle in top-right)

3. **Load the extension**
   - Click "Load unpacked"
   - Select the `extension` folder
   - TRAIL will now open on every new tab!

### Firefox (requires manifest v2 conversion)

Firefox support coming soon via webextension-polyfill.

## 📁 Project Structure

```
extension/
├── manifest.json          # Extension manifest (Manifest V3)
├── background.js          # THE GHOST - History capture
├── content.js            # Content extraction script
├── newtab.html           # New Tab page UI
├── newtab.js             # THE CARTOGRAPHER + THE STORYTELLER + THE TIME MACHINE
├── styles.css            # Constellation theme styles
├── lib/
│   └── Readability.js    # Mozilla's article extractor
└── icons/
    ├── icon16.png
    ├── icon48.png
    └── icon128.png
```

## 🔒 Privacy

TRAIL is designed with privacy as a core principle:

- ✅ All data stored locally in IndexedDB
- ✅ Zero external API calls
- ✅ No tracking or analytics
- ✅ No backend server
- ✅ Open source - audit the code yourself
- ✅ Auto-purges old data (configurable)

## 🎨 Category Colors

| Category | Color | Example Sites |
|----------|-------|---------------|
| Tech | 🔵 Blue | GitHub, Stack Overflow, MDN |
| Social | 🩷 Pink | Twitter, Reddit, LinkedIn |
| News | 🟠 Orange | BBC, NYT, TechCrunch |
| Education | 🟢 Green | Wikipedia, Khan Academy, arXiv |
| Shopping | 🔴 Red | Amazon, eBay, Etsy |
| Entertainment | 🟣 Purple | Netflix, Spotify, YouTube |
| Finance | 🩵 Teal | PayPal, Coinbase, Banks |
| Other | ⚪ Gray | Everything else |

## 🛠️ Development

### Zero-Cost Constraints

This project follows strict zero-cost principles:

- ❌ No backend server (GitHub Pages for landing only)
- ❌ No paid APIs (all client-side processing)
- ❌ No external databases (IndexedDB only)
- ❌ No build steps required (vanilla JS)
- ❌ No tracking/analytics code

### BLACK BOX Notice

The `calculateSemanticProximity()` function in `newtab.js` is a **placeholder** for the temporal-semantic clustering algorithm. The actual TF-IDF similarity implementation will be released post-patent filing.

**Classification:** GREY (Visualization logic disclosed, clustering algorithm BLACK)  
**Patent:** Provisional #019 Filed

## 🤝 Contributing

Contributions welcome! Please ensure all commits include:

```
Built by CrazhHolmes | github.com/CrazhHolmes
```

## 📜 License

MIT License - See [LICENSE](LICENSE) for details.

**Patent Pending** - Unauthorized commercial use of the temporal-semantic clustering algorithm prohibited.

## 🙏 Credits

- [Mozilla Readability](https://github.com/mozilla/readability) - Article extraction
- [compromise.js](https://compromise.cool/) - NLP in the browser
- [spencermountain](https://github.com/spencermountain) - compromise.js creator

---

<p align="center">
  <strong>Built with ❤️ by <a href="https://github.com/CrazhHolmes">CrazhHolmes</a></strong><br>
  <a href="https://github.com/CrazhHolmes">⭐ Star this repo</a> • 
  <a href="https://github.com/CrazhHolmes/trail-extension/issues">🐛 Report Bug</a> • 
  <a href="https://github.com/CrazhHolmes/trail-extension/issues">💡 Request Feature</a>
</p>

<p align="center">
  <sub>Patent Pending • FTX Protocol Enforced</sub>
</p>
