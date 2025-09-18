import { useState, useEffect } from 'react';
import { usePresentationStore } from '../../../core/store/presentation';
import { processScript, estimateSpeakingTime } from '../utils/script-processor';

interface ScriptPaneProps {
  /** ID of the current slide */
  slideId: string;
  /** Initial script text */
  initialScript: string;
  /** Whether the pane is visible (for hide/show functionality) */
  isVisible: boolean;
  /** Whether the script is editable (false in practice mode) */
  isEditable?: boolean;
  /** Callback when visibility changes */
  onVisibilityChange?: (visible: boolean) => void;
}

export function ScriptPane({ 
  slideId, 
  initialScript, 
  isVisible, 
  isEditable = true,
  onVisibilityChange 
}: ScriptPaneProps) {
  const { updateSlideScript } = usePresentationStore();
  const [script, setScript] = useState(initialScript);
  const [isSaving, setIsSaving] = useState(false);

  // Update script when slide changes
  useEffect(() => {
    setScript(initialScript);
  }, [initialScript, slideId]);

  // Auto-save functionality with debounce
  useEffect(() => {
    if (!isEditable || script === initialScript) return;

    const timeoutId = setTimeout(() => {
      setIsSaving(true);
      updateSlideScript(slideId, script);
      setTimeout(() => setIsSaving(false), 500);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [script, slideId, updateSlideScript, initialScript, isEditable]);

  // Process script for stats
  const processedScript = processScript(script);

  if (!isVisible) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-center p-4">
          <p className="text-gray-500 text-sm mb-2">Script Hidden</p>
          <button
            onClick={() => onVisibilityChange?.(true)}
            className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
          >
            Show Script
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border rounded-lg">
      {/* Header */}
      <div className="flex justify-between items-center p-4 border-b bg-gray-50 rounded-t-lg">
        <div className="flex items-center gap-2">
          <h3 className="font-medium text-gray-800">Speaker Script</h3>
          {isSaving && (
            <div className="flex items-center gap-1 text-xs text-blue-600">
              <div className="animate-spin rounded-full h-3 w-3 border border-blue-600 border-t-transparent"></div>
              <span>Saving...</span>
            </div>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {/* Script Stats */}
          <div className="text-xs text-gray-500 flex items-center gap-3">
            <span>{processedScript.wordCount} words</span>
            <span>{estimateSpeakingTime(processedScript.wordCount)}</span>
          </div>
          
          {/* Hide Button */}
          {onVisibilityChange && (
            <button
              onClick={() => onVisibilityChange(false)}
              className="text-xs text-gray-500 hover:text-gray-700"
              title="Hide script"
            >
              Hide
            </button>
          )}
        </div>
      </div>

      {/* Script Content */}
      <div className="flex-1 p-4">
        {isEditable ? (
          <textarea
            value={script}
            onChange={(e) => setScript(e.target.value)}
            placeholder="Add your speaker notes here... 

Tips for great scripts:
• Use keywords like 'important' or 'key' to highlight main points
• Add transition phrases like 'moving on' or 'next' for flow
• Include timing cues like 'pause' or 'emphasize' for delivery
• Write in a conversational tone as if speaking to your audience"
            className="w-full h-full p-0 border-0 resize-none focus:ring-0 text-sm leading-relaxed"
          />
        ) : (
          <div className="h-full overflow-y-auto">
            {script ? (
              <div className="text-sm leading-relaxed whitespace-pre-wrap">
                {/* Render highlighted script with bold keywords */}
                {processedScript.highlightedScript.split('**').map((part, index) => 
                  index % 2 === 1 ? (
                    <strong key={index} className="bg-yellow-100 font-semibold">
                      {part}
                    </strong>
                  ) : (
                    <span key={index}>{part}</span>
                  )
                )}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-400">
                <div className="text-center">
                  <p>No script available for this slide</p>
                  <p className="text-xs mt-1">Switch to Preparation Mode to add a script</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer with helpful tips for practice mode */}
      {!isEditable && script && (
        <div className="p-3 bg-blue-50 border-t border-blue-100 rounded-b-lg">
          <div className="text-xs text-blue-700">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium">Practice Tip:</span>
            </div>
            <p>
              Focus on the <strong>highlighted keywords</strong> for emphasis. 
              Use natural gestures and maintain eye contact with your audience.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
