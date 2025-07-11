// Content script for Sri Chaitanya Meta test automation
class SriChaitanyaTestAutomation {
  constructor() {
    this.isActive = false;
    this.config = null;
    this.currentQuestion = null;
    this.observer = null;
    this.processingQueue = [];
    this.isProcessing = false;
    this.questionSelectors = [
      '.question-text',
      '.question-content', 
      '.exam-question .question',
      '[class*="question"]',
      '.ques-text',
      '.question-wrapper',
      '.mcq-question'
    ];
    this.optionSelectors = [
      '.option label',
      '.custom-radio label',
      '.answer-option',
      '.mcq-option label',
      'input[type="radio"] + label',
      '.option-text',
      '.option .assessment_pl-10'
    ];
  }

  init(config) {
    this.config = config;
    this.isActive = true;
    this.injectUI();
    this.startObserving();
    this.detectCurrentQuestion();
    console.log('Sri Chaitanya Meta test automation activated');
  }

  deactivate() {
    this.isActive = false;
    this.stopObserving();
    this.removeUI();
    console.log('Sri Chaitanya Meta test automation deactivated');
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
          <button id="ai-auto-btn" title="Toggle Auto Mode">${this.config.autoProcess ? '🔄' : '⚡'}</button>
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

    document.getElementById('ai-auto-btn').addEventListener('click', () => {
      this.toggleAutoMode();
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
          setTimeout(() => {
            this.checkForNewQuestion();
            this.checkForPopups();
          }, 500); // Small delay to let content load
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
      if (questionText && questionText !== this.currentQuestion && questionText.length > 10) {
        this.currentQuestion = questionText;
        this.updateStatus(`New question detected: ${questionText.substring(0, 30)}...`);
        this.queueQuestionProcessing();
      }
    }
  }

  checkForPopups() {
    // Look for common popup patterns on Sri Chaitanya Meta
    const popupSelectors = [
      '.modal',
      '.popup',
      '.dialog',
      '.alert',
      '[role="dialog"]',
      '.swal2-container',
      '.mat-dialog-container',
      '.confirmation-dialog',
      '.warning-popup'
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
    this.updateStatus('🔍 Analyzing question...');

    try {
      const questionData = this.extractQuestionData();
      if (!questionData || !questionData.question || questionData.options.length < 2) {
        throw new Error('Could not extract complete question data');
      }

      this.updateStatus('🧠 AI is thinking...');

      // Send to background script for AI analysis
      const response = await this.sendMessage({
        action: 'analyzeQuestion',
        data: questionData
      });

      if (response.success) {
        this.updateStatus(`✅ AI suggests: ${response.data.answer}`);
        await this.selectAnswer(response.data.answer);
        
        if (this.config.autoNext) {
          this.updateStatus('⏳ Auto-advancing...');
          setTimeout(() => {
            this.clickNextOrFinishButton();
          }, this.config.delay || 3000);
        }
      } else {
        throw new Error(response.error);
      }
    } catch (error) {
      console.error('Question processing failed:', error);
      this.updateStatus(`❌ Error: ${error.message}`);
    } finally {
      setTimeout(() => {
        this.isProcessing = false;
        if (this.isActive) {
          this.updateStatus('🤖 AI Assistant Active');
        }
      }, 2000);
    }
  }

  findQuestionElement() {
    // Try multiple selectors for Sri Chaitanya Meta platform
    for (const selector of this.questionSelectors) {
      const element = document.querySelector(selector);
      if (element && this.isVisible(element)) {
        return element;
      }
    }
    return null;
  }

  extractQuestionData() {
    const questionElement = this.findQuestionElement();
    if (!questionElement) return null;

    // Extract question text with better cleaning
    const questionText = this.extractQuestionText(questionElement);
    
    // Extract options with improved detection
    const options = this.extractOptionsImproved();

    if (!questionText || options.length === 0) {
      return null;
    }

    return {
      question: questionText,
      options: options,
      questionNumber: this.extractQuestionNumber(),
      totalQuestions: this.getTotalQuestions(),
      currentProgress: this.getCurrentProgress()
    };
  }

  extractQuestionText(questionElement) {
    // Get the question content div specifically
    const questionContent = questionElement.querySelector('.question-content, .assessment_pb-5');
    if (questionContent) {
      // Clone to avoid modifying original
      const clone = questionContent.cloneNode(true);
      
      // Remove all option elements
      const optionElements = clone.querySelectorAll('.option, .custom-radio, .mcq-option, .answer-option');
      optionElements.forEach(el => el.remove());
      
      let text = clone.textContent.trim();
      
      // Clean up common prefixes
      text = text.replace(/^(Question\s*\d+[:.]\s*|Q\s*\d+[:.]\s*)/i, '');
      text = text.replace(/^\d+[:.]\s*/, '');
      
      return text;
    }
    
    return null;
  }

  extractOptionsImproved() {
    const options = [];
    
    // Look for option containers first
    const optionContainers = document.querySelectorAll('.option');
    
    if (optionContainers.length > 0) {
      optionContainers.forEach(container => {
        // Look for label within each option container
        const label = container.querySelector('label, .assessment_pl-10');
        if (label) {
          let text = label.textContent.trim();
          // Remove option prefixes like "A)", "B)", etc.
          text = text.replace(/^[A-D][).:]\s*/i, '');
          if (text && text.length > 1) {
            options.push(text);
          }
        }
      });
    }
    
    // Fallback to other selectors if no options found
    if (options.length === 0) {
      for (const selector of this.optionSelectors) {
        const optionElements = document.querySelectorAll(selector);
        
        if (optionElements.length > 0) {
          optionElements.forEach(label => {
            let text = label.textContent.trim();
            // Remove option prefixes like "A)", "B)", etc.
            text = text.replace(/^[A-D][).:]\s*/i, '');
            if (text && text.length > 1) {
              options.push(text);
            }
          });
          
          if (options.length >= 2) {
            break; // Found valid options
          } else {
            options.length = 0; // Clear and try next selector
          }
        }
      }
    }

    return options.slice(0, 4); // Limit to max 4 options
  }

