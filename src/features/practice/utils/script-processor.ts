/**
 * Script processor utility for extracting key points and presenter guidance
 * from slide scripts for Practice Mode
 */

export interface ProcessedScript {
  keyPoints: string[];
  transitionPhrases: string[];
  timingCues: string[];
  highlightedScript: string;
  wordCount: number;
}

export interface ParsedSlideScript {
  slideNumber: number;
  script: string;
  processed: ProcessedScript;
}

/**
 * Keywords that indicate important content
 */
const IMPORTANCE_KEYWORDS = [
  'important', 'key', 'crucial', 'essential', 'critical', 'remember',
  'note', 'emphasize', 'highlight', 'focus', 'main', 'primary'
];

/**
 * Common transition phrases for moving between slides or sections
 */
const TRANSITION_PHRASES = [
  'moving on', 'next', "now let's", "let's move", 'turning to',
  'shifting to', 'looking at', 'considering', 'examining', 
  'in conclusion', 'to summarize', 'finally', 'lastly',
  'meanwhile', 'however', 'therefore', 'consequently',
  'as we can see', 'this brings us to', 'which leads to'
];

/**
 * Timing and pacing cues
 */
const TIMING_CUES = [
  'pause', 'wait', 'take a moment', 'let that sink in',
  'give them time', 'slow down', 'speed up', 'emphasize',
  'repeat', 'click', 'advance', 'next slide'
];

/**
 * Extract key sentences that contain importance keywords
 */
function extractKeyPoints(script: string): string[] {
  if (!script.trim()) return [];
  
  const sentences = script
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 10); // Filter out very short sentences
  
  const keyPoints: string[] = [];
  
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    const hasImportanceKeyword = IMPORTANCE_KEYWORDS.some(keyword => 
      lowerSentence.includes(keyword)
    );
    
    if (hasImportanceKeyword) {
      keyPoints.push(sentence.charAt(0).toUpperCase() + sentence.slice(1));
    }
  });
  
  // If no explicit key points found, extract first few sentences as fallback
  if (keyPoints.length === 0 && sentences.length > 0) {
    keyPoints.push(...sentences.slice(0, Math.min(3, sentences.length)));
  }
  
  return keyPoints;
}

/**
 * Find transition phrases in the script
 */
function extractTransitionPhrases(script: string): string[] {
  if (!script.trim()) return [];
  
  const lowerScript = script.toLowerCase();
  const foundTransitions: string[] = [];
  
  TRANSITION_PHRASES.forEach(phrase => {
    if (lowerScript.includes(phrase)) {
      // Find the sentence containing the transition phrase
      const sentences = script.split(/[.!?]+/);
      sentences.forEach(sentence => {
        if (sentence.toLowerCase().includes(phrase)) {
          const cleanSentence = sentence.trim();
          if (cleanSentence && !foundTransitions.includes(cleanSentence)) {
            foundTransitions.push(cleanSentence.charAt(0).toUpperCase() + cleanSentence.slice(1));
          }
        }
      });
    }
  });
  
  return foundTransitions;
}

/**
 * Extract timing and pacing cues
 */
function extractTimingCues(script: string): string[] {
  if (!script.trim()) return [];
  
  const lowerScript = script.toLowerCase();
  const foundCues: string[] = [];
  
  TIMING_CUES.forEach(cue => {
    if (lowerScript.includes(cue)) {
      // Find the sentence containing the timing cue
      const sentences = script.split(/[.!?]+/);
      sentences.forEach(sentence => {
        if (sentence.toLowerCase().includes(cue)) {
          const cleanSentence = sentence.trim();
          if (cleanSentence && !foundCues.includes(cleanSentence)) {
            foundCues.push(cleanSentence.charAt(0).toUpperCase() + cleanSentence.slice(1));
          }
        }
      });
    }
  });
  
  return foundCues;
}

/**
 * Create highlighted version of script with bold keywords
 */
