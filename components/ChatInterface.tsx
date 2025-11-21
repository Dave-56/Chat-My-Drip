import React, { useState } from 'react';
import { Send, ArrowLeft, Sparkles } from 'lucide-react';
import { ChatMessage, UploadedImage } from '../types';
import { Chat } from "@google/genai";
import { useSwipeGesture } from '../utils/useSwipeGesture';
import { ChatMessageSkeleton } from './LoadingSkeleton';

interface ChatInterfaceProps {
  chatSession: Chat;
  image: UploadedImage;
  onBack: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ chatSession, image, onBack }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'intro',
      role: 'model',
      text: "Yo! I've seen the fit. What do you wanna know? Ask me about the rating, the vibe, or how to level up."
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Swipe left to go back
  const { ref: swipeRef, swipeProgress, isSwiping } = useSwipeGesture({
    onSwipeLeft: onBack,
    threshold: 100,
    preventScroll: true,
  });

  const handleSend = async (retryMessage?: ChatMessage) => {
    const messageToSend = retryMessage || input.trim();
    if (!messageToSend || isLoading) return;

    const userMsg: ChatMessage = retryMessage || {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    if (!retryMessage) {
      setMessages(prev => [...prev, userMsg]);
      setInput('');
    }
    setIsLoading(true);

    try {
      const response = await chatSession.sendMessage({ message: userMsg.text });
      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: response.text || "My bad, I lost connection. Try asking again."
      };
      setMessages(prev => [...prev, aiMsg]);
    } catch (error) {
      console.error("Chat error", error);
      const errorMsg: ChatMessage = {
        id: Date.now().toString(),
        role: 'model',
        text: "Something glitched. Tap to retry?",
        retryable: true,
        originalMessage: userMsg,
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    // Flex Column Layout: Header (Fixed) + Body (Flex) + Footer (Fixed)
    <div 
      ref={swipeRef as React.RefObject<HTMLDivElement>}
      className="flex flex-col h-full w-full bg-drip-black overflow-hidden relative"
      style={{
        transform: isSwiping ? `translateX(${swipeProgress * 20}px)` : 'translateX(0)',
        transition: isSwiping ? 'none' : 'transform 0.2s ease-out',
      }}
    >
      
      {/* Header: Fixed at top, always visible */}
      <header className="shrink-0 h-[72px] bg-drip-dark border-b-2 border-white/50 flex items-center gap-3 px-4 shadow-lg z-50 safe-area-top" style={{ backgroundColor: '#1a1a1a' }}>
        <button 
          onClick={onBack} 
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-black border-2 border-black rounded-full active:bg-gray-200 transition-colors touch-manipulation min-w-[80px]"
          aria-label="Back to results"
          style={{ 
            backgroundColor: '#ffffff',
            color: '#000000',
            borderColor: '#000000',
            boxShadow: '0 2px 8px rgba(255,255,255,0.5)'
          }}
        >
          <ArrowLeft size={20} strokeWidth={2.5} />
          <span className="font-display font-bold text-xs uppercase">Back</span>
        </button>
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="text-right">
            <h3 className="font-display font-bold text-white text-lg leading-none">DRIP DM</h3>
            <p className="text-[10px] text-drip-lime uppercase tracking-wider flex items-center gap-1 justify-end mt-0.5">
              <span className="w-1.5 h-1.5 bg-drip-lime rounded-full animate-pulse"></span>
              Live
            </p>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-drip-gray relative">
             <img src={image.previewUrl} className="w-full h-full object-cover" alt="Context" />
          </div>
        </div>
      </header>

      {/* Messages Area: Flex-1 fills available space, Overflow-Y handles scrolling */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-drip-black">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            <div 
              onClick={msg.retryable && msg.originalMessage ? () => {
                // Remove error message and retry
                setMessages(prev => prev.filter(m => m.id !== msg.id));
                handleSend(msg.originalMessage);
              } : undefined}
              className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-drip-accent text-white rounded-tr-sm' 
                  : msg.retryable
                  ? 'bg-red-500/20 text-red-300 rounded-tl-sm border border-red-500/50 cursor-pointer hover:bg-red-500/30 transition-colors'
                  : 'bg-drip-gray text-gray-200 rounded-tl-sm border border-white/5'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && <ChatMessageSkeleton />}
      </div>

      {/* Footer: Shrink-0 ensures input is always visible */}
      <div className="shrink-0 min-h-[88px] bg-drip-black border-t border-drip-gray p-4 z-20 safe-area-bottom">
        <div className="flex items-center gap-2 bg-drip-dark rounded-full border border-drip-gray px-4 py-2 focus-within:border-drip-accent transition-colors h-[52px]">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask advice..."
            className="flex-1 bg-transparent text-white placeholder-gray-500 outline-none text-sm py-2"
            disabled={isLoading}
          />
          <button 
            onClick={handleSend}
            disabled={isLoading || !input.trim()}
            className={`p-2 rounded-full transition-all shrink-0 ${
              input.trim() ? 'bg-drip-lime text-black hover:scale-105' : 'bg-drip-gray text-gray-500'
            }`}
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};