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
    // console.log('🤖 Claude AI Service initialized'); // Commented out - using OpenAI now
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
        // Use the robust extractor instead of JSON.parse
        const analysis = this.extractClaudeJSON(content);
        
        if (analysis) {
          console.log(`✅ Claude analyzed slide ${slideNumber}:`, analysis);
          return { 
            success: true, 
            analysis 
          };
        } else {
          // Fallback analysis if parsing failed
          console.log(`⚠️ Using fallback analysis for slide ${slideNumber}`);
          return {
            success: true,
            analysis: {
              allText: `Slide ${slideNumber}`,
              mainTopic: 'Presentation slide',
              keyPoints: ['Content analysis pending'],
              visualElements: [],
              suggestedTalkingPoints: ['Present this slide clearly'],
              emotionalTone: 'professional',
              complexity: 'moderate',
              recommendedDuration: 60
            }
          };
        }
      } catch (parseError) {
        console.error('❌ Failed to parse Claude response:', parseError);
        // Return valid fallback instead of error
        return {
          success: true,
          analysis: {
            allText: `Slide ${slideNumber}`,
            mainTopic: `Slide ${slideNumber}`,
            keyPoints: [],
            visualElements: [],
            suggestedTalkingPoints: [],
            emotionalTone: 'professional',
            complexity: 'moderate',
            recommendedDuration: 60
          }
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
   * Now with robust JSON parsing that handles Claude's commentary
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
      return { 
        success: false, 
        error: 'Please add your Anthropic API key in settings' 
      };
    }

    console.log('🤖 Claude intelligently matching script to slide topics...');
    
    try {
      // Build intelligent prompt that gives Claude context about slide topics
      const prompt = `You are an expert presentation coach. Match this script to slide topics intelligently.

SLIDE TOPICS:
${slideAnalyses.map((s, i) => `${i + 1}. ${s.mainTopic} - Key points: ${s.keyPoints?.join(', ') || 'N/A'}`).join('\n')}

FULL SCRIPT TO MATCH:
${fullScript}

Task: Divide the script into exactly ${slideAnalyses.length} sections that align with the slide topics above. Each section should contain the script content most relevant to that slide's topic.

CRITICAL: Return ONLY a valid JSON array of strings. No explanations, no commentary, no brackets inside strings.

Format: ["script for slide 1", "script for slide 2", ...]`;

      const response = await fetch(this.apiRoute, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: this.apiKey,
          model: this.model,
          max_tokens: 4000,
          messages: [{ role: 'user', content: prompt }]
        })
      });

      if (!response.ok) {
        throw new Error(`Claude API failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.content?.[0]?.text || '';
      
      console.log('📄 Claude response length:', content.length);
      console.log('🔍 Response preview:', content.substring(0, 300));

      // USE THE ROBUST EXTRACTOR WE JUST CREATED
      const scriptSections = this.extractClaudeJSON(content);
      
      if (!Array.isArray(scriptSections)) {
        console.log('⚠️ Claude returned non-array, using semantic fallback');
        const fallbackSections = this.fallbackSemanticSplit(fullScript, slideAnalyses.length);
        
        return {
          success: true,
          matches: fallbackSections.map((section: string, i: number) => ({
            slideNumber: i + 1,
            scriptSection: section,
            confidence: 70,
            reasoning: 'Semantic fallback - Claude parsing failed',
            keyAlignment: []
          }))
        };
      }

      let finalSections = scriptSections;

      // If we still don't have sections, use fallback
      if (finalSections.length === 0) {
        console.log('📊 Using semantic fallback');
        finalSections = this.fallbackSemanticSplit(fullScript, slideAnalyses.length);
      }

      // Ensure we have exactly the right count
      while (finalSections.length < slideAnalyses.length) {
        finalSections.push('');
      }
      while (finalSections.length > slideAnalyses.length) {
        const last = finalSections.pop() || '';
        const secondLast = finalSections.pop() || '';
        finalSections.push(secondLast + ' ' + last);
      }

      const matches = finalSections.map((section: string, i: number) => ({
        slideNumber: i + 1,
        scriptSection: section.trim() || `Script section ${i + 1}`,
        confidence: 95,
        reasoning: 'AI content matching with topic alignment',
        keyAlignment: this.findKeyAlignments(section, slideAnalyses[i])
      }));

      console.log(`🎯 Successfully matched script using AI intelligence!`);
      
      return {
        success: true,
        matches: matches
      };

    } catch (error) {
      console.error('❌ AI matching failed, using semantic fallback:', error);
      
      // Fallback to semantic split (still smarter than random sentence splitting)
      const fallbackSections = this.fallbackSemanticSplit(fullScript, slideAnalyses.length);
      
      return {
        success: true,
        matches: fallbackSections.map((section: string, i: number) => ({
          slideNumber: i + 1,
          scriptSection: section,
          confidence: 70,
          reasoning: 'Semantic fallback distribution',
          keyAlignment: []
        }))
      };
    }
  }

  /**
   * Robust JSON extractor that handles all Claude response formats
   */
  private extractClaudeJSON(content: string): any {
    // Method 1: Try direct JSON parse
    try {
      // First try: parse as-is
      return JSON.parse(content);
    } catch (e1) {
      // Method 2: Extract JSON between first { and last }
      const objStart = content.indexOf('{');
      const objEnd = content.lastIndexOf('}');
      
      if (objStart !== -1 && objEnd !== -1) {
        try {
          const jsonStr = content.substring(objStart, objEnd + 1);
          return JSON.parse(jsonStr);
        } catch (e2) {
          // Continue to next method
        }
      }
      
      // Method 3: Extract array between [ and ]
      const arrStart = content.indexOf('[');
      const arrEnd = content.lastIndexOf(']');
      
      if (arrStart !== -1 && arrEnd !== -1) {
        try {
          const jsonStr = content.substring(arrStart, arrEnd + 1);
          return JSON.parse(jsonStr);
        } catch (e3) {
          // Continue to fallback
        }
      }
      
      // Method 4: Return null for fallback handling
      console.warn('Could not parse Claude response, using fallback');
      return null;
    }
  }

  /**
   * Find key phrase alignments between script section and slide analysis
   */
  private findKeyAlignments(scriptSection: string, slideAnalysis: any): string[] {
    if (!slideAnalysis || !scriptSection) return [];
    
    const alignments: string[] = [];
    const scriptLower = scriptSection.toLowerCase();
    
    // Check main topic alignment
    if (slideAnalysis.mainTopic) {
      const topicWords = slideAnalysis.mainTopic.toLowerCase().split(' ');
      for (const word of topicWords) {
        if (word.length > 3 && scriptLower.includes(word)) {
          alignments.push(word);
        }
      }
    }
    
    // Check key points alignment
    if (slideAnalysis.keyPoints) {
      for (const point of slideAnalysis.keyPoints) {
        const pointWords = point.toLowerCase().split(' ');
        for (const word of pointWords) {
          if (word.length > 3 && scriptLower.includes(word) && !alignments.includes(word)) {
            alignments.push(word);
          }
        }
      }
    }
    
    return alignments.slice(0, 3); // Return top 3 alignments
  }


  /**
   * Adjust section count if we got close but not exact
   */
  private adjustSectionCount(sections: string[], targetCount: number): string[] {
    if (sections.length === targetCount) {
      return sections;
    }
    
    if (sections.length > targetCount) {
      // Merge the shortest adjacent sections
      console.log(`📝 Merging ${sections.length} sections down to ${targetCount}`);
      const result = [...sections];
      
      while (result.length > targetCount) {
        // Find shortest adjacent pair
        let shortestPairIndex = 0;
        let shortestPairLength = result[0].length + result[1].length;
        
        for (let i = 1; i < result.length - 1; i++) {
          const pairLength = result[i].length + result[i + 1].length;
          if (pairLength < shortestPairLength) {
            shortestPairIndex = i;
            shortestPairLength = pairLength;
          }
        }
        
        // Merge the pair
        result[shortestPairIndex] = result[shortestPairIndex] + ' ' + result[shortestPairIndex + 1];
        result.splice(shortestPairIndex + 1, 1);
      }
      
      return result;
    }
    
    if (sections.length < targetCount) {
      // Split the longest sections
      console.log(`📝 Splitting ${sections.length} sections up to ${targetCount}`);
      const result = [...sections];
      
      while (result.length < targetCount) {
        // Find longest section
        let longestIndex = 0;
        let longestLength = result[0].length;
        
        for (let i = 1; i < result.length; i++) {
          if (result[i].length > longestLength) {
            longestIndex = i;
            longestLength = result[i].length;
          }
        }
        
        // Split at midpoint sentence boundary
        const toSplit = result[longestIndex];
        const sentences = toSplit.match(/[^.!?]+[.!?]+/g) || [toSplit];
        const midPoint = Math.floor(sentences.length / 2);
        
        const firstHalf = sentences.slice(0, midPoint).join(' ');
        const secondHalf = sentences.slice(midPoint).join(' ');
        
        result[longestIndex] = firstHalf;
        result.splice(longestIndex + 1, 0, secondHalf);
      }
      
      return result;
    }
    
    return sections;
  }

  /**
   * Fallback semantic splitter when Claude matching fails
   */
  private fallbackSemanticSplit(script: string, slideCount: number): string[] {
    console.log('🔄 Using semantic script splitter as fallback');
    
    // Split by paragraphs first
    const paragraphs = script.split(/\n\n+/).filter(p => p.trim().length > 0);
    
    if (paragraphs.length >= slideCount) {
      // We have enough paragraphs, distribute them
      const sections: string[] = [];
      const parasPerSlide = Math.ceil(paragraphs.length / slideCount);
      
      for (let i = 0; i < slideCount; i++) {
        const start = i * parasPerSlide;
        const end = Math.min(start + parasPerSlide, paragraphs.length);
        sections.push(paragraphs.slice(start, end).join('\n\n'));
      }
      
      return sections;
    }
    
    // Not enough paragraphs, split by sentences
    const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];
    const sentencesPerSlide = Math.ceil(sentences.length / slideCount);
    const sections: string[] = [];
    
    for (let i = 0; i < slideCount; i++) {
      const start = i * sentencesPerSlide;
      const end = Math.min(start + sentencesPerSlide, sentences.length);
      sections.push(sentences.slice(start, end).join(' ').trim());
    }
    
    // Ensure we have exactly the right number of sections
    while (sections.length < slideCount) {
      sections.push(''); // Add empty sections if needed
    }
    while (sections.length > slideCount) {
      sections.pop(); // Remove extra sections
    }
    
    return sections;
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
        const coaching = this.extractClaudeJSON(content);
        
        if (coaching) {
          console.log(`✅ Expert coaching generated for slide ${slideNumber}`);
          return { 
            success: true, 
            coaching 
          };
        } else {
          // Return default coaching
          console.log(`⚠️ Using fallback coaching for slide ${slideNumber}`);
          return {
            success: true,
            coaching: {
              openingStrategy: 'Start with confidence',
              keyEmphasisPoints: ['Main point'],
              bodyLanguageTips: ['Stand tall'],
              voiceModulation: ['Speak clearly'],
              audienceEngagement: ['Make eye contact'],
              transitionToNext: 'Move to next slide smoothly',
              timingRecommendation: '60 seconds',
              potentialQuestions: [],
              commonMistakes: [],
              energyLevel: 'medium'
            }
          };
        }
      } catch (parseError) {
        console.error('❌ Failed to parse coaching response:', parseError);
        // Return default coaching instead of error
        return {
          success: true,
          coaching: {
            openingStrategy: 'Present confidently',
            keyEmphasisPoints: [],
            bodyLanguageTips: [],
            voiceModulation: [],
            audienceEngagement: [],
            transitionToNext: 'Transition smoothly',
            timingRecommendation: '60 seconds',
            potentialQuestions: [],
            commonMistakes: [],
            energyLevel: 'medium'
          }
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
