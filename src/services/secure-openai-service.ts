// Secure OpenAI service that uses backend proxy instead of direct API calls
// This prevents API key exposure in the browser

import { logError } from '../shared/utils/debug';

export interface SecureOpenAIMessage {
  role: 'user' | 'assistant' | 'system';
  content: string | Array<{
    type: 'text' | 'image_url';
    text?: string;
    image_url?: {
      url: string;
      detail?: 'low' | 'high' | 'auto';
    };
  }>;
}

export interface SecureOpenAIRequest {
  model?: string;
  messages: SecureOpenAIMessage[];
  max_completion_tokens?: number;
  temperature?: number;
  response_format?: {
    type: 'text' | 'json_object';
  };
}

export interface SecureOpenAIResponse {
  choices: Array<{
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export class SecureOpenAIService {
  private baseUrl: string;
  
  constructor() {
    // Use relative URL for Vercel deployment, localhost for development
    this.baseUrl = process.env.NODE_ENV === 'development' 
      ? 'http://localhost:3000'  // Adjust port as needed
      : '';  // Relative URL for production
  }

  /**
   * Check if the secure AI service is available
   */
  async isAvailable(): Promise<boolean> {
    try {
      // Simple test request with minimal token usage
      await this.generateText('Test', { maxTokens: 10 });
      return true;
    } catch {
      return false;
    }
  }

  async createChatCompletion(request: SecureOpenAIRequest): Promise<SecureOpenAIResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/api/openai-proxy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(request)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`API Error: ${errorData.error} (${response.status})`);
      }

      return await response.json();

    } catch (error) {
      logError('SecureOpenAI request failed', error);
      throw error;
    }
  }

  // Convenience method for simple text completion
  async generateText(
    prompt: string, 
    options: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    } = {}
  ): Promise<string> {
    const request: SecureOpenAIRequest = {
      model: options.model || 'gpt-4o',
      messages: [
        { role: 'user', content: prompt }
      ],
      max_completion_tokens: options.maxTokens || 1000,
      temperature: options.temperature || 0.2
    };

    const response = await this.createChatCompletion(request);
    return response.choices[0]?.message?.content || '';
  }

  // Method for vision tasks with images
  async analyzeImage(
    imageUrl: string,
    prompt: string,
    options: {
      model?: string;
      maxTokens?: number;
      detail?: 'low' | 'high' | 'auto';
    } = {}
  ): Promise<string> {
    const request: SecureOpenAIRequest = {
      model: options.model || 'gpt-4o',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            { 
              type: 'image_url', 
              image_url: { 
                url: imageUrl,
                detail: options.detail || 'auto'
              } 
            }
          ]
        }
      ],
      max_completion_tokens: options.maxTokens || 1000,
      temperature: 0.2
    };

    const response = await this.createChatCompletion(request);
    return response.choices[0]?.message?.content || '';
  }

  // Method for structured JSON responses
  async generateJSON<T = any>(
    prompt: string,
    options: {
      model?: string;
      maxTokens?: number;
    } = {}
  ): Promise<T> {
    const request: SecureOpenAIRequest = {
      model: options.model || 'gpt-4o',
      messages: [
        { role: 'user', content: prompt }
      ],
      max_completion_tokens: options.maxTokens || 1000,
      temperature: 0.2,
      response_format: { type: 'json_object' }
    };

    const response = await this.createChatCompletion(request);
    const content = response.choices[0]?.message?.content || '{}';
    
    try {
      return JSON.parse(content);
    } catch (error) {
      logError('Failed to parse JSON response', error, { content });
      throw new Error('Invalid JSON response from AI service');
    }
  }
}
