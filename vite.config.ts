import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    // Use process.env if env file doesn't have it (for Vercel deployment)
    const geminiApiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY || env.API_KEY || process.env.API_KEY || '';
    const openaiApiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';
    const aiProvider = env.AI_PROVIDER || process.env.AI_PROVIDER || ''; // 'openai' or 'gemini'
    
    return {
      server: {
        port: 3000,
        host: '0.0.0.0',
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(geminiApiKey),
        'process.env.GEMINI_API_KEY': JSON.stringify(geminiApiKey),
        'process.env.OPENAI_API_KEY': JSON.stringify(openaiApiKey),
        'process.env.AI_PROVIDER': JSON.stringify(aiProvider),
        'process.env.VITE_SUPABASE_URL': JSON.stringify(env.VITE_SUPABASE_URL || process.env.VITE_SUPABASE_URL || ''),
        'process.env.VITE_SUPABASE_ANON_KEY': JSON.stringify(env.VITE_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '')
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      }
    };
});
