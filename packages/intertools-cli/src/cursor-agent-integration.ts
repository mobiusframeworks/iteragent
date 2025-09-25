import { EventEmitter } from 'events';
import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import chalk from 'chalk';
import { TerminalSuggestion, TerminalFeedback } from './terminal-feedback';

export interface CursorAgentMessage {
  id: string;
  type: 'suggestion' | 'command' | 'analysis' | 'feedback' | 'control';
  content: string;
  metadata: {
    timestamp: Date;
    source: string;
    priority: 'low' | 'medium' | 'high' | 'critical';
    confidence: number;
    suggestions?: TerminalSuggestion[];
    commands?: string[];
    code?: string;
  };
  actions: CursorAgentAction[];
}

export interface CursorAgentAction {
  type: 'execute' | 'suggest' | 'analyze' | 'modify' | 'stop' | 'continue';
  command?: string;
  code?: string;
  description: string;
  autoExecute: boolean;
}

export interface CursorAgentConfig {
  inboxPath: string;
  enableAutoExecution: boolean;
  maxMessages: number;
  messageTimeout: number;
  enableCodeInjection: boolean;
  enableTerminalControl: boolean;
  feedbackInterval: number;
}

export class CursorAgentIntegration extends EventEmitter {
  private config: CursorAgentConfig;
  private terminalFeedback: TerminalFeedback;
  private messageQueue: CursorAgentMessage[] = [];
  private isActive: boolean = false;
  private feedbackInterval: NodeJS.Timeout | null = null;

  constructor(config: Partial<CursorAgentConfig> = {}) {
    super();
    this.config = {
      inboxPath: '.cursor/inbox',
      enableAutoExecution: false,
      maxMessages: 50,
      messageTimeout: 30000,
      enableCodeInjection: true,
      enableTerminalControl: true,
      feedbackInterval: 10000,
      ...config
    };
    this.terminalFeedback = new TerminalFeedback();
    this.setupEventHandlers();
  }

  /**
   * Initialize Cursor agent integration
   */
  async initialize(): Promise<void> {
    console.log(chalk.blue('🤖 Initializing Cursor Agent Integration...'));
    
    // Create inbox directory
    try {
      mkdirSync(this.config.inboxPath, { recursive: true });
    } catch (error) {
      // Directory might already exist
    }

    this.isActive = true;
    this.startFeedbackLoop();
    
    console.log(chalk.green('✅ Cursor Agent Integration initialized'));
  }

  /**
   * Setup event handlers for terminal feedback
   */
  private setupEventHandlers(): void {
    this.terminalFeedback.on('suggestion', (suggestion: TerminalSuggestion) => {
      this.processSuggestion(suggestion);
    });

    this.terminalFeedback.on('suggestionExecuted', (suggestion: TerminalSuggestion, result: any) => {
      this.processExecutionResult(suggestion, result);
    });
  }

  /**
   * Start the feedback loop to Cursor
   */
  private startFeedbackLoop(): void {
    this.feedbackInterval = setInterval(() => {
      if (this.isActive && this.messageQueue.length > 0) {
        this.sendFeedbackToCursor();
      }
    }, this.config.feedbackInterval);
  }

  /**
   * Stop the feedback loop
   */
  stop(): void {
    this.isActive = false;
    if (this.feedbackInterval) {
      clearInterval(this.feedbackInterval);
      this.feedbackInterval = null;
    }
    console.log(chalk.yellow('⏹️ Cursor Agent Integration stopped'));
  }

  /**
   * Process terminal suggestion and create Cursor message
   */
  private processSuggestion(suggestion: TerminalSuggestion): void {
    const message: CursorAgentMessage = {
      id: `cursor_msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'suggestion',
      content: this.generateSuggestionContent(suggestion),
      metadata: {
        timestamp: new Date(),
        source: 'terminal-feedback',
        priority: suggestion.priority,
        confidence: suggestion.confidence,
        suggestions: [suggestion],
        commands: suggestion.command ? [suggestion.command] : undefined,
        code: suggestion.code
      },
      actions: this.generateActions(suggestion)
    };

    this.addMessage(message);
  }

  /**
   * Process execution result and create feedback message
   */
  private processExecutionResult(suggestion: TerminalSuggestion, result: any): void {
    const message: CursorAgentMessage = {
      id: `cursor_feedback_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'feedback',
      content: this.generateExecutionFeedback(suggestion, result),
      metadata: {
        timestamp: new Date(),
        source: 'execution-result',
        priority: result.success ? 'medium' : 'high',
        confidence: 1.0,
        suggestions: [suggestion]
      },
      actions: this.generatePostExecutionActions(suggestion, result)
    };

    this.addMessage(message);
  }

