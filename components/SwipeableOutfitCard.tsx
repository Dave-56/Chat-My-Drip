import React, { useState, useRef } from 'react';
import { Trash2 } from 'lucide-react';
import { SavedOutfit } from '../types';

interface SwipeableOutfitCardProps {
  outfit: SavedOutfit;
  onView: () => void;
  onDelete: () => void;
}

export const SwipeableOutfitCard: React.FC<SwipeableOutfitCardProps> = ({ 
  outfit, 
  onView, 
  onDelete 
}) => {
  const [swipeOffset, setSwipeOffset] = useState(0);
  const [isDeleting, setIsDeleting] = useState(false);
  const touchStartRef = useRef<number | null>(null);
  const touchStartXRef = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartXRef.current = e.touches[0].clientX;
    touchStartRef.current = Date.now();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartXRef.current === null) return;
    
    const deltaX = e.touches[0].clientX - touchStartXRef.current;
    // Only allow swiping left (negative deltaX)
    if (deltaX < 0) {
      const offset = Math.max(deltaX, -120); // Max swipe distance
      setSwipeOffset(offset);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartXRef.current === null || touchStartXRef.current === null) return;

    // If swiped more than 80px left, trigger delete
    if (swipeOffset < -80) {
      setIsDeleting(true);
      setTimeout(() => {
        onDelete();
      }, 300);
    } else {
      // Snap back
      setSwipeOffset(0);
    }
    
    touchStartXRef.current = null;
    touchStartRef.current = null;
  };

  const handleDeleteClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsDeleting(true);
    setTimeout(() => {
      onDelete();
    }, 300);
  };

  const score = outfit.analysis.score;
  const scoreColor = score >= 8 ? 'text-drip-lime' : score >= 5 ? 'text-drip-accent' : 'text-red-500';
  const scoreBg = score >= 8 ? 'bg-drip-lime/20 border-drip-lime/50' : score >= 5 ? 'bg-drip-accent/20 border-drip-accent/50' : 'bg-red-500/20 border-red-500/50';

  return (
    <div className="relative overflow-hidden">
      {/* Delete Action Background */}
      <div 
        className="absolute inset-y-0 right-0 bg-red-500 flex items-center justify-end pr-4 z-0"
        style={{ width: '120px' }}
      >
        <Trash2 className="text-white" size={24} />
      </div>

      {/* Card Content */}
      <div
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onClick={onView}
        className="relative bg-drip-dark rounded-xl overflow-hidden border border-drip-gray cursor-pointer group hover:border-drip-accent transition-all z-10"
        style={{
          transform: `translateX(${swipeOffset}px)`,
          opacity: isDeleting ? 0 : 1,
          transition: isDeleting ? 'opacity 0.3s ease-out' : 'transform 0.2s ease-out',
        }}
      >
        <div className="aspect-[3/4] relative">
          <img 
            src={outfit.image.previewUrl} 
            alt="Saved outfit" 
            className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
          />
          
          {/* Score overlay */}
          <div className={`absolute top-2 right-2 ${scoreBg} backdrop-blur-sm px-2.5 py-1 rounded-full border`}>
            <span className={`${scoreColor} font-display font-bold text-lg`}>{score}</span>
            <span className="text-white/80 text-xs">/10</span>
          </div>

          {/* Gradient overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black via-black/90 to-transparent p-3">
            <p className="text-white font-display font-bold text-sm uppercase line-clamp-1">
              {outfit.analysis.vibe}
            </p>
            <p className="text-gray-400 text-[10px] mt-0.5">
              {new Date(outfit.savedAt).toLocaleDateString('en-US', { 
                month: 'numeric', 
                day: 'numeric', 
                year: 'numeric' 
              })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

