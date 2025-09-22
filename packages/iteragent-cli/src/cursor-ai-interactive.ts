import { promises as fs } from 'fs';
import path from 'path';
import chalk from 'chalk';
import { Summary } from './summarizer';

export interface CursorAICommand {
  id: string;
  type: 'fix' | 'analyze' | 'suggest' | 'execute' | 'continue';
  title: string;
  description: string;
  command: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  parameters?: Record<string, any>;
}

export interface CursorAIResponse {
  commandId: string;
  action: 'execute' | 'modify' | 'skip' | 'learn';
  modifiedCommand?: string;
  feedback?: string;
  timestamp: Date;
}

export class CursorAIInteractive {
  private cursorInboxPath: string;
  private commandsPath: string;
  private responsesPath: string;

  constructor(cursorInboxPath: string = '.cursor/inbox') {
    this.cursorInboxPath = cursorInboxPath;
    this.commandsPath = path.join(cursorInboxPath, 'commands');
    this.responsesPath = path.join(cursorInboxPath, 'responses');
  }

  /**
   * Create interactive error resolution commands for Cursor AI
   */
  async createErrorResolutionCommands(summary: Summary): Promise<CursorAICommand[]> {
    const commands: CursorAICommand[] = [];

    // Create commands for each error
    summary.logAnalysis.errors.forEach((error, index) => {
      commands.push({
        id: `error-${index}-${Date.now()}`,
        type: 'fix',
        title: `Fix Error: ${error.message.substring(0, 50)}...`,
        description: `Resolve error: ${error.message}`,
        command: this.generateFixCommand(error),
        priority: 'high',
        actionable: true,
        parameters: {
          error: error.message,
          timestamp: error.timestamp,
          category: error.category,
          context: (error as any).context || 'No context available'
        }
      });
    });

    // Create commands for warnings
    summary.logAnalysis.warnings.forEach((warning, index) => {
      commands.push({
        id: `warning-${index}-${Date.now()}`,
        type: 'analyze',
        title: `Analyze Warning: ${warning.message.substring(0, 50)}...`,
        description: `Investigate warning: ${warning.message}`,
        command: this.generateAnalysisCommand(warning),
        priority: 'medium',
        actionable: true,
        parameters: {
          warning: warning.message,
          timestamp: warning.timestamp,
          category: warning.category
        }
      });
    });

    // Create performance optimization commands
    if (summary.recommendations.length > 0) {
      summary.recommendations.forEach((rec, index) => {
        commands.push({
          id: `recommendation-${index}-${Date.now()}`,
          type: 'suggest',
          title: `Optimize: ${rec.substring(0, 50)}...`,
          description: `Apply optimization: ${rec}`,
          command: this.generateOptimizationCommand(rec),
          priority: 'medium',
          actionable: true,
          parameters: {
            recommendation: rec,
            type: 'performance'
          }
        });
      });
    }

    // Create continue command
    commands.push({
      id: `continue-${Date.now()}`,
      type: 'continue',
      title: 'Continue Development Loop',
      description: 'Proceed with the next iteration of the development loop',
      command: 'npx intertools@latest orchestrator --continue',
      priority: 'low',
      actionable: true
    });

    return commands;
  }

  /**
   * Send interactive commands to Cursor AI
   */
  async sendInteractiveCommands(summary: Summary): Promise<void> {
    try {
      // Ensure directories exist
      await fs.mkdir(this.cursorInboxPath, { recursive: true });
      await fs.mkdir(this.commandsPath, { recursive: true });
      await fs.mkdir(this.responsesPath, { recursive: true });

      // Create commands
      const commands = await this.createErrorResolutionCommands(summary);
      
      // Create main interactive file
      const interactiveFile = path.join(this.cursorInboxPath, 'intertools-interactive.md');
      const interactiveContent = this.generateInteractiveContent(summary, commands);
      
      await fs.writeFile(interactiveFile, interactiveContent);

      // Create individual command files
      for (const command of commands) {
        const commandFile = path.join(this.commandsPath, `${command.id}.md`);
        const commandContent = this.generateCommandContent(command);
        await fs.writeFile(commandFile, commandContent);
      }

      // Create response template
      const responseTemplate = path.join(this.responsesPath, 'response-template.md');
      const responseContent = this.generateResponseTemplate();
      await fs.writeFile(responseTemplate, responseContent);

      console.log(chalk.green('✅ Interactive commands sent to Cursor AI!'));
      console.log(chalk.blue(`📁 Commands: ${commands.length} available`));
      console.log(chalk.blue(`📝 Main file: ${interactiveFile}`));
      console.log(chalk.yellow('💡 Use the selection mechanism in Cursor AI chat to choose actions'));

    } catch (error) {
      console.error(chalk.red('❌ Error creating interactive commands:'), error);
      throw error;
    }
  }