  /**
   * Generate suggestion content for Cursor
   */
  private generateSuggestionContent(suggestion: TerminalSuggestion): string {
    const priorityEmoji = {
      'low': '🔵',
      'medium': '🟡',
      'high': '🟠',
      'critical': '🔴'
    };

    const typeEmoji = {
      'command': '⚡',
      'fix': '🔧',
      'optimization': '⚡',
      'debug': '🐛',
      'info': 'ℹ️'
    };

    return `
## ${priorityEmoji[suggestion.priority]} ${typeEmoji[suggestion.type]} ${suggestion.title}

**Priority:** ${suggestion.priority.toUpperCase()}  
**Confidence:** ${Math.round(suggestion.confidence * 100)}%  
**Type:** ${suggestion.type}  
**Timestamp:** ${suggestion.timestamp.toISOString()}

### Description
${suggestion.description}

### Reasoning
${suggestion.reasoning}

### Suggested Action
${suggestion.command ? `\`\`\`bash\n${suggestion.command}\n\`\`\`` : 'No command available'}

${suggestion.code ? `### Code Suggestion\n\`\`\`typescript\n${suggestion.code}\n\`\`\`` : ''}

### Available Actions
- **Execute Command**: Run the suggested command
- **Add to Allowlist**: Always show this type of suggestion
- **Add to Blocklist**: Never show this type of suggestion
- **Modify Suggestion**: Customize the suggestion
- **Stop Monitoring**: Pause terminal feedback
`;
  }

  /**
   * Generate execution feedback content
   */
  private generateExecutionFeedback(suggestion: TerminalSuggestion, result: any): string {
    const statusEmoji = result.success ? '✅' : '❌';
    
    return `
## ${statusEmoji} Command Execution Result

**Suggestion:** ${suggestion.title}  
**Command:** \`${suggestion.command}\`  
**Status:** ${result.success ? 'SUCCESS' : 'FAILED'}  
**Timestamp:** ${new Date().toISOString()}

### Output
\`\`\`
${result.output || 'No output'}
\`\`\`

${result.error ? `### Error\n\`\`\`\n${result.error}\n\`\`\`` : ''}

### Next Steps
${result.success ? 
  'Command executed successfully. Monitor for any side effects.' : 
  'Command failed. Consider alternative approaches or debugging the issue.'
}
`;
  }

  /**
   * Generate actions for suggestion
   */
  private generateActions(suggestion: TerminalSuggestion): CursorAgentAction[] {
    const actions: CursorAgentAction[] = [];

    if (suggestion.command) {
      actions.push({
        type: 'execute',
        command: suggestion.command,
        description: `Execute: ${suggestion.command}`,
        autoExecute: this.config.enableAutoExecution && suggestion.priority === 'critical'
      });
    }

    if (suggestion.code) {
      actions.push({
        type: 'modify',
        code: suggestion.code,
        description: `Apply code suggestion: ${suggestion.title}`,
        autoExecute: false
      });
    }

    actions.push({
      type: 'suggest',
      description: `Add "${suggestion.type}" to allowlist`,
      autoExecute: false
    });

    actions.push({
      type: 'suggest',
      description: `Add "${suggestion.type}" to blocklist`,
      autoExecute: false
    });

    return actions;
  }

  /**
   * Generate post-execution actions
   */
  private generatePostExecutionActions(suggestion: TerminalSuggestion, result: any): CursorAgentAction[] {
    const actions: CursorAgentAction[] = [];

    if (!result.success) {
      actions.push({
        type: 'analyze',
        description: 'Analyze failure and suggest alternatives',
        autoExecute: false
      });
    }

    actions.push({
      type: 'continue',
      description: 'Continue monitoring for more suggestions',
      autoExecute: true
    });

    return actions;
  }

  /**
   * Add message to queue
   */
  private addMessage(message: CursorAgentMessage): void {
    this.messageQueue.push(message);
    
    // Limit queue size
    if (this.messageQueue.length > this.config.maxMessages) {
      this.messageQueue.shift();
    }

    // Send immediately for high priority messages
    if (message.metadata.priority === 'critical') {
      this.sendFeedbackToCursor();
    }
  }

  /**
   * Send feedback to Cursor via inbox files
   */
  private sendFeedbackToCursor(): void {
    if (this.messageQueue.length === 0) return;

    const messages = this.messageQueue.splice(0, 5); // Send up to 5 messages at a time
    
    for (const message of messages) {
      this.writeMessageToInbox(message);
    }

    console.log(chalk.blue(`📤 Sent ${messages.length} messages to Cursor`));
  }

  /**
   * Write message to Cursor inbox
   */
  private writeMessageToInbox(message: CursorAgentMessage): void {
    const filename = `iteragent_${message.id}.md`;
    const filepath = join(this.config.inboxPath, filename);
    
    const content = this.formatMessageForCursor(message);
    
    try {
      writeFileSync(filepath, content);
      console.log(chalk.green(`📝 Written message to ${filename}`));
    } catch (error) {
      console.log(chalk.red(`❌ Failed to write message: ${error}`));
    }
  }

  /**
   * Format message for Cursor consumption
   */
  private formatMessageForCursor(message: CursorAgentMessage): string {
    return `# IterAgent Terminal Feedback

${message.content}

---

## Metadata
- **ID:** ${message.id}
- **Type:** ${message.type}
- **Priority:** ${message.metadata.priority}
- **Confidence:** ${message.metadata.confidence}
- **Source:** ${message.metadata.source}
- **Timestamp:** ${message.metadata.timestamp.toISOString()}

## Available Actions
${message.actions.map(action => `- **${action.type.toUpperCase()}**: ${action.description}${action.autoExecute ? ' (AUTO)' : ''}`).join('\n')}

## Control Commands
- iteragent allowlist add <item> - Add item to allowlist
- iteragent blocklist add <item> - Add item to blocklist
- iteragent stop - Stop terminal feedback
- iteragent start - Start terminal feedback
- iteragent config <setting> <value> - Update configuration

---
*Generated by IterAgent Terminal Feedback System*
`;
  }

  /**
   * Handle Cursor agent commands
   */
  handleCursorCommand(command: string, args: string[]): boolean {
    switch (command) {
      case 'allowlist':
        return this.handleAllowlistCommand(args);
      case 'blocklist':
        return this.handleBlocklistCommand(args);
      case 'stop':
        return this.handleStopCommand();
      case 'start':
        return this.handleStartCommand();
      case 'config':
        return this.handleConfigCommand(args);
      case 'suggestions':
        return this.handleSuggestionsCommand(args);
      case 'execute':
        return this.handleExecuteCommand(args);
      default:
        return false;
    }
  }

  /**
   * Handle allowlist commands
   */
  private handleAllowlistCommand(args: string[]): boolean {
    if (args.length < 2) {
      console.log(chalk.red('Usage: iteragent allowlist <add|remove> <item>'));
      return false;
    }

    const [action, item] = args;
    
    if (action === 'add') {
      this.terminalFeedback.addToAllowlist(item);
      return true;
    } else if (action === 'remove') {
      this.terminalFeedback.removeFromAllowlist(item);
      return true;
    }
    
    return false;
  }

  /**
   * Handle blocklist commands
   */
  private handleBlocklistCommand(args: string[]): boolean {
    if (args.length < 2) {
      console.log(chalk.red('Usage: iteragent blocklist <add|remove> <item>'));
      return false;
    }

    const [action, item] = args;
    
    if (action === 'add') {
      this.terminalFeedback.addToBlocklist(item);
      return true;
    } else if (action === 'remove') {
      this.terminalFeedback.removeFromBlocklist(item);
      return true;
    }
    
    return false;
  }

  /**
   * Handle stop command
   */
  private handleStopCommand(): boolean {
    this.stop();
    console.log(chalk.yellow('⏹️ Terminal feedback stopped'));
    return true;
  }

  /**
   * Handle start command
   */
  private handleStartCommand(): boolean {
    this.startFeedbackLoop();
    console.log(chalk.green('▶️ Terminal feedback started'));
    return true;
  }

  /**
   * Handle config command
   */
  private handleConfigCommand(args: string[]): boolean {
    if (args.length < 2) {
      console.log(chalk.red('Usage: iteragent config <setting> <value>'));
      return false;
    }

    const [setting, value] = args;
    const configUpdate: any = {};
    
    try {
      configUpdate[setting] = JSON.parse(value);
      this.terminalFeedback.updateConfig(configUpdate);
      return true;
    } catch {
      console.log(chalk.red('Invalid config value'));
      return false;
    }
  }

  /**
   * Handle suggestions command
   */
  private handleSuggestionsCommand(args: string[]): boolean {
    const suggestions = this.terminalFeedback.getSuggestions();
    
    if (args.length > 0 && args[0] === 'clear') {
      this.terminalFeedback.clearSuggestions();
      return true;
    }
    
    console.log(chalk.blue(`📋 Current Suggestions (${suggestions.length}):`));
    suggestions.forEach(suggestion => {
      console.log(chalk.cyan(`  • ${suggestion.title} (${suggestion.type}, ${suggestion.priority})`));
    });
    
    return true;
  }

  /**
   * Handle execute command
   */
  private handleExecuteCommand(args: string[]): boolean {
    if (args.length === 0) {
      console.log(chalk.red('Usage: iteragent execute <suggestion-id>'));
      return false;
    }

    const suggestionId = args[0];
    this.terminalFeedback.executeSuggestion(suggestionId);
    return true;
  }

  /**
   * Get terminal feedback instance
   */
  getTerminalFeedback(): TerminalFeedback {
    return this.terminalFeedback;
  }

  /**
   * Get current configuration
   */
  getConfig(): CursorAgentConfig {
    return { ...this.config };
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<CursorAgentConfig>): void {
    this.config = { ...this.config, ...newConfig };
    console.log(chalk.blue('⚙️ Cursor Agent configuration updated'));
  }
}
