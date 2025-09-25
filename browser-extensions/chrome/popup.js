// InterTools Popup Script
document.addEventListener('DOMContentLoaded', async () => {
  console.log('InterTools popup loaded');
  
  // Get current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  
  // Update page info
  updatePageInfo(tab);
  
  // Check InterTools status
  checkStatus(tab.id);
  
  // Set up event listeners
  setupEventListeners(tab.id);
});

function updatePageInfo(tab) {
  document.getElementById('page-title').textContent = tab.title || 'Unknown';
  document.getElementById('page-url').textContent = new URL(tab.url).hostname;
  
  // Detect environment
  const url = new URL(tab.url);
  const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
  const devPorts = ['3000', '3001', '4000', '5000', '5173', '5174', '8000', '8080'];
  const isDev = isLocalhost || devPorts.includes(url.port);
  
  document.getElementById('page-env').textContent = isDev ? 'Development' : 'Production';
  document.getElementById('page-env').style.color = isDev ? '#10b981' : '#64748b';
}

async function checkStatus(tabId) {
  try {
    const result = await chrome.storage.sync.get(['enabled']);
    const isEnabled = result.enabled || false;
    
    updateStatus(isEnabled);
    
  } catch (error) {
    console.error('Failed to check status:', error);
    document.getElementById('status').textContent = 'Status check failed';
  }
}

function updateStatus(isEnabled) {
  const statusEl = document.getElementById('status');
  const toggleBtn = document.getElementById('toggle-btn');
  
  if (isEnabled) {
    statusEl.textContent = '✅ Active';
    statusEl.style.color = '#10b981';
    toggleBtn.textContent = 'Disable InterTools';
    toggleBtn.classList.remove('primary');
  } else {
    statusEl.textContent = '⭕ Inactive';
    statusEl.style.color = '#ef4444';
    toggleBtn.textContent = 'Enable InterTools';
    toggleBtn.classList.add('primary');
  }
}

function setupEventListeners(tabId) {
  // Toggle button
  document.getElementById('toggle-btn').addEventListener('click', async () => {
    try {
      const result = await chrome.storage.sync.get(['enabled']);
      const newState = !result.enabled;
      
      await chrome.storage.sync.set({ enabled: newState });
      updateStatus(newState);
      
      // Send message to background script
      chrome.runtime.sendMessage({
        type: 'TOGGLE_INTERTOOLS',
        tabId: tabId
      });
      
      // Close popup after short delay
      setTimeout(() => window.close(), 500);
      
    } catch (error) {
      console.error('Toggle failed:', error);
    }
  });
  
  // Extract element button
  document.getElementById('extract-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({
      type: 'EXTRACT_ELEMENT',
      tabId: tabId
    });
    window.close();
  });
  
  // Analyze page button
  document.getElementById('analyze-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({
      type: 'ANALYZE_PAGE',
      tabId: tabId
    });
    window.close();
  });
  
  // Connect project button
  document.getElementById('connect-btn').addEventListener('click', () => {
    chrome.runtime.sendMessage({
      type: 'CONNECT_CURSOR',
      tabId: tabId
    });
    window.close();
  });
}

// Handle keyboard shortcuts
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    window.close();
  }
  
  // Ctrl/Cmd + Enter to toggle
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    document.getElementById('toggle-btn').click();
  }
});