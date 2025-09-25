// InterTools Test Helper - Debug and Testing Utilities
// Paste this in console to help debug issues

console.log('🔧 InterTools Test Helper Loaded');

// Test helper functions
window.InterToolsDebug = {
    
    // Check if InterTools is loaded
    checkStatus: function() {
        console.log('📊 InterTools Status Check:');
        console.log('FREE Active:', window.interToolsActive || false);
        console.log('PRO Active:', window.interToolsProActive || false);
        console.log('Version:', window.interToolsVersion || 'Not loaded');
        console.log('License:', window.interToolsLicense || 'None');
        
        // Check for UI elements
        const freeButton = document.getElementById('intertools-button');
        const proButton = document.getElementById('intertools-pro-button');
        console.log('FREE Button:', freeButton ? '✅ Found' : '❌ Missing');
        console.log('PRO Button:', proButton ? '✅ Found' : '❌ Missing');
        
        return {
            freeActive: !!window.interToolsActive,
            proActive: !!window.interToolsProActive,
            version: window.interToolsVersion,
            license: window.interToolsLicense
        };
    },
    
    // Generate test console logs
    generateTestLogs: function() {
        console.log('🧪 Generating test console logs...');
        console.log('Test log message 1');
        console.warn('Test warning message');
        console.error('Test error message');
        console.info('Test info message');
        
        // Simulate an error
        try {
            nonExistentFunction();
        } catch (e) {
            console.error('Simulated error:', e.message);
        }
        
        console.log('✅ Test logs generated');
    },
    
    // Check API connectivity
    testAPI: async function() {
        console.log('🔗 Testing API connectivity...');
        
        try {
            const response = await fetch('http://localhost:3002/api/health');
            const data = await response.json();
            console.log('✅ API Health:', data);
            return data;
        } catch (error) {
            console.error('❌ API Error:', error.message);
            return null;
        }
    },
    
    // Test trial signup
    testTrial: async function() {
        console.log('🎯 Testing trial signup...');
        
        try {
            const response = await fetch('http://localhost:3002/api/start-trial', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: `test_${Date.now()}@intertools.pro` })
            });
            
            const data = await response.json();
            console.log('Trial Response:', data);
            
            if (data.success) {
                localStorage.setItem('intertools-user-id', data.userId);
                console.log('✅ Trial activated, User ID stored');
            }
            
            return data;
        } catch (error) {
            console.error('❌ Trial Error:', error.message);
            return null;
        }
    },
    
    // Clear all InterTools data
    cleanup: function() {
        console.log('🧹 Cleaning up InterTools...');
        
        // Remove UI elements
        document.getElementById('intertools-button')?.remove();
        document.getElementById('intertools-pro-button')?.remove();
        document.getElementById('intertools-panel')?.remove();
        document.getElementById('intertools-pro-panel')?.remove();
        
        // Clear variables
        delete window.interToolsActive;
        delete window.interToolsProActive;
        delete window.interToolsVersion;
        delete window.interToolsLicense;
        
        // Clear localStorage
        localStorage.removeItem('intertools-pro-subscription');
        localStorage.removeItem('intertools-user-id');
        
        console.log('✅ Cleanup complete');
    },
    
    // Show help
    help: function() {
        console.log(`
🔧 InterTools Test Helper Commands:

InterToolsDebug.checkStatus()     - Check InterTools status
InterToolsDebug.generateTestLogs() - Generate test console logs  
InterToolsDebug.testAPI()         - Test API connectivity
InterToolsDebug.testTrial()       - Test trial signup process
InterToolsDebug.cleanup()         - Remove all InterTools elements
InterToolsDebug.help()            - Show this help

📝 Usage Examples:
- InterToolsDebug.checkStatus()
- InterToolsDebug.generateTestLogs()
- InterToolsDebug.cleanup()
        `);
    }
};

// Show help on load
InterToolsDebug.help();
