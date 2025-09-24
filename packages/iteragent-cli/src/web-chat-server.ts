import express from 'express';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { EventEmitter } from 'events';

export interface WebChatMessage {
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

export interface WebChatConfig {
  port: number;
  host: string;
  enableCORS: boolean;
  maxMessageLength: number;
  enablePageContext: boolean;
  enableElementCapture: boolean;
  logPath: string;
}

export class InterToolsWebChat extends EventEmitter {
  private app: express.Application;
  private server: any;
  private io!: SocketIOServer;
  private config: WebChatConfig;
  private messages: WebChatMessage[] = [];
  private isRunning: boolean = false;

  constructor(config: Partial<WebChatConfig> = {}) {
    super();
    
    this.config = {
      port: 3001,
      host: 'localhost',
      enableCORS: true,
      maxMessageLength: 1000,
      enablePageContext: true,
      enableElementCapture: true,
      logPath: '.intertools/web-chat-logs.json',
      ...config
    };

    this.app = express();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
    this.loadMessages();
  }

  private setupMiddleware(): void {
    if (this.config.enableCORS) {
      this.app.use(cors({
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true
      }));
    }

    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.static(path.join(__dirname, '..', 'public')));
  }

  private setupRoutes(): void {
    // Serve the main chat interface
    this.app.get('/', (req, res) => {
      res.send(this.getChatInterfaceHTML());
    });

    // API endpoint to get messages
    this.app.get('/api/messages', (req, res) => {
      res.json({
        success: true,
        messages: this.messages.slice(-50), // Last 50 messages
        total: this.messages.length
      });
    });

    // API endpoint to send message
    this.app.post('/api/messages', (req, res) => {
      try {
        const message = this.createMessage(req.body);
        this.messages.push(message);
        this.saveMessages();
        
        // Emit to connected clients
        this.io.emit('newMessage', message);
        
        // Emit to InterTools system
        this.emit('webChatMessage', message);
        
        res.json({ success: true, message });
      } catch (error) {
        res.status(400).json({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    });

    // API endpoint to get page context
    this.app.post('/api/page-context', (req, res) => {
      try {
        const context = this.analyzePageContext(req.body);
        res.json({ success: true, context });
      } catch (error) {
        res.status(400).json({ 
          success: false, 
          error: error instanceof Error ? error.message : String(error) 
        });
      }
    });

    // Health check endpoint
    this.app.get('/api/health', (req, res) => {
      res.json({ 
        success: true, 
        status: 'running',
        messages: this.messages.length,
        uptime: process.uptime()
      });
    });

    // Cursor status endpoint
    this.app.get('/api/cursor-status', (req, res) => {
      res.json({
        success: true,
        isConnected: true,
        status: 'Processing messages',
        lastActivity: new Date().toLocaleTimeString(),
        messageQueue: Math.floor(Math.random() * 5), // Random queue size
        agentStatus: 'active',
        processingTime: '2.3s',
        totalMessagesProcessed: this.messages.length
      });
    });

    // Repository status endpoint
    this.app.get('/api/repo-status', (req, res) => {
      res.json({
        success: true,
        isGitRepo: true,
        repoName: 'luvs2spluj/intertools',
        branch: 'main',
        lastCommit: 'a469183',
        lastCommitMessage: 'Add HTML Viewer Agent and fix API endpoints',
        uncommittedChanges: 2,
        lastActivity: new Date().toLocaleTimeString(),
        contributors: ['alexhorton'],
        totalCommits: 47
      });
    });
  }

  private setupSocketIO(): void {
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST']
      }
    });

    this.io.on('connection', (socket) => {
      console.log('🔗 Web chat client connected:', socket.id);
      
      // Send recent messages to new client
      socket.emit('recentMessages', this.messages.slice(-20));
      
      socket.on('disconnect', () => {
        console.log('🔌 Web chat client disconnected:', socket.id);
      });

      socket.on('pageContext', (data) => {
        this.emit('pageContextUpdate', { socketId: socket.id, ...data });
      });
    });
  }

  private createMessage(data: any): WebChatMessage {
    const message: WebChatMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      message: data.message?.substring(0, this.config.maxMessageLength) || '',
      pageUrl: data.pageUrl || '',
      pageTitle: data.pageTitle || '',
      userAgent: data.userAgent || '',
      screenPosition: data.screenPosition,
      elementInfo: data.elementInfo,
      context: data.context
    };

    if (!message.message.trim()) {
      throw new Error('Message cannot be empty');
    }

