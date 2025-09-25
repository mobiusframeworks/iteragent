// 🚀 InterTools FREE - Complete Console Log to IDE Bridge
// Version: 2.0.0 | License: MIT | 100% Free & Open Source
// Repository: https://github.com/your-repo/intertools
// 
// WHAT IT DOES:
// - Captures all console logs (log, error, warn, info) from any website
// - Monitors JavaScript errors and unhandled promise rejections  
// - Creates professional IDE-ready reports with AI analysis suggestions
// - Provides floating UI for easy access and log management
// - Formats everything perfectly for Cursor, VS Code, and other IDEs
//
// USAGE:
// 1. Copy this entire script
// 2. Open any website in your browser
// 3. Press F12 to open Developer Tools
// 4. Go to Console tab
// 5. Paste this script and press Enter
// 6. Look for the 🛠️ floating button
// 7. Click it to analyze logs and copy IDE reports
//
// NO LIMITS - NO SUBSCRIPTIONS - COMPLETELY FREE!

(function() {
  'use strict';
  
  // Prevent multiple injections
  if (window.interToolsActive) {
    console.log('🛠️ InterTools already active on this page!');
    return;
  }
  
  console.log('🚀 InterTools FREE Loading - Console Log Capture System');
  window.interToolsActive = true;
  window.interToolsVersion = '2.0.0-free';
  
  // ==========================================
  // CONSOLE LOG CAPTURE SYSTEM
  // ==========================================
  
  const logBuffer = [];
  const maxLogs = 100; // Keep last 100 logs in memory
  
  // Store original console methods
  const originalConsole = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info,
    debug: console.debug
  };
  
  // Log entry structure
  function createLogEntry(type, args, stack) {
    return {
      id: Date.now() + Math.random(),
      type: type,
      message: Array.from(args).map(arg => {
        if (typeof arg === 'object') {
          try {
            return JSON.stringify(arg, null, 2);
          } catch (e) {
            return String(arg);
          }
        }
        return String(arg);
      }).join(' '),
      timestamp: new Date().toISOString(),
      url: window.location.href,
      stack: stack,
      userAgent: navigator.userAgent
    };
  }
  
  // Capture function
  function captureLog(type, args, stack) {
    const entry = createLogEntry(type, args, stack);
    logBuffer.push(entry);
    
    // Maintain buffer size
    if (logBuffer.length > maxLogs) {
      logBuffer.shift();
    }
    
    // Update UI if panel is open
    updateLogCounts();
  }
  
  // Override console methods
  console.log = function(...args) {
    captureLog('log', args, new Error().stack);
    originalConsole.log.apply(console, args);
  };
  
  console.error = function(...args) {
    captureLog('error', args, new Error().stack);
    originalConsole.error.apply(console, args);
  };
  
  console.warn = function(...args) {
    captureLog('warn', args, new Error().stack);
    originalConsole.warn.apply(console, args);
  };
  
  console.info = function(...args) {
    captureLog('info', args, new Error().stack);
    originalConsole.info.apply(console, args);
  };
  
  console.debug = function(...args) {
    captureLog('debug', args, new Error().stack);
    originalConsole.debug.apply(console, args);
  };
  
  // ==========================================
  // ERROR MONITORING
  // ==========================================
  
  // Global error handler
  window.addEventListener('error', (event) => {
    captureLog('error', [
      `Global Error: ${event.message}`,
      `File: ${event.filename}:${event.lineno}:${event.colno}`
    ], event.error?.stack || 'No stack trace available');
  });
  
  // Unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    captureLog('error', [
      'Unhandled Promise Rejection:',
      event.reason
    ], event.reason?.stack || 'Promise rejection - no stack trace');
  });
  
  // ==========================================
  // USER INTERFACE
  // ==========================================
  
  function createFloatingButton() {
    const button = document.createElement('div');
    button.id = 'intertools-button';
    button.innerHTML = '🛠️';
    button.title = 'InterTools - Click to analyze console logs and generate IDE reports';
    
    button.style.cssText = `
      position: fixed;
      top: 20px;
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
      z-index: 10000;
      color: white;
      box-shadow: 0 4px 20px rgba(102, 126, 234, 0.4);
      transition: all 0.3s ease;
      border: 3px solid white;
      font-weight: bold;
      user-select: none;
    `;
    
    // Hover effects
    button.addEventListener('mouseenter', () => {
      button.style.transform = 'scale(1.1)';
      button.style.boxShadow = '0 6px 30px rgba(102, 126, 234, 0.6)';
    });
    
    button.addEventListener('mouseleave', () => {
      button.style.transform = 'scale(1)';
      button.style.boxShadow = '0 4px 20px rgba(102, 126, 234, 0.4)';
    });
    
    // Click handler
    button.addEventListener('click', toggleAnalysisPanel);
    
    document.body.appendChild(button);
    return button;
  }
  
  function toggleAnalysisPanel() {
    const existing = document.getElementById('intertools-panel');
    if (existing) {
      existing.remove();
      return;
    }
    
    createAnalysisPanel();
  }
  
  function createAnalysisPanel() {
    const panel = document.createElement('div');
    panel.id = 'intertools-panel';
    
    panel.style.cssText = `
      position: fixed;
      top: 90px;
      right: 20px;
      width: 400px;
      max-width: calc(100vw - 40px);
      background: white;
      border-radius: 16px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      z-index: 10001;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
      border: 2px solid #667eea;
      overflow: hidden;
    `;
    
    const logCount = logBuffer.length;
    const errorCount = logBuffer.filter(log => log.type === 'error').length;
    const warnCount = logBuffer.filter(log => log.type === 'warn').length;
    const infoCount = logBuffer.filter(log => log.type === 'log' || log.type === 'info').length;
    
    panel.innerHTML = `
      <div style="padding: 20px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="margin: 0 0 8px 0; font-size: 18px;">🛠️ InterTools Console Capture</h3>
            <div style="font-size: 14px; opacity: 0.9;" id="log-counts">
              ${logCount} logs • ${errorCount} errors • ${warnCount} warnings
            </div>
          </div>
          <button onclick="document.getElementById('intertools-panel').remove()" style="
            background: rgba(255,255,255,0.2); border: none; color: white; 
            width: 30px; height: 30px; border-radius: 50%; cursor: pointer;
            display: flex; align-items: center; justify-content: center;
          ">×</button>
        </div>
      </div>
      
      <div style="padding: 20px;">
        <div style="margin-bottom: 15px;">
          <strong style="color: #1e293b;">📊 Current Page:</strong><br>
          <div style="font-size: 12px; color: #64748b; word-break: break-all; margin-top: 4px;">
            ${document.title}<br>
            <span style="font-family: monospace;">${window.location.href}</span>
          </div>
        </div>
        
        <div style="display: grid; gap: 10px; margin-bottom: 20px;">
          <button onclick="generateCompleteIDEReport()" style="
            width: 100%; padding: 12px; 
            background: linear-gradient(135deg, #10b981 0%, #059669 100%);
            color: white; border: none; border-radius: 8px; cursor: pointer; 
            font-weight: 600; transition: all 0.2s ease; font-size: 14px;
          ">📋 Copy Complete IDE Report</button>
          
          <button onclick="generateQuickAnalysis()" style="
            width: 100%; padding: 12px; background: #f1f5f9; color: #334155;
            border: 1px solid #e2e8f0; border-radius: 8px; cursor: pointer; 
            font-weight: 600; transition: all 0.2s ease; font-size: 14px;
          ">⚡ Quick Analysis</button>
          
          <button onclick="viewLogDetails()" style="
            width: 100%; padding: 12px; background: #fef3c7; color: #92400e;
            border: 1px solid #fed7aa; border-radius: 8px; cursor: pointer; 
            font-weight: 600; transition: all 0.2s ease; font-size: 14px;
          ">🔍 View Log Details</button>
          
          <button onclick="clearAllLogs()" style="
            width: 100%; padding: 12px; background: #fef2f2; color: #dc2626;
            border: 1px solid #fecaca; border-radius: 8px; cursor: pointer; 
            font-weight: 600; transition: all 0.2s ease; font-size: 14px;
          ">🗑️ Clear All Logs</button>
        </div>
        
        <div style="background: #f8fafc; padding: 15px; border-radius: 8px; font-size: 12px; line-height: 1.5;">
          <div style="font-weight: 600; color: #1e293b; margin-bottom: 8px;">💡 How to Use:</div>
          <div style="color: #64748b;">
            1. <strong>Copy Complete IDE Report</strong> - Get formatted analysis for Cursor/VS Code<br>
            2. <strong>Quick Analysis</strong> - Get summary for fast insights<br>
            3. <strong>View Details</strong> - See all captured logs<br>
            4. InterTools automatically captures console activity in the background
          </div>
        </div>
        
        <div style="margin-top: 15px; text-align: center; font-size: 11px; color: #64748b;">
          InterTools FREE v2.0.0 • 100% Open Source • No Limits
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
  }
  
  // ==========================================
  // ANALYSIS & REPORTING
  // ==========================================
  
  window.generateCompleteIDEReport = function() {
    const now = new Date();
    const timeString = now.toLocaleString();
    const recentLogs = logBuffer.slice(-25); // Last 25 logs
    const errors = logBuffer.filter(l => l.type === 'error');
    const warnings = logBuffer.filter(l => l.type === 'warn');
    
    // Detect environment
    const isLocalhost = window.location.hostname === 'localhost' || 
                       window.location.hostname === '127.0.0.1' || 
                       window.location.hostname.includes('.local');
    const isDevelopment = isLocalhost || ['3000', '3001', '4000', '5000', '5173', '5174', '8000', '8080'].includes(window.location.port);
    
    // Detect framework/technology
    const techStack = detectTechStack();
    
    const report = `🛠️ InterTools Console Log Analysis Report

📊 Generated: ${timeString}
📄 Page: ${document.title}
🔗 URL: ${window.location.href}
🖥️ Environment: ${isDevelopment ? 'Development' : 'Production'}
🏗️ Tech Stack: ${techStack}

═══════════════════════════════════════════════════════════

📈 SUMMARY STATISTICS:
• Total Console Messages: ${logBuffer.length}
• Errors: ${errors.length}
• Warnings: ${warnings.length}
• Info/Debug Messages: ${logBuffer.filter(l => ['log', 'info', 'debug'].includes(l.type)).length}
• Capture Duration: ${logBuffer.length > 0 ? 'Started ' + formatTimeAgo(logBuffer[0].timestamp) : 'Just started'}

═══════════════════════════════════════════════════════════

🔍 RECENT CONSOLE ACTIVITY (Last 25):
${recentLogs.length > 0 ? recentLogs.map((log, index) => {
  const time = new Date(log.timestamp).toLocaleTimeString();
  const truncatedMessage = log.message.length > 80 ? log.message.substring(0, 80) + '...' : log.message;
  return `${String(index + 1).padStart(2, ' ')}. [${log.type.toUpperCase()}] ${time} - ${truncatedMessage}`;
}).join('\n') : 'No console activity detected yet'}

${errors.length > 0 ? `
═══════════════════════════════════════════════════════════

❌ ERROR ANALYSIS (${errors.length} errors found):
${errors.slice(-10).map((error, index) => `
${index + 1}. ${error.message}
   Time: ${new Date(error.timestamp).toLocaleTimeString()}
   Stack: ${error.stack ? error.stack.split('\n')[1]?.trim() || 'No stack trace' : 'No stack trace'}
`).join('')}` : `
═══════════════════════════════════════════════════════════

✅ ERROR STATUS: No JavaScript errors detected - Great job!`}

${warnings.length > 0 ? `
═══════════════════════════════════════════════════════════

⚠️ WARNING ANALYSIS (${warnings.length} warnings found):
${warnings.slice(-5).map((warn, index) => `
${index + 1}. ${warn.message}
   Time: ${new Date(warn.timestamp).toLocaleTimeString()}
`).join('')}` : ''}

═══════════════════════════════════════════════════════════

🤖 AI ANALYSIS & RECOMMENDATIONS:

${generateAIAnalysis(logBuffer, errors, warnings, isDevelopment)}

═══════════════════════════════════════════════════════════

🎯 RECOMMENDED ACTIONS:

${generateRecommendations(logBuffer, errors, warnings, isDevelopment)}

═══════════════════════════════════════════════════════════

📋 TECHNICAL DETAILS:
• Browser: ${navigator.userAgent.split(')')[0]})
• Viewport: ${window.innerWidth}x${window.innerHeight}
• Memory Usage: ${navigator.deviceMemory ? navigator.deviceMemory + 'GB' : 'Unknown'}
• Connection: ${navigator.connection ? navigator.connection.effectiveType : 'Unknown'}
• Timestamp: ${now.toISOString()}

