
// Background service worker for the Chrome extension
let isExtensionActive = false;
let currentTab = null;

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Test Assistant for Sri Chaitanya Meta installed');
});

// Listen for messages from popup and content scripts
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  switch (request.action) {
    case 'activateExtension':
      activateExtension(request.data);
      sendResponse({ success: true });
      break;
    
    case 'deactivateExtension':
      deactivateExtension();
      sendResponse({ success: true });
      break;
    
    case 'analyzeQuestion':
      analyzeQuestionWithAI(request.data)
        .then(result => sendResponse({ success: true, data: result }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true; // Keep message channel open for async response
    
    case 'captureScreenshot':
      captureScreenshot()
        .then(dataUrl => sendResponse({ success: true, data: dataUrl }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    
    case 'saveSettings':
      saveSettings(request.data)
        .then(() => sendResponse({ success: true }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    
    case 'loadSettings':
      loadSettings()
        .then(settings => sendResponse({ success: true, data: settings }))
        .catch(error => sendResponse({ success: false, error: error.message }));
      return true;
    
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

async function saveSettings(settings) {
  await chrome.storage.local.set({
    aiTestAssistantSettings: settings
  });
}

async function loadSettings() {
  const result = await chrome.storage.local.get(['aiTestAssistantSettings']);
  return result.aiTestAssistantSettings || {};
}

async function activateExtension(config) {
  isExtensionActive = true;
  
  // Store configuration permanently
  await chrome.storage.local.set({
    apiKey: config.apiKey,
    isActive: true,
    config: config,
    aiTestAssistantSettings: config
  });
  
  // Inject content script into current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
  
  // Check if we're on the correct website
  if (!tab.url.includes('srichaitanyameta.com')) {
    throw new Error('This extension only works on srichaitanyameta.com');
  }
  
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content.js']
    });
    
    // Notify content script that extension is active
    chrome.tabs.sendMessage(tab.id, {
      action: 'extensionActivated',
      config: config
    });
  } catch (error) {
    console.error('Failed to inject content script:', error);
    throw error;
  }
}

function deactivateExtension() {
  isExtensionActive = false;
  
  chrome.storage.local.set({ isActive: false });
  
  if (currentTab) {
    chrome.tabs.sendMessage(currentTab.id, {
      action: 'extensionDeactivated'
    });
  }
}

async function analyzeQuestionWithAI(questionData) {
  const { apiKey } = await chrome.storage.local.get(['apiKey']);
  
  if (!apiKey) {
    throw new Error('Gemini API key not configured');
  }
  
  const prompt = createEnhancedAnalysisPrompt(questionData);
  
  try {
    // Use the correct Gemini model
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
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
    
    return parseAIResponse(result);
  } catch (error) {
    console.error('AI analysis failed:', error);
    throw error;
  }
}

function createEnhancedAnalysisPrompt(questionData) {
  return `
You are an expert AI assistant specialized in academic test-taking for Sri Chaitanya Meta educational platform. Your task is to analyze multiple choice questions with maximum accuracy.

QUESTION ANALYSIS:
Question ${questionData.questionNumber}/${questionData.totalQuestions}: ${questionData.question}

ALL AVAILABLE OPTIONS:
${questionData.options.map((option, index) => `${String.fromCharCode(65 + index)}) ${option}`).join('\n')}

INSTRUCTIONS:
1. Read the question completely and understand what is being asked
2. Carefully analyze each option (A, B, C, D) provided above
3. Apply your knowledge in the relevant subject area
4. Consider the context and specific wording of the question
5. Eliminate obviously incorrect options first
6. Choose the most accurate and complete answer

RESPONSE FORMAT:
Provide ONLY the letter of the correct answer (A, B, C, or D).
Do not include any explanation, reasoning, or additional text.
Your response must be a single letter only.

ANSWER:`;
}

function parseAIResponse(response) {
  // Extract the answer letter from AI response
  const cleanResponse = response.trim().toUpperCase();
  const match = cleanResponse.match(/^[ABCD]/);
  if (match) {
    return {
      answer: match[0],
      confidence: 0.95
    };
  }
  
  // Fallback parsing - look for the first valid letter
  const letters = response.match(/[ABCD]/gi);
  if (letters && letters.length > 0) {
    return {
      answer: letters[0].toUpperCase(),
      confidence: 0.8
    };
  }
  
  // Last resort - look for any letter pattern
  const anyLetter = response.match(/\b[A-D]\b/gi);
  if (anyLetter && anyLetter.length > 0) {
    return {
      answer: anyLetter[0].toUpperCase(),
      confidence: 0.6
    };
  }
  
  throw new Error('Could not parse AI response: ' + response);
}

async function captureScreenshot() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
}
