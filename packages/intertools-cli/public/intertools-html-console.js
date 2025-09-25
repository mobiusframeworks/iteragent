// InterTools Web Chat Extension - HTML Content Capture for Cursor Integration
class InterToolsWebChatExtension {
  constructor(serverUrl = 'http://localhost:3001') {
    this.chatServerUrl = serverUrl;
    this.isEnabled = false;
    this.chatOverlay = null;
    this.chatButton = null;
    this.hoveredElement = null;
    this.chatContainer = null;
    this.htmlContent = '';
    this.init();
  }

  init() {
    this.createChatButton();
    this.createChatOverlay();
    this.setupEventListeners();
    this.capturePageHTML();
    this.checkServerConnection();
  }

  createChatButton() {
    // Remove existing button if it exists
    const existingButton = document.getElementById('intertools-chat-button');
    if (existingButton) {
      existingButton.remove();
    }

    this.chatButton = document.createElement('div');
    this.chatButton.id = 'intertools-chat-button';
    this.chatButton.innerHTML = '💬';
    this.chatButton.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 24px;
      cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10000;
      transition: all 0.3s ease;
      user-select: none;
    `;

    this.chatButton.addEventListener('click', (e) => {
      e.stopPropagation();
      this.toggleChat();
    });

    document.body.appendChild(this.chatButton);
    console.log('✅ InterTools chat button created');
  }

  createChatOverlay() {
    // Remove existing overlay if it exists
    const existingOverlay = document.getElementById('intertools-chat-overlay');
    if (existingOverlay) {
      existingOverlay.remove();
    }

    this.chatOverlay = document.createElement('div');
    this.chatOverlay.id = 'intertools-chat-overlay';
    this.chatOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.5);
      z-index: 10001;
      display: none;
      align-items: center;
      justify-content: center;
    `;

    this.chatContainer = document.createElement('div');
    this.chatContainer.style.cssText = `
      background: white;
      border-radius: 20px;
      width: 95%;
      max-width: 800px;
      max-height: 90vh;
      overflow: hidden;
      box-shadow: 0 20px 40px rgba(0,0,0,0.3);
      animation: slideIn 0.3s ease-out;
    `;

    this.chatContainer.innerHTML = this.getChatHTML();
    this.chatOverlay.appendChild(this.chatContainer);
    document.body.appendChild(this.chatOverlay);

    // Add CSS animation
    const style = document.createElement('style');
    style.textContent = `
      @keyframes slideIn {
        from {
          opacity: 0;
          transform: scale(0.9) translateY(-20px);
        }
        to {
          opacity: 1;
          transform: scale(1) translateY(0);
        }
      }
      .intertools-hover-highlight {
        outline: 2px solid #ff6b6b !important;
        outline-offset: 2px !important;
        background-color: rgba(255, 107, 107, 0.1) !important;
      }
    `;
    document.head.appendChild(style);
    console.log('✅ InterTools chat overlay created');
  }

