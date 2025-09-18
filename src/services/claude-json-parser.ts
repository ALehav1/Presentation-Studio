// claude-json-parser.ts - Enhanced version that handles JavaScript-style arrays with comments
// Replace your entire claude-json-parser.ts with this version

/**
 * Reliably extracts JSON arrays from Claude's mixed-content responses
 * Now handles JavaScript-style arrays with comments
 */
export class ClaudeJSONParser {
  /**
   * Extract a JSON array from Claude's response, handling all common patterns
   * @param content - The raw text from Claude's response
   * @returns The parsed JSON array or throws an error with helpful debugging
   */
  static extractJSONArray(content: string): string[] {
    if (!content || typeof content !== 'string') {
      throw new Error('Invalid content: expected non-empty string');
    }

    // Strategy 1: Try to clean and parse JavaScript-style array (NEW!)
    const jsArraySections = this.extractJavaScriptArray(content);
    if (jsArraySections.length > 0) {
      return jsArraySections;
    }

    // Strategy 2: Try to find and extract a clean JSON array
    const jsonArrayMatch = this.findJSONArray(content);
    if (jsonArrayMatch) {
      try {
        const parsed = JSON.parse(jsonArrayMatch);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      } catch (e) {
        // Continue to next strategy
      }
    }

    // Strategy 3: Look for numbered or bulleted script sections
    const numberedSections = this.extractNumberedSections(content);
    if (numberedSections.length > 0) {
      return numberedSections;
    }

    // Strategy 4: Extract quoted strings that look like script sections
    const quotedSections = this.extractQuotedSections(content);
    if (quotedSections.length > 0) {
      return quotedSections;
    }

    // Strategy 5: Emergency fallback - split by clear paragraph breaks
    const paragraphSections = this.extractParagraphSections(content);
    if (paragraphSections.length > 0) {
      return paragraphSections;
    }

    throw new Error(
      'Could not extract script sections from response. ' +
      'Response format may have changed. Raw content: ' + 
      content.substring(0, 200) + '...'
    );
  }

  /**
   * NEW: Extract JavaScript-style array with comments
   * Handles Claude's format with // comments and placeholders
   */
  private static extractJavaScriptArray(content: string): string[] {
    const sections: string[] = [];
    
    // Find the array bounds
    const startIdx = content.indexOf('[');
    const endIdx = content.lastIndexOf(']');
    
    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
      return [];
    }
    
    // Extract the array content
    const arrayContent = content.substring(startIdx + 1, endIdx);
    
    // Split by lines and process
    const lines = arrayContent.split('\n');
    let currentString = '';
    let inString = false;
    let stringChar = '';
    
    for (const line of lines) {
      const trimmed = line.trim();
      
      // Skip empty lines and comments
      if (!trimmed || trimmed.startsWith('//')) {
        continue;
      }
      
      // Handle placeholder text like [Content not clearly present...]
      if (trimmed.startsWith('[') && trimmed.includes('Content not') && trimmed.endsWith(',')) {
        // Add an empty string for missing content
        sections.push('');
        continue;
      }
      if (trimmed.startsWith('[') && trimmed.includes('Content not') && trimmed.endsWith(']')) {
        // Add an empty string for missing content
        sections.push('');
        continue;
      }
      
      // Process string content
      for (let i = 0; i < trimmed.length; i++) {
        const char = trimmed[i];
        
        if (!inString) {
          if (char === '"' || char === "'") {
            inString = true;
            stringChar = char;
            currentString = '';
          }
        } else {
          if (char === stringChar && trimmed[i - 1] !== '\\') {
            // End of string found
            inString = false;
            if (currentString.trim()) {
              sections.push(currentString);
            }
            currentString = '';
          } else {
            currentString += char;
          }
        }
      }
      
      // Handle multi-line strings
      if (inString && currentString) {
        currentString += ' '; // Add space for line continuation
      }
    }
    
