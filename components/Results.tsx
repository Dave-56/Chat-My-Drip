import React, { useState } from 'react';
import { Share2, RefreshCw, AlertCircle, CheckCircle, ShoppingBag, MessageCircle, Home } from 'lucide-react';
import { AnalysisResult, UploadedImage } from '../types';
import { getShareableLink, getSavedOutfits } from '../utils/supabaseStorage';
import { Toast } from './Toast';
import { ShareMenu } from './ShareMenu';
import { useSwipeGesture } from '../utils/useSwipeGesture';

interface ResultsProps {
  image: UploadedImage;
  data: AnalysisResult;
  onReset: () => void;
  onChat: () => void;
  onGoHome?: () => void; // Optional function to go to landing page
}

// Helper to convert base64 data URL to File object
const dataURLtoFile = (dataurl: string, filename: string): File => {
  const arr = dataurl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/png';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);
  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }
  return new File([u8arr], filename, { type: mime });
};

export const Results: React.FC<ResultsProps> = ({ image, data, onReset, onChat, onGoHome }) => {
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [shareLink, setShareLink] = useState<string | null>(null);

  // Load shareable link on mount
  React.useEffect(() => {
    const loadShareLink = async () => {
      const outfits = await getSavedOutfits();
      if (outfits.length > 0) {
        // Find the most recent outfit that matches this analysis
        const recentOutfit = outfits.find(o => 
          o.analysis.score === data.score && 
          o.analysis.vibe === data.vibe
        ) || outfits[0]; // Fallback to most recent
        setShareLink(getShareableLink(recentOutfit.id));
      }
    };
    loadShareLink();
  }, [data]);

  // Swipe left to go back/home
  const { ref: swipeRef, swipeProgress, isSwiping } = useSwipeGesture({
    onSwipeLeft: () => {
      if (onGoHome) {
        onGoHome();
      } else {
        onReset();
      }
    },
    threshold: 80,
    preventScroll: true,
  });

  const scoreColor = data.score >= 8 ? 'text-drip-lime' : data.score >= 5 ? 'text-drip-accent' : 'text-red-500';
  const scoreBg = data.score >= 8 ? 'bg-drip-lime/10' : data.score >= 5 ? 'bg-drip-accent/10' : 'bg-red-500/10';

  const shareText = `I got a ${data.score}/10 on ChatMyDrip. "${data.verdict}" 🤖👠`;

  const handleCopyLink = async () => {
    if (!shareLink) {
      setToast({ message: 'Outfit not saved yet. Link will be available after saving.', type: 'error' });
      return;
    }

    try {
      await navigator.clipboard.writeText(shareLink);
      setToast({ message: 'Link copied to clipboard!', type: 'success' });
    } catch (error) {
      setToast({ message: 'Failed to copy link', type: 'error' });
    }
  };

  const handleShare = async () => {
    setShowShareMenu(false);
    await handleCopyLink();
  };

  const handleTwitterShare = () => {
    setShowShareMenu(false);
    const text = encodeURIComponent(`${shareText}\n\nCheck my fit:`);
    const url = encodeURIComponent(shareLink || 'https://chatmydrip.vercel.app');
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleShareImageCardClick = async () => {
    setShowShareMenu(false);
    await handleShareImageCard();
  };

  return (
    <>
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
      <div 
        ref={swipeRef as React.RefObject<HTMLDivElement>}
        className="flex flex-col h-full animate-slide-up overflow-y-auto no-scrollbar overscroll-contain relative"
        style={{
          transform: isSwiping ? `translateX(${swipeProgress * 20}px)` : 'translateX(0)',
          transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
        }}
      >
      {/* Header Image & Score Overlay */}
      <div className="relative w-full aspect-square shrink-0">
        <img 
          src={image.previewUrl} 
          alt="Your Fit" 
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-drip-black/20 to-drip-black"></div>
        
        <div className="absolute bottom-0 left-0 right-0 p-6">
          <div className="flex justify-between items-end">
            <div>
              <p className="text-gray-300 text-sm uppercase tracking-widest mb-1 font-bold">VIBE CHECK</p>
              <h2 className="text-3xl font-display font-bold text-white leading-none uppercase">{data.vibe}</h2>
            </div>
            <div className={`flex flex-col items-center justify-center p-4 rounded-xl backdrop-blur-md border border-white/10 ${scoreBg}`}>
              <span className={`text-5xl font-display font-bold ${scoreColor}`}>{data.score}</span>
              <span className="text-xs font-bold text-white uppercase">out of 10</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Cards */}
      <div className="px-6 -mt-4 relative z-10 space-y-4 pb-6">
        
        {/* Verdict Card */}
        <div className="bg-drip-dark p-5 rounded-xl border border-drip-gray shadow-lg">
          <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-2">THE VERDICT</p>
          <p className="text-xl font-bold text-white italic">"{data.verdict}"</p>
        </div>

        {/* Chat CTA */}
        <button
          onClick={onChat}
          className="w-full bg-gradient-to-r from-drip-accent to-purple-600 text-white p-4 rounded-xl font-bold font-display flex items-center justify-between group hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20"
        >
          <div className="flex items-center gap-3">
             <div className="bg-white/20 p-2 rounded-full">
                <MessageCircle size={20} />
             </div>
             <div className="text-left">
                <p className="text-sm font-normal opacity-90">Have questions?</p>
                <p className="text-lg leading-none">ASK DRIP</p>
             </div>
          </div>
          <span className="text-xl group-hover:translate-x-1 transition-transform">→</span>
        </button>


        {/* Hits */}
        <div className="bg-drip-dark p-5 rounded-xl border border-drip-gray">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle className="text-drip-lime" size={20} />
            <h3 className="font-bold text-white uppercase">What Works</h3>
          </div>
          <ul className="space-y-2">
            {data.hits.map((hit, i) => (
              <li key={i} className="text-gray-300 text-sm pl-2 border-l-2 border-drip-lime/30">{hit}</li>
            ))}
          </ul>
        </div>

        {/* Misses */}
        {data.misses.length > 0 && (
           <div className="bg-drip-dark p-5 rounded-xl border border-drip-gray">
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="text-red-500" size={20} />
              <h3 className="font-bold text-white uppercase">The Flops</h3>
            </div>
            <ul className="space-y-2">
              {data.misses.map((miss, i) => (
                <li key={i} className="text-gray-300 text-sm pl-2 border-l-2 border-red-500/30">{miss}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggestions */}
        <div className="bg-gradient-to-br from-drip-dark to-drip-accent/10 p-5 rounded-xl border border-drip-accent/30">
          <div className="flex items-center gap-2 mb-3">
            <ShoppingBag className="text-drip-accent" size={20} />
            <h3 className="font-bold text-white uppercase">Cop This to Fix</h3>
          </div>
           <ul className="space-y-2">
              {data.suggestions.map((item, i) => (
                <li key={i} className="text-white font-medium text-sm bg-white/5 p-2 rounded-md flex items-center gap-2">
                   <span className="w-1.5 h-1.5 rounded-full bg-drip-accent"></span>
                   {item}
                </li>
              ))}
            </ul>
        </div>

        {/* Actions */}
        <div className="pt-4 space-y-3">
          {/* Primary Share Button */}
          <button 
            onClick={() => setShowShareMenu(true)}
            className="w-full bg-white text-black font-bold py-4 rounded-full flex items-center justify-center gap-2 font-display hover:bg-gray-200 transition-colors text-lg shadow-lg shadow-white/10"
          >
            <Share2 size={24} />
            SHARE
          </button>

          {/* Secondary Row */}
          <div className="flex gap-3">
            <button 
              onClick={onReset}
              className="flex-1 bg-drip-gray text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 font-display hover:bg-gray-700 transition-colors"
            >
              <RefreshCw size={20} />
              NEXT FIT
            </button>
          </div>
          
          {/* Home Button */}
          {onGoHome && (
            <button 
              onClick={onGoHome}
              className="w-full bg-drip-dark text-white font-bold py-3 rounded-full flex items-center justify-center gap-2 font-display hover:bg-drip-gray transition-colors border border-drip-gray"
            >
              <Home size={18} />
              BACK TO HOME
            </button>
          )}
        </div>
      </div>
    </div>

    {/* Share Menu */}
    <ShareMenu
      isOpen={showShareMenu}
      onClose={() => setShowShareMenu(false)}
      onShare={handleShare}
      onTweet={handleTwitterShare}
      shareLink={shareLink}
    />
    </>
  );
};