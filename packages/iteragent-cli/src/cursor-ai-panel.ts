import { EventEmitter } from 'events';
import chalk from 'chalk';
import { CursorAIFunction, CursorAIConfig, SpeedOptimizationSuggestion } from './cursor-ai-executor';

export interface FunctionPanelConfig {
  position: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  width: number;
  height: number;
  autoHide: boolean;
  hideDelay: number;
  theme: 'light' | 'dark';
  showCategories: boolean;
  showStatistics: boolean;
}

export interface FunctionPanelState {
  isVisible: boolean;
  selectedCategory: string | null;
  searchQuery: string;
  sortBy: 'name' | 'category' | 'riskLevel' | 'successRate' | 'executionCount';
  sortOrder: 'asc' | 'desc';
}

export class CursorAIFunctionPanel extends EventEmitter {
  private config: FunctionPanelConfig;
  private state: FunctionPanelState;
  private functions: CursorAIFunction[] = [];
  private speedSuggestions: SpeedOptimizationSuggestion[] = [];
  private isActive: boolean = false;
  private hideTimeout: NodeJS.Timeout | null = null;

  constructor(config: Partial<FunctionPanelConfig> = {}) {
    super();
    this.config = {
      position: 'top-right',
      width: 400,
      height: 600,
      autoHide: true,
      hideDelay: 5000,
      theme: 'dark',
      showCategories: true,
      showStatistics: true,
      ...config
    };
    
    this.state = {
      isVisible: false,
      selectedCategory: null,
      searchQuery: '',
      sortBy: 'name',
      sortOrder: 'asc'
    };
  }

  /**
   * Show the function panel
   */
  show(): void {
    this.state.isVisible = true;
    this.clearHideTimeout();
    this.render();
    this.emit('panelShown');
  }

  /**
   * Hide the function panel
   */
  hide(): void {
    this.state.isVisible = false;
    this.clearHideTimeout();
    this.render();
    this.emit('panelHidden');
  }

  /**
   * Toggle the function panel visibility
   */
  toggle(): void {
    if (this.state.isVisible) {
      this.hide();
    } else {
      this.show();
    }
  }

  /**
   * Auto-hide the panel after delay
   */
  private scheduleAutoHide(): void {
    if (!this.config.autoHide) return;
    
    this.clearHideTimeout();
    this.hideTimeout = setTimeout(() => {
      this.hide();
    }, this.config.hideDelay);
  }

  /**
   * Clear auto-hide timeout
   */
  private clearHideTimeout(): void {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
  }

  /**
   * Update functions list
   */
  updateFunctions(functions: CursorAIFunction[]): void {
    this.functions = functions;
    if (this.state.isVisible) {
      this.render();
    }
  }

  /**
   * Update speed suggestions
   */
  updateSpeedSuggestions(suggestions: SpeedOptimizationSuggestion[]): void {
    this.speedSuggestions = suggestions;
    if (this.state.isVisible) {
      this.render();
    }
  }

  /**
   * Set search query
   */
  setSearchQuery(query: string): void {
    this.state.searchQuery = query;
    if (this.state.isVisible) {
      this.render();
    }
  }

  /**
   * Set selected category
   */
  setSelectedCategory(category: string | null): void {
    this.state.selectedCategory = category;
    if (this.state.isVisible) {
      this.render();
    }
  }

  /**
   * Set sort options
   */
  setSort(sortBy: FunctionPanelState['sortBy'], sortOrder: FunctionPanelState['sortOrder']): void {
    this.state.sortBy = sortBy;
    this.state.sortOrder = sortOrder;
    if (this.state.isVisible) {
      this.render();
    }
  }

  /**
   * Render the function panel
   */
  private render(): void {
    if (!this.state.isVisible) {
      console.clear();
      return;
    }

    console.clear();
    this.renderHeader();
    this.renderSearch();
    this.renderCategories();
    this.renderFunctions();
    this.renderSpeedSuggestions();
    this.renderFooter();
    
    // Schedule auto-hide
    this.scheduleAutoHide();
  }

  /**
   * Render panel header
   */
  private renderHeader(): void {
    const title = '🚀 Cursor AI Function Panel';
    const subtitle = `Position: ${this.config.position} | Theme: ${this.config.theme}`;
    
    console.log(chalk.blue.bold(title));
    console.log(chalk.gray(subtitle));
    console.log(chalk.gray('─'.repeat(50)));
  }

  /**
   * Render search bar
   */
  private renderSearch(): void {
    console.log(chalk.yellow('🔍 Search Functions:'));
    console.log(chalk.gray(`Query: "${this.state.searchQuery || 'All functions'}"`));
    console.log(chalk.gray('─'.repeat(30)));
  }

