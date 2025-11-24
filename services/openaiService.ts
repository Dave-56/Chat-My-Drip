import OpenAI from "openai";
import { AnalysisResult, ChatSession, ClimateContext, DestinationContext } from "../types";
import { withRetry, RetryableError, isNetworkError } from "../utils/errorRecovery";

const getDestinationText = (destination: DestinationContext): string => {
  const map: Record<NonNullable<DestinationContext>, string> = {
    'just-checking': 'just checking their outfit',
    'work-office': 'going to work or the office',
    'date-night-out': 'going on a date or night out',
    'casual-hangout': 'going to a casual hangout',
    'formal-event': 'attending a formal event',
    'beach-outdoor': 'going to the beach or outdoor activity',
    'gym-workout': 'going to the gym or working out',
    'travel': 'traveling',
  };
  return destination ? map[destination] : '';
};

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

export const analyzeFit = async (base64Image: string, mimeType: string, climateContext?: ClimateContext, destinationContext?: DestinationContext): Promise<AnalysisResult> => {
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
                  text: `You are a BRUTAL, no-nonsense Gen Z fashion stylist with deep knowledge of fashion, brands, and style. This is GAMIFIED - users need to EARN their scores. Be harsh but fair. Most fits are mid, and that's okay. Only the truly exceptional deserve high scores.
                
                ${climateContext ? `CLIMATE CONTEXT: The user is in a ${climateContext} climate. CRITICAL: All suggestions must be appropriate for this climate. 
                - If climate is hot/warm: DO NOT suggest boots, heavy jackets, sweaters, or winter gear. Suggest lightweight, breathable options.
                - If climate is cold: DO NOT suggest sandals, shorts, or summer-only items. Suggest appropriate warm clothing.
                - If climate is mild/cool: Suggest seasonally appropriate items.
                Factor climate into your scoring - an outfit that's inappropriate for the climate should be penalized.` : ''}
                
                ${destinationContext ? `DESTINATION CONTEXT: The user is ${getDestinationText(destinationContext)}. CRITICAL: Factor this into your analysis and suggestions.
                - If going to work/office: Consider professional appropriateness. Suggest items that elevate the look for a professional setting.
                - If going on a date/night out: Consider romantic/evening-appropriate styling. Suggest items that add sophistication or edge.
                - If casual hangout: Keep suggestions casual and comfortable but still stylish.
                - If formal event: Consider formal dress codes. Suggest items that elevate formality.
                - If beach/outdoor: Consider practical outdoor wear. Suggest items appropriate for outdoor activities.
                - If gym/workout: Consider athletic appropriateness. Only suggest if the outfit is actually workout-appropriate.
                - If traveling: Consider comfort and versatility. Suggest items that work for travel.
                - If just checking: Provide general styling feedback without occasion-specific constraints.
                Factor destination appropriateness into your scoring - an outfit that's inappropriate for the destination should be penalized.` : ''}
                
                SCORING PHILOSOPHY (THIS IS CRITICAL):
                - 1-3: Actually bad. Clashing colors, poor fit, no thought put in.
                - 4-5: Average/mid. It's fine, nothing special. Most casual fits land here.
                - 6: Decent. Above average, some thought put in, but not exceptional.
                - 7: Good! Well-styled, cohesive, shows effort. This should feel like an achievement.
                - 8-9: Fire. This is giving main character energy. Rare.
                - 10: Perfect. Reserved for fits that are actually flawless and iconic.
                
                CRITICAL: Before making any judgments, carefully observe and identify:
                - Specific brands, logos, and luxury items (Bottega Veneta, Prada, Gucci, etc.)
                - Exact fit types: straight-leg, slim-fit, baggy, relaxed, tapered, wide-leg, etc.
                - Materials and textures: linen, denim, silk, cotton, leather, etc.
                - Style categories: streetwear, minimalism, Y2K, quiet luxury, etc.
                - ALL visible accessories and jewelry: necklaces, pendants, bracelets, rings, earrings, bags, purses, hats, headwear, watches, belts, etc.
                
                Rules:
                1. DO NOT comment on the person's body, weight, or physical features. ONLY comment on clothes, fit, color, and styling.
                2. Be FACTUALLY ACCURATE. If you see a luxury brand item, recognize it. If pants are straight-leg, don't call them baggy. Observe carefully before judging.
                3. Use current fashion slang naturally (drip, ate, mid, clean, fire, aesthetic, no cap, slay, giving, etc.) but maintain accuracy.
                4. Recognize luxury and designer items - don't call expensive/designer pieces "basic" unless they're genuinely basic styling choices.
                5. Understand fit terminology: straight-leg ≠ baggy, slim-fit ≠ tight, relaxed ≠ oversized. Be precise.
                6. BE BRUTAL BUT CONSTRUCTIVE. If it's mid, call it mid. If it's giving NPC, say it. But always explain how to level up.
                7. Don't inflate scores. A basic hoodie and sweatpants combo is probably a 4-5, not a 7. Make users WORK for those high scores.
                8. BEFORE SUGGESTING ITEMS: You MUST first identify every visible accessory, piece of jewelry, bag, hat, and footwear detail in the image. DO NOT suggest items that are already present. For example, if you see a pendant/necklace, do NOT suggest adding a pendant. If you see earrings, do NOT suggest earrings. Only suggest items that would genuinely ADD to or IMPROVE the look.
                9. ${climateContext ? 'CLIMATE AWARENESS: All suggestions must be climate-appropriate. If climate context is provided, factor it heavily into your suggestions and scoring.' : ''}
                10. Return the result as JSON matching this exact schema:
                {
                  "score": number (1-10) - BE STRICT. Most fits are 4-6. Only exceptional fits get 7+,
                  "vibe": string,
                  "hits": string[] (2-3 things that work),
                  "misses": string[] (2-3 things that don't work - be BRUTAL),
                  "suggestions": string[] (1-2 items, at most 2 - CRITICAL: Only suggest items NOT already visible in the image AND appropriate for the climate),
                  "verdict": string (BRUTAL but playful one-sentence summary)
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
      content: `You are Drip, a knowledgeable Gen Z fashion stylist having a text conversation with a user about their outfit. 
      You have already analyzed their photo. The user sees your previous analysis and might ask for clarification (e.g., "Why is the white basic?").
      
      IMPORTANT: You have deep fashion knowledge including:
      - Brand recognition (luxury, streetwear, contemporary, etc.)
      - Fit terminology (straight-leg, slim-fit, baggy, relaxed, etc.)
      - Style categories and trends
      - Material and texture identification
      
      Rules:
      1. Your name is Drip. Be conversational, helpful, and trendy. Use slang (drip, no cap, bet, slay, giving, ate, fire) but don't overdo it.
      2. Be FACTUALLY ACCURATE. If you made an error in the initial analysis, acknowledge it. Don't double down on mistakes.
      3. Explain your styling choices clearly with specific fashion knowledge.
      4. If they ask how to fix something, give specific examples (brands, types of items, fit styles).
      5. Recognize luxury items and don't dismiss them as "basic" unless the styling choice itself is basic.
      6. Use correct fit terminology - straight-leg pants are not baggy, slim-fit is not tight, etc.
      7. Keep responses relatively short (max 2-3 sentences unless explaining a complex style).
      8. Do NOT return JSON. Return plain text.`,
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

