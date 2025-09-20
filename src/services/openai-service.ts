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

type OpenAIServiceOpts = {
  visionModel?: string;
  textModel?: string;
  hardTokenCap?: number;
  temperature?: number;
};

export class OpenAIService {
  private visionModel: string;
  private textModel: string;
  private hardTokenCap: number;
  private temperature: number;

  constructor(opts: OpenAIServiceOpts = {}) {
    this.visionModel = opts.visionModel || "gpt-4o";
    this.textModel = opts.textModel || "gpt-4o";
    this.hardTokenCap = opts.hardTokenCap ?? 4096;
    this.temperature = opts.temperature ?? 0.2;
  }

  private async callAPI(messages: any[], model?: string, maxTokens?: number): Promise<any> {
    const response = await fetch('/api/openai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: model || this.textModel,
        messages,
        max_tokens: maxTokens || this.hardTokenCap,
        temperature: this.temperature,
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || `API call failed: ${response.status}`);
    }

    return response.json();
  }

  async analyzeSlideWithVision(imageBase64DataUrl: string, slideNumber: number): Promise<SlideAnalysisResponse> {
    try {
      const messages = [{
        role: "user" as const,
        content: [
          { 
            type: "text" as const, 
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
            type: "image_url" as const, 
            image_url: { 
              url: imageBase64DataUrl,
              detail: "high" as const
            } 
          }
        ]
      }];

      const result = await this.callAPI(messages, this.visionModel);
      const content = result.choices[0]?.message?.content || "{}";
      const parsed = this.safeJson(content);
      
      if (!parsed?.allText) {
        throw new Error("Malformed analysis response");
      }
      
      return { success: true, analysis: parsed as SlideAnalysis };
    } catch (error: unknown) {
      return { 
        success: false, 
        error: `Vision analysis failed (slide ${slideNumber}): ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }

  async summarizeSlideForMatching(slideNumber: number, analysis: SlideAnalysis): Promise<{
    slideNumber: number;
    summary: string;
    tags: string[];
  }> {
    try {
      const messages = [{
        role: "user" as const,
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

      const result = await this.callAPI(messages, this.textModel, 256);
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
    } catch {
      // Fallback summary
      const fallbackSummary = `${analysis.mainTopic}. Points: ${analysis.keyPoints.slice(0, 3).join("; ")}. Visuals: ${analysis.visualElements.slice(0, 2).join(", ")}.`;
      const fallbackTags = [
        ...(analysis.mainTopic ? [analysis.mainTopic] : []),
        ...analysis.keyPoints.slice(0, 2)
      ].map(s => s.toLowerCase().replace(/[^a-z0-9]+/gi, " ").trim()).filter(Boolean).slice(0, 5);
      
      return { slideNumber, summary: fallbackSummary, tags: fallbackTags };
    }
  }

  async summarizeAllSlidesForMatching(analyses: SlideAnalysis[], concurrency = 3) {
    const tasks = analyses.map((a, i) => () => this.summarizeSlideForMatching(i + 1, a));
    const results: Awaited<ReturnType<OpenAIService["summarizeSlideForMatching"]>>[] = [];
    
    for (let i = 0; i < tasks.length; i += concurrency) {
      const chunk = tasks.slice(i, i + concurrency);
      const batch = await Promise.all(chunk.map(fn => fn()));
      results.push(...batch);
    }
    
    return results;
  }

  async matchScriptToSlidesFromSummaries(
    slideSummaries: Array<{ slideNumber: number; summary: string; tags: string[] }>,
    fullScript: string
  ): Promise<ScriptMatchingResponse> {
    try {
      const messages = [
        {
          role: "system" as const,
          content: `You align a long presentation script to slides using compact slide summaries + tags.
Requirements:
- Segment the script into coherent slide-sized sections (respect topic boundaries; do not evenly split).
- Map each section to one slideNumber by best semantic fit.
- Include confidence (0-100), a short reasoning, and keyAlignment terms.
- Return ONLY JSON in the required shape.`
        },
        {
          role: "user" as const,
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

      const result = await this.callAPI(messages, this.textModel);
      const content = result.choices[0]?.message?.content || "{}";
      const parsed = this.safeJson(content);
      
      if (!parsed?.matches || !Array.isArray(parsed.matches)) {
        throw new Error("Malformed matches response");
      }
      
      return { success: true, matches: parsed.matches as ScriptMatch[] };
    } catch (err: unknown) {
      return { 
        success: false, 
        error: `Script matching failed: ${err instanceof Error ? err.message : String(err)}` 
      };
    }
  }

  async generateExpertCoaching(slideAnalysis: SlideAnalysis, scriptSection: string): Promise<CoachingResponse> {
    try {
      const messages = [
        {
          role: "system" as const,
          content: `You are an executive presentation coach. You give precise, practical coaching with timing. Return JSON only.`
        },
        {
          role: "user" as const,
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

      const result = await this.callAPI(messages, this.textModel);
      const content = result.choices[0]?.message?.content || "{}";
      const parsed = this.safeJson(content);
      
      if (!parsed?.openingStrategy) {
        throw new Error("Malformed coaching response");
      }
      
      return { success: true, coaching: parsed as Coaching };
    } catch (err: unknown) {
      return { 
        success: false, 
        error: `Coaching generation failed: ${err instanceof Error ? err.message : String(err)}` 
      };
    }
  }

  private safeJson(maybeJson: string) {
    const trimmed = maybeJson.trim();
    const start = trimmed.indexOf("{");
    const end = trimmed.lastIndexOf("}");
    if (start === -1 || end === -1) throw new Error("No JSON object found");
    return JSON.parse(trimmed.slice(start, end + 1));
  }
}
          messages: [{
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
          }]
        })
      });
      
      if (!response.ok) {
        throw new Error(`API call failed: ${response.status}`);
      }
      
      return response.json();
    };
      model,
      temperature: this.temperature,
      max_completion_tokens: this.hardTokenCap,
      response_format: { type: "json_object" },
      messages: [{
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
      }]
    });

    try {
      let res;
      try { 
        res = await tryOnce(this.visionModel); 
      } catch { 
        res = await tryOnce("gpt-4o"); // rock-solid fallback per call
      }

      const content = res.choices[0]?.message?.content || "{}";
      const parsed = safeJson(content);
      if (!parsed?.allText) throw new Error("Malformed analysis");
      return { success: true, analysis: parsed as SlideAnalysis };
    } catch (e: unknown) {
      return { success: false, error: `Vision analysis failed (slide ${slideNumber}): ${e instanceof Error ? e.message : String(e)}` };
    }
  }

  /**
   * Summarize one slide analysis into a compact form for global matching.
   * Produces ~80 tokens and 3–5 canonical tags to keep the alignment prompt crisp.
   */
  async summarizeSlideForMatching(slideNumber: number, analysis: SlideAnalysis): Promise<{
    slideNumber: number;
    summary: string;
    tags: string[];
  }> {
    if (!this.client) {
      // Graceful fallback: build a minimal deterministic summary locally
      const fallbackSummary =
        `${analysis.mainTopic}. Points: ${analysis.keyPoints.slice(0, 3).join("; ")}. Visuals: ${analysis.visualElements.slice(0, 2).join(", ")}.`;
      const fallbackTags = [
        ...(analysis.mainTopic ? [analysis.mainTopic] : []),
        ...analysis.keyPoints.slice(0, 2)
      ].map(s => s.toLowerCase().replace(/[^a-z0-9]+/gi, " ").trim()).filter(Boolean).slice(0, 5);
      return { slideNumber, summary: fallbackSummary, tags: fallbackTags };
    }
    try {
      const res = await this.client.chat.completions.create({
        model: this.textModel,               // "gpt-4o"
        temperature: 0.1,
        max_completion_tokens: 256,              // small, uniform budget
        response_format: { type: "json_object" },
        messages: [
          {
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
          }
        ]
      });

      const content = res.choices[0]?.message?.content || "{}";
      const parsed = safeJson(content);
      if (!parsed?.summary || !Array.isArray(parsed?.tags)) throw new Error("Malformed summary");
      return { slideNumber, summary: parsed.summary as string, tags: parsed.tags as string[] };
    } catch {
      // Graceful fallback: build a minimal deterministic summary locally
      const fallbackSummary =
        `${analysis.mainTopic}. Points: ${analysis.keyPoints.slice(0, 3).join("; ")}. Visuals: ${analysis.visualElements.slice(0, 2).join(", ")}.`;
      const fallbackTags = [
        ...(analysis.mainTopic ? [analysis.mainTopic] : []),
        ...analysis.keyPoints.slice(0, 2)
      ].map(s => s.toLowerCase().replace(/[^a-z0-9]+/gi, " ").trim()).filter(Boolean).slice(0, 5);
      return { slideNumber, summary: fallbackSummary, tags: fallbackTags };
    }
  }

  /**
   * Convenience: summarize ALL slides (runs in small parallel batches for stability).
   */
  async summarizeAllSlidesForMatching(analyses: SlideAnalysis[], concurrency = 3) {
    const tasks = analyses.map((a, i) => () => this.summarizeSlideForMatching(i + 1, a));
    const results: Awaited<ReturnType<OpenAIService["summarizeSlideForMatching"]>>[] = [];
    for (let i = 0; i < tasks.length; i += concurrency) {
      const chunk = tasks.slice(i, i + concurrency);
      const batch = await Promise.all(chunk.map(fn => fn()));
      results.push(...batch);
    }
    return results; // [{ slideNumber, summary, tags }, ...]
  }

  // --- 2) Match script sections to slides intelligently (two-pass with summaries) ---
  async matchScriptToSlidesFromSummaries(
    slideSummaries: Array<{ slideNumber: number; summary: string; tags: string[] }>,
    fullScript: string
  ): Promise<ScriptMatchingResponse> {
    if (!this.client) {
      return { success: false, error: 'OpenAI API key not configured. Script-to-slide matching requires API access.' };
    }
    try {
      const res = await this.client.chat.completions.create({
        model: this.textModel,     // "gpt-4o"
        temperature: 0.1,
        max_completion_tokens: this.hardTokenCap,  // consider 4096 for rich rationale
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You align a long presentation script to slides using compact slide summaries + tags.
Requirements:
- Segment the script into coherent slide-sized sections (respect topic boundaries; do not evenly split).
- Map each section to one slideNumber by best semantic fit.
- Include confidence (0-100), a short reasoning, and keyAlignment terms.
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
        ]
      });

      const content = res.choices[0]?.message?.content || "{}";
      const parsed = safeJson(content);
      if (!parsed?.matches || !Array.isArray(parsed.matches)) throw new Error("Malformed matches");
      return { success: true, matches: parsed.matches as ScriptMatch[] };
    } catch (err: unknown) {
      return { success: false, error: `Script matching (summaries) failed: ${err instanceof Error ? err.message : String(err)}` };
    }
  }

  // --- 3) Coaching for a slide + its script section ---
  async generateExpertCoaching(slideAnalysis: SlideAnalysis, scriptSection: string): Promise<CoachingResponse> {
    if (!this.client) {
      return { success: false, error: 'OpenAI API key not configured. Expert coaching requires API access.' };
    }
    try {
      const res = await this.client.chat.completions.create({
        model: this.textModel,
        temperature: 0.3,
        max_completion_tokens: this.hardTokenCap,
        response_format: { type: "json_object" },
        messages: [
          {
            role: "system",
            content: `You are an executive presentation coach. You give precise, practical coaching with timing.
Return JSON only.`
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
        ]
      });

      const content = res.choices[0]?.message?.content || "{}";
      const parsed = safeJson(content);
      if (!parsed?.openingStrategy) throw new Error("Malformed coaching");
      return { success: true, coaching: parsed as Coaching };
    } catch (err: unknown) {
      return { success: false, error: `Coaching generation failed: ${err instanceof Error ? err.message : String(err)}` };
    }
  }
}

// --------- helpers ----------
function safeJson(maybeJson: string) {
  // The Responses API with response_format=json_object already enforces pure JSON,
  // but this is a safety net if a future model changes behavior.
  const trimmed = maybeJson.trim();
  const start = trimmed.indexOf("{");
  const end = trimmed.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("No JSON object found");
  return JSON.parse(trimmed.slice(start, end + 1));
}
