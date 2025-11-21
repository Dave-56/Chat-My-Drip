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

## Step 2: Set Up Google OAuth

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
     https://YOUR_PROJECT_REF.supabase.co/auth/v1/callback
     ```
     (Find YOUR_PROJECT_REF in your Supabase project settings → API)
   - Copy the **Client ID** and **Client Secret**
4. Back in Supabase, paste:
   - **Client ID (for OAuth)**
   - **Client Secret (for OAuth)**
5. Click **Save**

## Step 3: Create Database Tables

1. In Supabase dashboard, go to **SQL Editor**
2. Click **New Query**
3. Copy and paste the entire contents of `supabase-schema.sql`
4. Click **Run** (or press Cmd/Ctrl + Enter)
5. You should see "Success. No rows returned"

## Step 4: Get Your API Keys

1. In Supabase dashboard, go to **Settings** → **API**
2. Copy these values:
   - **Project URL** (this is your `VITE_SUPABASE_URL`)
   - **anon public** key (this is your `VITE_SUPABASE_ANON_KEY`)

## Step 5: Add Environment Variables

1. Create/update `.env.local` file in your project root:
   ```env
   VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
   VITE_SUPABASE_ANON_KEY=your_anon_key_here
   ```

2. **Important**: Add `.env.local` to `.gitignore` if not already there

## Step 6: Test the Setup

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

## Next Steps

After setup is complete, the app will:
- Require Google login to use
- Save all outfits to Supabase (not localStorage)
- Sync across devices
- Have unlimited storage (no localStorage limits)

