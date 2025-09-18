/**
 * Simple, direct script splitter that actually works
 */
export class ScriptSplitter {
  /**
   * Split script evenly across slides using dynamic programming with boundary scoring
   */
  static splitScriptEvenly(fullScript: string, slideCount: number): string[] {
    if (!fullScript || slideCount === 0) return Array(slideCount).fill('');
    
    const sentences = this.extractSentences(fullScript);
    if (sentences.length === 0) return Array(slideCount).fill('');
    
    // If fewer sentences than slides, distribute what we have
    if (sentences.length <= slideCount) {
      const result = Array(slideCount).fill('');
      sentences.forEach((sentence, i) => {
        result[i] = sentence;
      });
      return result;
    }
    
    // Calculate target words per slide
    const totalWords = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0);
    const targetWordsPerSlide = totalWords / slideCount;
    
    // Use dynamic allocation
    return this.dynamicAllocation(sentences, slideCount, targetWordsPerSlide);
  }
  
  /**
   * Detect natural sections in the script
   */
  private static detectSections(script: string): string[] {
    // Split by common section patterns
    const lines = script.split('\n');
    const sections: string[] = [];
    let currentSection = '';
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      const nextLine = lines[i + 1] || '';
      
      // Check if this looks like a section header
      const isSectionBreak = 
        /^(Opening|Documentation|Capability|Activation|Proof|Slide \d+|SECTION|Chapter)/i.test(line) ||
        /^[A-Z][A-Z\s]+:/.test(line) || // ALL CAPS with colon
        /^#{1,3}\s+/.test(line) || // Markdown headers
        /^---+$/.test(line) || // Horizontal rules
        (line === '' && nextLine !== '' && currentSection.length > 100); // Paragraph breaks
      
      if (isSectionBreak && currentSection.trim()) {
        sections.push(currentSection.trim());
        currentSection = line;
      } else {
        currentSection += (currentSection ? '\n' : '') + line;
      }
    }
    
    // Don't forget the last section
    if (currentSection.trim()) {
      sections.push(currentSection.trim());
    }
    
    return sections.length > 0 ? sections : [script];
  }
  
  /**
   * Distribute sections to slides
   */
  private static distributeSections(sections: string[], slideCount: number): string[] {
    const result = Array(slideCount).fill('');
    
    if (sections.length === slideCount) {
      // Perfect match
      return sections;
    }
    
    if (sections.length > slideCount) {
      // More sections than slides - combine
      const sectionsPerSlide = Math.ceil(sections.length / slideCount);
      for (let i = 0; i < slideCount; i++) {
        const start = i * sectionsPerSlide;
        const end = Math.min(start + sectionsPerSlide, sections.length);
        result[i] = sections.slice(start, end).join('\n\n');
      }
    } else {
      // Fewer sections than slides - distribute
      sections.forEach((section, i) => {
        const slideIndex = Math.floor(i * slideCount / sections.length);
        result[slideIndex] = section;
      });
    }
    
    return result;
  }
  
  /**
   * Redistribute sections evenly while preserving semantic meaning
   */
  private static redistributeSectionsEvenly(sections: string[], slideCount: number): string[] {
    // If we have the right number of sections, use them as-is
    if (sections.length === slideCount) {
      return sections;
    }
    
    // If we have more sections than slides, combine them
    if (sections.length > slideCount) {
      const result: string[] = [];
      const sectionsPerSlide = Math.ceil(sections.length / slideCount);
      
      for (let i = 0; i < slideCount; i++) {
        const start = i * sectionsPerSlide;
        const end = Math.min(start + sectionsPerSlide, sections.length);
        const combinedSections = sections.slice(start, end).join('\n\n');
        result.push(combinedSections);
      }
      return result;
    }
    
    // If we have fewer sections than slides, split the largest ones
    const result = [...sections];
    while (result.length < slideCount) {
      // Find the longest section to split
      let longestIndex = 0;
      let longestLength = 0;
      
      result.forEach((section, index) => {
        if (section.length > longestLength) {
          longestLength = section.length;
          longestIndex = index;
        }
      });
      
      // Split the longest section in half at a sentence boundary
      const toSplit = result[longestIndex];
      const sentences = toSplit.split(/[.!?]+\s+/);
      const midPoint = Math.floor(sentences.length / 2);
      
      const firstHalf = sentences.slice(0, midPoint).join('. ') + '.';
      const secondHalf = sentences.slice(midPoint).join('. ');
      
      result[longestIndex] = firstHalf;
      result.splice(longestIndex + 1, 0, secondHalf);
    }
    
    return result.slice(0, slideCount);
  }
  
  /**
   * Extract sentences with robust boundary detection
   */
  private static extractSentences(text: string): string[] {
    // More robust sentence extraction
    const sentences = text
      .replace(/\n{2,}/g, '|||') // Mark paragraph breaks
      .replace(/([.!?])\s+/g, '$1|||') // Mark sentence ends
      .split('|||')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    
    return sentences;
  }
  
  /**
   * Dynamic allocation with flexible boundary scoring
   */
  private static dynamicAllocation(
    sentences: string[], 
    slideCount: number, 
    _targetWords: number // Prefix with underscore to indicate intentionally unused
  ): string[] {
    const result: string[] = [];
    let sentenceIndex = 0;
    
    for (let slide = 0; slide < slideCount; slide++) {
      const isLastSlide = slide === slideCount - 1;
      const slideContent: string[] = [];
      let currentWords = 0;
      
      // Calculate how many words this slide should ideally have
      const remainingSlides = slideCount - slide;
      const remainingSentences = sentences.slice(sentenceIndex);
      const remainingWords = remainingSentences
        .reduce((sum, s) => sum + s.split(/\s+/).length, 0);
      const slideTarget = remainingWords / remainingSlides;
      
      // Add sentences until we reach target (with flexibility)
      while (sentenceIndex < sentences.length) {
        const sentence = sentences[sentenceIndex];
        const sentenceWords = sentence.split(/\s+/).length;
        
        // Always add at least one sentence per slide
        if (slideContent.length === 0) {
          slideContent.push(sentence);
          currentWords += sentenceWords;
          sentenceIndex++;
          continue;
        }
        
        // For last slide, take everything remaining
        if (isLastSlide) {
          slideContent.push(sentence);
          currentWords += sentenceWords;
          sentenceIndex++;
          continue;
        }
        
        // Check if adding this sentence would exceed target too much
        const withNextSentence = currentWords + sentenceWords;
        const overTarget = withNextSentence - slideTarget;
        const underTarget = slideTarget - currentWords;
        
        // Add if it gets us closer to target
        if (Math.abs(overTarget) <= Math.abs(underTarget)) {
          slideContent.push(sentence);
          currentWords += sentenceWords;
          sentenceIndex++;
        } else {
          break; // Move to next slide
        }
        
        // Prevent one slide from taking too much
        if (currentWords > slideTarget * 1.3) break;
      }
      
      result.push(slideContent.join(' '));
    }
    
    // Log the distribution for debugging
    console.log('📊 Dynamic allocation:', result.map(s => `${s.split(/\s+/).length} words`));
    return result;
  }
}