═══════════════════════════════════════════════════════════

Generated by InterTools FREE v2.0.0
🌟 100% Open Source Console Log to IDE Bridge
📁 Repository: https://github.com/your-repo/intertools

💡 USAGE TIP: Paste this entire report into Cursor, VS Code, or any IDE chat 
for instant AI analysis and development suggestions!`;

    // Copy to clipboard
    navigator.clipboard.writeText(report).then(() => {
      showNotification('✅ Complete IDE report copied to clipboard!\n\nPaste this into Cursor, VS Code, or any IDE chat for instant AI analysis and development suggestions.');
      document.getElementById('intertools-panel')?.remove();
    }).catch(() => {
      // Fallback for browsers without clipboard API
      const textArea = document.createElement('textarea');
      textArea.value = report;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showNotification('✅ IDE report copied to clipboard (fallback method)!');
      document.getElementById('intertools-panel')?.remove();
    });
  };
  
  window.generateQuickAnalysis = function() {
    const errors = logBuffer.filter(l => l.type === 'error');
    const warnings = logBuffer.filter(l => l.type === 'warn');
    
    const analysis = `🔍 InterTools Quick Analysis - ${window.location.hostname}

${errors.length > 0 ? `⚠️ ATTENTION: Found ${errors.length} JavaScript errors that need fixing` : '✅ No JavaScript errors detected'}
${warnings.length > 0 ? `⚠️ ${warnings.length} warnings detected` : '✅ No warnings detected'}

