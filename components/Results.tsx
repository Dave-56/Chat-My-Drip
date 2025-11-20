import React from 'react';
import { Share2, RefreshCw, AlertCircle, CheckCircle, ShoppingBag } from 'lucide-react';
import { AnalysisResult, UploadedImage } from '../types';

interface ResultsProps {
  image: UploadedImage;
  data: AnalysisResult;
  onReset: () => void;
}

export const Results: React.FC<ResultsProps> = ({ image, data, onReset }) => {
  const scoreColor = data.score >= 8 ? 'text-drip-lime' : data.score >= 5 ? 'text-drip-accent' : 'text-red-500';
  const scoreBg = data.score >= 8 ? 'bg-drip-lime/10' : data.score >= 5 ? 'bg-drip-accent/10' : 'bg-red-500/10';

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'ChatMyDrip Result',
          text: `I got a ${data.score}/10 on ChatMyDrip. "${data.verdict}" Check my fit!`,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing', error);
      }
    } else {
      alert("Screenshot this to share!");
    }
  };

  return (
    <div className="flex flex-col h-full animate-slide-up pb-20">
      {/* Header Image & Score Overlay */}
      <div className="relative w-full aspect-square">
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
      <div className="px-6 -mt-4 relative z-10 space-y-4">
        
        {/* Verdict Card */}
        <div className="bg-drip-dark p-5 rounded-xl border border-drip-gray shadow-lg">
          <p className="text-gray-400 text-xs uppercase tracking-wider font-bold mb-2">THE VERDICT</p>
          <p className="text-xl font-bold text-white italic">"{data.verdict}"</p>
        </div>

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
        <div className="flex gap-4 pt-4">
          <button 
            onClick={handleShare}
            className="flex-1 bg-white text-black font-bold py-4 rounded-full flex items-center justify-center gap-2 font-display hover:bg-gray-200 transition-colors"
          >
            <Share2 size={20} />
            SHARE
          </button>
          <button 
            onClick={onReset}
            className="flex-1 bg-drip-gray text-white font-bold py-4 rounded-full flex items-center justify-center gap-2 font-display hover:bg-gray-700 transition-colors"
          >
            <RefreshCw size={20} />
            NEXT FIT
          </button>
        </div>
      </div>
    </div>
  );
};
