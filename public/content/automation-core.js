// Core automation class for Sri Chaitanya Meta test automation
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
      '.option-text'
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
            this.clickNextButton();
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

// Export for use in other modules
window.SriChaitanyaTestAutomation = SriChaitanyaTestAutomation;