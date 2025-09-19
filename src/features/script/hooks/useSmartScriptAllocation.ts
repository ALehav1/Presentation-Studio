import { useState, useCallback, useEffect } from 'react';
import { ScriptSplitter } from '../utils/scriptSplitter';

interface SlideScript {
  slideIndex: number;
  content: string;
  isManuallyEdited: boolean;
}

export const useSmartScriptAllocation = (
  fullScript: string,
  slideCount: number
) => {
  const [slideScripts, setSlideScripts] = useState<SlideScript[]>([]);
  
  // Initial allocation when script loads
  useEffect(() => {
    if (fullScript && slideCount > 0) {
      console.log('📝 Allocating script to', slideCount, 'slides');
      const splitScripts = ScriptSplitter.splitScriptEvenly(fullScript, slideCount);
      
      const initialScripts = splitScripts.map((content, index) => ({
        slideIndex: index,
        content,
        isManuallyEdited: false
      }));
      
      setSlideScripts(initialScripts);
    }
  }, [fullScript, slideCount]);
  
  // Update a single slide and reallocate others
  const updateSlideScript = useCallback((slideIndex: number, newContent: string) => {
    setSlideScripts(current => {
      const updated = [...current];
      
      // Mark this slide as manually edited
      updated[slideIndex] = {
        ...updated[slideIndex],
        content: newContent,
        isManuallyEdited: true
      };
      
      // Collect all manually edited content
      const manualContent = updated
        .filter(s => s.isManuallyEdited)
        .map(s => s.content)
        .join('\n\n');
      
      // Calculate what's left to distribute
      let remainingScript = fullScript;
      
      // Remove manually allocated parts from the full script - SAFE VERSION
      const manualParts = manualContent.split('\n').filter(line => line.trim());
      const usedPositions: Array<{start: number, end: number}> = [];
      
      // Find positions of manually allocated text
      for (const part of manualParts) {
        const partIndex = remainingScript.indexOf(part);
        if (partIndex !== -1) {
          // Check if this position overlaps with already used positions
          const overlaps = usedPositions.some(used => 
            (partIndex >= used.start && partIndex < used.end) ||
            (partIndex + part.length > used.start && partIndex + part.length <= used.end)
          );
          
          if (!overlaps) {
            usedPositions.push({
              start: partIndex,
              end: partIndex + part.length
            });
          }
        }
      }
      
      // Remove from back to front to maintain positions
      usedPositions.sort((a, b) => b.start - a.start);
      for (const pos of usedPositions) {
        remainingScript = remainingScript.slice(0, pos.start) + remainingScript.slice(pos.end);
      }
      
      remainingScript = remainingScript.replace(/\n{3,}/g, '\n\n').trim();
      
      // Get indices of slides that need reallocation
      const slidesToReallocate = updated
        .map((_, i) => i)
        .filter(i => !updated[i].isManuallyEdited);
      
      if (slidesToReallocate.length > 0 && remainingScript) {
        // Redistribute remaining content
        const redistributed = ScriptSplitter.splitScriptEvenly(
          remainingScript,
          slidesToReallocate.length
        );
        
        slidesToReallocate.forEach((slideIdx, i) => {
          updated[slideIdx] = {
            ...updated[slideIdx],
            content: redistributed[i] || '',
            isManuallyEdited: false
          };
        });
      }
      
      return updated;
    });
  }, [fullScript]);
  
  // Reset a single slide to auto-allocation
  const resetSlide = useCallback((slideIndex: number) => {
    setSlideScripts(current => {
      const updated = [...current];
      updated[slideIndex].isManuallyEdited = false;
      
      // Trigger reallocation
      const manualContent = updated
        .filter(s => s.isManuallyEdited)
        .map(s => s.content)
        .join('\n\n');
      
      let remainingScript = fullScript;
      const manualParts = manualContent.split('\n').filter(line => line.trim());
      const usedPositions: Array<{start: number, end: number}> = [];
      
      // Find positions of manually allocated text (same safe logic as above)
      for (const part of manualParts) {
        const partIndex = remainingScript.indexOf(part);
        if (partIndex !== -1) {
          const overlaps = usedPositions.some(used => 
            (partIndex >= used.start && partIndex < used.end) ||
            (partIndex + part.length > used.start && partIndex + part.length <= used.end)
          );
          
          if (!overlaps) {
            usedPositions.push({
              start: partIndex,
              end: partIndex + part.length
            });
          }
        }
      }
      
      // Remove from back to front
      usedPositions.sort((a, b) => b.start - a.start);
      for (const pos of usedPositions) {
        remainingScript = remainingScript.slice(0, pos.start) + remainingScript.slice(pos.end);
      }
      
      remainingScript = remainingScript.replace(/\n{3,}/g, '\n\n').trim();
      
      const slidesToReallocate = updated
        .map((_, i) => i)
        .filter(i => !updated[i].isManuallyEdited);
      
      if (slidesToReallocate.length > 0) {
        const redistributed = ScriptSplitter.splitScriptEvenly(
          remainingScript,
          slidesToReallocate.length
        );
        
        slidesToReallocate.forEach((slideIdx, i) => {
          updated[slideIdx].content = redistributed[i] || '';
        });
      }
      
      return updated;
    });
  }, [fullScript]);
  
  return {
    slideScripts,
    updateSlideScript,
    resetSlide,
    getScriptForSlide: (index: number) => slideScripts[index]?.content || '',
    isSlideManuallyEdited: (index: number) => slideScripts[index]?.isManuallyEdited || false
  };
};
