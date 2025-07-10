
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Bot, Settings, Activity } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

export const ExtensionPopup = () => {
  const [isActive, setIsActive] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [config, setConfig] = useState({
    autoProcess: true,
    autoNext: false,
    delay: 3000,
    confidence: 0.8
  });
  const [status, setStatus] = useState('Inactive');
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      // In actual Chrome extension, this would use chrome.storage.local.get
      const stored = localStorage.getItem('aiTestAssistantSettings');
      if (stored) {
        const settings = JSON.parse(stored);
        setApiKey(settings.apiKey || '');
        setConfig(settings.config || config);
        setIsActive(settings.isActive || false);
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const saveSettings = async () => {
    try {
      const settings = {
        apiKey,
        config,
        isActive: false // Always save as inactive
      };
      localStorage.setItem('aiTestAssistantSettings', JSON.stringify(settings));
      
      toast({
        title: "Settings Saved",
        description: "Your configuration has been saved successfully.",
      });
    } catch (error) {
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

    try {
      if (isActive) {
        // Deactivate extension
        await sendMessageToBackground({ action: 'deactivateExtension' });
        setIsActive(false);
        setStatus('Inactive');
        
        toast({
          title: "Extension Deactivated",
          description: "AI Test Assistant has been turned off.",
        });
      } else {
        // Activate extension
        const response = await sendMessageToBackground({
          action: 'activateExtension',
          data: { apiKey, ...config }
        });
        
        if (response.success) {
          setIsActive(true);
          setStatus('Active');
          
          toast({
            title: "Extension Activated",
            description: "AI Test Assistant is now monitoring the test page.",
          });
        } else {
          throw new Error(response.error || 'Activation failed');
        }
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const sendMessageToBackground = async (message: any) => {
    // In actual Chrome extension, this would use chrome.runtime.sendMessage
    // For demo purposes, we'll simulate the response
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve({ success: true });
      }, 500);
    });
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
      // Test API key with a simple request
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: "Hello" }] }]
        })
      });

      if (response.ok) {
        toast({
          title: "API Key Valid",
          description: "Your Gemini API key is working correctly.",
        });
      } else {
        throw new Error('Invalid API key');
      }
    } catch (error) {
      toast({
        title: "API Key Invalid",
        description: "Please check your Gemini API key.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="w-96 h-[500px] bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="h-full">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-blue-600" />
            AI Test Assistant
            <Badge variant={isActive ? "default" : "secondary"} className="ml-auto">
              {status}
            </Badge>
          </CardTitle>
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
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-yellow-600 mt-0.5" />
                    <div className="text-sm text-yellow-800">
                      <p className="font-medium">Important Notice</p>
                      <p>This extension is for educational purposes only. Use responsibly and in accordance with your institution's policies.</p>
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
                  Save Settings
                </Button>

                <div className="text-xs text-gray-600 space-y-2">
                  <p><strong>Features:</strong></p>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Automatic question detection</li>
                    <li>AI-powered answer selection</li>
                    <li>Popup handling</li>
                    <li>Navigation assistance</li>
                    <li>Screenshot capture</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
