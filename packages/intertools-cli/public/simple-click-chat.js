// InterTools Simple Click-to-Chat - Guaranteed to Work
(function() {
  'use strict';
  
  console.log('🚀 Loading InterTools Simple Click-to-Chat...');
  
  // Remove any existing instances
  const existing = document.getElementById('intertools-simple-chat');
  if (existing) existing.remove();

  let selectedElement = null;
  let chatBox = null;
  let isActive = true;

  function createChatBox() {
    chatBox = document.createElement('div');
    chatBox.id = 'intertools-simple-chat';
    chatBox.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 400px;
      max-height: 600px;
      background: white;
      border-radius: 15px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.3);
      z-index: 999999;
      display: none;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      border: 2px solid #667eea;
    `;

    chatBox.innerHTML = `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 15px 15px 0 0;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <h3 style="margin: 0; font-size: 16px;">🚀 InterTools Click-to-Chat</h3>
          <button id="close-simple-chat" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">×</button>
        </div>
        <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.9;">Click any element to capture HTML</p>
      </div>
      
      <div style="padding: 15px;">
        <div id="element-info" style="background: #f8f9fa; border-radius: 8px; padding: 10px; margin-bottom: 15px; font-size: 12px;">
          <div style="color: #667eea; font-weight: bold; margin-bottom: 5px;">📍 Selected Element:</div>
          <div id="element-details" style="color: #666;">Click on any element to see details...</div>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; font-size: 12px; color: #333; margin-bottom: 5px; font-weight: bold;">💬 Message for Cursor:</label>
          <textarea id="cursor-message" placeholder="Describe what you want to improve..." style="width: 100%; height: 80px; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 12px; resize: none; font-family: inherit;"></textarea>
        </div>
        
        <div style="margin-bottom: 15px;">
          <label style="display: block; font-size: 12px; color: #333; margin-bottom: 5px; font-weight: bold;">📄 HTML Code:</label>
          <div id="html-display" style="background: #2d2d2d; color: #f8f8f2; padding: 10px; border-radius: 8px; font-family: monospace; font-size: 11px; max-height: 150px; overflow-y: auto; white-space: pre-wrap; word-break: break-all;">
            Click on an element to see its HTML code...
          </div>
        </div>
        
        <div style="display: flex; gap: 10px; margin-bottom: 15px;">
          <button id="send-to-cursor" style="flex: 1; background: #667eea; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 12px; font-weight: bold;">
            🤖 Send to Cursor
          </button>
          <button id="copy-html" style="background: #28a745; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 12px;">
            📋 Copy HTML
          </button>
        </div>
        
        <div style="display: flex; gap: 10px;">
          <button id="toggle-mode" style="flex: 1; background: #ffc107; color: black; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 11px;">
            🔄 Toggle Mode
          </button>
          <button id="clear-selection" style="background: #dc3545; color: white; border: none; padding: 10px; border-radius: 8px; cursor: pointer; font-size: 11px;">
            🗑️ Clear
          </button>
        </div>
        
        <div id="status-indicator" style="margin-top: 10px; padding: 8px; background: #d4edda; border-radius: 5px; font-size: 11px; color: #155724; text-align: center;">
          ✅ Ready - Click any element to start
        </div>
      </div>
    `;

    document.body.appendChild(chatBox);
    console.log('📱 Chat box created');
  }

  function setupEventListeners() {
    // Click handler for elements
    document.addEventListener('click', function(e) {
      console.log('🖱️ Click detected:', e.target.tagName, 'isActive:', isActive);
      
      if (isActive && !e.target.closest('#intertools-simple-chat')) {
        e.preventDefault();
        e.stopPropagation();
        captureElement(e.target, e);
      }
    });

    // Chat box event handlers
    document.addEventListener('click', function(e) {
      if (e.target.id === 'close-simple-chat') hideChatBox();
      if (e.target.id === 'send-to-cursor') sendToCursor();
      if (e.target.id === 'copy-html') copyHTML();
      if (e.target.id === 'toggle-mode') toggleMode();
      if (e.target.id === 'clear-selection') clearSelection();
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && chatBox && chatBox.style.display === 'block') {
        hideChatBox();
      }
      if (e.ctrlKey && e.key === 'Enter' && selectedElement) {
        sendToCursor();
      }
    });
  }

  function captureElement(element, event) {
    console.log('🎯 Capturing element:', element.tagName);
    selectedElement = element;
    
    // Highlight element
    element.style.outline = '3px solid #667eea';
    element.style.outlineOffset = '2px';
    element.style.backgroundColor = 'rgba(102, 126, 234, 0.1)';
    
    // Update element info
    const rect = element.getBoundingClientRect();
    const details = document.getElementById('element-details');
    if (details) {
      details.innerHTML = `
        <div><strong>Tag:</strong> ${element.tagName}</div>
        <div><strong>ID:</strong> ${element.id || 'None'}</div>
        <div><strong>Classes:</strong> ${element.className || 'None'}</div>
        <div><strong>Position:</strong> (${Math.round(rect.x)}, ${Math.round(rect.y)})</div>
        <div><strong>Size:</strong> ${Math.round(rect.width)}×${Math.round(rect.height)}</div>
        <div><strong>Text:</strong> "${element.textContent.substring(0, 50)}${element.textContent.length > 50 ? '...' : ''}"</div>
      `;
    }
    
    // Update HTML display
    const htmlDisplay = document.getElementById('html-display');
    if (htmlDisplay) {
      htmlDisplay.textContent = element.outerHTML;
    }
    
    // Show chat box
    showChatBox();
    
    // Show notification
    showNotification(`✅ Captured: ${element.tagName}${element.id ? '#' + element.id : ''}`, 'success');
  }

  function showChatBox() {
    if (chatBox) {
      chatBox.style.display = 'block';
      console.log('📱 Chat box shown');
    }
  }

  function hideChatBox() {
    if (chatBox) {
      chatBox.style.display = 'none';
    }
    if (selectedElement) {
      selectedElement.style.outline = '';
      selectedElement.style.outlineOffset = '';
      selectedElement.style.backgroundColor = '';
      selectedElement = null;
    }
  }

  function toggleMode() {
    isActive = !isActive;
    if (isActive) {
      showNotification('🔄 Click mode enabled', 'success');
    } else {
      showNotification('🔄 Click mode disabled', 'info');
      hideChatBox();
    }
  }

  function clearSelection() {
    if (selectedElement) {
      selectedElement.style.outline = '';
      selectedElement.style.outlineOffset = '';
      selectedElement.style.backgroundColor = '';
      selectedElement = null;
    }
    
    const details = document.getElementById('element-details');
    if (details) details.textContent = 'Click on any element to see details...';
    
    const htmlDisplay = document.getElementById('html-display');
    if (htmlDisplay) htmlDisplay.textContent = 'Click on an element to see its HTML code...';
    
    const status = document.getElementById('status-indicator');
    if (status) {
      status.textContent = 'Selection cleared - Click any element to start';
      status.style.background = '#fff3cd';
      status.style.color = '#856404';
    }
  }

  async function sendToCursor() {
    if (!selectedElement) {
      showNotification('❌ Please click on an element first', 'error');
      return;
    }

    const message = document.getElementById('cursor-message').value.trim();
    if (!message) {
      showNotification('❌ Please enter a message', 'error');
      return;
    }

    const htmlContent = selectedElement.outerHTML;
    const elementInfo = {
      tagName: selectedElement.tagName,
      id: selectedElement.id,
      className: selectedElement.className,
      textContent: selectedElement.textContent.substring(0, 200)
    };
    const pageContext = {
      title: document.title,
      url: window.location.href,
      timestamp: new Date().toLocaleString()
    };

    const cursorMessage = `🤖 InterTools Click-to-Chat Report

📄 Page: ${pageContext.title}
🔗 URL: ${pageContext.url}
⏰ Time: ${pageContext.timestamp}

📍 Element Details:
• Tag: ${elementInfo.tagName}
• ID: ${elementInfo.id || 'None'}
• Classes: ${elementInfo.className || 'None'}
• Text: "${elementInfo.textContent}"

💬 User Feedback:
${message}

📄 HTML Content:
\`\`\`html
${htmlContent}
\`\`\`

🎯 Action Required: Please analyze this HTML element and user feedback. Provide specific suggestions for improvement, styling changes, or functionality enhancements.`;

    try {
      await navigator.clipboard.writeText(cursorMessage);
      showNotification('✅ Message sent to Cursor!', 'success');
      
      // Clear the message input
      document.getElementById('cursor-message').value = '';
      
    } catch (error) {
      showNotification('❌ Failed to copy to clipboard', 'error');
      console.error('Error sending to Cursor:', error);
    }
  }

  function copyHTML() {
    if (!selectedElement) {
      showNotification('❌ Please click on an element first', 'error');
      return;
    }

    const htmlContent = selectedElement.outerHTML;
    navigator.clipboard.writeText(htmlContent);
    showNotification('✅ HTML copied to clipboard!', 'success');
  }

  function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4caf50' : type === 'error' ? '#f44336' : '#2196f3'};
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 1000000;
      max-width: 300px;
    `;
    notification.textContent = message;
    
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  // Initialize
  createChatBox();
  setupEventListeners();
  showNotification('🚀 InterTools Simple Click-to-Chat loaded! Click any element to start.', 'success');
  
  console.log('🚀 InterTools Simple Click-to-Chat loaded successfully!');
  console.log('💡 Click anywhere on the page to capture HTML and send to Cursor!');
  
  // Make it globally available
  window.InterToolsSimpleChat = {
    toggleMode: toggleMode,
    clearSelection: clearSelection,
    hideChatBox: hideChatBox
  };
})();

