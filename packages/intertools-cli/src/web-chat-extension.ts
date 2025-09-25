// InterTools Web Chat Browser Extension
// This script can be injected into any web page to enable click-to-chat functionality

class InterToolsWebChatExtension {
  private chatServerUrl: string;
  private isEnabled: boolean = false;
  private chatOverlay: HTMLElement | null = null;
  private chatButton: HTMLElement | null = null;
  private selectedElement: HTMLElement | null = null;
  private chatContainer: HTMLElement | null = null;

  constructor(serverUrl: string = 'http://localhost:3001') {
    this.chatServerUrl = serverUrl;
    this.init();
  }

  private init(): void {
    this.createChatButton();
    this.createChatOverlay();
    this.setupEventListeners();
    this.checkServerConnection();
  }

  private createChatButton(): void {
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

    this.chatButton.addEventListener('mouseenter', () => {
      this.chatButton!.style.transform = 'scale(1.1)';
    });

    this.chatButton.addEventListener('mouseleave', () => {
      this.chatButton!.style.transform = 'scale(1)';
    });

    this.chatButton.addEventListener('click', () => {
      this.toggleChat();
    });

    document.body.appendChild(this.chatButton);
  }

  private createChatOverlay(): void {
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
      width: 90%;
      max-width: 500px;
      max-height: 80vh;
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
    `;
    document.head.appendChild(style);
  }

  private getChatHTML(): string {
    return `
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center;">
        <h2 style="margin: 0 0 10px 0; font-size: 24px;">🚀 InterTools Web Chat</h2>
        <p style="margin: 0; opacity: 0.9; font-size: 14px;">Share your thoughts about this page</p>
      </div>
      
      <div style="padding: 20px; background: #f8f9fa; max-height: 300px; overflow-y: auto;" id="chat-messages">
        <div style="background: white; border-radius: 15px; padding: 15px; margin-bottom: 15px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
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
      
      <div style="padding: 20px; background: white; border-top: 1px solid #eee;">
        <div style="position: relative;">
          <textarea 
            id="chat-input" 
            placeholder="Share your thoughts about this page..." 
            style="width: 100%; padding: 15px; border: 2px solid #e0e0e0; border-radius: 15px; font-size: 14px; outline: none; resize: none; min-height: 80px; font-family: inherit;"
            maxlength="1000"
          ></textarea>
          <button 
            id="send-button" 
            style="position: absolute; right: 10px; bottom: 10px; background: #667eea; color: white; border: none; border-radius: 50%; width: 40px; height: 40px; cursor: pointer; font-size: 16px;"
          >📤</button>
        </div>
        <div style="margin-top: 10px; text-align: center;">
          <button 
            id="close-chat" 
            style="background: #f44336; color: white; border: none; border-radius: 20px; padding: 8px 16px; cursor: pointer; font-size: 12px;"
          >Close Chat</button>
        </div>
      </div>
    `;
  }

  private setupEventListeners(): void {
    // Close chat when clicking outside
    this.chatOverlay?.addEventListener('click', (e) => {
      if (e.target === this.chatOverlay) {
        this.closeChat();
      }
    });

    // Send message functionality
    document.addEventListener('click', (e) => {
      if (e.target && (e.target as HTMLElement).id === 'send-button') {
        this.sendMessage();
      }
    });

    // Close chat functionality
    document.addEventListener('click', (e) => {
      if (e.target && (e.target as HTMLElement).id === 'close-chat') {
        this.closeChat();
      }
    });

    // Enter key to send message
    document.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey && this.isChatOpen()) {
        e.preventDefault();
        this.sendMessage();
      }
    });

    // Element selection for context
    document.addEventListener('click', (e) => {
      if (this.isChatOpen() && e.target !== this.chatButton && e.target !== this.chatOverlay) {
        this.selectedElement = e.target as HTMLElement;
        this.highlightElement(this.selectedElement);
      }
    });
  }

  private highlightElement(element: HTMLElement): void {
    // Remove previous highlight
    const prevHighlight = document.querySelector('.intertools-highlight');
    if (prevHighlight) {
      prevHighlight.classList.remove('intertools-highlight');
    }

    // Add highlight to selected element
    element.classList.add('intertools-highlight');
    
    // Add highlight styles
    const highlightStyle = document.createElement('style');
    highlightStyle.id = 'intertools-highlight-style';
    highlightStyle.textContent = `
      .intertools-highlight {
        outline: 2px solid #667eea !important;
        outline-offset: 2px !important;
        background-color: rgba(102, 126, 234, 0.1) !important;
      }
    `;
    
    if (!document.getElementById('intertools-highlight-style')) {
      document.head.appendChild(highlightStyle);
    }
  }

  private isChatOpen(): boolean {
    return this.chatOverlay?.style.display === 'flex';
  }

  private toggleChat(): void {
    if (this.isChatOpen()) {
      this.closeChat();
    } else {
      this.openChat();
    }
  }

  private openChat(): void {
    if (this.chatOverlay) {
      this.chatOverlay.style.display = 'flex';
      const input = document.getElementById('chat-input') as HTMLTextAreaElement;
      if (input) {
        input.focus();
      }
    }
  }

  private closeChat(): void {
    if (this.chatOverlay) {
      this.chatOverlay.style.display = 'none';
    }
    
    // Remove highlight
    const highlight = document.querySelector('.intertools-highlight');
    if (highlight) {
      highlight.classList.remove('intertools-highlight');
    }
  }

  private async sendMessage(): Promise<void> {
    const input = document.getElementById('chat-input') as HTMLTextAreaElement;
    const message = input?.value.trim();
    
    if (!message) return;

    const messageData = {
      message: message,
      pageUrl: window.location.href,
      pageTitle: document.title,
      userAgent: navigator.userAgent,
      screenPosition: this.getMousePosition(),
      elementInfo: this.selectedElement ? this.getElementInfo(this.selectedElement) : null,
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
        this.closeChat();
        this.showSuccessMessage();
      } else {
        this.showErrorMessage(result.error);
      }
    } catch (error) {
      this.showErrorMessage('Failed to send message. Please check if InterTools server is running.');
    }
  }

  private getMousePosition(): { x: number; y: number } {
    // Return approximate mouse position (center of viewport)
    return {
      x: window.innerWidth / 2,
      y: window.innerHeight / 2
    };
  }

  private getElementInfo(element: HTMLElement): any {
    return {
      tagName: element.tagName,
      className: element.className,
      id: element.id,
      textContent: element.textContent?.substring(0, 100),
      boundingRect: element.getBoundingClientRect()
    };
  }

  private displayMessage(message: any): void {
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
      ${message.elementInfo ? `
        <div style="margin-top: 10px; padding: 10px; background: #f0f0f0; border-radius: 8px; font-size: 12px; color: #666;">
          📍 Selected: ${message.elementInfo.tagName}${message.elementInfo.id ? '#' + message.elementInfo.id : ''}${message.elementInfo.className ? '.' + message.elementInfo.className.split(' ').join('.') : ''}
        </div>
      ` : ''}
    `;

    messagesContainer.appendChild(messageElement);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
  }

