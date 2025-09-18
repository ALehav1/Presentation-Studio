import React, { useState, useEffect, useMemo } from 'react';
import { usePresentationStore } from '../../../core/store/presentation';
import { generateContentGuide, ContentGuide } from '../utils/script-processor';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { Textarea } from '../../../components/ui/textarea';
import { Input } from '../../../components/ui/input';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Maximize2, AlertCircle, Edit2, Save } from 'lucide-react';
import { useDebouncedCallback } from '../../../shared/hooks/useDebounce';

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

  const [showScript, setShowScript] = useState(true);
  const [showGuide, setShowGuide] = useState(true);
  const [contentGuide, setContentGuide] = useState<ContentGuide | null>(null);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);
  
  // Editing states
  const [isEditingScript, setIsEditingScript] = useState(false);
  const [isEditingGuide, setIsEditingGuide] = useState(false);
  const [tempScript, setTempScript] = useState('');
  const [tempGuide, setTempGuide] = useState<ContentGuide | null>(null);

  // Memoize slides array to prevent useEffect dependency issues
  const slides = useMemo(() => currentPresentation?.slides || [], [currentPresentation?.slides]);
  const currentSlide = slides[currentSlideIndex];
  const totalSlides = slides.length;
  
  // DEBUG: Track script changes in practice mode
  useEffect(() => {
    console.log('🎤 PRACTICE MODE DEBUG:', {
      slideIndex: currentSlideIndex,
      slideId: currentSlide?.id,
      hasScript: !!currentSlide?.script,
      scriptLength: currentSlide?.script?.length || 0,
      scriptPreview: currentSlide?.script?.substring(0, 100) || 'NO SCRIPT'
    });
  }, [currentSlideIndex, currentSlide?.script]);
  
  // Debounced save functions
  const saveScript = useDebouncedCallback((slideId: string, newScript: string) => {
    updateSlideScript(slideId, newScript, 'practice');
    setIsEditingScript(false);
  }, 1000);

  const saveGuide = useDebouncedCallback((slideId: string, newGuide: ContentGuide) => {
    updateSlideGuide(slideId, newGuide);
    setIsEditingGuide(false);
  }, 1000);

  // Generate content guide for current slide
  useEffect(() => {
    if (!currentSlide || !currentSlide.script?.trim()) {
      setContentGuide(null);
      setIsGeneratingGuide(false);
      return;
    }

    // Use existing guide if available, otherwise generate new one
    if (currentSlide.guide) {
      setContentGuide(currentSlide.guide);
      setIsGeneratingGuide(false);
      return;
    }

    // Show loading state briefly for better UX
    setIsGeneratingGuide(true);
    
    // Use timeout to simulate processing and show loading state
    const generateGuide = () => {
      const previousScript = currentSlideIndex > 0 
        ? slides[currentSlideIndex - 1]?.script 
        : undefined;
      
      const nextScript = currentSlideIndex < slides.length - 1 
        ? slides[currentSlideIndex + 1]?.script 
        : undefined;

      const guide = generateContentGuide(currentSlide.script, previousScript, nextScript);
      setContentGuide(guide);
      setIsGeneratingGuide(false);
    };

    // Brief delay to show loading state, then generate guide
    const timer = setTimeout(generateGuide, 200);
    return () => clearTimeout(timer);
  }, [currentSlide, currentSlideIndex, slides]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
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
          onBack();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, previousSlide, onBack]);

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
            <h1 className="text-lg font-semibold">Practice Mode</h1>
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
      <div className="flex-1 flex flex-col overflow-hidden">
        
        {/* Top Row: Slide + Presenter Guide (Equal sizes, 60% of screen height) */}
        <div className="h-[60%] flex">
          
          {/* Left: Slide Image (50% width) */}
          <div className="w-1/2 bg-gray-50 flex items-center justify-center relative border-r border-b">
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
              className="absolute top-4 right-4 opacity-70 hover:opacity-100"
              onClick={() => {
                // TODO: Implement full-screen slide view
                console.log('Full-screen slide view');
              }}
            >
              <Maximize2 className="w-4 h-4" />
            </Button>
          </div>

          {/* Right: Presenter Guide (50% width, SAME SIZE as slide) */}
          {showGuide && (
            <div className="w-1/2 p-2 border-b">
              <Card className="h-full flex flex-col">
                <div className="p-3 border-b bg-gray-50/50 flex-shrink-0 flex justify-between items-center">
                  <h3 className="font-semibold text-base">Presenter Guide</h3>
                  <Button
                    size="sm"
                    variant={isEditingGuide ? "default" : "ghost"}
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

        {/* Bottom Row: Slide Script (100% width, 40% of screen height) */}
        {showScript && (
          <div className="h-[40%] p-2">
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
                ) : currentSlide?.script ? (
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap leading-relaxed text-lg md:text-base text-gray-800 p-4 md:p-0">
                      {currentSlide.script}
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

      {/* Mobile Navigation (Bottom) */}
      <div className="lg:hidden flex items-center justify-between p-4 border-t bg-background">
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
        
        <div className="flex items-center gap-3 px-4">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => handleSlideSelect(index)}
              className={`min-w-[24px] min-h-[24px] w-6 h-6 rounded-full transition-colors flex items-center justify-center text-xs ${
                index === currentSlideIndex 
                  ? 'bg-blue-500 text-white font-semibold' 
                  : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
              }`}
            >
              {index + 1}
            </button>
          ))}
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
}