  extractQuestionNumber() {
    // Look for question number in the question span
    const questionNoElement = document.querySelector('.question-no');
    if (questionNoElement) {
      const match = questionNoElement.textContent.match(/\d+/);
      return match ? parseInt(match[0]) : 1;
    }
    
    return 1;
  }

  getTotalQuestions() {
    // Look for total questions in the progress or question list
    const questionButtons = document.querySelectorAll('.question-no button');
    return questionButtons.length > 0 ? questionButtons.length : 35; // Default to 35 if not found
  }

  getCurrentProgress() {
    // Extract progress from progress bar
    const progressBar = document.querySelector('.progress-bar');
    if (progressBar) {
      const ariaValue = progressBar.getAttribute('aria-valuenow');
      return ariaValue ? parseInt(ariaValue) : 0;
    }
    return 0;
  }

  async selectAnswer(answerLetter) {
    const answerIndex = answerLetter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
    
    // Try multiple radio button selectors
    const radioSelectors = [
      'input[type="radio"]',
      'input[name*="answer"]',
      'input[name*="option"]',
      'input[name*="choice"]',
      'input[name="smcq"]',
      '.custom-radio input',
      '.option input[type="radio"]'
    ];
    
    let radioButtons = [];
    
    for (const selector of radioSelectors) {
      radioButtons = document.querySelectorAll(selector);
      if (radioButtons.length >= answerIndex + 1) {
        break;
      }
    }
    
    if (radioButtons[answerIndex]) {
      // Simulate human-like clicking
      await this.humanLikeClick(radioButtons[answerIndex]);
      
      // Verify selection and try label click as fallback
      setTimeout(async () => {
        if (!radioButtons[answerIndex].checked) {
          // Try clicking the associated label
          const label = document.querySelector(`label[for="${radioButtons[answerIndex].id}"]`) ||
                       radioButtons[answerIndex].closest('label') ||
                       radioButtons[answerIndex].parentElement.querySelector('label');
          
          if (label) {
            await this.humanLikeClick(label);
          }
        }
      }, 500);
    } else {
      throw new Error(`Could not find option ${answerLetter} (${radioButtons.length} options found)`);
    }
  }

