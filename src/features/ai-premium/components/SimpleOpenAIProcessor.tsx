// Simple OpenAI processor - clean implementation
import { useState } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Brain, Key, CheckCircle } from 'lucide-react';

export const SimpleOpenAIProcessor = () => {
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'testing' | 'connected' | 'failed'>('unknown');

  const testConnection = async () => {
    if (!apiKey) {
      alert('Please enter your OpenAI API key first');
      return;
    }

    setConnectionStatus('testing');
    
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          model: "gpt-4o-mini",
          max_tokens: 10,
          messages: [{ role: 'user', content: 'Test connection' }]
        })
      });
      
      if (response.ok) {
        setConnectionStatus('connected');
        alert('✅ OpenAI connection successful!');
      } else {
        setConnectionStatus('failed');
        alert('❌ OpenAI connection failed. Check your API key.');
      }
    } catch {
      setConnectionStatus('failed');
      alert('❌ Connection error. Check your internet connection.');
    }
  };

  const handleProcess = () => {
    if (connectionStatus !== 'connected') {
      alert('Please test your OpenAI connection first');
      return;
    }
    
    alert('🚀 OpenAI processing will be implemented next! Connection is working.');
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50 border-blue-200 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
              🤖 OpenAI GPT-5 - Premium AI Processing  
            </h2>
            <p className="text-sm text-gray-600">
              Transform your presentation with GPT-5 Vision intelligence
            </p>
          </div>
        </div>
      </div>

      {/* Status */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-3 rounded-lg border-2 bg-green-50 border-green-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="font-medium text-sm">Slides: Ready</span>
          </div>
        </div>
        
        <div className={`p-3 rounded-lg border-2 ${connectionStatus === 'connected' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <Key className={`h-4 w-4 ${connectionStatus === 'connected' ? 'text-green-600' : 'text-gray-400'}`} />
            <span className="font-medium text-sm">
              OpenAI: {connectionStatus === 'connected' ? 'Connected' : 'Not connected'}
            </span>
          </div>
        </div>
      </div>

      {/* API Key Setup */}
      <div className="space-y-4 mb-6">
        <div>
          <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-2">
            <Key className="inline h-4 w-4 mr-1" />
            OpenAI API Key
          </label>
          <div className="flex gap-2">
            <Input
              id="api-key"
              type="password"
              placeholder="sk-..."
              value={apiKey}
              onChange={(e) => {
                const newKey = e.target.value;
                setApiKey(newKey);
                localStorage.setItem('openai_api_key', newKey);
                setConnectionStatus('unknown');
              }}
              className="flex-1"
            />
            <Button
              onClick={testConnection}
              disabled={!apiKey || connectionStatus === 'testing'}
              variant="outline"
              size="sm"
            >
              {connectionStatus === 'testing' ? 'Testing...' : 'Test'}
            </Button>
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Get your API key at{' '}
            <a 
              href="https://platform.openai.com/api-keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline text-blue-600 hover:text-blue-800"
            >
              platform.openai.com
            </a>
          </p>
        </div>
      </div>

      {/* Cost Estimate */}
      <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200 mb-6">
        <div className="text-sm text-green-700 space-y-1">
          <p><strong>Estimated Cost:</strong> ~$0.15 per presentation</p>
          <p><strong>Monthly (20 presentations):</strong> ~$3.00</p>
          <p className="text-xs text-green-600">💡 You pay OpenAI directly - no middleman fees!</p>
        </div>
      </div>

      {/* Process Button */}
      <Button
        onClick={handleProcess}
        disabled={connectionStatus !== 'connected'}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
        size="lg"
      >
        <div className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          <span>🚀 Process with OpenAI GPT-5</span>
        </div>
      </Button>
    </Card>
  );
};
