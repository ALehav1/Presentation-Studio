import { useState, useEffect } from 'react';
import { usePresentationStore } from '../../../core/store/presentation';
import { generateContentGuide, ContentGuide } from '../utils/script-processor';
import { OpenAIService } from '../../../services/openai-service';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Textarea } from '../../../components/ui/textarea';
import { Input } from '../../../components/ui/input';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Maximize2, AlertCircle, Edit2, Save } from 'lucide-react';
import { useDebouncedCallback } from '../../../shared/hooks/useDebounce';
import { MobilePracticeLayout } from './MobilePracticeLayout';

interface SimplePracticeViewProps {
  onBack: () => void;
}

/**
 * 🆕 SIMPLIFIED TWO-PANE PRACTICE VIEW
 * Focus: Content guidance without coaching fluff
 * Layout: Slide + (Guide + Script) on desktop, stacked on mobile
 */
export function SimplePracticeView({ onBack }: SimplePracticeViewProps) {
  const {
    currentPresentation,
    currentSlideIndex,
    setCurrentSlide,
    nextSlide,
    previousSlide,
    updateSlideScript,
    updateSlideGuide
  } = usePresentationStore();

  if (process.env.NODE_ENV === 'development') {
    console.log('🎙️ Setting up practice view with:', {
      slideCount: currentPresentation?.slides.length,
      currentSlide: currentSlideIndex,
      hasScript: !!currentPresentation?.slides[currentSlideIndex]?.script,
      scriptLength: currentPresentation?.slides[currentSlideIndex]?.script?.length
    });
  }

  const [showScript, setShowScript] = useState(true);
  const [showGuide, setShowGuide] = useState(true);
  const [contentGuide, setContentGuide] = useState<ContentGuide | null>(null);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  
  // Editing states
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [isEditingGuide, setIsEditingGuide] = useState(false);
  const [tempScript, setTempScript] = useState('');
  const [tempGuide, setTempGuide] = useState<ContentGuide | null>(null);

  // Get current slide data
  const currentSlide = currentPresentation?.slides[currentSlideIndex];
  const totalSlides = currentPresentation?.slides.length || 0;
  
  // Check if we have AI-processed content
  const hasAIProcessing = currentPresentation?.slides.some(s => 
    s.guide && (s.guide.keyMessages?.length > 0 || s.guide.keyConcepts?.length > 0)
  ) || false;
  
  // Check if we're on mobile
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  
  // Debounced save functions
  const saveScript = useDebouncedCallback((slideId: string, newScript: string) => {
    updateSlideScript(slideId, newScript, 'practice');
    setIsEditingScript(false);
  }, 1000);

  const saveGuide = useDebouncedCallback((slideId: string, newGuide: ContentGuide) => {
    updateSlideGuide(slideId, newGuide);
    setIsEditingGuide(false);
  }, 1000);

  // Generate AI-powered content guide when current slide changes
  useEffect(() => {
    // Create abort controller for cancellation
    let isCancelled = false;
    
    if (!currentSlide?.script) {
      setContentGuide(null);
      setIsGeneratingGuide(false);
      return;
    }

    // If slide already has a generated guide, use it
    if (currentSlide.guide) {
      setContentGuide(currentSlide.guide);
      setIsGeneratingGuide(false);
      return;
    }

    // Show loading state and generate AI guide
    setIsGeneratingGuide(true);
    
    const generateAIGuide = async () => {
      try {
        // Check if operation was cancelled before proceeding
        if (isCancelled) return;

        // Get API key from localStorage
        const apiKey = localStorage.getItem('openai_api_key');
        if (!apiKey) {
          console.warn('🤖 No OpenAI key found, using fallback guide generation');
          
          if (isCancelled) return;
          
          // Fallback to local generation
          const prevScript = currentSlideIndex > 0
            ? currentPresentation?.slides[currentSlideIndex - 1]?.script
            : null;
          
          const nextScript = currentSlideIndex < totalSlides - 1
            ? currentPresentation?.slides[currentSlideIndex + 1]?.script
            : null;

          const guide = generateContentGuide(currentSlide.script, prevScript || undefined, nextScript || undefined);
          
          if (!isCancelled) {
            setContentGuide(guide);
            setIsGeneratingGuide(false);
          }
          return;
        }

        if (isCancelled) return;

        // Initialize OpenAI service (now uses server-side proxy)
        const ai = new OpenAIService({
          textModel: "gpt-4o",
          hardTokenCap: 2000,
        });

        // Get slide analysis (if available) or create basic analysis
        const slideAnalysis = {
          allText: currentSlide.script.substring(0, 200) + '...',
          mainTopic: `Slide ${currentSlideIndex + 1}`,
          keyPoints: ['Key point from script analysis'],
          visualElements: [],
          suggestedTalkingPoints: ['Main talking point from content'],
          emotionalTone: 'professional' as const,
          complexity: 'moderate' as const,
          recommendedDuration: 60
        };

        console.log(`🤖 Generating AI presenter guidance for slide ${currentSlideIndex + 1}...`);
        
        if (isCancelled) return;
        
        // Generate AI coaching
        const coachingResult = await ai.generateExpertCoaching(slideAnalysis, currentSlide.script);
        
        if (isCancelled) return;
        
        if (coachingResult.success) {
          // Convert AI coaching to our ContentGuide format
          const aiGuide: ContentGuide = {
            transitionFrom: coachingResult.coaching.openingStrategy || 'Smooth transition from previous content',
            keyMessages: coachingResult.coaching.keyEmphasisPoints || ['Main message from script analysis'],
            keyConcepts: coachingResult.coaching.audienceEngagement?.slice(0, 3) || ['Key concept from content'],
            transitionTo: coachingResult.coaching.transitionToNext || 'Prepare for next topic'
          };
          
          if (!isCancelled) {
            setContentGuide(aiGuide);
            console.log('✅ AI presenter guidance generated successfully');
          }
          
        } else {
          throw new Error(coachingResult.error);
        }
        
      } catch (error) {
        if (isCancelled) return;
        
        console.warn('❌ AI guide generation failed, using fallback:', error);
        
        // Fallback to local generation
        const prevScript = currentSlideIndex > 0
          ? currentPresentation?.slides[currentSlideIndex - 1]?.script
          : null;
        
        const nextScript = currentSlideIndex < totalSlides - 1
          ? currentPresentation?.slides[currentSlideIndex + 1]?.script
          : null;

        const guide = generateContentGuide(currentSlide.script, prevScript || undefined, nextScript || undefined);
        
        if (!isCancelled) {
          setContentGuide(guide);
        }
      } finally {
        if (!isCancelled) {
          setIsGeneratingGuide(false);
        }
      }
    };

    generateAIGuide();
    
    // Cleanup function to cancel pending operations
    return () => {
      isCancelled = true;
    };
  }, [currentSlide?.id, currentSlideIndex]); // Use stable dependencies

  // Keyboard navigation with proper cleanup
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Only handle if not typing in an input/textarea
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case 'ArrowLeft':
          event.preventDefault();
          previousSlide();
          break;
        case 'ArrowRight':
          event.preventDefault();
          nextSlide();
          break;
        case 'Escape':
          event.preventDefault();
          onBack();
          break;
      }
    };

    // Use document instead of window for better event handling
    document.addEventListener('keydown', handleKeyDown);
    
    // Cleanup function ensures event listener is removed
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, []); // Empty dependency array with stable functions from store

  if (!currentPresentation || !currentSlide) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">No presentation loaded</p>
      </div>
    );
  }

  const handleSlideSelect = (index: number) => {
    setCurrentSlide(index);
  };
  
  // For basic practice without AI, show the full script
  const practiceScript = hasAIProcessing 
    ? currentSlide?.script 
    : currentPresentation?.fullScript || currentPresentation?.slides.map(s => s.script).filter(Boolean).join('\n\n---\n\n');

  // Use mobile layout on small screens
  if (isMobile) {
    return (
      <MobilePracticeLayout
        currentSlideIndex={currentSlideIndex}
        totalSlides={totalSlides}
        slideImageUrl={currentSlide?.imageUrl}
        script={practiceScript}
        guide={contentGuide}
        hasAIProcessing={hasAIProcessing}
        onPrevious={previousSlide}
        onNext={nextSlide}
        onSlideSelect={handleSlideSelect}
        onBack={onBack}
      />
    );
  }

  return (
    <div className="flex flex-col h-screen lg:h-screen bg-background" style={{ height: '100dvh' }}>
      {/* Header with navigation and controls */}
      <div className="flex-shrink-0 border-b bg-background">
        <div className="px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" onClick={onBack} className="min-h-[44px]">
              <ChevronLeft className="w-4 h-4 mr-1" />
              <span className="hidden sm:inline">Back to Setup</span>
              <span className="sm:hidden">Back</span>
            </Button>
            <h1 className="text-lg font-semibold">
              {hasAIProcessing ? 'AI-Enhanced Practice' : 'Basic Practice Mode'}
            </h1>
          </div>
        
        {/* Slide Navigation */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={previousSlide}
            disabled={currentSlideIndex === 0}
            className="min-w-[48px] min-h-[48px] p-3"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          
          <Badge variant="secondary" className="px-3 py-1 text-sm">
            Slide {currentSlideIndex + 1} of {totalSlides}
          </Badge>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={nextSlide}
            disabled={currentSlideIndex === totalSlides - 1}
            className="min-w-[48px] min-h-[48px] p-3"
          >
            <ChevronRight className="w-5 h-5" />
          </Button>
        </div>

        {/* View Controls - Mobile Friendly */}
        <div className="flex items-center gap-2">
          <Button
            variant={showGuide ? "default" : "outline"}
            size="sm"
            onClick={() => setShowGuide(!showGuide)}
            className="min-h-[44px] px-3 text-xs md:text-sm"
          >
            {showGuide ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
            <span className="hidden sm:inline">Guide</span>
            <span className="sm:hidden">📋</span>
          </Button>
          <Button
            variant={showScript ? "default" : "outline"}
            size="sm"
            onClick={() => setShowScript(!showScript)}
            className="min-h-[44px] px-3 text-xs md:text-sm"
          >
            {showScript ? <Eye className="w-4 h-4 mr-1" /> : <EyeOff className="w-4 h-4 mr-1" />}
            <span className="hidden sm:inline">Script</span>
            <span className="sm:hidden">📝</span>
          </Button>
        </div>
        </div>
      </div>

      {/* Main Content - New Three Section Layout */}
      <div className="flex-1 flex flex-col">
        
        {/* Top Row: Slide + Presenter Guide (Mobile-first responsive) */}
        <div className="flex-1 flex flex-col lg:flex-row min-h-0">
          
          {/* Slide Image (Full width on mobile, 50% on desktop) */}
          <div className="w-full lg:w-1/2 bg-gray-50 flex items-center justify-center relative border-r border-b min-h-[300px] lg:min-h-0">
            {currentSlide.imageUrl ? (
              <img
                src={currentSlide.imageUrl}
                alt={`Slide ${currentSlideIndex + 1}`}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-center p-8">
                <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4"></div>
                <p className="text-muted-foreground">Slide {currentSlideIndex + 1}</p>
              </div>
            )}
            
            {/* Full-screen button */}
            <Button
              variant="outline"
              size="sm"
              className="absolute top-4 right-4 opacity-70 hover:opacity-100 min-h-[44px] min-w-[44px]"
              onClick={() => {
                // TODO: Implement full-screen slide view
                console.log('Full-screen slide view');
              }}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Presenter Guide (Full width on mobile, 50% on desktop) */}
          {showGuide && (
            <div className="w-full lg:w-1/2 p-2 border-b min-h-[400px] lg:min-h-0">
              <Card className="h-full flex flex-col">
                <div className="p-3 border-b bg-gray-50/50 flex-shrink-0 flex justify-between items-center">
                  <h3 className="font-semibold text-base">Presenter Guide</h3>
                  <Button
                    size="sm"
                    variant={isEditingGuide ? "default" : "ghost"}
                    className="min-h-[44px]"
                    onClick={() => {
                      if (isEditingGuide) {
                        // Save
                        if (tempGuide && currentSlide) {
                          saveGuide(currentSlide.id, tempGuide);
                        }
                      } else {
                        // Start editing
                        setIsEditingGuide(true);
                        setTempGuide(contentGuide || {
                          transitionFrom: null,
                          keyMessages: [],
                          keyConcepts: [],
                          transitionTo: null
                        });
                      }
                    }}
                  >
                    {isEditingGuide ? (
                      <>
                        <Save className="w-3 h-3 mr-1" />
                        Save
                      </>
                    ) : (
                      <>
                        <Edit2 className="w-3 h-3 mr-1" />
                        Edit
                      </>
                    )}
                  </Button>
                </div>
                <div className="flex-1 p-3 overflow-y-auto">                
                {isEditingGuide && tempGuide ? (
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">From previous:</label>
                      <Input
                        className="mt-1"
                        placeholder="Connection from previous slide..."
                        value={tempGuide.transitionFrom || ''}
                        onChange={(e) => setTempGuide({
                          ...tempGuide,
                          transitionFrom: e.target.value || null
                        })}
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">Key messages (one per line):</label>
                      <Textarea
                        className="mt-1"
                        placeholder="Enter key messages, one per line..."
                        value={tempGuide.keyMessages?.join('\n') || ''}
                        onChange={(e) => setTempGuide({
                          ...tempGuide,
                          keyMessages: e.target.value.split('\n').filter(Boolean)
                        })}
                        rows={4}
                      />
                    </div>
                    
                    <div>
                      <label className="text-xs font-medium text-muted-foreground">To next:</label>
                      <Input
                        className="mt-1"
                        placeholder="Transition to next slide..."
                        value={tempGuide.transitionTo || ''}
                        onChange={(e) => setTempGuide({
                          ...tempGuide,
                          transitionTo: e.target.value || null
                        })}
                      />
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => {
                          if (tempGuide && currentSlide) {
                            saveGuide(currentSlide.id, tempGuide);
                          }
                        }}
                      >
                        Save Changes
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditingGuide(false);
                          setTempGuide(null);
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : isGeneratingGuide ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <p className="text-muted-foreground">Analyzing content...</p>
                    </div>
                  </div>
                ) : contentGuide ? (
                  <div className="space-y-3 text-sm leading-relaxed">
                    {/* Transition From Previous */}
                    {contentGuide.transitionFrom && (
                      <div className="p-2 rounded-md bg-gray-50 border-l-2 border-gray-300">
                        <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">From previous:</p>
                        <p className="text-gray-600 italic text-sm">{contentGuide.transitionFrom}</p>
                      </div>
                    )}
                    
                    {/* Key Messages */}
                    {contentGuide.keyMessages.length > 0 && (
                      <div>
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">Key messages:</p>
                        <div className="space-y-2">
                          {contentGuide.keyMessages.map((message, index) => (
                            <div key={index} className="flex items-start gap-2">
                              <span className="w-1.5 h-1.5 bg-blue-500 rounded-full flex-shrink-0 mt-1.5"></span>
                              <span 
                                className="flex-1 leading-relaxed text-sm"
                                dangerouslySetInnerHTML={{
                                  __html: message.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-blue-700">$1</strong>')
                                }}
                              />
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Transition To Next */}
                    {contentGuide.transitionTo && (
                      <div className="p-2 rounded-md bg-blue-50 border-l-2 border-blue-300">
                        <p className="text-xs font-medium text-muted-foreground mb-1 uppercase tracking-wide">To next:</p>
                        <p className="text-blue-600 italic text-sm">{contentGuide.transitionTo}</p>
                      </div>
                    )}
                    
                    {/* Empty state if no content generated */}
                    {!contentGuide.transitionFrom && !contentGuide.keyMessages.length && !contentGuide.transitionTo && (
                      <div className="flex items-center justify-center h-20 text-center">
                        <div>
                          <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                          <p className="text-muted-foreground text-xs">Unable to extract key guidance</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-center">
                    <div>
                      <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-muted-foreground font-medium">No script available</p>
                      <p className="text-xs text-gray-400 mt-1">Add a script to see guidance</p>
                    </div>
                  </div>
                )}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Script Section (Responsive height) */}
        {showScript && (
          <div className="flex-1 lg:flex-initial lg:h-80 p-2 min-h-[200px]">
            <Card className="h-full flex flex-col">
              <div className="p-3 border-b bg-gray-50/50 flex items-center justify-between flex-shrink-0">
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold text-base">Slide {currentSlideIndex + 1} Script</h3>
                  <Badge variant="outline" className="text-xs">
                    {currentSlide?.script ? `${currentSlide.script.split(/\s+/).length} words`  : '0 words'}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant={isEditingScript ? "default" : "ghost"}
                  onClick={() => {
                    if (isEditingScript) {
                      // Save
                      if (currentSlide) {
                        updateSlideScript(currentSlide.id, tempScript);
                        setIsEditingScript(false);
                      }
                    } else {
                      // Start editing
                      setIsEditingScript(true);
                      setTempScript(currentSlide?.script || '');
                    }
                  }}
                >
                  {isEditingScript ? (
                    <>
                      <Save className="w-3 h-3 mr-1" />
                      Save
                    </>
                  ) : (
                    <>
                      <Edit2 className="w-3 h-3 mr-1" />
                      Edit
                    </>
                  )}
                </Button>
              </div>
              
              <div className="flex-1 p-3 overflow-y-auto">
                {isEditingScript ? (
                  <div className="h-full flex flex-col">
                    <Textarea
                      value={tempScript}
                      onChange={(e) => {
                        setTempScript(e.target.value);
                        // Auto-save after 1 second of no typing
                        if (currentSlide) {
                          saveScript(currentSlide.id, e.target.value);
                        }
                      }}
                      className="flex-1 text-base md:text-sm font-mono resize-none min-h-[200px] p-4"
                      style={{ fontSize: '16px' }}
                      placeholder="Enter your script for this slide..."
                    />
                    <div className="flex gap-2 mt-3">
                      <Button
                        size="sm"
                        variant="default"
                        className="flex-1"
                        onClick={() => {
                          if (currentSlide) {
                            updateSlideScript(currentSlide.id, tempScript, 'practice');
                            setIsEditingScript(false);
                          }
                        }}
                      >
                        Save Script
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setIsEditingScript(false);
                          setTempScript('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                ) : (hasAIProcessing ? currentSlide?.script : practiceScript) ? (
                  <div className="prose prose-sm max-w-none">
                    {!hasAIProcessing && (
                      <div className="mb-6 p-4 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-sm text-amber-800 font-medium mb-2">
                          📝 Basic Practice Mode - Full Script View
                        </p>
                        <p className="text-xs text-amber-700">
                          You're viewing your complete script. For intelligent per-slide scripts, 
                          process with AI in the Setup tab.
                        </p>
                      </div>
                    )}
                    <p className="whitespace-pre-wrap leading-relaxed text-lg md:text-base text-gray-800 p-4 md:p-0">
                      {hasAIProcessing ? currentSlide.script : practiceScript}
                    </p>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-20">
                    <div className="text-center">
                      <AlertCircle className="w-6 h-6 text-gray-400 mx-auto mb-2" />
                      <p className="text-muted-foreground">No script available for this slide</p>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={() => {
                          setIsEditingScript(true);
                          setTempScript('');
                        }}
                      >
                        Add Script
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}

      </div>

      {/* Navigation Controls */}
      <div className="flex-shrink-0 flex items-center gap-4 p-4 border-t bg-white justify-between">
        <Button 
          variant="outline"
          onClick={previousSlide}
          disabled={currentSlideIndex === 0}
          className="min-h-[48px] px-4 flex-1 max-w-[120px]"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          <span className="hidden sm:inline">Previous</span>
          <span className="sm:hidden">Prev</span>
        </Button>
        
        {/* Slide Numbers - Horizontally scrollable container */}
        <div className="flex-1 overflow-x-auto max-w-md mx-auto">
          <div className="flex items-center gap-2 px-4 py-2">
            {Array.from({ length: totalSlides }).map((_, index) => (
              <button
                key={index}
                onClick={() => handleSlideSelect(index)}
                className={`flex-shrink-0 min-w-[48px] min-h-[48px] w-12 h-12 rounded-full transition-colors flex items-center justify-center text-sm ${
                  index === currentSlideIndex 
                    ? 'bg-blue-500 text-white font-semibold' 
                    : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
                }`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
        
        <Button 
          variant="outline"
          onClick={nextSlide}
          disabled={currentSlideIndex === totalSlides - 1}
          className="min-h-[48px] px-4 flex-1 max-w-[120px]"
        >
          <span className="hidden sm:inline">Next</span>
          <span className="sm:hidden">Next</span>
          <ChevronRight className="w-5 h-5 ml-1" />
        </Button>
      </div>
    </div>
  );
};
