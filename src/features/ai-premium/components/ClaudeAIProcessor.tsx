// src/features/ai-premium/components/ClaudeAIProcessor.tsx
// Premium AI processor using Claude Sonnet 3.5 for complete presentation intelligence

import { useState, useRef } from 'react';
import { usePresentationStore } from '../../../core/store/presentation';
import { claudeAI } from '../../../services/claude-ai-service';
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
  slideAnalyses: any[];
  scriptMatches: any[];
  coaching: any[];
  processingTime: number;
  estimatedCost: number;
}

/**
 * ClaudeAIProcessor - Premium component for complete presentation intelligence
 * Transforms blind script allocation into AI-powered presentation coaching
 */
export const ClaudeAIProcessor = () => {
  const { currentPresentation, updateSlideScript } = usePresentationStore();
  const [apiKey, setApiKey] = useState(localStorage.getItem('anthropic_api_key') || '');
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<ProcessingResults | null>(null);
  const [progress, setProgress] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<'unknown' | 'testing' | 'connected' | 'failed'>('unknown');
  const [currentStep, setCurrentStep] = useState(0);
  const [totalSteps] = useState(3);
  const startTimeRef = useRef<number>(0);

  const slides = currentPresentation?.slides || [];
  const hasScript = Boolean(currentPresentation?.fullScript);
  
  /**
   * Test Claude API connection
   */
  const testConnection = async () => {
    setConnectionStatus('testing');
    claudeAI.setApiKey(apiKey);
    
    const result = await claudeAI.testConnection();
    setConnectionStatus(result.connected ? 'connected' : 'failed');
    
    if (!result.connected) {
      console.error('Connection failed:', result.message);
    }
  };

  /**
   * Estimate processing cost based on slides and script length
   */
  const estimateCost = (): number => {
    if (!slides.length) return 0;
    
    // Vision API: ~$0.003 per image
    const visionCost = slides.length * 0.003;
    
    // Text processing: ~$0.003 per 1K tokens
    // Rough estimate: 1000 words ≈ 1300 tokens
    const scriptLength = currentPresentation?.fullScript?.length || 0;
    const textTokens = Math.ceil(scriptLength / 4) + (slides.length * 500); // Script + slide analysis
    const textCost = (textTokens / 1000) * 0.003;
    
    return Math.round((visionCost + textCost) * 100) / 100; // Round to cents
  };

  /**
   * Main processing function - Claude analyzes everything
   */
  const processWithClaude = async () => {
    if (!apiKey) {
      alert('Please add your Anthropic API key first');
      return;
    }

    if (!slides.length) {
      alert('Please upload a presentation first');
      return;
    }

    if (!hasScript) {
      alert('Please add a script to your presentation first');
      return;
    }

    setProcessing(true);
    setCurrentStep(0);
    startTimeRef.current = Date.now();
    
    try {
      claudeAI.setApiKey(apiKey);
      
      // STEP 1: Analyze all slides with Claude's vision
      setCurrentStep(1);
      setProgress('🧠 Claude is reading and analyzing your slides...');
      
      const slideAnalyses: any[] = [];
      
      for (let i = 0; i < slides.length; i++) {
        setProgress(`🔍 Claude analyzing slide ${i + 1} of ${slides.length}...`);
        
        const result = await claudeAI.analyzeSlideWithClaude(
          slides[i].imageUrl, 
          i + 1
        );
        
        if (result.success && result.analysis) {
          slideAnalyses.push(result.analysis);
          console.log(`📄 Slide ${i + 1} analyzed:`, result.analysis.mainTopic);
        } else {
          console.error(`❌ Failed to analyze slide ${i + 1}:`, result.error);
          // Add placeholder analysis to continue
          slideAnalyses.push({
            allText: 'Analysis failed',
            mainTopic: `Slide ${i + 1}`,
            keyPoints: [],
            visualElements: [],
            suggestedTalkingPoints: [],
            emotionalTone: 'unknown',
            complexity: 'moderate',
            recommendedDuration: 90
          });
        }
      }

      // STEP 2: Match script to slides intelligently  
      setCurrentStep(2);
      setProgress('🎯 Claude matching your script to slides with AI reasoning...');
      
      const matchResult = await claudeAI.matchScriptToSlidesIntelligently(
        slideAnalyses,
        currentPresentation!.fullScript || ''
      );
      
      let scriptMatches: any[] = [];
      if (matchResult.success && matchResult.matches) {
        scriptMatches = matchResult.matches;
        console.log('🎯 Script matched to slides:', scriptMatches.length, 'matches');
      } else {
        console.error('❌ Script matching failed:', matchResult.error);
        // Create fallback matches
        const scriptWords = (currentPresentation!.fullScript || '').split(' ');
        const wordsPerSlide = Math.ceil(scriptWords.length / slides.length);
        
        scriptMatches = slides.map((_, index) => ({
          slideNumber: index + 1,
          scriptSection: scriptWords
            .slice(index * wordsPerSlide, (index + 1) * wordsPerSlide)
            .join(' '),
          confidence: 50,
          reasoning: 'Fallback word-based allocation (AI matching failed)',
          keyAlignment: []
        }));
      }

      // STEP 3: Generate expert coaching
      setCurrentStep(3);
      setProgress('🎤 Claude generating world-class presenter coaching...');
      
      const coaching: any[] = [];
      
      for (let i = 0; i < Math.min(slideAnalyses.length, scriptMatches.length); i++) {
        setProgress(`🎤 Generating coaching for slide ${i + 1}...`);
        
        const coachResult = await claudeAI.generateExpertCoaching(
          slideAnalyses[i],
          scriptMatches[i].scriptSection,
          i + 1,
          slides.length
        );
        
        if (coachResult.success && coachResult.coaching) {
          coaching.push(coachResult.coaching);
        } else {
          console.error(`❌ Coaching failed for slide ${i + 1}:`, coachResult.error);
          // Add placeholder coaching
          coaching.push({
            openingStrategy: 'Start with confidence',
            keyEmphasisPoints: [],
            bodyLanguageTips: [],
            voiceModulation: [],
            audienceEngagement: [],
            transitionToNext: 'Smoothly transition to the next point',
            timingRecommendation: '90 seconds',
            potentialQuestions: [],
            commonMistakes: [],
            energyLevel: 'medium'
          });
        }
      }

      // Update the presentation store with AI results
      scriptMatches.forEach((match, index) => {
        if (slides[index]) {
          updateSlideScript(
            slides[index].id,
            match.scriptSection
          );
        }
      });

      // Calculate processing time and final cost
      const processingTime = (Date.now() - startTimeRef.current) / 1000;
      const estimatedCost = estimateCost();
      
      const finalResults = {
        slideAnalyses,
        scriptMatches,
        coaching,
        processingTime,
        estimatedCost
      };

      setResults(finalResults);
      setProgress('✅ Claude AI processing complete! Your presentation is now intelligently enhanced.');
      
      console.log('🎉 AI processing complete:', finalResults);
      
    } catch (error) {
      console.error('❌ Processing error:', error);
      setProgress(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessing(false);
      setCurrentStep(0);
    }
  };

  const resetResults = () => {
    setResults(null);
    setProgress('');
    setCurrentStep(0);
  };

  return (
    <Card className="p-6 bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 border-purple-200 shadow-xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg">
            <Brain className="h-6 w-6 text-white" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-600 to-blue-600">
              🤖 OpenAI GPT-5 - Premium AI Processing
            </h2>
            <p className="text-sm text-gray-600">
              Transform your presentation with world-class AI intelligence
            </p>
          </div>
        </div>
        
        {results && (
          <Button onClick={resetResults} variant="outline" size="sm">
            Process New Presentation
          </Button>
        )}
      </div>

      {/* Prerequisites Check */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className={`p-3 rounded-lg border-2 ${slides.length > 0 ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <Eye className={`h-4 w-4 ${slides.length > 0 ? 'text-green-600' : 'text-gray-400'}`} />
            <span className="font-medium text-sm">
              Slides: {slides.length > 0 ? `${slides.length} uploaded` : 'None'}
            </span>
          </div>
        </div>
        
        <div className={`p-3 rounded-lg border-2 ${hasScript ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <MessageSquare className={`h-4 w-4 ${hasScript ? 'text-green-600' : 'text-gray-400'}`} />
            <span className="font-medium text-sm">
              Script: {hasScript ? 'Ready' : 'Missing'}
            </span>
          </div>
        </div>
        
        <div className={`p-3 rounded-lg border-2 ${connectionStatus === 'connected' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
          <div className="flex items-center gap-2">
            <Key className={`h-4 w-4 ${connectionStatus === 'connected' ? 'text-green-600' : 'text-gray-400'}`} />
            <span className="font-medium text-sm">
              Claude: {connectionStatus === 'connected' ? 'Connected' : 'Not connected'}
            </span>
          </div>
        </div>
      </div>

      {/* API Key Setup */}
      <div className="space-y-4">
        <div>
          <label htmlFor="api-key" className="block text-sm font-medium text-gray-700 mb-2">
            <Key className="inline h-4 w-4 mr-1" />
            OpenAI API Key
          </label>
          <div className="flex gap-2">
            <Input
              id="api-key"
              type="password"
{{ ... }}
              placeholder="sk-ant-api03-..."
              value={apiKey}
              onChange={(e) => {
                const newKey = e.target.value;
                setApiKey(newKey);
                localStorage.setItem('anthropic_api_key', newKey);
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
              {connectionStatus === 'testing' ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                'Test'
              )}
            </Button>
          </div>
          
          {/* Connection Status */}
          {connectionStatus !== 'unknown' && (
            <div className="mt-2">
              {connectionStatus === 'connected' ? (
                <div className="flex items-center gap-1 text-green-600 text-sm">
                  <CheckCircle className="h-4 w-4" />
                  Claude Sonnet 3.5 ready for processing
                </div>
              ) : connectionStatus === 'failed' ? (
                <div className="flex items-center gap-1 text-red-600 text-sm">
                  <AlertCircle className="h-4 w-4" />
                  Invalid API key or connection failed
                </div>
              ) : null}
            </div>
          )}
          
          <p className="text-xs text-gray-600 mt-2">
            Get your API key at{' '}
            <a 
              href="https://console.anthropic.com/account/keys" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline text-blue-600 hover:text-blue-800"
            >
              console.anthropic.com
            </a>
          </p>
        </div>

        {/* Cost Estimate */}
        <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <span className="font-semibold text-green-800">Estimated Cost</span>
          </div>
          <div className="text-sm text-green-700 space-y-1">
            <p><strong>This presentation:</strong> ~${estimateCost().toFixed(2)} USD</p>
            <p><strong>Monthly (20 presentations):</strong> ~${(estimateCost() * 20).toFixed(2)} USD</p>
            <p className="text-xs text-green-600">💡 You pay Anthropic directly - no middleman fees!</p>
          </div>
        </div>

        {/* Process Button */}
        <Button
          onClick={processWithClaude}
          disabled={!apiKey || slides.length === 0 || !hasScript || processing || connectionStatus !== 'connected'}
          className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg font-semibold hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {processing ? (
            <div className="flex items-center gap-2">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>{progress}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              <span>🚀 Process with Claude Sonnet 3.5</span>
            </div>
          )}
        </Button>

        {/* Processing Progress */}
        {processing && (
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Processing Steps</span>
              <span className="text-sm text-gray-600">{currentStep} of {totalSteps}</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gradient-to-r from-purple-600 to-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${(currentStep / totalSteps) * 100}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">{progress}</p>
          </div>
        )}

        {/* Results Display */}
        {results && (
          <div className="mt-6 space-y-4">
            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-purple-600">{results.slideAnalyses.length}</div>
                <div className="text-xs text-gray-600">Slides Analyzed</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-blue-600">{results.scriptMatches.length}</div>
                <div className="text-xs text-gray-600">Perfect Matches</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-green-600">{results.processingTime.toFixed(1)}s</div>
                <div className="text-xs text-gray-600">Process Time</div>
              </div>
              <div className="text-center p-3 bg-white rounded-lg border">
                <div className="text-2xl font-bold text-orange-600">${results.estimatedCost.toFixed(2)}</div>
                <div className="text-xs text-gray-600">Actual Cost</div>
              </div>
            </div>

            {/* Detailed Results */}
            <Card className="p-4 bg-white">
              <h3 className="font-bold mb-4 flex items-center gap-2">
                <Target className="h-5 w-5 text-green-500" />
                🎯 AI Analysis Complete
              </h3>
              
              <div className="space-y-3">
                {results.scriptMatches.map((match, i) => {
                  const analysis = results.slideAnalyses[i];
                  const coaching = results.coaching[i];
                  
                  return (
                    <div key={i} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold">Slide {match.slideNumber}</span>
                          <Badge variant="secondary" className="text-xs">
                            {analysis?.mainTopic || 'Unknown Topic'}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge 
                            variant={match.confidence > 90 ? "default" : match.confidence > 70 ? "secondary" : "outline"}
                            className="text-xs"
                          >
                            {match.confidence}% confident
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {coaching?.energyLevel || 'medium'} energy
                          </Badge>
                        </div>
                      </div>
                      
                      <p className="text-sm text-gray-600 mb-2">
                        <strong>Claude's reasoning:</strong> {match.reasoning}
                      </p>
                      
                      <p className="text-sm bg-white p-2 rounded border">
                        {match.scriptSection.substring(0, 150)}
                        {match.scriptSection.length > 150 ? '...' : ''}
                      </p>
                      
                      {coaching && (
                        <div className="mt-2 text-xs text-blue-600">
                          <strong>Expert tip:</strong> {coaching.openingStrategy}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Success Message */}
            <div className="p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
              <div className="flex items-start gap-2">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-800 mb-1">
                    🎉 Presentation Intelligence Complete!
                  </p>
                  <p className="text-sm text-green-700">
                    Your presentation now has AI-powered script matching and expert coaching. 
                    Navigate to Practice Mode to experience the enhanced guidance.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
};
