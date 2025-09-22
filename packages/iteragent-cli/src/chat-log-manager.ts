import { EventEmitter } from 'events';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { TerminalSuggestion, TerminalFeedback } from './terminal-feedback';

export interface ChatMessage {
  id: string;
  timestamp: Date;
  source: 'cursor-ai' | 'user' | 'system' | 'iterbot';
  type: 'question' | 'answer' | 'command' | 'error' | 'suggestion' | 'feedback';
  content: string;
  metadata: {
    projectId?: string;
    filePath?: string;
    language?: string;
    context?: string;
    userId?: string;
    sessionId?: string;
    confidence?: number;
    tokens?: number;
    model?: string;
  };
  analysis?: ChatAnalysis;
}

export interface ChatAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  intent: 'question' | 'request' | 'complaint' | 'praise' | 'bug-report' | 'feature-request';
  topics: string[];
  keywords: string[];
  complexity: 'simple' | 'moderate' | 'complex';
  urgency: 'low' | 'medium' | 'high' | 'critical';
  suggestions: string[];
  patterns: string[];
}

export interface ChatLogRequest {
  message: string;
  source: 'cursor-ai' | 'user' | 'system' | 'iterbot';
  type: 'question' | 'answer' | 'command' | 'error' | 'suggestion' | 'feedback';
  metadata?: {
    projectId?: string;
    filePath?: string;
    language?: string;
    context?: string;
    userId?: string;
    sessionId?: string;
    confidence?: number;
    tokens?: number;
    model?: string;
  };
}

export interface ChatInsights {
  totalMessages: number;
  averageResponseTime: number;
  commonTopics: Array<{ topic: string; count: number }>;
  frequentErrors: Array<{ error: string; count: number }>;
  userSatisfaction: number;
  improvementSuggestions: string[];
  patterns: Array<{ pattern: string; frequency: number }>;
}

export interface ChatLogConfig {
  storagePath: string;
  maxMessages: number;
  enableAnalysis: boolean;
  enableInsights: boolean;
  analysisInterval: number;
  retentionDays: number;
  enableRealTimeAnalysis: boolean;
}

export class ChatLogManager extends EventEmitter {
  private config: ChatLogConfig;
  private messages: Map<string, ChatMessage> = new Map();
  private analysisQueue: ChatMessage[] = [];
  private insights: ChatInsights | null = null;
  private isAnalyzing: boolean = false;

  constructor(config: Partial<ChatLogConfig> = {}) {
    super();
    this.config = {
      storagePath: '.iteragent/chat-logs',
      maxMessages: 10000,
      enableAnalysis: true,
      enableInsights: true,
      analysisInterval: 300000, // 5 minutes
      retentionDays: 30,
      enableRealTimeAnalysis: true,
      ...config
    };
    this.initializeStorage();
    this.startAnalysisLoop();
  }

