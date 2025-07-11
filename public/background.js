
// Background service worker for the Chrome extension
let isExtensionActive = false;
let currentTab = null;

// Storage management
class StorageManager {
  async saveSettings(settings) {
    await chrome.storage.local.set({
      aiTestAssistantSettings: settings
    });
  }

  async loadSettings() {
    const result = await chrome.storage.local.get(['aiTestAssistantSettings']);
    return result.aiTestAssistantSettings || {};
  }

  async saveConfig(config) {
    await chrome.storage.local.set({
      apiKey: config.apiKey,
      isActive: true,
      config: config,
      aiTestAssistantSettings: config
    });
  }

  async getApiKey() {
    const { apiKey } = await chrome.storage.local.get(['apiKey']);
    return apiKey;
  }

  async setInactive() {
    await chrome.storage.local.set({ isActive: false });
  }
}

// AI Analysis
class AIAnalyzer {
  constructor() {
    this.apiKey = null;
  }

  async init() {
    const { apiKey } = await chrome.storage.local.get(['apiKey']);
    this.apiKey = apiKey;
  }

  async analyzeQuestion(questionData) {
    await this.init(); // Refresh API key
    
    if (!this.apiKey) {
      throw new Error('Gemini API key not configured');
    }
    
    const prompt = this.createAnalysisPrompt(questionData);
    
    try {
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
You are a highly knowledgeable AI assistant specializing in academic subjects for Sri Chaitanya Meta educational platform. Your task is to analyze multiple choice questions and provide the SCIENTIFICALLY and ACADEMICALLY CORRECT answer.

CRITICAL INSTRUCTIONS:
1. Read the ENTIRE question carefully - do not miss any details
2. Examine ALL available options thoroughly 
3. Use your comprehensive knowledge base to determine the factually correct answer
4. Consider the context and subject matter (Biology, Chemistry, Physics, Math, etc.)
5. Apply scientific principles and established academic facts
6. Double-check your reasoning before responding

COMPLETE QUESTION:
${questionData.question}

ALL AVAILABLE OPTIONS:
${questionData.options.map((option, index) => `${String.fromCharCode(65 + index)}) ${option}`).join('\n')}

QUESTION NUMBER: ${questionData.questionNumber || 'Unknown'}

ANALYSIS REQUIREMENTS:
- This appears to be from an educational test/exam
- The question requires subject matter expertise
- Only ONE option is correct based on academic knowledge
- Use established scientific/academic principles to determine the answer

RESPONSE FORMAT:
Respond with ONLY the letter of the correct answer (A, B, C, or D).
Do NOT include explanations, reasoning, or additional text.
Just provide the single letter that corresponds to the factually correct answer.

CORRECT ANSWER:`;
  }

  parseAIResponse(response) {
    const cleanResponse = response.trim().toUpperCase();
    const match = cleanResponse.match(/^[ABCD]/);
    if (match) {
      return {
        answer: match[0],
        confidence: 0.9
      };
    }
    
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

// Tab management
class TabManager {
  constructor() {
    this.currentTab = null;
  }

  async activateExtension(config, storageManager) {
    await storageManager.saveConfig(config);
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    this.currentTab = tab;
    currentTab = tab; // Set global reference
    
    if (!tab.url.includes('srichaitanyameta.com')) {
      throw new Error('This extension only works on srichaitanyameta.com');
    }
    
    try {
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: [
          'content/automation-core.js',
          'content/ui-manager.js', 
          'content/question-extractor.js',
          'content/interaction-handler.js',
          'content/observer-manager.js',
          'content.js'
        ]
      });
      
      // Small delay to ensure scripts are loaded
      setTimeout(() => {
        chrome.tabs.sendMessage(tab.id, {
          action: 'extensionActivated',
          config: config
        });
      }, 500);
      
    } catch (error) {
      console.error('Failed to inject content script:', error);
      throw error;
    }
  }

  deactivateExtension(storageManager) {
    storageManager.setInactive();
    
    if (this.currentTab || currentTab) {
      const tabId = (this.currentTab || currentTab).id;
      chrome.tabs.sendMessage(tabId, {
        action: 'extensionDeactivated'
      });
    }
  }

  async captureScreenshot() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
  }
}

// Initialize modules
const storageManager = new StorageManager();
const tabManager = new TabManager();
const aiAnalyzer = new AIAnalyzer();

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Test Assistant for Sri Chaitanya Meta installed');
});

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'activateExtension':
      activateExtension(request.data)
        .then(() => sendResponse({ success: true }))
        .catch(error => {
          console.error('Activation failed:', error);
          sendResponse({ success: false, error: error.message });
        });
      return true; // Keep message channel open for async response
    
    case 'deactivateExtension':
      deactivateExtension();
      sendResponse({ success: true });
      break;
    
    case 'analyzeQuestion':
      aiAnalyzer.analyzeQuestion(request.data)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    
    case 'captureScreenshot':
      tabManager.captureScreenshot()
        .then(dataUrl => sendResponse({ success: true, data: dataUrl }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    
    case 'saveSettings':
      storageManager.saveSettings(request.data)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    
    case 'loadSettings':
      storageManager.loadSettings()
        .then(settings => sendResponse({ success: true, data: settings }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

async function activateExtension(config) {
  isExtensionActive = true;
  await tabManager.activateExtension(config, storageManager);
}

function deactivateExtension() {
  isExtensionActive = false;
  tabManager.deactivateExtension(storageManager);
}
