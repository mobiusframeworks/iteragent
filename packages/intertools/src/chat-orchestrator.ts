export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  context?: ChatContext;
  metadata?: Record<string, any>;
}

export interface ChatContext {
  terminalLogs?: any[];
  localhostData?: any;
  productionData?: any;
  codeContext?: string;
  currentFile?: string;
  selectedText?: string;
  ide?: 'cursor' | 'vscode' | 'webstorm';
}

export interface ChatAgent {
  id: string;
  name: string;
  role: string;
  capabilities: string[];
  active: boolean;
}

export interface ChatInsight {
  type: 'error_analysis' | 'performance' | 'security' | 'best_practice' | 'suggestion';
  severity: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  description: string;
  recommendation: string;
  codeExample?: string;
  references?: string[];
}

export interface ChatAnalysis {
  summary: string;
  insights: ChatInsight[];
  codeRecommendations: string[];
  nextSteps: string[];
  confidence: number;
}

export class ChatOrchestrator {
  private agents: Map<string, ChatAgent> = new Map();
  private chatHistory: ChatMessage[] = new Map();
  private context: ChatContext = {};
  private isActive: boolean = false;

  constructor() {
    this.initializeAgents();
  }

  /**
   * Initialize AI agents
   */
  private initializeAgents(): void {
    const defaultAgents: ChatAgent[] = [
      {
        id: 'console-analyzer',
        name: 'Console Analyzer',
        role: 'Analyzes console logs and identifies patterns',
        capabilities: ['error-detection', 'log-analysis', 'pattern-recognition'],
        active: true
      },
      {
        id: 'performance-expert',
        name: 'Performance Expert',
        role: 'Provides performance optimization insights',
        capabilities: ['performance-analysis', 'optimization-suggestions', 'metrics-interpretation'],
        active: true
      },
      {
        id: 'security-advisor',
        name: 'Security Advisor',
        role: 'Identifies security vulnerabilities and best practices',
        capabilities: ['security-analysis', 'vulnerability-detection', 'compliance-checking'],
        active: true
      },
      {
        id: 'code-reviewer',
        name: 'Code Reviewer',
        role: 'Reviews code quality and suggests improvements',
        capabilities: ['code-analysis', 'best-practices', 'refactoring-suggestions'],
        active: true
      },
      {
        id: 'debugging-assistant',
        name: 'Debugging Assistant',
        role: 'Helps debug issues and provides step-by-step solutions',
        capabilities: ['error-diagnosis', 'debugging-strategies', 'solution-generation'],
        active: true
      }
    ];

    defaultAgents.forEach(agent => {
      this.agents.set(agent.id, agent);
    });
  }

  /**
   * Start the chat orchestrator
   */
  async start(): Promise<ChatOrchestrator> {
    this.isActive = true;
    console.log('🤖 AI Chat Orchestrator started');
    console.log(`📋 Active agents: ${Array.from(this.agents.values()).filter(a => a.active).length}`);
    
    return this;
  }

  /**
   * Stop the chat orchestrator
   */
  stop(): void {
    this.isActive = false;
    console.log('🤖 AI Chat Orchestrator stopped');
  }

  /**
   * Update context for better responses
   */
  updateContext(context: Partial<ChatContext>): void {
    this.context = { ...this.context, ...context };
  }

  /**
   * Ask a question to the AI orchestrator
   */
  async ask(question: string, context?: Partial<ChatContext>): Promise<string> {
    if (!this.isActive) {
      throw new Error('Chat orchestrator is not active. Call start() first.');
    }

    // Update context if provided
    if (context) {
      this.updateContext(context);
    }

    const messageId = this.generateMessageId();
    const userMessage: ChatMessage = {
      id: messageId,
      role: 'user',
      content: question,
      timestamp: new Date(),
      context: this.context
    };

    this.chatHistory.push(userMessage);

    // Analyze the question and route to appropriate agents
    const response = await this.processQuestion(question);

    const assistantMessage: ChatMessage = {
      id: this.generateMessageId(),
      role: 'assistant',
      content: response,
      timestamp: new Date(),
      context: this.context
    };

    this.chatHistory.push(assistantMessage);

    return response;
  }