  getChatHTML() {
    return `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0 0 10px 0; font-size: 24px;">🚀 InterTools HTML Console</h2>
        <p style="margin: 0; opacity: 0.9; font-size: 14px;">Hover over elements to capture HTML content for Cursor feedback</p>
      </div>
      
      <div style="display: flex; height: 60vh;">
        <!-- Left Panel: HTML Content -->
        <div style="flex: 1; padding: 20px; border-right: 1px solid #eee; overflow-y: auto;">
          <h3 style="color: #667eea; margin-bottom: 15px;">📄 Captured HTML Content</h3>
          <div id="html-content-display" style="background: #f8f9fa; border-radius: 10px; padding: 15px; font-family: 'Courier New', monospace; font-size: 12px; line-height: 1.4; max-height: 400px; overflow-y: auto; white-space: pre-wrap;">
            <div style="color: #666; font-style: italic;">Hover over any element on the page to capture its HTML content...</div>
          </div>
          <div style="margin-top: 15px;">
            <button id="copy-html" style="background: #28a745; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; font-size: 12px;">
              📋 Copy HTML to Clipboard
            </button>
            <button id="clear-html" style="background: #dc3545; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer; font-size: 12px; margin-left: 10px;">
              🗑️ Clear
            </button>
          </div>
        </div>
        
        <!-- Right Panel: Chat Interface -->
        <div style="flex: 1; padding: 20px; display: flex; flex-direction: column;">
          <h3 style="color: #667eea; margin-bottom: 15px;">💬 Feedback for Cursor</h3>
          
          <div style="flex: 1; background: #f8f9fa; border-radius: 10px; padding: 15px; margin-bottom: 15px; overflow-y: auto;" id="chat-messages">
            <div style="background: white; border-radius: 10px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1);">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                <span style="font-size: 12px; color: #667eea; font-weight: bold;">📄 Page Context</span>
                <span style="font-size: 12px; color: #666;">${new Date().toLocaleTimeString()}</span>
              </div>
              <div style="font-size: 14px; line-height: 1.5; color: #333;">
                <strong>${document.title}</strong><br>
                <small style="color: #666;">${window.location.href}</small><br>
                <small style="color: #666;">Viewport: ${window.innerWidth}x${window.innerHeight}</small>
              </div>
            </div>
          </div>
          
          <div style="position: relative;">
            <textarea 
              id="chat-input" 
              placeholder="Provide feedback about the HTML content for Cursor AI..." 
              style="width: 100%; padding: 15px; border: 2px solid #e0e0e0; border-radius: 10px; font-size: 14px; outline: none; resize: none; min-height: 100px; font-family: inherit;"
              maxlength="2000"
            ></textarea>
            <button 
              id="send-button" 
              style="position: absolute; right: 10px; bottom: 10px; background: #667eea; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 16px;"
            >📤</button>
          </div>
          
          <div style="margin-top: 15px; text-align: center;">
            <button 
              id="send-to-cursor" 
              style="background: #17a2b8; color: white; border: none; border-radius: 20px; padding: 10px 20px; cursor: pointer; font-size: 14px; margin-right: 10px;"
            >🤖 Send to Cursor Console</button>
            <button 
              id="close-chat" 
              style="background: #f44336; color: white; border: none; border-radius: 20px; padding: 10px 20px; cursor: pointer; font-size: 14px;"
            >❌ Close</button>
          </div>
        </div>
      </div>
    `;
  }

  setupEventListeners() {
    // Close chat when clicking outside
    this.chatOverlay.addEventListener('click', (e) => {
      if (e.target === this.chatOverlay) {
        this.closeChat();
      }
    });

    // Send message functionality
    document.addEventListener('click', (e) => {
      if (e.target && e.target.id === 'send-button') {
        this.sendMessage();
      }
      if (e.target && e.target.id === 'send-to-cursor') {
        this.sendToCursorConsole();
      }
      if (e.target && e.target.id === 'close-chat') {
        this.closeChat();
      }
      if (e.target && e.target.id === 'copy-html') {
        this.copyHTMLToClipboard();
      }
      if (e.target && e.target.id === 'clear-html') {
        this.clearHTMLContent();
      }
    });

    // Enter key to send message
    document.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && this.isChatOpen()) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Hover functionality for HTML capture
    document.addEventListener('mouseover', (e) => {
      if (this.isChatOpen()) {
        this.hoveredElement = e.target;
        this.highlightHoveredElement(this.hoveredElement);
        this.captureElementHTML(this.hoveredElement);
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (this.isChatOpen()) {
        this.removeHighlight(e.target);
      }
    });
  }

  highlightHoveredElement(element) {
    // Remove previous highlight
    document.querySelectorAll('.intertools-hover-highlight').forEach(el => {
      el.classList.remove('intertools-hover-highlight');
    });

    // Add highlight to hovered element
    element.classList.add('intertools-hover-highlight');
  }

  removeHighlight(element) {
    element.classList.remove('intertools-hover-highlight');
  }

  captureElementHTML(element) {
    if (!element || element === document.body || element === document.documentElement) {
      return;
    }

    // Get the outer HTML of the element
    const htmlContent = element.outerHTML;
    const elementInfo = {
      tagName: element.tagName,
      id: element.id,
      className: element.className,
      textContent: element.textContent.substring(0, 200),
      boundingRect: element.getBoundingClientRect()
    };

    // Display in the HTML content panel
    const htmlDisplay = document.getElementById('html-content-display');
    if (htmlDisplay) {
      htmlDisplay.innerHTML = `
        <div style="color: #667eea; font-weight: bold; margin-bottom: 10px;">
          📍 Element: ${elementInfo.tagName}${elementInfo.id ? '#' + elementInfo.id : ''}${elementInfo.className ? '.' + elementInfo.className.split(' ').slice(0, 3).join('.') : ''}
        </div>
        <div style="color: #666; font-size: 11px; margin-bottom: 10px;">
          Position: (${Math.round(elementInfo.boundingRect.x)}, ${Math.round(elementInfo.boundingRect.y)}) | 
          Size: ${Math.round(elementInfo.boundingRect.width)}x${Math.round(elementInfo.boundingRect.height)}
        </div>
        <div style="color: #333; font-size: 11px; margin-bottom: 10px;">
          Text: "${elementInfo.textContent}${elementInfo.textContent.length >= 200 ? '...' : ''}"
        </div>
        <div style="background: white; padding: 10px; border-radius: 5px; border: 1px solid #ddd;">
          <pre style="margin: 0; font-size: 10px; line-height: 1.3; overflow-x: auto;">${this.formatHTML(htmlContent)}</pre>
        </div>
      `;
    }

    // Store the HTML content for sending
    this.htmlContent = htmlContent;
    this.currentElement = element;
  }

