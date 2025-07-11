// Tab management module for background script
class TabManager {
  constructor() {
    this.currentTab = null;
  }

  async activateExtension(config, storageManager) {
    // Store configuration permanently
    await storageManager.saveConfig(config);
    
    // Inject content script into current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    this.currentTab = tab;
    
    // Check if we're on the correct website
    if (!tab.url.includes('srichaitanyameta.com')) {
      throw new Error('This extension only works on srichaitanyameta.com');
    }
    
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [
          'content/automation-core.js',
          'content/ui-manager.js', 
          'content/question-extractor.js',
          'content/interaction-handler.js',
          'content/observer-manager.js',
          'content.js'
        ]
      });
      
      // Notify content script that extension is active
      chrome.tabs.sendMessage(tab.id, {
        action: 'extensionActivated',
        config: config
      });
    } catch (error) {
      console.error('Failed to inject content script:', error);
      throw error;
    }
  }

  deactivateExtension(storageManager) {
    storageManager.setInactive();
    
    if (this.currentTab) {
      chrome.tabs.sendMessage(this.currentTab.id, {
        action: 'extensionDeactivated'
      });
    }
  }

  async captureScreenshot() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
  }
}

// Export for use in background script
window.TabManager = TabManager;