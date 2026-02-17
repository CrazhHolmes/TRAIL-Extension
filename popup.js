document.addEventListener('DOMContentLoaded', function() {
  document.getElementById('open-btn').addEventListener('click', function() {
    chrome.tabs.create({url: chrome.runtime.getURL('constellation.html')});
  });
});
