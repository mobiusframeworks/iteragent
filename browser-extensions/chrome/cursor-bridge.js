// InterTools Cursor Bridge - Enhanced Cursor integration
console.log('InterTools Cursor Bridge loaded');

// Cursor integration functionality
window.interToolsCursorBridge = {
  
  // Detect if we're in a development environment
  detectDevEnvironment() {
    const url = window.location;
    const isLocalhost = url.hostname === 'localhost' || url.hostname === '127.0.0.1';
    const devPorts = ['3000', '3001', '4000', '5000', '5173', '5174', '8000', '8080'];
    const isDev = isLocalhost || devPorts.includes(url.port);
    
    return {
      isLocalhost,
      isDevelopment: isDev,
      port: url.port,
      hostname: url.hostname,
      framework: this.detectFramework(),
      buildTool: this.detectBuildTool()
    };
  },
  
  // Detect the framework being used
  detectFramework() {
    const scripts = Array.from(document.querySelectorAll('script')).map(s => s.src).join(' ');
    const html = document.documentElement.outerHTML;
    
    if (scripts.includes('react') || html.includes('__REACT_DEVTOOLS_GLOBAL_HOOK__')) return 'React';
    if (scripts.includes('vue') || window.Vue) return 'Vue.js';
    if (scripts.includes('angular') || window.ng) return 'Angular';
    if (scripts.includes('svelte')) return 'Svelte';
    if (window.jQuery || window.$) return 'jQuery';
    
    return 'Vanilla JS';
  },
  
  // Detect build tool
  detectBuildTool() {
    const port = window.location.port;
    if (port === '5173' || port === '5174') return 'Vite';
    if (port === '3000') return 'Create React App / Next.js';
    if (port === '4000') return 'Gatsby';
    if (port === '8080') return 'Webpack Dev Server';
    if (port === '8000') return 'Django / FastAPI';
    
    return 'Unknown';
  },
  
  // Create enhanced Cursor prompt with development context
  createCursorPrompt(type, data) {
    const env = this.detectDevEnvironment();
    const timestamp = new Date().toLocaleString();
    
    let prompt = `🛠️ InterTools ${type} - ${timestamp}\n\n`;
    
    // Add environment context
    prompt += `**Environment Context:**\n`;
    prompt += `- URL: ${window.location.href}\n`;
    prompt += `- Page: ${document.title}\n`;
    prompt += `- Environment: ${env.isDevelopment ? 'Development' : 'Production'}\n`;
    if (env.isDevelopment) {
      prompt += `- Framework: ${env.framework}\n`;
      prompt += `- Build Tool: ${env.buildTool}\n`;
      prompt += `- Port: ${env.port}\n`;
    }
    prompt += `\n`;
    
    // Add specific data based on type
    switch (type) {
      case 'Element Extraction':
        prompt += this.formatElementData(data);
        break;
      case 'Page Analysis':
        prompt += this.formatPageAnalysis(data);
        break;
      case 'Project Connection':
        prompt += this.formatProjectConnection(data);
        break;
    }
    
    // Add suggested actions
    prompt += `\n**Suggested Actions:**\n`;
    if (env.isDevelopment) {
      prompt += `1. 🔧 Integrate this into your ${env.framework} project\n`;
      prompt += `2. 🎨 Convert styles to your CSS framework\n`;
      prompt += `3. 📱 Make responsive and accessible\n`;
      prompt += `4. ⚡ Optimize performance\n`;
    } else {
      prompt += `1. 📋 Extract and adapt for your project\n`;
      prompt += `2. 🎨 Analyze design patterns\n`;
      prompt += `3. 🔍 Reverse engineer functionality\n`;
      prompt += `4. 💡 Get implementation suggestions\n`;
    }
    
    prompt += `\n**How can I help you with this ${type.toLowerCase()}?**`;
    
    return prompt;
  },
  
  // Format element extraction data
  formatElementData(element) {
    return `**Element Details:**
- Tag: <${element.tagName.toLowerCase()}>
- ID: ${element.id || 'none'}
- Classes: ${element.className || 'none'}

**HTML Structure:**
\`\`\`html
${element.outerHTML}
\`\`\`

**Text Content:**
${element.textContent.substring(0, 300)}${element.textContent.length > 300 ? '...' : ''}

**Computed Styles:**
${this.getRelevantStyles(element)}

**Element Stats:**
- Children: ${element.children.length}
- Depth: ${this.getElementDepth(element)}
- Position: ${this.getElementPosition(element)}`;
  },
  
  // Format page analysis data
  formatPageAnalysis() {
    const stats = this.getPageStats();
    return `**Page Statistics:**
- Total Elements: ${stats.totalElements}
- Interactive Elements: ${stats.interactive}
- Forms: ${stats.forms}
- Images: ${stats.images}
- External Scripts: ${stats.scripts}
- Stylesheets: ${stats.stylesheets}

**Performance:**
${stats.performance}

**SEO Analysis:**
${stats.seo}

**Accessibility Check:**
${stats.accessibility}

**Technology Stack:**
${stats.technologies}`;
  },
  
  // Format project connection data
  formatProjectConnection() {
    const env = this.detectDevEnvironment();
    const repo = this.detectGitRepo();
    
    return `**Development Setup:**
${env.isDevelopment ? `
- Local development server detected
- Framework: ${env.framework}
- Build tool: ${env.buildTool}
- Port: ${env.port}
` : 'Production website - no local development detected'}

**Git Repository:**
${repo.detected ? `
- Repository: ${repo.name}
- Branch: ${repo.branch || 'unknown'}
- Remote: ${repo.remote || 'unknown'}
` : 'No git repository detected'}

**Available Integrations:**
1. 📋 Extract elements and components
2. 🎨 Copy and convert styles
3. 🔧 Analyze and debug code
4. 🚀 Performance optimization
5. 📱 Responsive design testing`;
  },
  
  // Get relevant CSS styles for an element
  getRelevantStyles(element) {
    const computed = window.getComputedStyle(element);
    const relevantProps = [
      'display', 'position', 'width', 'height', 'margin', 'padding',
      'background-color', 'color', 'font-family', 'font-size', 'border',
      'border-radius', 'box-shadow', 'transform'
    ];
    
    return relevantProps
      .map(prop => `${prop}: ${computed.getPropertyValue(prop)}`)
      .filter(style => !style.includes('none') && !style.includes('auto') && !style.includes('0px'))
      .slice(0, 8)
      .join('\n');
  },
  
  // Get element depth in DOM
  getElementDepth(element) {
    let depth = 0;
    let parent = element.parentElement;
    while (parent) {
      depth++;
      parent = parent.parentElement;
    }
    return depth;
  },
  
  // Get element position info
  getElementPosition(element) {
    const rect = element.getBoundingClientRect();
    return `x: ${Math.round(rect.left)}, y: ${Math.round(rect.top)}, w: ${Math.round(rect.width)}, h: ${Math.round(rect.height)}`;
  },
  
  // Get comprehensive page statistics
  getPageStats() {
    const all = document.querySelectorAll('*');
    const buttons = document.querySelectorAll('button, input[type="button"], input[type="submit"]');
    const forms = document.querySelectorAll('form');
    const images = document.querySelectorAll('img');
    const scripts = document.querySelectorAll('script[src]');
    const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
    
    return {
      totalElements: all.length,
      interactive: buttons.length,
      forms: forms.length,
      images: images.length,
      scripts: scripts.length,
      stylesheets: stylesheets.length,
      performance: this.getPerformanceInfo(),
      seo: this.getSEOInfo(),
      accessibility: this.getAccessibilityInfo(),
      technologies: this.getTechnologies()
    };
  },
  
  // Get performance information
  getPerformanceInfo() {
    if (!window.performance || !window.performance.timing) {
      return 'Performance data not available';
    }
    
    const timing = window.performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;
    const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
    
    return `Load time: ${loadTime}ms, DOM ready: ${domReady}ms`;
  },
  
  // Get SEO information
  getSEOInfo() {
    const title = document.title;
    const description = document.querySelector('meta[name="description"]')?.content || 'Missing';
    const h1Count = document.querySelectorAll('h1').length;
    const altMissing = document.querySelectorAll('img:not([alt])').length;
    
    return `Title: "${title}", Description: ${description.substring(0, 50)}..., H1s: ${h1Count}, Missing alt: ${altMissing}`;
  },
  
  // Get accessibility information
  getAccessibilityInfo() {
    const missingAlt = document.querySelectorAll('img:not([alt])').length;
    const missingLabels = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])').length;
    const headingStructure = document.querySelectorAll('h1, h2, h3, h4, h5, h6').length;
    
    return `Missing alt: ${missingAlt}, Missing labels: ${missingLabels}, Headings: ${headingStructure}`;
  },
  
  // Get detected technologies
  getTechnologies() {
    const techs = [];
    
    // Check for common libraries/frameworks
    if (window.React) techs.push('React');
    if (window.Vue) techs.push('Vue.js');
    if (window.angular) techs.push('Angular');
    if (window.jQuery) techs.push('jQuery');
    if (window.bootstrap) techs.push('Bootstrap');
    if (document.querySelector('link[href*="tailwind"]')) techs.push('Tailwind CSS');
    
    return techs.length > 0 ? techs.join(', ') : 'Vanilla JS/HTML/CSS';
  },
  
  // Try to detect git repository info
  detectGitRepo() {
    // This would require additional permissions to access file system
    // For now, return basic detection
    return {
      detected: false,
      name: 'Unknown',
      branch: 'Unknown',
      remote: 'Unknown'
    };
  },
  
  // Copy prompt to clipboard and show notification
  async copyToClipboard(prompt) {
    try {
      await navigator.clipboard.writeText(prompt);
      this.showNotification('✅ Copied to clipboard! Paste in Cursor chat.');
      return true;
    } catch (error) {
      console.error('Failed to copy to clipboard:', error);
      this.showNotification('❌ Failed to copy to clipboard');
      return false;
    }
  },
  
  // Show notification
  showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed;
      top: 20px;
      left: 50%;
      transform: translateX(-50%);
      background: #10b981;
      color: white;
      padding: 12px 24px;
      border-radius: 8px;
      z-index: 10003;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      max-width: 400px;
      text-align: center;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.remove();
    }, 3000);
  }
};

console.log('✅ InterTools Cursor Bridge ready');