  async humanLikeClick(element) {
    // Simulate human-like interaction
    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
    
    // Add small random delay
    await this.sleep(200 + Math.random() * 300);
    
    element.focus();
    
    // Create and dispatch events
    const events = ['mousedown', 'mouseup', 'click', 'change'];
    for (const eventType of events) {
      const event = new MouseEvent(eventType, {
        bubbles: true,
        cancelable: true,
        view: window
      });
      element.dispatchEvent(event);
      await this.sleep(50);
    }
  }

  clickNextOrFinishButton() {
    // First try to find FINISH button (appears in header)
    const finishButton = document.querySelector('.submit button, button:contains("FINISH")');
    
    // Then try to find NEXT button (appears in action area)
    const nextButton = document.querySelector('.nextAndsave, button:contains("NEXT")');
    
    // Determine which button to click based on context
    let buttonToClick = null;
    
    // Check if FINISH button is visible and enabled
    if (finishButton && this.isVisible(finishButton) && !finishButton.disabled) {
      buttonToClick = finishButton;
      this.updateStatus('🏁 Clicking FINISH button...');
    }
    // Otherwise use NEXT button
    else if (nextButton && this.isVisible(nextButton) && !nextButton.disabled) {
      buttonToClick = nextButton;
      this.updateStatus('➡️ Clicking NEXT button...');
    }
    
    // Fallback to other selectors
    if (!buttonToClick) {
      const fallbackSelectors = [
        '.nav-btn-right',
        'button:contains("SKIP")',
        'button:contains("Next")',
        '.next-button',
        '.btn-next',
        '[class*="next"]',
        'button[onclick*="next"]'
      ];

      for (const selector of fallbackSelectors) {
        let button;
        
        if (selector.includes(':contains')) {
          // Handle text-based selectors
          const text = selector.match(/contains\("([^"]+)"\)/)[1];
          button = Array.from(document.querySelectorAll('button')).find(btn => 
            btn.textContent.toLowerCase().includes(text.toLowerCase())
          );
        } else {
          button = document.querySelector(selector);
        }
        
        if (button && this.isVisible(button) && !button.disabled) {
          buttonToClick = button;
          break;
        }
      }
    }
    
    if (buttonToClick) {
      this.humanLikeClick(buttonToClick);
    } else {
      this.updateStatus('❌ No next/finish button found');
    }
  }

  handlePopup(popup) {
    // Analyze popup content and determine appropriate action
    const popupText = popup.textContent.toLowerCase();
    
    if (popupText.includes('confirm') || popupText.includes('ok') || popupText.includes('continue')) {
      const buttons = popup.querySelectorAll('button, .btn, [role="button"]');
      for (const button of buttons) {
        const btnText = button.textContent.toLowerCase();
        if (btnText.includes('ok') || btnText.includes('confirm') || btnText.includes('continue')) {
          this.humanLikeClick(button);
          break;
        }
      }
    } else if (popupText.includes('cancel') || popupText.includes('close')) {
      const closeButton = popup.querySelector('.close, .cancel, [aria-label="close"], .btn-close');
      if (closeButton) {
        this.humanLikeClick(closeButton);
      }
    }
  }

  isVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           element.offsetParent !== null &&
           element.offsetWidth > 0 &&
           element.offsetHeight > 0;
  }

  updateStatus(message) {
    const statusText = document.querySelector('#ai-test-assistant-status .status-text');
    if (statusText) {
      statusText.textContent = message;
    }
    console.log(`Sri Chaitanya AI Assistant: ${message}`);
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
    this.updateStatus(this.isActive ? '🤖 AI Assistant Active' : '⏸️ AI Assistant Paused');
    
    const pauseBtn = document.getElementById('ai-pause-btn');
    if (pauseBtn) {
      pauseBtn.textContent = this.isActive ? '⏸️' : '▶️';
    }
  }

  toggleAutoMode() {
    this.config.autoProcess = !this.config.autoProcess;
    this.updateStatus(`Auto mode: ${this.config.autoProcess ? 'ON' : 'OFF'}`);
    
    const autoBtn = document.getElementById('ai-auto-btn');
    if (autoBtn) {
      autoBtn.textContent = this.config.autoProcess ? '🔄' : '⚡';
      autoBtn.title = this.config.autoProcess ? 'Auto Mode ON' : 'Auto Mode OFF';
    }
    
    // Save updated config
    this.sendMessage({
      action: 'saveSettings',
      data: this.config
    });
  }
}

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