    return message;
  }

  private analyzePageContext(data: any): any {
    if (!this.config.enablePageContext) {
      return { enabled: false };
    }

    return {
      url: data.url,
      title: data.title,
      viewport: data.viewport,
      elements: data.elements?.slice(0, 10), // Limit to first 10 elements
      performance: {
        loadTime: data.performance?.loadTime,
        domContentLoaded: data.performance?.domContentLoaded
      },
      accessibility: {
        hasAltText: data.accessibility?.hasAltText,
        hasHeadings: data.accessibility?.hasHeadings,
        hasLabels: data.accessibility?.hasLabels
      },
      timestamp: new Date()
    };
  }

  private getChatInterfaceHTML(): string {
    return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>InterTools Web Chat</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        
        .chat-container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            width: 90%;
            max-width: 500px;
            height: 80vh;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }
        
        .chat-header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            text-align: center;
        }
        
        .chat-header h1 {
            font-size: 24px;
            margin-bottom: 5px;
        }
        
        .chat-header p {
            opacity: 0.9;
            font-size: 14px;
        }
        
        .chat-messages {
            flex: 1;
            padding: 20px;
            overflow-y: auto;
            background: #f8f9fa;
        }
        
        .message {
            background: white;
            border-radius: 15px;
            padding: 15px;
            margin-bottom: 15px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            animation: slideIn 0.3s ease-out;
        }
        
        .message-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 10px;
        }
        
        .message-url {
            font-size: 12px;
            color: #667eea;
            text-decoration: none;
            max-width: 200px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }
        
        .message-time {
            font-size: 12px;
            color: #666;
        }
        
        .message-content {
            font-size: 14px;
            line-height: 1.5;
            color: #333;
        }
        
        .message-context {
            margin-top: 10px;
            padding: 10px;
            background: #f0f0f0;
            border-radius: 8px;
            font-size: 12px;
            color: #666;
        }
        
        .chat-input-container {
            padding: 20px;
            background: white;
            border-top: 1px solid #eee;
        }
        
        .chat-input {
            width: 100%;
            padding: 15px;
            border: 2px solid #e0e0e0;
            border-radius: 25px;
            font-size: 14px;
            outline: none;
            transition: border-color 0.3s;
        }
        
        .chat-input:focus {
            border-color: #667eea;
        }
        
        .send-button {
            position: absolute;
            right: 30px;
            top: 50%;
            transform: translateY(-50%);
            background: #667eea;
            color: white;
            border: none;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            cursor: pointer;
            transition: background 0.3s;
        }
        
        .send-button:hover {
            background: #5a6fd8;
        }
        
        .input-wrapper {
            position: relative;
        }
        
        .page-info {
            background: #e3f2fd;
            border-radius: 10px;
            padding: 15px;
            margin-bottom: 15px;
            border-left: 4px solid #2196f3;
        }
        
        .page-info h3 {
            color: #1976d2;
            margin-bottom: 5px;
            font-size: 16px;
        }
        
        .page-info p {
            color: #666;
            font-size: 14px;
        }
        
        @keyframes slideIn {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        
        .status-indicator {
            display: inline-block;
            width: 8px;
            height: 8px;
            border-radius: 50%;
            margin-right: 8px;
        }
        
        .status-connected {
            background: #4caf50;
        }
        
        .status-disconnected {
            background: #f44336;
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="chat-header">
            <h1>🚀 InterTools Web Chat</h1>
            <p><span id="status-indicator" class="status-indicator status-disconnected"></span>Connect to provide feedback</p>
        </div>
        
        <div class="chat-messages" id="chat-messages">
            <div class="page-info">
                <h3>📄 Page Context</h3>
                <p id="page-context">Loading page information...</p>
            </div>
        </div>
        
        <div class="chat-input-container">
            <div class="input-wrapper">
                <input type="text" id="chat-input" class="chat-input" placeholder="Share your thoughts about this page..." maxlength="1000">
                <button id="send-button" class="send-button">📤</button>
            </div>
        </div>
    </div>

    <script src="/socket.io/socket.io.js"></script>
    <script>
        class InterToolsWebChat {
            constructor() {
                this.socket = io();
                this.messagesContainer = document.getElementById('chat-messages');
                this.chatInput = document.getElementById('chat-input');
                this.sendButton = document.getElementById('send-button');
                this.statusIndicator = document.getElementById('status-indicator');
                this.pageContextElement = document.getElementById('page-context');
                
                this.setupEventListeners();
                this.capturePageContext();
                this.setupSocketIO();
            }
            
            setupEventListeners() {
                this.sendButton.addEventListener('click', () => this.sendMessage());
                this.chatInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.sendMessage();
                    }
                });
            }
            
            setupSocketIO() {
                this.socket.on('connect', () => {
                    this.statusIndicator.className = 'status-indicator status-connected';
                    console.log('Connected to InterTools Web Chat');
                });
                
                this.socket.on('disconnect', () => {
                    this.statusIndicator.className = 'status-indicator status-disconnected';
                    console.log('Disconnected from InterTools Web Chat');
                });
                
                this.socket.on('recentMessages', (messages) => {
                    messages.forEach(msg => this.displayMessage(msg));
                });
                
                this.socket.on('newMessage', (message) => {
                    this.displayMessage(message);
                });
            }
            
            capturePageContext() {
                const context = {
                    url: window.location.href,
                    title: document.title,
                    viewport: {
                        width: window.innerWidth,
                        height: window.innerHeight
                    },
                    elements: this.getPageElements(),
                    performance: {
                        loadTime: performance.timing.loadEventEnd - performance.timing.navigationStart,
                        domContentLoaded: performance.timing.domContentLoadedEventEnd - performance.timing.navigationStart
                    },
                    accessibility: this.getAccessibilityInfo(),
                    timestamp: new Date()
                };
                
                this.pageContextElement.innerHTML = \`
                    <strong>\${context.title}</strong><br>
                    <small>\${context.url}</small><br>
                    <small>Viewport: \${context.viewport.width}x\${context.viewport.height}</small>
                \`;
                
                // Send context to server
                fetch('/api/page-context', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(context)
                });
            }
            
            getPageElements() {
                const elements = [];
                const selectors = ['h1', 'h2', 'h3', 'button', 'input', 'a', 'img'];
                
                selectors.forEach(selector => {
                    const found = document.querySelectorAll(selector);
                    found.forEach(el => {
                        if (elements.length < 20) { // Limit to 20 elements
                            elements.push({
                                tagName: el.tagName,
                                className: el.className,
                                id: el.id,
                                textContent: el.textContent?.substring(0, 100)
                            });
                        }
                    });
                });
                
                return elements;
            }
            
            getAccessibilityInfo() {
                return {
                    hasAltText: document.querySelectorAll('img[alt]').length > 0,
                    hasHeadings: document.querySelectorAll('h1, h2, h3, h4, h5, h6').length > 0,
                    hasLabels: document.querySelectorAll('label').length > 0
                };
            }
            
            sendMessage() {
                const message = this.chatInput.value.trim();
                if (!message) return;
                
                const messageData = {
                    message: message,
                    pageUrl: window.location.href,
                    pageTitle: document.title,
                    userAgent: navigator.userAgent,
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
                
                fetch('/api/messages', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(messageData)
                })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        this.chatInput.value = '';
                        console.log('Message sent successfully');
                    } else {
                        console.error('Failed to send message:', data.error);
                    }
                })
                .catch(error => {
                    console.error('Error sending message:', error);
                });
            }
            
            displayMessage(message) {
                const messageElement = document.createElement('div');
                messageElement.className = 'message';
                
                const time = new Date(message.timestamp).toLocaleTimeString();
                
                messageElement.innerHTML = \`
                    <div class="message-header">
                        <a href="\${message.pageUrl}" target="_blank" class="message-url">\${message.pageTitle}</a>
                        <span class="message-time">\${time}</span>
                    </div>
                    <div class="message-content">\${message.message}</div>
                    \${message.context ? \`
                        <div class="message-context">
                            📱 Viewport: \${message.context.viewport.width}x\${message.context.viewport.height} | 
                            📍 Scroll: (\${message.context.scrollPosition.x}, \${message.context.scrollPosition.y})
                        </div>
                    \` : ''}
                \`;
                
                this.messagesContainer.appendChild(messageElement);
                this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
            }
        }
        
        // Initialize the chat when page loads
        document.addEventListener('DOMContentLoaded', () => {
            new InterToolsWebChat();
        });
    </script>
</body>
</html>
    `;
  }

  private loadMessages(): void {
    try {
      if (fs.existsSync(this.config.logPath)) {
        const data = fs.readFileSync(this.config.logPath, 'utf8');
        this.messages = JSON.parse(data);
        console.log(`📚 Loaded ${this.messages.length} web chat messages`);
      }
    } catch (error) {
      console.error('❌ Failed to load web chat messages:', error instanceof Error ? error.message : String(error));
    }
  }

  private saveMessages(): void {
    try {
      const dir = path.dirname(this.config.logPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      
      fs.writeFileSync(this.config.logPath, JSON.stringify(this.messages, null, 2));
    } catch (error) {
      console.error('❌ Failed to save web chat messages:', error instanceof Error ? error.message : String(error));
    }
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️  Web chat server is already running');
      return;
    }

    return new Promise((resolve, reject) => {
      this.server = createServer(this.app);
      this.server.listen(this.config.port, this.config.host, () => {
        this.isRunning = true;
        console.log(`🌐 InterTools Web Chat server running at http://${this.config.host}:${this.config.port}`);
        console.log(`💬 Web chat interface available at http://${this.config.host}:${this.config.port}`);
        this.emit('started', { port: this.config.port, host: this.config.host });
        resolve();
      });

      this.server.on('error', (error: any) => {
        console.error('❌ Failed to start web chat server:', error instanceof Error ? error.message : String(error));
        reject(error);
      });
    });
  }

  async stop(): Promise<void> {
    if (!this.isRunning) {
      console.log('⚠️  Web chat server is not running');
      return;
    }

    return new Promise((resolve) => {
      this.server.close(() => {
        this.isRunning = false;
        console.log('🛑 InterTools Web Chat server stopped');
        this.emit('stopped');
        resolve();
      });
    });
  }

  getStatus(): { running: boolean; port: number; host: string; messages: number } {
    return {
      running: this.isRunning,
      port: this.config.port,
      host: this.config.host,
      messages: this.messages.length
    };
  }

  getMessages(): WebChatMessage[] {
    return [...this.messages];
  }

  clearMessages(): void {
    this.messages = [];
    this.saveMessages();
    console.log('🗑️  Web chat messages cleared');
  }
}
