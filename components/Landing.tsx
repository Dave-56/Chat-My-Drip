import React, { useState, useEffect } from 'react';
import { Camera, Sparkles, LogOut, Loader2, FolderOpen } from 'lucide-react';
import { supabase } from '../utils/supabaseClient';
import { getSavedOutfits } from '../utils/supabaseStorage';

interface LandingProps {
  onStart: () => void;
  onViewMyFits: () => void;
  isAuthenticated: boolean;
}

export const Landing: React.FC<LandingProps> = ({ onStart, onViewMyFits, isAuthenticated }) => {
  const [signingIn, setSigningIn] = useState(false);
  const [outfitCount, setOutfitCount] = useState(0);

  useEffect(() => {
    const loadOutfitCount = async () => {
      if (isAuthenticated) {
        const outfits = await getSavedOutfits();
        setOutfitCount(outfits.length);
      }
    };
    loadOutfitCount();
  }, [isAuthenticated]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const handleCheckMyDrip = async () => {
    // If not authenticated, trigger Google OAuth
    if (!isAuthenticated) {
      try {
        setSigningIn(true);
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: {
            redirectTo: window.location.origin,
          },
        });

        if (error) {
          console.error('Error signing in:', error);
          alert('Failed to sign in. Please try again.');
          setSigningIn(false);
        }
      } catch (error) {
        console.error('Error signing in:', error);
        alert('Failed to sign in. Please try again.');
        setSigningIn(false);
      }
    } else {
      // If authenticated, go to upload screen
      onStart();
    }
  };

  return (
    <div className="flex flex-col h-full w-full animate-slide-up overflow-y-auto">
      <div className="flex-1 p-6 flex flex-col justify-between">
        {/* Logout button in top right (only show if authenticated) */}
        {isAuthenticated && (
          <div className="flex justify-end mb-4">
            <button
              onClick={handleLogout}
              className="text-gray-400 hover:text-white transition-colors flex items-center gap-2 text-sm"
              title="Sign out"
            >
              <LogOut size={16} />
              Sign Out
            </button>
          </div>
        )}
        
        <div className="mt-10">
          <div className="inline-block bg-drip-lime text-black font-bold px-3 py-1 uppercase text-sm tracking-widest transform -rotate-2 mb-4">
            AI Stylist
          </div>
          <h1 className="text-5xl md:text-6xl font-display font-bold leading-[0.9] mb-4 text-white">
            CHAT<br />
            <span className="text-drip-accent">MY</span><br />
            DRIP
          </h1>
          <p className="text-gray-400 text-base md:text-lg max-w-xs">
            Upload your fit. Get roasted, rated, and styled by AI. Save your fits and sync across devices.
          </p>
        </div>

        <div className="flex flex-col gap-4 mb-8">
          <div className="flex items-center gap-4 p-4 bg-drip-dark rounded-xl border border-drip-gray/50">
            <div className="bg-drip-gray p-3 rounded-full text-drip-lime">
              <Camera size={24} />
            </div>
            <div>
              <h3 className="font-bold text-white">Snap a Mirror Selfie</h3>
              <p className="text-sm text-gray-400">Make sure we can see the full fit.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4 p-4 bg-drip-dark rounded-xl border border-drip-gray/50">
            <div className="bg-drip-gray p-3 rounded-full text-drip-accent">
              <Sparkles size={24} />
            </div>
            <div>
              <h3 className="font-bold text-white">Get Instant Analysis</h3>
              <p className="text-sm text-gray-400">Detailed breakdown + aesthetic check.</p>
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={handleCheckMyDrip}
            disabled={signingIn}
            className="w-full bg-white text-black font-bold font-display text-lg md:text-xl py-4 md:py-5 rounded-full active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {signingIn ? (
              <>
                <Loader2 className="animate-spin" size={20} />
                Signing in...
              </>
            ) : (
              'CHECK MY DRIP'
            )}
          </button>
          
          {isAuthenticated && outfitCount > 0 && (
            <button
              onClick={onViewMyFits}
              className="w-full bg-drip-dark text-white font-bold font-display text-base py-3 rounded-full border border-drip-gray/50 active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              <FolderOpen size={20} />
              MY FITS ({outfitCount})
            </button>
          )}
        </div>
      </div>
    </div>
  );
};