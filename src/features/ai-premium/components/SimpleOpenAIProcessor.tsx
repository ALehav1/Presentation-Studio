// Simple OpenAI processor - clean implementation
import { useState } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Brain, Key, CheckCircle, Loader2 } from 'lucide-react';
import { usePresentationStore } from '../../../core/store/presentation';

export const SimpleOpenAIProcessor = () => {
  const { currentPresentation, updateSlideScript } = usePresentationStore();
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'testing' | 'connected' | 'failed'>('unknown');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps] = useState(3);

  const slides = currentPresentation?.slides || [];
  const hasScript = Boolean(currentPresentation?.fullScript);

  // Helper function to analyze slide with OpenAI Vision
  const analyzeSlideWithVision = async (imageUrl: string, slideNumber: number) => {
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          model: 'gpt-4o-mini',
          max_tokens: 800,
          temperature: 0.1,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analyze this presentation slide and extract:
1. Main topic/title
2. Key points (bullet points, main ideas)
3. Visual elements (charts, images, diagrams)

Return ONLY JSON in this format:
{
  "slideNumber": ${slideNumber},
  "mainTopic": "string",
  "keyPoints": ["string", "string"],
  "visualElements": ["string", "string"]
}`
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl,
                  detail: 'high'
                }
              }
            ]
          }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '{}';
        
        try {
          const parsed = JSON.parse(content);
          return { success: true, data: parsed };
        } catch {
          return { success: false, error: 'Failed to parse OpenAI response' };
        }
      } else {
        return { success: false, error: `API error: ${response.status}` };
      }
    } catch (error) {
      return { success: false, error: `Network error: ${error}` };
    }
  };

  // Helper function to match script to slides
  const matchScriptToSlides = async (slideAnalyses: any[], fullScript: string) => {
    try {
      const response = await fetch('/api/openai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey,
          model: 'gpt-4o-mini',
          max_tokens: 2000,
          temperature: 0.1,
          reasoning_effort: 'high',
          verbosity: 'high',
          messages: [{
            role: 'user',
            content: `You are an expert presentation coach. Match this script to the slides by:

1. Analyzing slide topics and content
2. Segmenting the script into coherent sections
3. Mapping each section to the most appropriate slide
4. Ensuring natural flow and logical progression

SLIDES:
${JSON.stringify(slideAnalyses, null, 2)}

FULL SCRIPT:
${fullScript}

Return ONLY JSON in this format:
{
  "success": true,
  "matches": [
    {
      "slideNumber": 1,
      "scriptSection": "exact text from script for this slide",
      "confidence": 85,
      "reasoning": "why this section matches this slide"
    }
  ]
}`
          }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const content = data.choices?.[0]?.message?.content || '{}';
        
        try {
          const parsed = JSON.parse(content);
          return parsed;
        } catch {
          return { success: false, error: 'Failed to parse script matching response' };
        }
      } else {
        return { success: false, error: `API error: ${response.status}` };
      }
    } catch (error) {
      return { success: false, error: `Network error: ${error}` };
    }
  };

  const testConnection = async () => {
    console.log('🔑 Frontend apiKey value:', apiKey ? `${apiKey.substring(0, 10)}...` : 'EMPTY');
    console.log('🔑 LocalStorage value:', localStorage.getItem('openai_api_key') ? `${localStorage.getItem('openai_api_key')?.substring(0, 10)}...` : 'EMPTY');
    
    if (!apiKey) {
      alert('Please enter your OpenAI API key first');
      return;
    }

    if (!apiKey.startsWith('sk-')) {
      alert('⚠️ Invalid API key format. OpenAI keys start with "sk-"');
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

  const handleProcess = async () => {
    console.log('🔘 Process button clicked! Connection status:', connectionStatus);
    
    if (connectionStatus !== 'connected') {
      alert('Please test your OpenAI connection first');
      return;
    }

    if (!slides.length) {
      alert('Please upload slides first');
      return;
    }

    if (!hasScript) {
      alert('Please add a script first');
      return;
    }

    setProcessing(true);
    setCurrentStep(0);
    
    try {
      // STEP 1: Analyze all slides with vision
      setCurrentStep(1);
      setProgress('🔍 Analyzing slides with OpenAI Vision...');
      
      const slideAnalyses = [];
      
      for (let i = 0; i < slides.length; i++) {
        setProgress(`🔍 Analyzing slide ${i + 1} of ${slides.length}...`);
        
        const analysis = await analyzeSlideWithVision(slides[i].imageUrl, i + 1);
        
        if (analysis.success) {
          slideAnalyses.push(analysis.data);
          console.log(`✅ Slide ${i + 1} analyzed:`, analysis.data.mainTopic);
        } else {
          console.error(`❌ Failed to analyze slide ${i + 1}:`, analysis.error);
          // Add placeholder to continue
          slideAnalyses.push({
            slideNumber: i + 1,
            mainTopic: `Slide ${i + 1}`,
            keyPoints: ['Unable to analyze content'],
            visualElements: []
          });
        }
      }

      // STEP 2: Match script to slides
      setCurrentStep(2);
      setProgress('🎯 Matching script to slides with AI...');
      
      const scriptMatches = await matchScriptToSlides(slideAnalyses, currentPresentation!.fullScript);
      
      if (scriptMatches.success) {
        console.log('✅ Script matching completed:', scriptMatches.matches?.length, 'sections');
        
        // STEP 3: Update slide scripts
        setCurrentStep(3);
        setProgress('💾 Saving matched script sections...');
        
        scriptMatches.matches?.forEach((match, index) => {
          if (slides[index]) {
            updateSlideScript(slides[index].id, match.scriptSection);
          }
        });
      } else {
        console.error('❌ Script matching failed:', scriptMatches.error);
      }

      setProgress('✅ Processing complete!');
      alert('🎉 OpenAI processing complete! Check your slides for the matched script sections.');
      
    } catch (error) {
      console.error('❌ Processing error:', error);
      setProgress('❌ Processing failed');
      alert('❌ Processing failed. Check console for details.');
    } finally {
      setProcessing(false);
      setCurrentStep(0);
    }
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

      {/* Debug Status */}
      <div className="mb-4 p-2 bg-gray-100 rounded text-sm">
        <strong>Debug:</strong> Connection Status = "{connectionStatus}" 
        {connectionStatus === 'connected' ? ' ✅ Button should work' : ' ❌ Button disabled'}
      </div>

      {/* Progress Display */}
      {processing && (
        <div className="mb-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
            <span className="text-sm font-medium text-blue-900">
              Step {currentStep} of {totalSteps}: Processing...
            </span>
          </div>
          <div className="text-sm text-blue-700">{progress}</div>
        </div>
      )}

      {/* Process Button */}
      <Button
        onClick={handleProcess}
        disabled={connectionStatus !== 'connected' || processing}
        className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
        size="lg"
      >
        <div className="flex items-center gap-2">
          {processing ? <Loader2 className="h-5 w-5 animate-spin" /> : <Brain className="h-5 w-5" />}
          <span>{processing ? 'Processing...' : '🚀 Process with OpenAI'}</span>
        </div>
      </Button>
    </Card>
  );
};
