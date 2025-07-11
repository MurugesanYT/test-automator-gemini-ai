
// Main content script - now uses modular components
// All modules are loaded via the background script injection

// Global automation instance
let testAutomation = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'extensionActivated':
      if (!testAutomation) {
        testAutomation = new SriChaitanyaTestAutomation();
      }
      testAutomation.init(request.config);
      sendResponse({ success: true });
      break;
      
    case 'extensionDeactivated':
      if (testAutomation) {
        testAutomation.deactivate();
      }
      sendResponse({ success: true });
      break;
      
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

// Auto-check if extension should be active on page load
chrome.storage.local.get(['isActive', 'config']).then(result => {
  if (result.isActive && result.config) {
    if (!testAutomation) {
      testAutomation = new SriChaitanyaTestAutomation();
    }
    testAutomation.init(result.config);
  }
});

// Check if we're on the correct website
if (window.location.hostname.includes('srichaitanyameta.com')) {
  console.log('Sri Chaitanya Meta AI Test Assistant loaded');
} else {
  console.warn('This extension is designed for srichaitanyameta.com');
}
