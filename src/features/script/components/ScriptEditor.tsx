import { useEffect, useState } from 'react';
import { usePresentationStore } from '../../../core/store/presentation';
import { useDebouncedCallback } from '../../../shared/hooks/useDebounce';

interface ScriptEditorProps {
  slideId: string;
  initialScript?: string;
  className?: string;
}

export function ScriptEditor({ slideId, initialScript = '', className = '' }: ScriptEditorProps) {
  const { updateSlideScript } = usePresentationStore();
  const [script, setScript] = useState(initialScript);
  const [wordCount, setWordCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  // Calculate word count
  useEffect(() => {
    const words = script.trim().split(/\s+/).filter(word => word.length > 0);
    setWordCount(words.length);
  }, [script]);

  // Auto-save with proper debounce
  const debouncedSave = useDebouncedCallback((newScript: string) => {
    if (newScript !== initialScript && newScript.trim()) {
      setIsSaving(true);
      updateSlideScript(slideId, newScript);
      setTimeout(() => setIsSaving(false), 300); // Show saving indicator briefly
    }
  }, 500);

  // Trigger save when script changes
  useEffect(() => {
    if (script !== initialScript) {
      debouncedSave(script);
    }
  }, [script, initialScript, debouncedSave]);

  // Update local state when slide changes
  useEffect(() => {
    setScript(initialScript);
  }, [initialScript, slideId]);

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex justify-between items-center">
        <h4 className="text-sm font-medium text-gray-700">Speaker Script</h4>
        <div className="flex items-center gap-3 text-xs text-gray-500">
          {isSaving && (
            <span className="flex items-center gap-1">
              <div className="animate-spin rounded-full h-3 w-3 border-b border-blue-500" />
              Saving...
            </span>
          )}
          <span>{wordCount} words</span>
        </div>
      </div>
      
      <textarea
        value={script}
        onChange={(e) => setScript(e.target.value)}
        placeholder="Add your speaker script for this slide... 

Tips:
• Write in a conversational tone
• Include key points and transitions
• Add timing cues like [PAUSE] or [EMPHASIZE]
• Practice speaking naturally"
        className="w-full h-32 md:h-40 p-3 border border-gray-300 rounded-lg resize-none
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent
                   text-sm leading-relaxed font-mono"
        style={{ minHeight: '8rem' }}
      />
      
      <div className="text-xs text-gray-400 space-y-1">
        <p>💡 Scripts auto-save as you type</p>
        <p>⌨️ Use keyboard shortcuts: Ctrl+Enter to go to next slide</p>
      </div>
    </div>
  );
}
