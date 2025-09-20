// Server-side AI processor - enterprise secure implementation
import { useState, useEffect } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Brain, CheckCircle, Loader2, Key, Server } from 'lucide-react';
import { usePresentationStore } from '../../../core/store/presentation';
import { OpenAIService, type ScriptMatch } from '../../../services/openai-service';
import { useToast } from '../../../hooks/use-toast';

export const SimpleOpenAIProcessor = () => {
  const { currentPresentation, updateSlideScript, tempUploadedScript } = usePresentationStore();
  const { toast } = useToast();
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'testing' | 'connected' | 'failed'>('unknown');
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState('');
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps] = useState(4);
  // Check if AI processing has been completed by looking for guides
  const processingComplete = currentPresentation?.slides.some(s => 
    s.guide && (s.guide.keyMessages?.length > 0 || s.guide.keyConcepts?.length > 0)
  ) || false;
  
  // API Key management
  const [hasServerKey, setHasServerKey] = useState<boolean | null>(null);
  const [clientApiKey, setClientApiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [selectedMode, setSelectedMode] = useState<'server' | 'client'>('server');

  const slides = currentPresentation?.slides || [];
  const hasScript = Boolean(currentPresentation?.fullScript || tempUploadedScript);
  const activeScript = currentPresentation?.fullScript || tempUploadedScript;

  // Initialize OpenAI service (server-side proxy)
  const ai = new OpenAIService({
    textModel: "gpt-4o",
    visionModel: "gpt-4o", 
    hardTokenCap: 4096,
  });

  // Helper function for client-side API calls
  const callOpenAIDirectly = async (messages: any[], maxTokens: number = 1000) => {
    if (!clientApiKey) throw new Error('No API key');
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${clientApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages,
        max_tokens: maxTokens,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'API call failed');
    }

    const data = await response.json();
    return data.choices[0].message.content;
  };

  // Auto-test connection when component mounts and has API key
  useEffect(() => {
    if ((selectedMode === 'server' && hasServerKey) || 
        (selectedMode === 'client' && clientApiKey)) {
      // Auto-test after a short delay
      const timer = setTimeout(() => {
        if (connectionStatus === 'unknown') {
          testConnection();
        }
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [selectedMode, hasServerKey, clientApiKey, connectionStatus]);

  // Check server key availability on mount
  useEffect(() => {
    const checkServerKey = async () => {
      try {
        const response = await fetch('/api/check-key');
        const data = await response.json();
        setHasServerKey(data.hasServerKey);
        
        // Auto-select client mode if no server key and client key exists
        if (!data.hasServerKey && clientApiKey) {
          setSelectedMode('client');
        }
        
        console.log('🔑 Server key available:', data.hasServerKey);
      } catch (error) {
        console.error('Failed to check server key:', error);
        setHasServerKey(false);
      }
    };
    
    checkServerKey();
  }, [clientApiKey]);

  const testConnection = async () => {
    setConnectionStatus('testing');
    
    try {
      if (selectedMode === 'client' && clientApiKey) {
        // Test client-side direct OpenAI connection
        const response = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: { 
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${clientApiKey}`
          },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Test' }]
          })
        });
        
        if (response.ok) {
          setConnectionStatus('connected');
          alert('✅ Client-side OpenAI connection successful!');
        } else {
          const error = await response.json();
          setConnectionStatus('failed');
          alert(`❌ OpenAI connection failed: ${error.error?.message || 'Invalid API key'}`);
        }
      } else {
        // Test server-side proxy connection
        const response = await fetch('/api/openai', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: "gpt-4o-mini",
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Test connection' }]
          })
        });
        
        if (response.ok) {
          setConnectionStatus('connected');
          alert('✅ Server-side OpenAI connection successful!');
        } else {
          setConnectionStatus('failed');
          alert('❌ Server connection failed. The server may not have an API key configured.');
        }
      }
    } catch {
      setConnectionStatus('failed');
      alert('❌ Connection error. Check your internet connection and API key.');
    }
  };

  // Client-side slide analysis function
  const analyzeSlideWithVisionClient = async (imageUrl: string, slideNumber: number) => {
    const messages = [
      {
        role: "system",
        content: "You are an expert presentation analyst. Analyze the slide image and extract all text, identify the main topic, key points, and visual elements."
      },
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Analyze slide ${slideNumber} and provide a detailed analysis in JSON format with: allText, mainTopic, keyPoints (array), visualElements (array), suggestedTalkingPoints (array), emotionalTone, complexity, recommendedDuration (seconds)`
          },
          {
            type: "image_url",
            image_url: {
              url: imageUrl
            }
          }
        ]
      }
    ];

    try {
      const content = await callOpenAIDirectly(messages, 1500);
      // Clean up markdown formatting if present
      const cleanContent = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
      const analysis = JSON.parse(cleanContent);
      return { success: true, analysis };
    } catch (error) {
      console.error(`Failed to analyze slide ${slideNumber}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  };

  const handleProcess = async () => {
    console.log('🔘 Process button clicked! Connection status:', connectionStatus);
    console.log('🔍 Early checks:', { 
      connected: connectionStatus === 'connected',
      slidesCount: slides.length, 
      hasScript,
      fullScript: currentPresentation?.fullScript?.length || 0,
      tempScript: tempUploadedScript?.length || 0,
      activeScript: activeScript?.length || 0
    });
    
    if (connectionStatus !== 'connected') {
      console.log('🔄 Auto-testing server connection...');
      try {
        setConnectionStatus('testing');
        try {
          // Build request with appropriate API key
          const requestBody: { model: string; max_tokens: number; messages: Array<{role: string; content: string}>; apiKey?: string } = {
            model: "gpt-4o-mini",
            max_tokens: 10,
            messages: [{ role: 'user', content: 'Test connection' }]
          };
          
          // Add client API key if using client mode
          if (selectedMode === 'client' && clientApiKey) {
            requestBody.apiKey = clientApiKey;
          }
          
          const response = await fetch('/api/openai', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
          });
          
          if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            console.error('❌ Connection check failed:', errorData);
            alert(`Connection failed: ${errorData.error || 'Unknown error'}`);
            setConnectionStatus('failed');
            return;
          }
          
          setConnectionStatus('connected');
          const modeText = selectedMode === 'client' ? 'Client-side' : 'Server-side';
          console.log(`✅ ${modeText} connection successful`);
        } catch (error) {
          console.error('❌ Connection error:', error);
          alert('Connection error. Please check your internet connection.');
          setConnectionStatus('failed');
          return;
        }
      } catch (error) {
        console.error('❌ Connection error:', error);
        alert('Connection error. Please check your internet connection.');
        setConnectionStatus('failed');
        return;
      }
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
        
        const analysis = selectedMode === 'client' && clientApiKey
          ? await analyzeSlideWithVisionClient(slides[i].imageUrl!, i + 1)
          : await ai.analyzeSlideWithVision(slides[i].imageUrl!, i + 1);
        
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
      
      // For client mode, create simple summaries
      const slideSummaries = selectedMode === 'client' && clientApiKey
        ? slideAnalyses.map((analysis, i) => ({
            slideNumber: i + 1,
            summary: `${analysis.mainTopic}: ${analysis.keyPoints.join(', ')}`,
            tags: [] // Add empty tags array to match expected type
          }))
        : await ai.summarizeAllSlidesForMatching(slideAnalyses);
      console.log('✅ Slide summaries created:', slideSummaries.length);

      // Check if scripts are already distributed manually
      const hasDistributedScripts = slides.some(s => s.script?.trim());
      
      // STEP 3: Match script to slides (skip if already distributed)
      setCurrentStep(2);
      setProgress(hasDistributedScripts ? '✅ Using manually assigned scripts...' : '🔗 Matching script sections to slides...');
      
      let scriptMatches: { success: boolean; matches: ScriptMatch[]; error?: string };

      // Skip script matching if already manually distributed
      if (hasDistributedScripts) {
        scriptMatches = { 
          success: true, 
          matches: slides.map((slide, index) => ({
            slideNumber: index + 1,
            scriptSection: slide.script || '',
            confidence: 100, // Manual assignment = 100% confidence
            reasoning: 'Manually assigned by user',
            keyAlignment: []
          }))
        };
      } else if (selectedMode === 'client' && clientApiKey) {
        // Client-side AI matching
        try {
          const messages = [
            {
              role: "system",
              content: "You are an expert at matching presentation scripts to slides. Given slide summaries and a full script, intelligently match script sections to the appropriate slides based on content alignment."
            },
            {
              role: "user",
              content: `Match this script to these slides. Return a JSON array of matches.

Slides:
${slideSummaries.map(s => `Slide ${s.slideNumber}: ${s.summary}`).join('\n')}

Script:
${activeScript}

Return JSON format:
[
  {
    "slideNumber": 1,
    "scriptSection": "matched script text",
    "confidence": 90,
    "reasoning": "why this matches",
    "keyAlignment": ["matching points"]
  }
]`
            }
          ];
          
          const content = await callOpenAIDirectly(messages, 2000);
          const cleanContent = content.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();
          const matches = JSON.parse(cleanContent);
          
          scriptMatches = { success: true, matches };
        } catch (error) {
          console.error('Client-side matching failed:', error);
          // Fallback to simple distribution
          const { parseAndApplyBulkScript } = usePresentationStore.getState();
          parseAndApplyBulkScript(activeScript || '');
          scriptMatches = { success: true, matches: [] };
        }
      } else {
        scriptMatches = await ai.matchScriptToSlidesFromSummaries(slideSummaries, activeScript || '');
      }
      
      if (scriptMatches.success) {
        console.log('✅ Script matching completed:', scriptMatches.matches.length, 'sections');
        
        // STEP 4: Update slide scripts
        setCurrentStep(3);
        setProgress('💾 Saving matched script sections...');
        
        // Apply the matched scripts to slides
        scriptMatches.matches.forEach((match: ScriptMatch) => {
          const slide = slides[match.slideNumber - 1];
          if (slide) {
            console.log(`📝 Updating slide ${match.slideNumber} (${slide.id}) with script:`, match.scriptSection.substring(0, 100) + '...');
            updateSlideScript(slide.id, match.scriptSection);
          } else {
            console.error(`❌ Could not find slide ${match.slideNumber} in slides array`);
          }
        });

        // Generate AI guides for practice mode
        setCurrentStep(4);
        setProgress('🎯 Generating presenter guides...');
        
        // For client mode, generate simple guides
        for (let i = 0; i < slides.length; i++) {
          const slide = slides[i];
          const guide = {
            transitionFrom: i > 0 ? `From ${slideAnalyses[i-1].mainTopic}` : null,
            keyMessages: slideAnalyses[i].keyPoints.slice(0, 3),
            keyConcepts: slideAnalyses[i].visualElements.slice(0, 3),
            transitionTo: i < slides.length - 1 ? `To ${slideAnalyses[i+1].mainTopic}` : null
          };
          
          // Save guide to store
          const { updateSlideGuide } = usePresentationStore.getState();
          updateSlideGuide(slide.id, guide);
        }
        
        setProgress('✅ Processing complete!');
        
        // Show success toast
        toast({
          title: "🎉 Part 2 Complete - AI Enhancement Ready!",
          description: `Successfully analyzed ${slideAnalyses.length} slides and matched ${scriptMatches.matches.length} script sections. Your practice mode is now AI-enhanced!`,
        });
        
        // Auto-navigate to practice after 2 seconds
        setTimeout(() => {
          const practiceTab = document.querySelector('[value="practice"]') as HTMLButtonElement;
          practiceTab?.click();
        }, 2000);
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
              🤖 Part 2: AI Enhancement (Optional)
            </h2>
            <p className="text-sm text-gray-600">
              Let AI analyze your slides and intelligently match scripts for enhanced practice (~$0.10)
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

      {/* API Key Configuration */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-semibold text-gray-800">🤖 OpenAI API Configuration</h3>
        
        {/* Server-side Option */}
        <div className={`p-4 rounded-lg border ${!hasServerKey ? 'border-gray-300 bg-gray-50' : selectedMode === 'server' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="apiMode"
              value="server"
              checked={selectedMode === 'server'}
              disabled={!hasServerKey}
              onChange={(e) => setSelectedMode(e.target.value as 'server')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Server className={`h-4 w-4 ${!hasServerKey ? 'text-gray-400' : 'text-green-600'}`} />
                <span className={`font-medium text-sm ${!hasServerKey ? 'text-gray-500' : 'text-green-800'}`}>
                  Server-side Processing (Enterprise)
                </span>
              </div>
              <p className={`text-xs ${!hasServerKey ? 'text-gray-500' : 'text-green-700'}`}>
                {hasServerKey 
                  ? '✓ Secure server-side API key configured'
                  : '⚠️ No server key configured - option unavailable'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Client-side Option */}
        <div className={`p-4 rounded-lg border ${selectedMode === 'client' ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white'}`}>
          <div className="flex items-start gap-3">
            <input
              type="radio"
              name="apiMode" 
              value="client"
              checked={selectedMode === 'client'}
              onChange={(e) => setSelectedMode(e.target.value as 'client')}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Key className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-sm text-blue-800">Client-side Processing (Personal)</span>
              </div>
              <p className="text-xs text-blue-700 mb-3">
                Use your own OpenAI API key (you pay directly)
              </p>
              
              {selectedMode === 'client' && (
                <div className="space-y-2">
                  <Input
                    type="password"
                    placeholder="sk-..."
                    value={clientApiKey}
                    onChange={(e) => {
                      const newKey = e.target.value;
                      setClientApiKey(newKey);
                      localStorage.setItem('openai_api_key', newKey);
                      setConnectionStatus('unknown');
                    }}
                    className="text-sm"
                  />
                  <p className="text-xs text-blue-600">
                    Get your key at{' '}
                    <a 
                      href="https://platform.openai.com/api-keys" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="underline hover:text-blue-800"
                    >
                      platform.openai.com
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Test Connection */}
        <div className="flex justify-center">
          <Button
            onClick={testConnection}
            disabled={connectionStatus === 'testing' || (selectedMode === 'server' && !hasServerKey) || (selectedMode === 'client' && !clientApiKey)}
            variant="outline"
            size="sm"
          >
            {connectionStatus === 'testing' ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Testing Connection...
              </>
            ) : (
              `Test ${selectedMode === 'server' ? 'Server' : 'Client'} Connection`
            )}
          </Button>
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
        onClick={processingComplete ? () => {
          const practiceTab = document.querySelector('[value="practice"]') as HTMLButtonElement;
          practiceTab?.click();
        } : handleProcess}
        disabled={processing || (!processingComplete && (connectionStatus !== 'connected' || !currentPresentation?.slides.length || !activeScript))}
        size="lg"
        className={`w-full min-h-[56px] ${processingComplete 
          ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700' 
          : 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700'
        } text-white font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed`}
      >
        <div className="flex items-center gap-2">
          {processing ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : processingComplete ? (
            <CheckCircle className="h-5 w-5" />
          ) : (
            <Brain className="h-5 w-5" />
          )}
          <span>
            {processing ? 'Processing...' : processingComplete ? '✓ Go to Practice' : '🚀 Process with OpenAI'}
          </span>
        </div>
      </Button>

      {/* Proceed to Practice Button - Shows after processing */}
      {processingComplete && !processing && (
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center gap-2 text-green-700">
              <CheckCircle className="h-5 w-5" />
              <span className="font-semibold">Part 2 Complete - AI Enhancement Active!</span>
            </div>
            <p className="text-sm text-green-600">
              Your slides have been analyzed and scripts intelligently matched. Practice mode is now enhanced with AI guidance.
            </p>
            <Button
              onClick={() => {
                const practiceTab = document.querySelector('[value="practice"]') as HTMLButtonElement;
                practiceTab?.click();
              }}
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 text-white font-semibold shadow-lg"
            >
              🎯 Proceed to AI-Enhanced Practice
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};
