// User interaction and button handling module
class InteractionHandler {
  constructor(automation) {
    this.automation = automation;
  }

  async selectAnswer(answerLetter) {
    const answerIndex = answerLetter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
    
    // Try multiple radio button selectors
    const radioSelectors = [
      'input[type="radio"]',
      'input[name*="answer"]',
      'input[name*="option"]',
      'input[name*="choice"]',
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
    await this.automation.sleep(200 + Math.random() * 300);
    
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
      await this.automation.sleep(50);
    }
  }

  clickNextButton() {
    // Updated button selectors to handle both NEXT and FINISH buttons
    const nextButtonSelectors = [
      '.nav-btn-right',
      '.nextAndsave',
      'button:contains("SKIP")',
      'button:contains("Next")',
      'button:contains("NEXT")',
      'button:contains("FINISH")',
      'button:contains("Submit")',
      '.next-button',
      '.btn-next',
      '.finish-button',
      '.submit-button',
      '[class*="next"]',
      '[class*="finish"]',
      'button[onclick*="next"]',
      'button[onclick*="finish"]'
    ];

    for (const selector of nextButtonSelectors) {
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
      
      if (button && this.automation.isVisible(button) && !button.disabled) {
        this.humanLikeClick(button);
        console.log(`Clicked button: ${button.textContent.trim()}`);
        break;
      }
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
}

// Extend the main automation class with interaction methods
SriChaitanyaTestAutomation.prototype.selectAnswer = function(answerLetter) {
  if (!this.interactionHandler) {
    this.interactionHandler = new InteractionHandler(this);
  }
  return this.interactionHandler.selectAnswer(answerLetter);
};

SriChaitanyaTestAutomation.prototype.humanLikeClick = function(element) {
  if (!this.interactionHandler) {
    this.interactionHandler = new InteractionHandler(this);
  }
  return this.interactionHandler.humanLikeClick(element);
};

SriChaitanyaTestAutomation.prototype.clickNextButton = function() {
  if (!this.interactionHandler) {
    this.interactionHandler = new InteractionHandler(this);
  }
  return this.interactionHandler.clickNextButton();
};

SriChaitanyaTestAutomation.prototype.handlePopup = function(popup) {
  if (!this.interactionHandler) {
    this.interactionHandler = new InteractionHandler(this);
  }
  return this.interactionHandler.handlePopup(popup);
};