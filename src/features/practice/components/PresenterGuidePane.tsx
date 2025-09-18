import { processScript, estimateSpeakingTime } from '../utils/script-processor';
import { Clock, Key, ArrowRight, Timer } from 'lucide-react';

interface PresenterGuidePaneProps {
  /** Script text to analyze */
  script: string;
  /** Whether the pane is visible */
  isVisible: boolean;
  /** Callback when visibility changes */
  onVisibilityChange?: (visible: boolean) => void;
  /** Current slide number for context */
  slideNumber: number;
  /** Total number of slides */
  totalSlides: number;
}

export function PresenterGuidePane({ 
  script, 
  isVisible, 
  onVisibilityChange,
  slideNumber,
  totalSlides 
}: PresenterGuidePaneProps) {
  const processedScript = processScript(script);

  if (!isVisible) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-center p-4">
          <p className="text-gray-500 text-sm mb-2">Presenter Guide Hidden</p>
          <button
            onClick={() => onVisibilityChange?.(true)}
            className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
          >
            Show Guide
          </button>
        </div>
      </div>
    );
  }

  const hasContent = script.trim().length > 0;

  return (
    <div className="flex flex-col h-full bg-white border rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b bg-green-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-800">Presenter Guide</h3>
          <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
            Slide {slideNumber} of {totalSlides}
          </span>
        </div>
        
        {onVisibilityChange && (
          <button
            onClick={() => onVisibilityChange(false)}
            className="text-xs text-gray-500 hover:text-gray-700"
            title="Hide presenter guide"
          >
            Hide
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 overflow-y-auto">
        {hasContent ? (
          <div className="space-y-6">
            {/* Speaking Time */}
            <div className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg border border-blue-100">
              <Clock className="h-4 w-4 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-blue-900 mb-1">Estimated Speaking Time</h4>
                <p className="text-sm text-blue-700">
                  {estimateSpeakingTime(processedScript.wordCount)} ({processedScript.wordCount} words)
                </p>
              </div>
            </div>

            {/* Key Points */}
            {processedScript.keyPoints.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Key className="h-4 w-4 text-amber-600" />
                  <h4 className="text-sm font-medium text-gray-800">Key Points to Emphasize</h4>
                </div>
                <ul className="space-y-2 ml-6">
                  {processedScript.keyPoints.map((point, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-amber-600 mt-1.5 text-xs">•</span>
                      <span>{point}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Transition Phrases */}
            {processedScript.transitionPhrases.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ArrowRight className="h-4 w-4 text-purple-600" />
                  <h4 className="text-sm font-medium text-gray-800">Transition Cues</h4>
                </div>
                <ul className="space-y-2 ml-6">
                  {processedScript.transitionPhrases.map((phrase, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-purple-600 mt-1.5 text-xs">→</span>
                      <span>{phrase}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Timing Cues */}
            {processedScript.timingCues.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Timer className="h-4 w-4 text-indigo-600" />
                  <h4 className="text-sm font-medium text-gray-800">Timing & Delivery Cues</h4>
                </div>
                <ul className="space-y-2 ml-6">
                  {processedScript.timingCues.map((cue, index) => (
                    <li key={index} className="text-sm text-gray-700 flex items-start gap-2">
                      <span className="text-indigo-600 mt-1.5 text-xs">⏱</span>
                      <span>{cue}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* General Tips if no specific cues found */}
            {processedScript.keyPoints.length === 0 && 
             processedScript.transitionPhrases.length === 0 && 
             processedScript.timingCues.length === 0 && (
              <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                <h4 className="text-sm font-medium text-gray-800 mb-2">General Presentation Tips</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Maintain eye contact with your audience</li>
                  <li>• Speak clearly and at a steady pace</li>
                  <li>• Use natural gestures to emphasize points</li>
                  <li>• Pause briefly between major points</li>
                  <li>• Watch for audience engagement cues</li>
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-400">
            <div className="text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Key className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-sm">No script available for analysis</p>
              <p className="text-xs mt-1">Add a script in Preparation Mode to see presenter guidance</p>
            </div>
          </div>
        )}
      </div>

      {/* Quick Reference Footer */}
      {hasContent && (
        <div className="p-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="text-xs text-gray-600">
            <p className="font-medium mb-1">Quick Reference:</p>
            <div className="flex flex-wrap gap-4">
              <span><span className="text-amber-600">•</span> Key Points</span>
              <span><span className="text-purple-600">→</span> Transitions</span>
              <span><span className="text-indigo-600">⏱</span> Timing</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
