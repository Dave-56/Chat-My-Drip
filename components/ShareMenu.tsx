import React from 'react';
import { Share2, Twitter, X } from 'lucide-react';

interface ShareMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onShare: () => void;
  onTweet: () => void;
  shareLink: string | null;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({
  isOpen,
  onClose,
  onShare,
  onTweet,
  shareLink,
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/80 z-50 flex items-end justify-center"
      onClick={onClose}
    >
      <div 
        className="bg-drip-dark rounded-t-3xl border-t-2 border-drip-gray w-full max-w-sm p-6 animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-display font-bold text-white text-xl">SHARE</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Share Options */}
        <div className="space-y-3">
          {/* Share (Copy Link) */}
          {shareLink ? (
            <button
              onClick={onShare}
              className="w-full bg-white text-black font-bold py-4 rounded-full flex items-center justify-center gap-3 font-display hover:bg-gray-200 transition-colors text-lg"
            >
              <Share2 size={24} />
              SHARE
            </button>
          ) : (
            <div className="w-full bg-drip-gray text-gray-400 font-bold py-4 rounded-full flex items-center justify-center gap-3 font-display text-lg">
              <Share2 size={24} />
              SHARE (Link not available)
            </div>
          )}

          {/* Tweet */}
          <button
            onClick={onTweet}
            className="w-full bg-[#1DA1F2] text-white font-bold py-4 rounded-full flex items-center justify-center gap-3 font-display hover:opacity-90 transition-opacity"
          >
            <Twitter size={20} fill="currentColor" />
            TWEET
          </button>
        </div>
      </div>
    </div>
  );
};

