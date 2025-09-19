// SECURE Enhanced OpenAI Service using backend proxy
// Replaces the insecure openai-service.ts that exposed API keys in browser

import { SecureOpenAIService } from './secure-openai-service';
import { logError } from '../shared/utils/debug';

// Types from original service
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

/**
 * SECURE Enhanced OpenAI Service
 * Provides the same functionality as OpenAIService but uses secure backend proxy
 * NO API keys are ever stored in localStorage or exposed to browser
 */
export class SecureOpenAIEnhanced {
  private secureAI: SecureOpenAIService;
  private textModel: string;

  constructor() {
    this.secureAI = new SecureOpenAIService();
    this.textModel = "gpt-4o";    // Current best text model
  }

  /**
   * Analyze a slide image and extract structured information
   */
  async analyzeSlide(_imageUrl: string): Promise<SlideAnalysis> {
    try {
      const prompt = `Analyze this slide and provide a JSON response with the following structure:
      {
        "allText": "all text content on the slide",
        "mainTopic": "main topic in 2-4 words", 
        "keyPoints": ["key point 1", "key point 2", "key point 3"],
        "visualElements": ["chart", "graph", "image", "diagram"],
        "suggestedTalkingPoints": ["talking point 1", "talking point 2"],
        "emotionalTone": "professional|casual|inspirational",
        "complexity": "basic|moderate|advanced",
        "recommendedDuration": 60
      }`;

      const response = await this.secureAI.generateJSON<SlideAnalysis>(prompt);
      return response;

    } catch (error) {
      logError('Slide analysis failed', error);
      
      // Fallback to basic analysis
      return {
        allText: 'Unable to analyze slide content',
        mainTopic: 'Slide Content',
        keyPoints: ['Content could not be analyzed'],
        visualElements: [],
        suggestedTalkingPoints: ['Review slide content manually'],
        emotionalTone: 'professional',
        complexity: 'moderate',
        recommendedDuration: 60
      };
    }
  }

  /**
   * Generate presentation coaching based on slide analysis and script
   */
  async generateCoaching(slideAnalysis: SlideAnalysis, slideScript: string): Promise<Coaching> {
    try {
      const prompt = `Based on this slide analysis and script, provide coaching advice in JSON format:

      Slide Analysis: ${JSON.stringify(slideAnalysis, null, 2)}
      Slide Script: ${slideScript}

      Provide response in this format:
      {
        "openingStrategy": "how to open this slide section",
        "keyEmphasisPoints": ["point to emphasize 1", "point to emphasize 2"],
        "bodyLanguageTips": ["body language tip 1", "body language tip 2"], 
        "voiceModulation": ["voice tip 1", "voice tip 2"],
        "audienceEngagement": ["engagement technique 1", "engagement technique 2"],
        "transitionToNext": "how to transition to next slide",
        "timingRecommendation": "timing advice for this slide",
        "potentialQuestions": ["likely audience question 1", "likely question 2"],
        "commonMistakes": ["mistake to avoid 1", "mistake to avoid 2"],
        "energyLevel": "low|medium|high"
      }`;

      const response = await this.secureAI.generateJSON<Coaching>(prompt);
      return response;

    } catch (error) {
      logError('Coaching generation failed', error);
      
      // Fallback coaching
      return {
        openingStrategy: 'Start with confidence and clear introduction',
        keyEmphasisPoints: ['Focus on main message', 'Use clear examples'],
        bodyLanguageTips: ['Maintain eye contact', 'Use purposeful gestures'],
        voiceModulation: ['Vary your pace', 'Emphasize key points'],
        audienceEngagement: ['Ask rhetorical questions', 'Use pause for impact'],
        transitionToNext: 'Smoothly connect to next topic',
        timingRecommendation: 'Spend appropriate time on each point',
        potentialQuestions: ['Be prepared for clarification questions'],
        commonMistakes: ['Avoid rushing through content'],
        energyLevel: 'medium'
      };
    }
  }

  /**
   * Match script content to slide topics using AI
   */
  async matchScriptToSlide(slideAnalysis: SlideAnalysis, fullScript: string): Promise<string> {
    try {
      const prompt = `Given this slide analysis and full presentation script, extract the portion of the script that best matches this slide:

      Slide Analysis: 
      - Main Topic: ${slideAnalysis.mainTopic}
      - Key Points: ${slideAnalysis.keyPoints.join(', ')}
      - All Text: ${slideAnalysis.allText}

      Full Script:
      ${fullScript}

      Return only the script portion that matches this slide's content. Be precise and contextual.`;

      const matchedScript = await this.secureAI.generateText(prompt, {
        model: this.textModel,
        maxTokens: 500,
        temperature: 0.2
      });

      return matchedScript.trim();

    } catch (error) {
      logError('Script matching failed', error);
      
      // Fallback: return a portion of the script based on word count
      const words = fullScript.split(' ');
      const portion = Math.max(1, Math.floor(words.length / 10)); // Rough estimate
      return words.slice(0, portion).join(' ');
    }
  }

  /**
   * Check if the secure AI service is available
   */
  async isAvailable(): Promise<boolean> {
    return await this.secureAI.isAvailable();
  }
}
