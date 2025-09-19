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
  visionModel?: string;       // default: "gpt-4o-mini"
  textModel?: string;         // default: "gpt-4.1-mini"
  hardTokenCap?: number;      // default: 2048 output tokens
  temperature?: number;       // default: 0.2
};

export class OpenAIService {
  private client: OpenAI;
  private visionModel: string;
  private textModel: string;
  private hardTokenCap: number;
  private temperature: number;

  constructor(opts: OpenAIServiceOpts = {}) {
    this.client = new OpenAI({ apiKey: opts.apiKey || process.env.OPENAI_API_KEY });
    this.visionModel = opts.visionModel || "gpt-5";    // fallback at runtime to "gpt-4o" if needed
    this.textModel = opts.textModel || "gpt-5";
    this.hardTokenCap = opts.hardTokenCap ?? 4096;     // give GPT-5 more room to reason
    this.temperature = opts.temperature ?? 0.2;

    console.log('🤖 OpenAI Service initialized with high-quality models:', {
      vision: this.visionModel,
      text: this.textModel,
      tokenCap: this.hardTokenCap
    });
  }

  // Small helper for GPT-5-only controls:
  private fiveControls(overrides?: Partial<{ reasoning_effort: "low"|"medium"|"high"; verbosity: "low"|"medium"|"high"; }>) {
    return {
      reasoning_effort: "high" as const,
      verbosity: "high" as const,
      ...overrides,
    };
  }

  // --- 1) Vision: analyze one slide image (base64 PNG/JPEG) with fallback ---
  async analyzeSlideWithVision(imageBase64DataUrl: string, slideNumber: number): Promise<SlideAnalysisResponse> {
    const tryOnce = async (model: string) => this.client.responses.create({
      model,
      temperature: this.temperature,
      max_output_tokens: this.hardTokenCap,
      response_format: { type: "json_object" },
      input: [{
        role: "user",
        content: [
          { 
            type: "input_text", 
            text: `Analyze slide ${slideNumber} for OCR text, topics, visuals. Return high-quality structured metadata as JSON only.`
          },
          { 
            type: "input_image", 
            image_url: { url: imageBase64DataUrl, detail: "high" } 
          },
          {
            type: "input_text",
            text: `Return JSON with this shape:
{
  "success": true,
  "analysis": {
    "allText": "string",
    "mainTopic": "string", 
    "keyPoints": ["string"],
    "visualElements": ["string"],
    "suggestedTalkingPoints": ["string"],
    "emotionalTone": "professional|casual|inspirational",
    "complexity": "basic|moderate|advanced",
    "recommendedDuration": number
  }
}`
          }
        ]
      }]
    });

    try {
      let res;
      try { 
        console.log(`🔍 Analyzing slide ${slideNumber} with ${this.visionModel}...`);
        res = await tryOnce(this.visionModel); 
      } catch (error) { 
        console.warn(`⚠️ ${this.visionModel} failed for slide ${slideNumber}, falling back to gpt-4o`);
        res = await tryOnce("gpt-4o"); 
      }

      const parsed = safeJson(res.output_text || "");
      if (!parsed?.analysis?.allText) throw new Error("Malformed analysis");
      console.log(`✅ Slide ${slideNumber} analyzed successfully`);
      return { success: true, analysis: parsed.analysis as SlideAnalysis };
    } catch (e: unknown) {
      const error = e as Error;
      console.error(`❌ Vision analysis failed for slide ${slideNumber}:`, error.message);
      return { success: false, error: `Vision analysis failed (slide ${slideNumber}): ${error?.message || String(error)}`  };
    }
  }

