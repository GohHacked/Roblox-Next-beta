import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage } from '../types';

interface ChatSystemProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  username: string;
  onFocus: () => void;
  onBlur: () => void;
}

export const ChatSystem: React.FC<ChatSystemProps> = ({ messages, onSendMessage, username, onFocus, onBlur }) => {
  const [inputText, setInputText] = useState('');
  const [isOpen, setIsOpen] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const prevMessagesLength = useRef(messages.length);

  // Handle incoming messages for notification
  useEffect(() => {
    // Only increment if chat is closed AND we actually have a new message (length increased)
    if (!isOpen && messages.length > prevMessagesLength.current) {
        setUnreadCount(prev => prev + 1);
    }
    prevMessagesLength.current = messages.length;
  }, [messages, isOpen]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (isOpen && messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const toggleChat = () => {
      const newState = !isOpen;
      setIsOpen(newState);
      if (newState) {
          setUnreadCount(0); // Reset counter when opening
      }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputText.trim()) {
        onSendMessage(inputText.trim());
        setInputText('');
    }
  };

  return (
    // Moved to left-20 (approx 80px) and top-6 (24px) to clear the menu button which is at left-4
    <div className="absolute top-6 left-20 z-50 flex flex-col items-start font-sans pointer-events-auto">
      {/* Toggle Button */}
      <button 
        onClick={toggleChat}
        className="relative bg-[#232527]/90 hover:bg-[#393b3d] w-10 h-10 flex items-center justify-center rounded-lg mb-2 text-white transition-colors backdrop-blur-md border border-white/20 shadow-lg active:scale-90 group"
        aria-label="Toggle Chat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>

        {/* Notification Badge */}
        {unreadCount > 0 && (
            <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] h-[18px] flex items-center justify-center border border-black/30 shadow-sm animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
            </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        // Adjusted width for mobile: calc(100vw - 90px) ensures it fits next to the left menu button
        <div className="w-[calc(100vw-90px)] max-w-[320px] h-[180px] md:h-[220px] flex flex-col rounded-xl overflow-hidden animate-fade-in shadow-2xl border border-white/10 bg-[#111213]/80 backdrop-blur-md origin-top-left">
           {/* Messages Area - Added touch-pan-y for mobile scrolling */}
           <div className="flex-1 overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent touch-pan-y">
               {/* Messages content */}
               {messages.length === 0 && (
                   <div className="text-gray-400 text-xs italic opacity-70">System: Welcome to the chat!</div>
               )}
               {messages.map((msg) => (
                   <div key={msg.id} className="mb-1 text-[13px] leading-snug break-words">
                       {msg.isSystem ? (
                           <span className="text-yellow-400 italic text-xs">{msg.text}</span>
                       ) : (
                           <div className="flex gap-1">
                               <span className="font-bold text-white whitespace-nowrap">[{msg.username}]:</span>
                               <span className="text-gray-100">{msg.text}</span>
                           </div>
                       )}
                   </div>
               ))}
               <div ref={messagesEndRef} />
           </div>

           {/* Input Area */}
           <form onSubmit={handleSubmit} className="bg-black/40 p-2 flex border-t border-white/10">
               <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  placeholder="Tap here to chat..."
                  // text-base on mobile prevents iOS auto-zoom
                  className="w-full bg-white/10 text-white text-base md:text-sm px-3 py-2 rounded-md outline-none placeholder-gray-400 focus:bg-white/15 transition-colors border border-transparent focus:border-white/20"
                  maxLength={100}
               />
           </form>
        </div>
      )}
    </div>
  );
};