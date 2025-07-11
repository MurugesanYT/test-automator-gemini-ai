// Vanilla JavaScript popup script for Chrome extension
class ExtensionPopup {
  constructor() {
    this.isActive = false;
    this.apiKey = '';
    this.autoProcess = true;
    this.autoNext = false;
    this.delay = 3000;
    this.currentTab = null;

    this.init();
  }

  async init() {
    await this.loadSettings();
    await this.checkCurrentTab();
    this.bindEvents();
    this.updateUI();
  }

  async checkCurrentTab() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      this.currentTab = tab;
      this.updateWebsiteStatus();
    } catch (error) {
      console.error('Failed to get current tab:', error);
    }
  }

  async loadSettings() {
    try {
      const result = await chrome.storage.local.get([
        'apiKey', 'isActive', 'aiTestAssistantSettings'
      ]);
      
      if (result.aiTestAssistantSettings) {
        const settings = result.aiTestAssistantSettings;
        this.apiKey = settings.apiKey || '';
        this.autoProcess = settings.autoProcess ?? true;
        this.autoNext = settings.autoNext ?? false;
        this.delay = settings.delay ?? 3000;
      }
      
      this.isActive = result.isActive || false;
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  }

  async saveSettings() {
    try {
      const settings = {
        apiKey: this.apiKey,
        autoProcess: this.autoProcess,
        autoNext: this.autoNext,
        delay: this.delay,
        isActive: false
      };
      
      await chrome.storage.local.set({
        aiTestAssistantSettings: settings,
        apiKey: this.apiKey
      });
      
      this.showToast('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      this.showToast('Failed to save settings', 'error');
    }
  }

  bindEvents() {
    // API Key input
    document.getElementById('apiKey').addEventListener('input', (e) => {
      this.apiKey = e.target.value;
    });

    // Test API Key button
    document.getElementById('testBtn').addEventListener('click', () => {
      this.testApiKey();
    });

    // Settings checkboxes
    document.getElementById('autoProcess').addEventListener('change', (e) => {
      this.autoProcess = e.target.checked;
    });

    document.getElementById('autoNext').addEventListener('change', (e) => {
      this.autoNext = e.target.checked;
    });

    // Delay input
    document.getElementById('delay').addEventListener('input', (e) => {
      this.delay = parseInt(e.target.value) || 3000;
    });

    // Action buttons
    document.getElementById('toggleBtn').addEventListener('click', () => {
      this.toggleExtension();
    });

    document.getElementById('saveBtn').addEventListener('click', () => {
      this.saveSettings();
    });
  }

  updateUI() {
    // Update form values
    document.getElementById('apiKey').value = this.apiKey;
    document.getElementById('autoProcess').checked = this.autoProcess;
    document.getElementById('autoNext').checked = this.autoNext;
    document.getElementById('delay').value = this.delay;

    // Update status
    const statusEl = document.getElementById('status');
    const toggleBtn = document.getElementById('toggleBtn');
    
    statusEl.textContent = this.isActive ? 'Active' : 'Inactive';
    statusEl.className = `status ${this.isActive ? 'active' : 'inactive'}`;
    
    toggleBtn.textContent = this.isActive ? 'Deactivate Assistant' : 'Activate Assistant';
    toggleBtn.className = `button full-width ${this.isActive ? 'danger' : 'success'}`;

    this.updateWebsiteStatus();
  }

  updateWebsiteStatus() {
    const isOnCorrectWebsite = this.currentTab?.url?.includes('srichaitanyameta.com');
    const iconEl = document.getElementById('website-icon');
    const textEl = document.getElementById('website-text');
    const toggleBtn = document.getElementById('toggleBtn');

    if (isOnCorrectWebsite) {
      iconEl.textContent = '✅';
      textEl.textContent = 'srichaitanyameta.com';
      toggleBtn.disabled = false;
    } else {
      iconEl.textContent = '⚠️';
      textEl.textContent = 'Wrong website';
      toggleBtn.disabled = true;
    }
  }

  async toggleExtension() {
    if (!this.apiKey.trim()) {
      this.showToast('Please enter your Gemini API key first', 'error');
      return;
    }

    const isOnCorrectWebsite = this.currentTab?.url?.includes('srichaitanyameta.com');
    if (!isOnCorrectWebsite) {
      this.showToast('This extension only works on srichaitanyameta.com', 'error');
      return;
    }

    try {
      if (this.isActive) {
        const response = await this.sendMessageToBackground({ action: 'deactivateExtension' });
        if (response.success) {
          this.isActive = false;
          this.showToast('Extension deactivated', 'success');
        }
      } else {
        const config = { 
          apiKey: this.apiKey, 
          autoProcess: this.autoProcess, 
          autoNext: this.autoNext, 
          delay: this.delay 
        };
        const response = await this.sendMessageToBackground({
          action: 'activateExtension',
          data: config
        });
        
        if (response.success) {
          this.isActive = true;
          await this.saveSettings();
          this.showToast('Extension activated successfully!', 'success');
        }
      }
      this.updateUI();
    } catch (error) {
      console.error('Toggle extension error:', error);
      this.showToast(error.message, 'error');
    }
  }

  async sendMessageToBackground(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(response || { success: false, error: 'No response' });
        }
      });
    });
  }

  async testApiKey() {
    if (!this.apiKey.trim()) {
      this.showToast('Please enter your Gemini API key', 'error');
      return;
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hello" }] }]
        })
      });

      if (response.ok) {
        this.showToast('API Key is valid ✅', 'success');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Invalid API key');
      }
    } catch (error) {
      this.showToast(`API Key Invalid ❌: ${error.message}`, 'error');
    }
  }

  showToast(message, type) {
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  }
}

// Initialize the popup when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  new ExtensionPopup();
});