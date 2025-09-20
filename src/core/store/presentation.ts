import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { ContentGuide } from '../../features/practice/utils/script-processor';
import { ScriptSplitter } from '../../features/script/utils/scriptSplitter';
import { saveSlideImage, loadPresentationImages, deletePresentationImages } from '../../services/imageStorage';
import type { Slide, Presentation } from '../types';

interface PresentationState {
  // Presentation data
  currentPresentation: Presentation | null;
  
  // Upload state
  uploadStatus: 'idle' | 'uploading' | 'converting' | 'complete' | 'error';
  uploadProgress: number;
  uploadError: string | null;
  
  // Navigation state
  currentSlideIndex: number;
  
  // Sync tracking
  lastEditLocation: 'setup' | 'practice' | null;
  
  // Temporary script storage for cross-component script sharing
  tempUploadedScript: string | null;
  
  // Actions
  createPresentation: (title: string, slideImages: string[]) => Promise<void>;
  updateSlideScript: (slideId: string, script: string, source?: 'setup' | 'practice') => void;
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
  setTempUploadedScript: (script: string | null) => void;
  getTempUploadedScript: () => string | null;
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
      lastEditLocation: null,
      tempUploadedScript: null,
      
      // Create new presentation from uploaded PDF
      createPresentation: async (title, slideImages) => {
        // Preserve any temp uploaded script before cleanup
        const tempScript = get().tempUploadedScript;
        
        // Automatically clear any existing presentation first
        await get().clearPresentation();
        console.log('🧹 Auto-cleared existing presentation for fresh start');
        
        // Restore the temp script if it existed
        if (tempScript) {
          get().setTempUploadedScript(tempScript);
          console.log('📝 Preserved temp script during cleanup');
        }
        
        const timestamp = Date.now();
        const presentationId = `pres-${timestamp}`;
        
        const slides: Slide[] = slideImages.map((imageUrl, index) => ({
          id: `slide-${timestamp}-${index}`,
          number: index + 1,
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
      
      // Update script for a specific slide with bidirectional sync tracking
      updateSlideScript: (slideId, script, source = 'setup') => {
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
          },
          lastEditLocation: source
        });
        
        console.log(`📝 Script updated from ${source} for slide ${slideId}`);
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
        
        console.log('📝 Splitting script across', currentPresentation.slides.length, 'slides');
        
        // Use ScriptSplitter to evenly distribute the script
        const splitScripts = ScriptSplitter.splitScriptEvenly(
          fullScript, 
          currentPresentation.slides.length
        );
        
        // Update each slide with its allocated portion
        const updatedSlides = currentPresentation.slides.map((slide, index) => ({
          ...slide,
          script: splitScripts[index] || ''
        }));
        
        set({
          currentPresentation: {
            ...currentPresentation,
            slides: updatedSlides,
            fullScript, // Keep the original for reallocation
            updatedAt: new Date()
          }
        });
        
        console.log('✅ Script split complete:', splitScripts.map(s => s.split(' ').length + ' words'));
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
        
        console.log('🧹 Starting fresh presentation cleanup...');
        
        // Delete images from IndexedDB when clearing presentation
        if (currentPresentation?.id) {
          try {
            await deletePresentationImages(currentPresentation.id);
            console.log(`🗑️ Deleted images for presentation: ${currentPresentation.id}`);
          } catch (error) {
            console.error('❌ Failed to delete presentation images:', error);
          }
        }
        
        // Clear any temporary uploaded script as well
        const { setTempUploadedScript } = get();
        setTempUploadedScript(null);
        
        set({
          currentPresentation: null,
          uploadStatus: 'idle',
          uploadProgress: 0,
          uploadError: null,
          currentSlideIndex: 0,
          lastEditLocation: undefined,
          tempUploadedScript: null
        });
        
        console.log('✅ Fresh presentation cleanup complete');
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
      },
      
      // Temporary script management methods
      setTempUploadedScript: (script: string | null) => set({ tempUploadedScript: script }),
      getTempUploadedScript: () => get().tempUploadedScript
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
