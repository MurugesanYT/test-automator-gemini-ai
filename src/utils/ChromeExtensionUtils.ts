
// Utility functions for Chrome extension development

export class ChromeExtensionUtils {
  // Simulate Chrome extension APIs for development
  static async sendMessage(message: any): Promise<any> {
    // In actual extension, this would be chrome.runtime.sendMessage
    console.log('Sending message:', message);
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true, data: 'Mock response' });
      }, 500);
    });
  }

  static async getStorage(keys: string[]): Promise<any> {
    // In actual extension, this would be chrome.storage.local.get
    const storage: any = {};
    keys.forEach(key => {
      const value = localStorage.getItem(key);
      if (value) {
        try {
          storage[key] = JSON.parse(value);
        } catch {
          storage[key] = value;
        }
      }
    });
    return storage;
  }

  static async setStorage(items: Record<string, any>): Promise<void> {
    // In actual extension, this would be chrome.storage.local.set
    Object.entries(items).forEach(([key, value]) => {
      localStorage.setItem(key, JSON.stringify(value));
    });
  }

  static async getCurrentTab(): Promise<any> {
    // In actual extension, this would be chrome.tabs.query
    return {
      id: 1,
      url: window.location.href,
      title: document.title
    };
  }

  static async captureScreenshot(): Promise<string> {
    // In actual extension, this would be chrome.tabs.captureVisibleTab
    // For demo, return a placeholder
    return 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
  }

  // Gemini AI integration
  static async analyzeWithGemini(apiKey: string, prompt: string): Promise<string> {
    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }],
          generationConfig: {
            temperature: 0.1,
            topK: 1,
            topP: 1,
            maxOutputTokens: 1024,
          }
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`);
      }

      const data = await response.json();
      return data.candidates[0].content.parts[0].text;
    } catch (error) {
      console.error('Gemini API error:', error);
      throw error;
    }
  }

  // DOM manipulation utilities for test automation
  static findQuestionElement(): Element | null {
    const selectors = [
      '.question-content',
      '.exam-question .question',
      '[class*="question"]',
      '.assessment_pb-5'
    ];

    for (const selector of selectors) {
      const element = document.querySelector(selector);
      if (element) return element;
    }

    return null;
  }

  static extractQuestionText(element: Element): string {
    // Remove option elements and get clean question text
    const clone = element.cloneNode(true) as Element;
    const optionElements = clone.querySelectorAll('.option, .custom-radio');
    optionElements.forEach(el => el.remove());
    
    return clone.textContent?.trim() || '';
  }

  static extractOptions(): string[] {
    const options: string[] = [];
    const optionElements = document.querySelectorAll('.option label, .custom-radio label');
    
    optionElements.forEach(label => {
      const text = label.textContent?.trim();
      if (text) {
        options.push(text);
      }
    });

    return options;
  }

  static async selectAnswer(answerLetter: string): Promise<void> {
    const answerIndex = answerLetter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
    const radioButtons = document.querySelectorAll('input[type="radio"][name="smcq"]');
    
    if (radioButtons[answerIndex]) {
      const radioButton = radioButtons[answerIndex] as HTMLInputElement;
      
      // Simulate human-like clicking
      radioButton.focus();
      await this.sleep(100 + Math.random() * 200);
      
      // Create and dispatch events
      const events = ['mousedown', 'mouseup', 'click'];
      events.forEach(eventType => {
        const event = new MouseEvent(eventType, {
          bubbles: true,
          cancelable: true,
          view: window
        });
        radioButton.dispatchEvent(event);
      });

      // Verify selection
      setTimeout(() => {
        if (!radioButton.checked) {
          // Fallback: try clicking the label
          const label = document.querySelector(`label[for="${radioButton.id}"]`) as HTMLElement;
          if (label) {
            label.click();
          }
        }
      }, 500);
    } else {
      throw new Error(`Could not find option ${answerLetter}`);
    }
  }

  static sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  static isElementVisible(element: Element): boolean {
    const style = window.getComputedStyle(element);
    return style.display !== 'none' && 
           style.visibility !== 'hidden' && 
           (element as HTMLElement).offsetParent !== null;
  }

  // Create analysis prompt for AI
  static createQuestionAnalysisPrompt(question: string, options: string[]): string {
    return `
You are an expert test-taking AI assistant. Analyze the following multiple choice question and provide the correct answer.

Question: ${question}

Options:
${options.map((option, index) => `${String.fromCharCode(65 + index)}) ${option}`).join('\n')}

Please analyze this question carefully and respond with ONLY the letter of the correct answer (A, B, C, or D). 
Do not include any explanation or additional text - just the single letter.

Answer:`;
  }
}
