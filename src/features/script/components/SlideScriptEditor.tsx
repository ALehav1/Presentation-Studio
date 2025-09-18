import React, { useState, useEffect, useRef } from 'react';
import { useScriptAllocation } from '../hooks/useScriptAllocation';

interface SlideScriptEditorProps {
  slides: Array<{ imageUrl: string; id: string }>;
  fullScript: string;
  onScriptUpdate: (slideScripts: Array<{ slideId: string; script: string }>) => void;
}

export const SlideScriptEditor: React.FC<SlideScriptEditorProps> = ({
  slides,
  fullScript,
  onScriptUpdate
}) => {
  const {
    mappings,
    isDirty,
    updateSlideScript,
    resetSlideScript,
    resetAllAllocations,
    getSlideScript,
    isSlideManuallySet
  } = useScriptAllocation({
    fullScript,
    slideCount: slides.length,
    onAllocationChange: (newMappings) => {
      // Convert to the format the parent expects
      const slideScripts = newMappings.map((mapping, index) => ({
        slideId: slides[index]?.id || `slide-${index}`,
        script: mapping.scriptContent
      }));
      onScriptUpdate(slideScripts);
    }
  });

  const [editingSlide, setEditingSlide] = useState<number | null>(null);
  const [tempScript, setTempScript] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [tempScript]);

  const handleEditClick = (slideIndex: number) => {
    setEditingSlide(slideIndex);
    setTempScript(getSlideScript(slideIndex));
    // Focus textarea after render
    setTimeout(() => textareaRef.current?.focus(), 0);
  };

  const handleSave = () => {
    if (editingSlide !== null) {
      updateSlideScript(editingSlide, tempScript);
      setEditingSlide(null);
      setTempScript('');
    }
  };

  const handleCancel = () => {
    setEditingSlide(null);
    setTempScript('');
  };

  const handleReset = (slideIndex: number) => {
    resetSlideScript(slideIndex);
    if (editingSlide === slideIndex) {
      setEditingSlide(null);
      setTempScript('');
    }
  };

  return (
    <div className="slide-script-editor">
      {/* Header with Reset All button */}
      <div className="editor-header flex justify-between items-center mb-6 p-4 bg-gray-50 rounded-lg">
        <div>
          <h2 className="text-xl font-semibold">Script Allocation</h2>
          <p className="text-sm text-gray-600 mt-1">
            Click any slide to edit its script. Other slides will automatically adjust.
          </p>
        </div>
        {isDirty && (
          <button
            onClick={resetAllAllocations}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
          >
            Reset All to Auto
          </button>
        )}
      </div>

      {/* Slides Grid */}
      <div className="slides-grid grid gap-6">
        {slides.map((slide, index) => {
          const isEditing = editingSlide === index;
          const isManuallySet = isSlideManuallySet(index);
          const scriptContent = getSlideScript(index);

          return (
            <div
              key={slide.id}
              className={`slide-item border rounded-lg p-4 transition-all ${
                isManuallySet ? 'border-blue-400 bg-blue-50' : 'border-gray-200'
              } ${isEditing ? 'ring-2 ring-blue-500' : ''}`}
            >
              {/* Slide Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-gray-700">
                    Slide {index + 1}
                  </span>
                  {isManuallySet && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full">
                      Manually Set
                    </span>
                  )}
                </div>
                <div className="flex gap-2">
                  {!isEditing && (
                    <>
                      <button
                        onClick={() => handleEditClick(index)}
                        className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                      >
                        Edit
                      </button>
                      {isManuallySet && (
                        <button
                          onClick={() => handleReset(index)}
                          className="px-3 py-1 text-sm bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
                        >
                          Reset
                        </button>
                      )}
                    </>
                  )}
                </div>
              </div>

              {/* Slide Content */}
              <div className="flex gap-4">
                {/* Thumbnail */}
                <div className="flex-shrink-0">
                  <img
                    src={slide.imageUrl}
                    alt={`Slide ${index + 1}`}
                    className="w-32 h-24 object-cover rounded border border-gray-200"
                  />
                </div>

                {/* Script Content */}
                <div className="flex-grow">
                  {isEditing ? (
                    <div className="space-y-3">
                      <textarea
                        ref={textareaRef}
                        value={tempScript}
                        onChange={(e) => setTempScript(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                        placeholder="Enter script for this slide..."
                        rows={4}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSave}
                          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancel}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div 
                      className="script-preview p-3 bg-gray-50 rounded-md min-h-[80px] cursor-pointer hover:bg-gray-100 transition-colors"
                      onClick={() => handleEditClick(index)}
                    >
                      {scriptContent ? (
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">
                          {scriptContent}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-400 italic">
                          No script allocated. Click to add.
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Status Bar */}
      <div className="status-bar mt-6 p-3 bg-gray-100 rounded-lg">
        <div className="flex justify-between items-center text-sm text-gray-600">
          <div>
            {mappings.filter(m => m.isManuallySet).length} of {slides.length} slides manually edited
          </div>
          <div>
            {fullScript ? '✓ Script allocated' : '⚠ No script loaded'}
          </div>
        </div>
      </div>
    </div>
  );
};