  /**
   * Analyze data using multiple agents
   */
  async analyze(type: string, data: any): Promise<ChatAnalysis> {
    if (!this.isActive) {
      throw new Error('Chat orchestrator is not active. Call start() first.');
    }

    const analysis = await this.performAnalysis(type, data);
    return analysis;
  }

  /**
   * Get active agents
   */
  getActiveAgents(): ChatAgent[] {
    return Array.from(this.agents.values()).filter(agent => agent.active);
  }

  /**
   * Enable/disable an agent
   */
  setAgentActive(agentId: string, active: boolean): void {
    const agent = this.agents.get(agentId);
    if (agent) {
      agent.active = active;
      console.log(`${active ? '✅' : '❌'} Agent ${agent.name} ${active ? 'enabled' : 'disabled'}`);
    }
  }

  /**
   * Get chat history
   */
  getChatHistory(): ChatMessage[] {
    return [...this.chatHistory];
  }

  /**
   * Clear chat history
   */
  clearHistory(): void {
    this.chatHistory = [];
    console.log('🗑️ Chat history cleared');
  }

  /**
   * Process a question using appropriate agents
   */
  private async processQuestion(question: string): Promise<string> {
    const questionLower = question.toLowerCase();
    
    // Route to appropriate analysis based on question content
    if (questionLower.includes('error') || questionLower.includes('bug') || questionLower.includes('crash')) {
      return this.analyzeErrors(question);
    } else if (questionLower.includes('performance') || questionLower.includes('slow') || questionLower.includes('speed')) {
      return this.analyzePerformance(question);
    } else if (questionLower.includes('security') || questionLower.includes('vulnerability') || questionLower.includes('safe')) {
      return this.analyzeSecurity(question);
    } else if (questionLower.includes('code') || questionLower.includes('review') || questionLower.includes('improve')) {
      return this.reviewCode(question);
    } else {
      return this.provideGeneralAssistance(question);
    }
  }

  /**
   * Analyze errors using console analyzer and debugging assistant
   */
  private async analyzeErrors(question: string): Promise<string> {
    const terminalLogs = this.context.terminalLogs || [];
    const localhostData = this.context.localhostData || {};
    
    // Simulate AI error analysis
    const errors = [
      ...terminalLogs.filter((log: any) => log.type === 'error'),
      ...(localhostData.consoleLogs || []).filter((log: any) => log.type === 'error')
    ];

    if (errors.length === 0) {
      return "🔍 I don't see any current errors in your logs. However, here are some proactive debugging tips:\n\n" +
             "1. **Console Monitoring**: Keep your browser console open while developing\n" +
             "2. **Error Boundaries**: Implement React error boundaries for better error handling\n" +
             "3. **Logging Strategy**: Add structured logging to track application flow\n" +
             "4. **Testing**: Write unit tests to catch errors early\n\n" +
             "Would you like me to analyze any specific part of your application?";
    }

    let response = `🐛 **Error Analysis Results**\n\n`;
    response += `Found ${errors.length} error${errors.length > 1 ? 's' : ''} in your application:\n\n`;

    errors.slice(0, 3).forEach((error: any, index: number) => {
      response += `**${index + 1}. ${error.message}**\n`;
      response += `   📍 Source: ${error.source || 'Unknown'}\n`;
      response += `   ⏰ Time: ${error.timestamp || 'Recent'}\n`;
      
      // Provide specific recommendations based on error type
      if (error.message.includes('TypeError')) {
        response += `   💡 **Recommendation**: This is a type error. Check for null/undefined values before accessing properties.\n`;
        response += `   📝 **Fix**: Add null checks: \`if (data && data.property) { ... }\`\n\n`;
      } else if (error.message.includes('404') || error.message.includes('Not Found')) {
        response += `   💡 **Recommendation**: This is a network error. The requested resource doesn't exist.\n`;
        response += `   📝 **Fix**: Check the API endpoint URL and ensure the server is running.\n\n`;
      } else if (error.message.includes('Failed to fetch')) {
        response += `   💡 **Recommendation**: This is a network connectivity issue.\n`;
        response += `   📝 **Fix**: Check CORS settings, network connectivity, and API availability.\n\n`;
      } else {
        response += `   💡 **Recommendation**: Review the error stack trace and check the affected code.\n\n`;
      }
    });

    response += `🎯 **Next Steps:**\n`;
    response += `1. Fix the most critical errors first (those affecting user experience)\n`;
    response += `2. Add error handling and user-friendly error messages\n`;
    response += `3. Implement error monitoring to catch issues in production\n`;
    response += `4. Consider adding retry logic for network requests\n\n`;
    
    response += `Would you like me to dive deeper into any specific error?`;

    return response;
  }

