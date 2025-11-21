import React, { useEffect, useState } from 'react';
import { CheckCircle2, X } from 'lucide-react';

interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info';
  duration?: number;
  onClose: () => void;
}

export const Toast: React.FC<ToastProps> = ({ 
  message, 
  type = 'success', 
  duration = 3000,
  onClose 
}) => {
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(false);
      setTimeout(onClose, 300); // Wait for fade out animation
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  const bgColor = type === 'success' 
    ? 'bg-drip-lime text-black' 
    : type === 'error'
    ? 'bg-red-500 text-white'
    : 'bg-drip-accent text-white';

  return (
    <div 
      className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-50 transition-all duration-300 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'
      }`}
    >
      <div className={`${bgColor} px-6 py-4 rounded-full shadow-lg flex items-center gap-3 font-display font-bold min-w-[200px] justify-center`}>
        {type === 'success' && <CheckCircle2 size={20} />}
        <span>{message}</span>
        <button
          onClick={() => {
            setIsVisible(false);
            setTimeout(onClose, 300);
          }}
          className="ml-2 hover:opacity-70 transition-opacity"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

