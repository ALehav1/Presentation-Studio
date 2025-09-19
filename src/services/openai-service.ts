import OpenAI from "openai";

export type SlideAnalysis = {
  allText: string;
  mainTopic: string;
  keyPoints: string[];
  visualElements: string[];
  suggestedTalkingPoints: string[];
  emotionalTone: "professional" | "casual" | "inspirational" | string;
  complexity: "basic" | "moderate" | "advanced" | string;
  recommendedDuration: number;
};

export type SlideAnalysisResponse = { success: true; analysis: SlideAnalysis } | { success: false; error: string };

export type ScriptMatch = {
  slideNumber: number;
  scriptSection: string;
  confidence: number; // 0-100
  reasoning: string;
  keyAlignment: string[];
};

export type ScriptMatchingResponse =
  | { success: true; matches: ScriptMatch[] }
  | { success: false; error: string };

export type Coaching = {
  openingStrategy: string;
  keyEmphasisPoints: string[];
  bodyLanguageTips: string[];
  voiceModulation: string[];
  audienceEngagement: string[];
  transitionToNext: string;
  timingRecommendation: string;
  potentialQuestions: string[];
  commonMistakes: string[];
  energyLevel: "low" | "medium" | "high" | string;
};

export type CoachingResponse = { success: true; coaching: Coaching } | { success: false; error: string };

export type SlideSummary = {
  slideNumber: number;
  summary: string;
  tags: string[];
};

// For testing: mockable client interface
export type OpenAIClientLike = {
  chat: { 
    completions: { 
      create: (args: unknown) => Promise<{ 
        choices: Array<{ 
          message: { 
            content: string;
          };
        }>;
      }>;
    };
  };
};

type OpenAIServiceOpts = {
  apiKey?: string;            // Optional; defaults to process.env.OPENAI_API_KEY
  visionModel?: string;       // default: "gpt-5"
  textModel?: string;         // default: "gpt-5"
  hardTokenCap?: number;      // default: 4096 output tokens
  temperature?: number;       // default: 0.2
  client?: OpenAIClientLike;  // For testing: inject mock client
};

export class OpenAIService {
  private client: OpenAIClientLike;
  private visionModel: string;
  private textModel: string;
  private hardTokenCap: number;
  private temperature: number;

  constructor(opts: OpenAIServiceOpts = {}) {
    // Use injected client for testing, otherwise create real OpenAI client
    this.client = opts.client ?? new OpenAI({ 
      apiKey: opts.apiKey || process.env.OPENAI_API_KEY 
    }) as OpenAIClientLike;
    
    this.visionModel = opts.visionModel || "gpt-5";
    this.textModel = opts.textModel || "gpt-5";
    this.hardTokenCap = opts.hardTokenCap ?? 4096;
    this.temperature = opts.temperature ?? 0.2;

    console.log('🤖 OpenAI Service initialized with models:', {
      vision: this.visionModel,
      text: this.textModel
    });
  }