    // Filter out empty sections but keep placeholders
    return sections;
  }

  /**
   * Find a JSON array in the content using multiple patterns
   */
  private static findJSONArray(content: string): string | null {
    // Remove code block markers if present
    const cleanContent = content
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '');

    // Method 1: Find content between first [ and last ]
    const firstBracket = cleanContent.indexOf('[');
    const lastBracket = cleanContent.lastIndexOf(']');
    
    if (firstBracket !== -1 && lastBracket !== -1 && lastBracket > firstBracket) {
      const candidate = cleanContent.substring(firstBracket, lastBracket + 1);
      
      // Clean up JavaScript-style array to make it JSON-compatible
      const cleaned = candidate
        .replace(/\/\/[^\n\r]*/g, '') // Remove // comments
        .replace(/\/\*[\s\S]*?\*\//g, '') // Remove /* */ comments
        .replace(/,(\s*[\]}])/g, '$1') // Remove trailing commas
        .replace(/\[Content[^\]]*\]/g, '""'); // Replace placeholders with empty strings
      
      // Quick validation
      if (cleaned.trim().startsWith('[') && cleaned.trim().endsWith(']')) {
        try {
          // Test parse
          JSON.parse(cleaned);
          return cleaned;
        } catch {
          // Not valid JSON even after cleaning
        }
      }
    }

    // Method 2: Regex for a complete JSON array
    const arrayRegex = /\[\s*(?:"[^"]*"|\{[^}]*\})(?:\s*,\s*(?:"[^"]*"|\{[^}]*\}))*\s*\]/gs;
    const matches = content.match(arrayRegex);
    if (matches && matches.length > 0) {
      // Return the longest match (likely the most complete)
      return matches.reduce((a, b) => a.length > b.length ? a : b);
    }

    return null;
  }

  /**
   * Extract numbered sections like "1. Script text"
   */
  private static extractNumberedSections(content: string): string[] {
    const sections: string[] = [];
    const lines = content.split('\n');
    
    let currentSection = '';
    let inNumberedList = false;
    
    for (const line of lines) {
      // Check if line starts with a number followed by . or )
      const numberedMatch = line.match(/^\s*\d+[\.)]\s+(.+)/);
      
      if (numberedMatch) {
        // Save previous section if exists
        if (currentSection.trim()) {
          sections.push(currentSection.trim());
        }
        // Start new section
        currentSection = numberedMatch[1];
        inNumberedList = true;
      } else if (inNumberedList && line.trim()) {
        // Continue current section if we're in a numbered list
        // but stop at clear boundaries
        if (line.includes('Note:') || line.includes('```') || 
            line.match(/^[A-Z][A-Z\s]+:/) || // All caps headers
            line.match(/^\*\*[^*]+\*\*:?$/)) { // Bold headers
          inNumberedList = false;
          if (currentSection.trim()) {
            sections.push(currentSection.trim());
            currentSection = '';
          }
        } else if (!line.match(/^\s*\d+[\.)]/)) {
          // Add to current section if not a new number
          currentSection += ' ' + line.trim();
        }
      }
    }
    
    // Don't forget the last section
    if (currentSection.trim()) {
      sections.push(currentSection.trim());
    }
    
    return sections.filter(s => s.length > 20); // Filter out tiny fragments
  }

  /**
   * Extract quoted sections that look like script content
   */
  private static extractQuotedSections(content: string): string[] {
    const sections: string[] = [];
    
    // Look for content in quotes that's substantial (>20 chars)
    const quoteRegex = /"([^"]{20,})"/g;
    let match;
    
    while ((match = quoteRegex.exec(content)) !== null) {
      const text = match[1];
      // Check if it looks like script content (has multiple words, proper sentences)
      if (text.split(' ').length > 5 && /[.!?]/.test(text)) {
        sections.push(text);
      }
    }
    
    return sections;
  }

  /**
   * Emergency fallback: extract clear paragraph sections
   */
  private static extractParagraphSections(content: string): string[] {
    const sections: string[] = [];
    
    // Split on double newlines or clear section markers
    const paragraphs = content.split(/\n\n+|\n---+\n|\n\*\*\*/);
    
    for (const para of paragraphs) {
      const cleaned = para.trim();
      // Look for substantial paragraphs that look like script content
      if (cleaned.length > 50 && 
          !cleaned.startsWith('Note:') &&
          !cleaned.startsWith('SLIDE') &&
          !cleaned.includes('```') &&
          cleaned.split(' ').length > 10) {
        sections.push(cleaned);
      }
    }
    
    return sections;
  }

  /**
   * Validate that extracted sections make sense for slides
   */
  static validateExtractedSections(
    sections: string[], 
    expectedCount: number
  ): { valid: boolean; message: string } {
    if (!Array.isArray(sections)) {
      return { valid: false, message: 'Extracted content is not an array' };
    }
    
    if (sections.length === 0) {
      return { valid: false, message: 'No sections extracted' };
    }
    
    // Allow some flexibility in count (±2 slides)
    if (Math.abs(sections.length - expectedCount) > 2) {
      return { 
        valid: false, 
        message: `Expected ~${expectedCount} sections, got ${sections.length}`  
      };
    }
    
    // Check that sections have reasonable length (excluding empty placeholders)
    const nonEmptySections = sections.filter(s => s.length > 0);
    if (nonEmptySections.length === 0) {
      return { valid: false, message: 'All sections are empty' };
    }
    
    const avgLength = nonEmptySections.reduce((sum, s) => sum + s.length, 0) / nonEmptySections.length;
    if (avgLength < 20) {
      return { valid: false, message: 'Sections are too short to be meaningful' };
    }
    
    return { valid: true, message: 'Sections validated successfully' };
  }
}

// Alternative prompt that might help avoid JavaScript-style responses
export function buildStrictJSONPrompt(
  slideAnalyses: any[], 
  fullScript: string
): string {
  return `Return a pure JSON array of script sections. 

CRITICAL RULES:
- NO comments (no // or /* */ )
- NO placeholders - if no content for a slide, use empty string ""
- NO trailing commas
- ONLY valid JSON syntax
- Start with [ and end with ]

Match this script to exactly ${slideAnalyses.length} slides.

Slides to match:
${slideAnalyses.map((s, i) => `${i + 1}. ${s.mainTopic}`).join('\n')}

Script to divide:
${fullScript}

Return EXACTLY ${slideAnalyses.length} strings in this format:
[
  "Script for slide 1",
  "Script for slide 2",
  "Script for slide 3",
  "Script for slide 4",
  "Script for slide 5",
  "Script for slide 6",
  "Script for slide 7"
]

If no content matches a slide, use empty string "". 
Do not use placeholders or comments.`;
}