// src/services/ai-slide-reader.ts
// ENTERPRISE AI SLIDE READER V2 - Production Ready
// Secure backend proxy architecture with batch processing and enterprise error handling
// Replaces deprecated localStorage-based implementation

export interface SlideContent {
  allText: string;
  title: string;
  keyPoints: string[];
  visualElements: string[];
  hasError?: boolean;
  errorMessage?: string;
}

export interface SlideReadOptions {
  detail?: 'low' | 'high' | 'auto';
  maxTokens?: number;
  extractStructure?: boolean;
}

/**
 * 🚀 ENTERPRISE AI Slide Reader Service V2
 * 
 * SECURITY FEATURES:
 * - Backend proxy prevents API key exposure
 * - Rate limiting and retry logic built-in
 * - Input validation and size limits
 * - Health monitoring for deployments
 * 
 * PERFORMANCE FEATURES:  
 * - Intelligent batch processing (3 slides at a time)
 * - Exponential backoff for rate limits
 * - Structured data extraction with fallbacks
 * - Cost optimization with gpt-4o-mini model
 */
export class AISlideReader {
  private readonly proxyEndpoint: string;
  private readonly maxRetries = 3;
  private readonly retryDelay = 1000; // ms
  
  constructor(proxyEndpoint = '/api/ai/read-slide') {
    this.proxyEndpoint = proxyEndpoint;
  }

  /**
   * Read a slide image and extract structured content
   * @param imageDataUrl - Data URL of the slide image  
   * @param options - Configuration for extraction detail and structure
   * @returns SlideContent with extracted text, title, key points, and visual elements
   */
  async readSlide(
    imageDataUrl: string, 
    options: SlideReadOptions = {}
  ): Promise<SlideContent> {
    // Input validation
    if (!imageDataUrl || !imageDataUrl.startsWith('data:image/')) {
      return this.createErrorResponse('Invalid image data URL provided');
    }

    // Check image size (prevent huge uploads that crash browser)
    const sizeInBytes = this.estimateBase64Size(imageDataUrl);
    if (sizeInBytes > 5_000_000) { // 5MB limit
      return this.createErrorResponse('Image too large. Please use images under 5MB.');
    }

    const {
      detail = 'low',
      maxTokens = 300,
      extractStructure = true
    } = options;

    try {
      const response = await this.callProxyWithRetry({
        imageDataUrl,
        prompt: this.buildPrompt(extractStructure),
        options: {
          detail,
          maxTokens,
          model: 'gpt-4o-mini' // Cost-effective: $0.0001 per slide
        }
      });

      return this.parseResponse(response);
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to read slide';
      return this.createErrorResponse(errorMessage);
    }
  }

  /**
   * Process multiple slides with intelligent rate limiting
   * @param imageUrls - Array of image data URLs
   * @param options - Extraction options  
   * @returns Array of SlideContent results
   */
  async readSlidesBatch(
    imageUrls: string[], 
    options: SlideReadOptions = {}
  ): Promise<SlideContent[]> {
    const results: SlideContent[] = [];
    const batchSize = 3; // Process 3 at a time to avoid rate limits
    
    for (let i = 0; i < imageUrls.length; i += batchSize) {
      const batch = imageUrls.slice(i, i + batchSize);
      const batchPromises = batch.map(url => this.readSlide(url, options));
      
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Rate limiting between batches
      if (i + batchSize < imageUrls.length) {
        await this.delay(500); // 500ms between batches
      }
    }
    
    return results;
  }

  /**
   * Test the backend proxy connection and configuration
   * @returns true if proxy is reachable and properly configured
   */
  async testConnection(): Promise<boolean> {
    try {
      const response = await fetch(`${this.proxyEndpoint}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Legacy compatibility method - kept for existing integrations
   */
  setApiKey(_key: string): void {
    if (process.env.NODE_ENV === 'development') {
      console.warn('🔐 AISlideReader V2: API keys are now managed securely via backend proxy. This method is deprecated.');
    }
  }

  // Private implementation methods...

  private async callProxyWithRetry(payload: Record<string, any>, attempt = 1): Promise<Record<string, any>> {
    try {
      const response = await fetch(this.proxyEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        if (response.status === 429 && attempt < this.maxRetries) {
          // Rate limited - wait and retry with exponential backoff
          await this.delay(this.retryDelay * attempt);
          return this.callProxyWithRetry(payload, attempt + 1);
        }
        
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}`);
      }

      return await response.json();
      
    } catch (error) {
      if (attempt < this.maxRetries && this.isRetryableError(error)) {
        await this.delay(this.retryDelay * attempt);
        return this.callProxyWithRetry(payload, attempt + 1);
      }
      throw error;
    }
  }

  private buildPrompt(extractStructure: boolean): string {
    if (extractStructure) {
      return `Analyze this slide and extract:
1. Main title or heading
2. All bullet points and text (preserve hierarchy)  
3. Any labels on charts, diagrams, or images
4. Key takeaways or important points

Format the response as:
TITLE: [main title]
CONTENT: [all text content]
KEY POINTS: [important points, one per line]
VISUAL ELEMENTS: [description of charts/images if any]`;
    }
    
    return 'Extract ALL text from this slide including titles, bullets, labels, and any other visible text. Be comprehensive.';
  }

  private parseResponse(response: Record<string, any>): SlideContent {
    if (!response || !response.content) {
      return this.createErrorResponse('No content in response');
    }

    const text = response.content;
    
    // Structured parsing with regex fallbacks
    const titleMatch = text.match(/TITLE:\s*(.+?)(?:\n|$)/i);
    const contentMatch = text.match(/CONTENT:\s*([\s\S]+?)(?:KEY POINTS:|VISUAL ELEMENTS:|$)/i);
    const keyPointsMatch = text.match(/KEY POINTS:\s*([\s\S]+?)(?:VISUAL ELEMENTS:|$)/i);
    const visualMatch = text.match(/VISUAL ELEMENTS:\s*([\s\S]+?)$/i);

    const title = titleMatch?.[1]?.trim() || '';
    const allText = contentMatch?.[1]?.trim() || text;
    
    const keyPoints = keyPointsMatch?.[1]
      ?.split('\n')
      .map((point: string) => point.trim())
      .filter((point: string) => point.length > 0 && point !== '-') || [];
      
    const visualElements = visualMatch?.[1]
      ?.split('\n')
      .map((element: string) => element.trim())
      .filter((element: string) => element.length > 0) || [];

    return {
      title,
      allText,
      keyPoints,
      visualElements,
      hasError: false
    };
  }

  private createErrorResponse(errorMessage: string): SlideContent {
    return {
      allText: '',
      title: '',
      keyPoints: [],
      visualElements: [],
      hasError: true,
      errorMessage
    };
  }

  private estimateBase64Size(dataUrl: string): number {
    const base64 = dataUrl.split(',')[1] || '';
    return (base64.length * 3) / 4;
  }

  private isRetryableError(error: unknown): boolean {
    if (error instanceof Error) {
      const message = error.message.toLowerCase();
      return message.includes('network') || 
             message.includes('timeout') ||
             message.includes('503') ||
             message.includes('502');
    }
    return false;
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance for backward compatibility
export const aiSlideReader = new AISlideReader();