  /**
   * Analyze performance using performance expert
   */
  private async analyzePerformance(question: string): Promise<string> {
    const localhostData = this.context.localhostData || {};
    const productionData = this.context.productionData || {};
    
    let response = `⚡ **Performance Analysis**\n\n`;

    if (localhostData.performance) {
      const perf = localhostData.performance;
      response += `**Development Environment:**\n`;
      response += `📊 Load Time: ${perf.loadTime}ms ${perf.loadTime > 2000 ? '⚠️ Slow' : '✅ Good'}\n`;
      response += `🧠 Memory Usage: ${perf.memoryUsage}MB ${perf.memoryUsage > 100 ? '⚠️ High' : '✅ Normal'}\n`;
      response += `🌐 DOM Nodes: ${perf.domNodes} ${perf.domNodes > 1000 ? '⚠️ Many' : '✅ Good'}\n\n`;
    }

    if (productionData.performance) {
      const perf = productionData.performance;
      response += `**Production Environment:**\n`;
      response += `🚀 Response Time: ${Math.round(perf.responseTime)}ms\n`;
      response += `📈 Throughput: ${Math.round(perf.throughput)} req/min\n`;
      response += `💾 Memory Usage: ${Math.round(perf.memoryUsage)}%\n`;
      response += `🖥️ CPU Usage: ${Math.round(perf.cpuUsage)}%\n\n`;
      
      response += `**Web Vitals:**\n`;
      response += `🎨 LCP: ${Math.round(perf.webVitals.lcp)}ms ${perf.webVitals.lcp > 2500 ? '❌ Needs Improvement' : '✅ Good'}\n`;
      response += `⚡ FID: ${Math.round(perf.webVitals.fid)}ms ${perf.webVitals.fid > 100 ? '❌ Poor' : '✅ Good'}\n`;
      response += `📐 CLS: ${perf.webVitals.cls.toFixed(3)} ${perf.webVitals.cls > 0.1 ? '❌ Poor' : '✅ Good'}\n\n`;
    }

    response += `🎯 **Performance Recommendations:**\n\n`;
    
    if (localhostData.performance?.loadTime > 2000) {
      response += `1. **Optimize Bundle Size**: Your app takes ${localhostData.performance.loadTime}ms to load\n`;
      response += `   - Enable code splitting\n`;
      response += `   - Remove unused dependencies\n`;
      response += `   - Use dynamic imports for heavy components\n\n`;
    }

    if (localhostData.performance?.memoryUsage > 100) {
      response += `2. **Memory Optimization**: High memory usage detected (${localhostData.performance.memoryUsage}MB)\n`;
      response += `   - Check for memory leaks\n`;
      response += `   - Implement proper cleanup in useEffect\n`;
      response += `   - Use React.memo for expensive components\n\n`;
    }

    if (productionData.performance?.webVitals.lcp > 2500) {
      response += `3. **Improve Largest Contentful Paint**: Currently ${Math.round(productionData.performance.webVitals.lcp)}ms\n`;
      response += `   - Optimize images with modern formats (WebP, AVIF)\n`;
      response += `   - Preload critical resources\n`;
      response += `   - Use CDN for static assets\n\n`;
    }

    response += `4. **General Optimizations**:\n`;
    response += `   - Enable gzip/brotli compression\n`;
    response += `   - Implement service worker caching\n`;
    response += `   - Optimize database queries\n`;
    response += `   - Use lazy loading for images\n\n`;

    response += `Would you like specific guidance on any of these optimizations?`;

    return response;
  }

