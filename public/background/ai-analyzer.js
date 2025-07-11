// AI analysis module for background script
class AIAnalyzer {
  constructor() {
    this.apiKey = null;
  }

  async init() {
    const { apiKey } = await chrome.storage.local.get(['apiKey']);
    this.apiKey = apiKey;
  }

  async analyzeQuestion(questionData) {
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }
    
    const prompt = this.createAnalysisPrompt(questionData);
    
    try {
      // Use the correct Gemini model
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${this.apiKey}`, {
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
        const errorData = await response.json();
        throw new Error(`API request failed: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
      }
      
      const data = await response.json();
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
        throw new Error('Invalid response from AI service');
      }
      
      const result = data.candidates[0].content.parts[0].text;
      
      return this.parseAIResponse(result);
    } catch (error) {
      console.error('AI analysis failed:', error);
      throw error;
    }
  }

  createAnalysisPrompt(questionData) {
    return `
You are an expert test-taking AI assistant for Sri Chaitanya Meta educational platform. You must analyze the following multiple choice question and provide the CORRECT answer.

IMPORTANT INSTRUCTIONS:
1. Read the COMPLETE question carefully
2. Read ALL available options thoroughly
3. Use your knowledge to determine the scientifically/academically correct answer
4. Double-check your reasoning before responding
5. Provide ONLY the letter of the correct answer (A, B, C, or D)

Question: ${questionData.question}

Available Options:
${questionData.options.map((option, index) => `${String.fromCharCode(65 + index)}) ${option}`).join('\n')}

CRITICAL: Analyze each option carefully and select the one that is factually correct. Do not guess. Use your educational knowledge to determine the right answer.

Respond with ONLY the letter of the correct answer (A, B, C, or D). No explanation needed - just the single letter.

Answer:`;
  }

  parseAIResponse(response) {
    // Extract the answer letter from AI response
    const cleanResponse = response.trim().toUpperCase();
    const match = cleanResponse.match(/^[ABCD]/);
    if (match) {
      return {
        answer: match[0],
        confidence: 0.9
      };
    }
    
    // Fallback parsing
    const letters = response.match(/[ABCD]/gi);
    if (letters && letters.length > 0) {
      return {
        answer: letters[0].toUpperCase(),
        confidence: 0.7
      };
    }
    
    throw new Error('Could not parse AI response');
  }
}

// Export for use in background script
window.AIAnalyzer = AIAnalyzer;