📊 Console Activity: ${logBuffer.length} total messages captured
⏰ Last Activity: ${logBuffer.length > 0 ? new Date(logBuffer[logBuffer.length - 1].timestamp).toLocaleTimeString() : 'No activity yet'}
🖥️ Environment: ${window.location.hostname === 'localhost' ? 'Development' : 'Production'}

${errors.length > 0 ? `
🚨 Most Recent Error:
${errors[errors.length - 1].message}
` : ''}

💡 Use "Copy Complete IDE Report" for detailed analysis and AI suggestions.
Generated by InterTools FREE v2.0.0`;
    
    navigator.clipboard.writeText(analysis).then(() => {
      showNotification('⚡ Quick analysis copied to clipboard!\n\nFor detailed insights, use "Copy Complete IDE Report".');
    });
  };
  
  window.viewLogDetails = function() {
    // Create detailed log viewer
    const viewer = document.createElement('div');
    viewer.id = 'intertools-log-viewer';
    viewer.style.cssText = `
      position: fixed; top: 50px; left: 50px; right: 50px; bottom: 50px;
      background: white; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.4);
      z-index: 10002; display: flex; flex-direction: column; overflow: hidden;
      border: 2px solid #667eea;
    `;
    
    viewer.innerHTML = `
      <div style="padding: 20px; background: #667eea; color: white; display: flex; justify-content: space-between; align-items: center;">
        <h3 style="margin: 0;">📋 Console Log Details (${logBuffer.length} entries)</h3>
        <button onclick="document.getElementById('intertools-log-viewer').remove()" style="
          background: rgba(255,255,255,0.2); border: none; color: white; 
          width: 30px; height: 30px; border-radius: 50%; cursor: pointer;
        ">×</button>
      </div>
      <div style="flex: 1; overflow-y: auto; padding: 20px; font-family: monospace; font-size: 12px; line-height: 1.4;">
        ${logBuffer.length > 0 ? logBuffer.map((log, index) => {
          const time = new Date(log.timestamp).toLocaleTimeString();
          const typeColor = {
            'error': '#dc2626',
            'warn': '#d97706', 
            'log': '#374151',
            'info': '#2563eb',
            'debug': '#7c3aed'
          }[log.type] || '#374151';
          
          return `
            <div style="margin-bottom: 15px; padding: 10px; border-left: 3px solid ${typeColor}; background: #f9fafb;">
              <div style="font-weight: bold; color: ${typeColor}; margin-bottom: 5px;">
                [${log.type.toUpperCase()}] ${time}
              </div>
              <div style="color: #374151; word-break: break-word;">
                ${log.message}
              </div>
              ${log.stack && log.type === 'error' ? `
                <details style="margin-top: 8px;">
                  <summary style="cursor: pointer; color: #6b7280;">Stack Trace</summary>
                  <pre style="margin: 8px 0 0 0; font-size: 11px; color: #6b7280; white-space: pre-wrap;">${log.stack}</pre>
                </details>
              ` : ''}
            </div>
          `;
        }).join('') : '<div style="text-align: center; color: #6b7280; padding: 40px;">No console logs captured yet</div>'}
      </div>
    `;
    
    document.body.appendChild(viewer);
  };
  
  window.clearAllLogs = function() {
    if (confirm('Clear all captured console logs?\n\nThis will remove all stored log data but keep InterTools running.')) {
      logBuffer.length = 0;
      updateLogCounts();
      showNotification('🗑️ All console logs cleared');
      document.getElementById('intertools-panel')?.remove();
    }
  };
  
  // ==========================================
  // UTILITY FUNCTIONS
  // ==========================================
  
  function detectTechStack() {
    const technologies = [];
    
    // Check for popular frameworks/libraries
    if (window.React) technologies.push('React');
    if (window.Vue) technologies.push('Vue.js');
    if (window.angular) technologies.push('Angular');
    if (window.jQuery || window.$) technologies.push('jQuery');
    if (window.bootstrap) technologies.push('Bootstrap');
    
    // Check for build tools by port
    const port = window.location.port;
    if (port === '3000') technologies.push('Create React App/Next.js');
    if (port === '5173' || port === '5174') technologies.push('Vite');
    if (port === '4000') technologies.push('Gatsby');
    if (port === '8080') technologies.push('Webpack Dev Server');
    
    // Check for CSS frameworks
    if (document.querySelector('link[href*="tailwind"]') || document.querySelector('*[class*="tw-"]')) {
      technologies.push('Tailwind CSS');
    }
    if (document.querySelector('link[href*="bootstrap"]') || document.querySelector('*[class*="btn-"]')) {
      technologies.push('Bootstrap');
    }
    
    return technologies.length > 0 ? technologies.join(', ') : 'Vanilla HTML/CSS/JavaScript';
  }
  
  function generateAIAnalysis(logs, errors, warnings, isDevelopment) {
    let analysis = '';
    
    if (errors.length > 0) {
      analysis += `🔴 ERROR PATTERNS DETECTED:
