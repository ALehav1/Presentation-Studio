/**
 * OpenAI Service - Complete implementation for PresentationStudio
 * 
 * Based on OpenAI API v1 (2024):
 * - Endpoint: https://api.openai.com/v1/chat/completions
 * - Models: gpt-4o (vision), gpt-4o-mini (text-only)
 * - Authentication: Bearer token in headers
 * - Response format: { choices: [{ message: { content: string } }] }
 */

interface OpenAIRequestBody {
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string | Array<{
      type: 'text' | 'image_url';
      text?: string;
      image_url?: { url: string };
    }>;
  }>;
  max_tokens?: number;
  temperature?: number;
}

export class OpenAIService {
  private apiKey: string = '';
  private readonly textModel: string = 'gpt-4o-mini'; // Cost-effective for text
  private readonly visionModel: string = 'gpt-4o';     // Required for vision
  private readonly apiRoute: string = '/api/openai';

  setApiKey(apiKey: string) {
    this.apiKey = apiKey;
    console.log('🔑 OpenAI API key updated');
  }

  /**
   * Test OpenAI API connection
   */
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    if (!this.apiKey) {
      return { success: false, error: 'No API key provided' };
    }

    try {
      console.log('🔗 Testing OpenAI connection...');
      
      const response = await this.makeAPICall({
        model: this.textModel,
        max_tokens: 50,
        messages: [{ role: 'user', content: 'Test connection' }],
        temperature: 0.1
      });

      const data = await response.json();
      
      if (response.ok && data.choices?.[0]?.message?.content) {
        console.log('✅ OpenAI connection successful');
        return { success: true };
      } else {
        const error = data.error?.message || `HTTP ${response.status}`;
        return { success: false, error };
      }
    } catch (error) {
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Connection failed' 
      };
    }
  }

  /**
   * Intelligent script-to-slide matching using OpenAI
   */
  async matchScriptToSlidesIntelligently(
    slideAnalyses: Array<{ mainTopic: string; keyPoints?: string[] }>,
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
      return { success: false, error: 'No OpenAI API key provided' };
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

      const response = await this.makeAPICall({
        model: this.textModel,
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.1
      });

      if (!response.ok) {
        throw new Error(`OpenAI API failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';
      
      console.log('📄 OpenAI response preview:', content.substring(0, 300));

      try {
        // OpenAI typically returns cleaner JSON than Claude
        const scriptSections = JSON.parse(content.trim());
        
        if (!Array.isArray(scriptSections)) {
          throw new Error('Response is not an array');
        }

        console.log('✅ Successfully parsed', scriptSections.length, 'AI-matched sections');

        // Ensure exact count
        const finalSections = scriptSections.slice(0, slideAnalyses.length);
        while (finalSections.length < slideAnalyses.length) {
          finalSections.push(`Script section ${finalSections.length + 1}`);
        }

        const matches = finalSections.map((section: string, i: number) => ({
          slideNumber: i + 1,
          scriptSection: section.trim() || `Script section ${i + 1}`,
          confidence: 95,
          reasoning: 'OpenAI intelligent content matching',
          keyAlignment: this.findKeyAlignments(section, slideAnalyses[i])
        }));

        console.log('🎯 Successfully matched script using OpenAI intelligence!');
        
        return { success: true, matches };

      } catch (parseError) {
        console.error('⚠️ OpenAI JSON parse failed:', parseError);
        throw new Error('Failed to parse OpenAI response as JSON');
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

  /**
   * Analyze slide using OpenAI Vision API
   */
  async analyzeSlideWithVision(
    imageBase64: string,
    slideNumber: number
  ): Promise<{ 
    success: boolean; 
    analysis?: {
      allText: string;
      mainTopic: string;
      keyPoints: string[];
      visualElements: string[];
      suggestedTalkingPoints: string[];
      emotionalTone: string;
      complexity: string;
      recommendedDuration: number;
    }; 
    error?: string 
  }> {
    if (!this.apiKey) {
      return { success: false, error: 'No OpenAI API key provided' };
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

      const response = await this.makeAPICall({
        model: this.visionModel, // gpt-4o for vision
        max_tokens: 1000,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { 
              type: 'image_url', 
              image_url: { url: `data:image/png;base64,${imageBase64}` } 
            }
          ]
        }],
        temperature: 0.1
      });

      if (!response.ok) {
        throw new Error(`OpenAI Vision API failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      try {
        const analysis = JSON.parse(content);
        console.log(`✅ OpenAI analyzed slide ${slideNumber}:`, analysis);
        return { success: true, analysis };
      } catch {
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
      console.error('❌ OpenAI vision analysis error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Vision analysis failed' 
      };
    }
  }

  /**
   * Generate expert coaching for a slide
   */
  async generateExpertCoaching(
    slideAnalysis: { mainTopic: string; keyPoints?: string[] },
    scriptSection: string,
    slideNumber: number
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
      energyLevel: string;
    };
    error?: string;
  }> {
    if (!this.apiKey) {
      return { success: false, error: 'No OpenAI API key provided' };
    }

    try {
      console.log(`🎤 OpenAI generating expert coaching for slide ${slideNumber}...`);
      
      const prompt = `Generate expert presentation coaching for this slide. Return ONLY a JSON object:

SLIDE TOPIC: ${slideAnalysis.mainTopic}
KEY POINTS: ${slideAnalysis.keyPoints?.join(', ') || 'N/A'}
SPEAKER'S SCRIPT: ${scriptSection}

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
  "energyLevel": "high/medium/low"
}`;

      const response = await this.makeAPICall({
        model: this.textModel,
        max_tokens: 1500,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.2
      });

      if (!response.ok) {
        throw new Error(`OpenAI API failed: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content || '';

      try {
        const coaching = JSON.parse(content);
        console.log(`✅ OpenAI generated coaching for slide ${slideNumber}`);
        return { success: true, coaching };
      } catch {
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

    } catch (error) {
      console.error('❌ OpenAI coaching generation error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Coaching generation failed' 
      };
    }
  }

  /**
   * Core API call method
   */
  private async makeAPICall(requestBody: OpenAIRequestBody): Promise<Response> {
    return fetch(this.apiRoute, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        apiKey: this.apiKey,
        ...requestBody
      }),
    });
  }

  /**
   * Find key alignments between script and slide
   */
  private findKeyAlignments(
    scriptSection: string, 
    slideAnalysis: { mainTopic: string; keyPoints?: string[] }
  ): string[] {
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
   * Semantic fallback when AI parsing fails
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
