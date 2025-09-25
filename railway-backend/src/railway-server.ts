#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { createServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import { RateLimiterMemory } from 'rate-limiter-flexible';
import dotenv from 'dotenv';
import { v4 as uuidv4 } from 'uuid';

// Load environment variables
dotenv.config();

interface InterToolsMessage {
  id: string;
  userId: string;
  message: string;
  pageUrl: string;
  pageTitle: string;
  timestamp: Date;
  consoleData?: any[];
  elementData?: any;
  sessionId: string;
}

interface UserSession {
  id: string;
  userId?: string;
  isAuthenticated: boolean;
  isPro: boolean;
  trialEndsAt?: Date;
  createdAt: Date;
  lastActivity: Date;
}

class InterToolsRailwayServer {
  private app: express.Application;
  private server: any;
  private io: SocketIOServer;
  private port: number;
  private messages: InterToolsMessage[] = [];
  private sessions: Map<string, UserSession> = new Map();
  private rateLimiter: RateLimiterMemory;

  constructor() {
    this.app = express();
    this.server = createServer(this.app);
    this.port = parseInt(process.env.PORT || '3001');
    
    // Rate limiting
    this.rateLimiter = new RateLimiterMemory({
      keyPrefix: 'intertools_api',
      points: 100, // Number of requests
      duration: 60, // Per 60 seconds
    });

    this.setupMiddleware();
    this.setupRoutes();
    this.setupSocketIO();
    this.setupGracefulShutdown();
  }

  private setupMiddleware(): void {
    // Security and performance middleware
    this.app.use(helmet({
      contentSecurityPolicy: false, // Allow embedding for extension
      crossOriginEmbedderPolicy: false
    }));
    this.app.use(compression());
    this.app.use(cors({
      origin: true, // Allow all origins for browser extension
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-ID']
    }));
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Rate limiting middleware
    this.app.use(async (req, res, next) => {
      try {
        await this.rateLimiter.consume(req.ip);
        next();
      } catch (rejRes) {
        res.status(429).json({
          success: false,
          error: 'Too many requests, please try again later'
        });
      }
    });

    // Request logging
    this.app.use((req, res, next) => {
      console.log(`${new Date().toISOString()} - ${req.method} ${req.path} - ${req.ip}`);
      next();
    });
  }

