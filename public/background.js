
// Background service worker for the Chrome extension
let isExtensionActive = false;
let currentTab = null;

// Listen for extension installation
chrome.runtime.onInstalled.addListener(() => {
  console.log('AI Test Assistant installed');
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
    
    default:
      sendResponse({ success: false, error: 'Unknown action' });
  }
});

async function activateExtension(config) {
  isExtensionActive = true;
  
  // Store configuration
  await chrome.storage.local.set({
    apiKey: config.apiKey,
    isActive: true,
    config: config
  });
  
  // Inject content script into current tab
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  currentTab = tab;
  
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
  
  const prompt = createAnalysisPrompt(questionData);
  
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
    const result = data.candidates[0].content.parts[0].text;
    
    return parseAIResponse(result);
  } catch (error) {
    console.error('AI analysis failed:', error);
    throw error;
  }
}

function createAnalysisPrompt(questionData) {
  return `
You are an expert test-taking AI assistant. Analyze the following multiple choice question and provide the correct answer.

Question: ${questionData.question}

Options:
${questionData.options.map((option, index) => `${String.fromCharCode(65 + index)}) ${option}`).join('\n')}

Please analyze this question carefully and respond with ONLY the letter of the correct answer (A, B, C, or D). 
Do not include any explanation or additional text - just the single letter.

Answer:`;
}

function parseAIResponse(response) {
  // Extract the answer letter from AI response
  const match = response.trim().match(/^[ABCD]/i);
  if (match) {
    return {
      answer: match[0].toUpperCase(),
      confidence: 0.9 // We could implement confidence scoring later
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

async function captureScreenshot() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
}
