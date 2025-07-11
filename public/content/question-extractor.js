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
    console.log('🔍 Extracting question data...');
    
    // Get the complete question text including all parts
    const questionText = this.extractCompleteQuestionText();
    
    // Get all available options with their letters
    const options = this.extractAllOptions();
    
    if (!questionText || options.length === 0) {
      console.log('❌ Could not extract question or options');
      return null;
    }

    const questionData = {
      question: questionText,
      options: options,
      questionNumber: this.extractQuestionNumber(),
      rawHTML: this.extractRawQuestionHTML() // Include raw HTML for better context
    };
    
    console.log('✅ Extracted question data:', questionData);
    return questionData;
  }

  extractCompleteQuestionText() {
    // Try multiple approaches to get the complete question
    const questionElement = this.findQuestionElement();
    if (!questionElement) return null;
    
    // Method 1: Try to find question content div specifically
    let questionText = '';
    const questionContentSelectors = [
      '.question-content',
      '.assessment_pb-5',
      '.question-text',
      '.question p',
      '.mcq-question p'
    ];
    
    for (const selector of questionContentSelectors) {
      const contentEl = questionElement.querySelector(selector) || document.querySelector(selector);
      if (contentEl) {
        questionText = contentEl.textContent.trim();
        if (questionText.length > 10) {
          break;
        }
      }
    }
    
    // Method 2: If no specific content found, extract from main element
    if (!questionText || questionText.length < 10) {
      const clone = questionElement.cloneNode(true);
      // Remove unwanted elements but keep question content
      const removeSelectors = [
        '.option', '.custom-radio', '.mcq-option', '.answer-option',
        '.nav-btn', '.status', '.controls', '.actions'
      ];
      removeSelectors.forEach(sel => {
        clone.querySelectorAll(sel).forEach(el => el.remove());
      });
      questionText = clone.textContent.trim();
    }
    
    // Clean up the question text
    questionText = questionText.replace(/^(Question\s*\d+[:.]\s*|Q\s*\d+[:.]\s*)/i, '');
    questionText = questionText.replace(/^\d+[:.]\s*/, '');
    questionText = questionText.replace(/\s+/g, ' ').trim();
    
    return questionText;
  }

  extractAllOptions() {
    console.log('🔍 Extracting all options...');
    const options = [];
    
    // Enhanced option extraction with multiple strategies
    const optionStrategies = [
      // Strategy 1: Find options by label elements
      () => {
        const labels = document.querySelectorAll('label');
        const opts = [];
        labels.forEach(label => {
          const text = label.textContent.trim();
          // Look for option patterns A) B) C) D)
          if (/^[A-D]\s*[).]/.test(text)) {
            opts.push(text.replace(/^[A-D]\s*[).]/, '').trim());
          }
        });
        return opts;
      },
      
      // Strategy 2: Find options in the specific structure from HTML
      () => {
        const optionDivs = document.querySelectorAll('.option');
        const opts = [];
        optionDivs.forEach(div => {
          const label = div.querySelector('label');
          if (label) {
            let text = label.textContent.trim();
            text = text.replace(/^[A-D]\s*[).]/, '').trim();
            if (text.length > 0) {
              opts.push(text);
            }
          }
        });
        return opts;
      },
      
      // Strategy 3: Find by radio input + label pairs
      () => {
        const radioInputs = document.querySelectorAll('input[type="radio"]');
        const opts = [];
        radioInputs.forEach(input => {
          const label = document.querySelector(`label[for="${input.id}"]`) ||
                       input.closest('.option')?.querySelector('label') ||
                       input.parentElement?.querySelector('label');
          if (label) {
            let text = label.textContent.trim();
            text = text.replace(/^[A-D]\s*[).]/, '').trim();
            if (text.length > 0) {
              opts.push(text);
            }
          }
        });
        return opts;
      },
      
      // Strategy 4: Find paragraphs in option containers
      () => {
        const optionContainers = document.querySelectorAll('.option, .custom-radio, .mcq-option');
        const opts = [];
        optionContainers.forEach(container => {
          const p = container.querySelector('p');
          if (p) {
            opts.push(p.textContent.trim());
          }
        });
        return opts;
      }
    ];
    
    // Try each strategy until we get good options
    for (const strategy of optionStrategies) {
      const extractedOptions = strategy();
      if (extractedOptions.length >= 2) {
        console.log(`✅ Found ${extractedOptions.length} options using strategy`);
        return extractedOptions.slice(0, 4); // Max 4 options
      }
    }
    
    console.log('❌ No options found with any strategy');
    return [];
  }

  extractRawQuestionHTML() {
    // Get raw HTML for better AI context
    const questionElement = this.findQuestionElement();
    return questionElement ? questionElement.outerHTML : '';
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