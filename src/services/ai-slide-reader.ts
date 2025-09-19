// src/services/ai-slide-reader.ts
// LEGACY FILE - Replaced by secure-ai-slide-reader.ts
// This file exposed API keys to browser - SECURITY RISK
// Use SecureAISlideReader from secure-ai-slide-reader.ts instead

export interface SlideContent {
  allText: string;
  keyPoints: string[];
  title: string;
}

/**
 * @deprecated Use SecureAISlideReader instead
 * This class exposed API keys to browser localStorage
 */
export class AISlideReader {
  constructor() {
    console.warn('⚠️ AISlideReader is deprecated due to security risks. Use SecureAISlideReader instead.');
  }

  async readSlide(_imageUrl: string): Promise<SlideContent> {
    throw new Error('AISlideReader is deprecated. Use SecureAISlideReader from secure-ai-slide-reader.ts');
  }

  setApiKey(_key: string): void {
    throw new Error('AISlideReader is deprecated. Use SecureAISlideReader from secure-ai-slide-reader.ts');
  }

  async testConnection(): Promise<boolean> {
    throw new Error('AISlideReader is deprecated. Use SecureAISlideReader from secure-ai-slide-reader.ts');
  }
}

// Export singleton instance
export const aiSlideReader = new AISlideReader();
