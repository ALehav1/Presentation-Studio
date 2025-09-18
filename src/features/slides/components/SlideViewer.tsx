import { useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { usePresentationStore } from '../../../core/store/presentation';

export function SlideViewer() {
  const {
    currentPresentation,
    currentSlideIndex,
    nextSlide,
    previousSlide,
    setCurrentSlide
  } = usePresentationStore();
  
  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') nextSlide();
      if (e.key === 'ArrowLeft') previousSlide();
    };
    
    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [nextSlide, previousSlide]);
  
  if (!currentPresentation || currentPresentation.slides.length === 0) {
    return null;
  }
  
  const currentSlide = currentPresentation.slides[currentSlideIndex];
  const totalSlides = currentPresentation.slides.length;
  const canGoPrevious = currentSlideIndex > 0;
  const canGoNext = currentSlideIndex < totalSlides - 1;
  
  return (
    <div className="relative w-full">
      {/* Slide Image */}
      <div className="relative bg-black rounded-lg overflow-hidden">
        {currentSlide.imageUrl && currentSlide.imageUrl.trim() !== '' ? (
          <img
            src={currentSlide.imageUrl}
            alt={`Slide ${currentSlideIndex + 1}`}
            className="w-full h-auto max-h-[70vh] object-contain"
          />
        ) : (
          <div className="w-full h-[50vh] flex items-center justify-center text-white bg-gray-800">
            <div className="text-center">
              <div className="text-6xl mb-4">📄</div>
              <p className="text-lg">Slide {currentSlideIndex + 1}</p>
              <p className="text-sm text-gray-400 mt-2">Image unavailable after refresh</p>
            </div>
          </div>
        )}
        
        {/* Navigation Overlay */}
        <div className="absolute inset-0 flex items-center justify-between p-4 pointer-events-none">
          <button
            onClick={previousSlide}
            disabled={!canGoPrevious}
            className={`
              pointer-events-auto rounded-full p-2 transition-all min-w-[48px] min-h-[48px]
              ${canGoPrevious 
                ? 'bg-white/20 hover:bg-white/30 text-white' 
                : 'opacity-0 cursor-not-allowed'
              }
            `}
            title="Previous slide"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-6 h-6" />
          </button>
          
          <button
            onClick={nextSlide}
            disabled={!canGoNext}
            className={`
              pointer-events-auto rounded-full p-2 transition-all min-w-[48px] min-h-[48px]
              ${canGoNext 
                ? 'bg-white/20 hover:bg-white/30 text-white' 
                : 'opacity-0 cursor-not-allowed'
              }
            `}
            title="Next slide"
            aria-label="Next slide"
          >
            <ChevronRight className="w-6 h-6" />
          </button>
        </div>
      </div>
      
      {/* Slide Counter */}
      <div className="mt-4 text-center">
        <span className="text-sm font-medium text-gray-600">
          Slide {currentSlideIndex + 1} of {totalSlides}
        </span>
      </div>
      
      {/* Thumbnail Strip */}
      <div className="mt-4 flex gap-2 overflow-x-auto pb-2">
        {currentPresentation.slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setCurrentSlide(index)}
            className={`
              flex-shrink-0 rounded border-2 overflow-hidden transition-all
              ${index === currentSlideIndex 
                ? 'border-purple-500 shadow-lg' 
                : 'border-gray-300 hover:border-purple-300'
              }
            `}
          >
            {slide.imageUrl && slide.imageUrl.trim() !== '' ? (
              <img
                src={slide.imageUrl}
                alt={`Slide ${index + 1} thumbnail`}
                className="w-20 h-15 object-cover"
              />
            ) : (
              <div className="w-20 h-15 bg-gray-200 flex items-center justify-center text-gray-500 text-xs">
                {index + 1}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
