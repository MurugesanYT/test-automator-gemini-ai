
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bot, Settings, Activity, Globe, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ExtensionResponse {
  success: boolean;
  error?: string;
  data?: any;
}

interface ExtensionConfig {
  autoProcess: boolean;
  autoNext: boolean;
  delay: number;
  confidence: number;
  apiKey: string;
}

export const ExtensionPopup = () => {
  const [isActive, setIsActive] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [config, setConfig] = useState<ExtensionConfig>({
    autoProcess: true,
    autoNext: false,
    delay: 3000,
    confidence: 0.8,
    apiKey: ''
  });
  const [status, setStatus] = useState('Inactive');
  const [isLoading, setIsLoading] = useState(true);
  const [currentTab, setCurrentTab] = useState<chrome.tabs.Tab | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
    checkCurrentTab();
  }, []);

  const checkCurrentTab = async () => {
    try {
      if (typeof chrome !== 'undefined' && chrome.tabs) {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        setCurrentTab(tab);
      }
    } catch (error) {
      console.error('Failed to get current tab:', error);
    }
  };

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      
      if (typeof chrome !== 'undefined' && chrome.storage) {
        // Load from Chrome storage
        const result = await chrome.storage.local.get([
          'apiKey', 'config', 'isActive', 'aiTestAssistantSettings'
        ]);
        
        if (result.aiTestAssistantSettings) {
          const settings = result.aiTestAssistantSettings;
          setApiKey(settings.apiKey || '');
          setConfig({
            autoProcess: settings.autoProcess ?? true,
            autoNext: settings.autoNext ?? false,
            delay: settings.delay ?? 3000,
            confidence: settings.confidence ?? 0.8,
            apiKey: settings.apiKey || ''
          });
        } else if (result.apiKey || result.config) {
          // Legacy support
          setApiKey(result.apiKey || '');
          setConfig(prev => ({ ...prev, ...result.config }));
        }
        
        setIsActive(result.isActive || false);
      } else {
        // Fallback to localStorage for development
        const stored = localStorage.getItem('aiTestAssistantSettings');
        if (stored) {
          const settings = JSON.parse(stored);
          setApiKey(settings.apiKey || '');
          setConfig(settings);
          setIsActive(settings.isActive || false);
        }
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
      toast({
        title: "Warning",
        description: "Failed to load saved settings.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        apiKey,
        ...config,
        isActive: false // Always save as inactive
      };
      
      if (typeof chrome !== 'undefined' && chrome.storage) {
        // Save to Chrome storage
        await chrome.storage.local.set({
          aiTestAssistantSettings: settings,
          apiKey: apiKey,
          config: settings
        });
      } else {
        // Fallback to localStorage
        localStorage.setItem('aiTestAssistantSettings', JSON.stringify(settings));
      }
      
      toast({
        title: "Settings Saved",
        description: "Your configuration has been saved permanently.",
      });
    } catch (error) {
      console.error('Failed to save settings:', error);
      toast({
        title: "Error",
        description: "Failed to save settings.",
        variant: "destructive",
      });
    }
  };

  const toggleExtension = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Gemini API key first.",
        variant: "destructive",
      });
      return;
    }

    // Check if we're on the correct website
    if (currentTab && !currentTab.url?.includes('srichaitanyameta.com')) {
      toast({
        title: "Wrong Website",
        description: "This extension only works on srichaitanyameta.com",
        variant: "destructive",
      });
      return;
    }

    try {
      if (isActive) {
        // Deactivate extension
        const response = await sendMessageToBackground({ action: 'deactivateExtension' });
        if (response.success) {
          setIsActive(false);
          setStatus('Inactive');
          
          toast({
            title: "Extension Deactivated",
            description: "AI Test Assistant has been turned off.",
          });
        } else {
          throw new Error(response.error || 'Deactivation failed');
        }
      } else {
        // Activate extension
        const extensionConfig = { apiKey, ...config };
        const response = await sendMessageToBackground({
          action: 'activateExtension',
          data: extensionConfig
        });
        
        if (response.success) {
          setIsActive(true);
          setStatus('Active');
          
          // Save settings on successful activation
          await saveSettings();
          
          toast({
            title: "Extension Activated",
            description: "AI Test Assistant is now monitoring the test page.",
          });
        } else {
          throw new Error(response.error || 'Activation failed');
        }
      }
    } catch (error) {
      console.error('Toggle extension error:', error);
      toast({
        title: "Error",
        description: (error as Error).message,
        variant: "destructive",
      });
    }
  };

  const sendMessageToBackground = async (message: any): Promise<ExtensionResponse> => {
    if (typeof chrome !== 'undefined' && chrome.runtime) {
      return new Promise((resolve) => {
        chrome.runtime.sendMessage(message, (response) => {
          if (chrome.runtime.lastError) {
            resolve({ success: false, error: chrome.runtime.lastError.message });
          } else {
            resolve(response || { success: false, error: 'No response' });
          }
        });
      });
    } else {
      // Demo mode
      return new Promise((resolve) => {
        setTimeout(() => {
          resolve({ success: true });
        }, 500);
      });
    }
  };

  const testApiKey = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "API Key Required",
        description: "Please enter your Gemini API key.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Test API key with the correct model
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hello" }] }]
        })
      });

      if (response.ok) {
        toast({
          title: "API Key Valid ✅",
          description: "Your Gemini API key is working correctly.",
        });
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Invalid API key');
      }
    } catch (error) {
      toast({
        title: "API Key Invalid ❌",
        description: `Please check your Gemini API key. ${(error as Error).message}`,
        variant: "destructive",
      });
    }
  };

  const isOnCorrectWebsite = currentTab?.url?.includes('srichaitanyameta.com');

  if (isLoading) {
    return (
      <div className="w-96 h-[500px] bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-96 h-[500px] bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            Sri Chaitanya AI Assistant
            <Badge variant={isActive ? "default" : "secondary"} className="ml-auto">
              {status}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2 text-sm">
            <Globe className="h-4 w-4" />
            <span className={isOnCorrectWebsite ? "text-green-600" : "text-orange-600"}>
              {isOnCorrectWebsite ? "✅ srichaitanyameta.com" : "⚠️ Wrong website"}
            </span>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <Tabs defaultValue="control" className="h-[350px]">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="control">Control</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>
            
            <TabsContent value="control" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apiKey">Gemini API Key</Label>
                  <div className="flex gap-2">
                    <Input
                      id="apiKey"
                      type="password"
                      placeholder="Enter your Gemini API key"
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={testApiKey}
                      variant="outline"
                      size="sm"
                    >
                      Test
                    </Button>
                  </div>
                  <p className="text-xs text-gray-600">
                    Get your free API key from <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Google AI Studio</a>
                  </p>
                </div>

                {!isOnCorrectWebsite && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-600 mt-0.5" />
                      <div className="text-sm text-orange-800">
                        <p className="font-medium">Wrong Website</p>
                        <p>Please navigate to srichaitanyameta.com to use this extension.</p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <Shield className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Educational Use Only</p>
                      <p>This extension is for educational purposes. Use responsibly and in accordance with your institution's policies.</p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Auto-process questions</Label>
                    <Switch
                      checked={config.autoProcess}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, autoProcess: checked }))
                      }
                    />
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Label>Auto-advance to next</Label>
                    <Switch
                      checked={config.autoNext}
                      onCheckedChange={(checked) => 
                        setConfig(prev => ({ ...prev, autoNext: checked }))
                      }
                    />
                  </div>
                </div>

                <Button 
                  onClick={toggleExtension}
                  className={`w-full ${isActive ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}`}
                  disabled={!isOnCorrectWebsite}
                >
                  {isActive ? 'Deactivate Assistant' : 'Activate Assistant'}
                </Button>
              </div>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="delay">Delay between actions (ms)</Label>
                  <Input
                    id="delay"
                    type="number"
                    value={config.delay}
                    onChange={(e) => 
                      setConfig(prev => ({ ...prev, delay: parseInt(e.target.value) || 3000 }))
                    }
                    min="1000"
                    max="10000"
                    step="500"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confidence">Minimum confidence threshold</Label>
                  <Input
                    id="confidence"
                    type="number"
                    value={config.confidence}
                    onChange={(e) => 
                      setConfig(prev => ({ ...prev, confidence: parseFloat(e.target.value) || 0.8 }))
                    }
                    min="0.1"
                    max="1.0"
                    step="0.1"
                  />
                </div>

                <Button onClick={saveSettings} className="w-full">
                  <Settings className="h-4 w-4 mr-2" />
                  Save Settings Permanently
                </Button>

                <div className="text-xs text-gray-600 space-y-2">
                  <p><strong>Features:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Automatic question detection</li>
                    <li>AI-powered answer selection (Gemini 1.5 Flash)</li>
                    <li>Popup handling</li>
                    <li>Navigation assistance</li>
                    <li>Persistent settings storage</li>
                    <li>Sri Chaitanya Meta optimized</li>
                  </ul>
                  
                  <p className="pt-2"><strong>Storage:</strong> All settings are saved permanently in browser storage.</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
