# 🌐 InterTools Web Chat - Click-to-Chat Functionality

## 🎯 Overview

InterTools Web Chat allows users to provide feedback about any web page by clicking on elements and sharing their thoughts. This feedback is then fed back to the InterTools system for analysis and improvement.

## ✨ Features

### 🖱️ Click-to-Chat Interface
- **Floating Chat Button**: Appears on any web page when the extension is active
- **Element Selection**: Click on any element to highlight it for context
- **Real-time Chat**: Instant messaging interface for page feedback
- **Page Context Capture**: Automatic capture of page information, viewport, and performance data

### 📊 Page Analysis
- **URL and Title**: Automatic capture of current page information
- **Viewport Data**: Screen dimensions and scroll position
- **Element Information**: Tag name, class, ID, and text content
- **Performance Metrics**: Page load time and DOM content loaded time
- **Accessibility Info**: Alt text, headings, and form labels

### 🔄 Real-time Integration
- **WebSocket Communication**: Real-time updates between browser and server
- **InterTools Integration**: Feedback automatically fed to InterTools system
- **Message Logging**: All feedback stored for analysis and improvement
- **Cross-Platform**: Works on any website with the extension script

## 🚀 Quick Start

### 1. Start the Web Chat Server
```bash
# Start the web chat server
npx intertools@1.0.14 web-chat --start

# Or with custom port
npx intertools@1.0.14 web-chat --start --port 3002
```

### 2. Enable Click-to-Chat on Any Website
1. **Open Browser Developer Tools** (F12)
2. **Go to Console Tab**
3. **Paste the Extension Script**:
```javascript
// InterTools Web Chat Extension
class InterToolsWebChatExtension {
  constructor(serverUrl = 'http://localhost:3001') {
    this.chatServerUrl = serverUrl;
    this.init();
  }
  
  init() {
    this.createChatButton();
    this.createChatOverlay();
    this.setupEventListeners();
    this.checkServerConnection();
  }
  
  createChatButton() {
    const button = document.createElement('div');
    button.id = 'intertools-chat-button';
    button.innerHTML = '💬';
    button.style.cssText = `
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
    
    button.addEventListener('click', () => this.toggleChat());
    document.body.appendChild(button);
  }
  
  // ... (rest of the extension code)
}

// Initialize extension
const extension = new InterToolsWebChatExtension();
```

### 3. Use Click-to-Chat
1. **Click the Chat Button** (💬) that appears on the page
2. **Select Elements** by clicking on them to highlight for context
3. **Type Your Feedback** about the page or specific elements
4. **Send Message** to provide feedback to InterTools

## 📋 Commands

### Web Chat Server Commands
```bash
# Start web chat server
npx intertools@1.0.14 web-chat --start

# Start with custom port
npx intertools@1.0.14 web-chat --start --port 3002

# Start with custom host
npx intertools@1.0.14 web-chat --start --host 0.0.0.0

# Stop web chat server
npx intertools@1.0.14 web-chat --stop

# Clear all messages
npx intertools@1.0.14 web-chat --clear

# Show message logs
npx intertools@1.0.14 web-chat --logs
```

### Web Chat Interface
- **URL**: `http://localhost:3001` (or your custom port)
- **API Endpoints**:
  - `GET /api/messages` - Get recent messages
  - `POST /api/messages` - Send new message
  - `POST /api/page-context` - Send page context
  - `GET /api/health` - Health check

## 🎮 How It Works

### 1. Server Setup
- **Express Server**: Hosts the web chat interface
- **Socket.IO**: Real-time communication
- **CORS Enabled**: Works across different domains
- **Message Storage**: JSON file-based storage

### 2. Browser Extension
- **Dynamic Injection**: Script can be injected into any page
- **Element Highlighting**: Visual feedback for selected elements
- **Context Capture**: Automatic page analysis
- **Real-time Updates**: WebSocket communication with server

### 3. Data Flow
```
User clicks element → Extension captures context → 
User types feedback → Message sent to server → 
Server processes message → InterTools system receives feedback
```

## 📊 Message Format