  /**
   * Log a chat message from Cursor AI or other sources
   */
  async logMessage(request: ChatLogRequest): Promise<string> {
    const messageId = `chat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const chatMessage: ChatMessage = {
      id: messageId,
      timestamp: new Date(),
      source: request.source,
      type: request.type,
      content: request.message,
      metadata: request.metadata || {}
    };

    // Analyze message if enabled
    if (this.config.enableAnalysis) {
      chatMessage.analysis = await this.analyzeMessage(chatMessage);
    }

    // Store message
    this.messages.set(messageId, chatMessage);
    this.saveMessage(chatMessage);

    // Add to analysis queue
    if (this.config.enableRealTimeAnalysis) {
      this.analysisQueue.push(chatMessage);
    }

    // Emit event
    this.emit('messageLogged', chatMessage);

    console.log(chalk.blue(`📝 Chat message logged: ${messageId}`));
    
    return messageId;
  }

  /**
   * Analyze a chat message for insights
   */
  private async analyzeMessage(message: ChatMessage): Promise<ChatAnalysis> {
    const content = message.content.toLowerCase();
    
    // Sentiment analysis
    const sentiment = this.analyzeSentiment(content);
    
    // Intent detection
    const intent = this.detectIntent(content);
    
    // Topic extraction
    const topics = this.extractTopics(content);
    
    // Keyword extraction
    const keywords = this.extractKeywords(content);
    
    // Complexity analysis
    const complexity = this.analyzeComplexity(content);
    
    // Urgency analysis
    const urgency = this.analyzeUrgency(content);
    
    // Generate suggestions
    const suggestions = this.generateSuggestions(message);
    
    // Pattern detection
    const patterns = this.detectPatterns(content);

    return {
      sentiment,
      intent,
      topics,
      keywords,
      complexity,
      urgency,
      suggestions,
      patterns
    };
  }

  /**
   * Analyze sentiment of the message
   */
  private analyzeSentiment(content: string): 'positive' | 'negative' | 'neutral' {
    const positiveWords = ['good', 'great', 'excellent', 'amazing', 'perfect', 'love', 'awesome', 'fantastic', 'wonderful', 'brilliant'];
    const negativeWords = ['bad', 'terrible', 'awful', 'horrible', 'hate', 'disgusting', 'frustrated', 'angry', 'annoyed', 'disappointed'];
    
    const positiveCount = positiveWords.filter(word => content.includes(word)).length;
    const negativeCount = negativeWords.filter(word => content.includes(word)).length;
    
    if (positiveCount > negativeCount) return 'positive';
    if (negativeCount > positiveCount) return 'negative';
    return 'neutral';
  }

  /**
   * Detect intent of the message
   */
  private detectIntent(content: string): ChatAnalysis['intent'] {
    if (content.includes('?') || content.includes('how') || content.includes('what') || content.includes('why')) {
      return 'question';
    }
    if (content.includes('please') || content.includes('can you') || content.includes('could you')) {
      return 'request';
    }
    if (content.includes('bug') || content.includes('error') || content.includes('broken') || content.includes('not working')) {
      return 'bug-report';
    }
    if (content.includes('feature') || content.includes('add') || content.includes('implement')) {
      return 'feature-request';
    }
    if (content.includes('thank') || content.includes('great') || content.includes('awesome')) {
      return 'praise';
    }
    if (content.includes('complain') || content.includes('issue') || content.includes('problem')) {
      return 'complaint';
    }
    return 'request';
  }

  /**
   * Extract topics from the message
   */
  private extractTopics(content: string): string[] {
    const topicKeywords = {
      'javascript': ['js', 'javascript', 'node', 'npm', 'package'],
      'typescript': ['ts', 'typescript', 'interface', 'type'],
      'react': ['react', 'component', 'jsx', 'hooks', 'state'],
      'vue': ['vue', 'component', 'template', 'directive'],
      'python': ['python', 'py', 'pip', 'django', 'flask'],
      'database': ['database', 'db', 'sql', 'mongodb', 'postgresql'],
      'api': ['api', 'endpoint', 'rest', 'graphql', 'http'],
      'testing': ['test', 'testing', 'jest', 'cypress', 'playwright'],
      'deployment': ['deploy', 'deployment', 'docker', 'kubernetes', 'aws'],
      'performance': ['performance', 'optimization', 'speed', 'memory', 'cpu'],
      'security': ['security', 'auth', 'authentication', 'authorization', 'encryption'],
      'ui': ['ui', 'ux', 'design', 'css', 'styling', 'frontend'],
      'backend': ['backend', 'server', 'api', 'database', 'serverless'],
      'mobile': ['mobile', 'ios', 'android', 'react-native', 'flutter'],
      'trading': ['trading', 'crypto', 'bitcoin', 'stock', 'finance', 'trading-bot']
    };

    const topics: string[] = [];
    for (const [topic, keywords] of Object.entries(topicKeywords)) {
      if (keywords.some(keyword => content.includes(keyword))) {
        topics.push(topic);
      }
    }

    return topics;
  }

  /**
   * Extract keywords from the message
   */
  private extractKeywords(content: string): string[] {
    // Simple keyword extraction - remove common words and extract meaningful terms
    const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those'];
    
    const words = content.split(/\s+/)
      .filter(word => word.length > 2)
      .filter(word => !commonWords.includes(word))
      .filter(word => /^[a-zA-Z]/.test(word));
    
    // Return unique words, limited to 10
    return [...new Set(words)].slice(0, 10);
  }

  /**
   * Analyze complexity of the message
   */
  private analyzeComplexity(content: string): 'simple' | 'moderate' | 'complex' {
    const wordCount = content.split(/\s+/).length;
    const sentenceCount = content.split(/[.!?]+/).length;
    const avgWordsPerSentence = wordCount / sentenceCount;
    
    if (wordCount < 10 || avgWordsPerSentence < 5) return 'simple';
    if (wordCount < 50 || avgWordsPerSentence < 15) return 'moderate';
    return 'complex';
  }

  /**
   * Analyze urgency of the message
   */
  private analyzeUrgency(content: string): 'low' | 'medium' | 'high' | 'critical' {
    const urgentWords = ['urgent', 'asap', 'immediately', 'critical', 'emergency', 'broken', 'down', 'error', 'crash'];
    const highUrgencyWords = ['important', 'priority', 'fix', 'issue', 'problem', 'bug'];
    const mediumUrgencyWords = ['please', 'when', 'soon', 'help', 'question'];
    
    if (urgentWords.some(word => content.includes(word))) return 'critical';
    if (highUrgencyWords.some(word => content.includes(word))) return 'high';
    if (mediumUrgencyWords.some(word => content.includes(word))) return 'medium';
    return 'low';
  }

  /**
   * Generate suggestions based on the message
   */
  private generateSuggestions(message: ChatMessage): string[] {
    const suggestions: string[] = [];
    
    if (message.type === 'error') {
      suggestions.push('Check console logs for detailed error information');
      suggestions.push('Verify environment variables and configuration');
      suggestions.push('Check dependencies and package versions');
    }
    
    if (message.analysis?.intent === 'question') {
      suggestions.push('Provide more context about your specific use case');
      suggestions.push('Include relevant code snippets or error messages');
      suggestions.push('Specify your development environment and tools');
    }
    
    if (message.analysis?.topics.includes('performance')) {
      suggestions.push('Consider profiling your application');
      suggestions.push('Check for memory leaks and optimization opportunities');
      suggestions.push('Monitor resource usage and bottlenecks');
    }
    
    if (message.analysis?.topics.includes('testing')) {
      suggestions.push('Write comprehensive test cases');
      suggestions.push('Consider integration and E2E testing');
      suggestions.push('Use testing best practices and patterns');
    }
    
    return suggestions;
  }

  /**
   * Detect patterns in the message
   */
  private detectPatterns(content: string): string[] {
    const patterns: string[] = [];
    
    // Code pattern
    if (content.includes('```') || content.includes('function') || content.includes('const') || content.includes('let')) {
      patterns.push('code-related');
    }
    
