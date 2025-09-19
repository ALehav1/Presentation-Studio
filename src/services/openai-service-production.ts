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
    this.visionModel = opts.visionModel || "gpt-4o-mini";
    this.textModel = opts.textModel || "gpt-4.1-mini";
    this.hardTokenCap = opts.hardTokenCap ?? 2048;
    this.temperature = opts.temperature ?? 0.2;

    console.log('🤖 OpenAI Service initialized with models:', {
      vision: this.visionModel,
      text: this.textModel
    });
  }

  // --- 1) Vision: analyze one slide image (base64 PNG/JPEG) ---
  async analyzeSlideWithVision(imageBase64DataUrl: string, slideNumber: number): Promise<SlideAnalysisResponse> {
    try {
      // Responses API with JSON-only output
      const res = await this.client.responses.create({
        model: this.visionModel,
        temperature: this.temperature,
        max_output_tokens: this.hardTokenCap,
        response_format: { type: "json_object" },
        // message content = text + one input_image part
        input: [
          {
            role: "user",
            content: [
              {
                type: "input_text",
                text:
                  `You are analyzing a presentation slide image for structured metadata.\n`  +
                  `Return ONLY valid JSON following the schema exactly.\n`  +
                  `Focus on: all visible text (OCR-quality summary), key topics, and visual elements.\n`  +
                  `Slide number: ${slideNumber}.` 
              },
              {
                type: "input_image",
                image_url: { url: imageBase64DataUrl, detail: "high" } // accepts data: URLs
              },
              {
                type: "input_text",
                text:
`Return JSON with this shape:
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
          }
        ]
      });

      const text = res.output_text || "";
      const parsed = safeJson(text);
      // quick shape guard
      if (!parsed?.analysis?.allText) throw new Error("Malformed analysis");
      return { success: true, analysis: parsed.analysis as SlideAnalysis };
    } catch (err: any) {
      return { success: false, error: `Vision analysis failed (slide ${slideNumber}): ${err?.message || String(err)}`  };
    }
  }

  // --- 2) Match script sections to slides intelligently ---
  async matchScriptToSlidesIntelligently(slideAnalyses: SlideAnalysis[], fullScript: string): Promise<ScriptMatchingResponse> {
    try {
      const res = await this.client.responses.create({
        model: this.textModel,
        temperature: 0.1,
        max_output_tokens: this.hardTokenCap,
        response_format: { type: "json_object" },
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text:
`You align a presentation script to slides.
Rules:
- Segment the script into coherent slide-sized sections (not evenly split; respect topic boundaries).
- Map each section to the best slide by semantic alignment with slide analyses.
- Provide a 0-100 confidence and brief reasoning.
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
      return { success: true, matches: parsed.matches as ScriptMatch[] };
    } catch (err: any) {
      return { success: false, error: `Script matching failed: ${err?.message || String(err)}`  };
    }
  }

  // --- 3) Coaching for a slide + its script section ---
  async generateExpertCoaching(slideAnalysis: SlideAnalysis, scriptSection: string): Promise<CoachingResponse> {
    try {
      const res = await this.client.responses.create({
        model: this.textModel,
        temperature: 0.3,
        max_output_tokens: this.hardTokenCap,
        response_format: { type: "json_object" },
        input: [
          {
            role: "system",
            content: [
              {
                type: "input_text",
                text:
`You are an executive presentation coach. You give precise, practical coaching with timing.
Return JSON only.`
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
      return { success: true, coaching: parsed.coaching as Coaching };
    } catch (err: any) {
      return { success: false, error: `Coaching generation failed: ${err?.message || String(err)}`  };
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
