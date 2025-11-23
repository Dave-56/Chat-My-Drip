import React, { useState, useEffect } from 'react';
import { Landing } from './components/Landing';
import { Onboarding } from './components/Onboarding';
import { ImageUpload } from './components/ImageUpload';
import { Loading } from './components/Loading';
import { Results } from './components/Results';
import { ChatInterface } from './components/ChatInterface';
import { MyFits } from './components/MyFits';
import { SavedOutfitView } from './components/SavedOutfitView';
import { analyzeFit as analyzeFitGemini, createStylistChat as createStylistChatGemini } from './services/geminiService';
import { analyzeFit as analyzeFitOpenAI, createStylistChat as createStylistChatOpenAI } from './services/openaiService';
import { AppState, UploadedImage, AnalysisResult, SavedOutfit, ChatSession } from './types';
import { getSavedOutfit, saveOutfit, getSavedOutfits } from './utils/supabaseStorage';
import { supabase } from './utils/supabaseClient';
import { getUserLocation, getClimateContext } from './utils/climateUtils';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import { isNetworkError, RetryableError } from './utils/errorRecovery';

// Service selector with priority:
// 1. If AI_PROVIDER is explicitly set, use that
// 2. If only one API key is available, use that service
// 3. If both are available and no preference, default to Gemini (original)
const hasGeminiKey = process.env.API_KEY && 
                     process.env.API_KEY !== 'undefined' && 
                     !process.env.API_KEY.includes('your_api_key');
const hasOpenAIKey = process.env.OPENAI_API_KEY && 
                     process.env.OPENAI_API_KEY !== 'undefined' && 
                     !process.env.OPENAI_API_KEY.includes('your_api_key');
const explicitProvider = process.env.AI_PROVIDER?.toLowerCase();

let useOpenAI: boolean;
if (explicitProvider === 'openai' || explicitProvider === 'chatgpt') {
  useOpenAI = true;
} else if (explicitProvider === 'gemini') {
  useOpenAI = false;
} else if (hasOpenAIKey && !hasGeminiKey) {
  useOpenAI = true; // Only OpenAI key available
} else if (hasGeminiKey && !hasOpenAIKey) {
  useOpenAI = false; // Only Gemini key available
} else if (hasOpenAIKey && hasGeminiKey) {
  useOpenAI = false; // Both available, default to Gemini (original)
} else {
  useOpenAI = false; // No keys, default to Gemini (will error but consistent)
}

const analyzeFit = useOpenAI ? analyzeFitOpenAI : analyzeFitGemini;
const createStylistChat = useOpenAI ? createStylistChatOpenAI : createStylistChatGemini;

