import React, { useState } from 'react';
import { Landing } from './components/Landing';
import { ImageUpload } from './components/ImageUpload';
import { Loading } from './components/Loading';
import { Results } from './components/Results';
import { ChatInterface } from './components/ChatInterface';
import { analyzeFit, createStylistChat } from './services/geminiService';
import { AppState, UploadedImage, AnalysisResult } from './types';
import { AlertTriangle } from 'lucide-react';
import { Chat } from "@google/genai";

const App: React.FC = () => {
  const [view, setView] = useState<AppState>(AppState.LANDING);
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatSession, setChatSession] = useState<Chat | null>(null);

  const handleStart = () => {
    setView(AppState.PREVIEW);
    setError(null);
  };

  const handleImageSelected = async (selectedImage: UploadedImage) => {
    setImage(selectedImage);
    setView(AppState.ANALYZING);
    setError(null);

    try {
      const analysis = await analyzeFit(selectedImage.base64, selectedImage.mimeType);
      setResult(analysis);
      setView(AppState.RESULT);
    } catch (err) {
      console.error(err);
      setError("Failed to analyze image. Make sure your API key is valid and the image is clear.");
      setView(AppState.ERROR);
    }
  };

  const handleOpenChat = () => {
    if (image && result) {
       // Only create a new session if one doesn't exist for this current analysis
       if (!chatSession) {
         const chat = createStylistChat(image.base64, image.mimeType, result);
         setChatSession(chat);
       }
       setView(AppState.CHAT);
    }
  };

  const handleBackFromChat = () => {
     setView(AppState.RESULT);
  };

  const handleReset = () => {
    setImage(null);
    setResult(null);
    setChatSession(null);
    setView(AppState.LANDING);
    setError(null);
  };

  const handleCancelUpload = () => {
    setView(AppState.LANDING);
  };

  return (
    <div className="h-[100dvh] w-full bg-[#050505] text-white overflow-hidden flex justify-center items-center">
      {/* App Container - Constrained to mobile width */}
      <div className="w-full max-w-md h-full bg-drip-black relative shadow-2xl flex flex-col overflow-hidden border-x border-white/5">
        
        {/* Background Elements (Inside the mobile frame) */}
        <div className="absolute top-[-20%] right-[-10%] w-[300px] h-[300px] bg-drip-accent/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[250px] h-[250px] bg-drip-lime/10 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Main Content Flow */}
        <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
          {view === AppState.LANDING && <Landing onStart={handleStart} />}
          
          {view === AppState.PREVIEW && (
            <ImageUpload 
              onImageSelected={handleImageSelected} 
              onCancel={handleCancelUpload} 
            />
          )}
          
          {view === AppState.ANALYZING && image && (
            <Loading image={image} />
          )}
          
          {view === AppState.RESULT && image && result && (
            <Results 
              image={image} 
              data={result} 
              onReset={handleReset} 
              onChat={handleOpenChat}
            />
          )}

          {view === AppState.ERROR && (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-slide-up">
              <AlertTriangle className="text-red-500 mb-4" size={48} />
              <h2 className="text-2xl font-display font-bold text-white mb-2">OOF! ERROR.</h2>
              <p className="text-gray-400 mb-6">{error}</p>
              <button 
                onClick={handleReset}
                className="bg-white text-black font-bold px-8 py-3 rounded-full font-display hover:bg-gray-200 transition-colors"
              >
                TRY AGAIN
              </button>
            </div>
          )}
        </main>

        {/* Full Screen Overlays (Outside Main Flow) */}
        {view === AppState.CHAT && chatSession && image && (
          <div className="absolute inset-0 z-50 bg-drip-black">
             <ChatInterface 
                chatSession={chatSession}
                image={image}
                onBack={handleBackFromChat}
             />
          </div>
        )}
      </div>
    </div>
  );
};

export default App;