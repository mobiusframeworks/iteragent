// InterTools Cursor Integration - Message Bridge
// This creates a bridge between web chat messages and Cursor AI

import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';

export interface CursorMessage {
  id: string;
  timestamp: Date;
  message: string;
  pageUrl: string;
  pageTitle: string;
  elementInfo?: {
    tagName: string;
    id: string;
    className: string;
    textContent: string;
  };
  htmlContent?: string;
  userAgent: string;
  sessionId: string;
  agentId: string;
}

export interface CursorResponse {
  id: string;
  timestamp: Date;
  response: string;
  originalMessageId: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

export class InterToolsCursorBridge extends EventEmitter {
  private messagesPath: string;
  private responsesPath: string;
  private inboxPath: string;
  private messages: CursorMessage[] = [];
  private responses: CursorResponse[] = [];

  constructor(projectRoot: string = process.cwd()) {
    super();
    
    this.messagesPath = path.join(projectRoot, '.intertools', 'cursor-messages.json');
    this.responsesPath = path.join(projectRoot, '.intertools', 'cursor-responses.json');
    this.inboxPath = path.join(projectRoot, '.cursor', 'inbox');
    
    this.ensureDirectories();
    this.loadMessages();
    this.loadResponses();
    this.setupFileWatcher();
  }

