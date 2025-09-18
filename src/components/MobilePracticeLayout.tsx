/**
 * Mobile-optimized practice layout with dvh viewport and one-handed operation
 */
import { useState, useEffect } from 'react';
import { Button } from './ui/button';
import { ChevronLeft, ChevronRight, Edit2, Save } from 'lucide-react';
import { Textarea } from './ui/textarea';
import { usePresentationStore } from '../core/store/presentation';

interface MobilePracticeLayoutProps {
  onBack: () => void;
}

export function MobilePracticeLayout({ onBack }: MobilePracticeLayoutProps) {
  const { 
    currentPresentation,
    currentSlideIndex,
    setCurrentSlide,
    updateSlideScript 
  } = usePresentationStore();

  const [isEditing, setIsEditing] = useState(false);
  const [tempScript, setTempScript] = useState('');

  const currentSlide = currentPresentation?.slides[currentSlideIndex];
  const totalSlides = currentPresentation?.slides.length || 0;

  // Sync temp script when slide changes
  useEffect(() => {
    setTempScript(currentSlide?.script || '');
    setIsEditing(false);
  }, [currentSlide?.id, currentSlide?.script]);

  const handleSave = () => {
    if (currentSlide) {
      updateSlideScript(currentSlide.id, tempScript, 'practice');
    }
    setIsEditing(false);
  };

  const handlePrevious = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlide(currentSlideIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentSlideIndex < totalSlides - 1) {
      setCurrentSlide(currentSlideIndex + 1);
    }
  };

  if (!currentPresentation || !currentSlide) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">No presentation loaded</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-background" style={{ height: '100dvh' }}>
      {/* Top: Current slide image - 35% of viewport */}
      <div className="h-[35vh] p-4 flex-shrink-0">
        <img 
          src={currentSlide.imageUrl} 
          alt={`Slide ${currentSlideIndex + 1}`}
          className="h-full w-full object-contain rounded-lg shadow-sm"
        />
      </div>
      
      {/* Middle: Script content - remaining space minus navigation */}
      <div className="flex-1 overflow-y-auto p-4 pb-0">
        {isEditing ? (
          <div className="h-full flex flex-col">
            <Textarea
              value={tempScript}
              onChange={(e) => setTempScript(e.target.value)}
              className="flex-1 text-lg leading-relaxed resize-none border-2 focus:border-blue-500"
              style={{ fontSize: '18px', minHeight: '200px' }}
              placeholder="Enter your script for this slide..."
              autoFocus
            />
            <div className="flex gap-3 mt-4 pb-4">
              <Button 
                onClick={handleSave}
                className="flex-1 min-h-[48px] text-base bg-blue-600 hover:bg-blue-700"
              >
                <Save className="w-5 h-5 mr-2" />
                Save Changes
              </Button>
              <Button 
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="min-h-[48px] px-6 text-base"
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <div className="h-full">
            <div className="text-lg leading-relaxed mb-4 font-sans">
              {currentSlide.script || (
                <span className="text-muted-foreground italic">
                  No script for this slide. Tap "Edit" to add one.
                </span>
              )}
            </div>
            <Button 
              onClick={() => setIsEditing(true)}
              className="min-h-[48px] text-base"
              variant="outline"
            >
              <Edit2 className="w-5 h-5 mr-2" />
              Edit Script
            </Button>
          </div>
        )}
      </div>
      
      {/* Bottom: Fixed navigation bar for thumb access */}
      <div className="flex-shrink-0 bg-white border-t p-4 safe-area-pb">
        <div className="flex justify-between items-center">
          <Button 
            onClick={handlePrevious}
            disabled={currentSlideIndex === 0}
            className="min-h-[48px] min-w-[100px] text-base disabled:opacity-50"
            variant="outline"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            Prev
          </Button>
          
          {/* Slide indicators */}
          <div className="flex items-center gap-2 px-4">
            {Array.from({ length: Math.min(totalSlides, 7) }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentSlide(i)}
                className={`w-8 h-8 rounded-full text-sm font-semibold transition-colors ${
                  i === currentSlideIndex
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {i + 1}
              </button>
            ))}
            {totalSlides > 7 && (
              <span className="text-sm text-muted-foreground px-2">
                {currentSlideIndex + 1}/{totalSlides}
              </span>
            )}
          </div>
          
          <Button 
            onClick={handleNext}
            disabled={currentSlideIndex >= totalSlides - 1}
            className="min-h-[48px] min-w-[100px] text-base disabled:opacity-50"
            variant="outline"
          >
            Next
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        </div>
      </div>
      
      {/* Back button - positioned for easy thumb access */}
      <Button
        onClick={onBack}
        variant="ghost"
        className="fixed top-4 left-4 min-h-[44px] bg-white/90 backdrop-blur-sm shadow-md z-10"
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        Back
      </Button>
    </div>
  );
}
