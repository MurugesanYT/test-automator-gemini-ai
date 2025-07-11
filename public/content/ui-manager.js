// UI management module for the test automation
class UIManager {
  constructor(automation) {
    this.automation = automation;
  }

  injectUI() {
    // Remove existing UI if present
    const existingUI = document.getElementById('ai-test-assistant-status');
    if (existingUI) {
      existingUI.remove();
    }

    // Create floating status indicator
    const statusDiv = document.createElement('div');
    statusDiv.id = 'ai-test-assistant-status';
    statusDiv.innerHTML = `
      <div class="status-indicator">
        <div class="status-icon">🤖</div>
        <div class="status-text">AI Assistant Active</div>
        <div class="status-controls">
          <button id="ai-pause-btn" title="Pause/Resume">⏸️</button>
          <button id="ai-next-btn" title="Process Current Question">▶️</button>
          <button id="ai-auto-btn" title="Toggle Auto Mode">${this.automation.config.autoProcess ? '🔄' : '⚡'}</button>
        </div>
      </div>
    `;
    document.body.appendChild(statusDiv);

    this.attachEventListeners();
  }

  attachEventListeners() {
    document.getElementById('ai-pause-btn').addEventListener('click', () => {
      this.automation.togglePause();
    });

    document.getElementById('ai-next-btn').addEventListener('click', () => {
      this.automation.processCurrentQuestion();
    });

    document.getElementById('ai-auto-btn').addEventListener('click', () => {
      this.automation.toggleAutoMode();
    });
  }

  removeUI() {
    const statusDiv = document.getElementById('ai-test-assistant-status');
    if (statusDiv) {
      statusDiv.remove();
    }
  }

  updateStatus(message) {
    const statusText = document.querySelector('#ai-test-assistant-status .status-text');
    if (statusText) {
      statusText.textContent = message;
    }
  }
}

// Extend the main automation class with UI methods
SriChaitanyaTestAutomation.prototype.injectUI = function() {
  if (!this.uiManager) {
    this.uiManager = new UIManager(this);
  }
  this.uiManager.injectUI();
};

SriChaitanyaTestAutomation.prototype.removeUI = function() {
  if (this.uiManager) {
    this.uiManager.removeUI();
  }
};