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
      return { success: false, error: 'Please add your OpenAI API key' };
    }

    console.log('🤖 OpenAI intelligently matching script to slide topics...');
    
    try {
      const prompt = `You are an expert presentation coach. Match this script to slide topics intelligently.

SLIDE TOPICS:
${slideAnalyses.map((s, i) => `${i + 1}. ${s.mainTopic} - Key points: ${s.keyPoints?.join(', ') || 'N/A'}`).join('\n')}

FULL SCRIPT TO MATCH:
${fullScript}

Task: Divide the script into exactly ${slideAnalyses.length} sections that align with the slide topics above.

CRITICAL: Return ONLY a valid JSON array of strings. No explanations, no commentary.
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
        throw new Error(`OpenAI API failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      console.log('📄 OpenAI response preview:', content.substring(0, 300));

      try {
        // OpenAI typically returns cleaner JSON than Claude
        const scriptSections = JSON.parse(content);
        
        if (!Array.isArray(scriptSections)) {
          throw new Error('Response is not an array');
        }

        console.log('✅ Successfully parsed', scriptSections.length, 'AI-matched sections');

        // Ensure exact count
        let finalSections = scriptSections.slice(0, slideAnalyses.length);
        while (finalSections.length < slideAnalyses.length) {
          finalSections.push(`Script section ${finalSections.length + 1}`);
        }

        const matches = finalSections.map((section: string, i: number) => ({
          slideNumber: i + 1,
          scriptSection: section.trim() || `Script section ${i + 1}`,
          confidence: 95,
          reasoning: 'OpenAI content matching with topic alignment',
          keyAlignment: this.findKeyAlignments(section, slideAnalyses[i])
        }));

        console.log(`🎯 Successfully matched script using OpenAI intelligence!`);
        
        return { success: true, matches };

      } catch (parseError) {
        console.error('⚠️ OpenAI JSON parse failed:', parseError);
        throw new Error('Failed to parse OpenAI response');
      }

    } catch (error) {
      console.error('❌ OpenAI matching failed:', error);
      
      // Fallback to semantic split
      const fallbackSections = this.fallbackSemanticSplit(fullScript, slideAnalyses.length);
      
      return {
        success: true,
        matches: fallbackSections.map((section: string, i: number) => ({
          slideNumber: i + 1,
          scriptSection: section,
          confidence: 70,
          reasoning: 'Semantic fallback - OpenAI parsing failed',
          keyAlignment: []
        }))
      };
    }
  }

  async analyzeSlideWithVision(
    imageBase64: string,
    slideNumber: number
  ): Promise<{ success: boolean; analysis?: any; error?: string }> {
    if (!this.apiKey) {
      return { success: false, error: 'No API key provided' };
    }

    try {
      console.log(`🔍 OpenAI analyzing slide ${slideNumber}...`);
      
      const prompt = `Analyze this presentation slide and return ONLY a JSON object:
{
  "allText": "All visible text on the slide",
  "mainTopic": "Primary topic/theme of the slide",
  "keyPoints": ["key point 1", "key point 2", "key point 3"],
  "visualElements": ["chart", "diagram", "image", "etc"],
  "suggestedTalkingPoints": ["talking point 1", "talking point 2"],
  "emotionalTone": "professional/energetic/serious",
  "complexity": "simple/moderate/complex",
  "recommendedDuration": 60
}`;

      const response = await fetch(this.apiRoute, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          apiKey: this.apiKey,
          model: 'gpt-4o',
          max_tokens: 1000,
          messages: [{
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:image/png;base64,${imageBase64}` } }
            ]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`OpenAI API failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      try {
        const analysis = JSON.parse(content);
        console.log(`✅ OpenAI analyzed slide ${slideNumber}:`, analysis);
        return { success: true, analysis };
      } catch (parseError) {
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

    } catch (error) {
      console.error('❌ OpenAI analysis error:', error);
      return { success: false, error: error instanceof Error ? error.message : 'Analysis failed' };
    }
  }

  private findKeyAlignments(scriptSection: string, slideAnalysis: any): string[] {
    if (!slideAnalysis || !scriptSection) return [];
    
    const alignments: string[] = [];
    const scriptLower = scriptSection.toLowerCase();
    
    if (slideAnalysis.mainTopic) {
      const topicWords = slideAnalysis.mainTopic.toLowerCase().split(' ');
      for (const word of topicWords) {
        if (word.length > 3 && scriptLower.includes(word)) {
          alignments.push(word);
        }
      }
    }
    
    return alignments.slice(0, 3);
  }

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
