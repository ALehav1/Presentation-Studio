import { useState } from 'react';
import { Maximize2, X } from 'lucide-react';

interface SlideThumbnailPaneProps {
  /** URL of the slide image */
  imageUrl: string;
  /** Current slide number for display */
  slideNumber: number;
  /** Total number of slides */
  totalSlides: number;
  /** Whether the pane is visible */
  isVisible: boolean;
  /** Callback when visibility changes */
  onVisibilityChange?: (visible: boolean) => void;
}

export function SlideThumbnailPane({ 
  imageUrl, 
  slideNumber, 
  totalSlides, 
  isVisible, 
  onVisibilityChange 
}: SlideThumbnailPaneProps) {
  const [isEnlarged, setIsEnlarged] = useState(false);

  if (!isVisible) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-center p-4">
          <p className="text-gray-500 text-sm mb-2">Slide Hidden</p>
          <button
            onClick={() => onVisibilityChange?.(true)}
            className="px-3 py-1 text-xs bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
          >
            Show Slide
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col h-full bg-white border rounded-lg">
        {/* Header */}
        <div className="flex justify-between items-center p-4 border-b bg-purple-50 rounded-t-lg">
          <div className="flex items-center gap-2">
            <h3 className="font-medium text-gray-800">Current Slide</h3>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded">
              {slideNumber} of {totalSlides}
            </span>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Enlarge Button */}
            <button
              onClick={() => setIsEnlarged(true)}
              className="p-1 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded"
              title="Enlarge slide"
            >
              <Maximize2 className="h-4 w-4" />
            </button>
            
            {/* Hide Button */}
            {onVisibilityChange && (
              <button
                onClick={() => onVisibilityChange(false)}
                className="text-xs text-gray-500 hover:text-gray-700"
                title="Hide slide"
              >
                Hide
              </button>
            )}
          </div>
        </div>

        {/* Slide Content */}
        <div className="flex-1 p-4 flex items-center justify-center bg-gray-50">
          {imageUrl && imageUrl.trim() !== '' ? (
            <div 
              className="relative max-w-full max-h-full cursor-pointer group"
              onClick={() => setIsEnlarged(true)}
            >
              <img
                src={imageUrl}
                alt={`Slide ${slideNumber}`}
                className="max-w-full max-h-full object-contain border border-gray-200 rounded shadow-sm 
                           group-hover:shadow-md transition-shadow duration-200"
              />
              
              {/* Hover overlay with enlarge hint */}
              <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 
                              flex items-center justify-center opacity-0 group-hover:opacity-100 
                              transition-all duration-200 rounded">
                <div className="bg-white bg-opacity-90 px-3 py-1 rounded-full text-xs text-gray-700">
                  Click to enlarge
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center text-gray-400 p-8">
              <div className="w-16 h-16 bg-gray-200 rounded-lg mx-auto mb-4 flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
              <p className="text-sm font-medium">Slide Image Unavailable</p>
              <p className="text-xs mt-2">
                Images are cleared on page refresh to save storage.
                <br />
                Re-upload your PDF to see slides again.
              </p>
            </div>
          )}
        </div>

        {/* Footer with slide info */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 rounded-b-lg">
          <div className="text-xs text-gray-600">
            <p>
              <span className="font-medium">Slide {slideNumber}</span> • 
              Click to enlarge or use full-screen view for presenting
            </p>
          </div>
        </div>
      </div>

      {/* Enlarged Modal */}
      {isEnlarged && (
        <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="relative max-w-[90vw] max-h-[90vh]">
            {/* Close Button */}
            <button
              onClick={() => setIsEnlarged(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 p-2"
              title="Close enlarged view"
            >
              <X className="h-6 w-6" />
            </button>
            
            {/* Slide Info */}
            <div className="absolute -top-12 left-0 text-white text-sm">
              Slide {slideNumber} of {totalSlides}
            </div>
            
            {/* Enlarged Image */}
            <img
              src={imageUrl}
              alt={`Slide ${slideNumber} - Enlarged`}
              className="max-w-full max-h-full object-contain bg-white rounded shadow-2xl"
            />
            
            {/* Keyboard Hint */}
            <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-white text-xs text-center">
              <p>Press ESC to close • Use arrow keys to navigate slides</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

