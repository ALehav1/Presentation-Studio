// src/features/ai-premium/components/OpenAIProcessor.tsx
// Production-ready OpenAI processor with bulletproof JSON parsing

import { useState, useRef } from 'react';
import { usePresentationStore } from '../../../core/store/presentation';
import { OpenAIService, type SlideAnalysis, type ScriptMatch, type Coaching } from '../../../services/openai-service-production';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Input } from '../../../components/ui/input';
import { Badge } from '../../../components/ui/badge';
import { 
  Brain, 
  Key, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Eye,
  Target,
  MessageSquare,
  DollarSign,
  Sparkles
} from 'lucide-react';

interface ProcessingResults {
  slideAnalyses: SlideAnalysis[];
  scriptMatches: ScriptMatch[];
  coaching: Coaching[];
  processingTime: number;
  estimatedCost: number;
}

/**
 * OpenAIProcessor - Production-ready AI processor with strict JSON responses
 * Eliminates Claude's JSON parsing hell with OpenAI's Responses API
 */
export const OpenAIProcessor = () => {
  const { currentPresentation, updateSlideScript } = usePresentationStore();
  const [apiKey, setApiKey] = useState(localStorage.getItem('openai_api_key') || '');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ProcessingResults | null>(null);
  const [progress, setProgress] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'testing' | 'connected' | 'failed'>('unknown');
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps] = useState(3);
  const startTimeRef = useRef<number>(0);

  const slides = currentPresentation?.slides || [];
  const hasScript = Boolean(currentPresentation?.fullScript);
  
  // Initialize OpenAI service with API key
  const openaiService = new OpenAIService({
    apiKey: apiKey || undefined,
    visionModel: "gpt-4o-mini",    // Cost-effective vision
    textModel: "gpt-4.1-mini",     // Latest text model
    hardTokenCap: 2048,
    temperature: 0.2
  });

  /**
   * Test OpenAI connection
   */
  const testConnection = async () => {
    if (!apiKey.trim()) {
      alert('Please enter your OpenAI API key first');
      return;
    }

    setConnectionStatus('testing');
    setProgress('Testing OpenAI connection...');
    
    try {
      console.log('🔗 Testing OpenAI connection...');
      
      // Simple test call
      const testService = new OpenAIService({ apiKey });
      const response = await testService.client.chat.completions.create({
        model: "gpt-4o-mini",
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Test connection' }]
      });

      if (response.choices?.[0]?.message?.content) {
        console.log('✅ OpenAI connection successful');
        setConnectionStatus('connected');
        setProgress('Connection successful!');
        
        // Save API key
        localStorage.setItem('openai_api_key', apiKey);
        
        setTimeout(() => setProgress(''), 2000);
      } else {
        throw new Error('No response received');
      }
    } catch (error: any) {
      console.error('❌ OpenAI connection failed:', error);
      setConnectionStatus('failed');
      setProgress(`Connection failed: ${error?.message || 'Unknown error'}`);
    }
  };

  /**
   * Process presentation with OpenAI - the main magic
   */
  const processPresentation = async () => {
    if (!apiKey.trim()) {
      alert('Please enter your OpenAI API key first');
      return;
    }

    if (slides.length === 0) {
      alert('No slides found. Please upload a presentation first.');
      return;
    }

    if (!hasScript) {
      alert('No script found. Please add your presentation script first.');
      return;
    }

    setProcessing(true);
    setCurrentStep(0);
    startTimeRef.current = Date.now();

    try {
      console.log('🎯 Starting OpenAI presentation processing...');
      const service = new OpenAIService({ apiKey });

      // Step 1: Analyze all slide images with Vision API
      setCurrentStep(1);
      setProgress(`Analyzing ${slides.length} slides with OpenAI Vision...`);
      
      const slideAnalysisPromises = slides.map(async (slide, index) => {
        console.log(`🔍 OpenAI analyzing slide ${index + 1}...`);
        
        // Convert slide image to base64 data URL
        const imageDataUrl = `data:image/png;base64,${slide.imageBase64}`;
        
        const result = await service.analyzeSlideWithVision(imageDataUrl, index + 1);
        
        if (result.success) {
          console.log(`✅ Slide ${index + 1} analyzed:`, result.analysis.mainTopic);
          return result.analysis;
        } else {
          console.warn(`⚠️ Slide ${index + 1} analysis failed, using fallback`);
          return service.getDefaultSlideAnalysis(index + 1);
        }
      });

      const slideAnalyses = await Promise.all(slideAnalysisPromises);
      console.log('🎉 All slide analyses complete');

      // Step 2: Match script to slides intelligently
      setCurrentStep(2);
      setProgress('Matching script to slides with AI intelligence...');
      
      const scriptMatchResult = await service.matchScriptToSlidesIntelligently(
        slideAnalyses,
        currentPresentation!.fullScript!
      );

      let scriptMatches: ScriptMatch[] = [];
      if (scriptMatchResult.success) {
        scriptMatches = scriptMatchResult.matches;
        console.log('🎯 Script matching successful');
      } else {
        console.warn('⚠️ Script matching failed, using semantic fallback');
        // Fallback to semantic splitting
        const fallbackSections = service.fallbackSemanticSplit(
          currentPresentation!.fullScript!, 
          slides.length
        );
        scriptMatches = fallbackSections.map((section, i) => ({
          slideNumber: i + 1,
          scriptSection: section,
          confidence: 70,
          reasoning: 'Semantic fallback - OpenAI matching failed',
          keyAlignment: []
        }));
      }

      // Step 3: Generate expert coaching for each slide
      setCurrentStep(3);
      setProgress('Generating expert coaching with AI...');
      
      const coachingPromises = slideAnalyses.map(async (analysis, index) => {
        const scriptSection = scriptMatches[index]?.scriptSection || '';
        const result = await service.generateExpertCoaching(analysis, scriptSection);
        
        if (result.success) {
          return result.coaching;
        } else {
          // Fallback coaching
          return {
            openingStrategy: 'Present with confidence',
            keyEmphasisPoints: [analysis.mainTopic],
            bodyLanguageTips: ['Stand tall', 'Make eye contact'],
            voiceModulation: ['Speak clearly', 'Vary your pace'],
            audienceEngagement: ['Ask questions', 'Use gestures'],
            transitionToNext: 'Move smoothly to the next point',
            timingRecommendation: '60 seconds',
            potentialQuestions: [`Questions about ${analysis.mainTopic}`],
            commonMistakes: ['Speaking too fast', 'Avoiding eye contact'],
            energyLevel: 'medium' as const
          };
        }
      });

      const coaching = await Promise.all(coachingPromises);

      // Apply script sections to slides
      scriptMatches.forEach(match => {
        updateSlideScript(slides[match.slideNumber - 1].id, match.scriptSection);
      });

      const processingTime = (Date.now() - startTimeRef.current) / 1000;
      const estimatedCost = calculateEstimatedCost(slides.length, currentPresentation!.fullScript!.length);

      setResults({
        slideAnalyses,
        scriptMatches,
        coaching,
        processingTime,
        estimatedCost
      });

      setProgress(`Processing complete! ${slides.length} slides processed in ${processingTime.toFixed(1)}s`);
      console.log('🎉 OpenAI processing complete:', {
        slideAnalyses: slideAnalyses.length,
        scriptMatches: scriptMatches.length,
        coaching: coaching.length,
        processingTime,
        estimatedCost
      });

    } catch (error: any) {
      console.error('❌ OpenAI processing failed:', error);
      setProgress(`Processing failed: ${error?.message || 'Unknown error'}`);
    } finally {
      setProcessing(false);
      setCurrentStep(0);
    }
  };

  /**
   * Estimate OpenAI API cost
   */
  const calculateEstimatedCost = (slideCount: number, scriptLength: number): number => {
    // Rough estimates based on gpt-4o-mini pricing
    const tokensPerSlide = 1000; // Image + prompt + response
    const scriptTokens = Math.ceil(scriptLength / 4); // ~4 chars per token
    const coachingTokensPerSlide = 500;
    
    const totalTokens = (slideCount * tokensPerSlide) + scriptTokens + (slideCount * coachingTokensPerSlide);
    
    // gpt-4o-mini rough pricing: $0.15/1M input + $0.60/1M output tokens
    const inputCost = (totalTokens * 0.7) * (0.15 / 1000000); // 70% input
    const outputCost = (totalTokens * 0.3) * (0.60 / 1000000); // 30% output
    
    return Number((inputCost + outputCost).toFixed(4));
  };

  const canProcess = slides.length > 0 && hasScript && apiKey.trim() && !processing;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">OpenAI Processing</h2>
            <p className="text-muted-foreground">
              Production-ready AI with bulletproof JSON parsing
            </p>
          </div>
        </div>

        {/* API Key Input */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Key className="h-4 w-4" />
                <label className="text-sm font-medium">OpenAI API Key</label>
              </div>
              <Input
                type="password"
                placeholder="sk-..."
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono"
              />
            </div>
            <div className="flex flex-col justify-end">
              <Button 
                onClick={testConnection}
                disabled={!apiKey.trim() || connectionStatus === 'testing'}
                variant="outline"
                size="sm"
                className="h-10"
              >
                {connectionStatus === 'testing' ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Testing...
                  </>
                ) : connectionStatus === 'connected' ? (
                  <>
                    <CheckCircle className="h-4 w-4 text-green-500 mr-2" />
                    Connected
                  </>
                ) : connectionStatus === 'failed' ? (
                  <>
                    <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                    Failed
                  </>
                ) : (
                  'Test Connection'
                )}
              </Button>
            </div>
          </div>

          {progress && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm">{progress}</p>
            </div>
          )}
        </div>
      </Card>

      {/* Processing Controls */}
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">AI Processing Pipeline</h3>
              <p className="text-sm text-muted-foreground">
                {slides.length} slides • {hasScript ? 'Script ready' : 'No script'} • OpenAI powered
              </p>
            </div>
            
            <Button
              onClick={processPresentation}
              disabled={!canProcess}
              size="lg"
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
            >
              {processing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  Processing Step {currentStep}/{totalSteps}
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 mr-2" />
                  Process with OpenAI
                </>
              )}
            </Button>
          </div>

          {/* Processing Steps */}
          <div className="grid grid-cols-3 gap-4">
            <div className={`p-3 rounded-lg border ${currentStep === 1 ? 'border-blue-500 bg-blue-50' : currentStep > 1 ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4" />
                <span className="text-sm font-medium">Vision Analysis</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Extract slide content</p>
            </div>

            <div className={`p-3 rounded-lg border ${currentStep === 2 ? 'border-blue-500 bg-blue-50' : currentStep > 2 ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                <span className="text-sm font-medium">Script Matching</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">AI-powered alignment</p>
            </div>

            <div className={`p-3 rounded-lg border ${currentStep === 3 ? 'border-blue-500 bg-blue-50' : currentStep > 3 ? 'border-green-500 bg-green-50' : 'border-gray-200'}`}>
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span className="text-sm font-medium">Expert Coaching</span>
              </div>
              <p className="text-xs text-muted-foreground mt-1">Presentation tips</p>
            </div>
          </div>
        </div>
      </Card>

      {/* Results */}
      {results && (
        <Card className="p-6">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-green-500" />
              <h3 className="text-lg font-semibold">Processing Complete</h3>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{results.slideAnalyses.length}</div>
                <div className="text-sm text-muted-foreground">Slides Analyzed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{results.scriptMatches.length}</div>
                <div className="text-sm text-muted-foreground">Matches Created</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{results.coaching.length}</div>
                <div className="text-sm text-muted-foreground">Coaching Generated</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{results.processingTime.toFixed(1)}s</div>
                <div className="text-sm text-muted-foreground">Processing Time</div>
              </div>
            </div>

            <div className="flex items-center gap-2 justify-center pt-4 border-t">
              <DollarSign className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                Estimated cost: ${results.estimatedCost.toFixed(4)}
              </span>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};
