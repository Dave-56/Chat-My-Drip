import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
import { AnalysisResult } from "../types";

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
      description: "A strict rating of the outfit from 1 to 10. Be critical but fair.",
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
      description: "List 1-2 things that clash, fit poorly, or don't work. Be honest.",
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List 2 specific items that would complete or fix this look.",
    },
    verdict: {
      type: Type.STRING,
      description: "A one-sentence punchy summary. Use Gen Z slang (e.g., 'No crumbs left', 'It's giving NPC').",
    },
  },
  required: ["score", "vibe", "hits", "misses", "suggestions", "verdict"],
};

export const analyzeFit = async (base64Image: string, mimeType: string): Promise<AnalysisResult> => {
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
            text: `You are a brutal but helpful Gen Z fashion stylist. Analyze this outfit. 
            
            Rules:
            1. DO NOT comment on the person's body, weight, or physical features. ONLY comment on clothes, fit, color, and styling.
            2. Use current fashion slang naturally (drip, ate, mid, clean, fire, aesthetic).
            3. Be honest. If it's bad, say it's bad (but help fix it).
            4. Return the result as JSON matching the schema.
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
      throw new Error("No response text received from Gemini.");
    }

    const data = JSON.parse(response.text);
    return data as AnalysisResult;

  } catch (error) {
    console.error("Error analyzing fit:", error);
    throw error;
  }
};

export const createStylistChat = (base64Image: string, mimeType: string, previousAnalysis: AnalysisResult): Chat => {
  return genAI.chats.create({
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
      systemInstruction: `You are Drip, a Gen Z fashion stylist having a text conversation with a user about their outfit. 
      You have already analyzed their photo. The user sees your previous analysis and might ask for clarification (e.g., "Why is the white basic?").
      
      Rules:
      1. Your name is Drip. Be conversational, helpful, and trendy. Use slang (drip, no cap, bet, slay) but don't overdo it.
      2. Explain your styling choices clearly.
      3. If they ask how to fix something, give specific examples (brands, types of items).
      4. Keep responses relatively short (max 2-3 sentences unless explaining a complex style).
      5. Do NOT return JSON. Return plain text.
      `,
    },
  });
};