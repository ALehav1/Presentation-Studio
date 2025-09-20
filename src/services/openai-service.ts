// src/services/openai-service.ts

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

export type SlideAnalysisResponse = 
  | { success: true; analysis: SlideAnalysis } 
  | { success: false; error: string };

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

export type CoachingResponse = 
  | { success: true; coaching: Coaching } 
  | { success: false; error: string };

type OpenAIServiceOpts = {
  visionModel?: string;
  textModel?: string;
  hardTokenCap?: number;
  temperature?: number;
};

/**
 * SECURE OpenAI Service
 * All API calls go through backend proxy - no API keys in browser
 */
export class OpenAIService {
  private visionModel: string;
  private textModel: string;
  private hardTokenCap: number;
  private temperature: number;
  private readonly proxyEndpoint = '/api/openai';

  constructor(opts: OpenAIServiceOpts = {}) {
    // Use valid model names (gpt-4o, not GPT-5)
    this.visionModel = opts.visionModel || "gpt-4o";
    this.textModel = opts.textModel || "gpt-4o";
    this.hardTokenCap = opts.hardTokenCap ?? 4096;
    this.temperature = opts.temperature ?? 0.2;
  }

  /**
   * Call OpenAI through secure backend proxy
   */
  private async callAPI(
    messages: any[], 
    model?: string, 
    maxTokens?: number,
    responseFormat?: { type: string }
  ): Promise<any> {
    try {
      const response = await fetch(this.proxyEndpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model || this.textModel,
          messages,
          max_tokens: maxTokens || this.hardTokenCap,
          temperature: this.temperature,
          ...(responseFormat && { response_format: responseFormat })
        })
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `API call failed: ${response.status}`);
      }

      return response.json();
    } catch (error) {
      console.error('API call failed:', error);
      throw error;
    }
  }

  /**
   * Analyze slide with vision model
   */
  async analyzeSlideWithVision(
    imageBase64DataUrl: string, 
    slideNumber: number
  ): Promise<SlideAnalysisResponse> {
    try {
      const messages = [{
        role: "user",
        content: [
          { 
            type: "text", 
            text: `Analyze slide ${slideNumber} for OCR text, topics, visuals. Return JSON with this shape:
{
  "allText": "string",
  "mainTopic": "string", 
  "keyPoints": ["string"],
  "visualElements": ["string"],
  "suggestedTalkingPoints": ["string"],
  "emotionalTone": "professional|casual|inspirational",
  "complexity": "basic|moderate|advanced",
  "recommendedDuration": number
}`
          },
          { 
            type: "image_url", 
            image_url: { 
              url: imageBase64DataUrl,
              detail: "high"
            } 
          }
        ]
      }];

      const result = await this.callAPI(
        messages, 
        this.visionModel, 
        this.hardTokenCap,
        { type: "json_object" }
      );
      
      const content = result.choices[0]?.message?.content || "{}";
      const parsed = this.safeJson(content);
      
      if (!parsed?.allText) {
        throw new Error("Malformed analysis response");
      }
      
      return { success: true, analysis: parsed as SlideAnalysis };
      
    } catch (error: unknown) {
      return { 
        success: false, 
        error: `Vision analysis failed (slide ${slideNumber}): ${
          error instanceof Error ? error.message : String(error)
        }` 
      };
    }
  }

  /**
   * Summarize slide for matching
   */
  async summarizeSlideForMatching(
    slideNumber: number, 
    analysis: SlideAnalysis
  ): Promise<{ slideNumber: number; summary: string; tags: string[] }> {
    try {
      const messages = [{
        role: "user",
        content: `Create a compact slide summary for semantic alignment.
Return ONLY JSON with: slideNumber, summary (~80 tokens), tags (3-5 nouns).

Slide ${slideNumber} analysis:
${JSON.stringify(analysis)}

Return JSON:
{
  "slideNumber": ${slideNumber},
  "summary": "string",
  "tags": ["string"]
}`
      }];

      const result = await this.callAPI(
        messages, 
        this.textModel, 
        256,
        { type: "json_object" }
      );
      
      const content = result.choices[0]?.message?.content || "{}";
      const parsed = this.safeJson(content);
      
      if (!parsed?.summary || !Array.isArray(parsed?.tags)) {
        throw new Error("Malformed summary response");
      }
      
      return { 
        slideNumber, 
        summary: parsed.summary as string, 
        tags: parsed.tags as string[] 
      };
      
    } catch (error) {
      // Fallback to local summary generation
      return this.generateFallbackSummary(slideNumber, analysis);
    }
  }

  /**
   * Summarize all slides with rate limiting
   */
  async summarizeAllSlidesForMatching(
    analyses: SlideAnalysis[], 
    concurrency = 3
  ): Promise<Array<{ slideNumber: number; summary: string; tags: string[] }>> {
    const tasks = analyses.map((a, i) => 
      () => this.summarizeSlideForMatching(i + 1, a)
    );
    
    const results = [];
    
    for (let i = 0; i < tasks.length; i += concurrency) {
      const chunk = tasks.slice(i, i + concurrency);
      const batch = await Promise.all(chunk.map(fn => fn()));
      results.push(...batch);
      
      // Rate limiting delay between batches
      if (i + concurrency < tasks.length) {
        await this.delay(500);
      }
    }
    
    return results;
  }

  /**
   * Match script to slides using summaries
   */
  async matchScriptToSlidesFromSummaries(
    slideSummaries: Array<{ slideNumber: number; summary: string; tags: string[] }>,
    fullScript: string
  ): Promise<ScriptMatchingResponse> {
    try {
      const messages = [
        {
          role: "system",
          content: `You align a long presentation script to slides using compact slide summaries + tags.
Requirements:
- Segment the script into coherent slide-sized sections (respect topic boundaries).
- Map each section to one slideNumber by best semantic fit.
- Include confidence (0-100), reasoning, and keyAlignment terms.
- Return ONLY JSON in the required shape.`
        },
        {
          role: "user",
          content: `Full Script:
${fullScript}

Slide Summaries:
${JSON.stringify(slideSummaries, null, 2)}

Return JSON:
{
  "matches": [
    {
      "slideNumber": 1,
      "scriptSection": "string",
      "confidence": 0,
      "reasoning": "string", 
      "keyAlignment": ["string"]
    }
  ]
}`
        }
      ];

      const result = await this.callAPI(
        messages, 
        this.textModel,
        this.hardTokenCap,
        { type: "json_object" }
      );
      
      const content = result.choices[0]?.message?.content || "{}";
      const parsed = this.safeJson(content);
      
      if (!parsed?.matches || !Array.isArray(parsed.matches)) {
        throw new Error("Malformed matches response");
      }
      
      return { success: true, matches: parsed.matches as ScriptMatch[] };
      
    } catch (err: unknown) {
      return { 
        success: false, 
        error: `Script matching failed: ${
          err instanceof Error ? err.message : String(err)
        }` 
      };
    }
  }

  /**
   * Generate expert coaching for a slide
   */
  async generateExpertCoaching(
    slideAnalysis: SlideAnalysis, 
    scriptSection: string
  ): Promise<CoachingResponse> {
    try {
      const messages = [
        {
          role: "system",
          content: `You are an executive presentation coach. Give precise, practical coaching with timing. Return JSON only.`
        },
        {
          role: "user",
          content: `Slide Analysis:
${JSON.stringify(slideAnalysis)}

Script Section:
${scriptSection}

Return JSON exactly as:
{
  "openingStrategy": "string",
  "keyEmphasisPoints": ["string"],
  "bodyLanguageTips": ["string"],
  "voiceModulation": ["string"],
  "audienceEngagement": ["string"],
  "transitionToNext": "string",
  "timingRecommendation": "string",
  "potentialQuestions": ["string"],
  "commonMistakes": ["string"],
  "energyLevel": "low|medium|high"
}`
        }
      ];

      const result = await this.callAPI(
        messages, 
        this.textModel,
        this.hardTokenCap,
        { type: "json_object" }
      );
      
      const content = result.choices[0]?.message?.content || "{}";
      const parsed = this.safeJson(content);
      
      if (!parsed?.openingStrategy) {
        throw new Error("Malformed coaching response");
      }
      
      return { success: true, coaching: parsed as Coaching };
      
    } catch (err: unknown) {
      return { 
        success: false, 
        error: `Coaching generation failed: ${
          err instanceof Error ? err.message : String(err)
        }` 
      };
    }
  }

  /**
   * Generate fallback summary when API fails
   */
  private generateFallbackSummary(
    slideNumber: number, 
    analysis: SlideAnalysis
  ): { slideNumber: number; summary: string; tags: string[] } {
    const summary = `${analysis.mainTopic}. Points: ${
      analysis.keyPoints.slice(0, 3).join("; ")
    }. Visuals: ${
      analysis.visualElements.slice(0, 2).join(", ")
    }.`;
    
    const tags = [
      ...(analysis.mainTopic ? [analysis.mainTopic] : []),
      ...analysis.keyPoints.slice(0, 2)
    ]
      .map(s => s.toLowerCase().replace(/[^a-z0-9]+/gi, " ").trim())
      .filter(Boolean)
      .slice(0, 5);
    
    return { slideNumber, summary, tags };
  }

  /**
   * Safe JSON parsing with error handling
   */
  private safeJson(maybeJson: string): any {
    try {
      const trimmed = maybeJson.trim();
      
      // Handle markdown code blocks if present
      const cleaned = trimmed
        .replace(/^```json\n?/, '')
        .replace(/\n?```$/, '')
        .trim();
      
      // Find JSON object boundaries
      const start = cleaned.indexOf("{");
      const end = cleaned.lastIndexOf("}");
      
      if (start === -1 || end === -1) {
        throw new Error("No JSON object found");
      }
      
      return JSON.parse(cleaned.slice(start, end + 1));
    } catch (error) {
      console.error('JSON parsing failed:', error);
      throw new Error('Failed to parse API response');
    }
  }

  /**
   * Utility delay for rate limiting
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Export singleton instance
export const openAIService = new OpenAIService();