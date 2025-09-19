/**
 * Script processor utility for extracting key points and presenter guidance
 * from slide scripts for Practice Mode
 */

import { validateScriptLength, validateSlideCount, validateSectionCount } from '../../../shared/constants/limits';
import { createDebugger } from '../../../shared/utils/debug';

const debug = createDebugger('ScriptProcessor');

export interface ProcessedScript {
  keyPoints: string[];
  transitionPhrases: string[];
  timingCues: string[];
  highlightedScript: string;
  wordCount: number;
}

/**
 * 🆕 SIMPLIFIED CONTENT-FOCUSED GUIDANCE INTERFACE
 * This focuses purely on CONTENT, not delivery coaching
 */
export interface ContentGuide {
  transitionFrom: string | null;  // One sentence from previous slide
  keyMessages: string[];          // 2-3 sentences with **bold** markdown
  keyConcepts: string[];          // Terms to emphasize  
  transitionTo: string | null;    // One sentence to next slide
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
 * Main function to process a script and extract all guidance information
 */
export function processScript(script: string): ProcessedScript {
  // Validate script size before processing
  validateScriptLength(script);
  
  return {
    keyPoints: extractKeyPoints(script),
    transitionPhrases: extractTransitionPhrases(script),
    timingCues: extractTimingCues(script),
    highlightedScript: script, // Simplified - just return original script
    wordCount: script.trim().split(/\s+/).length
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
 * Parse a full script into slide sections with enhanced intelligence
 * Supports multiple formats and slide-count awareness
 */
export function parseFullScript(fullScript: string, maxSlides?: number): ParsedSlideScript[] {
  if (!fullScript.trim()) return [];
  
  // Validate input sizes
  validateScriptLength(fullScript);
  if (maxSlides) {
    validateSlideCount(maxSlides);
  }
  
  debug.log('🎯 Smart parsing for', maxSlides, 'slides');
  
  let sections: string[] = [];
  
  // Strategy 1: Explicit "Slide N" markers
  const slideMarkerRegex = /slide\s+\d+/gi;
  const slideMarkers = [...fullScript.matchAll(slideMarkerRegex)];
  
  if (slideMarkers.length > 0) {
    debug.log('✅ Using Slide N markers');
    const splitByMarkers = fullScript.split(slideMarkerRegex);
    for (let i = 1; i < splitByMarkers.length; i++) {
      const content = splitByMarkers[i].trim();
      if (content) sections.push(content);
    }
  }
  
  // Strategy 2: Section headers
  else if (detectSectionHeaders(fullScript)) {
    debug.log('✅ Using section headers');
    sections = extractBySectionHeaders(fullScript);
  }
  
  // Strategy 3: Smart paragraph grouping
  else if (maxSlides) {
    debug.log('✅ Using intelligent paragraph grouping');
    sections = intelligentParagraphSplit(fullScript, maxSlides);
  }
  
  // Strategy 4: Fallback to existing logic
  else {
    const dividerSections = fullScript.split(/^---+$/gm).map(s => s.trim()).filter(s => s);
    if (dividerSections.length > 1) {
      sections = dividerSections;
    } else {
      const paragraphs = fullScript.split(/\n\s*\n/).map(p => p.trim()).filter(p => p.length > 20);
      sections = paragraphs;
    }
  }
  
  // Handle section/slide count mismatch
  if (maxSlides && sections.length !== maxSlides) {
    validateSectionCount(sections.length);
    sections = rebalanceSections(sections, maxSlides);
  }
  
  // Process each section
  return sections.map((section, index) => ({
    slideNumber: index + 1,
    script: section.trim(),
    processed: processScript(section)
  }));
}

// ADD these helper functions AFTER parseFullScript:

function detectSectionHeaders(text: string): boolean {
  const headers = ['Opening', 'Documentation', 'Capability', 'Activation', 'Framework', 'Close'];
  return headers.some(h => text.toLowerCase().includes(h.toLowerCase()));
}

function extractBySectionHeaders(text: string): string[] {
  const headers = ['Opening', 'Documentation Foundation', 'Capability Stack', 
                   'Activation Layer', 'FIRST Framework', 'Close'];
  const sections: string[] = [];
  const headerPositions: Array<{header: string, index: number}> = [];
  
  headers.forEach(header => {
    const index = text.toLowerCase().indexOf(header.toLowerCase());
    if (index > -1) headerPositions.push({header, index});
  });
  
  headerPositions.sort((a, b) => a.index - b.index);
  
  for (let i = 0; i < headerPositions.length; i++) {
    const start = headerPositions[i].index;
    const end = headerPositions[i + 1]?.index || text.length;
    const section = text.substring(start, end).trim();
    if (section.length > 10) sections.push(section);
  }
  
  return sections;
}

function intelligentParagraphSplit(text: string, targetSlides: number): string[] {
  const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 20);
  
  if (paragraphs.length === targetSlides) return paragraphs;
  
  const sections: string[] = [];
  const parasPerSlide = Math.ceil(paragraphs.length / targetSlides);
  
  for (let i = 0; i < targetSlides; i++) {
    const start = i * parasPerSlide;
    const end = Math.min(start + parasPerSlide, paragraphs.length);
    const section = paragraphs.slice(start, end).join('\n\n');
    sections.push(section || '');
  }
  
  return sections;
}

function rebalanceSections(sections: string[], targetSlides: number, depth = 0): string[] {
  const MAX_DEPTH = 10;
  const MIN_SECTION_LENGTH = 50; // Don't split sections smaller than this
  
  // Safety checks
  if (depth >= MAX_DEPTH) {
    debug.warn(`Cannot rebalance ${sections.length} sections into ${targetSlides} slides after ${MAX_DEPTH} attempts. Returning current sections.`);
    return sections;
  }
  
  if (sections.length === targetSlides) return sections;
  
  if (sections.length < targetSlides) {
    // Find longest section and split it, but only if it's big enough
    const longest = sections.reduce((max, s, i) => 
      s.length > sections[max].length ? i : max, 0);
    
    const toSplit = sections[longest];
    
    // Don't split if section is too small
    if (toSplit.length < MIN_SECTION_LENGTH) {
      debug.warn(`Cannot split further - smallest section is ${toSplit.length} chars. Returning ${sections.length} sections for ${targetSlides} slides.`);
      return sections;
    }
    
    const midpoint = Math.floor(toSplit.length / 2);
    const splitPoint = toSplit.indexOf('.', midpoint) + 1 || 
                      toSplit.indexOf(' ', midpoint) + 1 || 
                      midpoint;
    
    const firstPart = toSplit.substring(0, splitPoint).trim();
    const secondPart = toSplit.substring(splitPoint).trim();
    
    // Only proceed if both parts have content
    if (firstPart && secondPart) {
      sections[longest] = firstPart;
      sections.splice(longest + 1, 0, secondPart);
      
      return sections.length < targetSlides 
        ? rebalanceSections(sections, targetSlides, depth + 1) 
        : sections;
    } else {
      debug.warn(`Cannot split section meaningfully. Returning ${sections.length} sections for ${targetSlides} slides.`);
      return sections;
    }
  }
  
  // Too many sections - merge shortest adjacent pairs
  if (sections.length <= 1) {
    debug.warn(`Cannot merge further - only ${sections.length} section(s) left.`);
    return sections;
  }
  
  const shortest = sections.reduce((min, s, i) => 
    i > 0 && (s.length + sections[i-1].length) < 
    (sections[min].length + (sections[min-1]?.length || Infinity)) ? i : min, 1);
  
  sections[shortest - 1] += '\n\n' + sections[shortest];
  sections.splice(shortest, 1);
  
  return sections.length > targetSlides 
    ? rebalanceSections(sections, targetSlides, depth + 1) 
    : sections;
}

/**
 * Generate content guides for all slides at once
 * Used for bulk processing after script upload
 */
export function generateAllContentGuides(
  slides: { id: string; script: string }[]
): { slideId: string; guide: ContentGuide }[] {
  return slides.map((slide, index) => {
    const previousScript = index > 0 ? slides[index - 1]?.script : undefined;
    const nextScript = index < slides.length - 1 ? slides[index + 1]?.script : undefined;
    
    const guide = generateContentGuide(slide.script, previousScript, nextScript);
    
    return {
      slideId: slide.id,
      guide
    };
  });
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
  
  debug.log('📝 APPLYING SCRIPTS - Input data:', {
    parsedScripts: parsedScripts.length,
    existingSlides: existingSlides.length,
    parsedPreview: parsedScripts.map(p => ({ 
      slideNumber: p.slideNumber, 
      preview: p.script.substring(0, 50) + '...' 
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
      
      debug.log(`📝 Mapping script for slide ${index + 1}:`, {
        slideId: slide.id,
        scriptLength: parsed.script.length,
        scriptPreview: parsed.script.substring(0, 100) + '...'
      });
    } else {
      debug.warn(`Skipping section ${index + 1} - no matching slide`);
    }
  });
  
  debug.log('✅ Script mapping complete:', {
    totalUpdates: updates.length,
    updateDetails: updates.map(u => ({
      slideId: u.slideId,
      scriptLength: u.script.length
    }))
  });
  
  return updates;
}

// ========================================
// 🆕 SIMPLIFIED CONTENT-FOCUSED FUNCTIONS
// ========================================

/**
 * Extract key concepts (proper nouns, numbers, technical terms) from script
 */
function extractKeyConcepts(script: string): string[] {
  if (!script.trim()) return [];
  
  const concepts: string[] = [];
  
  // Extract proper nouns (capitalized words)
  const properNouns = script.match(/\b[A-Z][a-z]+(?:\s+[A-Z][a-z]+)*\b/g) || [];
  concepts.push(...properNouns.slice(0, 3)); // Limit to first 3
  
  // Extract numbers with context
  const numbersRegex = /\b\d+(?:[.,]\d+)*(?:\s*(?:%|percent|million|billion|thousand|dollars?|fields?|years?))?/g;
  const numbers = script.match(numbersRegex) || [];
  concepts.push(...numbers.slice(0, 2)); // Limit to first 2
  
  // Extract technical terms (words with specific importance keywords)
  const technicalTermsRegex = /\b(?:framework|system|platform|infrastructure|capability|model|process|methodology)\b/gi;
  const technicalTerms = script.match(technicalTermsRegex) || [];
  concepts.push(...technicalTerms.slice(0, 2)); // Limit to first 2
  
  // Remove duplicates and return
  return [...new Set(concepts)].slice(0, 5); // Max 5 concepts total
}

/**
 * Extract the 2-3 most important sentences as key messages
 */
function extractKeyMessages(script: string): string[] {
  if (!script.trim()) return [];
  
  const sentences = script
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 15); // Filter out very short sentences
  
  const keyMessages: string[] = [];
  
  // Priority 1: Sentences with importance keywords
  sentences.forEach(sentence => {
    const lowerSentence = sentence.toLowerCase();
    const hasImportanceKeyword = IMPORTANCE_KEYWORDS.some(keyword => 
      lowerSentence.includes(keyword)
    );
    
    if (hasImportanceKeyword && keyMessages.length < 2) {
      // Bold the key concepts in the sentence
      let highlightedSentence = sentence;
      const concepts = extractKeyConcepts(sentence);
      concepts.forEach(concept => {
        const regex = new RegExp(`\\b${concept.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        highlightedSentence = highlightedSentence.replace(regex, `**$&**`);
      });
      keyMessages.push(highlightedSentence.charAt(0).toUpperCase() + highlightedSentence.slice(1));
    }
  });
  
  // Priority 2: First few sentences as fallback (if no importance keywords found)
  if (keyMessages.length === 0 && sentences.length > 0) {
    const fallbackSentences = sentences.slice(0, Math.min(2, sentences.length));
    fallbackSentences.forEach(sentence => {
      // Bold the key concepts
      let highlightedSentence = sentence;
      const concepts = extractKeyConcepts(sentence);
      concepts.forEach(concept => {
        const regex = new RegExp(`\\b${concept.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        highlightedSentence = highlightedSentence.replace(regex, `**$&**`);
      });
      keyMessages.push(highlightedSentence.charAt(0).toUpperCase() + highlightedSentence.slice(1));
    });
  }
  
  // Priority 3: Add one more sentence if we only have one
  if (keyMessages.length === 1 && sentences.length > 1) {
    const nextSentence = sentences.find(s => 
      !keyMessages.some(existing => existing.includes(s.substring(0, 20)))
    );
    if (nextSentence) {
      let highlightedSentence = nextSentence;
      const concepts = extractKeyConcepts(nextSentence);
      concepts.forEach(concept => {
        const regex = new RegExp(`\\b${concept.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
        highlightedSentence = highlightedSentence.replace(regex, `**$&**`);
      });
      keyMessages.push(highlightedSentence.charAt(0).toUpperCase() + highlightedSentence.slice(1));
    }
  }
  
  return keyMessages.slice(0, 3); // Max 3 key messages
}

/**
 * Generate simple transition from one slide to the next
 */
function generateTransitionTo(currentScript: string, nextScript: string): string | null {
  if (!currentScript.trim() || !nextScript.trim()) return null;
  
  // Extract first key concept from next script to create natural bridge
  const nextConcepts = extractKeyConcepts(nextScript);
  const nextFirstSentence = nextScript.split(/[.!?]+/)[0]?.trim();
  
  if (nextConcepts.length > 0) {
    const concept = nextConcepts[0];
    return `This leads us to examine ${concept.toLowerCase()}...`;
  } else if (nextFirstSentence && nextFirstSentence.length > 10) {
    // Create generic transition based on content
    if (nextFirstSentence.toLowerCase().includes('now') || nextFirstSentence.toLowerCase().includes('next')) {
      return 'Moving on to our next topic...';
    } else if (nextFirstSentence.toLowerCase().includes('let')) {
      return "Let's shift our focus...";
    } else {
      return 'This brings us to the next point...';
    }
  }
  
  return 'Moving forward...';
}

/**
 * Generate simple transition from previous slide to current
 */
function generateTransitionFrom(previousScript: string, currentScript: string): string | null {
  if (!previousScript.trim() || !currentScript.trim()) return null;
  
  // Extract key concept from previous script to create connection
  const previousConcepts = extractKeyConcepts(previousScript);
  const currentFirstSentence = currentScript.split(/[.!?]+/)[0]?.trim();
  
  if (previousConcepts.length > 0) {
    const concept = previousConcepts[0];
    return `Building on ${concept.toLowerCase()} we just discussed...`;
  } else if (currentFirstSentence && currentFirstSentence.length > 10) {
    // Create generic transition
    if (currentFirstSentence.toLowerCase().includes('now') || currentFirstSentence.toLowerCase().includes('next')) {
      return 'Continuing from where we left off...';
    } else {
      return 'Following up on that point...';
    }
  }
  
  return 'Building on what we just covered...';
}

/**
 * 🆕 MAIN FUNCTION: Generate simplified content-focused guidance for a slide
 * This replaces the old coaching-heavy approach with pure content focus
 */
export function generateContentGuide(
  currentScript: string,
  previousScript?: string,
  nextScript?: string
): ContentGuide {
  if (!currentScript.trim()) {
    return {
      transitionFrom: null,
      keyMessages: [],
      keyConcepts: [],
      transitionTo: null
    };
  }
  
  return {
    transitionFrom: previousScript ? generateTransitionFrom(previousScript, currentScript) : null,
    keyMessages: extractKeyMessages(currentScript),
    keyConcepts: extractKeyConcepts(currentScript),
    transitionTo: nextScript ? generateTransitionTo(currentScript, nextScript) : null
  };
}

