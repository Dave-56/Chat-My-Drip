export interface AnalysisResult {
  score: number;
  vibe: string;
  hits: string[];
  misses: string[];
  suggestions: string[];
  verdict: string; // A short, punchy summary ("You ate this up" or "Go change immediately")
}

export enum AppState {
  LANDING = 'LANDING',
  ONBOARDING = 'ONBOARDING',
  PREVIEW = 'PREVIEW',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  CHAT = 'CHAT',
  ERROR = 'ERROR',
  MY_FITS = 'MY_FITS',
  SAVED_OUTFIT = 'SAVED_OUTFIT',
}

export type ClimateContext = 'hot' | 'warm' | 'mild' | 'cool' | 'cold';

export interface UploadedImage {
  base64: string; // Raw base64 data without prefix for API
  previewUrl: string; // With prefix for <img> src
  mimeType: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  retryable?: boolean;
  originalMessage?: ChatMessage;
}

export interface SavedOutfit {
  id: string;
  image: UploadedImage;
  analysis: AnalysisResult;
  savedAt: number; // timestamp
  name?: string; // optional name/tag
  collectionIds?: string[]; // IDs of collections this outfit belongs to
}

export interface Collection {
  id: string;
  name: string;
  color?: string; // Optional color for the collection
  createdAt: number; // timestamp
  outfitIds: string[]; // IDs of outfits in this collection
}

// Common interface for chat sessions (works with both Gemini and OpenAI)
export interface ChatSession {
  sendMessage(options: { message: string }): Promise<{ text: string }>;
}