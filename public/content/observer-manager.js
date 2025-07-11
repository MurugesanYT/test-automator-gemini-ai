// DOM observation and change detection module
class ObserverManager {
  constructor(automation) {
    this.automation = automation;
  }

  startObserving() {
    // Monitor DOM changes for new questions or popups
    this.automation.observer = new MutationObserver((mutations) => {
      if (!this.automation.isActive) return;

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

    this.automation.observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  }

  stopObserving() {
    if (this.automation.observer) {
      this.automation.observer.disconnect();
      this.automation.observer = null;
    }
  }

  checkForNewQuestion() {
    const questionElement = this.automation.findQuestionElement();
    if (questionElement && !this.automation.isProcessing) {
      const questionText = this.automation.extractQuestionText(questionElement);
      if (questionText && questionText !== this.automation.currentQuestion && questionText.length > 10) {
        this.automation.currentQuestion = questionText;
        this.automation.updateStatus(`New question detected: ${questionText.substring(0, 30)}...`);
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
      if (popup && this.automation.isVisible(popup)) {
        this.automation.handlePopup(popup);
      }
    });
  }

  async queueQuestionProcessing() {
    if (this.automation.config.autoProcess && !this.automation.isProcessing) {
      await this.automation.processCurrentQuestion();
    }
  }

  detectCurrentQuestion() {
    this.checkForNewQuestion();
  }
}

// Extend the main automation class with observer methods
SriChaitanyaTestAutomation.prototype.startObserving = function() {
  if (!this.observerManager) {
    this.observerManager = new ObserverManager(this);
  }
  this.observerManager.startObserving();
};

SriChaitanyaTestAutomation.prototype.stopObserving = function() {
  if (this.observerManager) {
    this.observerManager.stopObserving();
  }
};

SriChaitanyaTestAutomation.prototype.checkForNewQuestion = function() {
  if (!this.observerManager) {
    this.observerManager = new ObserverManager(this);
  }
  this.observerManager.checkForNewQuestion();
};

SriChaitanyaTestAutomation.prototype.checkForPopups = function() {
  if (!this.observerManager) {
    this.observerManager = new ObserverManager(this);
  }
  this.observerManager.checkForPopups();
};

SriChaitanyaTestAutomation.prototype.detectCurrentQuestion = function() {
  if (!this.observerManager) {
    this.observerManager = new ObserverManager(this);
  }
  this.observerManager.detectCurrentQuestion();
};