  private setupRoutes(): void {
    // Health check endpoint
    this.app.get('/api/health', (req, res) => {
      res.json({
        success: true,
        status: 'running',
        timestamp: new Date().toISOString(),
        version: '2.0.0',
        environment: process.env.NODE_ENV || 'production',
        uptime: Math.floor(process.uptime()),
        messages: this.messages.length,
        activeSessions: this.sessions.size
      });
    });

    // Get the free InterTools script
    this.app.get('/free-script.js', (req, res) => {
      res.setHeader('Content-Type', 'application/javascript');
      res.send(this.getFreeScript());
    });

    // Get the pro InterTools script  
    this.app.get('/pro-script.js', (req, res) => {
      const sessionId = req.headers['x-session-id'] as string;
      const session = sessionId ? this.sessions.get(sessionId) : null;
      
      if (!session || !session.isPro) {
        return res.status(403).json({
          success: false,
          error: 'Pro subscription required'
        });
      }

      res.setHeader('Content-Type', 'application/javascript');
      res.send(this.getProScript());
    });

    // Session management
    this.app.post('/api/session/create', (req, res) => {
      const sessionId = uuidv4();
      const session: UserSession = {
        id: sessionId,
        isAuthenticated: false,
        isPro: false,
        createdAt: new Date(),
        lastActivity: new Date()
      };

      this.sessions.set(sessionId, session);
      
      res.json({
        success: true,
        sessionId,
        session: {
          id: session.id,
          isAuthenticated: session.isAuthenticated,
          isPro: session.isPro
        }
      });
    });

    this.app.post('/api/session/validate', (req, res) => {
      const { sessionId } = req.body;
      const session = this.sessions.get(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      // Update last activity
      session.lastActivity = new Date();
      this.sessions.set(sessionId, session);

      res.json({
        success: true,
        session: {
          id: session.id,
          isAuthenticated: session.isAuthenticated,
          isPro: session.isPro,
          trialEndsAt: session.trialEndsAt
        }
      });
    });

    // Free trial activation
    this.app.post('/api/trial/activate', (req, res) => {
      const { sessionId, email } = req.body;
      const session = this.sessions.get(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      // Activate 7-day trial
      const trialEndsAt = new Date();
      trialEndsAt.setDate(trialEndsAt.getDate() + 7);

      session.isAuthenticated = true;
      session.isPro = true;
      session.userId = email;
      session.trialEndsAt = trialEndsAt;
      
      this.sessions.set(sessionId, session);

      res.json({
        success: true,
        message: '7-day free trial activated!',
        trialEndsAt: trialEndsAt.toISOString()
      });
    });

    // Message handling
    this.app.post('/api/messages', (req, res) => {
      const { sessionId, message, pageUrl, pageTitle, consoleData, elementData } = req.body;
      const session = this.sessions.get(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      const newMessage: InterToolsMessage = {
        id: uuidv4(),
        userId: session.userId || 'anonymous',
        message,
        pageUrl,
        pageTitle,
        timestamp: new Date(),
        consoleData,
        elementData,
        sessionId
      };

      this.messages.push(newMessage);
      
      // Keep only last 1000 messages
      if (this.messages.length > 1000) {
        this.messages = this.messages.slice(-1000);
      }

      // Emit to connected clients
      this.io.emit('newMessage', newMessage);

      res.json({
        success: true,
        messageId: newMessage.id,
        message: 'Message received and processed'
      });
    });

    // Get messages for a session
    this.app.get('/api/messages/:sessionId', (req, res) => {
      const { sessionId } = req.params;
      const session = this.sessions.get(sessionId);

      if (!session) {
        return res.status(404).json({
          success: false,
          error: 'Session not found'
        });
      }

      const sessionMessages = this.messages.filter(m => m.sessionId === sessionId);
      
      res.json({
        success: true,
        messages: sessionMessages,
        count: sessionMessages.length
      });
    });

    // Analytics endpoint
    this.app.get('/api/analytics', (req, res) => {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const recentMessages = this.messages.filter(m => m.timestamp > oneDayAgo);
      const weeklyMessages = this.messages.filter(m => m.timestamp > oneWeekAgo);
      const activeSessions = Array.from(this.sessions.values())
        .filter(s => s.lastActivity > oneDayAgo);

      res.json({
        success: true,
        analytics: {
          totalMessages: this.messages.length,
          messagesLast24h: recentMessages.length,
          messagesLastWeek: weeklyMessages.length,
          activeSessions: activeSessions.length,
          totalSessions: this.sessions.size,
          proUsers: Array.from(this.sessions.values()).filter(s => s.isPro).length
        }
      });
    });

    // Catch-all for undefined routes
    this.app.use('*', (req, res) => {
      res.status(404).json({
        success: false,
        error: 'Endpoint not found',
        availableEndpoints: [
          '/api/health',
          '/free-script.js',
          '/pro-script.js',
          '/api/session/create',
          '/api/session/validate',
          '/api/trial/activate',
          '/api/messages',
          '/api/analytics'
        ]
      });
    });
  }

  private setupSocketIO(): void {
    this.io = new SocketIOServer(this.server, {
      cors: {
        origin: "*",
        methods: ["GET", "POST"]
      }
    });

    this.io.on('connection', (socket) => {
      console.log(`Client connected: ${socket.id}`);

      socket.on('joinSession', (sessionId: string) => {
        socket.join(`session_${sessionId}`);
        console.log(`Socket ${socket.id} joined session ${sessionId}`);
      });

      socket.on('disconnect', () => {
        console.log(`Client disconnected: ${socket.id}`);
      });
    });
  }

  private getFreeScript(): string {
    return `
// InterTools Free - Cloud Version
(function() {
  'use strict';
  
  console.log('🚀 InterTools Free (Cloud) loaded');
  
  let sessionId = localStorage.getItem('intertools_session_id');
  const API_BASE = '${process.env.RAILWAY_STATIC_URL || 'https://your-app.railway.app'}';
  
  // Create session if needed
  if (!sessionId) {
    fetch(API_BASE + '/api/session/create', { method: 'POST' })
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          sessionId = data.sessionId;
          localStorage.setItem('intertools_session_id', sessionId);
        }
      });
  }
  
  // Console log capture
  const logs = [];
  const originalLog = console.log;
  const originalError = console.error;
  const originalWarn = console.warn;
  
  function captureLog(type, args) {
    const logEntry = {
      type,
      message: Array.from(args).join(' '),
      timestamp: new Date().toISOString(),
      url: window.location.href
    };
    logs.push(logEntry);
    if (logs.length > 50) logs.shift();
  }
  
  console.log = function(...args) {
    captureLog('log', args);
    originalLog.apply(console, args);
  };
  
  console.error = function(...args) {
    captureLog('error', args);
    originalError.apply(console, args);
  };
  
  console.warn = function(...args) {
    captureLog('warn', args);
    originalWarn.apply(console, args);
  };
  
  // Create floating chat button
  const button = document.createElement('div');
  button.innerHTML = '💬';
  button.style.cssText = \`
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
  \`;
  
  button.onclick = () => showChatInterface();
  document.body.appendChild(button);
  
  function showChatInterface() {
    const modal = document.createElement('div');
    modal.style.cssText = \`
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.8);
      z-index: 10001;
      display: flex;
      align-items: center;
      justify-content: center;
    \`;
    
    modal.innerHTML = \`
      <div style="background: white; border-radius: 20px; padding: 30px; max-width: 500px; width: 90%;">
        <h2 style="margin: 0 0 20px 0; color: #333;">🚀 InterTools Free</h2>
        <textarea id="message" placeholder="Describe what you need help with..." style="width: 100%; height: 100px; margin-bottom: 15px; padding: 10px; border: 1px solid #ddd; border-radius: 8px;"></textarea>
        <div style="display: flex; gap: 10px;">
          <button onclick="sendMessage()" style="flex: 1; background: #667eea; color: white; border: none; padding: 12px; border-radius: 8px; cursor: pointer;">Send to Cursor</button>
          <button onclick="this.parentElement.parentElement.parentElement.remove()" style="background: #f5f5f5; color: #666; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer;">Close</button>
        </div>
        <div style="margin-top: 15px; font-size: 12px; color: #666;">
          💡 <a href="https://intertools.pro" target="_blank">Upgrade to Pro</a> for advanced features
        </div>
      </div>
    \`;
    
    document.body.appendChild(modal);
    
    window.sendMessage = () => {
      const message = document.getElementById('message').value;
      if (!message.trim()) return;
      
      const payload = {
        sessionId,
        message,
        pageUrl: window.location.href,
        pageTitle: document.title,
        consoleData: logs.slice(-10)
      };
      
      fetch(API_BASE + '/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      }).then(r => r.json()).then(data => {
        if (data.success) {
          const cursorMessage = \`🤖 InterTools Analysis Request

📄 Page: \${document.title}
🔗 URL: \${window.location.href}
⏰ Time: \${new Date().toLocaleString()}

💬 User Request: \${message}

📊 Console Logs:
\${logs.slice(-10).map(l => \`[\${l.type.toUpperCase()}] \${l.message}\`).join('\\n')}

🎯 Please analyze and provide suggestions.\`;
          
          navigator.clipboard.writeText(cursorMessage).then(() => {
            alert('✅ Message copied! Paste in Cursor chat.');
            modal.remove();
          });
        }
      });
    };
  }
  
  console.log('✅ InterTools Free initialized');
})();`;
  }

  private getProScript(): string {
    return `
// InterTools Pro - Cloud Version with Advanced Features
(function() {
  'use strict';
  
  console.log('🚀 InterTools Pro (Cloud) loaded');
  
  // Enhanced features for Pro users
  // Advanced DOM monitoring, AI suggestions, real-time chat, etc.
  // ... Pro features implementation
  
})();`;
  }

  private setupGracefulShutdown(): void {
    const shutdown = (signal: string) => {
      console.log(`Received ${signal}, shutting down gracefully...`);
      
      this.server.close(() => {
        console.log('HTTP server closed');
        process.exit(0);
      });

      // Force close after 10 seconds
      setTimeout(() => {
        console.error('Forced shutdown');
        process.exit(1);
      }, 10000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
  }

  public start(): void {
    this.server.listen(this.port, () => {
      console.log(`🚀 InterTools Railway Backend running on port ${this.port}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'production'}`);
      console.log(`📊 Health check: http://localhost:${this.port}/api/health`);
      console.log(`🔧 Free script: http://localhost:${this.port}/free-script.js`);
    });
  }
}

// Start the server
const server = new InterToolsRailwayServer();
server.start();
