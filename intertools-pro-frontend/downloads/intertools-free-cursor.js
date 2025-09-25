// 🚀 InterTools FREE - Direct Cursor Log Integration
// Version: 2.1.0 | License: MIT | 100% Free & Open Source
// 
// WHAT IT DOES:
// - Captures console logs from any website
// - Formats them for direct Cursor IDE integration
// - Simple one-click push to Cursor
// - No chat features - just clean log forwarding
//
// USAGE:
// 1. Copy this script
// 2. Open any website
// 3. Press F12 → Console → Paste and Enter
// 4. Click 🛠️ button → "Push to Cursor"
// 5. Logs are formatted and ready for Cursor AI

(function() {
  'use strict';
  
  if (window.interToolsFreeActive) {
    console.log('🛠️ InterTools FREE already active!');
    return;
  }
  
  console.log('🚀 InterTools FREE - Cursor Integration Active');
  window.interToolsFreeActive = true;
  
  // Simple log capture
  const logs = [];
  const MAX_LOGS = 50; // Keep it simple
  
  // Store original console
  const original = {
    log: console.log,
    error: console.error,
    warn: console.warn,
    info: console.info
  };
  
  // Capture function
  function captureLog(type, args) {
    const entry = {
      type,
      message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '),
      time: new Date().toLocaleTimeString(),
      timestamp: Date.now()
    };
    
    logs.push(entry);
    if (logs.length > MAX_LOGS) logs.shift();
  }
  
  // Override console methods
  console.log = function(...args) {
    captureLog('log', args);
    original.log.apply(console, args);
  };
  
  console.error = function(...args) {
    captureLog('error', args);
    original.error.apply(console, args);
  };
  
  console.warn = function(...args) {
    captureLog('warn', args);
    original.warn.apply(console, args);
  };
  
  console.info = function(...args) {
    captureLog('info', args);
    original.info.apply(console, args);
  };
  
  // Global error capture
  window.addEventListener('error', (e) => {
    captureLog('error', [`${e.message} at ${e.filename}:${e.lineno}`]);
  });
  
  // Simple floating button
  const button = document.createElement('div');
  button.innerHTML = '🛠️';
  button.title = 'InterTools FREE - Push logs to Cursor';
  button.style.cssText = `
    position: fixed; top: 20px; right: 20px; width: 50px; height: 50px;
    background: #10b981; border-radius: 50%; display: flex; align-items: center;
    justify-content: center; font-size: 20px; cursor: pointer; z-index: 10000;
    color: white; box-shadow: 0 2px 10px rgba(16, 185, 129, 0.3);
    border: 2px solid white; transition: transform 0.2s ease;
  `;
  
  button.addEventListener('mouseenter', () => button.style.transform = 'scale(1.1)');
  button.addEventListener('mouseleave', () => button.style.transform = 'scale(1)');
  button.addEventListener('click', showPanel);
  
  document.body.appendChild(button);
  
  // Simple panel
  function showPanel() {
    const existing = document.getElementById('intertools-panel');
    if (existing) {
      existing.remove();
      return;
    }
    
    const panel = document.createElement('div');
    panel.id = 'intertools-panel';
    panel.style.cssText = `
      position: fixed; top: 80px; right: 20px; width: 350px; max-width: calc(100vw - 40px);
      background: white; border-radius: 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15);
      z-index: 10001; font-family: -apple-system, BlinkMacSystemFont, sans-serif;
      border: 2px solid #10b981; overflow: hidden;
    `;
    
    const errorCount = logs.filter(l => l.type === 'error').length;
    const warnCount = logs.filter(l => l.type === 'warn').length;
    
    panel.innerHTML = `
      <div style="padding: 15px; background: #10b981; color: white;">
        <div style="display: flex; justify-content: space-between; align-items: center;">
          <div>
            <h3 style="margin: 0; font-size: 16px;">🛠️ InterTools FREE</h3>
            <div style="font-size: 12px; opacity: 0.9;">
              ${logs.length} logs • ${errorCount} errors • ${warnCount} warnings
            </div>
          </div>
          <button onclick="this.closest('#intertools-panel').remove()" style="
            background: rgba(255,255,255,0.2); border: none; color: white;
            width: 24px; height: 24px; border-radius: 50%; cursor: pointer;
          ">×</button>
        </div>
      </div>
      
      <div style="padding: 15px;">
        <div style="margin-bottom: 15px;">
          <strong>📄 Current Page:</strong><br>
          <div style="font-size: 11px; color: #666; word-break: break-all;">
            ${document.title}<br>${window.location.href}
          </div>
        </div>
        
        <button onclick="pushToCursor()" style="
          width: 100%; padding: 12px; background: #10b981; color: white;
          border: none; border-radius: 8px; cursor: pointer; font-weight: 600;
          margin-bottom: 10px; font-size: 14px;
        ">📋 Push Logs to Cursor</button>
        
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 15px;">
          <button onclick="viewLogs()" style="
            padding: 8px; background: #f3f4f6; color: #374151; border: 1px solid #d1d5db;
            border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;
          ">👀 View Logs</button>
          <button onclick="clearLogs()" style="
            padding: 8px; background: #fef2f2; color: #dc2626; border: 1px solid #fecaca;
            border-radius: 6px; cursor: pointer; font-size: 12px; font-weight: 600;
          ">🗑️ Clear</button>
        </div>
        
        <div style="background: #f0f9ff; padding: 10px; border-radius: 6px; font-size: 11px; color: #0369a1;">
          <strong>💡 How to use:</strong> Click "Push Logs to Cursor" to copy a formatted report.
          Then paste it in Cursor's AI chat for instant analysis and suggestions.
        </div>
      </div>
    `;
    
    document.body.appendChild(panel);
  }
  
  // Push to Cursor function
  window.pushToCursor = function() {
    const report = generateCursorReport();
    
    navigator.clipboard.writeText(report).then(() => {
      // Show success notification
      showNotification('📋 Logs pushed to clipboard!\\n\\nPaste in Cursor AI chat (Ctrl+Shift+L or Cmd+Shift+L) for instant analysis.');
      document.getElementById('intertools-panel')?.remove();
    }).catch(() => {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = report;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showNotification('📋 Logs copied to clipboard!');
    });
  };
  
  // Generate Cursor-optimized report
  function generateCursorReport() {
    const now = new Date();
    const errors = logs.filter(l => l.type === 'error');
    const warnings = logs.filter(l => l.type === 'warn');
    const recentLogs = logs.slice(-20);
    
    return `# Console Log Analysis - ${document.title}

**Page:** ${window.location.href}  
**Time:** ${now.toLocaleString()}  
**Environment:** ${window.location.hostname === 'localhost' ? 'Development' : 'Production'}

## Summary
- **Total Logs:** ${logs.length}
- **Errors:** ${errors.length} 
- **Warnings:** ${warnings.length}
- **Info/Debug:** ${logs.filter(l => ['log', 'info'].includes(l.type)).length}

## Recent Console Activity
${recentLogs.map((log, i) => `${i + 1}. **[${log.type.toUpperCase()}]** ${log.time} - ${log.message}`).join('\\n')}

${errors.length > 0 ? `## Errors Found
${errors.map((error, i) => `**Error ${i + 1}:** ${error.message}  
*Time:* ${error.time}`).join('\\n\\n')}` : '## ✅ No Errors Detected'}

${warnings.length > 0 ? `## Warnings
${warnings.slice(-5).map((warn, i) => `**Warning ${i + 1}:** ${warn.message}  
*Time:* ${warn.time}`).join('\\n\\n')}` : ''}

## Request
Please analyze these console logs and provide:
1. **Issue Analysis** - What problems do you see?
2. **Recommended Fixes** - Specific code suggestions
3. **Best Practices** - How to prevent similar issues
4. **Next Steps** - What should I focus on?

---
*Generated by InterTools FREE - Direct Cursor Integration*`;
  }
  
  // View logs function
  window.viewLogs = function() {
    const logViewer = document.createElement('div');
    logViewer.id = 'log-viewer';
    logViewer.style.cssText = `
      position: fixed; top: 50px; left: 50px; right: 50px; bottom: 50px;
      background: white; border-radius: 12px; box-shadow: 0 8px 30px rgba(0,0,0,0.3);
      z-index: 10002; display: flex; flex-direction: column; overflow: hidden;
      border: 2px solid #10b981;
    `;
    
    logViewer.innerHTML = `
      <div style="padding: 15px; background: #10b981; color: white; display: flex; justify-content: space-between;">
        <h3 style="margin: 0;">📋 Console Logs (${logs.length} entries)</h3>
        <button onclick="document.getElementById('log-viewer').remove()" style="
          background: rgba(255,255,255,0.2); border: none; color: white;
          width: 24px; height: 24px; border-radius: 50%; cursor: pointer;
        ">×</button>
      </div>
      <div style="flex: 1; overflow-y: auto; padding: 15px; font-family: monospace; font-size: 12px;">
        ${logs.map((log, i) => {
          const colors = { error: '#dc2626', warn: '#d97706', log: '#374151', info: '#2563eb' };
          return `
            <div style="margin-bottom: 10px; padding: 8px; border-left: 3px solid ${colors[log.type]}; background: #f9fafb;">
              <div style="font-weight: bold; color: ${colors[log.type]}; margin-bottom: 4px;">
                [${log.type.toUpperCase()}] ${log.time}
              </div>
              <div style="color: #374151; word-break: break-word;">${log.message}</div>
            </div>
          `;
        }).join('')}
      </div>
    `;
    
    document.body.appendChild(logViewer);
  };
  
  // Clear logs function
  window.clearLogs = function() {
    if (confirm('Clear all captured logs?')) {
      logs.length = 0;
      showNotification('🗑️ Logs cleared');
      document.getElementById('intertools-panel')?.remove();
    }
  };
  
  // Simple notification
  function showNotification(message) {
    const notification = document.createElement('div');
    notification.textContent = message;
    notification.style.cssText = `
      position: fixed; top: 20px; left: 50%; transform: translateX(-50%);
      background: #10b981; color: white; padding: 12px 20px; border-radius: 8px;
      z-index: 10003; font-size: 13px; box-shadow: 0 4px 15px rgba(16, 185, 129, 0.3);
    `;
    
    document.body.appendChild(notification);
    setTimeout(() => notification.remove(), 3000);
  }
  
  console.log('✅ InterTools FREE ready - Click 🛠️ to push logs to Cursor');
  showNotification('🛠️ InterTools FREE loaded! Click the button to push logs to Cursor.');
  
})();
