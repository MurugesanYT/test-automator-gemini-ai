
// Content script for interacting with test pages
class TestAutomation {
  constructor() {
    this.isActive = false;
    this.config = null;
    this.currentQuestion = null;
    this.observer = null;
    this.processingQueue = [];
    this.isProcessing = false;
  }

  init(config) {
    this.config = config;
    this.isActive = true;
    this.injectUI();
    this.startObserving();
    this.detectCurrentQuestion();
    console.log('Test automation activated');
  }

  deactivate() {
    this.isActive = false;
    this.stopObserving();
    this.removeUI();
    console.log('Test automation deactivated');
  }

  injectUI() {
    // Create floating status indicator
    const statusDiv = document.createElement('div');
    statusDiv.id = 'ai-test-assistant-status';
    statusDiv.innerHTML = `
      <div class="status-indicator">
        <div class="status-icon">🤖</div>
        <div class="status-text">AI Assistant Active</div>
        <div class="status-controls">
          <button id="ai-pause-btn">⏸️</button>
          <button id="ai-next-btn">▶️</button>
        </div>
      </div>
    `;
    document.body.appendChild(statusDiv);

    // Add event listeners
    document.getElementById('ai-pause-btn').addEventListener('click', () => {
      this.togglePause();
    });

    document.getElementById('ai-next-btn').addEventListener('click', () => {
      this.processCurrentQuestion();
    });
  }

  removeUI() {
    const statusDiv = document.getElementById('ai-test-assistant-status');
    if (statusDiv) {
      statusDiv.remove();
    }
  }

  startObserving() {
    // Monitor DOM changes for new questions or popups
    this.observer = new MutationObserver((mutations) => {
      if (!this.isActive) return;

      mutations.forEach(mutation => {
        // Check for new questions
        if (mutation.type === 'childList') {
          this.checkForNewQuestion();
          this.checkForPopups();
        }
      });
    });

    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  }

  stopObserving() {
    if (this.observer) {
      this.observer.disconnect();
      this.observer = null;
    }
  }

  checkForNewQuestion() {
    const questionElement = this.findQuestionElement();
    if (questionElement && !this.isProcessing) {
      const questionText = this.extractQuestionText(questionElement);
      if (questionText !== this.currentQuestion) {
        this.currentQuestion = questionText;
        this.queueQuestionProcessing();
      }
    }
  }

  checkForPopups() {
    // Look for common popup patterns
    const popupSelectors = [
      '.modal',
      '.popup',
      '.dialog',
      '.alert',
      '[role="dialog"]',
      '.swal2-container',
      '.mat-dialog-container'
    ];

    popupSelectors.forEach(selector => {
      const popup = document.querySelector(selector);
      if (popup && this.isVisible(popup)) {
        this.handlePopup(popup);
      }
    });
  }

  async queueQuestionProcessing() {
    if (this.config.autoProcess && !this.isProcessing) {
      await this.processCurrentQuestion();
    }
  }

