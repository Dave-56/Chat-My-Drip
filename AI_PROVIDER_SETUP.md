# How to Switch AI Provider to ChatGPT

This guide shows you how to switch from Gemini to ChatGPT (OpenAI) for the AI analysis.

## Quick Setup

### For Local Development

1. Create or update `.env.local` in your project root:
   ```env
   # Supabase (required)
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here

   # AI Provider Configuration
   AI_PROVIDER=openai
   # OR
   AI_PROVIDER=chatgpt
   # (both values work - use either one)

   # OpenAI API Key (required for ChatGPT)
   OPENAI_API_KEY=sk-your-openai-api-key-here
   ```

2. **Get your OpenAI API Key:**
   - Go to [OpenAI Platform](https://platform.openai.com/api-keys)
   - Sign in or create an account
   - Click "Create new secret key"
   - Copy the key (starts with `sk-`)
   - Paste it as `OPENAI_API_KEY` in your `.env.local`

3. Restart your dev server:
   ```bash
   npm run dev
   ```

### For Vercel Production

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add these variables:
   - `AI_PROVIDER` = `openai` (or `chatgpt`)
   - `OPENAI_API_KEY` = `sk-your-openai-api-key-here`
4. **Important:** Make sure to add these for all environments (Production, Preview, Development)
5. Redeploy your app

## How It Works

The app checks for `AI_PROVIDER` in this order:
1. If `AI_PROVIDER=openai` or `AI_PROVIDER=chatgpt` → Uses ChatGPT
2. If `AI_PROVIDER=gemini` → Uses Gemini
3. If not set, it auto-detects based on available API keys:
   - Only `OPENAI_API_KEY` → Uses ChatGPT
   - Only `API_KEY` or `GEMINI_API_KEY` → Uses Gemini
   - Both available → Defaults to Gemini (original)

## Switching Back to Gemini

To switch back to Gemini, either:
- Remove `AI_PROVIDER` from your env file, OR
- Set `AI_PROVIDER=gemini`

Make sure you have `API_KEY` or `GEMINI_API_KEY` set.

## Troubleshooting

### "OPENAI_API_KEY is not properly loaded"
- Make sure `.env.local` exists in the project root
- Check that the variable name is exactly `OPENAI_API_KEY`
- Restart your dev server after adding env variables
- For Vercel, make sure the variable is added in Environment Variables

### Still using Gemini after setting AI_PROVIDER
- Check browser console for errors
- Verify `AI_PROVIDER` is set correctly (no typos)
- Make sure you restarted the dev server
- Check that `OPENAI_API_KEY` is valid and starts with `sk-`

### Both providers available but wrong one selected
- Explicitly set `AI_PROVIDER=openai` or `AI_PROVIDER=gemini` to force a choice
- Remove the API key you don't want to use

