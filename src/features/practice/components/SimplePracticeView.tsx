import React, { useState, useEffect, useMemo } from 'react';
import { usePresentationStore } from '../../../core/store/presentation';
import { generateContentGuide, ContentGuide } from '../utils/script-processor';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { ChevronLeft, ChevronRight, Eye, EyeOff, Maximize2, AlertCircle } from 'lucide-react';

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
    previousSlide
  } = usePresentationStore();

  const [showScript, setShowScript] = useState(true);
  const [showGuide, setShowGuide] = useState(true);
  const [contentGuide, setContentGuide] = useState<ContentGuide | null>(null);
  const [isGeneratingGuide, setIsGeneratingGuide] = useState(false);

  // Memoize slides array to prevent useEffect dependency issues
  const slides = useMemo(() => currentPresentation?.slides || [], [currentPresentation?.slides]);
  const currentSlide = slides[currentSlideIndex];
  const totalSlides = slides.length;

  // Generate content guide for current slide
  useEffect(() => {
    if (!currentSlide || !currentSlide.script?.trim()) {
      setContentGuide(null);
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
    <div className="h-screen flex flex-col">
      {/* Header with navigation */}
      <div className="flex items-center justify-between p-4 border-b bg-background">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            ← Back to Setup
          </Button>
          <h1 className="text-xl font-semibold">Practice Mode</h1>
        </div>
        
        {/* Slide Navigation */}
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={previousSlide}
            disabled={currentSlideIndex === 0}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <Badge variant="secondary">
            Slide {currentSlideIndex + 1} of {totalSlides}
          </Badge>
          
          <Button 
            variant="outline" 
            size="sm"
            onClick={nextSlide}
            disabled={currentSlideIndex === totalSlides - 1}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>

        {/* View Controls */}
        <div className="flex items-center gap-2">
          <Button
            variant={showGuide ? "default" : "outline"}
            size="sm"
            onClick={() => setShowGuide(!showGuide)}
          >
            {showGuide ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            Guide
          </Button>
          <Button
            variant={showScript ? "default" : "outline"}
            size="sm"
            onClick={() => setShowScript(!showScript)}
          >
            {showScript ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            Script
          </Button>
        </div>
      </div>

      {/* Main Content - Two Pane Layout */}
      <div className="flex-1 flex flex-col lg:flex-row">
        {/* Left Pane: Slide Image (Desktop: 50% width to match each right section) */}
        <div className="lg:w-1/2 lg:h-full h-[40vh] bg-gray-50 flex items-center justify-center relative border-r">
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

        {/* Right Pane: Guide + Script (Desktop: 50% width, split evenly) */}
        <div className="lg:w-1/2 flex-1 flex flex-col">
          {/* Presenter Guide Section (50% of right pane height) */}
          {showGuide && (
            <div className="flex-1 lg:h-1/2 p-4 border-b">
              <Card className="h-full flex flex-col">
                <div className="p-4 border-b bg-gray-50/50">
                  <h3 className="font-semibold text-lg">Presenter Guide</h3>
                </div>
                <div className="flex-1 p-4 overflow-y-auto">                
                {isGeneratingGuide ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                      <p className="text-muted-foreground">Analyzing content...</p>
                    </div>
                  </div>
                ) : contentGuide ? (
                  <div className="space-y-4 text-sm leading-relaxed">
                    {/* Transition From Previous */}
                    {contentGuide.transitionFrom && (
                      <div className="p-3 mb-4 rounded-md bg-gray-50 border-l-2 border-gray-300">
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">From previous:</p>
                        <p className="text-gray-600 italic">{contentGuide.transitionFrom}</p>
                      </div>
                    )}
                    
                    {/* Key Messages */}
                    {contentGuide.keyMessages.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-medium text-muted-foreground mb-3 uppercase tracking-wide">Key messages:</p>
                        <div className="space-y-3">
                          {contentGuide.keyMessages.map((message, index) => (
                            <div key={index} className="flex items-start gap-3">
                              <span className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></span>
                              <span 
                                className="flex-1 leading-relaxed"
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
                      <div className="p-3 mb-2 rounded-md bg-blue-50 border-l-2 border-blue-300">
                        <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">To next:</p>
                        <p className="text-blue-600 italic">{contentGuide.transitionTo}</p>
                      </div>
                    )}
                    
                    {/* Empty state if no content generated */}
                    {!contentGuide.transitionFrom && !contentGuide.keyMessages.length && !contentGuide.transitionTo && (
                      <div className="flex items-center justify-center h-24 text-center">
                        <div>
                          <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                          <p className="text-muted-foreground text-sm">Unable to extract key guidance from this script.</p>
                          <p className="text-xs text-gray-400 mt-1">Try adding keywords like "important", "key", or specific concepts.</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-32 text-center">
                    <div>
                      <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-muted-foreground font-medium">No script available</p>
                      <p className="text-xs text-gray-400 mt-1">Add a script to this slide to see content guidance</p>
                    </div>
                  </div>
                )}
              </Card>
            </div>
          )}

          {/* Script Section (50% of right pane height) */}
          {showScript && (
            <div className="flex-1 lg:h-1/2 p-4">
              <Card className="h-full flex flex-col">
                <div className="p-4 border-b bg-gray-50/50 flex items-center justify-between">
                  <h3 className="font-semibold text-lg">Full Script</h3>
                  <Badge variant="outline">
                    {currentSlide.script ? `${currentSlide.script.split(/\s+/).length} words` : '0 words'}
                  </Badge>
                </div>
                
                <div className="flex-1 p-4 overflow-y-auto">
                  {currentSlide.script ? (
                    <div className="prose prose-sm max-w-none">
                      <p className="whitespace-pre-wrap leading-relaxed text-base text-gray-800">
                        {currentSlide.script}
                      </p>
                    </div>
                  ) : (
                    <div className="flex items-center justify-center h-32">
                      <div className="text-center">
                        <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-muted-foreground">No script available for this slide</p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Navigation (Bottom) */}
      <div className="lg:hidden flex items-center justify-between p-4 border-t bg-background">
        <Button 
          variant="outline"
          onClick={previousSlide}
          disabled={currentSlideIndex === 0}
        >
          <ChevronLeft className="w-4 h-4 mr-1" />
          Previous
        </Button>
        
        <div className="flex items-center gap-2">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => handleSlideSelect(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentSlideIndex 
                  ? 'bg-blue-500' 
                  : 'bg-gray-300 hover:bg-gray-400'
              }`}
            />
          ))}
        </div>
        
        <Button 
          variant="outline"
          onClick={nextSlide}
          disabled={currentSlideIndex === totalSlides - 1}
        >
          Next
          <ChevronRight className="w-4 h-4 ml-1" />
        </Button>
      </div>
    </div>
  );
}
