import React, { useState, useRef, useEffect } from 'react';
import { Send, ArrowLeft, Sparkles } from 'lucide-react';
import { ChatMessage, UploadedImage } from '../types';
import { Chat } from "@google/genai";

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
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 2. Critical: Reset any parent scroll position on mount
  useEffect(() => {
    window.scrollTo(0, 0);
    if (document.body) document.body.scrollTop = 0;
    if (document.documentElement) document.documentElement.scrollTop = 0;
  }, []);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
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
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        text: "Something glitched. Try again?"
      }]);
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
    <div className="flex flex-col h-full w-full bg-drip-black">
      
      {/* Header: Shrink-0 ensures it never collapses */}
      <div className="shrink-0 h-[72px] bg-drip-black border-b border-drip-gray flex items-center gap-4 px-4 shadow-md z-20">
        <button 
          onClick={onBack} 
          className="flex items-center gap-2 px-3 py-2 bg-drip-gray hover:bg-white hover:text-black rounded-full transition-colors text-white group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span className="font-display font-bold text-sm uppercase">Back</span>
        </button>
        <div className="flex items-center gap-3 flex-1 justify-end">
          <div className="text-right">
            <h3 className="font-display font-bold text-white text-lg leading-none">STYLIST DM</h3>
            <p className="text-[10px] text-drip-lime uppercase tracking-wider flex items-center gap-1 justify-end mt-0.5">
              <span className="w-1.5 h-1.5 bg-drip-lime rounded-full animate-pulse"></span>
              Live
            </p>
          </div>
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-drip-gray relative">
             <img src={image.previewUrl} className="w-full h-full object-cover" alt="Context" />
          </div>
        </div>
      </div>

      {/* Messages Area: Flex-1 fills available space, Overflow-Y handles scrolling */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-drip-black z-10">
        {messages.map((msg) => (
          <div 
            key={msg.id} 
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            <div 
              className={`max-w-[85%] p-4 rounded-2xl text-sm leading-relaxed shadow-sm ${
                msg.role === 'user' 
                  ? 'bg-drip-accent text-white rounded-tr-sm' 
                  : 'bg-drip-gray text-gray-200 rounded-tl-sm border border-white/5'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start animate-pulse">
            <div className="bg-drip-gray p-4 rounded-2xl rounded-tl-sm border border-white/5">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce"></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-2 h-2 bg-gray-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Footer: Shrink-0 ensures input is always visible */}
      <div className="shrink-0 h-[88px] bg-drip-black border-t border-drip-gray p-4 z-20">
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