  /**
   * Render category filter
   */
  private renderCategories(): void {
    if (!this.config.showCategories) return;

    const categories = [...new Set(this.functions.map(f => f.category))];
    
    console.log(chalk.cyan('📁 Categories:'));
    categories.forEach(category => {
      const count = this.functions.filter(f => f.category === category).length;
      const isSelected = this.state.selectedCategory === category;
      const prefix = isSelected ? '►' : ' ';
      const color = isSelected ? chalk.green.bold : chalk.gray;
      
      console.log(color(`${prefix} ${category} (${count})`));
    });
    console.log(chalk.gray('─'.repeat(30)));
  }

  /**
   * Render functions list
   */
  private renderFunctions(): void {
    let filteredFunctions = this.functions;

    // Apply search filter
    if (this.state.searchQuery) {
      const query = this.state.searchQuery.toLowerCase();
      filteredFunctions = filteredFunctions.filter(f => 
        f.name.toLowerCase().includes(query) ||
        f.description.toLowerCase().includes(query) ||
        f.category.toLowerCase().includes(query)
      );
    }

    // Apply category filter
    if (this.state.selectedCategory) {
      filteredFunctions = filteredFunctions.filter(f => f.category === this.state.selectedCategory);
    }

    // Apply sorting
    filteredFunctions.sort((a, b) => {
      let aValue: any, bValue: any;
      
      switch (this.state.sortBy) {
        case 'name':
          aValue = a.name;
          bValue = b.name;
          break;
        case 'category':
          aValue = a.category;
          bValue = b.category;
          break;
        case 'riskLevel':
          const riskOrder = { 'low': 1, 'medium': 2, 'high': 3, 'critical': 4 };
          aValue = riskOrder[a.riskLevel];
          bValue = riskOrder[b.riskLevel];
          break;
        case 'successRate':
          aValue = a.successRate;
          bValue = b.successRate;
          break;
        case 'executionCount':
          aValue = a.executionCount;
          bValue = b.executionCount;
          break;
        default:
          aValue = a.name;
          bValue = b.name;
      }

      if (this.state.sortOrder === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    console.log(chalk.magenta(`📋 Functions (${filteredFunctions.length}):`));
    
    filteredFunctions.forEach((func, index) => {
      this.renderFunction(func, index);
    });
  }

  /**
   * Render individual function
   */
  private renderFunction(func: CursorAIFunction, index: number): void {
    const riskColors = {
      'low': chalk.green,
      'medium': chalk.yellow,
      'high': chalk.red,
      'critical': chalk.red.bold
    };

    const riskColor = riskColors[func.riskLevel];
    const successColor = func.successRate > 90 ? chalk.green : func.successRate > 70 ? chalk.yellow : chalk.red;

    console.log(chalk.gray(`${index + 1}.`), chalk.white.bold(func.name));
    console.log(chalk.gray(`   ${func.description}`));
    console.log(chalk.gray(`   Category: ${func.category}`));
    console.log(riskColor(`   Risk: ${func.riskLevel}`));
    console.log(successColor(`   Success Rate: ${func.successRate.toFixed(1)}%`));
    console.log(chalk.gray(`   Executions: ${func.executionCount}`));
    
    if (func.lastExecuted) {
      console.log(chalk.gray(`   Last Executed: ${func.lastExecuted.toLocaleString()}`));
    }
    
    console.log(chalk.gray(`   Command: ${func.command}`));
    console.log(chalk.gray('─'.repeat(40)));
  }

  /**
   * Render speed optimization suggestions
   */
  private renderSpeedSuggestions(): void {
    if (this.speedSuggestions.length === 0) return;

    console.log(chalk.cyan('⚡ Speed Optimization Suggestions:'));
    
    this.speedSuggestions.forEach((suggestion, index) => {
      const impactColors = {
        'low': chalk.green,
        'medium': chalk.yellow,
        'high': chalk.red
      };

      const impactColor = impactColors[suggestion.impact];
      
      console.log(chalk.gray(`${index + 1}.`), chalk.white.bold(suggestion.title));
      console.log(chalk.gray(`   ${suggestion.description}`));
      console.log(impactColor(`   Impact: ${suggestion.impact}`));
      console.log(chalk.gray(`   Effort: ${suggestion.effort}`));
      console.log(chalk.green(`   Estimated Improvement: ${suggestion.estimatedImprovement}%`));
      console.log(chalk.gray(`   ${suggestion.reasoning}`));
      
      if (suggestion.command) {
        console.log(chalk.blue(`   Command: ${suggestion.command}`));
      }
      
      console.log(chalk.gray('─'.repeat(40)));
    });
  }

  /**
   * Render panel footer
   */
  private renderFooter(): void {
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.gray('Controls:'));
    console.log(chalk.gray('  [TAB] - Toggle panel'));
    console.log(chalk.gray('  [ESC] - Hide panel'));
    console.log(chalk.gray('  [S] - Search functions'));
    console.log(chalk.gray('  [C] - Filter by category'));
    console.log(chalk.gray('  [R] - Sort by risk level'));
    console.log(chalk.gray('  [E] - Sort by execution count'));
    console.log(chalk.gray('  [A] - Add to allowlist'));
    console.log(chalk.gray('  [B] - Add to blocklist'));
    console.log(chalk.gray('  [O] - Speed optimization'));
  }

  /**
   * Handle keyboard input
   */
  handleKeyInput(key: string): void {
    switch (key.toLowerCase()) {
      case 'tab':
        this.toggle();
        break;
      case 'escape':
        this.hide();
        break;
      case 's':
        this.promptSearch();
        break;
      case 'c':
        this.promptCategory();
        break;
      case 'r':
        this.setSort('riskLevel', this.state.sortOrder === 'asc' ? 'desc' : 'asc');
        break;
      case 'e':
        this.setSort('executionCount', this.state.sortOrder === 'asc' ? 'desc' : 'asc');
        break;
      case 'a':
        this.promptAddToAllowlist();
        break;
      case 'b':
        this.promptAddToBlocklist();
        break;
      case 'o':
        this.showSpeedOptimization();
        break;
    }
  }

  /**
   * Prompt for search query
   */
  private promptSearch(): void {
    // In a real implementation, this would use a proper input method
    console.log(chalk.yellow('Enter search query:'));
    // For now, we'll simulate with a simple prompt
    this.emit('promptSearch');
  }

  /**
   * Prompt for category selection
   */
  private promptCategory(): void {
    const categories = [...new Set(this.functions.map(f => f.category))];
    console.log(chalk.yellow('Select category:'));
    categories.forEach((category, index) => {
      console.log(chalk.gray(`${index + 1}. ${category}`));
    });
    this.emit('promptCategory', categories);
  }

  /**
   * Prompt to add function to allowlist
   */
  private promptAddToAllowlist(): void {
    console.log(chalk.yellow('Select function to add to allowlist:'));
    this.functions.forEach((func, index) => {
      console.log(chalk.gray(`${index + 1}. ${func.name}`));
    });
    this.emit('promptAddToAllowlist', this.functions);
  }

  /**
   * Prompt to add function to blocklist
   */
  private promptAddToBlocklist(): void {
    console.log(chalk.yellow('Select function to add to blocklist:'));
    this.functions.forEach((func, index) => {
      console.log(chalk.gray(`${index + 1}. ${func.name}`));
    });
    this.emit('promptAddToBlocklist', this.functions);
  }

  /**
   * Show speed optimization panel
   */
  private showSpeedOptimization(): void {
    console.log(chalk.cyan('⚡ Speed Optimization Panel'));
    console.log(chalk.gray('─'.repeat(50)));
    
    if (this.speedSuggestions.length === 0) {
      console.log(chalk.yellow('No speed optimization suggestions available.'));
      console.log(chalk.gray('Run performance monitoring to generate suggestions.'));
    } else {
      this.renderSpeedSuggestions();
    }
    
    console.log(chalk.gray('─'.repeat(50)));
    console.log(chalk.gray('Press [ESC] to return to main panel'));
  }

  /**
   * Get panel state
   */
  getState(): FunctionPanelState {
    return { ...this.state };
  }

  /**
   * Get panel configuration
   */
  getConfig(): FunctionPanelConfig {
    return { ...this.config };
  }

  /**
   * Update panel configuration
   */
  updateConfig(newConfig: Partial<FunctionPanelConfig>): void {
    this.config = { ...this.config, ...newConfig };
    if (this.state.isVisible) {
      this.render();
    }
  }

  /**
   * Check if panel is visible
   */
  isVisible(): boolean {
    return this.state.isVisible;
  }

  /**
   * Activate the panel
   */
  activate(): void {
    this.isActive = true;
    this.emit('panelActivated');
  }

  /**
   * Deactivate the panel
   */
  deactivate(): void {
    this.isActive = false;
    this.hide();
    this.emit('panelDeactivated');
  }
}
