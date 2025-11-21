# Supabase Setup Guide

Follow these steps to set up Supabase for ChatMyDrip:

## Step 1: Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: `chatmydrip` (or your choice)
   - **Database Password**: Create a strong password (save it!)
   - **Region**: Choose closest to your users
4. Click "Create new project" and wait for it to initialize (~2 minutes)

## Step 2: Set Up Custom Domain (If Using One)

If you've purchased a custom domain for Supabase:

1. In Supabase dashboard, go to **Settings** → **Custom Domain**
2. Add your custom domain (e.g., `supabase.getsensei.dev` or `api.getsensei.dev`)
3. Follow Supabase's DNS instructions to add the required CNAME records
4. Wait for DNS propagation (can take a few minutes to hours)
5. Once verified, your Supabase URL will be your custom domain instead of `*.supabase.co`

**Note**: After setting up the custom domain, update your `VITE_SUPABASE_URL` environment variable to use the custom domain.

## Step 3: Set Up Google OAuth

1. In your Supabase project dashboard, go to **Authentication** → **Providers**
2. Find **Google** and click to enable it
3. You'll need Google OAuth credentials:
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project (or use existing)
   - Enable **Google+ API**
   - Go to **Credentials** → **Create Credentials** → **OAuth 2.0 Client ID**
   - Application type: **Web application**
   - Authorized redirect URIs: Add your Supabase redirect URL:
     ```
     https://YOUR_CUSTOM_DOMAIN/auth/v1/callback
     ```
     OR if using default Supabase domain:
     ```
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
     (Use your custom domain if configured, otherwise use the default Supabase domain from project settings → API)
   - Copy the **Client ID** and **Client Secret**
4. Back in Supabase, paste:
   - **Client ID (for OAuth)**
   - **Client Secret (for OAuth)**
5. Click **Save**

### Important: Configure Site URL and Redirect URLs

1. In Supabase dashboard, go to **Authentication** → **URL Configuration**
2. Set **Site URL** to your production URL:
   ```
   https://www.getsensei.dev/chatmydrip
   ```
3. Add these to **Redirect URLs** (comma-separated, one per line):
   ```
   http://localhost:5173
   http://localhost:3000
   https://www.getsensei.dev/chatmydrip
   https://getsensei.dev/chatmydrip
   ```
   - `http://localhost:5173` - For Vite dev server (default port)
   - `http://localhost:3000` - If you use a different port
   - `https://www.getsensei.dev/chatmydrip` - Production URL (with www)
   - `https://getsensei.dev/chatmydrip` - Production URL (without www)
4. Click **Save**

**Note**: 
- The **Site URL** is where users will be redirected after sign-in
- **Redirect URLs** must include all URLs where authentication callbacks can occur
- Without localhost in the redirect URLs, sign out may not work properly on localhost!

## Step 4: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

## Step 5: Get Your API Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (this is your `VITE_SUPABASE_URL` - use your custom domain if configured, otherwise the default `*.supabase.co` URL)
   - **anon public** key (this is your `VITE_SUPABASE_ANON_KEY`)

**Important**: If you're using a custom domain, make sure to use the custom domain URL (e.g., `https://supabase.getsensei.dev`) instead of the default Supabase URL.

## Step 6: Add Environment Variables

1. Create/update `.env.local` file in your project root:
   ```env
   # Supabase (required)
   # Use your custom domain if configured, otherwise use the default Supabase URL
   VITE_SUPABASE_URL=https://YOUR_CUSTOM_DOMAIN
   # OR if using default: https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here

   # AI Provider (optional - defaults to Gemini)
   # For Gemini:
   API_KEY=your_gemini_api_key_here
   # OR
   GEMINI_API_KEY=your_gemini_api_key_here

   # For ChatGPT/OpenAI:
   AI_PROVIDER=openai
   OPENAI_API_KEY=sk-your-openai-api-key-here
   ```

2. **Important**: Add `.env.local` to `.gitignore` if not already there

**Note**: See `AI_PROVIDER_SETUP.md` for detailed instructions on switching between AI providers.

## Step 7: Test the Setup

1. Run `npm run dev`
2. You should see the Google sign-in button
3. Click it and complete the OAuth flow
4. After signing in, you should be able to save outfits!

## Troubleshooting

### "Supabase credentials not found"
- Make sure `.env.local` exists and has both variables
- Restart your dev server after adding env variables
- Check that variable names start with `VITE_`

### "Failed to sign in"
- Check that Google OAuth is enabled in Supabase
- Verify redirect URI matches exactly in Google Cloud Console
- Check browser console for detailed error messages

### Database errors
- Make sure you ran the SQL schema file
- Check that RLS policies are enabled (they should be from the schema)
- Verify tables exist in **Table Editor** in Supabase dashboard

### "Sign out not working on localhost"
- **This is the most common issue!** Make sure you've added localhost to Supabase redirect URLs:
  1. Go to **Authentication** → **URL Configuration** in Supabase dashboard
  2. Add `http://localhost:5173` (or your dev server port) to **Redirect URLs**
  3. Save and try signing out again
- If it still doesn't work, check browser console for errors
- The app will fall back to reloading the page if sign out fails

## Next Steps

After setup is complete, the app will:
- Require Google login to use
- Save all outfits to Supabase (not localStorage)
- Sync across devices
- Have unlimited storage (no localStorage limits)

