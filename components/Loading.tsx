import React, { useEffect, useState } from 'react';
import { UploadedImage } from '../types';

interface LoadingProps {
  image: UploadedImage;
}

const MESSAGES = [
  "Analyzing the drip...",
  "Checking the vibe...",
  "Consulting the fashion council...",
  "Calculating swag levels...",
  "Looking for red flags...",
  "Scanning for mismatched socks...",
  "Judging respectfully..."
];

export const Loading: React.FC<LoadingProps> = ({ image }) => {
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMessageIndex((prev) => (prev + 1) % MESSAGES.length);
    }, 1500);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col items-center justify-center h-full p-8 text-center animate-slide-up">
      <div className="relative w-48 h-48 mb-8">
        <div className="absolute inset-0 rounded-full border-4 border-drip-gray opacity-30"></div>
        <div className="absolute inset-0 rounded-full border-t-4 border-drip-accent animate-spin"></div>
        <div className="absolute inset-2 rounded-full overflow-hidden">
            <img src={image.previewUrl} alt="Analyzing" className="w-full h-full object-cover opacity-60 blur-sm" />
        </div>
      </div>
      
      <h2 className="text-2xl font-display font-bold text-white mb-2 animate-pulse">
        {MESSAGES[messageIndex]}
      </h2>
      <p className="text-gray-500 text-sm">Please wait while we roast— I mean, rate you.</p>
    </div>
  );
};
