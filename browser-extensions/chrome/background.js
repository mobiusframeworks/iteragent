// InterTools Chrome Extension Background Script
console.log('🚀 InterTools Background Service Worker loaded');

// Extension state
let isEnabled = false;

// Initialize extension
chrome.runtime.onInstalled.addListener((details) => {
  console.log('InterTools installed:', details.reason);
  
  // Set default settings
  chrome.storage.sync.set({
    enabled: false, // User must manually enable
    autoInject: false,
    showNotifications: true
  });
  
  // Create context menus
  chrome.contextMenus.create({
    id: 'intertools-toggle',
    title: 'Toggle InterTools',
    contexts: ['page']
  });
  
  chrome.contextMenus.create({
    id: 'intertools-extract',
    title: 'Extract Element to Cursor',
    contexts: ['all']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'intertools-toggle') {
    toggleInterTools(tab.id);
  } else if (info.menuItemId === 'intertools-extract') {
    startElementExtraction(tab.id);
  }
});

// Toggle InterTools on/off
async function toggleInterTools(tabId) {
  try {
    const result = await chrome.storage.sync.get(['enabled']);
    const newState = !result.enabled;
    
    await chrome.storage.sync.set({ enabled: newState });
    isEnabled = newState;
    
    // Update badge
    chrome.action.setBadgeText({
      text: newState ? 'ON' : '',
      tabId: tabId
    });
    chrome.action.setBadgeBackgroundColor({
      color: newState ? '#10b981' : '#ccc',
      tabId: tabId
    });
    
    if (newState) {
      await injectInterTools(tabId);
    } else {
      await removeInterTools(tabId);
    }
    
  } catch (error) {
    console.error('Toggle failed:', error);
  }
}

// Inject InterTools
async function injectInterTools(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: initInterTools
    });
    
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icon-48.png',
      title: 'InterTools',
      message: 'InterTools enabled! Look for the 🛠️ button.'
    });
    
  } catch (error) {
    console.error('Injection failed:', error);
  }
}

// Remove InterTools
async function removeInterTools(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: cleanupInterTools
    });
  } catch (error) {
    console.error('Cleanup failed:', error);
  }
}

// Start element extraction
async function startElementExtraction(tabId) {
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tabId },
      function: startElementSelection
    });
  } catch (error) {
    console.error('Element extraction failed:', error);
  }
}

// Handle messages
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'GET_STATE') {
    chrome.storage.sync.get(['enabled'], (result) => {
      sendResponse({ enabled: result.enabled || false });
    });
    return true;
  }
});

// Functions to inject into pages
function initInterTools() {
  if (window.interToolsActive) return;
  
  console.log('🚀 InterTools initializing...');
  window.interToolsActive = true;
  
  // Create floating button
  const btn = document.createElement('div');
  btn.id = 'intertools-btn';
  btn.innerHTML = '🛠️';
  btn.title = 'InterTools - Click for options';
  btn.style.cssText = `
    position: fixed; top: 20px; right: 20px; width: 50px; height: 50px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%; display: flex; align-items: center; justify-content: center;
    font-size: 20px; cursor: pointer; z-index: 10000;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3); transition: transform 0.2s;
    border: 2px solid white;
  `;
  
  btn.addEventListener('click', showPanel);
  btn.addEventListener('mouseenter', () => btn.style.transform = 'scale(1.1)');
  btn.addEventListener('mouseleave', () => btn.style.transform = 'scale(1)');
  
  document.body.appendChild(btn);
  console.log('✅ InterTools active');
}

function cleanupInterTools() {
  const btn = document.getElementById('intertools-btn');
  const panel = document.getElementById('intertools-panel');
  if (btn) btn.remove();
  if (panel) panel.remove();
  window.interToolsActive = false;
  console.log('InterTools deactivated');
}

function showPanel() {
  const existing = document.getElementById('intertools-panel');
  if (existing) {
    existing.remove();
    return;
  }
  
  const panel = document.createElement('div');
  panel.id = 'intertools-panel';
  panel.style.cssText = `
    position: fixed; top: 80px; right: 20px; width: 300px;
    background: white; border-radius: 12px; box-shadow: 0 8px 32px rgba(0,0,0,0.3);
    z-index: 10001; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    border: 1px solid #e2e8f0;
  `;
  
  const isLocalhost = location.hostname === 'localhost' || location.hostname === '127.0.0.1';
  const isDev = isLocalhost || ['3000', '3001', '4000', '5000', '5173', '5174', '8000', '8080'].includes(location.port);
  
  panel.innerHTML = `
    <div style="padding: 20px; border-bottom: 1px solid #e2e8f0;">
      <h3 style="margin: 0 0 5px 0; color: #1a1a1a;">🛠️ InterTools</h3>
      <p style="margin: 0; color: #64748b; font-size: 14px;">${location.hostname}</p>
      <p style="margin: 5px 0 0 0; color: ${isDev ? '#10b981' : '#64748b'}; font-size: 12px;">
        ${isDev ? '🟢 Development Environment' : '🔵 Production Site'}
      </p>
    </div>
    
    <div style="padding: 15px;">
      <button onclick="startElementSelection()" style="
        width: 100%; padding: 12px; margin-bottom: 10px;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white; border: none; border-radius: 8px; cursor: pointer; font-weight: 600;
      ">📋 Extract Element to Cursor</button>
      
      <button onclick="analyzePageForCursor()" style="
        width: 100%; padding: 12px; margin-bottom: 10px;
        background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0;
        border-radius: 8px; cursor: pointer; font-weight: 600;
      ">🔍 Analyze Page</button>
      
      <button onclick="connectToCursorProject()" style="
        width: 100%; padding: 12px; margin-bottom: 15px;
        background: #f1f5f9; color: #334155; border: 1px solid #e2e8f0;
        border-radius: 8px; cursor: pointer; font-weight: 600;
      ">🔗 Connect to Project</button>
      
      <div style="padding: 10px; background: #f8fafc; border-radius: 6px; font-size: 12px;">
        <div><strong>URL:</strong> ${location.href}</div>
        <div><strong>Elements:</strong> ${document.querySelectorAll('*').length}</div>
      </div>
    </div>
    
    <div style="padding: 10px 20px; text-align: center; border-top: 1px solid #e2e8f0;">
      <button onclick="document.getElementById('intertools-panel').remove()" style="
        background: none; border: none; color: #64748b; cursor: pointer; font-size: 12px;
      ">Close</button>
    </div>
  `;
  
  document.body.appendChild(panel);
}

