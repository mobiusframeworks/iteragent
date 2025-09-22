/**
 * IterAgent Chat Logging Client
 * 
 * This client allows your apps to easily send chat messages from Cursor AI
 * to IterAgent for storage, analysis, and insights.
 * 
 * Usage:
 * ```javascript
 * import { IterAgentClient } from './iteragent-client';
 * 
 * const client = new IterAgentClient('http://localhost:3001');
 * 
 * // Log a chat message
 * await client.logMessage({
 *   message: 'How do I implement authentication in my React app?',
 *   source: 'cursor-ai',
 *   type: 'question',
 *   metadata: {
 *     projectId: 'my-react-app',
 *     filePath: 'src/components/Auth.js',
 *     language: 'javascript'
 *   }
 * });
 * ```
 */

export interface IterAgentMessage {
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

export interface IterAgentResponse {
  success: boolean;
  messageId?: string;
  timestamp?: string;
  error?: string;
}

export interface IterAgentInsights {
  totalMessages: number;
  averageResponseTime: number;
  commonTopics: Array<{ topic: string; count: number }>;
  frequentErrors: Array<{ error: string; count: number }>;
  userSatisfaction: number;
  improvementSuggestions: string[];
  patterns: Array<{ pattern: string; frequency: number }>;
}

export interface IterAgentStats {
  totalMessages: number;
  messagesBySource: Record<string, number>;
  messagesByType: Record<string, number>;
  messagesBySentiment: Record<string, number>;
  messagesByIntent: Record<string, number>;
  recentMessages: any[];
  insights: IterAgentInsights | null;
}

export class IterAgentClient {
  private baseUrl: string;
  private apiKey?: string;
  private timeout: number;

  constructor(baseUrl: string = 'http://localhost:3001', apiKey?: string, timeout: number = 5000) {
    this.baseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
    this.apiKey = apiKey;
    this.timeout = timeout;
  }

  /**
   * Log a chat message to IterAgent
   */
  async logMessage(message: IterAgentMessage): Promise<IterAgentResponse> {
    try {
      const response = await this.makeRequest('/api/chat/log', {
        method: 'POST',
        body: JSON.stringify(message)
      });

      return await response.json();
    } catch (error) {
      console.error('Error logging message to IterAgent:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get chat messages with optional filtering
   */
  async getMessages(options: {
    source?: string;
    type?: string;
    sentiment?: string;
    intent?: string;
    topics?: string[];
    limit?: number;
  } = {}): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      if (options.source) params.append('source', options.source);
      if (options.type) params.append('type', options.type);
      if (options.sentiment) params.append('sentiment', options.sentiment);
      if (options.intent) params.append('intent', options.intent);
      if (options.topics) params.append('topics', options.topics.join(','));
      if (options.limit) params.append('limit', options.limit.toString());

      const response = await this.makeRequest(`/api/chat/messages?${params.toString()}`);
      const data = await response.json();
      
      return data.success ? data.messages : [];
    } catch (error) {
      console.error('Error getting messages from IterAgent:', error);
      return [];
    }
  }

  /**
   * Get chat insights and analytics
   */
  async getInsights(): Promise<IterAgentInsights | null> {
    try {
      const response = await this.makeRequest('/api/chat/insights');
      const data = await response.json();
      
      return data.success ? data.insights : null;
    } catch (error) {
      console.error('Error getting insights from IterAgent:', error);
      return null;
    }
  }

  /**
   * Get chat statistics
   */
  async getStats(): Promise<IterAgentStats | null> {
    try {
      const response = await this.makeRequest('/api/chat/stats');
      const data = await response.json();
      
      return data.success ? data.stats : null;
    } catch (error) {
      console.error('Error getting stats from IterAgent:', error);
      return null;
    }
  }

  /**
   * Search chat messages
   */
  async searchMessages(query: string, options: {
    source?: string;
    type?: string;
    limit?: number;
  } = {}): Promise<any[]> {
    try {
      const params = new URLSearchParams();
      params.append('q', query);
      if (options.source) params.append('source', options.source);
      if (options.type) params.append('type', options.type);
      if (options.limit) params.append('limit', options.limit.toString());

      const response = await this.makeRequest(`/api/chat/search?${params.toString()}`);
      const data = await response.json();
      
      return data.success ? data.results : [];
    } catch (error) {
      console.error('Error searching messages in IterAgent:', error);
      return [];
    }
  }

  /**
   * Export chat data
   */
  async exportData(options: {
    format?: 'json' | 'csv';
    source?: string;
    type?: string;
  } = {}): Promise<any> {
    try {
      const params = new URLSearchParams();
      if (options.format) params.append('format', options.format);
      if (options.source) params.append('source', options.source);
      if (options.type) params.append('type', options.type);

      const response = await this.makeRequest(`/api/chat/export?${params.toString()}`);
      
      if (options.format === 'csv') {
        return await response.text();
      } else {
        return await response.json();
      }
    } catch (error) {
      console.error('Error exporting data from IterAgent:', error);
      return null;
    }
  }

  /**
   * Check if IterAgent API is healthy
   */
  async isHealthy(): Promise<boolean> {
    try {
      const response = await this.makeRequest('/health');
      const data = await response.json();
      return data.status === 'healthy';
    } catch (error) {
      return false;
    }
  }

  /**
   * Make HTTP request to IterAgent API
   */
  private async makeRequest(endpoint: string, options: RequestInit = {}): Promise<Response> {
    const url = `${this.baseUrl}${endpoint}`;
    
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(this.apiKey && { 'Authorization': `Bearer ${this.apiKey}` }),
        ...options.headers
      }
    };

