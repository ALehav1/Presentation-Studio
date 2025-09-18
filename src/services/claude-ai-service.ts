// src/services/claude-ai-service.ts
// Using Claude Sonnet 3.5 - Superior vision and reasoning for presentation analysis

/**
 * Premium AI Service using Claude Sonnet 3.5
 * Cost: ~$0.003 per image, ~$0.003 per 1K tokens
 * Total: ~$0.05-0.15 per presentation (incredible value!)
 */
export class ClaudeAIService {
  private apiKey: string = '';
  private model: string = 'claude-3-5-sonnet-20241022';
  private apiRoute: string = '/api/claude'; // Our Vercel Edge Function - PROPER SOLUTION!
  
  constructor() {
    this.apiKey = localStorage.getItem('anthropic_api_key') || '';
    console.log('🤖 Claude AI Service initialized');
  }

  /**
   * PREMIUM FEATURE 1: Deep slide analysis with Claude's superior vision
   * Extracts everything: text, topics, visuals, emotional tone
   */
  async analyzeSlideWithClaude(imageDataUrl: string, slideNumber: number): Promise<{
    success: boolean;
    analysis?: {
      allText: string;
      mainTopic: string;
      keyPoints: string[];
      visualElements: string[];
      suggestedTalkingPoints: string[];
      emotionalTone: string;
      complexity: 'simple' | 'moderate' | 'complex';
      recommendedDuration: number; // seconds
    };
    error?: string;
  }> {
    if (!this.apiKey) {
      return { 
        success: false, 
        error: 'Please add your Anthropic API key in settings' 
      };
    }

    try {
      console.log(`🔍 Claude analyzing slide ${slideNumber}...`);
      
      // Convert data URL to base64
      const base64Image = imageDataUrl.split(',')[1];
      if (!base64Image) {
        return { success: false, error: 'Invalid image format' };
      }
      
      const response = await fetch(this.apiRoute, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.apiKey,
          model: this.model,
          max_tokens: 1200,
          messages: [{
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: 'image/png',
                  data: base64Image
                }
              },
              {
                type: 'text',
                text: `You are an expert presentation analyst. Analyze this slide comprehensively and return ONLY a JSON object with this exact structure:

{
  "allText": "Every single word visible on the slide, including titles, bullets, labels, numbers",
  "mainTopic": "The primary subject/theme in 3-8 words",
  "keyPoints": ["point1", "point2", "point3"],
  "visualElements": ["chart type", "images", "diagrams", "etc"],
  "suggestedTalkingPoints": ["specific advice1", "specific advice2"],
  "emotionalTone": "professional/inspiring/urgent/celebratory/analytical",
  "complexity": "simple/moderate/complex",
  "recommendedDuration": 90
}

Be thorough in extracting ALL text. Look carefully for titles, subtitles, bullet points, chart labels, numbers, footnotes - everything readable.
Provide specific, actionable talking points based on the actual content.
Return ONLY the JSON, no other text.`
              }
            ]
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error?.message || `HTTP ${response.status}`;
        console.error('❌ Claude API error:', errorMessage);
        return { 
          success: false, 
          error: `Claude API error: ${errorMessage}`
        };
      }

      const data = await response.json();
      const content = data.content[0]?.text;
      
      if (!content) {
        return {
          success: false,
          error: 'No response from Claude'
        };
      }

      try {
        // Parse Claude's JSON response
        const analysis = JSON.parse(content);
        console.log(`✅ Claude analyzed slide ${slideNumber}:`, analysis);
        
        return { 
          success: true, 
          analysis 
        };
      } catch (parseError) {
        console.error('❌ Failed to parse Claude response:', content);
        return {
          success: false,
          error: 'Invalid response format from Claude'
        };
      }
      
    } catch (error) {
      console.error('❌ Claude analysis error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * PREMIUM FEATURE 2: Intelligent script-to-slide matching with Claude's reasoning
   * This is where Claude's superior reasoning shines - perfect topic alignment
   */
  async matchScriptToSlidesIntelligently(
    slideAnalyses: any[],
    fullScript: string
  ): Promise<{
    success: boolean;
    matches?: Array<{
      slideNumber: number;
      scriptSection: string;
      confidence: number;
      reasoning: string;
      keyAlignment: string[];
    }>;
    error?: string;
  }> {
    if (!this.apiKey) {
      return { success: false, error: 'API key required' };
    }

    try {
      console.log('🎯 Claude matching script to slides intelligently...');
      
      const response = await fetch(this.apiRoute, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.apiKey,
          model: this.model,
          max_tokens: 4000,
          messages: [{
            role: 'user',
            content: `You are an expert presentation coach. Match script content to slide topics.

SLIDES (${slideAnalyses.length} total):
${slideAnalyses.map((analysis, i) => `${i + 1}. ${analysis.mainTopic}`).join('\n')}

SCRIPT (${Math.round(fullScript.length / 4)} tokens):
${fullScript.substring(0, 2000)}${fullScript.length > 2000 ? '...[truncated]' : ''}

Match script sections to slide topics.

CRITICAL: Return ONLY a JSON array with ${slideAnalyses.length} script portions. No explanations, no commentary, just the raw JSON:
["script for slide 1", "script for slide 2", ...]

Focus on TOPIC ALIGNMENT, not word count.`
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: `API error: ${errorData.error?.message || response.status}`
        };
      }

      const data = await response.json();
      const content = data.content[0]?.text;
      
      try {
        // Simple approach: Find the JSON array using line-based extraction
        const lines = content.split('\n');
        let jsonLines = [];
        let inArray = false;
        
        for (const line of lines) {
          if (line.trim().startsWith('[')) {
            inArray = true;
            jsonLines.push(line);
          } else if (inArray && line.trim().endsWith(']')) {
            jsonLines.push(line);
            break;
          } else if (inArray) {
            jsonLines.push(line);
          }
        }
        
        if (jsonLines.length === 0) {
          throw new Error('No JSON array found in response');
        }
        
        const jsonStr = jsonLines.join('\n');
        
        const matchedSections = JSON.parse(jsonStr);
        
        if (!Array.isArray(matchedSections)) {
          throw new Error('Response is not an array');
        }
        
        console.log('✅ Claude matched script to slides:', matchedSections.length, 'sections');
        
        const result = {
          matches: matchedSections.map((section: string, i: number) => ({
            slideNumber: i + 1,
            scriptSection: section,
            confidence: 90,
            reasoning: 'AI content matching',
            keyAlignment: []
          }))
        };
        
        return {
          success: true,
          matches: result.matches
        };
      } catch (parseError) {
        console.error('❌ Failed to parse matching response:', content);
        return {
          success: false,
          error: 'Invalid matching response format'
        };
      }
      
    } catch (error) {
      console.error('❌ Script matching error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Matching failed'
      };
    }
  }

  /**
   * PREMIUM FEATURE 3: Expert-level presenter coaching
   * Claude generates world-class presentation advice based on actual content
   */
  async generateExpertCoaching(
    slideAnalysis: any,
    scriptSection: string,
    slideNumber: number,
    totalSlides: number
  ): Promise<{
    success: boolean;
    coaching?: {
      openingStrategy: string;
      keyEmphasisPoints: string[];
      bodyLanguageTips: string[];
      voiceModulation: string[];
      audienceEngagement: string[];
      transitionToNext: string;
      timingRecommendation: string;
      potentialQuestions: string[];
      commonMistakes: string[];
      energyLevel: 'low' | 'medium' | 'high';
    };
    error?: string;
  }> {
    if (!this.apiKey) {
      return { success: false, error: 'API key required' };
    }

    try {
      console.log(`🎤 Claude generating expert coaching for slide ${slideNumber}...`);
      
      const response = await fetch(this.apiRoute, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.apiKey,
          model: this.model,
          max_tokens: 2000,
          messages: [{
            role: 'user',
            content: `You are a world-class presentation coach (think TED Talk level expertise). Generate specific, actionable coaching for this slide.

CONTEXT:
- This is slide ${slideNumber} of ${totalSlides}
- Slide Topic: ${slideAnalysis.mainTopic}
- Slide Content: ${slideAnalysis.allText}
- Visual Elements: ${slideAnalysis.visualElements?.join(', ') || 'None'}
- Complexity: ${slideAnalysis.complexity}
- Emotional Tone: ${slideAnalysis.emotionalTone}

SPEAKER'S SCRIPT FOR THIS SLIDE:
${scriptSection}

Generate expert-level coaching and return ONLY a JSON object:
{
  "openingStrategy": "Specific opening technique for this slide",
  "keyEmphasisPoints": ["specific word/phrase to emphasize", "another emphasis point"],
  "bodyLanguageTips": ["specific gesture or movement", "posture advice"],
  "voiceModulation": ["when to pause", "when to slow down", "tone changes"],
  "audienceEngagement": ["specific question to ask", "interaction technique"],
  "transitionToNext": "Smooth bridge to slide ${slideNumber + 1}",
  "timingRecommendation": "X seconds - reasoning for this timing",
  "potentialQuestions": ["likely audience question", "another potential question"],
  "commonMistakes": ["mistake to avoid", "another pitfall"],
  "energyLevel": "high"
}

Be specific and reference the actual slide content. Focus on techniques that top presenters use.`
          }]
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        return { 
          success: false, 
          error: `API error: ${errorData.error?.message || response.status}`
        };
      }

      const data = await response.json();
      const content = data.content[0]?.text;
      
      try {
        const coaching = JSON.parse(content);
        console.log(`✅ Expert coaching generated for slide ${slideNumber}`);
        
        return { 
          success: true, 
          coaching 
        };
      } catch (parseError) {
        console.error('❌ Failed to parse coaching response:', content);
        return {
          success: false,
          error: 'Invalid coaching response format'
        };
      }
      
    } catch (error) {
      console.error('❌ Coaching generation error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Coaching failed'
      };
    }
  }

  /**
   * Test API connection with Claude via our Vercel Edge Function
   */
  async testConnection(): Promise<{connected: boolean; message: string; model?: string}> {
    if (!this.apiKey) {
      return { connected: false, message: 'No API key provided' };
    }

    try {
      console.log('🔗 Testing Claude connection via Edge Function...');
      
      const response = await fetch(this.apiRoute, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.apiKey,
          model: this.model,
          max_tokens: 20,
          messages: [{
            role: 'user',
            content: 'Say "Claude connected!" and nothing else.'
          }]
        })
      });

      if (response.ok) {
        const data = await response.json();
        const reply = data.content[0]?.text || '';
        console.log('✅ Claude connection successful via Edge Function');
        
        return { 
          connected: true, 
          message: `${reply} Model: ${this.model}`,
          model: this.model
        };
      } else {
        const errorData = await response.json().catch(() => ({}));
        const errorMsg = errorData.error?.message || `HTTP ${response.status}`;
        console.log('❌ Claude connection failed:', errorMsg);
        
        return { 
          connected: false, 
          message: `Connection failed: ${errorMsg}`
        };
      }
    } catch (error) {
      console.error('❌ Connection test error:', error);
      return { 
        connected: false, 
        message: `Network error: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  /**
   * Check if API key is available
   */
  hasApiKey(): boolean {
    return Boolean(this.apiKey);
  }

  /**
   * Get current model info
   */
  getModelInfo(): {name: string; description: string; costPer1k: number} {
    return {
      name: 'Claude 3.5 Sonnet',
      description: 'Superior vision and reasoning capabilities',
      costPer1k: 0.003 // $3 per million tokens
    };
  }

  /**
   * Compress image to prevent Edge Function timeouts
   * Reduces image size from ~500KB to ~50KB
   */
  private async compressImageForClaude(dataUrl: string): Promise<string | null> {
    try {
      // Extract base64 data
      const base64Data = dataUrl.split(',')[1];
      if (!base64Data) return null;

      // Create image element for compression
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          // Create canvas for compression
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d')!;

          // Compress to max 800x600 while maintaining aspect ratio
          const maxWidth = 800;
          const maxHeight = 600;
          let { width, height } = img;

          if (width > maxWidth || height > maxHeight) {
            const ratio = Math.min(maxWidth / width, maxHeight / height);
            width *= ratio;
            height *= ratio;
          }

          canvas.width = width;
          canvas.height = height;
          
          // Draw compressed image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Get compressed base64 (quality 0.7 = ~70% compression)
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.7);
          const compressedBase64 = compressedDataUrl.split(',')[1];
          
          console.log(`📉 Image compressed: ${Math.round(base64Data.length / 1024)}KB → ${Math.round(compressedBase64.length / 1024)}KB`);
          resolve(compressedBase64);
        };
        img.src = dataUrl;
      });
    } catch (error) {
      console.error('❌ Image compression failed:', error);
      return null;
    }
  }
}

// Export singleton instance
export const claudeAI = new ClaudeAIService();
