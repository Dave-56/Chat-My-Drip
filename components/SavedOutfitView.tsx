import React from 'react';
import { ArrowLeft, Share2, RefreshCw, AlertCircle, CheckCircle, ShoppingBag, Twitter, MessageCircle } from 'lucide-react';
import { SavedOutfit, UploadedImage, AnalysisResult } from '../types';
import { getShareableLink } from '../utils/outfitStorage';

interface SavedOutfitViewProps {
  outfit: SavedOutfit;
  image: UploadedImage;
  data: AnalysisResult;
  onBack: () => void;
  onChat: () => void;
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

export const SavedOutfitView: React.FC<SavedOutfitViewProps> = ({ outfit, image, data, onBack, onChat }) => {
  const scoreColor = data.score >= 8 ? 'text-drip-lime' : data.score >= 5 ? 'text-drip-accent' : 'text-red-500';
  const scoreBg = data.score >= 8 ? 'bg-drip-lime/10' : data.score >= 5 ? 'bg-drip-accent/10' : 'bg-red-500/10';

  const shareLink = getShareableLink(outfit.id);
  const shareText = `I got a ${data.score}/10 on ChatMyDrip. "${data.verdict}" 🤖👠`;

  const handleNativeShare = async () => {
    const file = dataURLtoFile(image.previewUrl, 'chatmydrip-result.png');
    
    if (navigator.canShare && navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({
          files: [file],
          title: 'ChatMyDrip Result',
          text: `${shareText}\n\nView: ${shareLink}`,
        });
        return;
      } catch (error) {
        console.log('Error sharing file', error);
      }
    }
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ChatMyDrip Result',
          text: `${shareText}\n\nView: ${shareLink}`,
          url: shareLink,
        });
      } catch (error) {
        console.log('Error sharing text', error);
      }
    } else {
      // Fallback: copy link to clipboard
      navigator.clipboard.writeText(shareLink);
      alert('Link copied to clipboard!');
    }
  };

  const handleTwitterShare = () => {
    const text = encodeURIComponent(`${shareText}\n\nCheck my fit:`);
    const url = encodeURIComponent(shareLink);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${url}`, '_blank');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareLink);
    alert('Link copied to clipboard!');
  };

  return (
    <div className="flex flex-col h-full animate-slide-up overflow-y-auto no-scrollbar overscroll-contain">
      {/* Header */}
      <div className="shrink-0 h-[72px] bg-drip-dark border-b-2 border-white/50 flex items-center gap-3 px-4">
        <button 
          onClick={onBack} 
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black border-2 border-black rounded-full active:bg-gray-200 transition-colors"
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
          <span className="font-display font-bold text-xs uppercase">Back</span>
        </button>
        <h2 className="font-display font-bold text-white text-lg">SAVED FIT</h2>
      </div>

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
                <p className="text-sm font-normal opacity-90">Chat about this fit?</p>
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
          {/* Share Link Button */}
          <button 
            onClick={handleCopyLink}
            className="w-full bg-drip-accent text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 font-display hover:opacity-90 transition-opacity shadow-lg shadow-purple-500/20"
          >
            <Share2 size={24} />
            COPY SHARE LINK
          </button>

          {/* Share Buttons */}
          <button 
            onClick={handleNativeShare}
            className="w-full bg-white text-black font-bold py-4 rounded-full flex items-center justify-center gap-2 font-display hover:bg-gray-200 transition-colors text-lg shadow-lg shadow-white/10"
          >
            <Share2 size={24} />
            SHARE RESULT
          </button>

          {/* Twitter Share */}
          <button 
            onClick={handleTwitterShare}
            className="w-full bg-[#1DA1F2] text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 font-display hover:opacity-90 transition-opacity"
          >
            <Twitter size={20} fill="currentColor" />
            TWEET
          </button>
        </div>

        {/* Saved Date */}
        <p className="text-center text-xs text-gray-500 mt-2">
          Saved on {new Date(outfit.savedAt).toLocaleDateString('en-US', { 
            month: 'long', 
            day: 'numeric', 
            year: 'numeric' 
          })}
        </p>
      </div>
    </div>
  );
};