  private showSuccessMessage(): void {
    this.showNotification('✅ Message sent successfully!', 'success');
  }

  private showErrorMessage(error: string): void {
    this.showNotification(`❌ ${error}`, 'error');
  }

  private showNotification(message: string, type: 'success' | 'error'): void {
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

  private async checkServerConnection(): Promise<void> {
    try {
      const response = await fetch(`${this.chatServerUrl}/api/health`);
      const result = await response.json();
      
      if (result.success) {
        this.isEnabled = true;
        console.log('🚀 InterTools Web Chat Extension connected');
      } else {
        this.isEnabled = false;
        console.warn('⚠️ InterTools Web Chat server not available');
      }
    } catch (error) {
      this.isEnabled = false;
      console.warn('⚠️ InterTools Web Chat server not available');
    }
  }

  public enable(): void {
    this.isEnabled = true;
    if (this.chatButton) {
      this.chatButton.style.display = 'flex';
    }
  }

  public disable(): void {
    this.isEnabled = false;
    if (this.chatButton) {
      this.chatButton.style.display = 'none';
    }
    this.closeChat();
  }
}

// Auto-initialize when script loads
if (typeof window !== 'undefined') {
  const extension = new InterToolsWebChatExtension();
  
  // Make it globally available for debugging
  (window as any).InterToolsWebChatExtension = extension;
  
  console.log('🚀 InterTools Web Chat Extension loaded');
}
