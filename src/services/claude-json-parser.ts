// claude-json-parser.ts - Reliable JSON extraction from Claude responses
// Place this in src/services/claude-json-parser.ts

/**
 * Reliably extracts JSON arrays from Claude's mixed-content responses
 * This handles all the edge cases you've encountered
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

    // Strategy 1: Try to find and extract a clean JSON array first
    // This handles most cases where JSON is somewhat isolated
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

    // Strategy 2: Look for numbered or bulleted script sections
    // Claude often formats as "1. Script text" or "- Script text"
    const numberedSections = this.extractNumberedSections(content);
    if (numberedSections.length > 0) {
      return numberedSections;
    }

    // Strategy 3: Extract quoted strings that look like script sections
    const quotedSections = this.extractQuotedSections(content);
    if (quotedSections.length > 0) {
      return quotedSections;
    }

    // Strategy 4: Emergency fallback - split by clear paragraph breaks
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
      
      // Quick validation: should start with [ and end with ]
      if (candidate.trim().startsWith('[') && candidate.trim().endsWith(']')) {
        // Additional validation: should contain quotes (for strings)
        if (candidate.includes('"') || candidate.includes("'")) {
          return candidate;
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
    
    // Check that sections have reasonable length
    const avgLength = sections.reduce((sum, s) => sum + s.length, 0) / sections.length;
    if (avgLength < 20) {
      return { valid: false, message: 'Sections are too short to be meaningful' };
    }
    
    return { valid: true, message: 'Sections validated successfully' };
  }
}

// Usage example for your claude-ai-service.ts file:
export async function parseClaudeScriptMatching(
  claudeResponse: string, 
  expectedSlideCount: number
): Promise<string[]> {
  try {
    console.log('📝 Parsing Claude response for script matching...');
    
    // Extract the JSON array
    const sections = ClaudeJSONParser.extractJSONArray(claudeResponse);
    
    // Validate the extraction
    const validation = ClaudeJSONParser.validateExtractedSections(
      sections, 
      expectedSlideCount
    );
    
    if (!validation.valid) {
      console.warn(`⚠️ Validation warning: ${validation.message}` );
      // You might still want to use the sections even if validation fails
      // depending on your app's needs
    }
    
    console.log(`✅ Successfully extracted ${sections.length} script sections` );
    return sections;
    
  } catch (error) {
    console.error('❌ Failed to parse Claude response:', error.message);
    console.log('📊 Raw response preview:', claudeResponse.substring(0, 500));
    throw error;
  }
}

// Alternative: Force Claude to use a specific format with strong prompting
export function buildStrictJSONPrompt(
  slideAnalyses: any[], 
  fullScript: string
): string {
  return `You must respond with ONLY a JSON array. No other text whatsoever.

CRITICAL INSTRUCTIONS:
1. Your ENTIRE response must be valid JSON
2. Start with [ and end with ]
3. No text before the [
4. No text after the ]
5. No explanations
6. No notes
7. No commentary
8. ONLY the JSON array

Match this script to ${slideAnalyses.length} slides:

${slideAnalyses.map((s, i) => `Slide ${i + 1}: ${s.mainTopic}` ).join('\n')}

Script to divide:
${fullScript}

Respond with EXACTLY this format (no other text):
[
  "First part of script for slide 1...",
  "Second part of script for slide 2...",
  "Third part of script for slide 3..."
]

FINAL REMINDER: Your response must start with [ and end with ] with nothing else.`;
}
