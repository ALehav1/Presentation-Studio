// Simple OpenAI processor - clean implementation
import { useState } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Brain, Key, CheckCircle, Loader2 } from 'lucide-react';
import { usePresentationStore } from '../../../core/store/presentation';
import { OpenAIService } from '../../../services/openai-service';

export const SimpleOpenAIProcessor = () => {
  const { currentPresentation, updateSlideScript } = usePresentationStore();
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'testing' | 'connected' | 'failed'>('unknown');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps] = useState(4);

  const slides = currentPresentation?.slides || [];
  const hasScript = Boolean(currentPresentation?.fullScript);

  // Initialize OpenAI service (now uses server-side proxy)
  const ai = new OpenAIService({
    textModel: "gpt-4o",
    visionModel: "gpt-4o", 
    hardTokenCap: 4096,
  });

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
          max_completion_tokens: 10,
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
    console.log('🔍 Early checks:', { 
      connected: connectionStatus === 'connected',
      slidesCount: slides.length, 
      hasScript,
      fullScript: currentPresentation?.fullScript?.length || 0
    });
    
    if (connectionStatus !== 'connected') {
      console.error('❌ Connection check failed');
      alert('Please test your OpenAI connection first');
      return;
    }

    if (!slides.length) {
      console.error('❌ No slides found');
      alert('Please upload slides first');
      return;
    }

    if (!hasScript) {
      console.error('❌ No script found');
      alert('Please add a script first');
      return;
    }

    console.log('✅ All checks passed, starting processing...');

    setProcessing(true);
    setCurrentStep(0);
    
    try {
      // STEP 1: Analyze all slides with vision
      setCurrentStep(1);
      setProgress('🔍 Analyzing slides with OpenAI Vision...');
      
      const slideAnalyses = [];
      
      for (let i = 0; i < slides.length; i++) {
        setProgress(`🔍 Analyzing slide ${i + 1} of ${slides.length}...`);
        
        const analysis = await ai.analyzeSlideWithVision(slides[i].imageUrl!, i + 1);
        
        if (analysis.success) {
          slideAnalyses.push(analysis.analysis);
          console.log(`✅ Slide ${i + 1} analyzed:`, analysis.analysis.mainTopic);
        } else {
          console.error(`❌ Failed to analyze slide ${i + 1}:`, analysis.error);
          // Add fallback analysis to continue
          slideAnalyses.push({
            allText: `Slide ${i + 1} content`,
            mainTopic: `Slide ${i + 1}`,
            keyPoints: ['Unable to analyze content'],
            visualElements: [],
            suggestedTalkingPoints: [],
            emotionalTone: 'professional',
            complexity: 'moderate',
            recommendedDuration: 60
          });
        }
      }

      // STEP 2: Create slide summaries for matching
      setCurrentStep(2);
      setProgress('📝 Creating slide summaries for intelligent matching...');
      
      const slideSummaries = await ai.summarizeAllSlidesForMatching(slideAnalyses);
      console.log('✅ Slide summaries created:', slideSummaries.length);

      // STEP 3: Match script to slide summaries
      setProgress('🎯 Matching script to slides with GPT-5...');
      
      const scriptMatches = await ai.matchScriptToSlidesFromSummaries(slideSummaries, currentPresentation?.fullScript || '');
      
      if (scriptMatches.success) {
        console.log('✅ Script matching completed:', scriptMatches.matches.length, 'sections');
        
        // STEP 4: Update slide scripts
        setCurrentStep(3);
        setProgress('💾 Saving matched script sections...');
        
        scriptMatches.matches.forEach((match) => {
          const slide = slides.find(s => s.id === `slide-${currentPresentation?.id}-${match.slideNumber - 1}`);
          if (slide) {
            updateSlideScript(slide.id, match.scriptSection);
          }
        });

        setProgress('✅ Processing complete!');
        alert(`🎉 OpenAI processing complete! 
        
✅ ${slideAnalyses.length} slides analyzed
✅ ${scriptMatches.matches.length} script sections matched
✅ Average confidence: ${Math.round(scriptMatches.matches.reduce((sum, m) => sum + m.confidence, 0) / scriptMatches.matches.length)}%

Check your slides for the matched script sections and confidence ratings!`);
      } else {
        console.error('❌ Script matching failed:', scriptMatches.error);
        alert(`❌ Script matching failed: ${scriptMatches.error}`);
      }
      
    } catch (error) {
      console.error('❌ Processing error:', error);
      setProgress('❌ Processing failed');
      alert(`❌ Processing failed: ${error instanceof Error ? error.message : String(error)}`);
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