    // Error pattern
    if (content.includes('error') || content.includes('exception') || content.includes('failed')) {
      patterns.push('error-related');
    }
    
    // Question pattern
    if (content.includes('?') || content.includes('how') || content.includes('what')) {
      patterns.push('question-pattern');
    }
    
    // Request pattern
    if (content.includes('please') || content.includes('can you') || content.includes('could you')) {
      patterns.push('request-pattern');
    }
    
    return patterns;
  }

  /**
   * Generate insights from all stored messages
   */
  async generateInsights(): Promise<ChatInsights> {
    const messages = Array.from(this.messages.values());
    
    // Calculate total messages
    const totalMessages = messages.length;
    
    // Calculate average response time (simplified)
    const responseTimes = messages
      .filter(m => m.type === 'answer')
      .map(m => m.timestamp.getTime());
    const averageResponseTime = responseTimes.length > 0 
      ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length 
      : 0;
    
    // Find common topics
    const topicCounts: Record<string, number> = {};
    messages.forEach(message => {
      if (message.analysis?.topics) {
        message.analysis.topics.forEach(topic => {
          topicCounts[topic] = (topicCounts[topic] || 0) + 1;
        });
      }
    });
    const commonTopics = Object.entries(topicCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([topic, count]) => ({ topic, count }));
    
    // Find frequent errors
    const errorCounts: Record<string, number> = {};
    messages
      .filter(m => m.type === 'error')
      .forEach(message => {
        const errorKey = message.content.substring(0, 50);
        errorCounts[errorKey] = (errorCounts[errorKey] || 0) + 1;
      });
    const frequentErrors = Object.entries(errorCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([error, count]) => ({ error, count }));
    
    // Calculate user satisfaction (simplified)
    const positiveMessages = messages.filter(m => m.analysis?.sentiment === 'positive').length;
    const userSatisfaction = totalMessages > 0 ? (positiveMessages / totalMessages) * 100 : 0;
    
    // Generate improvement suggestions
    const improvementSuggestions = this.generateImprovementSuggestions(messages);
    
    // Find patterns
    const patternCounts: Record<string, number> = {};
    messages.forEach(message => {
      if (message.analysis?.patterns) {
        message.analysis.patterns.forEach(pattern => {
          patternCounts[pattern] = (patternCounts[pattern] || 0) + 1;
        });
      }
    });
    const patterns = Object.entries(patternCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([pattern, frequency]) => ({ pattern, frequency }));

    const insights: ChatInsights = {
      totalMessages,
      averageResponseTime,
      commonTopics,
      frequentErrors,
      userSatisfaction,
      improvementSuggestions,
      patterns
    };

    this.insights = insights;
    this.emit('insightsGenerated', insights);
    
    return insights;
  }

  /**
   * Generate improvement suggestions based on message analysis
   */
  private generateImprovementSuggestions(messages: ChatMessage[]): string[] {
    const suggestions: string[] = [];
    
    // Analyze error patterns
    const errorMessages = messages.filter(m => m.type === 'error');
    if (errorMessages.length > messages.length * 0.3) {
      suggestions.push('Consider implementing better error handling and logging');
    }
    
    // Analyze question patterns
    const questionMessages = messages.filter(m => m.analysis?.intent === 'question');
    if (questionMessages.length > messages.length * 0.5) {
      suggestions.push('Improve documentation and provide more examples');
    }
    
    // Analyze complexity
    const complexMessages = messages.filter(m => m.analysis?.complexity === 'complex');
    if (complexMessages.length > messages.length * 0.4) {
      suggestions.push('Simplify explanations and break down complex topics');
    }
    
    // Analyze sentiment
    const negativeMessages = messages.filter(m => m.analysis?.sentiment === 'negative');
    if (negativeMessages.length > messages.length * 0.2) {
      suggestions.push('Focus on improving user experience and reducing frustration');
    }
    
    return suggestions;
  }

  /**
   * Get messages by criteria
   */
  getMessages(criteria?: {
    source?: ChatMessage['source'];
    type?: ChatMessage['type'];
    sentiment?: ChatAnalysis['sentiment'];
    intent?: ChatAnalysis['intent'];
    topics?: string[];
    dateRange?: { start: Date; end: Date };
  }): ChatMessage[] {
    let filteredMessages = Array.from(this.messages.values());
    
    if (criteria) {
      if (criteria.source) {
        filteredMessages = filteredMessages.filter(m => m.source === criteria.source);
      }
      if (criteria.type) {
        filteredMessages = filteredMessages.filter(m => m.type === criteria.type);
      }
      if (criteria.sentiment) {
        filteredMessages = filteredMessages.filter(m => m.analysis?.sentiment === criteria.sentiment);
      }
      if (criteria.intent) {
        filteredMessages = filteredMessages.filter(m => m.analysis?.intent === criteria.intent);
      }
      if (criteria.topics) {
        filteredMessages = filteredMessages.filter(m => 
          criteria.topics!.some(topic => m.analysis?.topics.includes(topic))
        );
      }
      if (criteria.dateRange) {
        filteredMessages = filteredMessages.filter(m => 
          m.timestamp >= criteria.dateRange!.start && m.timestamp <= criteria.dateRange!.end
        );
      }
    }
    
    return filteredMessages.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * Get insights
   */
  getInsights(): ChatInsights | null {
    return this.insights;
  }

  /**
   * Initialize storage
   */
  private initializeStorage(): void {
    try {
      mkdirSync(this.config.storagePath, { recursive: true });
      this.loadMessages();
    } catch (error) {
      console.log(chalk.yellow('⚠️ Could not initialize chat log storage'));
    }
  }

  /**
   * Save message to file
   */
  private saveMessage(message: ChatMessage): void {
    try {
      const filePath = join(this.config.storagePath, `${message.id}.json`);
      writeFileSync(filePath, JSON.stringify(message, null, 2));
    } catch (error) {
      console.log(chalk.red('❌ Could not save chat message'));
    }
  }

  /**
   * Load messages from storage
   */
  private loadMessages(): void {
    try {
      const files = require('fs').readdirSync(this.config.storagePath);
      files.forEach((file: string) => {
        if (file.endsWith('.json')) {
          const filePath = join(this.config.storagePath, file);
          const messageData = JSON.parse(readFileSync(filePath, 'utf8'));
          const message: ChatMessage = {
            ...messageData,
            timestamp: new Date(messageData.timestamp)
          };
          this.messages.set(message.id, message);
        }
      });
      console.log(chalk.green(`✅ Loaded ${this.messages.size} chat messages`));
    } catch (error) {
      console.log(chalk.yellow('⚠️ Could not load chat messages'));
    }
  }

  /**
   * Start analysis loop
   */
  private startAnalysisLoop(): void {
    if (this.config.enableInsights) {
      setInterval(async () => {
        if (!this.isAnalyzing && this.analysisQueue.length > 0) {
          this.isAnalyzing = true;
          await this.generateInsights();
          this.analysisQueue = [];
          this.isAnalyzing = false;
        }
      }, this.config.analysisInterval);
    }
  }

  /**
   * Clean up old messages
   */
  cleanup(): void {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
    
    const messagesToDelete: string[] = [];
    this.messages.forEach((message, id) => {
      if (message.timestamp < cutoffDate) {
        messagesToDelete.push(id);
      }
    });
    
    messagesToDelete.forEach(id => {
      this.messages.delete(id);
      try {
        const filePath = join(this.config.storagePath, `${id}.json`);
        require('fs').unlinkSync(filePath);
      } catch (error) {
        // File might not exist
      }
    });
    
    if (messagesToDelete.length > 0) {
      console.log(chalk.yellow(`🗑️ Cleaned up ${messagesToDelete.length} old chat messages`));
    }
  }
}