function createHighlightedScript(script: string): string {
  if (!script.trim()) return script;
  
  let highlighted = script;
  
  // Bold importance keywords
  IMPORTANCE_KEYWORDS.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    highlighted = highlighted.replace(regex, `**$&**`);
  });
  
  // Bold transition phrases
  TRANSITION_PHRASES.forEach(phrase => {
    const regex = new RegExp(phrase.replace(/'/g, "'"), 'gi');
    highlighted = highlighted.replace(regex, `**$&**`);
  });
  
  return highlighted;
}

/**
 * Count words in a script
 */
function countWords(script: string): number {
  if (!script.trim()) return 0;
  return script.trim().split(/\s+/).length;
}

/**
 * Main function to process a script and extract all guidance information
 */
export function processScript(script: string): ProcessedScript {
  return {
    keyPoints: extractKeyPoints(script),
    transitionPhrases: extractTransitionPhrases(script),
    timingCues: extractTimingCues(script),
    highlightedScript: createHighlightedScript(script),
    wordCount: countWords(script)
  };
}

/**
 * Utility function to estimate speaking time based on word count
 * Assumes average speaking rate of 150-160 words per minute
 */
export function estimateSpeakingTime(wordCount: number): string {
  if (wordCount === 0) return '0 minutes';
  
  const averageWordsPerMinute = 155;
  const minutes = Math.ceil(wordCount / averageWordsPerMinute);
  
  if (minutes < 1) {
    return '< 1 minute';
  } else if (minutes === 1) {
    return '1 minute';
  } else {
    return `${minutes} minutes`;
  }
}

/**
 * Parse a full script into slide sections
 * Supports multiple formats:
 * - "Slide X" markers 
 * - "---" dividers
 * - Paragraph-based splitting (fallback)
 */
export function parseFullScript(fullScript: string, maxSlides?: number): ParsedSlideScript[] {
  if (!fullScript.trim()) return [];
  
  console.log('🔍 PARSING SCRIPT:', { 
    length: fullScript.length, 
    maxSlides,
    preview: fullScript.substring(0, 200),
    fullScript: fullScript // DEBUG: Show full script
  });
  
  const result: ParsedSlideScript[] = [];
  let sections: string[] = [];
  
  // Method 1: Split by "Slide X" markers (case insensitive)
  const slideMarkerRegex = /slide\s+\d+/gi;
  const slideMarkers = [...fullScript.matchAll(slideMarkerRegex)];
  
  if (slideMarkers.length > 0) {
    console.log('📍 Found slide markers:', slideMarkers.length, slideMarkers);
    
    // Split the script by slide markers
    const splitByMarkers = fullScript.split(slideMarkerRegex);
    console.log('📍 Split parts:', splitByMarkers);
    
    // Extract sections (skip the first part if it's empty/before first slide marker)
    for (let i = 1; i < splitByMarkers.length; i++) {
      const content = splitByMarkers[i].trim();
      if (content) {
        sections.push(content);
      }
    }
    
    console.log('📍 Extracted sections:', sections);
  }
  
  // Method 1b: Try splitting by section headers (for scripts without "Slide X" format)
  if (sections.length === 0) {
    const sectionHeaders = [
      'Opening', 'Documentation Foundation', 'Capability Stack', 
      'Activation Layer', 'FIRST Framework', 'Close'
    ];
    
    console.log('🔍 Checking for section headers in script...');
    console.log('📄 Script preview (first 500 chars):', fullScript.substring(0, 500));
    
    // Debug: Check each header individually
    const foundHeaders: string[] = [];
    sectionHeaders.forEach(header => {
      const found = fullScript.toLowerCase().includes(header.toLowerCase());
      console.log(`🔍 Header "${header}": ${found ? '✅ FOUND' : '❌ NOT FOUND'}`);
      if (found) foundHeaders.push(header);
    });
    
    if (foundHeaders.length > 0) {
      console.log('📍 Found section headers:', foundHeaders);
      
      // Find all header positions
      const headerPositions: Array<{header: string, index: number}> = [];
      foundHeaders.forEach(header => {
        const index = fullScript.toLowerCase().indexOf(header.toLowerCase());
        if (index > -1) {
          headerPositions.push({header, index});
          console.log(`📍 "${header}" found at position ${index}`);
        }
      });
      
      // Sort by position in text
      headerPositions.sort((a, b) => a.index - b.index);
      console.log('📍 Sorted header positions:', headerPositions);
      
      // Extract sections between headers
      for (let i = 0; i < headerPositions.length; i++) {
        const start = headerPositions[i].index;
        const end = headerPositions[i + 1]?.index || fullScript.length;
        const section = fullScript.substring(start, end).trim();
        
        console.log(`📝 Extracting section "${headerPositions[i].header}":`, {
          start, end, length: section.length, preview: section.substring(0, 100)
        });
        
        if (section && section.length > 10) {
          sections.push(section);
        }
      }
      
      console.log('📍 Topic-based sections created:', sections.length);
    } else {
      console.log('❌ No section headers found - will try other methods or create single section');
    }
  }
  
  // Method 2: Split by "---" dividers if no slide markers found
  if (sections.length === 0) {
    const dividerSections = fullScript.split(/^---+$/gm).map(s => s.trim()).filter(s => s);
    
    if (dividerSections.length > 1) {
      console.log('📍 Found divider sections:', dividerSections.length);
      sections = dividerSections;
    }
  }
  
  // Method 3: Fallback to paragraph splitting
  if (sections.length === 0) {
    const paragraphs = fullScript
      .split(/\n\s*\n/)  // Split on double line breaks
      .map(p => p.trim())
      .filter(p => p.length > 20); // Ignore very short paragraphs
    
    console.log('📍 Fallback to paragraphs:', paragraphs.length);
    sections = paragraphs;
  }
  
  // Limit sections based on maxSlides if provided
  if (maxSlides && sections.length > maxSlides) {
    console.log(`⚠️ Truncating ${sections.length} sections to ${maxSlides} slides`);
    sections = sections.slice(0, maxSlides);
  }
  
  // Process each section
  sections.forEach((section, index) => {
    const slideNumber = index + 1;
    
    // Clean up section content
    const cleanSection = section
      .replace(/^Slide\s+\d+\s*/i, '') // Remove "Slide X" markers
      .replace(/^---+\s*/, '') // Remove divider lines
      .replace(/^(Opening|Documentation Foundation|Capability Stack|Activation Layer|FIRST Framework|Close)\s*/i, '') // Remove topic headers
      .trim();
    
    const processed = processScript(cleanSection);
    
    console.log(`📝 Processing section ${slideNumber}:`, {
      originalLength: section.length,
      cleanedLength: cleanSection.length,
      content: cleanSection.substring(0, 100) + '...',
      wordCount: processed.wordCount,
      keyPoints: processed.keyPoints.length
    });
    
    result.push({
      slideNumber,
      script: cleanSection,
      processed
    });
  });
  
  console.log('✅ Script parsing complete:', {
    totalSections: result.length,
    wordCounts: result.map(r => r.processed.wordCount),
    sections: result.map(r => r.script.substring(0, 50) + '...')
  });
  
  return result;
}

/**
 * Apply parsed scripts to presentation slides
 * This function maps parsed script sections to existing slides
 */
export function applyParsedScriptsToSlides(
  parsedScripts: ParsedSlideScript[], 
  existingSlides: { id: string; script?: string }[]
): { slideId: string; script: string }[] {
  const updates: { slideId: string; script: string }[] = [];
  
  console.log('📝 APPLYING SCRIPTS - Input data:', {
    parsedScripts: parsedScripts.length,
    existingSlides: existingSlides.length,
    parsedPreview: parsedScripts.map(p => ({ 
      slideNumber: p.slideNumber, 
      scriptPreview: p.script.substring(0, 50) + '...' 
    })),
    slideIds: existingSlides.map(s => s.id)
  });
  
  parsedScripts.forEach((parsed, index) => {
    if (index < existingSlides.length) {
      const slide = existingSlides[index];
      const update = {
        slideId: slide.id,
        script: parsed.script
      };
      updates.push(update);
      
      console.log(`📝 Mapping script for slide ${index + 1}:`, {
        slideId: slide.id,
        scriptLength: parsed.script.length,
        scriptPreview: parsed.script.substring(0, 100) + '...'
      });
    } else {
      console.log(`⚠️ Skipping section ${index + 1} - no matching slide`);
    }
  });
  
  console.log('✅ Script mapping complete:', {
    totalUpdates: updates.length,
    updateDetails: updates.map(u => ({
      slideId: u.slideId,
      scriptLength: u.script.length
    }))
  });
  
  return updates;
}
