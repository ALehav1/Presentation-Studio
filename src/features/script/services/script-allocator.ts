export interface SlideScriptMapping {
  slideIndex: number;
  scriptContent: string;
  isManuallySet: boolean; // Track which slides were manually edited
  slideImageUrl?: string;
}

export class ScriptAllocator {
  /**
   * Intelligently allocate script content to slides
   * Respects manually set slides and redistributes the rest
   */
  static allocateScript(
    fullScript: string,
    slideCount: number,
    existingMappings: SlideScriptMapping[] = []
  ): SlideScriptMapping[] {
    // Step 1: Preserve manually set slides
    const manuallySetSlides = existingMappings.filter(m => m.isManuallySet);
    const manuallySetIndices = new Set(manuallySetSlides.map(m => m.slideIndex));
    
    // Step 2: Extract script that's already manually allocated
    const manuallyAllocatedScript = manuallySetSlides
      .map(m => m.scriptContent)
      .join('\n\n');
    
    // Step 3: Get remaining script to allocate
    const remainingScript = this.extractRemainingScript(
      fullScript,
      manuallyAllocatedScript
    );
    
    // Step 4: Parse remaining script into sections
    const sections = this.parseScriptIntoSections(remainingScript);
    
    // Step 5: Calculate slides that need allocation
    const slidesNeedingAllocation = [];
    for (let i = 0; i < slideCount; i++) {
      if (!manuallySetIndices.has(i)) {
        slidesNeedingAllocation.push(i);
      }
    }
    
    // Step 6: Distribute sections to remaining slides
    const allocations = this.distributeContentToSlides(
      sections,
      slidesNeedingAllocation
    );
    
    // Step 7: Merge manual and automatic allocations
    const result: SlideScriptMapping[] = [];
    for (let i = 0; i < slideCount; i++) {
      if (manuallySetIndices.has(i)) {
        // Keep manually set content
        result.push(manuallySetSlides.find(m => m.slideIndex === i)!);
      } else {
        // Use automatic allocation
        const allocation = allocations.find(a => a.slideIndex === i);
        result.push({
          slideIndex: i,
          scriptContent: allocation?.content || '',
          isManuallySet: false
        });
      }
    }
    
    return result;
  }
  
  /**
   * Parse script into logical sections based on headers and paragraphs
   */
  private static parseScriptIntoSections(script: string): string[] {
    if (!script.trim()) return [];
    
    // Try to detect section patterns
    const lines = script.split('\n');
    const sections: string[] = [];
    let currentSection = '';
    
    // Patterns that indicate section breaks
    const sectionMarkers = [
      /^#{1,3}\s+/,        // Markdown headers
      /^[A-Z][A-Z\s]+$/,   // ALL CAPS headers
      /^---+$/,            // Horizontal rules
      /^\[.+\]$/,          // Bracketed sections
      /^\d+\.\s+/,         // Numbered sections
    ];
    
    for (const line of lines) {
      const isNewSection = sectionMarkers.some(pattern => pattern.test(line.trim()));
      
      if (isNewSection && currentSection.trim()) {
        // Save current section and start new one
        sections.push(currentSection.trim());
        currentSection = line;
      } else {
        // Continue building current section
        currentSection += (currentSection ? '\n' : '') + line;
      }
    }
    
    // Don't forget the last section
    if (currentSection.trim()) {
      sections.push(currentSection.trim());
    }
    
    // If no sections detected, split by paragraphs
    if (sections.length === 0) {
      return script.split(/\n\n+/).filter(s => s.trim());
    }
    
    return sections;
  }
  
  /**
   * Extract script content that hasn't been manually allocated yet
   * Uses position-based extraction to avoid removing duplicate text
   */
  private static extractRemainingScript(
    fullScript: string,
    allocatedScript: string
  ): string {
    if (!allocatedScript) return fullScript;
    
    // Split allocated script into meaningful chunks
    const allocatedParts = allocatedScript
      .split(/\n\s*\n/)  // Split by paragraphs
      .map(part => part.trim())
      .filter(part => part.length > 0);
    
    if (allocatedParts.length === 0) return fullScript;
    
    let remaining = fullScript;
    const usedPositions: Array<{start: number, end: number}> = [];
    
    // Find actual positions of allocated text in the full script
    for (const part of allocatedParts) {
      // Look for this part in the remaining script
      let searchText = remaining;
      let searchOffset = 0;
      
      // Skip already-used positions
      for (const used of usedPositions.sort((a, b) => a.start - b.start)) {
        if (searchOffset < used.end) {
          searchText = remaining.slice(0, used.start) + remaining.slice(used.end);
          searchOffset = used.end;
        }
      }
      
      const partIndex = searchText.indexOf(part);
      if (partIndex !== -1) {
        const realIndex = this.getRealIndex(remaining, searchText, partIndex, usedPositions);
        usedPositions.push({
          start: realIndex,
          end: realIndex + part.length
        });
      }
    }
    
    // Remove text from back to front to maintain positions
    usedPositions.sort((a, b) => b.start - a.start);
    
    for (const pos of usedPositions) {
      remaining = remaining.slice(0, pos.start) + remaining.slice(pos.end);
    }
    
    // Clean up multiple newlines and extra whitespace
    remaining = remaining
      .replace(/\n{3,}/g, '\n\n')
      .replace(/[ \t]+\n/g, '\n')
      .trim();
    
    return remaining;
  }
  
  /**
   * Helper to calculate real index accounting for already removed positions
   */
  private static getRealIndex(
    _fullText: string, 
    _searchText: string, 
    foundIndex: number, 
    usedPositions: Array<{start: number, end: number}>
  ): number {
    let realIndex = foundIndex;
    
    // Add back the lengths of previously removed sections
    for (const used of usedPositions.sort((a, b) => a.start - b.start)) {
      if (used.start <= realIndex) {
        realIndex += (used.end - used.start);
      }
    }
    
    return realIndex;
  }
  
  /**
   * Distribute content sections to specific slides
   */
  private static distributeContentToSlides(
    sections: string[],
    slideIndices: number[]
  ): { slideIndex: number; content: string }[] {
    const result = [];
    
    if (sections.length === 0 || slideIndices.length === 0) {
      // No content or no slides to allocate to
      return slideIndices.map(index => ({ slideIndex: index, content: '' }));
    }
    
    if (sections.length === slideIndices.length) {
      // Perfect 1:1 mapping
      return slideIndices.map((index, i) => ({
        slideIndex: index,
        content: sections[i] || ''
      }));
    }
    
    if (sections.length > slideIndices.length) {
      // More sections than slides - combine sections
      const sectionsPerSlide = Math.ceil(sections.length / slideIndices.length);
      let sectionIndex = 0;
      
      for (const slideIndex of slideIndices) {
        const slideSections = [];
        for (let i = 0; i < sectionsPerSlide && sectionIndex < sections.length; i++) {
          slideSections.push(sections[sectionIndex++]);
        }
        result.push({
          slideIndex,
          content: slideSections.join('\n\n')
        });
      }
    } else {
      // Fewer sections than slides - distribute evenly
      const slidesPerSection = Math.ceil(slideIndices.length / sections.length);
      let slideIndexPosition = 0;
      
      for (const section of sections) {
        const slideIndex = slideIndices[slideIndexPosition++];
        result.push({
          slideIndex,
          content: section
        });
        
        // Fill empty slides
        for (let i = 1; i < slidesPerSection && slideIndexPosition < slideIndices.length; i++) {
          result.push({
            slideIndex: slideIndices[slideIndexPosition++],
            content: '' // These slides get no content initially
          });
        }
      }
    }
    
    return result;
  }
}