• Found ${errors.length} JavaScript errors that require immediate attention
• Most common error types: ${getMostCommonErrorTypes(errors)}
• Error frequency suggests ${errors.length > 5 ? 'systematic issues' : 'isolated problems'}
• ${isDevelopment ? 'Development environment - good time to fix these!' : 'Production errors - high priority fixes needed'}

`;
    } else {
      analysis += `🟢 ERROR STATUS: Clean! No JavaScript errors detected.
• This indicates good code quality and error handling
• Continue monitoring for any new issues

`;
    }
    
    if (warnings.length > 0) {
      analysis += `🟡 WARNING ANALYSIS:
• ${warnings.length} warnings detected - these won't break functionality but should be addressed
• Warnings often indicate deprecated features or performance concerns
• Review warnings to prevent future issues

`;
    }
    
    analysis += `📊 CONSOLE USAGE ANALYSIS:
• Total activity level: ${logs.length > 50 ? 'High' : logs.length > 20 ? 'Moderate' : 'Low'}
• Logging patterns suggest ${isDevelopment ? 'active development with good debugging practices' : 'production monitoring is active'}
• Consider implementing structured logging for better insights

`;
    
    if (isDevelopment) {
      analysis += `🏗️ DEVELOPMENT ENVIRONMENT INSIGHTS:
