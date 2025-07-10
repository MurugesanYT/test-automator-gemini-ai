
import { ExtensionPopup } from '@/components/ExtensionPopup';

const Index = () => {
  return (
    <div className="min-h-screen bg-gray-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            AI Test Automation Assistant
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            An intelligent Chrome extension that uses AI to automatically analyze test questions 
            and interact with online testing platforms. Built with Gemini AI for accurate question analysis.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-2xl font-semibold mb-4">Extension Preview</h2>
            <p className="text-gray-600 mb-6">
              This is how the Chrome extension popup will look and function:
            </p>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
              <ExtensionPopup />
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Key Features</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <strong>AI Question Analysis:</strong> Uses Gemini AI to analyze questions and determine correct answers
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <strong>Automatic Answer Selection:</strong> Intelligently selects the best answer based on AI analysis
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <strong>Popup Detection:</strong> Automatically handles popups and navigation prompts
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <strong>Smart Navigation:</strong> Automatically advances to next questions when configured
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <strong>Screenshot Capture:</strong> Can capture and analyze visual content when needed
                  </div>
                </li>
              </ul>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Installation Guide</h2>
              <ol className="space-y-2 text-sm">
                <li><strong>1.</strong> Download all the extension files</li>
                <li><strong>2.</strong> Open Chrome and go to chrome://extensions/</li>
                <li><strong>3.</strong> Enable "Developer mode" (top right)</li>
                <li><strong>4.</strong> Click "Load unpacked" and select the extension folder</li>
                <li><strong>5.</strong> Get your Gemini API key from Google AI Studio</li>
                <li><strong>6.</strong> Configure the extension with your API key</li>
                <li><strong>7.</strong> Navigate to your test page and activate the assistant</li>
              </ol>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Important Disclaimer</h3>
              <p className="text-yellow-700 text-sm">
                This extension is created for educational and research purposes only. 
                Users are responsible for ensuring compliance with their institution's 
                academic integrity policies. Use at your own discretion and responsibility.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
