import OpenAI from "openai";
import { AnalysisResult, ChatSession } from "../types";
import { withRetry, RetryableError, isNetworkError } from "../utils/errorRecovery";

// Debug: Check if API key is loaded
if (!process.env.OPENAI_API_KEY || process.env.OPENAI_API_KEY === 'undefined' || process.env.OPENAI_API_KEY.includes('your_api_key')) {
  console.error('OPENAI_API_KEY is not properly loaded:', process.env.OPENAI_API_KEY);
}

const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY,
  dangerouslyAllowBrowser: true // Required for browser usage - API key should be secured via environment variables
});

// Chat session manager to mimic Gemini's Chat interface
export class OpenAIChat implements ChatSession {
  private client: OpenAI;
  private messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[];
  private model: string;

  constructor(
    client: OpenAI,
    model: string,
    initialMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[]
  ) {
    this.client = client;
    this.model = model;
    this.messages = [...initialMessages];
  }

  async sendMessage(options: { message: string }): Promise<{ text: string }> {
    this.messages.push({
      role: "user",
      content: options.message,
    });

    const response = await this.client.chat.completions.create({
      model: this.model,
      messages: this.messages,
      temperature: 0.7,
    });

    const assistantMessage = response.choices[0]?.message?.content || "Sorry, I couldn't generate a response.";
    
    this.messages.push({
      role: "assistant",
      content: assistantMessage,
    });

    return { text: assistantMessage };
  }
}

export const analyzeFit = async (base64Image: string, mimeType: string): Promise<AnalysisResult> => {
  return withRetry(
    async () => {
      try {
        // Convert base64 to OpenAI's base64_url format
        const base64Url = `data:${mimeType};base64,${base64Image}`;

        const response = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "image_url",
                  image_url: {
                    url: base64Url,
                  },
                },
                {
                  type: "text",
                  text: `You are a brutal but helpful Gen Z fashion stylist. Analyze this outfit. 
                
                Rules:
                1. DO NOT comment on the person's body, weight, or physical features. ONLY comment on clothes, fit, color, and styling.
                2. Use current fashion slang naturally (drip, ate, mid, clean, fire, aesthetic).
                3. Be honest. If it's bad, say it's bad (but help fix it).
                4. Return the result as JSON matching this exact schema:
                {
                  "score": number (1-10),
                  "vibe": string,
                  "hits": string[],
                  "misses": string[],
                  "suggestions": string[],
                  "verdict": string
                }`,
                },
              ],
            },
          ],
          response_format: { type: "json_object" },
          temperature: 0.7,
        });

        const content = response.choices[0]?.message?.content;
        if (!content) {
          throw new RetryableError("No response text received from OpenAI.", undefined, true);
        }

        const data = JSON.parse(content);
        
        // Validate the response structure
        if (!data.score || !data.vibe || !data.hits || !data.misses || !data.suggestions || !data.verdict) {
          throw new RetryableError("Invalid response format from OpenAI.", undefined, true);
        }

        return data as AnalysisResult;
      } catch (error) {
        // Wrap network errors as retryable
        if (isNetworkError(error)) {
          throw new RetryableError(
            "Network error. Please check your connection and try again.",
            error instanceof Error ? error : undefined,
            true
          );
        }
        // Re-throw non-retryable errors
        throw error;
      }
    },
    {
      maxRetries: 3,
      initialDelay: 1000,
      maxDelay: 5000,
      backoffMultiplier: 2,
    }
  );
};

export const createStylistChat = (
  base64Image: string,
  mimeType: string,
  previousAnalysis: AnalysisResult
): ChatSession => {
  const base64Url = `data:${mimeType};base64,${base64Image}`;

  const initialMessages: OpenAI.Chat.Completions.ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: `You are Drip, a Gen Z fashion stylist having a text conversation with a user about their outfit. 
      You have already analyzed their photo. The user sees your previous analysis and might ask for clarification (e.g., "Why is the white basic?").
      
      Rules:
      1. Your name is Drip. Be conversational, helpful, and trendy. Use slang (drip, no cap, bet, slay) but don't overdo it.
      2. Explain your styling choices clearly.
      3. If they ask how to fix something, give specific examples (brands, types of items).
      4. Keep responses relatively short (max 2-3 sentences unless explaining a complex style).
      5. Do NOT return JSON. Return plain text.`,
    },
    {
      role: "user",
      content: [
        {
          type: "image_url",
          image_url: {
            url: base64Url,
          },
        },
        {
          type: "text",
          text: "Here is my outfit. Please be ready to answer follow-up questions about it.",
        },
      ],
    },
    {
      role: "assistant",
      content: `I've analyzed your fit. I rated it ${previousAnalysis.score}/10. Vibe: ${previousAnalysis.vibe}. Verdict: ${previousAnalysis.verdict}. Hits: ${previousAnalysis.hits.join(', ')}. Misses: ${previousAnalysis.misses.join(', ')}.`,
    },
  ];

  return new OpenAIChat(openai, "gpt-4o", initialMessages);
};

