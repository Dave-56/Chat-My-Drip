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
- Delete individual outfits or entire account

### AI Chat
- Chat with your AI stylist about any outfit
- Get personalized styling advice
- Ask questions about fashion, brands, and trends

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