    const requestOptions = { ...defaultOptions, ...options };

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.timeout);

    try {
      const response = await fetch(url, {
        ...requestOptions,
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
}

/**
 * Convenience functions for common use cases
 */

/**
 * Log a Cursor AI question
 */
export async function logCursorQuestion(
  question: string,
  metadata?: IterAgentMessage['metadata'],
  client?: IterAgentClient
): Promise<IterAgentResponse> {
  const iterAgentClient = client || new IterAgentClient();
  
  return await iterAgentClient.logMessage({
    message: question,
    source: 'cursor-ai',
    type: 'question',
    metadata
  });
}

/**
 * Log a Cursor AI answer
 */
export async function logCursorAnswer(
  answer: string,
  metadata?: IterAgentMessage['metadata'],
  client?: IterAgentClient
): Promise<IterAgentResponse> {
  const iterAgentClient = client || new IterAgentClient();
  
  return await iterAgentClient.logMessage({
    message: answer,
    source: 'cursor-ai',
    type: 'answer',
    metadata
  });
}

/**
 * Log an error from your app
 */
export async function logAppError(
  error: string,
  metadata?: IterAgentMessage['metadata'],
  client?: IterAgentClient
): Promise<IterAgentResponse> {
  const iterAgentClient = client || new IterAgentClient();
  
  return await iterAgentClient.logMessage({
    message: error,
    source: 'system',
    type: 'error',
    metadata
  });
}

/**
 * Log user feedback
 */
export async function logUserFeedback(
  feedback: string,
  metadata?: IterAgentMessage['metadata'],
  client?: IterAgentClient
): Promise<IterAgentResponse> {
  const iterAgentClient = client || new IterAgentClient();
  
  return await iterAgentClient.logMessage({
    message: feedback,
    source: 'user',
    type: 'feedback',
    metadata
  });
}

/**
 * Log IterBot suggestions
 */
export async function logIterBotSuggestion(
  suggestion: string,
  metadata?: IterAgentMessage['metadata'],
  client?: IterAgentClient
): Promise<IterAgentResponse> {
  const iterAgentClient = client || new IterAgentClient();
  
  return await iterAgentClient.logMessage({
    message: suggestion,
    source: 'iterbot',
    type: 'suggestion',
    metadata
  });
}

/**
 * React Hook for IterAgent integration
 */
export function useIterAgent(baseUrl?: string, apiKey?: string) {
  const client = new IterAgentClient(baseUrl, apiKey);

  const logMessage = async (message: IterAgentMessage) => {
    return await client.logMessage(message);
  };

  const getInsights = async () => {
    return await client.getInsights();
  };

  const getStats = async () => {
    return await client.getStats();
  };

  const searchMessages = async (query: string, options?: any) => {
    return await client.searchMessages(query, options);
  };

  const isHealthy = async () => {
    return await client.isHealthy();
  };

  return {
    logMessage,
    getInsights,
    getStats,
    searchMessages,
    isHealthy,
    client
  };
}

/**
 * Vue Composable for IterAgent integration
 */
export function useIterAgentVue(baseUrl?: string, apiKey?: string) {
  const client = new IterAgentClient(baseUrl, apiKey);

  const logMessage = async (message: IterAgentMessage) => {
    return await client.logMessage(message);
  };

  const getInsights = async () => {
    return await client.getInsights();
  };

  const getStats = async () => {
    return await client.getStats();
  };

  const searchMessages = async (query: string, options?: any) => {
    return await client.searchMessages(query, options);
  };

  const isHealthy = async () => {
    return await client.isHealthy();
  };

  return {
    logMessage,
    getInsights,
    getStats,
    searchMessages,
    isHealthy,
    client
  };
}

/**
 * Node.js middleware for Express
 */
export function iterAgentMiddleware(baseUrl?: string, apiKey?: string) {
  const client = new IterAgentClient(baseUrl, apiKey);

  return (req: any, res: any, next: any) => {
    req.iterAgent = {
      logMessage: async (message: IterAgentMessage) => {
        return await client.logMessage(message);
      },
      getInsights: async () => {
        return await client.getInsights();
      },
      getStats: async () => {
        return await client.getStats();
      },
      searchMessages: async (query: string, options?: any) => {
        return await client.searchMessages(query, options);
      },
      isHealthy: async () => {
        return await client.isHealthy();
      },
      client
    };
    next();
  };
}

export default IterAgentClient;
