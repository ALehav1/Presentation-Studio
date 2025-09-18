import { useState, useEffect } from 'react';
import { usePresentationStore } from '../../../core/store/presentation';
import { ScriptPane } from './ScriptPane';
import { PresenterGuidePane } from './PresenterGuidePane';
import { SlideThumbnailPane } from './SlideThumbnailPane';
import { ChevronLeft, ChevronRight, Eye, EyeOff } from 'lucide-react';

interface PracticeViewProps {
  /** Optional callback when switching back to preparation mode */
  onBackToPreparation?: () => void;
}

export function PracticeView({ onBackToPreparation }: PracticeViewProps) {
  const { 
    currentPresentation, 
    currentSlideIndex, 
    setCurrentSlide, 
    nextSlide, 
    previousSlide 
  } = usePresentationStore();

  // Visibility states for each pane
  const [showScript, setShowScript] = useState(true);
  const [showGuide, setShowGuide] = useState(true);
  const [showSlide, setShowSlide] = useState(true);

  // Practice mode state
  const [practiceMode, setPracticeMode] = useState(false); // Hides both script and guide

  // Get current slide data with safety check  
  const currentSlide = currentPresentation?.slides[currentSlideIndex];
  const totalSlides = currentPresentation?.slides.length || 0;
  
  // DEBUG: Log the data flow issue
  console.log('🐛 PRACTICE MODE DEBUG:', {
    presentationExists: !!currentPresentation,
    slideCount: totalSlides,
    currentIndex: currentSlideIndex,
    currentSlideExists: !!currentSlide,
    currentSlideId: currentSlide?.id,
    currentSlideScript: currentSlide?.script,
    currentSlideScriptLength: currentSlide?.script?.length || 0
  });

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't interfere with typing in text areas
      if (event.target instanceof HTMLTextAreaElement) return;

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
          // Exit practice mode if active
          if (practiceMode) {
            setPracticeMode(false);
            setShowScript(true);
            setShowGuide(true);
          }
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, previousSlide, practiceMode]);

  // Handle practice mode toggle
  const togglePracticeMode = () => {
    if (practiceMode) {
      // Exit practice mode - restore previous visibility
      setPracticeMode(false);
      setShowScript(true);
      setShowGuide(true);
    } else {
      // Enter practice mode - hide script and guide
      setPracticeMode(true);
      setShowScript(false);
      setShowGuide(false);
    }
  };

  // Safety check - if no slide data, show error state
  if (!currentPresentation || !currentSlide) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-50">
        <div className="text-center p-8">
          <div className="text-red-500 text-lg font-medium mb-2">
            Practice Mode Error
          </div>
          <p className="text-gray-600 mb-4">
            No slide data available. Please return to Preparation Mode and ensure your presentation is loaded.
          </p>
          <button
            onClick={onBackToPreparation}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Back to Preparation
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with navigation and controls */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 p-4 bg-white border-b">
        <div className="flex items-center gap-4">
          {/* Navigation Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={previousSlide}
              disabled={currentSlideIndex === 0}
              className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed
                         hover:bg-gray-50 transition-colors"
              title="Previous slide (← key)"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            <span className="text-sm font-medium px-3 py-1 bg-gray-100 rounded">
              {currentSlideIndex + 1} of {totalSlides}
            </span>
            
            <button
              onClick={nextSlide}
              disabled={currentSlideIndex === totalSlides - 1}
              className="p-2 rounded-lg border disabled:opacity-50 disabled:cursor-not-allowed
                         hover:bg-gray-50 transition-colors"
              title="Next slide (→ key)"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          {/* Slide selector dropdown for quick navigation */}
          <select
            value={currentSlideIndex}
            onChange={(e) => setCurrentSlide(parseInt(e.target.value))}
            className="text-sm border rounded px-2 py-1 bg-white"
            title="Jump to slide"
            aria-label="Select slide to jump to"
          >
            {currentPresentation.slides.map((_, index) => (
              <option key={index} value={index}>
                Slide {index + 1}
              </option>
            ))}
          </select>
        </div>

        {/* Practice Mode Controls */}
        <div className="flex items-center gap-2">
          {/* Individual pane toggles */}
          {!practiceMode && (
            <>
              <button
                onClick={() => setShowScript(!showScript)}
                className={`p-2 rounded text-xs transition-colors ${
                  showScript 
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                title="Toggle script visibility"
              >
                {showScript ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                Script
              </button>
              
              <button
                onClick={() => setShowGuide(!showGuide)}
                className={`p-2 rounded text-xs transition-colors ${
                  showGuide 
                    ? 'bg-green-100 text-green-700 hover:bg-green-200' 
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
                title="Toggle presenter guide visibility"
              >
                {showGuide ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                Guide
              </button>
            </>
          )}

          {/* Practice Mode Toggle */}
          <button
            onClick={togglePracticeMode}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              practiceMode
                ? 'bg-red-600 text-white hover:bg-red-700'
                : 'bg-gray-600 text-white hover:bg-gray-700'
            }`}
            title={practiceMode ? 'Exit practice mode (ESC)' : 'Enter practice mode (hide script & guide)'}
          >
            {practiceMode ? 'Exit Practice' : 'Practice Mode'}
          </button>

          {/* Back to Preparation */}
          <button
            onClick={onBackToPreparation}
            className="px-3 py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Preparation
          </button>
        </div>
      </div>

      {/* Three-pane content area */}
      <div className="flex-1 p-4">
        {/* Mobile: Stack vertically (375px) */}
        <div className="lg:hidden space-y-4">
          {/* Slide comes first on mobile for better UX */}
          {showSlide && (
            <div className="h-64">
              <SlideThumbnailPane
                imageUrl={currentSlide.imageUrl}
                slideNumber={currentSlideIndex + 1}
                totalSlides={totalSlides}
                isVisible={showSlide}
                onVisibilityChange={setShowSlide}
              />
            </div>
          )}

          {showGuide && (
            <div className="h-64 overflow-hidden">
              <PresenterGuidePane
                script={currentSlide.script || ''}
                isVisible={showGuide}
                onVisibilityChange={setShowGuide}
                slideNumber={currentSlideIndex + 1}
                totalSlides={totalSlides}
              />
            </div>
          )}

          {showScript && (
            <div className="h-64">
              <ScriptPane
                slideId={currentSlide.id}
                initialScript={currentSlide.script || ''}
                isVisible={showScript}
                isEditable={false} // Read-only in practice mode
                onVisibilityChange={setShowScript}
              />
            </div>
          )}
        </div>

        {/* Desktop: Three columns side-by-side (1024px+) */}
        <div className="hidden lg:grid lg:grid-cols-3 lg:gap-6 lg:h-full">
          {/* Script Pane */}
          <div className={`transition-all duration-300 ${showScript ? 'block' : 'hidden'}`}>
            <ScriptPane
              slideId={currentSlide.id}
              initialScript={currentSlide.script || ''}
              isVisible={showScript}
              isEditable={false} // Read-only in practice mode
              onVisibilityChange={setShowScript}
            />
          </div>

          {/* Presenter Guide Pane */}
          <div className={`transition-all duration-300 ${showGuide ? 'block' : 'hidden'}`}>
            <PresenterGuidePane
              script={currentSlide.script || ''}
              isVisible={showGuide}
              onVisibilityChange={setShowGuide}
              slideNumber={currentSlideIndex + 1}
              totalSlides={totalSlides}
            />
          </div>

          {/* Slide Thumbnail Pane */}
          <div className={`transition-all duration-300 ${showSlide ? 'block' : 'hidden'}`}>
            <SlideThumbnailPane
              imageUrl={currentSlide.imageUrl}
              slideNumber={currentSlideIndex + 1}
              totalSlides={totalSlides}
              isVisible={showSlide}
              onVisibilityChange={setShowSlide}
            />
          </div>
        </div>

        {/* Practice mode message */}
        {practiceMode && (
          <div className="fixed bottom-4 left-1/2 transform -translate-x-1/2 bg-red-600 text-white px-4 py-2 rounded-lg shadow-lg">
            <p className="text-sm">
              <strong>Practice Mode Active</strong> • Press ESC or click "Exit Practice" to show guides
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
