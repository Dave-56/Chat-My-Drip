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
  PREVIEW = 'PREVIEW',
  ANALYZING = 'ANALYZING',
  RESULT = 'RESULT',
  ERROR = 'ERROR',
}

export interface UploadedImage {
  base64: string; // Raw base64 data without prefix for API
  previewUrl: string; // With prefix for <img> src
  mimeType: string;
}
