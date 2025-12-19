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
    <div className="absolute top-4 left-4 z-50 flex flex-col items-start font-sans pointer-events-auto">
      {/* Toggle Button */}
      <button 
        onClick={toggleChat}
        className="relative bg-black/60 hover:bg-black/80 p-2.5 rounded-lg mb-2 text-white transition-colors backdrop-blur-sm border border-white/20 shadow-md active:scale-90 group"
        aria-label="Toggle Chat"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>

        {/* Notification Badge */}
        {unreadCount > 0 && (
            <div className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[20px] h-[20px] flex items-center justify-center border border-black/30 shadow-sm animate-pulse">
                {unreadCount > 99 ? '99+' : unreadCount}
            </div>
        )}
      </button>

      {/* Chat Window */}
      {isOpen && (
        <div className="w-[300px] h-[200px] flex flex-col rounded-xl overflow-hidden animate-fade-in shadow-xl border border-white/5">
           {/* Messages Area */}
           <div className="flex-1 bg-black/50 backdrop-blur-sm overflow-y-auto p-3 scrollbar-thin scrollbar-thumb-white/20">
               {messages.length === 0 && (
                   <div className="text-gray-400 text-xs italic">System: Welcome to the chat!</div>
               )}
               {messages.map((msg) => (
                   <div key={msg.id} className="mb-1.5 text-[13px] leading-tight break-words text-shadow-sm font-medium">
                       {msg.isSystem ? (
                           <span className="text-yellow-400 italic">{msg.text}</span>
                       ) : (
                           <>
                               <span className="font-bold text-white drop-shadow-sm">[{msg.username}]: </span>
                               <span className="text-white drop-shadow-sm">{msg.text}</span>
                           </>
                       )}
                   </div>
               ))}
               <div ref={messagesEndRef} />
           </div>

           {/* Input Area */}
           <form onSubmit={handleSubmit} className="bg-black/70 p-2 flex border-t border-white/10">
               <input 
                  type="text" 
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onFocus={onFocus}
                  onBlur={onBlur}
                  placeholder="Tap here to chat"
                  className="w-full bg-white/10 text-white text-sm px-3 py-1.5 rounded-md outline-none placeholder-gray-400 focus:bg-white/20 transition-colors border border-transparent focus:border-white/30"
                  maxLength={100}
               />
           </form>
        </div>
      )}
    </div>
  );
};