  async processCurrentQuestion() {
    if (this.isProcessing) return;
    
    this.isProcessing = true;
    this.updateStatus('Processing question...');

    try {
      const questionData = this.extractQuestionData();
      if (!questionData) {
        throw new Error('Could not extract question data');
      }

      // Send to background script for AI analysis
      const response = await this.sendMessage({
        action: 'analyzeQuestion',
        data: questionData
      });

      if (response.success) {
        await this.selectAnswer(response.data.answer);
        this.updateStatus(`Selected answer: ${response.data.answer}`);
        
        if (this.config.autoNext) {
          setTimeout(() => {
            this.clickNextButton();
          }, this.config.delay || 2000);
        }
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Question processing failed:', error);
      this.updateStatus(`Error: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  findQuestionElement() {
    // Based on the provided HTML structure
    const selectors = [
      '.question-content',
      '.exam-question .question',
      '[class*="question"]'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }

    return null;
  }

  extractQuestionData() {
    const questionElement = this.findQuestionElement();
    if (!questionElement) return null;

    // Extract question text
    const questionText = this.extractQuestionText(questionElement);
    
    // Extract options
    const options = this.extractOptions();

    return {
      question: questionText,
      options: options,
      questionNumber: this.extractQuestionNumber()
    };
  }

  extractQuestionText(questionElement) {
    // Remove option elements and get clean question text
    const clone = questionElement.cloneNode(true);
    const optionElements = clone.querySelectorAll('.option, .custom-radio');
    optionElements.forEach(el => el.remove());
    
    return clone.textContent.trim();
  }

  extractOptions() {
    const options = [];
    const optionElements = document.querySelectorAll('.option label, .custom-radio label');
    
    optionElements.forEach(label => {
      const text = label.textContent.trim();
      if (text) {
        options.push(text);
      }
    });

    return options;
  }

  extractQuestionNumber() {
    const questionNoElement = document.querySelector('.question-no');
    if (questionNoElement) {
      const match = questionNoElement.textContent.match(/\d+/);
      return match ? parseInt(match[0]) : 1;
    }
    return 1;
  }

  async selectAnswer(answerLetter) {
    const answerIndex = answerLetter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
    const radioButtons = document.querySelectorAll('input[type="radio"][name="smcq"]');
    
    if (radioButtons[answerIndex]) {
      // Simulate human-like clicking
      await this.humanLikeClick(radioButtons[answerIndex]);
      
      // Verify selection
      setTimeout(() => {
        if (!radioButtons[answerIndex].checked) {
          // Fallback: try clicking the label
          const label = document.querySelector(`label[for="${radioButtons[answerIndex].id}"]`);
          if (label) {
            this.humanLikeClick(label);
          }
        }
      }, 500);
    } else {
      throw new Error(`Could not find option ${answerLetter}`);
    }
  }

  async humanLikeClick(element) {
    // Simulate human-like interaction
    element.focus();
    
    // Add small random delay
    await this.sleep(100 + Math.random() * 200);
    
    // Create and dispatch events
    const events = ['mousedown', 'mouseup', 'click'];
    events.forEach(eventType => {
      const event = new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        view: window
      });
      element.dispatchEvent(event);
    });
  }

  clickNextButton() {
    const nextButtons = [
      '.nav-btn-right',
      '.nextAndsave',
      'button:contains("SKIP")',
      'button:contains("Next")'
    ];

    for (const selector of nextButtons) {
      const button = document.querySelector(selector);
      if (button && this.isVisible(button)) {
        this.humanLikeClick(button);
        break;
      }
    }
  }

  handlePopup(popup) {
    // Analyze popup content and determine appropriate action
    const popupText = popup.textContent.toLowerCase();
    
    if (popupText.includes('confirm') || popupText.includes('ok')) {
      const okButton = popup.querySelector('button, .btn, [role="button"]');
      if (okButton) {
        this.humanLikeClick(okButton);
      }
    } else if (popupText.includes('cancel') || popupText.includes('close')) {
      const closeButton = popup.querySelector('.close, .cancel, [aria-label="close"]');
      if (closeButton) {
        this.humanLikeClick(closeButton);
      }
    }
  }

  isVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           element.offsetParent !== null;
  }

  updateStatus(message) {
    const statusText = document.querySelector('#ai-test-assistant-status .status-text');
    if (statusText) {
      statusText.textContent = message;
    }
  }

  async sendMessage(message) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, resolve);
    });
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  detectCurrentQuestion() {
    this.checkForNewQuestion();
  }

  togglePause() {
    this.isActive = !this.isActive;
    this.updateStatus(this.isActive ? 'AI Assistant Active' : 'AI Assistant Paused');
  }
}

// Global automation instance
let testAutomation = null;

// Listen for messages from background script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'extensionActivated':
      if (!testAutomation) {
        testAutomation = new TestAutomation();
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
      testAutomation = new TestAutomation();
    }
    testAutomation.init(result.config);
  }
});
