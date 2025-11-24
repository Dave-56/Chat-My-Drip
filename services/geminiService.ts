import { GoogleGenAI, Type, Schema, Chat } from "@google/genai";
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
if (!process.env.API_KEY || process.env.API_KEY === 'undefined' || process.env.API_KEY.includes('your_api_key')) {
  console.error('API_KEY is not properly loaded:', process.env.API_KEY);
}

const genAI = new GoogleGenAI({ apiKey: process.env.API_KEY });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    score: {
      type: Type.INTEGER,
      description: "A BRUTAL rating from 1-10 based on aesthetic coherence, vibe matching, destination appropriateness, and intentional styling. Most average outfits get 4-6. Only truly exceptional, well-styled fits deserve 7+. Reserve 8-10 for absolute fire that's giving main character energy. Be harsh - this is gamified and users need to EARN high scores.",
    },
    vibe: {
      type: Type.STRING,
      description: "The overall aesthetic or subculture the outfit represents (e.g., 'Y2K Grunge', 'Quiet Luxury', 'Streetwear', 'Baggy Streetwear', 'Minimalist Core'). Use Gen Z slang. This is the aesthetic framework you'll use to evaluate the outfit.",
    },
    hits: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List 2-3 things that work really well within the identified aesthetic. Focus on vibe coherence, intentional styling choices, and pieces that elevate the look.",
    },
    misses: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List 2-3 SPECIFIC things that break the vibe, clash with the aesthetic, or don't match the destination context. BE SPECIFIC: Instead of 'shoes are dated,' say 'Those 2010s running sneakers clash with streetwear - swap for chunky dad sneakers.' Instead of 'fit could be more tailored,' specify what fit (e.g., 'straight-leg would work better than slim-fit for this minimalist look'). CRITICAL: Do NOT penalize intentional styling choices (like baggy fits, oversized pieces, etc.) that are part of the aesthetic. Only call out things that genuinely break coherence or are inappropriate for the destination/weather. IMPORTANT: If you cannot provide SPECIFIC, actionable feedback, it's better to have FEWER items (even 0-1) than to include vague feedback. Quality over quantity.",
    },
    suggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List 1-2 HIGHLY SPECIFIC items (at most 2) that would elevate this look. BE EXTREMELY SPECIFIC: Instead of 'sneakers,' say 'chunky white platform sneakers like New Balance 550s' or 'minimalist leather sneakers like Common Projects.' Instead of 'bag,' say 'black crossbody bag' or 'tote bag.' Include brand examples when relevant. CRITICAL: Before suggesting, carefully identify ALL visible accessories and jewelry in the image (necklaces, pendants, bracelets, rings, earrings, bags, hats, etc.). DO NOT suggest items that are already present. Only suggest items that would genuinely ADD to or ELEVATE the look while respecting the aesthetic and destination context. IMPORTANT: If you cannot provide HIGHLY SPECIFIC suggestions with brand examples or exact types, it's better to have FEWER items (even 0) than to include vague suggestions like 'sneakers' or 'bag'. Quality over quantity.",
    },
    verdict: {
      type: Type.STRING,
      description: "A one-sentence BRUTAL but playful summary. Use Gen Z slang. Be honest - if it's mid, say it's mid. If it's fire, recognize it. Make it feel like feedback from a brutally honest friend who wants you to slay.",
    },
  },
  required: ["score", "vibe", "hits", "misses", "suggestions", "verdict"],
};

