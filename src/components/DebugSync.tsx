/**
 * Debug component to verify Setup/Practice sync is working
 * Remove this after testing is complete
 */
import { usePresentationStore } from '../core/store/presentation';

export function DebugSync() {
  const { currentPresentation, currentSlideIndex, lastEditLocation } = usePresentationStore();
  const currentSlide = currentPresentation?.slides[currentSlideIndex];
  
  if (!currentPresentation) return null;
  
  return (
    <div className="fixed top-16 right-4 bg-black/90 text-white p-3 text-xs rounded-lg shadow-lg max-w-xs z-50">
      <div className="font-semibold text-green-400 mb-2">🔍 Sync Debug</div>
      <div><strong>Slide:</strong> {currentSlideIndex + 1}/{currentPresentation.slides.length}</div>
      <div><strong>Last Edit:</strong> {lastEditLocation || 'none'}</div>
      <div><strong>Words:</strong> {currentSlide?.script?.split(/\s+/).length || 0}</div>
      <div><strong>Chars:</strong> {currentSlide?.script?.length || 0}</div>
      <div><strong>Preview:</strong> {currentSlide?.script?.substring(0, 30) || 'No script'}...</div>
    </div>
  );
}
