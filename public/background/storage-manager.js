// Storage management module for background script
class StorageManager {
  async saveSettings(settings) {
    await chrome.storage.local.set({
      aiTestAssistantSettings: settings
    });
  }

  async loadSettings() {
    const result = await chrome.storage.local.get(['aiTestAssistantSettings']);
    return result.aiTestAssistantSettings || {};
  }

  async saveConfig(config) {
    await chrome.storage.local.set({
      apiKey: config.apiKey,
      isActive: true,
      config: config,
      aiTestAssistantSettings: config
    });
  }

  async getApiKey() {
    const { apiKey } = await chrome.storage.local.get(['apiKey']);
    return apiKey;
  }

  async setInactive() {
    await chrome.storage.local.set({ isActive: false });
  }
}

// Export for use in background script
window.StorageManager = StorageManager;