• Local development detected - great for testing and debugging
• Current console activity indicates active development
• Consider adding error boundaries and proper error handling
• Use this opportunity to implement comprehensive logging

`;
    }
    
    return analysis;
  }
  
  function generateRecommendations(logs, errors, warnings, isDevelopment) {
    let recommendations = '';
    
    if (errors.length > 0) {
      recommendations += `🚨 IMMEDIATE ACTIONS (Errors Found):
1. Fix the ${errors.length} JavaScript error${errors.length > 1 ? 's' : ''} shown above
2. Add try-catch blocks around error-prone code
3. Implement proper error boundaries (React) or error handling
4. Add error reporting/monitoring system
5. Test thoroughly after fixes

`;
    }
    
    if (warnings.length > 0) {
      recommendations += `⚠️ WARNING RESOLUTION:
1. Review and address the ${warnings.length} warning${warnings.length > 1 ? 's' : ''} detected
2. Update deprecated API usage
3. Optimize performance-related warnings
4. Consider upgrading dependencies if warnings are version-related

`;
    }
    
    recommendations += `📈 GENERAL IMPROVEMENTS:
1. Implement structured logging with consistent formats
2. Add performance monitoring and metrics
3. Set up automated error reporting (Sentry, LogRocket, etc.)
4. Create comprehensive error handling strategy
5. Add user-friendly error messages for production

