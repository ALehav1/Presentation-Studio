// SECURE AI-powered slide reading using backend proxy
// Extracts text and visual content from slide images without exposing API keys

import { SecureOpenAIService } from './secure-openai-service';
import { logError } from '../shared/utils/debug';

export interface SlideContent {
  allText: string;
  keyPoints: string[];
  title: string;
}

/**
 * SECURE AI Slide Reader Service
 * Uses backend proxy to read and extract content from slide images
 * API key is never exposed to the browser
 */
export class SecureAISlideReader {
  private secureAI: SecureOpenAIService;

  constructor() {
    this.secureAI = new SecureOpenAIService();
  }

  /**
   * Read a slide image and extract all text content
   * @param imageUrl - Data URL or blob URL of the slide image
   * @returns SlideContent with extracted text and structure
   */
  async readSlide(imageUrl: string): Promise<SlideContent> {
    if (!imageUrl || !imageUrl.startsWith('data:')) {
      throw new Error('Valid image data URL is required');
    }

    try {
      const prompt = 'List all text on this slide. Include titles, bullets, labels on charts, everything. Be comprehensive but concise.';
      
      const extractedText = await this.secureAI.analyzeImage(imageUrl, prompt, {
        model: 'gpt-4o-mini', // Cheaper for testing: $0.0001 per image
        maxTokens: 300,
        detail: 'low' // Keep costs down for bulk processing
      });

      // Parse the extracted text into structured content
      return this.parseSlideContent(extractedText);

    } catch (error) {
      logError('Error reading slide with secure AI', error);
      throw error;
    }
  }

  /**
   * Parse extracted text into structured slide content
   * @param extractedText - Raw text from AI vision analysis
   * @returns Structured SlideContent object
   */
  private parseSlideContent(extractedText: string): SlideContent {
    const lines = extractedText.split('\n').map(line => line.trim()).filter(Boolean);
    
    // Extract title (usually first line or largest text)
    const title = lines[0] || 'Untitled Slide';
    
    // Extract key points (bullet points, numbered items, etc.)
    const keyPoints = lines.filter(line => 
      line.match(/^[-•*\d+\.]\s/) || 
      line.length > 20  // Substantial text likely to be a key point
    ).slice(0, 5); // Limit to 5 key points

    return {
      allText: extractedText,
      keyPoints: keyPoints.length > 0 ? keyPoints : [extractedText.slice(0, 100)], 
      title: title.length > 50 ? title.slice(0, 50) + '...' : title
    };
  }

  /**
   * Read multiple slides in batch with error handling
   * @param imageUrls - Array of slide image URLs
   * @returns Array of SlideContent results
   */
  async readSlides(imageUrls: string[]): Promise<Array<SlideContent | null>> {
    const results = await Promise.allSettled(
      imageUrls.map(url => this.readSlide(url))
    );

    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value;
      } else {
        logError('Failed to read slide', result.reason);
        return null;
      }
    });
  }

  /**
   * Check if the service is available (backend proxy is working)
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Simple test request
      await this.secureAI.generateText('Test', { maxTokens: 10 });
      return true;
    } catch {
      return false;
    }
  }
}
