/* TRAIL v1.0 | Built by Wizardrytezch | github.com/CrazhHolmes | Patent Pending */

/**
 * THE EXTRACTOR - Content Script
 * Extracts readable content from web pages using Mozilla's Readability.js
 * Sends extracted data to background script for storage
 */

(function() {
  'use strict';
  
  // Avoid running on iframes or non-HTML documents
  if (window.self !== window.top || document.contentType !== 'text/html') {
    return;
  }
  
  // Skip certain URL patterns
  const skipPatterns = [
    /^chrome:\/\//,
    /^file:\/\//,
    /google\.com\/search/,
    /\.pdf$/i,
    /\.jpg$/i,
    /\.png$/i,
    /\.gif$/i
  ];
  
  if (skipPatterns.some(pattern => pattern.test(window.location.href))) {
    return;
  }
  
  let extractionTimeout;
  let isExtracted = false;
  
  function extractContent() {
    if (isExtracted) return;
    
    try {
      // Clone the document for Readability to work with
      const documentClone = document.cloneNode(true);
      
      // Use Readability to extract article content
      const reader = new Readability(documentClone);
      const article = reader.parse();
      
      if (article && article.textContent && article.textContent.length > 100) {
        isExtracted = true;
        
        // Extract entities using compromise.js if available
        const entities = extractEntities(article.textContent);
        
        // Send to background script
        chrome.runtime.sendMessage({
          type: 'CONTENT_EXTRACTED',
          data: {
            title: article.title || document.title,
            content_snippet: article.textContent.substring(0, 5000),
            byline: article.byline || '',
            excerpt: article.excerpt || '',
            siteName: article.siteName || '',
            entities: entities
          }
        });
        
        console.log('[TRAIL] Content extracted:', article.title);
      }
    } catch (error) {
      console.error('[TRAIL] Extraction error:', error);
    }
  }
  
  // Extract entities using compromise.js (loaded from CDN in newtab)
  function extractEntities(text) {
    const entities = {
      people: [],
      places: [],
      organizations: [],
      topics: []
    };
    
    // Simple regex-based extraction as fallback
    // Capitalized words that appear multiple times are likely entities
    const words = text.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
    const wordCounts = {};
    
    words.forEach(word => {
      if (word.length > 2) {
        wordCounts[word] = (wordCounts[word] || 0) + 1;
      }
    });
    
    // Most frequent capitalized words are likely entities
    const sortedWords = Object.entries(wordCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
    
    entities.topics = sortedWords;
    
    return entities;
  }
  
  // Wait for page to be fully loaded
  if (document.readyState === 'complete') {
    extractionTimeout = setTimeout(extractContent, 2000);
  } else {
    window.addEventListener('load', () => {
      extractionTimeout = setTimeout(extractContent, 2000);
    });
  }
  
  // Also try on DOMContentLoaded as backup
  document.addEventListener('DOMContentLoaded', () => {
    if (!isExtracted) {
      clearTimeout(extractionTimeout);
      extractionTimeout = setTimeout(extractContent, 3000);
    }
  });
  
})();
