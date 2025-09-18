// src/services/ai-slide-reader.ts
// MVP: Just get AI reading slides first, then build from there

/**
 * AI Slide Reader Service
 * MVP implementation for reading slide content using OpenAI Vision API
 * Cost: ~$0.0001 per slide with GPT-4o-mini
 */
export class AISlideReader {
  private apiKey: string;
  
  constructor() {
    // Start with localStorage, move to secure storage later
    this.apiKey = localStorage.getItem('openai_api_key') || '';
  }

  /**
   * MVP Feature: Just read what's on the slide
   * Returns structured response with success/error handling
   */
  async readSlide(imageDataUrl: string): Promise<{
    success: boolean;
    content?: string;
    error?: string;
  }> {
    if (!this.apiKey) {
      return { 
        success: false, 
        error: 'Add OpenAI API key in settings' 
      };
    }

    try {
      console.log('🤖 AI reading slide content...');
      
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini', // Cheaper for testing: $0.0001 per image
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: 'List all text on this slide. Include titles, bullets, labels on charts, everything. Be comprehensive but concise.'
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: imageDataUrl,
                    detail: 'low' // Start with low detail to save costs
                  }
                }
              ]
            }
          ],
          max_tokens: 300
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
        console.error('❌ OpenAI API error:', errorMessage);
        return { 
          success: false, 
          error: `API error: ${errorMessage}`
        };
      }

      const data = await response.json();
      const content = data.choices[0]?.message?.content;
      
      if (!content) {
        return {
          success: false,
          error: 'No content returned from API'
        };
      }
      
      console.log('✅ AI successfully read slide content:', content);
      
      return { 
        success: true, 
        content 
      };
      
    } catch (error) {
      console.error('❌ AI slide reading failed:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test the API key connection
   * Quick validation without using vision credits
   */
  async testConnection(): Promise<boolean> {
    if (!this.apiKey) return false;
    
    try {
      console.log('🔗 Testing OpenAI connection...');
      
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`
        }
      });
      
      const isValid = response.ok;
      console.log(isValid ? '✅ API key valid' : '❌ API key invalid');
      
      return isValid;
    } catch (error) {
      console.error('❌ Connection test failed:', error);
      return false;
    }
  }

  /**
   * Update the API key
   */
  setApiKey(key: string): void {
    this.apiKey = key;
    localStorage.setItem('openai_api_key', key);
    console.log('🔑 API key updated');
  }

  /**
   * Get current API key status
   */
  hasApiKey(): boolean {
    return Boolean(this.apiKey);
  }
}

// Export singleton instance
export const aiSlideReader = new AISlideReader();
