import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import { ChatLogManager, ChatLogRequest } from './chat-log-manager';
import chalk from 'chalk';

export interface IterAgentAPIConfig {
  port: number;
  enableCORS: boolean;
  enableLogging: boolean;
  maxRequestSize: string;
  rateLimit: {
    windowMs: number;
    max: number;
  };
}

export class IterAgentAPIServer {
  private app: express.Application;
  private chatLogManager: ChatLogManager;
  private config: IterAgentAPIConfig;
  private server: any;

  constructor(config: Partial<IterAgentAPIConfig> = {}) {
    this.config = {
      port: 3001,
      enableCORS: true,
      enableLogging: true,
      maxRequestSize: '10mb',
      rateLimit: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 100 // limit each IP to 100 requests per windowMs
      },
      ...config
    };

    this.app = express();
    this.chatLogManager = new ChatLogManager();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupEventHandlers();
  }

  /**
   * Setup middleware
   */
  private setupMiddleware(): void {
    // CORS
    if (this.config.enableCORS) {
      this.app.use(cors({
        origin: true,
        credentials: true
      }));
    }

    // Body parsing
    this.app.use(express.json({ limit: this.config.maxRequestSize }));
    this.app.use(express.urlencoded({ extended: true, limit: this.config.maxRequestSize }));

    // Logging
    if (this.config.enableLogging) {
      this.app.use((req: Request, res: Response, next: NextFunction) => {
        console.log(chalk.blue(`📡 ${req.method} ${req.path} - ${req.ip}`));
        next();
      });
    }

    // Rate limiting (simple implementation)
    const requestCounts: Record<string, { count: number; resetTime: number }> = {};
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      const ip = req.ip || req.connection.remoteAddress || 'unknown';
      const now = Date.now();
      const windowStart = now - this.config.rateLimit.windowMs;

      if (!requestCounts[ip] || requestCounts[ip].resetTime < windowStart) {
        requestCounts[ip] = { count: 1, resetTime: now };
      } else {
        requestCounts[ip].count++;
      }

      if (requestCounts[ip].count > this.config.rateLimit.max) {
        return res.status(429).json({ error: 'Too many requests' });
      }

      next();
    });
  }

  /**
   * Setup API routes
   */
  private setupRoutes(): void {
    // Health check
    this.app.get('/health', (req: Request, res: Response) => {
      res.json({ 
        status: 'healthy', 
        timestamp: new Date().toISOString(),
        version: '1.0.3'
      });
    });

    // Log chat message
    this.app.post('/api/chat/log', async (req: Request, res: Response) => {
      try {
        const { message, source, type, metadata } = req.body;

        if (!message || !source || !type) {
          return res.status(400).json({ 
            error: 'Missing required fields: message, source, type' 
          });
        }

        const logRequest: ChatLogRequest = {
          message,
          source,
          type,
          metadata
        };

        const messageId = await this.chatLogManager.logMessage(logRequest);
        
        res.json({ 
          success: true, 
          messageId,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error(chalk.red('❌ Error logging chat message:'), error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Get chat messages
    this.app.get('/api/chat/messages', (req: Request, res: Response) => {
      try {
        const { source, type, sentiment, intent, topics, limit = '100' } = req.query;
        
        const criteria: any = {};
        if (source) criteria.source = source;
        if (type) criteria.type = type;
        if (sentiment) criteria.sentiment = sentiment;
        if (intent) criteria.intent = intent;
        if (topics) criteria.topics = (topics as string).split(',');

        const messages = this.chatLogManager.getMessages(criteria);
        const limitedMessages = messages.slice(0, parseInt(limit as string));

        res.json({
          success: true,
          messages: limitedMessages,
          total: messages.length,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error(chalk.red('❌ Error getting chat messages:'), error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Get chat insights
    this.app.get('/api/chat/insights', async (req: Request, res: Response) => {
      try {
        const insights = await this.chatLogManager.generateInsights();
        
        res.json({
          success: true,
          insights,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error(chalk.red('❌ Error getting chat insights:'), error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Get chat statistics
    this.app.get('/api/chat/stats', (req: Request, res: Response) => {
      try {
        const messages = this.chatLogManager.getMessages();
        const insights = this.chatLogManager.getInsights();

        const stats = {
          totalMessages: messages.length,
          messagesBySource: this.groupBy(messages, 'source'),
          messagesByType: this.groupBy(messages, 'type'),
          messagesBySentiment: this.groupBy(messages, 'analysis.sentiment'),
          messagesByIntent: this.groupBy(messages, 'analysis.intent'),
          recentMessages: messages.slice(0, 10),
          insights: insights
        };

        res.json({
          success: true,
          stats,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error(chalk.red('❌ Error getting chat stats:'), error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Search chat messages
    this.app.get('/api/chat/search', (req: Request, res: Response) => {
      try {
        const { q, source, type, limit = '50' } = req.query;
        
        if (!q) {
          return res.status(400).json({ error: 'Query parameter "q" is required' });
        }

        const messages = this.chatLogManager.getMessages();
        const searchResults = messages.filter(message => 
          message.content.toLowerCase().includes((q as string).toLowerCase())
        );

        const limitedResults = searchResults.slice(0, parseInt(limit as string));

        res.json({
          success: true,
          results: limitedResults,
          total: searchResults.length,
          query: q,
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error(chalk.red('❌ Error searching chat messages:'), error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Export chat data
    this.app.get('/api/chat/export', (req: Request, res: Response) => {
      try {
        const { format = 'json', source, type } = req.query;
        
        const criteria: any = {};
        if (source) criteria.source = source;
        if (type) criteria.type = type;

        const messages = this.chatLogManager.getMessages(criteria);

        if (format === 'csv') {
          const csv = this.convertToCSV(messages);
          res.setHeader('Content-Type', 'text/csv');
          res.setHeader('Content-Disposition', 'attachment; filename=chat-messages.csv');
          res.send(csv);
        } else {
          res.json({
            success: true,
            messages,
            total: messages.length,
            timestamp: new Date().toISOString()
          });
        }

      } catch (error) {
        console.error(chalk.red('❌ Error exporting chat data:'), error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Cleanup old messages
    this.app.post('/api/chat/cleanup', (req: Request, res: Response) => {
      try {
        this.chatLogManager.cleanup();
        
        res.json({
          success: true,
          message: 'Chat messages cleaned up successfully',
          timestamp: new Date().toISOString()
        });

      } catch (error) {
        console.error(chalk.red('❌ Error cleaning up chat messages:'), error);
        res.status(500).json({ error: 'Internal server error' });
      }
    });

    // Error handling
    this.app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
      console.error(chalk.red('❌ API Error:'), err);
      res.status(500).json({ error: 'Internal server error' });
    });

    // 404 handler
    this.app.use((req: Request, res: Response) => {
      res.status(404).json({ error: 'Endpoint not found' });
    });
  }

  /**
   * Setup event handlers
   */
  private setupEventHandlers(): void {
    this.chatLogManager.on('messageLogged', (message) => {
      console.log(chalk.green(`📝 Chat message logged: ${message.id}`));
    });

    this.chatLogManager.on('insightsGenerated', (insights) => {
      console.log(chalk.blue(`📊 Chat insights generated: ${insights.totalMessages} messages analyzed`));
    });
  }

  /**
   * Start the API server
   */
  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.server = this.app.listen(this.config.port, (err?: any) => {
        if (err) {
          reject(err);
        } else {
          console.log(chalk.green(`🚀 IterAgent API server started on port ${this.config.port}`));
          console.log(chalk.blue(`📡 Available endpoints:`));
          console.log(chalk.blue(`  GET  /health`));
          console.log(chalk.blue(`  POST /api/chat/log`));
          console.log(chalk.blue(`  GET  /api/chat/messages`));
          console.log(chalk.blue(`  GET  /api/chat/insights`));
          console.log(chalk.blue(`  GET  /api/chat/stats`));
          console.log(chalk.blue(`  GET  /api/chat/search`));
          console.log(chalk.blue(`  GET  /api/chat/export`));
          console.log(chalk.blue(`  POST /api/chat/cleanup`));
          resolve();
        }
      });
    });
  }

  /**
   * Stop the API server
   */
  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.server) {
        this.server.close(() => {
          console.log(chalk.yellow('⏹️ IterAgent API server stopped'));
          resolve();
        });
      } else {
        resolve();
      }
    });
  }

  /**
   * Group messages by property
   */
  private groupBy(messages: any[], property: string): Record<string, number> {
    const groups: Record<string, number> = {};
    
    messages.forEach(message => {
      const value = this.getNestedProperty(message, property);
      if (value) {
        groups[value] = (groups[value] || 0) + 1;
      }
    });
    
    return groups;
  }

  /**
   * Get nested property from object
   */
  private getNestedProperty(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  /**
   * Convert messages to CSV format
   */
  private convertToCSV(messages: any[]): string {
    if (messages.length === 0) return '';
    
    const headers = ['id', 'timestamp', 'source', 'type', 'content', 'sentiment', 'intent', 'topics', 'keywords'];
    const rows = messages.map(message => [
      message.id,
      message.timestamp,
      message.source,
      message.type,
      `"${message.content.replace(/"/g, '""')}"`,
      message.analysis?.sentiment || '',
      message.analysis?.intent || '',
      message.analysis?.topics?.join(';') || '',
      message.analysis?.keywords?.join(';') || ''
    ]);
    
    return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
  }

  /**
   * Get server info
   */
  getInfo(): { port: number; endpoints: string[] } {
    return {
      port: this.config.port,
      endpoints: [
        'GET /health',
        'POST /api/chat/log',
        'GET /api/chat/messages',
        'GET /api/chat/insights',
        'GET /api/chat/stats',
        'GET /api/chat/search',
        'GET /api/chat/export',
        'POST /api/chat/cleanup'
      ]
    };
  }
}
