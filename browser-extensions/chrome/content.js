// InterTools Content Script
console.log('InterTools content script loaded');

// Check if InterTools should be enabled on this page
chrome.storage.sync.get(['enabled'], (result) => {
  if (result.enabled) {
    console.log('InterTools is enabled, but waiting for user action');
    // Don't auto-inject, wait for user to click extension or use context menu
  }
});

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.type) {
    case 'TOGGLE_INTERTOOLS':
      // This is handled by background script injection
      break;
      
    case 'EXTRACT_ELEMENT':
      if (typeof startElementSelection === 'function') {
        startElementSelection();
      }
      break;
      
    case 'ANALYZE_PAGE':
      if (typeof analyzePageForCursor === 'function') {
        analyzePageForCursor();
      }
      break;
      
    case 'CONNECT_CURSOR':
      if (typeof connectToCursorProject === 'function') {
        connectToCursorProject();
      }
      break;
  }
  
  sendResponse({ success: true });
});

// Simple notification function
function showInterToolsNotification(message) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    left: 50%;
    transform: translateX(-50%);
    background: #10b981;
    color: white;
    padding: 12px 24px;
    border-radius: 8px;
    z-index: 10003;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    font-size: 14px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
  `;
  notification.textContent = message;
  document.body.appendChild(notification);
  
  setTimeout(() => {
    notification.remove();
  }, 3000);
}