  /**
   * Analyze security using security advisor
   */
  private async analyzeSecurity(question: string): Promise<string> {
    const productionData = this.context.productionData || {};
    
    let response = `🔒 **Security Analysis**\n\n`;

    if (productionData.security) {
      const security = productionData.security;
      
      response += `**SSL Certificate:**\n`;
      response += `${security.sslCertificate.valid ? '✅' : '❌'} Valid: ${security.sslCertificate.valid}\n`;
      response += `📅 Expires: ${security.sslCertificate.expiresAt}\n`;
      response += `🏢 Issuer: ${security.sslCertificate.issuer}\n\n`;

      response += `**Security Headers:**\n`;
      Object.entries(security.securityHeaders).forEach(([header, present]) => {
        response += `${present ? '✅' : '❌'} ${header}\n`;
      });
      response += `\n`;

      if (security.vulnerabilities.length > 0) {
        response += `**Vulnerabilities Found:**\n`;
        security.vulnerabilities.forEach((vuln: any, index: number) => {
          response += `${index + 1}. **${vuln.type}** (${vuln.severity})\n`;
          response += `   📝 ${vuln.description}\n`;
          response += `   🔧 Fix: ${vuln.fixRecommendation}\n\n`;
        });
      }
    }

    response += `🛡️ **Security Recommendations:**\n\n`;
    response += `1. **Implement Content Security Policy (CSP)**\n`;
    response += `   - Prevent XSS attacks\n`;
    response += `   - Control resource loading\n\n`;
    
    response += `2. **Enable Security Headers**\n`;
    response += `   - X-Frame-Options: DENY\n`;
    response += `   - X-Content-Type-Options: nosniff\n`;
    response += `   - Strict-Transport-Security\n\n`;
    
    response += `3. **Input Validation & Sanitization**\n`;
    response += `   - Validate all user inputs\n`;
    response += `   - Use parameterized queries\n`;
    response += `   - Sanitize output data\n\n`;
    
    response += `4. **Authentication & Authorization**\n`;
    response += `   - Use strong password policies\n`;
    response += `   - Implement 2FA where possible\n`;
    response += `   - Follow principle of least privilege\n\n`;
    
    response += `Would you like detailed guidance on implementing any of these security measures?`;

    return response;
  }

  /**
   * Review code using code reviewer
   */
  private async reviewCode(question: string): Promise<string> {
    const codeContext = this.context.codeContext || '';
    const currentFile = this.context.currentFile || '';
    
    let response = `📝 **Code Review**\n\n`;

    if (currentFile) {
      response += `**File**: ${currentFile}\n\n`;
    }

    if (codeContext) {
      response += `**Code Analysis:**\n`;
      
      // Analyze code patterns (simplified)
      const codeIssues = [];
      
      if (codeContext.includes('console.log')) {
        codeIssues.push({
          type: 'Debugging Code',
          severity: 'low',
          message: 'Remove console.log statements before production',
          suggestion: 'Use a proper logging library or remove debug statements'
        });
      }
      
      if (codeContext.includes('var ')) {
        codeIssues.push({
          type: 'Variable Declaration',
          severity: 'medium',
          message: 'Use const/let instead of var',
          suggestion: 'Replace var with const for constants and let for variables'
        });
      }
      
      if (codeContext.includes('== ') || codeContext.includes('!= ')) {
        codeIssues.push({
          type: 'Equality Comparison',
          severity: 'medium',
          message: 'Use strict equality operators',
          suggestion: 'Replace == with === and != with !=='
        });
      }

      if (codeIssues.length > 0) {
        codeIssues.forEach((issue, index) => {
          response += `${index + 1}. **${issue.type}** (${issue.severity})\n`;
          response += `   ⚠️ ${issue.message}\n`;
          response += `   💡 ${issue.suggestion}\n\n`;
        });
      } else {
        response += `✅ No obvious issues found in the provided code.\n\n`;
      }
    }

    response += `🎯 **General Best Practices:**\n\n`;
    response += `1. **Code Organization**\n`;
    response += `   - Use meaningful variable and function names\n`;
    response += `   - Keep functions small and focused\n`;
    response += `   - Follow consistent naming conventions\n\n`;
    
    response += `2. **Error Handling**\n`;
    response += `   - Use try-catch blocks for error-prone operations\n`;
    response += `   - Provide meaningful error messages\n`;
    response += `   - Handle edge cases\n\n`;
    
    response += `3. **Performance**\n`;
    response += `   - Avoid unnecessary re-renders in React\n`;
    response += `   - Use useMemo and useCallback when appropriate\n`;
    response += `   - Optimize loops and data processing\n\n`;
    
    response += `4. **Maintainability**\n`;
    response += `   - Add comments for complex logic\n`;
    response += `   - Write unit tests\n`;
    response += `   - Use TypeScript for better type safety\n\n`;
    
    response += `Would you like me to review a specific part of your code in more detail?`;

    return response;
  }

