import React, { useState } from 'react';
import { useScriptAllocation } from '../hooks/useScriptAllocation';

interface SimplifiedScriptViewProps {
  slides: Array<{ imageUrl: string; id: string }>;
  fullScript: string;
  onScriptUpdate: (slideScripts: Array<{ slideId: string; script: string }>) => void;
}

// Alternative simpler view for mobile or compact layouts
export const SimplifiedScriptView: React.FC<SimplifiedScriptViewProps> = ({
  slides,
  fullScript,
  onScriptUpdate
}) => {
  const {
    updateSlideScript,
    getSlideScript,
    isSlideManuallySet
  } = useScriptAllocation({
    fullScript,
    slideCount: slides.length,
    onAllocationChange: (newMappings) => {
      const slideScripts = newMappings.map((mapping, index) => ({
        slideId: slides[index]?.id || `slide-${index}`,
        script: mapping.scriptContent
      }));
      onScriptUpdate(slideScripts);
    }
  });

  const [selectedSlide, setSelectedSlide] = useState(0);
  const [editingScript, setEditingScript] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  const handleEdit = () => {
    setEditingScript(getSlideScript(selectedSlide));
    setIsEditing(true);
  };

  const handleSave = () => {
    updateSlideScript(selectedSlide, editingScript);
    setIsEditing(false);
    setEditingScript('');
  };

  return (
    <div className="simplified-script-view">
      {/* Slide Selector */}
      <div className="slide-selector flex gap-2 overflow-x-auto pb-2 mb-4">
        {slides.map((slide, index) => (
          <button
            key={slide.id}
            onClick={() => setSelectedSlide(index)}
            className={`flex-shrink-0 p-1 border-2 rounded transition-all ${
              selectedSlide === index
                ? 'border-blue-500 ring-2 ring-blue-200'
                : 'border-gray-200'
            }`}
          >
            <img
              src={slide.imageUrl}
              alt={`Slide ${index + 1}`}
              className="w-20 h-15 object-cover"
            />
            <div className="text-xs mt-1 text-center">
              {index + 1}
              {isSlideManuallySet(index) && ' ✓'}
            </div>
          </button>
        ))}
      </div>

      {/* Script Editor */}
      <div className="script-editor-panel border rounded-lg p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-medium">
            Slide {selectedSlide + 1} Script
          </h3>
          {!isEditing && (
            <button
              onClick={handleEdit}
              className="px-3 py-1 bg-blue-500 text-white rounded text-sm"
            >
              Edit
            </button>
          )}
        </div>

        {isEditing ? (
          <>
            <textarea
              value={editingScript}
              onChange={(e) => setEditingScript(e.target.value)}
              className="w-full p-2 border rounded min-h-[200px]"
              placeholder="Enter script for this slide..."
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={handleSave}
                className="px-4 py-2 bg-green-500 text-white rounded"
              >
                Save
              </button>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditingScript('');
                }}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          <div className="script-content bg-gray-50 p-3 rounded min-h-[200px]">
            <p className="whitespace-pre-wrap">
              {getSlideScript(selectedSlide) || 
                'No script for this slide. Click Edit to add.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