  /**
   * Two-pass intelligent script matching: summaries → matching
   * This replaces the old single-pass approach for better results
   */
  async matchScriptToSlidesFromSummaries(
    summaries: SlideSummary[],
    fullScript: string
  ): Promise<ScriptMatchingResponse> {
    console.log('🎯 Two-pass matching: Using slide summaries for intelligent script allocation...');
    
    try {
      const prompt = `You are an expert presentation coach. Match this script to slide summaries intelligently.

SLIDE SUMMARIES:
${summaries.map(s => `${s.slideNumber}. ${s.summary} (tags: ${s.tags.join(', ')})`).join('\n')}

FULL SCRIPT TO MATCH:
${fullScript}

Task: Divide the script into exactly ${summaries.length} sections that align with the slide summaries above.

Return ONLY valid JSON:
{
  "success": true,
  "matches": [
    {
      "slideNumber": 1,
      "scriptSection": "script text for slide 1...",
      "confidence": 85,
      "reasoning": "Strong topic alignment between script and slide",
      "keyAlignment": ["keyword1", "keyword2"]
    }
  ]
}`;

      const response = await this.client.chat.completions.create({
        model: this.textModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: this.hardTokenCap,
        temperature: this.temperature,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      const result = this.safeJsonParse(content);
      
      if (result.success && result.matches) {
        console.log(`✅ Two-pass matching complete: ${result.matches.length} matches`);
        return result;
      }
      
      throw new Error('Invalid response structure');

    } catch (error) {
      console.error('❌ Two-pass matching failed:', error);
      
      // Fallback to semantic split
      const fallbackSections = this.fallbackSemanticSplit(fullScript, summaries.length);
      
      return {
        success: true,
        matches: fallbackSections.map((section: string, i: number) => ({
          slideNumber: i + 1,
          scriptSection: section,
          confidence: 70,
          reasoning: 'Semantic fallback - AI matching failed',
          keyAlignment: []
        }))
      };
    }
  }

  /**
   * Analyze slide content using GPT Vision with fallback to gpt-4o
   */
  async analyzeSlideWithVision(
    imageBase64: string,
    slideNumber: number
  ): Promise<SlideAnalysisResponse> {
    console.log(`🔍 Analyzing slide ${slideNumber} with ${this.visionModel}...`);
    
    const prompt = `Analyze this presentation slide and return ONLY a JSON object:
{
  "success": true,
  "analysis": {
    "allText": "All visible text on the slide",
    "mainTopic": "Primary topic/theme of the slide",
    "keyPoints": ["key point 1", "key point 2", "key point 3"],
    "visualElements": ["chart", "diagram", "image", "etc"],
    "suggestedTalkingPoints": ["talking point 1", "talking point 2"],
    "emotionalTone": "professional",
    "complexity": "moderate",
    "recommendedDuration": 60
  }
}`;
    
    try {
      // Try primary vision model first (gpt-5)
      const response = await this.client.chat.completions.create({
        model: this.visionModel,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { 
              type: 'image_url', 
              image_url: { 
                url: `data:image/png;base64,${imageBase64}`,
                detail: "high"
              } 
            }
          ]
        }],
        max_tokens: 1024,
        temperature: this.temperature,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      const result = this.safeJsonParse(content);
      
      if (result.success && result.analysis) {
        console.log(`✅ Successfully analyzed slide ${slideNumber}`);
        return result;
      }
      
      throw new Error('Invalid response structure');

    } catch {
      console.warn(`⚠️ ${this.visionModel} failed for slide ${slideNumber}, trying fallback...`);
      
      try {
        // Fallback to gpt-4o
        const response = await this.client.chat.completions.create({
          model: "gpt-4o",
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { 
                type: 'image_url', 
                image_url: { 
                  url: `data:image/png;base64,${imageBase64}`,
                  detail: "high"
                } 
              }
            ]
          }],
          max_tokens: 1024,
          temperature: this.temperature,
          response_format: { type: "json_object" }
        });

        const content = response.choices[0].message.content;
        const result = this.safeJsonParse(content);
        
        if (result.success && result.analysis) {
          console.log(`✅ Fallback analysis succeeded for slide ${slideNumber}`);
          return result;
        }
        
        throw new Error('Fallback also failed');
        
      } catch (fallbackError) {
        console.error(`❌ Both vision models failed for slide ${slideNumber}:`, fallbackError);
        
        // Return default analysis
        return {
          success: true,
          analysis: this.getDefaultSlideAnalysis(slideNumber)
        };
      }
    }
  }

  /**
   * Generate compact slide summaries for two-pass matching
   */
  async summarizeSlideForMatching(
    slideNumber: number,
    analysis: SlideAnalysis
  ): Promise<SlideSummary> {
    try {
      const prompt = `Create a compact summary for script matching.

Slide ${slideNumber} Analysis:
- Topic: ${analysis.mainTopic}
- Key Points: ${analysis.keyPoints.join(', ')}
- Text: ${analysis.allText}

Return ONLY JSON:
{
  "slideNumber": ${slideNumber},
  "summary": "2-3 sentence summary for matching",
  "tags": ["tag1", "tag2", "tag3"]
}`;

      const response = await this.client.chat.completions.create({
        model: this.textModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 256,
        temperature: this.temperature,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      const result = JSON.parse(content);
      
      return {
        slideNumber: result.slideNumber || slideNumber,
        summary: result.summary || `Slide ${slideNumber} summary`,
        tags: result.tags || []
      };
      
    } catch {
      console.warn(`⚠️ Summary generation failed for slide ${slideNumber}, using fallback`);
      
      // Local fallback
      return {
        slideNumber,
        summary: `${analysis.mainTopic}. ${analysis.keyPoints.slice(0, 2).join('. ')}.`,
        tags: analysis.keyPoints.slice(0, 3).map(p => p.toLowerCase().replace(/[^a-z0-9]/g, ''))
      };
    }
  }

  /**
   * Process all slide analyses into summaries for matching
   */
  async summarizeAllSlidesForMatching(
    analyses: SlideAnalysis[]
  ): Promise<SlideSummary[]> {
    console.log(`📋 Generating summaries for ${analyses.length} slides...`);
    
    const summaries = await Promise.all(
      analyses.map((analysis, index) => 
        this.summarizeSlideForMatching(index + 1, analysis)
      )
    );
    
    console.log(`✅ Generated ${summaries.length} slide summaries`);
    return summaries;
  }

  /**
   * Generate expert presentation coaching for a slide
   */
  async generateExpertCoaching(
    analysis: SlideAnalysis,
    scriptSection: string
  ): Promise<CoachingResponse> {
    try {
      const prompt = `Generate expert presentation coaching for this slide.

Slide Content:
- Topic: ${analysis.mainTopic}
- Key Points: ${analysis.keyPoints.join(', ')}
- Tone: ${analysis.emotionalTone}
- Duration: ${analysis.recommendedDuration}s

Script Section:
${scriptSection}

Return ONLY JSON:
{
  "success": true,
  "coaching": {
    "openingStrategy": "How to start this slide",
    "keyEmphasisPoints": ["point1", "point2"],
    "bodyLanguageTips": ["tip1", "tip2"],
    "voiceModulation": ["voice tip1", "voice tip2"],
    "audienceEngagement": ["engagement tip1"],
    "transitionToNext": "How to transition to next slide",
    "timingRecommendation": "60 seconds - take time to explain",
    "potentialQuestions": ["What might audience ask?"],
    "commonMistakes": ["What to avoid"],
    "energyLevel": "high"
  }
}`;

      const response = await this.client.chat.completions.create({
        model: this.textModel,
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 1024,
        temperature: this.temperature,
        response_format: { type: "json_object" }
      });

      const content = response.choices[0].message.content;
      const result = this.safeJsonParse(content);
      
      if (result.success && result.coaching) {
        return result;
      }
      
      throw new Error('Invalid coaching response');
      
    } catch (error) {
      console.error('❌ Coaching generation failed:', error);
      
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Coaching generation failed'
      };
    }
  }

  /**
   * Safe JSON parsing with defense against noisy wrappers
   */
  private safeJsonParse(content: string): unknown {
    if (!content) return { success: false, error: 'Empty response' };
    
    try {
      // First try direct parse
      return JSON.parse(content);
    } catch {
      // Try to extract JSON from noisy content
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        try {
          return JSON.parse(jsonMatch[0]);
        } catch {
          // Final fallback
          return { success: false, error: 'Could not parse JSON response' };
        }
      }
      return { success: false, error: 'No JSON found in response' };
    }
  }

  /**
   * Default analysis when vision fails
   */
  private getDefaultSlideAnalysis(slideNumber: number): SlideAnalysis {
    return {
      allText: `Slide ${slideNumber}`,
      mainTopic: `Presentation slide ${slideNumber}`,
      keyPoints: ['Content analysis pending'],
      visualElements: [],
      suggestedTalkingPoints: ['Present this slide clearly'],
      emotionalTone: 'professional',
      complexity: 'moderate',
      recommendedDuration: 60
    };
  }

  /**
   * Fallback semantic split when AI fails
   */
  private fallbackSemanticSplit(script: string, count: number): string[] {
    const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];
    const sentencesPerSection = Math.ceil(sentences.length / count);
    
    const sections = [];
    for (let i = 0; i < count; i++) {
      const start = i * sentencesPerSection;
      const end = Math.min(start + sentencesPerSection, sentences.length);
      const section = sentences.slice(start, end).join(' ').trim();
      sections.push(section || `Content for section ${i + 1}`);
    }
    
    return sections;
  }
}

// Default analysis for testing
export const getDefaultSlideAnalysis = (slideNumber: number): SlideAnalysis => ({
  allText: `Slide ${slideNumber} content`,
  mainTopic: `Topic for slide ${slideNumber}`,
  keyPoints: ['Key point 1', 'Key point 2'],
  visualElements: ['chart', 'text'],
  suggestedTalkingPoints: ['Present clearly', 'Engage audience'],
  emotionalTone: 'professional',
  complexity: 'moderate',
  recommendedDuration: 60
});