  /**
   * Provide general assistance
   */
  private async provideGeneralAssistance(question: string): Promise<string> {
    let response = `🤖 **InterTools AI Assistant**\n\n`;
    
    response += `I can help you with:\n\n`;
    response += `🐛 **Error Analysis** - "What errors are affecting my app?"\n`;
    response += `⚡ **Performance Review** - "How can I improve my app's performance?"\n`;
    response += `🔒 **Security Audit** - "Are there any security issues?"\n`;
    response += `📝 **Code Review** - "Can you review this code?"\n`;
    response += `🔍 **Debugging Help** - "Help me debug this issue"\n\n`;
    
    response += `**Current Context:**\n`;
    if (this.context.terminalLogs?.length) {
      response += `📟 Terminal logs: ${this.context.terminalLogs.length} entries\n`;
    }
    if (this.context.localhostData) {
      response += `🌐 Localhost data: Available\n`;
    }
    if (this.context.productionData) {
      response += `📊 Production data: Available\n`;
    }
    if (this.context.currentFile) {
      response += `📁 Current file: ${this.context.currentFile}\n`;
    }
    
    response += `\nTry asking me something specific about your application, or let me know what you'd like help with!`;

    return response;
  }

  /**
   * Perform comprehensive analysis
   */
  private async performAnalysis(type: string, data: any): Promise<ChatAnalysis> {
    const insights: ChatInsight[] = [];
    const codeRecommendations: string[] = [];
    const nextSteps: string[] = [];

    // Analyze based on type
    switch (type.toLowerCase()) {
      case 'performance':
        insights.push({
          type: 'performance',
          severity: 'medium',
          title: 'Load Time Optimization',
          description: 'Your application load time could be improved',
          recommendation: 'Implement code splitting and lazy loading',
          codeExample: 'const Component = lazy(() => import("./Component"));'
        });
        codeRecommendations.push('Enable gzip compression');
        codeRecommendations.push('Optimize images and assets');
        nextSteps.push('Measure Core Web Vitals');
        nextSteps.push('Implement performance monitoring');
        break;

      case 'security':
        insights.push({
          type: 'security',
          severity: 'high',
          title: 'Missing Security Headers',
          description: 'Important security headers are not configured',
          recommendation: 'Add Content Security Policy and other security headers',
          references: ['https://owasp.org/www-project-secure-headers/']
        });
        codeRecommendations.push('Implement input validation');
        codeRecommendations.push('Use HTTPS everywhere');
        nextSteps.push('Security audit');
        nextSteps.push('Penetration testing');
        break;

      default:
        insights.push({
          type: 'suggestion',
          severity: 'low',
          title: 'General Analysis',
          description: 'Overall application health looks good',
          recommendation: 'Continue monitoring and maintain best practices'
        });
    }

    return {
      summary: `Analysis complete for ${type}. Found ${insights.length} insights and ${codeRecommendations.length} recommendations.`,
      insights,
      codeRecommendations,
      nextSteps,
      confidence: 0.85
    };
  }

  /**
   * Generate unique message ID
   */
  private generateMessageId(): string {
    return `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get orchestrator status
   */
  getStatus(): {
    active: boolean;
    agents: number;
    messages: number;
    context: ChatContext;
  } {
    return {
      active: this.isActive,
      agents: Array.from(this.agents.values()).filter(a => a.active).length,
      messages: this.chatHistory.length,
      context: this.context
    };
  }
}