### Web Chat Message Structure
```typescript
interface WebChatMessage {
  id: string;
  timestamp: Date;
  message: string;
  pageUrl: string;
  pageTitle: string;
  userAgent: string;
  screenPosition?: { x: number; y: number };
  elementInfo?: {
    tagName: string;
    className: string;
    id: string;
    textContent: string;
  };
  context?: {
    viewport: { width: number; height: number };
    scrollPosition: { x: number; y: number };
    timestamp: Date;
  };
}
```

### Page Context Analysis
```typescript
interface PageContext {
  url: string;
  title: string;
  viewport: { width: number; height: number };
  elements: ElementInfo[];
  performance: {
    loadTime: number;
    domContentLoaded: number;
  };
  accessibility: {
    hasAltText: boolean;
    hasHeadings: boolean;
    hasLabels: boolean;
  };
  timestamp: Date;
}
```

## 🔧 Configuration

### Web Chat Server Configuration
```typescript
interface WebChatConfig {
  port: number;                    // Server port (default: 3001)
  host: string;                    // Server host (default: 'localhost')
  enableCORS: boolean;             // Enable CORS (default: true)
  maxMessageLength: number;        // Max message length (default: 1000)
  enablePageContext: boolean;      // Enable page context capture (default: true)
  enableElementCapture: boolean;   // Enable element capture (default: true)
  logPath: string;                 // Log file path (default: '.intertools/web-chat-logs.json')
}
```

## 🎯 Use Cases

### 1. User Experience Testing
- **Page Feedback**: Users can provide feedback about page usability
- **Element-specific Comments**: Highlight specific elements for targeted feedback
- **Performance Issues**: Report slow loading or broken functionality

### 2. Development Feedback
- **Design Reviews**: Share thoughts about page design and layout
- **Bug Reports**: Report issues with specific elements or functionality
- **Feature Requests**: Suggest improvements or new features

### 3. Content Analysis
- **Accessibility Issues**: Report missing alt text or poor contrast
- **Content Quality**: Provide feedback on content clarity and usefulness
- **Navigation Issues**: Report problems with site navigation

## 🚀 Advanced Features

### 1. Element Selection
- **Visual Highlighting**: Selected elements are highlighted with blue outline
- **Context Information**: Captures element tag, class, ID, and text content
- **Bounding Rectangle**: Records element position and size

### 2. Page Analysis
- **Performance Metrics**: Captures page load times and performance data
- **Accessibility Audit**: Checks for alt text, headings, and form labels
- **Element Inventory**: Lists key page elements (headings, buttons, inputs, etc.)

### 3. Real-time Communication
- **WebSocket Updates**: Real-time message delivery
- **Server Status**: Live connection status indicator
- **Message History**: Recent messages displayed in chat interface

## 🔒 Security & Privacy

### Data Handling
- **Local Storage**: Messages stored locally in JSON files
- **No External Sharing**: Data stays within your InterTools system
- **CORS Protection**: Server configured for secure cross-origin requests

### Privacy Features
- **No Tracking**: No user tracking or analytics
- **Local Processing**: All analysis happens locally
- **User Control**: Users control what feedback to send

## 🎉 Demo

### Test the Web Chat Feature
1. **Start the server**: `npx intertools@1.0.14 web-chat --start`
2. **Open demo page**: `http://localhost:3001/demo.html`
3. **Load extension script** using the button on the demo page
4. **Click elements** to test highlighting
5. **Send feedback** using the chat interface

## 📚 Integration with InterTools

### Automatic Integration
- **Orchestrator Integration**: Web chat messages automatically fed to InterTools orchestrator
- **Log Analysis**: Messages analyzed by log interpreter agent
- **Code Suggestions**: Feedback used to generate code improvement suggestions
- **Performance Monitoring**: Page performance data integrated with speed optimization

### Manual Integration
```bash
# Start web chat with orchestrator
npx intertools@1.0.14 web-chat --start &
npx intertools@1.0.14 orchestrator --start

# View web chat logs
npx intertools@1.0.14 web-chat --logs
```

## 🎯 Next Steps

1. **Start Web Chat Server**: `npx intertools@1.0.14 web-chat --start`
2. **Inject Extension Script** on any website
3. **Click Elements** to provide targeted feedback
4. **Send Messages** about page experience
5. **View Feedback** in InterTools logs and analysis

**InterTools Web Chat is now ready to capture user feedback from any website! 🌐💬**