  // --- 2) Match script sections to slides intelligently ---
  async matchScriptToSlidesIntelligently(slideAnalyses: SlideAnalysis[], fullScript: string): Promise<ScriptMatchingResponse> {
    try {
      console.log('🎯 GPT-5 matching script to slides with high reasoning effort...');
      const res = await this.client.responses.create({
        model: this.textModel,
        temperature: 0.1,
        max_output_tokens: this.hardTokenCap,
        response_format: { type: "json_object" },
        ...this.fiveControls({ reasoning_effort: "high", verbosity: "high" }),
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text:
`You align a presentation script to slides with executive-grade precision.
Rules:
- Segment the script into coherent slide-sized sections (respect semantic boundaries, not word counts).
- Map each section to the best slide by topic alignment and content relevance.
- Provide detailed confidence scores (0-100) and transparent reasoning.
- Identify key alignment terms that justify the mapping.
- Return only JSON in the required shape.`
              }
            ]
          },
          {
            role: "user",
            content: [
              { type: "input_text", text: `Full Script:\n${fullScript}`  },
              { type: "input_text", text: `Slide Analyses JSON:\n${JSON.stringify(slideAnalyses, null, 2)}`  },
              {
                type: "input_text",
                text:
`Return JSON exactly as:
{
  "success": true,
  "matches": [
    {
      "slideNumber": <number>,
      "scriptSection": "string",
      "confidence": <number 0-100>,
      "reasoning": "string",
      "keyAlignment": ["string"]
    }
  ]
}`
              }
            ]
          }
        ]
      });

      const text = res.output_text || "";
      const parsed = safeJson(text);
      if (!parsed?.matches || !Array.isArray(parsed.matches)) throw new Error("Malformed matches");
      console.log(`✅ GPT-5 script matching complete: ${parsed.matches.length} matches generated`);
      return { success: true, matches: parsed.matches as ScriptMatch[] };
    } catch (err: unknown) {
      const error = err as Error;
      console.error('❌ GPT-5 script matching failed:', error.message);
      return { success: false, error: `Script matching failed: ${error?.message || String(error)}`  };
    }
  }

  // --- 3) Coaching for a slide + its script section ---
  async generateExpertCoaching(slideAnalysis: SlideAnalysis, scriptSection: string): Promise<CoachingResponse> {
    try {
      console.log('🎤 GPT-5 generating executive-grade coaching...');
      const res = await this.client.responses.create({
        model: this.textModel,
        temperature: 0.3,
        max_output_tokens: this.hardTokenCap,
        response_format: { type: "json_object" },
        ...this.fiveControls({ verbosity: "high" }),
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text:
`You are a world-class executive presentation coach. Provide precise, actionable coaching tailored to the specific slide content and script. Focus on slide role (opening, setup, proof, contrast, takeaway, close) and rhetorical intent.
Return comprehensive JSON guidance.`
              }
            ]
          },
          {
            role: "user",
            content: [
              { type: "input_text", text: `Slide Analysis:\n${JSON.stringify(slideAnalysis)}`  },
              { type: "input_text", text: `Script Section:\n${scriptSection}`  },
              {
                type: "input_text",
                text:
`Return JSON exactly as:
{
  "success": true,
  "coaching": {
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
  }
}`
              }
            ]
          }
        ]
      });

      const text = res.output_text || "";
      const parsed = safeJson(text);
      if (!parsed?.coaching) throw new Error("Malformed coaching");
      console.log('✅ Executive coaching generated successfully');
      return { success: true, coaching: parsed.coaching as Coaching };
    } catch (err: unknown) {
      const error = err as Error;
      console.error('❌ GPT-5 coaching generation failed:', error.message);
      return { success: false, error: `Coaching generation failed: ${error?.message || String(error)}`  };
    }
  }

  // Fallback methods for resilience
  fallbackSemanticSplit(script: string, slideCount: number): string[] {
    const sentences = script.match(/[^.!?]+[.!?]+/g) || [script];
    const sentencesPerSection = Math.ceil(sentences.length / slideCount);
    
    const sections = [];
    for (let i = 0; i < slideCount; i++) {
      const start = i * sentencesPerSection;
      const end = Math.min(start + sentencesPerSection, sentences.length);
      const section = sentences.slice(start, end).join(' ').trim();
      sections.push(section || `Content for section ${i + 1}`);
    }
    
    return sections;
  }

  getDefaultSlideAnalysis(slideNumber: number): SlideAnalysis {
    return {
      allText: `Slide ${slideNumber}`,
      mainTopic: 'Presentation slide',
      keyPoints: ['Content analysis pending'],
      visualElements: [],
      suggestedTalkingPoints: ['Present this slide clearly'],
      emotionalTone: 'professional',
      complexity: 'moderate',
      recommendedDuration: 60
    };
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
      console.log(`📝 Creating micro-summary for slide ${slideNumber}...`);
      const res = await this.client.responses.create({
        model: this.textModel,               // "gpt-5"
        temperature: 0.1,
        max_output_tokens: 256,              // small, uniform budget
        response_format: { type: "json_object" },
        // Optional GPT-5 controls
        ...this.fiveControls({ verbosity: "medium", reasoning_effort: "medium" }),
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
`Create a compact slide summary for semantic alignment.
Return ONLY JSON with: slideNumber, summary (~80 tokens), tags (3-5 nouns).

Slide ${slideNumber} analysis:
${JSON.stringify(analysis)}`
              },
              {
                type: "input_text",
                text:
`{
  "slideNumber": ${slideNumber},
  "summary": "string",
  "tags": ["string"]
}`
              }
            ]
          }
        ]
      });

      const parsed = safeJson(res.output_text || "");
      if (!parsed?.summary || !Array.isArray(parsed?.tags)) throw new Error("Malformed summary");
      console.log(`✅ Micro-summary created for slide ${slideNumber}`);
      return { slideNumber, summary: parsed.summary as string, tags: parsed.tags as string[] };
    } catch (e: unknown) {
      console.warn(`⚠️ Summary generation failed for slide ${slideNumber}, using fallback`);
      // Graceful fallback: build a minimal deterministic summary locally
      const fallbackSummary =
        `${analysis.mainTopic}. Points: ${analysis.keyPoints.slice(0, 3).join("; ")}. Visuals: ${analysis.visualElements.slice(0, 2).join(", ")}.` ;
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
    console.log(`🧠 Creating micro-summaries for ${analyses.length} slides...`);
    const tasks = analyses.map((a, i) => () => this.summarizeSlideForMatching(i + 1, a));
    const results: Awaited<ReturnType<OpenAIService["summarizeSlideForMatching"]>>[] = [];
    for (let i = 0; i < tasks.length; i += concurrency) {
      const chunk = tasks.slice(i, i + concurrency);
      const batch = await Promise.all(chunk.map(fn => fn()));
      results.push(...batch);
    }
    console.log(`✅ All micro-summaries complete`);
    return results; // [{ slideNumber, summary, tags }, ...]
  }

  /**
   * Two-pass matching: Match script to slide summaries (more accurate than full analyses)
   */
  async matchScriptToSlidesFromSummaries(
    slideSummaries: Array<{ slideNumber: number; summary: string; tags: string[] }>,
    fullScript: string
  ): Promise<ScriptMatchingResponse> {
    try {
      console.log('🎯 GPT-5 two-pass script matching with micro-summaries...');
      const res = await this.client.responses.create({
        model: this.textModel,     // "gpt-5"
        temperature: 0.1,
        max_output_tokens: this.hardTokenCap,  // consider 4096 for rich rationale
        response_format: { type: "json_object" },
        ...this.fiveControls({ reasoning_effort: "high", verbosity: "high" }),
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text:
`You align a long presentation script to slides using compact slide summaries + tags.
Requirements:
- Segment the script into coherent slide-sized sections (respect topic boundaries; do not evenly split).
- Map each section to one slideNumber by best semantic fit.
- Include confidence (0-100), a short reasoning, and keyAlignment terms.
- Use the slide summaries and tags for precise topic matching.
- Return ONLY JSON in the required shape.`
              }
            ]
          },
          {
            role: "user",
            content: [
              { type: "input_text", text: `Full Script:\n${fullScript}`  },
              { type: "input_text", text: `Slide Summaries:\n${JSON.stringify(slideSummaries, null, 2)}`  },
              {
                type: "input_text",
                text:
`Return JSON:
{
  "success": true,
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
          }
        ]
      });

      const parsed = safeJson(res.output_text || "");
      if (!parsed?.matches || !Array.isArray(parsed.matches)) throw new Error("Malformed matches");
      console.log(`✅ Two-pass script matching complete: ${parsed.matches.length} high-quality matches`);
      return { success: true, matches: parsed.matches as ScriptMatch[] };
    } catch (err: unknown) {
      const error = err as Error;
      console.error('❌ Two-pass script matching failed:', error.message);
      return { success: false, error: `Script matching (summaries) failed: ${error?.message || String(error)}`  };
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