`;
    
    if (isDevelopment) {
      recommendations += `🛠️ DEVELOPMENT WORKFLOW:
1. Set up linting and code quality tools
2. Implement proper TypeScript/JSDoc for better error prevention
3. Add comprehensive testing (unit, integration, e2e)
4. Set up continuous integration with error checking
5. Use InterTools regularly to monitor console activity

`;
    }
    
    recommendations += `🎯 MONITORING STRATEGY:
1. Use InterTools regularly to capture and analyze console logs
2. Set up production error monitoring
3. Create dashboards for error tracking
4. Implement alerting for critical errors
5. Regular code reviews focusing on error handling

`;
    
    return recommendations;
  }
  
  function getMostCommonErrorTypes(errors) {
    const types = {};
    errors.forEach(error => {
      const type = error.message.split(':')[0] || 'Unknown';
      types[type] = (types[type] || 0) + 1;
    });
    
    return Object.entries(types)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([type, count]) => `${type} (${count})`)
      .join(', ');
  }
  
  function formatTimeAgo(timestamp) {
    const now = new Date();
    const time = new Date(timestamp);
    const diff = now - time;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return 'just now';
    if (minutes === 1) return '1 minute ago';
    if (minutes < 60) return `${minutes} minutes ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours === 1) return '1 hour ago';
    if (hours < 24) return `${hours} hours ago`;
    
    return time.toLocaleDateString();
  }
  
  function updateLogCounts() {
    const countsElement = document.getElementById('log-counts');
    if (countsElement) {
      const logCount = logBuffer.length;
      const errorCount = logBuffer.filter(log => log.type === 'error').length;
      const warnCount = logBuffer.filter(log => log.type === 'warn').length;
      countsElement.textContent = `${logCount} logs • ${errorCount} errors • ${warnCount} warnings`;
    }
  }
  
  function showNotification(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      background: #10b981; color: white; padding: 15px 25px; border-radius: 10px;
      z-index: 10003; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 14px; box-shadow: 0 6px 25px rgba(16, 185, 129, 0.4);
      max-width: 400px; text-align: center; line-height: 1.4;
      border: 2px solid white;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
      notification.style.opacity = '0';
      notification.style.transform = 'translateX(-50%) translateY(-20px)';
      setTimeout(() => notification.remove(), 300);
    }, 4000);
  }
  
  // ==========================================
  // INITIALIZATION
  // ==========================================
  
  // Create UI
  const floatingButton = createFloatingButton();
  
  // Welcome messages
  console.log('🎉 InterTools FREE is now capturing all console logs!');
  console.log('📊 Click the 🛠️ button to analyze logs and generate IDE reports');
  console.log('💡 This is completely free and open source - no limits, no subscriptions!');
  console.log('🌟 Repository: https://github.com/your-repo/intertools');
  
  // Show welcome notification
  setTimeout(() => {
    showNotification('🚀 InterTools FREE loaded!\n\nClick the 🛠️ button anytime to analyze console logs and generate IDE reports.');
  }, 1000);
  
  // Cleanup function for page unload
  window.addEventListener('beforeunload', () => {
    // Restore original console methods
    Object.assign(console, originalConsole);
  });
  
  console.log('✅ InterTools FREE v2.0.0 initialization complete');
  
})();
