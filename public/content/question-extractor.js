// Question and option extraction module
class QuestionExtractor {
  constructor(automation) {
    this.automation = automation;
  }

  findQuestionElement() {
    // Try multiple selectors for Sri Chaitanya Meta platform
    for (const selector of this.automation.questionSelectors) {
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

    // Extract question text
    const questionText = this.extractQuestionText(questionElement);
    
    // Extract options
    const options = this.extractOptions();

    if (!questionText || options.length === 0) {
      return null;
    }

    return {
      question: questionText,
      options: options,
      questionNumber: this.extractQuestionNumber()
    };
  }

  extractQuestionText(questionElement) {
    // Remove option elements and get clean question text
    const clone = questionElement.cloneNode(true);
    const optionElements = clone.querySelectorAll('.option, .custom-radio, .mcq-option, .answer-option');
    optionElements.forEach(el => el.remove());
    
    let text = clone.textContent.trim();
    
    // Clean up common prefixes
    text = text.replace(/^(Question\s*\d+[:.]\s*|Q\s*\d+[:.]\s*)/i, '');
    text = text.replace(/^\d+[:.]\s*/, '');
    
    return text;
  }

  extractOptions() {
    const options = [];
    
    // Try multiple selectors for options
    for (const selector of this.automation.optionSelectors) {
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

    return options.slice(0, 4); // Limit to max 4 options
  }

  extractQuestionNumber() {
    const questionNoSelectors = [
      '.question-no',
      '.question-number',
      '.q-number',
      '[class*="question-num"]'
    ];
    
    for (const selector of questionNoSelectors) {
      const questionNoElement = document.querySelector(selector);
      if (questionNoElement) {
        const match = questionNoElement.textContent.match(/\d+/);
        return match ? parseInt(match[0]) : 1;
      }
    }
    
    return 1;
  }

  isVisible(element) {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           element.offsetParent !== null &&
           element.offsetWidth > 0 &&
           element.offsetHeight > 0;
  }
}

// Extend the main automation class with extraction methods
SriChaitanyaTestAutomation.prototype.extractQuestionData = function() {
  if (!this.questionExtractor) {
    this.questionExtractor = new QuestionExtractor(this);
  }
  return this.questionExtractor.extractQuestionData();
};

SriChaitanyaTestAutomation.prototype.findQuestionElement = function() {
  if (!this.questionExtractor) {
    this.questionExtractor = new QuestionExtractor(this);
  }
  return this.questionExtractor.findQuestionElement();
};

SriChaitanyaTestAutomation.prototype.extractQuestionText = function(questionElement) {
  if (!this.questionExtractor) {
    this.questionExtractor = new QuestionExtractor(this);
  }
  return this.questionExtractor.extractQuestionText(questionElement);
};

SriChaitanyaTestAutomation.prototype.extractOptions = function() {
  if (!this.questionExtractor) {
    this.questionExtractor = new QuestionExtractor(this);
  }
  return this.questionExtractor.extractOptions();
};

SriChaitanyaTestAutomation.prototype.extractQuestionNumber = function() {
  if (!this.questionExtractor) {
    this.questionExtractor = new QuestionExtractor(this);
  }
  return this.questionExtractor.extractQuestionNumber();
};

SriChaitanyaTestAutomation.prototype.isVisible = function(element) {
  if (!this.questionExtractor) {
    this.questionExtractor = new QuestionExtractor(this);
  }
  return this.questionExtractor.isVisible(element);
};