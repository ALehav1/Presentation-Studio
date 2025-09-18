import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { parseFullScript, applyParsedScriptsToSlides, ContentGuide } from '../../features/practice/utils/script-processor';
import { saveSlideImage, loadPresentationImages, deletePresentationImages } from '../../services/imageStorage';

interface Slide {
  id: string;
  imageUrl: string;
  script: string;
  notes: string;
  keyPoints: string[];
  guide?: ContentGuide;
}

interface PresentationState {
  // Presentation data
  currentPresentation: {
    id: string;
    title: string;
    slides: Slide[];
    createdAt: Date;
    updatedAt: Date;
  } | null;
  
  // Upload state
  uploadStatus: 'idle' | 'uploading' | 'converting' | 'complete' | 'error';
  uploadProgress: number;
  uploadError: string | null;
  
  // Navigation state
  currentSlideIndex: number;
  
  // Actions
  createPresentation: (title: string, slideImages: string[]) => Promise<void>;
  updateSlideScript: (slideId: string, script: string) => void;
  updateSlideGuide: (slideId: string, guide: ContentGuide) => void;
  updateSlideNotes: (slideId: string, notes: string) => void;
  parseAndApplyBulkScript: (fullScript: string) => void;
  setCurrentSlide: (index: number) => void;
  nextSlide: () => void;
  previousSlide: () => void;
  setUploadStatus: (status: 'idle' | 'uploading' | 'converting' | 'complete' | 'error') => void;
  setUploadProgress: (progress: number) => void;
  setUploadError: (error: string | null) => void;
  clearPresentation: () => Promise<void>;
  loadImagesFromIndexedDB: () => Promise<void>;
}

