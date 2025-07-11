
// Standalone popup script for Chrome extension
const { useState, useEffect } = React;

function ExtensionPopup() {
  const [isActive, setIsActive] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [autoProcess, setAutoProcess] = useState(true);
  const [autoNext, setAutoNext] = useState(false);
  const [delay, setDelay] = useState(3000);
  const [status, setStatus] = useState('Inactive');
  const [currentTab, setCurrentTab] = useState(null);

  useEffect(() => {
    loadSettings();
    checkCurrentTab();
  }, []);

  const checkCurrentTab = async () => {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      setCurrentTab(tab);
    } catch (error) {
      console.error('Failed to get current tab:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const result = await chrome.storage.local.get([
        'apiKey', 'isActive', 'aiTestAssistantSettings'
      ]);
      
      if (result.aiTestAssistantSettings) {
        const settings = result.aiTestAssistantSettings;
        setApiKey(settings.apiKey || '');
        setAutoProcess(settings.autoProcess ?? true);
        setAutoNext(settings.autoNext ?? false);
        setDelay(settings.delay ?? 3000);
      }
      
      setIsActive(result.isActive || false);
      setStatus(result.isActive ? 'Active' : 'Inactive');
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        apiKey,
        autoProcess,
        autoNext,
        delay,
        isActive: false
      };
      
      await chrome.storage.local.set({
        aiTestAssistantSettings: settings,
        apiKey: apiKey
      });
      
      showToast('Settings saved successfully!', 'success');
    } catch (error) {
      console.error('Failed to save settings:', error);
      showToast('Failed to save settings', 'error');
    }
  };

  const toggleExtension = async () => {
    if (!apiKey.trim()) {
      showToast('Please enter your Gemini API key first', 'error');
      return;
    }

    if (currentTab && !currentTab.url?.includes('srichaitanyameta.com')) {
      showToast('This extension only works on srichaitanyameta.com', 'error');
      return;
    }

    try {
      if (isActive) {
        const response = await sendMessageToBackground({ action: 'deactivateExtension' });
        if (response.success) {
          setIsActive(false);
          setStatus('Inactive');
          showToast('Extension deactivated', 'success');
        }
      } else {
        const config = { apiKey, autoProcess, autoNext, delay };
        const response = await sendMessageToBackground({
          action: 'activateExtension',
          data: config
        });
        
        if (response.success) {
          setIsActive(true);
          setStatus('Active');
          await saveSettings();
          showToast('Extension activated successfully!', 'success');
        }
      }
    } catch (error) {
      console.error('Toggle extension error:', error);
      showToast(error.message, 'error');
    }
  };

  const sendMessageToBackground = async (message) => {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage(message, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ success: false, error: chrome.runtime.lastError.message });
        } else {
          resolve(response || { success: false, error: 'No response' });
        }
      });
    });
  };

  const testApiKey = async () => {
    if (!apiKey.trim()) {
      showToast('Please enter your Gemini API key', 'error');
      return;
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hello" }] }]
        })
      });

      if (response.ok) {
        showToast('API Key is valid ✅', 'success');
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Invalid API key');
      }
    } catch (error) {
      showToast(`API Key Invalid ❌: ${error.message}`, 'error');
    }
  };

  const showToast = (message, type) => {
    const toast = document.createElement('div');
    toast.className = `fixed top-4 right-4 p-3 rounded-lg text-white z-50 ${
      type === 'success' ? 'bg-green-500' : 'bg-red-500'
    }`;
    toast.textContent = message;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
  };

  const isOnCorrectWebsite = currentTab?.url?.includes('srichaitanyameta.com');

  return React.createElement('div', {
    className: 'w-full h-full bg-gradient-to-br from-blue-50 to-indigo-100 p-4'
  }, [
    React.createElement('div', {
      key: 'header',
      className: 'bg-white rounded-lg shadow-lg p-4 mb-4'
    }, [
      React.createElement('h1', {
        key: 'title',
        className: 'text-xl font-bold text-gray-800 mb-2'
      }, '🤖 Sri Chaitanya AI Assistant'),
      React.createElement('div', {
        key: 'status',
        className: `inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
          isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
        }`
      }, status),
      React.createElement('div', {
        key: 'website-status',
        className: 'mt-2 text-sm'
      }, [
        React.createElement('span', {
          key: 'website-icon',
          className: isOnCorrectWebsite ? 'text-green-600' : 'text-orange-600'
        }, isOnCorrectWebsite ? '✅' : '⚠️'),
        React.createElement('span', {
          key: 'website-text',
          className: 'ml-2'
        }, isOnCorrectWebsite ? 'srichaitanyameta.com' : 'Wrong website')
      ])
    ]),
    
    React.createElement('div', {
      key: 'content',
      className: 'bg-white rounded-lg shadow-lg p-4 space-y-4'
    }, [
      React.createElement('div', {
        key: 'api-key-section',
        className: 'space-y-2'
      }, [
        React.createElement('label', {
          key: 'api-key-label',
          className: 'block text-sm font-medium text-gray-700'
        }, 'Gemini API Key'),
        React.createElement('div', {
          key: 'api-key-input-group',
          className: 'flex gap-2'
        }, [
          React.createElement('input', {
            key: 'api-key-input',
            type: 'password',
            placeholder: 'Enter your Gemini API key',
            value: apiKey,
            onChange: (e) => setApiKey(e.target.value),
            className: 'flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          }),
          React.createElement('button', {
            key: 'test-button',
            onClick: testApiKey,
            className: 'px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500'
          }, 'Test')
        ]),
        React.createElement('p', {
          key: 'api-key-help',
          className: 'text-xs text-gray-600'
        }, [
          'Get your free API key from ',
          React.createElement('a', {
            key: 'api-link',
            href: 'https://ai.google.dev/',
            target: '_blank',
            rel: 'noopener noreferrer',
            className: 'text-blue-600 underline'
          }, 'Google AI Studio')
        ])
      ]),

      React.createElement('div', {
        key: 'settings-section',
        className: 'space-y-3'
      }, [
        React.createElement('div', {
          key: 'auto-process',
          className: 'flex items-center justify-between'
        }, [
          React.createElement('label', {
            key: 'auto-process-label',
            className: 'text-sm font-medium text-gray-700'
          }, 'Auto-process questions'),
          React.createElement('input', {
            key: 'auto-process-input',
            type: 'checkbox',
            checked: autoProcess,
            onChange: (e) => setAutoProcess(e.target.checked),
            className: 'w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500'
          })
        ]),
        React.createElement('div', {
          key: 'auto-next',
          className: 'flex items-center justify-between'
        }, [
          React.createElement('label', {
            key: 'auto-next-label',
            className: 'text-sm font-medium text-gray-700'
          }, 'Auto-advance to next'),
          React.createElement('input', {
            key: 'auto-next-input',
            type: 'checkbox',
            checked: autoNext,
            onChange: (e) => setAutoNext(e.target.checked),
            className: 'w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500'
          })
        ]),
        React.createElement('div', {
          key: 'delay-section',
          className: 'space-y-2'
        }, [
          React.createElement('label', {
            key: 'delay-label',
            className: 'block text-sm font-medium text-gray-700'
          }, 'Delay between actions (ms)'),
          React.createElement('input', {
            key: 'delay-input',
            type: 'number',
            value: delay,
            onChange: (e) => setDelay(parseInt(e.target.value) || 3000),
            min: 1000,
            max: 10000,
            step: 500,
            className: 'w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500'
          })
        ])
      ]),

      React.createElement('div', {
        key: 'actions',
        className: 'space-y-2'
      }, [
        React.createElement('button', {
          key: 'toggle-button',
          onClick: toggleExtension,
          disabled: !isOnCorrectWebsite,
          className: `w-full px-4 py-2 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 ${
            isActive 
              ? 'bg-red-600 hover:bg-red-700 text-white focus:ring-red-500' 
              : 'bg-green-600 hover:bg-green-700 text-white focus:ring-green-500'
          } ${!isOnCorrectWebsite ? 'opacity-50 cursor-not-allowed' : ''}`
        }, isActive ? 'Deactivate Assistant' : 'Activate Assistant'),
        React.createElement('button', {
          key: 'save-button',
          onClick: saveSettings,
          className: 'w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500'
        }, 'Save Settings')
      ]),

      React.createElement('div', {
        key: 'warning',
        className: 'bg-yellow-50 border border-yellow-200 rounded-lg p-3'
      }, [
        React.createElement('p', {
          key: 'warning-text',
          className: 'text-sm text-yellow-800'
        }, [
          React.createElement('strong', { key: 'warning-title' }, 'Educational Use Only: '),
          'This extension is for educational purposes. Use responsibly and in accordance with your institution\'s policies.'
        ])
      ])
    ])
  ]);
}

ReactDOM.render(React.createElement(ExtensionPopup), document.getElementById('root'));