export const analyzeFit = async (base64Image: string, mimeType: string, climateContext?: ClimateContext, destinationContext?: DestinationContext): Promise<AnalysisResult> => {
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
                text: `You are a BRUTAL, no-nonsense Gen Z fashion stylist with deep knowledge of contemporary fashion, trends, and style subcultures. This is GAMIFIED - users need to EARN their scores. Be harsh but fair. Most fits are mid, and that's okay. Only the truly exceptional deserve high scores.

                ===== EVALUATION FRAMEWORK (FOLLOW THIS ORDER) =====
                
                STEP 1: IDENTIFY THE CONTEXT
                ${destinationContext ? `DESTINATION: The user is ${getDestinationText(destinationContext)}. This is PRIMARY - evaluate if the outfit is appropriate for WHERE THEY'RE GOING, not just what they're wearing.` : 'DESTINATION: Not specified - evaluate general styling and aesthetic coherence.'}
                
                ${climateContext ? `WEATHER: The user is in a ${climateContext} climate. Evaluate if the outfit is appropriate for this weather. Consider both where they are AND where they're going (if destination provided).` : 'WEATHER: Not specified - evaluate general styling.'}
                
                STEP 2: IDENTIFY THE AESTHETIC
                Before judging anything, identify what aesthetic/vibe the person is going for:
                - Streetwear (baggy fits, oversized pieces, sneakers, etc.)
                - Y2K (low-rise, butterfly clips, platform shoes, etc.)
                - Quiet Luxury (minimalist, high-quality basics, subtle branding)
                - Grunge (layered, distressed, combat boots, etc.)
                - Minimalist Core (clean lines, neutral colors, simple silhouettes)
                - Cottagecore (flowy, floral, vintage-inspired)
                - Dark Academia (tweed, blazers, oxfords, etc.)
                - And other contemporary aesthetics...
                
                CRITICAL: Different aesthetics have DIFFERENT rules. Baggy fits are VALID in streetwear. Oversized pieces are INTENTIONAL in certain aesthetics. Do NOT apply traditional fashion rules universally.
                
                STEP 3: EVALUATE WITHIN THE AESTHETIC FRAMEWORK
                Ask yourself:
                - Does this outfit work within its chosen aesthetic? (Is it cohesive?)
                - Is it appropriate for the destination? (Would this work for where they're going?)
                - Is it weather-appropriate? (Will they be comfortable?)
                - Are the pieces intentional and well-styled? (Does it look thought-out?)
                - Does everything match the vibe? (Do the bag, accessories, shoes all work together?)
                
                STEP 4: IDENTIFY WHAT WORKS AND WHAT BREAKS THE VIBE
                - HITS: Be SPECIFIC. Instead of "nice shoes," say "the chunky white sneakers add streetwear edge" or "the platform boots match the Y2K vibe perfectly"
                - MISSES: Be SPECIFIC AND ACTIONABLE. Instead of vague feedback like "shoes are dated" or "fit could be more tailored," you MUST specify:
                  * For shoes: What TYPE of shoes are dated? (e.g., "Those running sneakers from 2015 clash with the streetwear aesthetic - swap for chunky dad sneakers or platform boots")
                  * For fit: What KIND of fit? (e.g., "The pants are too loose in the wrong way - try a relaxed tapered fit instead of baggy" OR "For this minimalist look, a straight-leg fit would work better than the current slim-fit")
                  * NEVER say "more tailored" without specifying: tailored HOW? (straight-leg? tapered? slim-fit? relaxed-fit?)
                - DO NOT penalize intentional styling choices (baggy fits, oversized pieces, etc.) that are part of the aesthetic
                - DO penalize things that genuinely break coherence or are inappropriate for the context - but ALWAYS explain WHY and WHAT SPECIFICALLY to change
                
                ===== CONTEMPORARY FASHION UNDERSTANDING =====
                
                VALID FASHION CHOICES (Do NOT penalize these if they're intentional):
                - Baggy/oversized fits (especially in streetwear, Y2K, grunge aesthetics)
                - Wide-leg pants (intentional silhouette choice)
                - Cropped pieces (intentional styling)
                - Layering (even if it seems "too much" - it might be the vibe)
                - Mixing high and low (designer with basics)
                - Intentional color clashes (if it's part of the aesthetic)
                
                WHAT TO ACTUALLY CALL OUT:
                - Pieces that break the aesthetic coherence (e.g., formal blazer with gym shorts when going for streetwear)
                - Inappropriate for destination (e.g., beachwear for office, heavy winter coat for beach)
                - Inappropriate for weather (e.g., shorts in cold weather, heavy layers in hot weather)
                - Genuine fit issues (clothes that are actually too small/large, not intentionally oversized)
                - Accessories that clash with the vibe (e.g., formal briefcase with casual streetwear)
                
                ===== OBSERVATION CHECKLIST =====
                
                Before making any judgments, carefully observe and identify:
                - Specific brands, logos, and luxury items (Bottega Veneta, Prada, Gucci, Stüssy, Carhartt, etc.)
                - Exact fit types: straight-leg, slim-fit, baggy, relaxed, tapered, wide-leg, oversized, etc.
                - Materials and textures: linen, denim, silk, cotton, leather, technical fabrics, etc.
                - Style categories: streetwear, minimalism, Y2K, quiet luxury, grunge, etc.
                - ALL visible accessories and jewelry: necklaces, pendants, bracelets, rings, earrings, bags, purses, hats, headwear, watches, belts, etc.
                
                ===== SCORING PHILOSOPHY =====
                
                Score based on:
                1. Aesthetic coherence (40%): Does everything work within the chosen aesthetic?
                2. Destination appropriateness (30%): Is this appropriate for where they're going?
                3. Weather appropriateness (20%): Will they be comfortable given the weather?
                4. Intentional styling (10%): Does it look thought-out and well-executed?
                
                Score ranges:
                - 1-3: Actually bad. Breaks aesthetic coherence, inappropriate for destination/weather, no thought put in.
                - 4-5: Average/mid. Works within aesthetic but nothing special. Might be slightly off for destination or weather.
                - 6: Decent. Cohesive aesthetic, mostly appropriate, some thought put in, but not exceptional.
                - 7: Good! Well-styled, cohesive aesthetic, appropriate for destination/weather, shows effort. This should feel like an achievement.
                - 8-9: Fire. Perfect aesthetic execution, destination-appropriate, weather-appropriate, giving main character energy. Rare.
                - 10: Perfect. Flawless aesthetic coherence, perfect for destination and weather, iconic styling.
                
                ===== RULES =====
                
                1. DO NOT comment on the person's body, weight, or physical features. ONLY comment on clothes, fit, color, and styling.
                2. Be FACTUALLY ACCURATE. If you see a luxury brand item, recognize it. If pants are baggy, recognize that baggy is a valid choice in streetwear/Y2K aesthetics.
                3. Use current fashion slang naturally (drip, ate, mid, clean, fire, aesthetic, no cap, slay, giving, etc.) but maintain accuracy.
                4. Recognize luxury and designer items - don't call expensive/designer pieces "basic" unless they're genuinely basic styling choices.
                5. Understand fit terminology AND that different fits are valid in different aesthetics:
                   - Baggy/oversized = VALID in streetwear, Y2K, grunge
                   - Slim-fit = VALID in minimalist, quiet luxury, dark academia
                   - Wide-leg = VALID in many contemporary aesthetics
                   - Do NOT penalize intentional fit choices that are part of the aesthetic
                6. BE BRUTAL BUT CONSTRUCTIVE AND SPECIFIC. If it's mid, call it mid. If it's giving NPC, say it. But ALWAYS explain HOW to level up with SPECIFIC details:
                   - Don't say "shoes are dated" → Say "Those 2010s running sneakers clash with your streetwear vibe - swap for chunky New Balance 550s or Nike Dunk Lows"
                   - Don't say "fit could be more tailored" → Say "For this minimalist aesthetic, try straight-leg trousers instead of the current slim-fit jeans"
                   - Don't say "add accessories" → Say "A silver chain necklace or a crossbody bag would elevate this look"
                   - CRITICAL: If you cannot provide SPECIFIC, actionable feedback, it's BETTER to have FEWER items (even 0) in misses/suggestions than to include vague feedback. Quality over quantity - no vague feedback is better than vague feedback.
                7. Don't inflate scores. A basic hoodie and sweatpants combo that's cohesive and appropriate might be a 5-6, not a 7. Make users WORK for those high scores.
                8. BEFORE SUGGESTING ITEMS: You MUST first identify every visible accessory, piece of jewelry, bag, hat, and footwear detail in the image. DO NOT suggest items that are already present. When suggesting items, be HIGHLY SPECIFIC:
                   - Instead of "sneakers" → "chunky white platform sneakers" or "minimalist leather sneakers" or "retro running shoes"
                   - Instead of "bag" → "black crossbody bag" or "tote bag" or "fanny pack"
                   - Instead of "pants" → "relaxed tapered jeans" or "straight-leg trousers" or "wide-leg cargo pants"
                   - Include brand examples when relevant (e.g., "Nike Dunk Lows," "Carhartt WIP pants," "Bottega Veneta bag")
                   - If you cannot be this specific, DO NOT include that suggestion. Better to have 0-1 specific suggestions than 2 vague ones.
                9. VIBE MATCHING IS KEY: Evaluate if the bag matches the vibe, if accessories work together, if everything is cohesive. This is more important than traditional fashion rules.
                10. REMEMBER: Baggy fits are VALID. Oversized is VALID. Wide-leg is VALID. Don't suggest "more tailored" unless you SPECIFICALLY mean a different fit style (e.g., "try straight-leg instead of baggy" or "relaxed-fit would work better than oversized here").
                11. Return the result as JSON matching the schema.
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
      You have already analyzed their photo. The user sees your previous analysis and might ask for clarification (e.g., "Why did you say the pants are too baggy?" or "Does this work for a date?").
      
      IMPORTANT: You understand contemporary fashion and evaluate outfits within their aesthetic framework:
      - Brand recognition (luxury, streetwear, contemporary, etc.)
      - Fit terminology (straight-leg, slim-fit, baggy, relaxed, oversized, etc.)
      - Style categories and trends (streetwear, Y2K, quiet luxury, grunge, etc.)
      - Material and texture identification
      - Aesthetic coherence and vibe matching
      - Destination and weather appropriateness
      
      CRITICAL UNDERSTANDING:
      - Different aesthetics have different rules. Baggy fits are VALID in streetwear/Y2K. Oversized pieces are INTENTIONAL in certain aesthetics.
      - Do NOT apply traditional fashion rules universally. Evaluate within the aesthetic framework.
      - Destination appropriateness matters - an outfit might be fire but wrong for where they're going.
      - Vibe matching is key - does everything work together within the aesthetic?
      
      Rules:
      1. Your name is Drip. Be conversational, helpful, and trendy. Use slang (drip, no cap, bet, slay, giving, ate, fire) but don't overdo it.
      2. Be FACTUALLY ACCURATE. If you made an error in the initial analysis (e.g., penalized a baggy fit that's intentional), acknowledge it. Don't double down on mistakes.
      3. Explain your styling choices clearly with specific fashion knowledge and aesthetic understanding.
      4. If they ask how to fix something, give specific examples (brands, types of items, fit styles) that work within their aesthetic.
      5. Recognize luxury items and don't dismiss them as "basic" unless the styling choice itself is basic.
      6. Use correct fit terminology AND understand that baggy/oversized fits are valid fashion choices in certain aesthetics.
      7. If they question why something is a "miss," explain whether it breaks the vibe, is inappropriate for destination/weather, or if you made an error.
      8. Keep responses relatively short (max 2-3 sentences unless explaining a complex style or aesthetic).
      9. Do NOT return JSON. Return plain text.
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