  /**
   * Generate interactive content for Cursor AI
   */
  private generateInteractiveContent(summary: Summary, commands: CursorAICommand[]): string {
    const timestamp = new Date().toISOString();
    
    return `# 🤖 InterTools Interactive Error Resolution

**Generated:** ${timestamp}
**Status:** ${summary.serverHealth}
**Errors Found:** ${summary.logAnalysis.errors.length}
**Warnings Found:** ${summary.logAnalysis.warnings.length}

## 🎯 Available Actions

Select an action by typing the command ID in Cursor AI chat:

${commands.map(cmd => `
### ${cmd.type === 'fix' ? '🔧' : cmd.type === 'analyze' ? '🔍' : cmd.type === 'suggest' ? '💡' : '▶️'} ${cmd.title}

**Command ID:** \`${cmd.id}\`
**Priority:** ${cmd.priority.toUpperCase()}
**Description:** ${cmd.description}

**Command:**
\`\`\`bash
${cmd.command}
\`\`\`

**Parameters:**
\`\`\`json
${JSON.stringify(cmd.parameters, null, 2)}
\`\`\`

---
`).join('')}

## 🚀 Quick Actions

### Execute All High Priority Fixes
\`\`\`bash
# Execute all error fixes
for cmd in ${commands.filter(c => c.priority === 'high' && c.type === 'fix').map(c => c.id).join(' ')}; do
  echo "Executing command: $cmd"
  # Command will be provided by Cursor AI
done
\`\`\`

### Analyze All Warnings
\`\`\`bash
# Analyze all warnings
for cmd in ${commands.filter(c => c.type === 'analyze').map(c => c.id).join(' ')}; do
  echo "Analyzing: $cmd"
  # Analysis will be provided by Cursor AI
done
\`\`\`

## 📊 Summary

- **Total Commands:** ${commands.length}
- **High Priority:** ${commands.filter(c => c.priority === 'high').length}
- **Medium Priority:** ${commands.filter(c => c.priority === 'medium').length}
- **Low Priority:** ${commands.filter(c => c.priority === 'low').length}

## 🎮 How to Use

1. **Select a Command ID** from the list above
2. **Type in Cursor AI chat:** "Execute command: [COMMAND_ID]"
3. **Cursor AI will run the command** and provide results
4. **Review the results** and decide next steps
5. **Continue with the next command** or proceed with development

## 🔄 Response Format

When you execute a command, Cursor AI will respond with:

\`\`\`json
{
  "commandId": "command-id",
  "status": "success|error|partial",
  "result": "command output or result",
  "suggestions": ["additional suggestions"],
  "nextSteps": ["recommended next actions"]
}
\`\`\`

---
*Generated by InterTools Interactive System*
`;
  }

  /**
   * Generate individual command content
   */
  private generateCommandContent(command: CursorAICommand): string {
    return `# ${command.title}

**Command ID:** ${command.id}
**Type:** ${command.type}
**Priority:** ${command.priority}
**Actionable:** ${command.actionable}

## Description
${command.description}

## Command
\`\`\`bash
${command.command}
\`\`\`

## Parameters
\`\`\`json
${JSON.stringify(command.parameters, null, 2)}
\`\`\`

## Usage
To execute this command in Cursor AI chat, type:
\`\`\`
Execute command: ${command.id}
\`\`\`

## Expected Result
${this.getExpectedResult(command)}

---
*Generated by InterTools Command System*
`;
  }

  /**
   * Generate response template
   */
  private generateResponseTemplate(): string {
    return `# InterTools Response Template

## Command Execution Response

When executing InterTools commands, use this format:

\`\`\`json
{
  "commandId": "command-id-here",
  "status": "success|error|partial",
  "result": "detailed result or output",
  "suggestions": [
    "additional suggestions based on result"
  ],
  "nextSteps": [
    "recommended next actions"
  ],
  "timestamp": "2024-01-15T10:30:00.000Z"
}
\`\`\`

## Status Codes
- **success**: Command executed successfully
- **error**: Command failed with error
- **partial**: Command partially succeeded

## Response Guidelines
1. Always include the commandId
2. Provide detailed results
3. Include actionable suggestions
4. Suggest logical next steps
5. Include timestamp for tracking

---
*InterTools Response Template*
`;
  }

  /**
   * Generate fix command based on error
   */
  private generateFixCommand(error: any): string {
    const errorType = this.detectErrorType(error.message);
    
    switch (errorType) {
      case 'syntax':
        return `# Fix syntax error
# Analyze the code for syntax issues
# Check for missing semicolons, brackets, or quotes
# Review TypeScript/JavaScript syntax rules`;
        
      case 'import':
        return `# Fix import error
# Check if the module exists
# Verify import path is correct
# Install missing dependencies if needed
npm install [missing-package]`;
        
      case 'type':
        return `# Fix TypeScript type error
# Check type definitions
# Add proper type annotations
# Fix type mismatches`;
        
      case 'runtime':
        return `# Fix runtime error
# Check for null/undefined values
# Add proper error handling
# Review variable scope and initialization`;
        
      default:
        return `# Fix error: ${error.message}
# Analyze the error context
# Check related code
# Apply appropriate fix`;
    }
  }

  /**
   * Generate analysis command based on warning
   */
  private generateAnalysisCommand(warning: any): string {
    return `# Analyze warning: ${warning.message}
# Investigate the warning source
# Check if it's a false positive
# Determine if action is needed
# Document findings`;
  }

  /**
   * Generate optimization command based on recommendation
   */
  private generateOptimizationCommand(recommendation: string): string {
    return `# Apply optimization: ${recommendation}
# Review current implementation
# Apply the suggested optimization
# Test the changes
# Measure performance improvement`;
  }

  /**
   * Detect error type from error message
   */
  private detectErrorType(message: string): string {
    const lowerMessage = message.toLowerCase();
    
    if (lowerMessage.includes('syntax') || lowerMessage.includes('unexpected token')) {
      return 'syntax';
    }
    if (lowerMessage.includes('import') || lowerMessage.includes('module not found')) {
      return 'import';
    }
    if (lowerMessage.includes('type') || lowerMessage.includes('typescript')) {
      return 'type';
    }
    if (lowerMessage.includes('runtime') || lowerMessage.includes('undefined') || lowerMessage.includes('null')) {
      return 'runtime';
    }
    
    return 'general';
  }

  /**
   * Get expected result for command
   */
  private getExpectedResult(command: CursorAICommand): string {
    switch (command.type) {
      case 'fix':
        return 'Error should be resolved and code should compile/run without issues';
      case 'analyze':
        return 'Detailed analysis of the warning with recommendations';
      case 'suggest':
        return 'Optimization applied with performance improvements';
      case 'execute':
        return 'Command executed successfully with output';
      case 'continue':
        return 'Development loop continues to next iteration';
      default:
        return 'Command executed with appropriate result';
    }
  }

  /**
   * Process response from Cursor AI
   */
  async processResponse(response: CursorAIResponse): Promise<void> {
    try {
      const responseFile = path.join(this.responsesPath, `response-${response.commandId}-${Date.now()}.json`);
      await fs.writeFile(responseFile, JSON.stringify(response, null, 2));
      
      console.log(chalk.green(`✅ Response processed: ${response.commandId}`));
      
      // Handle different response actions
      switch (response.action) {
        case 'execute':
          console.log(chalk.blue('🚀 Command executed successfully'));
          break;
        case 'modify':
          console.log(chalk.yellow('🔧 Command modified and executed'));
          break;
        case 'skip':
          console.log(chalk.gray('⏭️ Command skipped'));
          break;
        case 'learn':
          console.log(chalk.cyan('🧠 Learning from response for future improvements'));
          break;
      }
      
    } catch (error) {
      console.error(chalk.red('❌ Error processing response:'), error);
      throw error;
    }
  }
}