function startElementSelection() {
  console.log('Starting element selection...');
  
  const overlay = document.createElement('div');
  overlay.id = 'intertools-overlay';
  overlay.style.cssText = `
    position: fixed; top: 0; left: 0; width: 100%; height: 100%;
    background: rgba(102, 126, 234, 0.1); z-index: 9999; cursor: crosshair;
  `;
  
  const instructions = document.createElement('div');
  instructions.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: white; padding: 20px; border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.3); z-index: 10002; text-align: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;
  instructions.innerHTML = `
    <h3 style="margin: 0 0 10px 0;">Select Element</h3>
    <p style="margin: 0 0 15px 0; color: #64748b;">Click any element to extract it</p>
    <button onclick="document.getElementById('intertools-overlay').remove()" style="
      padding: 8px 16px; background: #ef4444; color: white; border: none; border-radius: 6px; cursor: pointer;
    ">Cancel</button>
  `;
  
  overlay.appendChild(instructions);
  document.body.appendChild(overlay);
  
  let highlighted = null;
  
  function highlight(e) {
    if (highlighted) highlighted.style.outline = '';
    highlighted = e.target;
    highlighted.style.outline = '3px solid #667eea';
  }
  
  function select(e) {
    e.preventDefault();
    e.stopPropagation();
    
    const el = e.target;
    const cursorPrompt = `🎯 Element Extracted from ${location.href}

**Element:** <${el.tagName.toLowerCase()}>
**ID:** ${el.id || 'none'}
**Class:** ${el.className || 'none'}

**HTML:**
\`\`\`html
${el.outerHTML}
\`\`\`

**Text:** ${el.textContent.substring(0, 200)}

**Page:** ${document.title}
**URL:** ${location.href}

What would you like me to help you with regarding this element?`;
    
    navigator.clipboard.writeText(cursorPrompt).then(() => {
      showNotification('✅ Element copied! Paste in Cursor chat.');
      overlay.remove();
      if (highlighted) highlighted.style.outline = '';
    });
  }
  
  document.addEventListener('mouseover', highlight);
  document.addEventListener('click', select);
  
  // Cleanup when overlay is removed
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      mutation.removedNodes.forEach((node) => {
        if (node.id === 'intertools-overlay') {
          document.removeEventListener('mouseover', highlight);
          document.removeEventListener('click', select);
          observer.disconnect();
        }
      });
    });
  });
  observer.observe(document.body, { childList: true });
}

function analyzePageForCursor() {
  const analysis = `🔍 Page Analysis: ${location.href}

**Page Info:**
- Title: ${document.title}
- URL: ${location.href}
- Elements: ${document.querySelectorAll('*').length}
- Forms: ${document.querySelectorAll('form').length}
- Buttons: ${document.querySelectorAll('button').length}
- Images: ${document.querySelectorAll('img').length}

**Scripts:** ${document.querySelectorAll('script[src]').length} external
**Stylesheets:** ${document.querySelectorAll('link[rel="stylesheet"]').length}

**Environment:** ${location.hostname === 'localhost' ? 'Development' : 'Production'}

**Suggestions:**
1. Extract interesting elements
2. Analyze component structure  
3. Copy styles and adapt them
4. Identify patterns to reuse

What aspect would you like me to analyze?`;

  navigator.clipboard.writeText(analysis).then(() => {
    showNotification('📊 Analysis copied! Paste in Cursor chat.');
  });
}

function connectToCursorProject() {
  const projectInfo = `🔗 Project Connection: ${location.href}

**Current Page:**
- URL: ${location.href}
- Title: ${document.title}
- Environment: ${location.hostname === 'localhost' ? 'Development' : 'Production'}

**Development Info:**
${location.hostname === 'localhost' ? `
- Local development detected
- Port: ${location.port || '80'}
- Likely framework: ${detectFramework()}
` : '- Production website'}

**Available Actions:**
1. 📋 Extract elements and components
2. 🎨 Copy styles and convert them
3. 🔧 Analyze code structure
4. 🚀 Get optimization suggestions

Ready to extract elements or analyze code?`;

  navigator.clipboard.writeText(projectInfo).then(() => {
    showNotification('🔗 Project info copied! Paste in Cursor.');
  });
}

function detectFramework() {
  const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src).join(' ');
  if (scripts.includes('react')) return 'React';
  if (scripts.includes('vue')) return 'Vue.js';
  if (scripts.includes('angular')) return 'Angular';
  if (location.port === '5173') return 'Vite';
  if (location.port === '3000') return 'React/Next.js';
  return 'Unknown';
}

function showNotification(message) {
  const notif = document.createElement('div');
  notif.style.cssText = `
    position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
    background: #10b981; color: white; padding: 12px 24px; border-radius: 8px;
    z-index: 10003; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  `;
  notif.textContent = message;
  document.body.appendChild(notif);
  setTimeout(() => notif.remove(), 3000);
}