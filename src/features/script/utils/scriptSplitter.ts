/**
 * Intelligent script splitter with semantic awareness and natural break detection
 */
export class ScriptSplitter {
  /**
   * Split script intelligently across slides using semantic analysis and natural breaks
   */
  static splitScriptEvenly(fullScript: string, slideCount: number): string[] {
    if (!fullScript || slideCount === 0) return Array(slideCount).fill('');
    
    console.log('🧠 Starting intelligent script allocation for', slideCount, 'slides');
    
    // Try semantic-based splitting first
    const sections = this.detectSemanticSections(fullScript);
    console.log('📑 Detected', sections.length, 'semantic sections');
    
    if (sections.length > 0 && sections.length <= slideCount * 2) {
      // We have good natural sections, use them
      return this.distributeSemanticSections(sections, slideCount);
    }
    
    // Fall back to sentence-based allocation
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
    
    // Use improved dynamic allocation with transition awareness
    return this.intelligentAllocation(sentences, slideCount, targetWordsPerSlide);
  }
  
  /**
   * Detect semantic sections using multiple patterns and transition words
   */
  private static detectSemanticSections(script: string): string[] {
    const lines = script.split('\n');
    const sections: string[] = [];
    let currentSection = '';
    
    // Common transition phrases that indicate slide changes
    const transitionPatterns = [
      /^(Moving on|Next|Now|Let's look at|Turning to|In conclusion|Finally|First|Second|Third)/i,
      /^(Slide \d+|Section \d+|Part \d+|Chapter \d+)/i,
      /^[A-Z][A-Z\s]+:/,  // ALL CAPS with colon
      /^#{1,3}\s+/,       // Markdown headers  
      /^---+$/,           // Horizontal rules
      /^(\d+\.|\w+\))/,   // Numbered/lettered lists
    ];
    
    // Transition phrases within sentences
    const inlineTransitions = [
      'moving on', 'next slide', 'let\'s turn to', 'now let\'s look at',
      'in conclusion', 'to summarize', 'finally', 'last but not least',
      'first', 'second', 'third', 'another important point'
    ];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      const nextLine = lines[i + 1] || '';
      
      // Check for explicit section markers
      const isExplicitBreak = transitionPatterns.some(pattern => pattern.test(line));
      
      // Check for inline transitions
      const hasInlineTransition = inlineTransitions.some(phrase => 
        line.toLowerCase().includes(phrase)
      );
      
      // Check for natural paragraph breaks (empty line + substantial content)
      const isNaturalBreak = line === '' && nextLine.trim() !== '' && currentSection.length > 150;
      
      if ((isExplicitBreak || hasInlineTransition || isNaturalBreak) && currentSection.trim()) {
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
    
    console.log('📊 Section detection results:', sections.map((s, i) => `Section ${i+1}: ${s.split(' ').length} words`));
    return sections.filter(s => s.length > 10); // Filter out very short sections
  }
  
  /**
   * Distribute semantic sections across slides intelligently
   */
  private static distributeSemanticSections(sections: string[], slideCount: number): string[] {
    const result = Array(slideCount).fill('');
    
    if (sections.length === slideCount) {
      // Perfect match - one section per slide
      console.log('🎯 Perfect section match: 1 section per slide');
      return sections;
    }
    
    if (sections.length < slideCount) {
      // Fewer sections than slides - split larger sections
      console.log('📂 Fewer sections than slides, splitting largest sections');
      const workingSections = [...sections];
      
      while (workingSections.length < slideCount) {
        // Find the section with most words
        let largestIndex = 0;
        let largestWordCount = 0;
        
        workingSections.forEach((section, index) => {
          const wordCount = section.split(/\s+/).length;
          if (wordCount > largestWordCount) {
            largestWordCount = wordCount;
            largestIndex = index;
          }
        });
        
        // Split the largest section at a natural break
        const toSplit = workingSections[largestIndex];
        const splitPoint = this.findBestSplitPoint(toSplit);
        const firstHalf = toSplit.substring(0, splitPoint).trim();
        const secondHalf = toSplit.substring(splitPoint).trim();
        
        workingSections[largestIndex] = firstHalf;
        workingSections.splice(largestIndex + 1, 0, secondHalf);
      }
      
      return workingSections.slice(0, slideCount);
    }
    
    // More sections than slides - combine related sections
    console.log('🔗 More sections than slides, combining related content');
    const sectionsPerSlide = Math.ceil(sections.length / slideCount);
    
    for (let i = 0; i < slideCount; i++) {
      const start = i * sectionsPerSlide;
      const end = Math.min(start + sectionsPerSlide, sections.length);
      const combinedSections = sections.slice(start, end);
      result[i] = combinedSections.join('\n\n');
    }
    
    return result;
  }
  
  /**
   * Find the best point to split a section (sentence boundary)
   */
  private static findBestSplitPoint(text: string): number {
    const sentences = text.split(/[.!?]+\s+/);
    const midPoint = Math.floor(sentences.length / 2);
    
    // Find the character position of the mid-sentence
    let charCount = 0;
    for (let i = 0; i < midPoint; i++) {
      charCount += sentences[i].length + 2; // +2 for punctuation and space
    }
    
    return Math.min(charCount, text.length - 50); // Leave at least 50 chars for second half
  }
  
  /**
   * Check if a sentence contains transition words indicating a slide break
   */
  private static hasTransitionWords(sentence: string): boolean {
    const transitionWords = [
      'moving on', 'next', 'now', 'let\'s look at', 'turning to',
      'in conclusion', 'finally', 'first', 'second', 'third',
      'another point', 'additionally', 'furthermore', 'however',
      'on the other hand', 'meanwhile', 'subsequently'
    ];
    
    const lowerSentence = sentence.toLowerCase();
    return transitionWords.some(phrase => lowerSentence.includes(phrase));
  }
  
  /**
   * Distribute sections to slides
   */
  static distributeSections(sections: string[], slideCount: number): string[] {
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
  static redistributeSectionsEvenly(sections: string[], slideCount: number): string[] {
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
   * Intelligent allocation with transition awareness and semantic understanding
   */
  private static intelligentAllocation(
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
        
        // Check for transition words that suggest slide break
        const hasTransition = this.hasTransitionWords(sentence);
        
        // Check if adding this sentence would exceed target too much
        const withNextSentence = currentWords + sentenceWords;
        const overTarget = withNextSentence - slideTarget;
        const underTarget = slideTarget - currentWords;
        
        // If we find a transition and we're close to target, break here
        if (hasTransition && currentWords > slideTarget * 0.7) {
          console.log('🔄 Breaking at transition:', sentence.substring(0, 50) + '...');
          break;
        }
        
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
