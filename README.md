<!-- <div align="center">
<img width="1200" height="475" alt="ChatMyDrip Banner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div> -->

# ChatMyDrip

AI-powered fashion analysis app that rates your outfits, provides styling feedback, and helps you build your style archive.

## Features

- 📸 **Upload Outfits** - Snap a mirror selfie and get instant AI analysis
- 🎯 **Detailed Feedback** - Get scores, vibe analysis, hits, misses, and styling suggestions
- 💬 **Chat with AI Stylist** - Ask questions and get personalized styling advice
- 📚 **Save Your Fits** - Build your style archive with saved outfits
- 📊 **Style Stats** - Track your fashion journey with analytics
- 🔐 **Google Sign-In** - Secure authentication with Supabase
- 📱 **Mobile-First** - Beautiful, responsive design optimized for mobile

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **AI**: Google Gemini or OpenAI (ChatGPT)
- **Backend**: Supabase (PostgreSQL + Auth + Storage)
- **Deployment**: Vercel

## Prerequisites

- Node.js (v18 or higher)
- npm or yarn
- Supabase account (free tier works)
- Google Cloud Console account (for OAuth)
- Gemini API key OR OpenAI API key

## Quick Start

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd chatmydrip
npm install
```

### 2. Set Up Supabase

Follow the detailed guide in [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) to:
- Create a Supabase project
- Set up Google OAuth
- Create database tables
- Get your API keys

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Supabase (required)
VITE_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# AI Provider (choose one)
# For Gemini:
API_KEY=your_gemini_api_key_here
# OR
GEMINI_API_KEY=your_gemini_api_key_here

# For OpenAI/ChatGPT:
AI_PROVIDER=openai
OPENAI_API_KEY=sk-your-openai-api-key-here
```

**Note**: See [`AI_PROVIDER_SETUP.md`](./AI_PROVIDER_SETUP.md) for detailed instructions on switching between AI providers.

### 4. Run Locally

```bash
npm run dev
```

The app will be available at `http://localhost:3000`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import your repository in Vercel
3. Add environment variables in Vercel project settings:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `API_KEY` or `GEMINI_API_KEY` (for Gemini)
   - `OPENAI_API_KEY` (for OpenAI, optional)
   - `AI_PROVIDER` (optional: `openai` or `gemini`)
4. Deploy!

The app will automatically deploy on every push to your main branch.

## Project Structure

```
chatmydrip/
├── components/          # React components
│   ├── Auth.tsx        # Authentication component
│   ├── ChatInterface.tsx
│   ├── ImageUpload.tsx
│   ├── Landing.tsx
│   ├── MyFits.tsx      # Saved outfits view
│   └── Results.tsx
├── services/           # AI service integrations
│   ├── geminiService.ts
│   └── openaiService.ts
├── utils/              # Utility functions
│   ├── supabaseClient.ts
│   ├── supabaseStorage.ts
│   └── ...
├── App.tsx             # Main app component
└── types.ts            # TypeScript type definitions
```

## Documentation

- [`SUPABASE_SETUP.md`](./SUPABASE_SETUP.md) - Complete Supabase setup guide
- [`AI_PROVIDER_SETUP.md`](./AI_PROVIDER_SETUP.md) - How to switch between Gemini and ChatGPT

## Features in Detail

### Outfit Analysis
- **Score**: 1-10 rating of your outfit
- **Vibe**: The aesthetic/subculture your outfit represents
- **Hits**: What's working well
- **Misses**: What could be improved
- **Suggestions**: Specific items to complete or fix the look
- **Verdict**: A punchy one-sentence summary

### Saved Outfits
- Automatically saves every analyzed outfit
- Organize outfits into collections
- View your style stats and trends
- Share outfits with shareable links

### AI Chat
- Chat with your AI stylist about any outfit
- Get personalized styling advice
- Ask questions about fashion, brands, and trends

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

MIT

## Support

For issues and questions, please open an issue on GitHub.