  private ensureDirectories(): void {
    const dirs = [
      path.dirname(this.messagesPath),
      path.dirname(this.responsesPath),
      this.inboxPath
    ];
    
    dirs.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
    });
  }

  private loadMessages(): void {
    try {
      if (fs.existsSync(this.messagesPath)) {
        const data = fs.readFileSync(this.messagesPath, 'utf8');
        this.messages = JSON.parse(data).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        console.log(`📨 Loaded ${this.messages.length} Cursor messages`);
      }
    } catch (error) {
      console.error('❌ Failed to load Cursor messages:', error instanceof Error ? error.message : String(error));
    }
  }

  private loadResponses(): void {
    try {
      if (fs.existsSync(this.responsesPath)) {
        const data = fs.readFileSync(this.responsesPath, 'utf8');
        this.responses = JSON.parse(data).map((resp: any) => ({
          ...resp,
          timestamp: new Date(resp.timestamp)
        }));
        console.log(`📤 Loaded ${this.responses.length} Cursor responses`);
      }
    } catch (error) {
      console.error('❌ Failed to load Cursor responses:', error instanceof Error ? error.message : String(error));
    }
  }

  private setupFileWatcher(): void {
    // Watch for new messages from web chat
    if (fs.existsSync(this.messagesPath)) {
      fs.watchFile(this.messagesPath, () => {
        this.loadMessages();
        this.processNewMessages();
      });
    }

    // Watch for responses from Cursor
    if (fs.existsSync(this.responsesPath)) {
      fs.watchFile(this.responsesPath, () => {
        this.loadResponses();
        this.processNewResponses();
      });
    }
  }

  private processNewMessages(): void {
    const newMessages = this.messages.filter(msg => 
      msg.timestamp > new Date(Date.now() - 5000) // Last 5 seconds
    );

    newMessages.forEach(message => {
      this.createCursorInboxFile(message);
      this.emit('newMessage', message);
    });
  }

  private processNewResponses(): void {
    const newResponses = this.responses.filter(resp => 
      resp.timestamp > new Date(Date.now() - 5000) // Last 5 seconds
    );

    newResponses.forEach(response => {
      this.emit('newResponse', response);
    });
  }

  private createCursorInboxFile(message: CursorMessage): void {
    const inboxFile = path.join(this.inboxPath, `intertools-message-${message.id}.md`);
    
    const content = this.formatMessageForCursor(message);
    
    fs.writeFileSync(inboxFile, content, 'utf8');
    console.log(`📝 Created Cursor inbox file: ${inboxFile}`);
  }

  private formatMessageForCursor(message: CursorMessage): string {
    let content = `# 🤖 InterTools Web Chat Message\n\n`;
    content += `**📄 Page:** ${message.pageTitle}\n`;
    content += `**🔗 URL:** ${message.pageUrl}\n`;
    content += `**⏰ Time:** ${message.timestamp.toLocaleString()}\n`;
    content += `**🆔 Session:** ${message.sessionId}\n`;
    content += `**🤖 Agent:** ${message.agentId}\n\n`;
    
    if (message.elementInfo) {
      content += `## 📍 Element Details\n\n`;
      content += `- **Tag:** ${message.elementInfo.tagName}\n`;
      content += `- **ID:** ${message.elementInfo.id || 'None'}\n`;
      content += `- **Classes:** ${message.elementInfo.className || 'None'}\n`;
      content += `- **Text:** "${message.elementInfo.textContent}"\n\n`;
    }
    
    content += `## 💬 User Message\n\n`;
    content += `> ${message.message}\n\n`;
    
    if (message.htmlContent) {
      content += `## 📄 HTML Content\n\n`;
      content += `\`\`\`html\n${message.htmlContent}\n\`\`\`\n\n`;
    }
    
    content += `## 🎯 Action Required\n\n`;
    content += `Please analyze this web chat message and provide:\n`;
    content += `1. **Analysis** of the user's feedback\n`;
    content += `2. **Suggestions** for improvement\n`;
    content += `3. **Code changes** if needed\n`;
    content += `4. **Response** to send back to the user\n\n`;
    content += `---\n`;
    content += `*This message was automatically generated by InterTools Web Chat*\n`;
    
    return content;
  }

  public addMessage(message: Omit<CursorMessage, 'id' | 'timestamp'>): CursorMessage {
    const newMessage: CursorMessage = {
      id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...message
    };

    this.messages.push(newMessage);
    this.saveMessages();
    this.createCursorInboxFile(newMessage);
    
    this.emit('messageAdded', newMessage);
    return newMessage;
  }

  public addResponse(response: Omit<CursorResponse, 'id' | 'timestamp'>): CursorResponse {
    const newResponse: CursorResponse = {
      id: `resp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
      ...response
    };

    this.responses.push(newResponse);
    this.saveResponses();
    
    this.emit('responseAdded', newResponse);
    return newResponse;
  }

  public getMessages(): CursorMessage[] {
    return [...this.messages];
  }

  public getResponses(): CursorResponse[] {
    return [...this.responses];
  }

  public getPendingMessages(): CursorMessage[] {
    return this.messages.filter(msg => 
      !this.responses.some(resp => resp.originalMessageId === msg.id)
    );
  }

  public createResponseTemplate(messageId: string): string {
    const message = this.messages.find(msg => msg.id === messageId);
    if (!message) {
      throw new Error(`Message ${messageId} not found`);
    }

    const responseFile = path.join(this.inboxPath, `intertools-response-${messageId}.md`);
    
    let content = `# 📤 InterTools Response Template\n\n`;
    content += `**Original Message ID:** ${messageId}\n`;
    content += `**Page:** ${message.pageTitle}\n`;
    content += `**User Message:** ${message.message}\n\n`;
    content += `## 🤖 Your Response\n\n`;
    content += `Please provide your response to the user's feedback:\n\n`;
    content += `---\n\n`;
    content += `## 📝 Response Format\n\n`;
    content += `Use this format for your response:\n\n`;
    content += `\`\`\`json\n`;
    content += `{\n`;
    content += `  "analysis": "Your analysis of the user's feedback",\n`;
    content += `  "suggestions": ["Suggestion 1", "Suggestion 2"],\n`;
    content += `  "codeChanges": "Any code changes needed",\n`;
    content += `  "response": "Your response to send back to the user"\n`;
    content += `}\n`;
    content += `\`\`\`\n\n`;
    content += `*Save this file to send your response back to InterTools*\n`;
    
    fs.writeFileSync(responseFile, content, 'utf8');
    console.log(`📝 Created response template: ${responseFile}`);
    
    return responseFile;
  }

  private saveMessages(): void {
    fs.writeFileSync(this.messagesPath, JSON.stringify(this.messages, null, 2), 'utf8');
  }

  private saveResponses(): void {
    fs.writeFileSync(this.responsesPath, JSON.stringify(this.responses, null, 2), 'utf8');
  }

  public clearMessages(): void {
    this.messages = [];
    this.saveMessages();
    console.log('🗑️ Cursor messages cleared');
  }

  public clearResponses(): void {
    this.responses = [];
    this.saveResponses();
    console.log('🗑️ Cursor responses cleared');
  }

  public getStatus(): {
    messages: number;
    responses: number;
    pending: number;
    inboxPath: string;
  } {
    return {
      messages: this.messages.length,
      responses: this.responses.length,
      pending: this.getPendingMessages().length,
      inboxPath: this.inboxPath
    };
  }
}
