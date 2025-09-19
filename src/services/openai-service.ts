// src/services/openai-service.ts
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

type OpenAIServiceOpts = {
  apiKey?: string;            // Optional; defaults to process.env.OPENAI_API_KEY
  visionModel?: string;       // default: "gpt-5"
  textModel?: string;         // default: "gpt-5"
  hardTokenCap?: number;      // default: 4096 output tokens
  temperature?: number;       // default: 0.2
};

export class OpenAIService {
  private client: OpenAI;
  private visionModel: string;
  private textModel: string;
  private hardTokenCap: number;
  private temperature: number;

  constructor(opts: OpenAIServiceOpts = {}) {
    this.client = new OpenAI({ 
      apiKey: opts.apiKey || process.env.OPENAI_API_KEY,
      dangerouslyAllowBrowser: true 
    });
    this.visionModel = opts.visionModel || "gpt-5";    // fallback at runtime to "gpt-4o" if needed
    this.textModel = opts.textModel || "gpt-5";
    this.hardTokenCap = opts.hardTokenCap ?? 4096;     // give GPT-5 more room to reason
    this.temperature = opts.temperature ?? 0.2;
  }


  // --- 1) Vision: analyze one slide image (base64 PNG/JPEG) ---
  async analyzeSlideWithVision(imageBase64DataUrl: string, slideNumber: number): Promise<SlideAnalysisResponse> {
    const tryOnce = async (model: string) => this.client.chat.completions.create({
      model,
      temperature: this.temperature,
      max_tokens: this.hardTokenCap,
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
    try {
      const res = await this.client.chat.completions.create({
        model: this.textModel,               // "gpt-5"
        temperature: 0.1,
        max_tokens: 256,              // small, uniform budget
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
    try {
      const res = await this.client.chat.completions.create({
        model: this.textModel,     // "gpt-5"
        temperature: 0.1,
        max_tokens: this.hardTokenCap,  // consider 4096 for rich rationale
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
    try {
      const res = await this.client.chat.completions.create({
        model: this.textModel,
        temperature: 0.3,
        max_tokens: this.hardTokenCap,
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
