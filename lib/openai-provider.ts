import OpenAI from 'openai';

export interface OpenAIConfig {
  apiKey: string;
  model: string;
  maxTokens?: number;
}

export class OpenAIProvider {
  private client: OpenAI;
  private model: string;
  private maxTokens: number;

  constructor(config: OpenAIConfig) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true
    });
    this.model = config.model;
    this.maxTokens = config.maxTokens || 32768; // GPT-4.1-nano max output tokens
  }

  async generateResponse(messages: OpenAI.ChatCompletionMessageParam[]) {
    const completionParams: any = {
      model: this.model,
      messages,
      max_completion_tokens: this.maxTokens, // Use new parameter name
    };

    // GPT-5 models don't support streaming or temperature yet
    if (!this.model.includes('gpt-5')) {
      completionParams.stream = true;
      completionParams.temperature = 0.7; // Only for non-GPT-5 models
    }

    const response = await this.client.chat.completions.create(completionParams);

    return response;
  }

  async generateVisionAnalysis(imageData: string, prompt: string, tokenLimit: number = 50) {
    const messages: OpenAI.ChatCompletionMessageParam[] = [
      {
        role: 'user',
        content: [
          { type: 'text', text: prompt },
          {
            type: 'image_url',
            image_url: {
              url: imageData,
              detail: 'low' // For cost efficiency
            }
          }
        ]
      }
    ];

    const completionParams: any = {
      model: this.model,
      messages,
      max_completion_tokens: tokenLimit // Use new parameter name
    };

    // Only add temperature for non-GPT-5 models
    if (!this.model.includes('gpt-5')) {
      completionParams.temperature = 0.1;
    }

    const response = await this.client.chat.completions.create(completionParams);

    return response.choices[0]?.message?.content || '';
  }
}

export const createOpenAIProvider = (apiKey: string, model: string = 'gpt-5-2025-08-07') => {
  return new OpenAIProvider({ apiKey, model });
};