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
    console.log('🔍 Looking for Next/Finish button...');
    
    // More comprehensive button detection based on the provided HTML
    const buttonSelectors = [
      // Direct text matching
      () => Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.trim().toUpperCase().includes('NEXT')),
      () => Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.trim().toUpperCase().includes('FINISH')),
      () => Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.trim().toUpperCase().includes('SUBMIT')),
      () => Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.trim().toUpperCase().includes('SKIP')),
      
      // Class-based selectors from the HTML
      () => document.querySelector('.nextAndsave'),
      () => document.querySelector('.nav-btn-right'),
      () => document.querySelector('.next-button'),
      () => document.querySelector('.btn-next'),
      () => document.querySelector('.finish-button'),
      () => document.querySelector('.submit-button'),
      
      // Generic class patterns
      () => document.querySelector('[class*="next"]'),
      () => document.querySelector('[class*="finish"]'),
      () => document.querySelector('[class*="submit"]'),
      
      // Type-based selectors
      () => document.querySelector('button[type="submit"]'),
      () => document.querySelector('input[type="submit"]'),
      
      // Onclick-based selectors
      () => document.querySelector('button[onclick*="next"]'),
      () => document.querySelector('button[onclick*="finish"]'),
      () => document.querySelector('button[onclick*="submit"]')
    ];

    for (let i = 0; i < buttonSelectors.length; i++) {
      try {
        const button = buttonSelectors[i]();
        
        if (button && this.automation.isVisible(button) && !button.disabled) {
          console.log(`✅ Found button: "${button.textContent.trim()}" using selector ${i}`);
          console.log('Button element:', button);
          
          // Scroll to button first
          button.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Wait a moment for scroll
          setTimeout(async () => {
            try {
              // Try multiple click approaches
              await this.forceClick(button);
              console.log(`🖱️ Successfully clicked: ${button.textContent.trim()}`);
            } catch (error) {
              console.error('Click failed:', error);
            }
          }, 500);
          
          return true; // Button found and clicked
        }
      } catch (error) {
        console.warn(`Selector ${i} failed:`, error);
      }
    }
    
    console.log('❌ No Next/Finish button found');
    return false;
  }

  async forceClick(element) {
    // Multiple click strategies to ensure it works
    
    // Strategy 1: Focus and direct click
    element.focus();
    await this.automation.sleep(100);
    
    // Strategy 2: Mouse events
    const rect = element.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    
    const mouseEvents = [
      new MouseEvent('mouseover', { bubbles: true, cancelable: true, clientX: x, clientY: y }),
      new MouseEvent('mousedown', { bubbles: true, cancelable: true, clientX: x, clientY: y }),
      new MouseEvent('mouseup', { bubbles: true, cancelable: true, clientX: x, clientY: y }),
      new MouseEvent('click', { bubbles: true, cancelable: true, clientX: x, clientY: y })
    ];
    
    for (const event of mouseEvents) {
      element.dispatchEvent(event);
      await this.automation.sleep(50);
    }
    
    // Strategy 3: Direct click
    element.click();
    
    // Strategy 4: If it's a form button, try triggering form submission
    const form = element.closest('form');
    if (form) {
      const submitEvent = new Event('submit', { bubbles: true, cancelable: true });
      form.dispatchEvent(submitEvent);
    }
    
    // Strategy 5: Try triggering any onclick handler directly
    if (element.onclick) {
      element.onclick();
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