const App: React.FC = () => {
  const [view, setView] = useState<AppState>(AppState.LANDING);
  const [image, setImage] = useState<UploadedImage | null>(null);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatSession, setChatSession] = useState<ChatSession | null>(null);
  const [savedOutfit, setSavedOutfit] = useState<SavedOutfit | null>(null);
  const [previousView, setPreviousView] = useState<AppState | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null); // null = checking


  // Check auth status on mount
  useEffect(() => {
    const checkAuth = async () => {
      // Skip if there's a hash (shareable link will handle it)
      if (window.location.hash.startsWith('#/fit/')) {
        return;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const authenticated = !!session;
      setIsAuthenticated(authenticated);
      
      if (authenticated && view === AppState.LANDING) {
        // Check if user has location set
        const location = await getUserLocation();
        if (!location) {
          setView(AppState.ONBOARDING);
        } else {
          setView(AppState.PREVIEW);
        }
      }
    };

    checkAuth();

    // Listen for auth changes (e.g., after OAuth redirect or logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const authenticated = !!session;
      setIsAuthenticated(authenticated);
      
      if (authenticated) {
        // Check if user has location set
        const location = await getUserLocation();
        if (view === AppState.LANDING) {
          if (!location) {
            setView(AppState.ONBOARDING);
          } else {
            setView(AppState.PREVIEW);
          }
        }
      } else {
        // User signed out - clear state and go to landing
        setImage(null);
        setResult(null);
        setChatSession(null);
        setSavedOutfit(null);
        setView(AppState.LANDING);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleAuthSuccess = async () => {
    setIsAuthenticated(true);
    // After sign-in, check if location is set
    const location = await getUserLocation();
    if (!location) {
      setView(AppState.ONBOARDING);
    } else {
      setView(AppState.PREVIEW);
    }
  };

  const handleOnboardingComplete = () => {
    setView(AppState.PREVIEW);
  };

  const handleStart = () => {
    setView(AppState.PREVIEW);
    setError(null);
  };

  const handleImageSelected = async (selectedImage: UploadedImage, isRetry = false) => {
    if (!isRetry) {
      setImage(selectedImage);
      setView(AppState.ANALYZING);
      setError(null);
      setRetryCount(0);
    } else {
      setIsRetrying(true);
      setRetryCount(prev => prev + 1);
    }

    try {
      // Get user location and derive climate context
      const location = await getUserLocation();
      const climateContext = location ? getClimateContext(location) : undefined;
      
      const analysis = await analyzeFit(selectedImage.base64, selectedImage.mimeType, climateContext);
      
      // Set result and view FIRST - don't wait for save
      setResult(analysis);
      setIsRetrying(false);
      setRetryCount(0);
      setView(AppState.RESULT);
      
      // Auto-save outfit in background (don't block UI)
      saveOutfit(selectedImage, analysis, analysis.score >= 8 
        ? `Fire Fit - ${analysis.vibe}`
        : `${analysis.vibe} Fit`)
        .catch(() => {
          // Silently fail - user can still see results
        });
    } catch (err) {
      setIsRetrying(false);
      
      let errorMessage = "Failed to analyze image. Make sure your API key is valid and the image is clear.";
      
      if (err instanceof RetryableError) {
        errorMessage = err.message || "Network error. Please check your connection and try again.";
      } else if (isNetworkError(err)) {
        errorMessage = "Network error. Please check your connection and try again.";
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
      setView(AppState.ERROR);
    }
  };

  const handleRetry = () => {
    if (image) {
      handleImageSelected(image, true);
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
    const loadOutfit = async () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/fit/')) {
        const outfitId = hash.replace('#/fit/', '');
        const outfit = await getSavedOutfit(outfitId);
        if (outfit) {
          setSavedOutfit(outfit);
          setImage(outfit.image);
          setResult(outfit.analysis);
          setView(AppState.SAVED_OUTFIT);
        }
        // Clean up hash after loading
        window.history.replaceState(null, '', window.location.pathname);
      }
    };
    loadOutfit();
  }, []);

  const handleViewMyFits = () => {
    setSavedOutfit(null); // Clear saved outfit when going to My Fits
    setView(AppState.MY_FITS);
  };

  const handleViewSavedOutfit = async (outfitId: string) => {
    const outfit = await getSavedOutfit(outfitId);
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
          {view === AppState.LANDING && (
            <Landing 
              onStart={handleStart}
              onViewMyFits={handleViewMyFits}
              isAuthenticated={isAuthenticated === true}
            />
          )}
          
          {view === AppState.ONBOARDING && (
            <Onboarding onComplete={handleOnboardingComplete} />
          )}
          
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
          
          {/* Debug: Log when RESULT view should show but doesn't */}
          {view === AppState.RESULT && (!image || !result) && (
            console.error('[VIEW DEBUG] RESULT view requested but missing data:', {
              view,
              hasImage: !!image,
              hasResult: !!result,
              imageType: image ? typeof image : 'null',
              resultType: result ? typeof result : 'null'
            }) || null
          )}

          {view === AppState.MY_FITS && (
            <MyFits 
              onBack={() => setView(AppState.LANDING)}
              onViewOutfit={handleViewSavedOutfit}
              onAccountDeleted={() => {
                // Account deletion will sign out the user
                // The auth state change listener will handle redirecting to landing
                setView(AppState.LANDING);
              }}
            />
          )}

          {view === AppState.SAVED_OUTFIT && savedOutfit && image && result && (
            <SavedOutfitView
              outfit={savedOutfit}
              image={image}
              data={result}
              onBack={() => setView(AppState.MY_FITS)}
              onChat={handleOpenChat}
              onDelete={() => setView(AppState.MY_FITS)}
            />
          )}

          {view === AppState.ERROR && (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-slide-up">
              <AlertTriangle className="text-red-500 mb-4" size={48} />
              <h2 className="text-2xl font-display font-bold text-white mb-2">OOF! ERROR.</h2>
              <p className="text-gray-400 mb-2 px-4">{error}</p>
              {retryCount > 0 && (
                <p className="text-gray-500 text-sm mb-4">Retry attempt {retryCount}/3</p>
              )}
              <div className="flex flex-col gap-3 w-full max-w-xs">
                <button 
                  onClick={handleRetry}
                  disabled={isRetrying || !image}
                  className="bg-drip-accent text-white font-bold px-8 py-3 rounded-full font-display hover:bg-drip-accent/80 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {isRetrying ? (
                    <>
                      <RefreshCw className="animate-spin" size={20} />
                      RETRYING...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={20} />
                      RETRY
                    </>
                  )}
                </button>
                <button 
                  onClick={handleReset}
                  className="bg-drip-gray text-white font-bold px-8 py-3 rounded-full font-display hover:bg-drip-gray/80 transition-colors"
                >
                  START OVER
                </button>
              </div>
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