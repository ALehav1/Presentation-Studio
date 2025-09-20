import { useState } from 'react';
import { Card } from '../../../components/ui/card';
import { Button } from '../../../components/ui/button';
import { Badge } from '../../../components/ui/badge';
import { ChevronLeft, ChevronRight, AlertCircle } from 'lucide-react';
import { ContentGuide } from '../utils/script-processor';

interface MobilePracticeLayoutProps {
  currentSlideIndex: number;
  totalSlides: number;
  slideImageUrl?: string;
  script?: string;
  guide?: ContentGuide | null;
  hasAIProcessing: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onSlideSelect: (index: number) => void;
  onBack: () => void;
}

/**
 * Mobile-optimized practice layout with no overlapping sections
 * Uses CSS Grid for predictable layout on small screens
 */
export function MobilePracticeLayout({
  currentSlideIndex,
  totalSlides,
  slideImageUrl,
  script,
  guide,
  hasAIProcessing,
  onPrevious,
  onNext,
  onSlideSelect,
  onBack
}: MobilePracticeLayoutProps) {
  const [activeSection, setActiveSection] = useState<'script' | 'guide'>('script');

  return (
    <div className="h-screen flex flex-col bg-background" style={{ height: '100dvh' }}>
      {/* Header - Fixed height */}
      <div className="flex-shrink-0 border-b bg-white px-4 py-2">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ChevronLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
          <h1 className="text-base font-semibold">
            {hasAIProcessing ? 'AI Practice' : 'Basic Practice'}
          </h1>
          <Badge variant="secondary" className="text-xs">
            {currentSlideIndex + 1}/{totalSlides}
          </Badge>
        </div>
      </div>

      {/* Main Content - Uses CSS Grid */}
      <div className="flex-1 grid grid-rows-[35vh_1fr] gap-0 overflow-hidden">
        
        {/* Slide Section - Fixed 35vh */}
        <div className="bg-gray-50 flex items-center justify-center p-4 border-b">
          {slideImageUrl ? (
            <img
              src={slideImageUrl}
              alt={`Slide ${currentSlideIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          ) : (
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-2"></div>
              <p className="text-sm text-muted-foreground">Slide {currentSlideIndex + 1}</p>
            </div>
          )}
        </div>

        {/* Content Section - Remaining space */}
        <div className="flex flex-col overflow-hidden">
          {/* Tab Switcher */}
          <div className="flex border-b bg-gray-50">
            <button
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeSection === 'script' 
                  ? 'bg-white border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-600'
              }`}
              onClick={() => setActiveSection('script')}
            >
              Script {script ? `(${script.split(/\s+/).length} words)` : ''}
            </button>
            <button
              className={`flex-1 py-2 text-sm font-medium transition-colors ${
                activeSection === 'guide' 
                  ? 'bg-white border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-600'
              }`}
              onClick={() => setActiveSection('guide')}
            >
              {hasAIProcessing ? 'AI Guide' : 'Tips'}
            </button>
          </div>

          {/* Content Area - Scrollable */}
          <div className="flex-1 overflow-y-auto p-4">
            {activeSection === 'script' ? (
              <div>
                {script ? (
                  <div className="prose prose-sm max-w-none">
                    <p className="whitespace-pre-wrap text-sm leading-relaxed">
                      {hasAIProcessing ? script : (
                        <div>
                          <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-xs text-blue-700 font-medium mb-1">
                              📝 Basic Practice Mode
                            </p>
                            <p className="text-xs text-blue-600">
                              Showing your full script. For intelligent per-slide scripts, use AI processing.
                            </p>
                          </div>
                          {script}
                        </div>
                      )}
                    </p>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <AlertCircle className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-muted-foreground">No script available</p>
                  </div>
                )}
              </div>
            ) : (
              <div>
                {hasAIProcessing && guide ? (
                  <div className="space-y-3">
                    {guide.keyMessages.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">Key Messages</h4>
                        <ul className="space-y-1">
                          {guide.keyMessages.map((msg, i) => (
                            <li key={i} className="text-sm text-gray-600 flex items-start">
                              <span className="text-blue-500 mr-2">•</span>
                              {msg}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {guide.keyConcepts.length > 0 && (
                      <div>
                        <h4 className="text-xs font-semibold text-gray-700 mb-2">Key Concepts</h4>
                        <div className="flex flex-wrap gap-2">
                          {guide.keyConcepts.map((concept, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {concept}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm font-medium text-gray-700 mb-2">
                        Practice Tips
                      </p>
                      <ul className="text-xs text-gray-600 space-y-1 text-left max-w-xs mx-auto">
                        <li>• Maintain eye contact with your audience</li>
                        <li>• Speak clearly and at a moderate pace</li>
                        <li>• Use gestures to emphasize key points</li>
                        <li>• Take pauses between major topics</li>
                      </ul>
                      {!hasAIProcessing && (
                        <p className="text-xs text-blue-600 mt-3">
                          💡 Enable AI processing for personalized guidance
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation - Fixed bottom */}
      <div className="flex-shrink-0 border-t bg-white">
        <div className="flex items-center p-2 gap-2">
          {/* Previous Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onPrevious}
            disabled={currentSlideIndex === 0}
            className="min-w-[60px]"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>

          {/* Slide Numbers - Horizontally scrollable */}
          <div className="flex-1 overflow-x-auto">
            <div className="flex gap-1 px-2 py-1" style={{ WebkitOverflowScrolling: 'touch' }}>
              {Array.from({ length: totalSlides }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => onSlideSelect(index)}
                  className={`flex-shrink-0 w-10 h-10 rounded-full text-sm font-medium transition-colors ${
                    index === currentSlideIndex
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>
          </div>

          {/* Next Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={onNext}
            disabled={currentSlideIndex === totalSlides - 1}
            className="min-w-[60px]"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
