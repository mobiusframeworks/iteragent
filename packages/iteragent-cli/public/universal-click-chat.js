// InterTools Universal Click-to-Chat Extension
// This script can be injected into ANY website to enable click-to-chat functionality

(function() {
  'use strict';
  
  // Remove any existing instances
  const existingChat = document.getElementById('intertools-universal-chat');
  if (existingChat) existingChat.remove();
  
  const existingOverlay = document.getElementById('intertools-chat-overlay');
  if (existingOverlay) existingOverlay.remove();

  class InterToolsUniversalChat {
    constructor() {
      this.serverUrl = 'http://localhost:3001';
      this.isActive = false;
      this.chatBox = null;
      this.selectedElement = null;
      this.sessionId = this.generateSessionId();
      this.clickCount = 0;
      this.init();
    }

    generateSessionId() {
      return 'universal-chat-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    init() {
      this.createChatBox();
      this.setupEventListeners();
      this.isActive = true; // Make it active by default
      this.showWelcomeMessage();
      console.log('🚀 InterTools Universal Click-to-Chat loaded!');
    }

    createChatBox() {
      // Create main chat container
      this.chatBox = document.createElement('div');
      this.chatBox.id = 'intertools-universal-chat';
      this.chatBox.style.cssText = `
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
        animation: slideInUp 0.3s ease-out;
        border: 2px solid #667eea;
      `;

      this.chatBox.innerHTML = this.getChatBoxHTML();
      document.body.appendChild(this.chatBox);

      // Add CSS animations
      this.addStyles();
    }

    addStyles() {
      const style = document.createElement('style');
      style.textContent = `
        @keyframes slideInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideOutDown {
          from { opacity: 1; transform: translateY(0); }
          to { opacity: 0; transform: translateY(20px); }
        }
        .intertools-element-highlight {
          outline: 3px solid #667eea !important;
          outline-offset: 2px !important;
          background-color: rgba(102, 126, 234, 0.1) !important;
          transition: all 0.3s ease !important;
        }
        .intertools-hover-preview {
          outline: 2px dashed #ff6b6b !important;
          outline-offset: 1px !important;
          background-color: rgba(255, 107, 107, 0.05) !important;
        }
        .intertools-click-pulse {
          animation: clickPulse 0.6s ease-out;
        }
        @keyframes clickPulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.8; }
          100% { transform: scale(1.5); opacity: 0; }
        }
        .intertools-notification {
          position: fixed;
          top: 20px;
          right: 20px;
          background: #4caf50;
          color: white;
          padding: 15px 20px;
          border-radius: 10px;
          box-shadow: 0 4px 20px rgba(0,0,0,0.3);
          z-index: 1000000;
          animation: slideIn 0.3s ease-out;
          max-width: 300px;
        }
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(100%); }
          to { opacity: 1; transform: translateX(0); }
        }
      `;
      document.head.appendChild(style);
    }

    getChatBoxHTML() {
      return `
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px; border-radius: 15px 15px 0 0;">
          <div style="display: flex; justify-content: space-between; align-items: center;">
            <h3 style="margin: 0; font-size: 16px;">🚀 InterTools Universal Chat</h3>
            <button id="close-universal-chat" style="background: none; border: none; color: white; font-size: 18px; cursor: pointer;">×</button>
          </div>
          <p style="margin: 5px 0 0 0; font-size: 12px; opacity: 0.9;">Click any element to capture HTML and send to Cursor</p>
        </div>
        
        <div style="padding: 15px; max-height: 500px; overflow-y: auto;">
          <div id="element-info" style="background: #f8f9fa; border-radius: 8px; padding: 10px; margin-bottom: 15px; font-size: 12px;">
            <div style="color: #667eea; font-weight: bold; margin-bottom: 5px;">📍 Selected Element:</div>
            <div id="element-details" style="color: #666;">Click on any element to see details...</div>
          </div>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; font-size: 12px; color: #333; margin-bottom: 5px; font-weight: bold;">💬 Message for Cursor:</label>
            <textarea id="cursor-message" placeholder="Describe what you want to improve or analyze about this element..." style="width: 100%; height: 80px; padding: 10px; border: 2px solid #e0e0e0; border-radius: 8px; font-size: 12px; resize: none; font-family: inherit;"></textarea>
          </div>
          
          <div style="margin-bottom: 15px;">
            <label style="display: block; font-size: 12px; color: #333; margin-bottom: 5px; font-weight: bold;">📄 HTML Code:</label>
            <div id="html-display" style="background: #2d2d2d; color: #f8f8f2; padding: 10px; border-radius: 8px; font-family: 'Fira Code', 'Consolas', monospace; font-size: 11px; max-height: 150px; overflow-y: auto; white-space: pre-wrap; word-break: break-all;">
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
          
          <div style="display: flex; gap: 10px; margin-bottom: 15px;">
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
    }

    setupEventListeners() {
      // Click handler for elements
      document.addEventListener('click', (e) => {
        console.log('🖱️ Click detected:', e.target.tagName, 'isActive:', this.isActive, 'isChatBox:', this.isChatBoxElement(e.target));
        if (this.isActive && !this.isChatBoxElement(e.target)) {
          e.preventDefault();
          e.stopPropagation();
          this.captureElement(e.target, e);
        }
      });

      // Chat box event handlers
      document.addEventListener('click', (e) => {
        if (e.target.id === 'close-universal-chat') this.hideChatBox();
        if (e.target.id === 'send-to-cursor') this.sendToCursor();
        if (e.target.id === 'copy-html') this.copyHTML();
        if (e.target.id === 'toggle-mode') this.toggleMode();
        if (e.target.id === 'clear-selection') this.clearSelection();
      });

      // Hover preview
      document.addEventListener('mouseover', (e) => {
        if (this.isActive && !this.isChatBoxElement(e.target)) {
          this.previewElement(e.target);
        }
      });

      document.addEventListener('mouseout', (e) => {
        if (this.isActive) this.removePreview(e.target);
      });

      // Keyboard shortcuts
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && this.chatBox.style.display === 'block') {
          this.hideChatBox();
        }
        if (e.ctrlKey && e.key === 'Enter' && this.selectedElement) {
          this.sendToCursor();
        }
      });
    }

    isChatBoxElement(element) {
      return element.closest('#intertools-universal-chat');
    }

    showWelcomeMessage() {
      this.showNotification('🚀 InterTools Universal Chat loaded! Click any element to start.', 'success');
    }

    captureElement(element, event) {
      this.clickCount++;
      this.selectedElement = element;
      
      this.showClickAnimation(event.clientX, event.clientY);
      this.highlightElement(element);
      this.updateElementInfo(element);
      this.updateHTMLDisplay(element);
      this.showChatBox();
      
      console.log(`🎯 Element captured: ${element.tagName}${element.id ? '#' + element.id : ''}`);
      this.showNotification(`✅ Captured: ${element.tagName}${element.id ? '#' + element.id : ''}`, 'success');
    }

    showClickAnimation(x, y) {
      const indicator = document.createElement('div');
      indicator.style.cssText = `
        position: fixed;
        left: ${x - 10}px;
        top: ${y - 10}px;
        width: 20px;
        height: 20px;
        background: #667eea;
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000000;
        animation: clickPulse 0.6s ease-out;
      `;
      
      document.body.appendChild(indicator);
      setTimeout(() => indicator.remove(), 600);
    }

    highlightElement(element) {
      this.removeAllHighlights();
      element.classList.add('intertools-element-highlight');
    }

    removeAllHighlights() {
      document.querySelectorAll('.intertools-element-highlight').forEach(el => {
        el.classList.remove('intertools-element-highlight');
      });
    }

    previewElement(element) {
      if (this.isActive && !this.isChatBoxElement(element)) {
        element.classList.add('intertools-hover-preview');
      }
    }

    removePreview(element) {
      element.classList.remove('intertools-hover-preview');
    }

    updateElementInfo(element) {
      const details = document.getElementById('element-details');
      if (details) {
        const rect = element.getBoundingClientRect();
        details.innerHTML = `
          <div><strong>Tag:</strong> ${element.tagName}</div>
          <div><strong>ID:</strong> ${element.id || 'None'}</div>
          <div><strong>Classes:</strong> ${element.className || 'None'}</div>
          <div><strong>Position:</strong> (${Math.round(rect.x)}, ${Math.round(rect.y)})</div>
          <div><strong>Size:</strong> ${Math.round(rect.width)}×${Math.round(rect.height)}</div>
          <div><strong>Text:</strong> "${element.textContent.substring(0, 50)}${element.textContent.length > 50 ? '...' : ''}"</div>
        `;
      }
    }

    updateHTMLDisplay(element) {
      const htmlDisplay = document.getElementById('html-display');
      if (htmlDisplay) {
        const htmlContent = element.outerHTML;
        htmlDisplay.textContent = htmlContent;
      }
    }

    showChatBox() {
      if (this.chatBox) {
        this.chatBox.style.display = 'block';
        this.isActive = true;
        this.updateStatus('Element selected - Ready to send', '#d4edda', '#155724');
        console.log('📱 Chat box shown');
      } else {
        console.error('❌ Chat box not found!');
      }
    }

    hideChatBox() {
      if (this.chatBox) {
        this.chatBox.style.display = 'none';
        this.isActive = false;
        this.removeAllHighlights();
        this.selectedElement = null;
      }
    }

    toggleMode() {
      if (this.isActive) {
        this.hideChatBox();
        this.showNotification('🔄 Chat mode disabled', 'info');
      } else {
        this.showChatBox();
        this.showNotification('🔄 Chat mode enabled', 'success');
      }
    }

    clearSelection() {
      this.removeAllHighlights();
      this.selectedElement = null;
      this.updateElementInfo(document.createElement('div'));
      this.updateHTMLDisplay(document.createElement('div'));
      this.updateStatus('Selection cleared - Click any element to start', '#fff3cd', '#856404');
    }

    async sendToCursor() {
      if (!this.selectedElement) {
        this.showNotification('❌ Please click on an element first', 'error');
        return;
      }

      const message = document.getElementById('cursor-message').value.trim();
      if (!message) {
        this.showNotification('❌ Please enter a message', 'error');
        return;
      }

      const htmlContent = this.selectedElement.outerHTML;
      const elementInfo = this.getElementInfo(this.selectedElement);
      const pageContext = this.getPageContext();

      const cursorMessage = this.formatMessageForCursor({
        message, htmlContent, elementInfo, pageContext
      });

      try {
        await navigator.clipboard.writeText(cursorMessage);
        this.showNotification('✅ Message sent to Cursor!', 'success');
        
        // Send to InterTools server
        await this.sendToInterToolsServer({
          message, htmlContent, elementInfo, pageContext
        });
        
        // Clear the message input
        document.getElementById('cursor-message').value = '';
        
      } catch (error) {
        this.showNotification('❌ Failed to copy to clipboard', 'error');
        console.error('Error sending to Cursor:', error);
      }
    }

    copyHTML() {
      if (!this.selectedElement) {
        this.showNotification('❌ Please click on an element first', 'error');
        return;
      }

      const htmlContent = this.selectedElement.outerHTML;
      navigator.clipboard.writeText(htmlContent);
      this.showNotification('✅ HTML copied to clipboard!', 'success');
    }

    formatMessageForCursor(data) {
      const { message, htmlContent, elementInfo, pageContext } = data;
      
      let formattedMessage = `🤖 InterTools Universal Click-to-Chat Report\n\n`;
      formattedMessage += `📄 Page: ${pageContext.title}\n`;
      formattedMessage += `🔗 URL: ${pageContext.url}\n`;
      formattedMessage += `⏰ Time: ${pageContext.timestamp}\n`;
      formattedMessage += `🆔 Session: ${this.sessionId}\n`;
      formattedMessage += `🎯 Click Count: ${this.clickCount}\n\n`;
      
      formattedMessage += `📍 Element Details:\n`;
      formattedMessage += `• Tag: ${elementInfo.tagName}\n`;
      formattedMessage += `• ID: ${elementInfo.id || 'None'}\n`;
      formattedMessage += `• Classes: ${elementInfo.className || 'None'}\n`;
      formattedMessage += `• Position: (${elementInfo.position.x}, ${elementInfo.position.y})\n`;
      formattedMessage += `• Size: ${elementInfo.size.width}×${elementInfo.size.height}\n`;
      formattedMessage += `• Text: "${elementInfo.textContent}"\n\n`;
      
      formattedMessage += `💬 User Feedback:\n${message}\n\n`;
      
      formattedMessage += `📄 HTML Content:\n\`\`\`html\n${htmlContent}\n\`\`\`\n\n`;
      
      formattedMessage += `🎯 Action Required: Please analyze this HTML element and user feedback. Provide specific suggestions for improvement, styling changes, or functionality enhancements.`;
      
      return formattedMessage;
    }

    async sendToInterToolsServer(data) {
      try {
        const response = await fetch(`${this.serverUrl}/api/messages`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            message: data.message,
            pageUrl: data.pageContext.url,
            pageTitle: data.pageContext.title,
            userAgent: navigator.userAgent,
            htmlContent: data.htmlContent,
            elementInfo: data.elementInfo,
            sessionId: this.sessionId,
            agentId: 'universal-click-chat',
            context: {
              viewport: data.pageContext.viewport,
              scrollPosition: data.pageContext.scrollPosition,
              timestamp: new Date()
            }
          })
        });

        if (response.ok) {
          console.log('✅ Data sent to InterTools server');
        }
      } catch (error) {
        console.error('❌ Failed to send to InterTools server:', error);
      }
    }

    getElementInfo(element) {
      const rect = element.getBoundingClientRect();
      return {
        tagName: element.tagName,
        id: element.id,
        className: element.className,
        textContent: element.textContent.substring(0, 200),
        position: { x: Math.round(rect.x), y: Math.round(rect.y) },
        size: { width: Math.round(rect.width), height: Math.round(rect.height) },
        boundingRect: rect
      };
    }

    getPageContext() {
      return {
        title: document.title,
        url: window.location.href,
        timestamp: new Date().toLocaleString(),
        viewport: { width: window.innerWidth, height: window.innerHeight },
        scrollPosition: { x: window.scrollX, y: window.scrollY }
      };
    }

    updateStatus(message, bgColor, textColor) {
      const status = document.getElementById('status-indicator');
      if (status) {
        status.textContent = message;
        status.style.background = bgColor;
        status.style.color = textColor;
      }
    }

    showNotification(message, type) {
      const notification = document.createElement('div');
      notification.className = 'intertools-notification';
      notification.style.background = type === 'success' ? '#4caf50' : 
                                    type === 'error' ? '#f44336' : 
                                    type === 'info' ? '#2196f3' : '#ff9800';
      notification.textContent = message;
      
      document.body.appendChild(notification);

      setTimeout(() => {
        notification.remove();
      }, 3000);
    }
  }

  // Initialize the universal chat
  const universalChat = new InterToolsUniversalChat();
  window.InterToolsUniversalChat = universalChat;

  console.log('🚀 InterTools Universal Click-to-Chat loaded successfully!');
  console.log('💡 Click anywhere on the page to capture HTML and send to Cursor!');
  console.log('⌨️  Press Escape to close chat, Ctrl+Enter to send message');
})();
