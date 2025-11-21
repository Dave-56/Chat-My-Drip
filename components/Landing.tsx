import React from 'react';
import { Camera, Sparkles } from 'lucide-react';

interface LandingProps {
  onStart: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onStart }) => {
  return (
    <div className="flex flex-col h-full w-full animate-slide-up overflow-y-auto">
      <div className="flex-1 p-6 flex flex-col justify-between">
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
            Upload your fit. Get roasted, rated, and styled by AI. No login. No cap.
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

        <button
          onClick={onStart}
          className="w-full bg-white text-black font-bold font-display text-lg md:text-xl py-4 md:py-5 rounded-full active:scale-95 transition-transform shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)]"
        >
          CHECK MY DRIP
        </button>
      </div>
    </div>
  );
};