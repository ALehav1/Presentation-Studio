import { useState, useCallback, useEffect } from 'react';
import { ScriptAllocator, SlideScriptMapping } from '../services/script-allocator';

interface UseScriptAllocationProps {
  fullScript: string;
  slideCount: number;
  onAllocationChange?: (mappings: SlideScriptMapping[]) => void;
}

export const useScriptAllocation = ({
  fullScript,
  slideCount,
  onAllocationChange
}: UseScriptAllocationProps) => {
  const [mappings, setMappings] = useState<SlideScriptMapping[]>([]);
  const [isDirty, setIsDirty] = useState(false);
  
  // Initial allocation when script or slide count changes
  useEffect(() => {
    if (fullScript && slideCount > 0) {
      const initialMappings = ScriptAllocator.allocateScript(
        fullScript,
        slideCount,
        [] // No existing mappings on initial load
      );
      setMappings(initialMappings);
      onAllocationChange?.(initialMappings);
    }
  }, [fullScript, slideCount]);
  
  // Update a single slide's script content
  const updateSlideScript = useCallback((slideIndex: number, newContent: string) => {
    setMappings(current => {
      // Mark this slide as manually set
      const updated = current.map(m => 
        m.slideIndex === slideIndex
          ? { ...m, scriptContent: newContent, isManuallySet: true }
          : m
      );
      
      // Reallocate remaining content to non-manual slides
      const reallocated = ScriptAllocator.allocateScript(
        fullScript,
        slideCount,
        updated
      );
      
      onAllocationChange?.(reallocated);
      setIsDirty(true);
      return reallocated;
    });
  }, [fullScript, slideCount, onAllocationChange]);
  
  // Reset a slide to automatic allocation
  const resetSlideScript = useCallback((slideIndex: number) => {
    setMappings(current => {
      // Mark this slide as NOT manually set
      const updated = current.map(m => 
        m.slideIndex === slideIndex
          ? { ...m, isManuallySet: false }
          : m
      );
      
      // Reallocate including this slide
      const reallocated = ScriptAllocator.allocateScript(
        fullScript,
        slideCount,
        updated.filter(m => m.isManuallySet) // Only keep other manual slides
      );
      
      onAllocationChange?.(reallocated);
      return reallocated;
    });
  }, [fullScript, slideCount, onAllocationChange]);
  
  // Reset all allocations
  const resetAllAllocations = useCallback(() => {
    const freshMappings = ScriptAllocator.allocateScript(
      fullScript,
      slideCount,
      []
    );
    setMappings(freshMappings);
    onAllocationChange?.(freshMappings);
    setIsDirty(false);
  }, [fullScript, slideCount, onAllocationChange]);
  
  // Get script for a specific slide
  const getSlideScript = useCallback((slideIndex: number): string => {
    const mapping = mappings.find(m => m.slideIndex === slideIndex);
    return mapping?.scriptContent || '';
  }, [mappings]);
  
  // Check if a slide has been manually edited
  const isSlideManuallySet = useCallback((slideIndex: number): boolean => {
    const mapping = mappings.find(m => m.slideIndex === slideIndex);
    return mapping?.isManuallySet || false;
  }, [mappings]);
  
  return {
    mappings,
    isDirty,
    updateSlideScript,
    resetSlideScript,
    resetAllAllocations,
    getSlideScript,
    isSlideManuallySet,
  };
};
