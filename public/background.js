
// Background service worker - now uses modular components
let isExtensionActive = false;
let storageManager, tabManager, aiAnalyzer;

// Initialize modules
async function initializeModules() {
  // Load the module files first
  await import('./background/storage-manager.js');
  await import('./background/tab-manager.js');
  await import('./background/ai-analyzer.js');
  
  storageManager = new StorageManager();
  tabManager = new TabManager();
  aiAnalyzer = new AIAnalyzer();
  
  await aiAnalyzer.init();
}

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Test Assistant for Sri Chaitanya Meta installed');
  initializeModules();
});

// Initialize on startup
initializeModules();

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'activateExtension':
      activateExtension(request.data);
      sendResponse({ success: true });
      break;
    
    case 'deactivateExtension':
      deactivateExtension();
      sendResponse({ success: true });
      break;
    
    case 'analyzeQuestion':
      aiAnalyzer.analyzeQuestion(request.data)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response
    
    case 'captureScreenshot':
      tabManager.captureScreenshot()
        .then(dataUrl => sendResponse({ success: true, data: dataUrl }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    
    case 'saveSettings':
      storageManager.saveSettings(request.data)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    
    case 'loadSettings':
      storageManager.loadSettings()
        .then(settings => sendResponse({ success: true, data: settings }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

async function activateExtension(config) {
  isExtensionActive = true;
  await tabManager.activateExtension(config, storageManager);
}

function deactivateExtension() {
  isExtensionActive = false;
  tabManager.deactivateExtension(storageManager);
}