  formatHTML(html) {
    // Simple HTML formatting
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  capturePageHTML() {
    // Capture the entire page HTML structure
    this.pageHTML = document.documentElement.outerHTML;
  }

  isChatOpen() {
    return this.chatOverlay.style.display === 'flex';
  }

  toggleChat() {
    if (this.isChatOpen()) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  openChat() {
    if (this.chatOverlay) {
      this.chatOverlay.style.display = 'flex';
      const input = document.getElementById('chat-input');
      if (input) {
        input.focus();
      }
      console.log('💬 HTML Console opened');
    }
  }

  closeChat() {
    if (this.chatOverlay) {
      this.chatOverlay.style.display = 'none';
    }
    
    // Remove all highlights
    document.querySelectorAll('.intertools-hover-highlight').forEach(el => {
      el.classList.remove('intertools-hover-highlight');
    });
    console.log('❌ HTML Console closed');
  }

  async sendMessage() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) return;

    const messageData = {
      message: message,
      pageUrl: window.location.href,
      pageTitle: document.title,
      userAgent: navigator.userAgent,
      htmlContent: this.htmlContent,
      elementInfo: this.currentElement ? this.getElementInfo(this.currentElement) : null,
      context: {
        viewport: {
          width: window.innerWidth,
          height: window.innerHeight
        },
        scrollPosition: {
          x: window.scrollX,
          y: window.scrollY
        },
        timestamp: new Date()
      }
    };

    try {
      const response = await fetch(`${this.chatServerUrl}/api/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData)
      });

      const result = await response.json();
      
      if (result.success) {
        this.displayMessage(result.message);
        input.value = '';
        this.showSuccessMessage('✅ Message sent to InterTools server');
        console.log('✅ Message sent successfully');
      } else {
        this.showErrorMessage(result.error);
        console.error('❌ Failed to send message:', result.error);
      }
    } catch (error) {
      this.showErrorMessage('Failed to send message. Please check if InterTools server is running.');
      console.error('❌ Error sending message:', error);
    }
  }

  sendToCursorConsole() {
    const input = document.getElementById('chat-input');
    const message = input.value.trim();
    
    if (!message) {
      this.showErrorMessage('Please enter a message first');
      return;
    }

    // Create a formatted message for Cursor console
    const cursorMessage = this.formatMessageForCursor(message);
    
    // Copy to clipboard
    this.copyToClipboard(cursorMessage);
    
    // Show success message
    this.showSuccessMessage('✅ Message copied to clipboard! Paste it into Cursor console.');
    
    // Display in chat
    this.displayCursorMessage(cursorMessage);
    
    console.log('🤖 Message formatted for Cursor:', cursorMessage);
  }

  formatMessageForCursor(message) {
    const elementInfo = this.currentElement ? this.getElementInfo(this.currentElement) : null;
    const htmlContent = this.htmlContent || '';
    
    let formattedMessage = `🤖 InterTools Web Chat Feedback\n\n`;
    formattedMessage += `📄 Page: ${document.title}\n`;
    formattedMessage += `🔗 URL: ${window.location.href}\n`;
    formattedMessage += `⏰ Time: ${new Date().toLocaleString()}\n\n`;
    
    if (elementInfo) {
      formattedMessage += `📍 Element: ${elementInfo.tagName}${elementInfo.id ? '#' + elementInfo.id : ''}${elementInfo.className ? '.' + elementInfo.className.split(' ').slice(0, 3).join('.') : ''}\n`;
      formattedMessage += `📏 Position: (${Math.round(elementInfo.boundingRect.x)}, ${Math.round(elementInfo.boundingRect.y)})\n`;
      formattedMessage += `📐 Size: ${Math.round(elementInfo.boundingRect.width)}x${Math.round(elementInfo.boundingRect.height)}\n\n`;
    }
    
    formattedMessage += `💬 Feedback:\n${message}\n\n`;
    
    if (htmlContent) {
      formattedMessage += `📄 HTML Content:\n\`\`\`html\n${htmlContent.substring(0, 1000)}${htmlContent.length > 1000 ? '\n... (truncated)' : ''}\n\`\`\`\n\n`;
    }
    
    formattedMessage += `🎯 Action Required: Please analyze this feedback and provide suggestions for improvement.`;
    
    return formattedMessage;
  }

  displayCursorMessage(message) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const messageElement = document.createElement('div');
    messageElement.style.cssText = `
      background: #e3f2fd;
      border-radius: 15px;
      padding: 15px;
      margin-bottom: 15px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      animation: slideIn 0.3s ease-out;
      border-left: 4px solid #2196f3;
    `;

    const time = new Date().toLocaleTimeString();
    
    messageElement.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <span style="font-size: 12px; color: #1976d2; font-weight: bold;">🤖 Cursor Console Message</span>
        <span style="font-size: 12px; color: #666;">${time}</span>
      </div>
      <div style="font-size: 12px; line-height: 1.4; color: #333; font-family: 'Courier New', monospace; white-space: pre-wrap;">${message.substring(0, 500)}${message.length > 500 ? '...' : ''}</div>
      <div style="margin-top: 10px; font-size: 11px; color: #666;">
        ✅ Copied to clipboard - paste into Cursor console
      </div>
    `;

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  displayMessage(message) {
    const messagesContainer = document.getElementById('chat-messages');
    if (!messagesContainer) return;

    const messageElement = document.createElement('div');
    messageElement.style.cssText = `
      background: white;
      border-radius: 15px;
      padding: 15px;
      margin-bottom: 15px;
      box-shadow: 0 2px 10px rgba(0,0,0,0.1);
      animation: slideIn 0.3s ease-out;
    `;

    const time = new Date(message.timestamp).toLocaleTimeString();
    
    messageElement.innerHTML = `
      <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
        <span style="font-size: 12px; color: #667eea; font-weight: bold;">Your Message</span>
        <span style="font-size: 12px; color: #666;">${time}</span>
      </div>
      <div style="font-size: 14px; line-height: 1.5; color: #333;">${message.message}</div>
    `;

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  copyHTMLToClipboard() {
    if (!this.htmlContent) {
      this.showErrorMessage('No HTML content to copy');
      return;
    }
    
    this.copyToClipboard(this.htmlContent);
    this.showSuccessMessage('✅ HTML content copied to clipboard');
  }

  clearHTMLContent() {
    const htmlDisplay = document.getElementById('html-content-display');
    if (htmlDisplay) {
      htmlDisplay.innerHTML = '<div style="color: #666; font-style: italic;">Hover over any element on the page to capture its HTML content...</div>';
    }
    this.htmlContent = '';
    this.currentElement = null;
    this.showSuccessMessage('✅ HTML content cleared');
  }

  copyToClipboard(text) {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
    } else {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    }
  }

  getElementInfo(element) {
    return {
      tagName: element.tagName,
      className: element.className,
      id: element.id,
      textContent: element.textContent.substring(0, 200),
      boundingRect: element.getBoundingClientRect()
    };
  }

  showSuccessMessage(message) {
    this.showNotification(message, 'success');
  }

  showErrorMessage(error) {
    this.showNotification(`❌ ${error}`, 'error');
  }

  showNotification(message, type) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      background: ${type === 'success' ? '#4caf50' : '#f44336'};
      color: white;
      padding: 15px 20px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      z-index: 10002;
      animation: slideIn 0.3s ease-out;
      max-width: 300px;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
      notification.remove();
    }, 3000);
  }

  async checkServerConnection() {
    try {
      const response = await fetch(`${this.chatServerUrl}/api/health`);
      const result = await response.json();
      
      if (result.success) {
        this.isEnabled = true;
        console.log('✅ InterTools Web Chat Extension connected');
        this.showNotification('✅ InterTools HTML Console connected!', 'success');
      } else {
        this.isEnabled = false;
        console.warn('⚠️ InterTools Web Chat server not responding');
        this.showNotification('⚠️ InterTools server not responding', 'error');
      }
    } catch (error) {
      this.isEnabled = false;
      console.warn('⚠️ InterTools Web Chat server not available');
      this.showNotification('❌ InterTools server not available. Start with: npx intertools@1.0.14 web-chat --start', 'error');
    }
  }
}

// Initialize extension
const extension = new InterToolsWebChatExtension();
window.InterToolsExtension = extension;

console.log('🚀 InterTools HTML Console Extension loaded successfully!');
console.log('💡 Hover over elements to capture HTML content, then provide feedback for Cursor!');
