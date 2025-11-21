import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { AnalysisResult, ChatSession } from "../types";
import { withRetry, RetryableError, isNetworkError } from "../utils/errorRecovery";

// Debug: Check if API key is loaded
if (!process.env.API_KEY || process.env.API_KEY === 'undefined' || process.env.API_KEY.includes('your_api_key')) {
  console.error('API_KEY is not properly loaded:', process.env.API_KEY);
}

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.INTEGER,
      description: "A BRUTAL rating from 1-10. Most average outfits get 4-6. Only truly exceptional, well-styled fits deserve 7+. Reserve 8-10 for absolute fire that's giving main character energy. Be harsh - this is gamified and users need to EARN high scores.",
    },
    vibe: {
      type: Type.STRING,
      description: "The overall aesthetic or subculture the outfit represents (e.g., 'Y2K Grunge', 'Quiet Luxury', 'Streetwear'). Use Gen Z slang.",
    },
    hits: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List 2-3 things that work really well in this outfit.",
    },
    misses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List 2-3 things that clash, fit poorly, or don't work. Be BRUTAL and honest. Don't sugarcoat it.",
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List 2 specific items that would complete or fix this look.",
    },
    verdict: {
      type: Type.STRING,
      description: "A one-sentence BRUTAL but playful summary. Use Gen Z slang. Be honest - if it's mid, say it's mid. If it's fire, recognize it. Make it feel like feedback from a brutally honest friend who wants you to slay.",
    },
  },
  required: ["score", "vibe", "hits", "misses", "suggestions", "verdict"],
};

export const analyzeFit = async (base64Image: string, mimeType: string): Promise<AnalysisResult> => {
  return withRetry(
    async () => {
      try {
        const response = await genAI.models.generateContent({
          model: "gemini-2.0-flash-exp",
          contents: {
            parts: [
              {
                inlineData: {
                  mimeType: mimeType,
                  data: base64Image,
                },
              },
              {
                text: `You are a BRUTAL, no-nonsense Gen Z fashion stylist with deep knowledge of fashion, brands, and style. This is GAMIFIED - users need to EARN their scores. Be harsh but fair. Most fits are mid, and that's okay. Only the truly exceptional deserve high scores.
                
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
                
                Rules:
                1. DO NOT comment on the person's body, weight, or physical features. ONLY comment on clothes, fit, color, and styling.
                2. Be FACTUALLY ACCURATE. If you see a luxury brand item, recognize it. If pants are straight-leg, don't call them baggy. Observe carefully before judging.
                3. Use current fashion slang naturally (drip, ate, mid, clean, fire, aesthetic, no cap, slay, giving, etc.) but maintain accuracy.
                4. Recognize luxury and designer items - don't call expensive/designer pieces "basic" unless they're genuinely basic styling choices.
                5. Understand fit terminology: straight-leg ≠ baggy, slim-fit ≠ tight, relaxed ≠ oversized. Be precise.
                6. BE BRUTAL BUT CONSTRUCTIVE. If it's mid, call it mid. If it's giving NPC, say it. But always explain how to level up.
                7. Don't inflate scores. A basic hoodie and sweatpants combo is probably a 4-5, not a 7. Make users WORK for those high scores.
                8. Return the result as JSON matching the schema.
                `,
              },
            ],
          },
          config: {
            responseMimeType: "application/json",
            responseSchema: responseSchema,
            temperature: 0.7, // Slightly creative
          },
        });

        if (!response.text) {
          throw new RetryableError("No response text received from Gemini.", undefined, true);
        }

        const data = JSON.parse(response.text);
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

export const createStylistChat = (base64Image: string, mimeType: string, previousAnalysis: AnalysisResult): ChatSession => {
  const geminiChat = genAI.chats.create({
    model: "gemini-2.0-flash-exp",
    history: [
      {
        role: "user",
        parts: [
          {
            inlineData: {
              mimeType: mimeType,
              data: base64Image,
            },
          },
          {
            text: "Here is my outfit. Please be ready to answer follow-up questions about it."
          }
        ],
      },
      {
        role: "model",
        parts: [
          {
            text: `I've analyzed your fit. I rated it ${previousAnalysis.score}/10. Vibe: ${previousAnalysis.vibe}. Verdict: ${previousAnalysis.verdict}. Hits: ${previousAnalysis.hits.join(', ')}. Misses: ${previousAnalysis.misses.join(', ')}.`
          }
        ]
      }
    ],
    config: {
      systemInstruction: `You are Drip, a knowledgeable Gen Z fashion stylist having a text conversation with a user about their outfit. 
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
      8. Do NOT return JSON. Return plain text.
      `,
    },
  });

  // Wrap Gemini Chat to match ChatSession interface
  return {
    sendMessage: async (options: { message: string }) => {
      const response = await geminiChat.sendMessage({ message: options.message });
      return { text: response.text || "" };
    }
  };
};