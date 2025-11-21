import React, { useState, useEffect } from 'react';
import { Landing } from './components/Landing';
import { ImageUpload } from './components/ImageUpload';
import { Loading } from './components/Loading';
import { Results } from './components/Results';
import { ChatInterface } from './components/ChatInterface';
import { MyFits } from './components/MyFits';
import { SavedOutfitView } from './components/SavedOutfitView';
import { analyzeFit, createStylistChat } from './services/geminiService';
import { AppState, UploadedImage, AnalysisResult, SavedOutfit } from './types';
import { getSavedOutfit, saveOutfit } from './utils/outfitStorage';
import { AlertTriangle } from 'lucide-react';
import { Chat } from "@google/genai";

const App: React.FC = () => {
  const [view, setView] = useState<AppState>(AppState.LANDING);
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [savedOutfit, setSavedOutfit] = useState<SavedOutfit | null>(null);
  const [previousView, setPreviousView] = useState<AppState | null>(null);

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
      
      // Auto-save outfit when results are ready
      let savedOutfitId: string | null = null;
      try {
        const savedOutfit = await saveOutfit(selectedImage, analysis);
        savedOutfitId = savedOutfit.id;
      } catch (saveError) {
        // Log but don't block UI if save fails
        console.warn('Failed to auto-save outfit:', saveError);
      }
      
      setView(AppState.RESULT);
      // Store outfit ID for sharing (we'll pass it to Results)
      if (savedOutfitId) {
        // We'll get it from the most recent saved outfit in Results component
      }
    } catch (err) {
      console.error(err);
      setError("Failed to analyze image. Make sure your API key is valid and the image is clear.");
      setView(AppState.ERROR);
    }
  };

  const handleOpenChat = () => {
    if (image && result) {
       // Store current view before going to chat
       setPreviousView(view);
       // Always create a new session for the current analysis
       const chat = createStylistChat(image.base64, image.mimeType, result);
       setChatSession(chat);
       // Reset scroll position before switching to chat
       window.scrollTo(0, 0);
       setView(AppState.CHAT);
    }
  };

  const handleBackFromChat = () => {
     // Return to previous view (either RESULT or SAVED_OUTFIT)
     if (previousView) {
       setView(previousView);
       setPreviousView(null);
     } else {
       // Fallback
       if (savedOutfit) {
         setView(AppState.SAVED_OUTFIT);
       } else {
         setView(AppState.RESULT);
       }
     }
  };

  const handleReset = () => {
    setImage(null);
    setResult(null);
    setChatSession(null);
    setView(AppState.PREVIEW);
    setError(null);
  };

  const handleGoHome = () => {
    setImage(null);
    setResult(null);
    setChatSession(null);
    setSavedOutfit(null);
    setView(AppState.LANDING);
    setError(null);
  };

  const handleCancelUpload = () => {
    setView(AppState.LANDING);
  };

  // Handle shareable links (hash-based routing)
  useEffect(() => {
    const hash = window.location.hash;
    if (hash.startsWith('#/fit/')) {
      const outfitId = hash.replace('#/fit/', '');
      const outfit = getSavedOutfit(outfitId);
      if (outfit) {
        setSavedOutfit(outfit);
        setImage(outfit.image);
        setResult(outfit.analysis);
        setView(AppState.SAVED_OUTFIT);
      }
      // Clean up hash after loading
      window.history.replaceState(null, '', window.location.pathname);
    }
  }, []);

  const handleViewMyFits = () => {
    setSavedOutfit(null); // Clear saved outfit when going to My Fits
    setView(AppState.MY_FITS);
  };

  const handleViewSavedOutfit = (outfitId: string) => {
    const outfit = getSavedOutfit(outfitId);
    if (outfit) {
      setSavedOutfit(outfit);
      setImage(outfit.image);
      setResult(outfit.analysis);
      setView(AppState.SAVED_OUTFIT);
    } else {
      // Outfit not found, go to landing
      setView(AppState.LANDING);
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-[#050505] text-white overflow-hidden flex justify-center items-center sm:p-4">
      {/* App Container - Mobile optimized: full width on mobile, constrained on larger screens */}
      <div className="w-full sm:max-w-sm h-full bg-drip-black relative flex flex-col overflow-hidden sm:rounded-lg sm:shadow-2xl">
        
        {/* Background Elements (Inside the mobile frame) */}
        <div className="absolute top-[-20%] right-[-10%] w-[200px] h-[200px] sm:w-[300px] sm:h-[300px] bg-drip-accent/20 rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[150px] h-[150px] sm:w-[250px] sm:h-[250px] bg-drip-lime/10 rounded-full blur-[80px] pointer-events-none"></div>

        {/* Main Content Flow */}
        <main className="flex-1 relative z-10 overflow-hidden flex flex-col">
          {view === AppState.LANDING && <Landing onStart={handleStart} onViewMyFits={handleViewMyFits} />}
          
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
              onGoHome={handleGoHome}
            />
          )}

          {view === AppState.MY_FITS && (
            <MyFits 
              onBack={() => setView(AppState.LANDING)}
              onViewOutfit={handleViewSavedOutfit}
            />
          )}

          {view === AppState.SAVED_OUTFIT && savedOutfit && image && result && (
            <SavedOutfitView
              outfit={savedOutfit}
              image={image}
              data={result}
              onBack={() => setView(AppState.MY_FITS)}
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

          {/* Chat Interface - Relative to container */}
          {view === AppState.CHAT && chatSession && image && (
            <div className="absolute inset-0 bg-drip-black w-full h-full z-50 overflow-hidden">
               <ChatInterface 
                  chatSession={chatSession}
                  image={image}
                  onBack={handleBackFromChat}
               />
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default App;