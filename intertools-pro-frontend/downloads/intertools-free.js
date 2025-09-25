// InterTools Free Script - Always Free and Open Source
// Copy and paste this into any website's console

(function() {
  'use strict';
  
  if (window.interToolsLoaded) {
    console.log('InterTools already loaded!');
    return;
  }
  
  console.log('🚀 Loading InterTools Free...');
  
  // Try Railway backend first, fallback to localhost
  const API_ENDPOINTS = [
    'https://your-app.railway.app',
    'http://localhost:3001',
    'https://intertools.pro/api'
  ];
  
  let currentEndpoint = 0;
  
  function tryLoadScript() {
    const endpoint = API_ENDPOINTS[currentEndpoint];
    
    fetch(endpoint + '/free-script.js')
      .then(response => {
        if (!response.ok) throw new Error('Network response was not ok');
        return response.text();
      })
      .then(script => {
        const scriptElement = document.createElement('script');
        scriptElement.textContent = script.replace('https://your-app.railway.app', endpoint);
        document.head.appendChild(scriptElement);
        window.interToolsLoaded = true;
        console.log('✅ InterTools Free loaded successfully from:', endpoint);
      })
      .catch(error => {
        console.warn('Failed to load from:', endpoint, error);
        currentEndpoint++;
        if (currentEndpoint < API_ENDPOINTS.length) {
          console.log('Trying next endpoint...');
          tryLoadScript();
        } else {
          console.error('❌ Failed to load InterTools from all endpoints');
          console.log('💡 Visit https://intertools.pro for help');
        }
      });
  }
  
  tryLoadScript();
})();