export const usePresentationStore = create<PresentationState>()(
  persist(
    (set, get) => ({
      // Initial state
      currentPresentation: null,
      uploadStatus: 'idle',
      uploadProgress: 0,
      uploadError: null,
      currentSlideIndex: 0,
      
      // Create new presentation from uploaded PDF
      createPresentation: async (title, slideImages) => {
        const timestamp = Date.now();
        const presentationId = `pres-${timestamp}`;
        
        const slides: Slide[] = slideImages.map((imageUrl, index) => ({
          id: `slide-${timestamp}-${index}`,
          imageUrl,
          script: '',
          notes: '',
          keyPoints: []
        }));
        
        // Save images to IndexedDB asynchronously
        try {
          await Promise.all(
            slides.map(slide => 
              saveSlideImage(slide.id, slide.imageUrl, presentationId)
            )
          );
          console.log(`💾 Saved ${slides.length} images to IndexedDB`);
        } catch (error) {
          console.error('❌ Failed to save images to IndexedDB:', error);
          // Continue anyway - images will work in current session
        }
        
        set({
          currentPresentation: {
            id: presentationId,
            title,
            slides,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          currentSlideIndex: 0,  // Always start at first slide
          uploadStatus: 'complete'
        });
      },
      
      // Update script for a specific slide
      updateSlideScript: (slideId, script) => {
        const { currentPresentation } = get();
        if (!currentPresentation) return;
        
        const updatedSlides = currentPresentation.slides.map(slide =>
          slide.id === slideId ? { ...slide, script } : slide
        );
        
        set({
          currentPresentation: {
            ...currentPresentation,
            slides: updatedSlides,
            updatedAt: new Date()
          }
        });
      },
      
      // Update presenter guide for a specific slide
      updateSlideGuide: (slideId, guide) => {
        const { currentPresentation } = get();
        if (!currentPresentation) return;
        
        const updatedSlides = currentPresentation.slides.map(slide =>
          slide.id === slideId ? { ...slide, guide } : slide
        );
        
        set({
          currentPresentation: {
            ...currentPresentation,
            slides: updatedSlides,
            updatedAt: new Date()
          }
        });
        
        console.log('💾 Saved guide for slide', slideId);
      },

      // Update notes for a specific slide
      updateSlideNotes: (slideId, notes) => {
        const { currentPresentation } = get();
        if (!currentPresentation) return;
        
        const updatedSlides = currentPresentation.slides.map(slide =>
          slide.id === slideId ? { ...slide, notes } : slide
        );
        
        set({
          currentPresentation: {
            ...currentPresentation,
            slides: updatedSlides,
            updatedAt: new Date()
          }
        });
      },
      
      // Parse full script and apply to all slides
      parseAndApplyBulkScript: (fullScript) => {
        const { currentPresentation } = get();
        if (!currentPresentation) {
          console.log('❌ No presentation available for script parsing');
          return;
        }
        
        console.log('🔄 Bulk script parsing started:', {
          slideCount: currentPresentation.slides.length,
          scriptLength: fullScript.length,
          scriptPreview: fullScript.substring(0, 200)
        });
        
        // Parse the full script into slide sections
        const parsedScripts = parseFullScript(fullScript, currentPresentation.slides.length);
        
        if (parsedScripts.length === 0) {
          console.log('❌ No parsed scripts returned from parseFullScript');
          return;
        }
        
        // Apply parsed scripts to slides
        const scriptUpdates = applyParsedScriptsToSlides(parsedScripts, currentPresentation.slides);
        
        if (scriptUpdates.length === 0) {
          console.log('❌ No script updates generated from applyParsedScriptsToSlides');
          return;
        }
        
        // Update slides with new scripts
        const updatedSlides = currentPresentation.slides.map(slide => {
          const update = scriptUpdates.find(u => u.slideId === slide.id);
          if (update) {
            console.log(`📝 Updating slide ${slide.id} with script:`, {
              oldScriptLength: slide.script?.length || 0,
              newScriptLength: update.script.length
            });
            return { ...slide, script: update.script };
          }
          return slide;
        });
        
        console.log('💾 Saving updated presentation:', {
          slideCount: updatedSlides.length,
          slidesWithScripts: updatedSlides.filter(s => s.script && s.script.trim()).length
        });
        
        set({
          currentPresentation: {
            ...currentPresentation,
            slides: updatedSlides,
            updatedAt: new Date()
          }
        });
        
        // Final verification
        const finalState = get();
        console.log('✅ Final state verification:', {
          totalSlides: finalState.currentPresentation?.slides.length || 0,
          slidesWithScripts: finalState.currentPresentation?.slides.filter(s => s.script && s.script.trim()).length || 0,
          slideScriptLengths: finalState.currentPresentation?.slides.map(s => s.script?.length || 0) || []
        });
        
        console.log('✅ Bulk script parsing complete - updated', scriptUpdates.length, 'slides');
      },
      
      // Navigation actions
      setCurrentSlide: (index) => {
        const { currentPresentation } = get();
        if (!currentPresentation) return;
        
        const maxIndex = currentPresentation.slides.length - 1;
        const safeIndex = Math.max(0, Math.min(index, maxIndex));
        set({ currentSlideIndex: safeIndex });
      },
      
      nextSlide: () => {
        const { currentSlideIndex, setCurrentSlide } = get();
        setCurrentSlide(currentSlideIndex + 1);
      },
      
      previousSlide: () => {
        const { currentSlideIndex, setCurrentSlide } = get();
        setCurrentSlide(currentSlideIndex - 1);
      },
      
      // Upload status management
      setUploadStatus: (status) => set({ uploadStatus: status }),
      setUploadProgress: (progress) => set({ uploadProgress: progress }),
      setUploadError: (error) => set({ uploadError: error }),
      
      // Clear everything
      clearPresentation: async () => {
        const { currentPresentation } = get();
        
        // Delete images from IndexedDB when clearing presentation
        if (currentPresentation?.id) {
          try {
            await deletePresentationImages(currentPresentation.id);
            console.log(`🗑️ Deleted images for presentation: ${currentPresentation.id}`);
          } catch (error) {
            console.error('❌ Failed to delete presentation images:', error);
          }
        }
        
        set({
          currentPresentation: null,
          uploadStatus: 'idle',
          uploadProgress: 0,
          uploadError: null,
          currentSlideIndex: 0
        });
      },
      
      // Load images from IndexedDB for current presentation
      loadImagesFromIndexedDB: async () => {
        const { currentPresentation } = get();
        if (!currentPresentation) return;
        
        try {
          const imageMap = await loadPresentationImages(currentPresentation.id);
          
          // Update slides with loaded images
          const updatedSlides = currentPresentation.slides.map(slide => ({
            ...slide,
            imageUrl: imageMap[slide.id] || slide.imageUrl
          }));
          
          set({
            currentPresentation: {
              ...currentPresentation,
              slides: updatedSlides
            }
          });
          
          console.log(`📷 Restored ${Object.keys(imageMap).length} images from IndexedDB`);
        } catch (error) {
          console.error('❌ Failed to load images from IndexedDB:', error);
        }
      }
    }),
    {
      name: 'presentation-storage', // localStorage key
      partialize: (state) => ({
        // Only persist metadata, NOT the huge base64 images
        // Keep images in memory during session, only clear for persistence
        currentPresentation: state.currentPresentation ? {
          ...state.currentPresentation,
          slides: state.currentPresentation.slides.map(slide => ({
            ...slide,
            imageUrl: '' // Exclude images from localStorage - they're in IndexedDB
          }))
        } : null,
        currentSlideIndex: state.currentSlideIndex
      })
    }
  )
);
