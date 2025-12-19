import React, { useEffect, useState } from 'react';

export const LoadingScreen: React.FC = () => {
  const [status, setStatus] = useState('Joining server...');

  useEffect(() => {
    const messages = [
      'Joining server...',
      'Loading map assets...',
      'Initializing physics engine...',
      'Starting game...'
    ];
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (i < messages.length) {
        setStatus(messages[i]);
      }
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="fixed inset-0 bg-[#232527] z-50 flex flex-col items-center justify-center text-white">
      {/* Spinning Roblox Logo */}
      <div className="w-24 h-24 relative animate-spin-slow mb-8">
        <div className="absolute inset-0 border-8 border-[#393b3d] rounded-2xl transform rotate-12"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-10 h-10 bg-[#393b3d] rounded-lg transform rotate-12"></div>
        </div>
      </div>

      <h2 className="text-2xl font-bold mb-2">Roblux</h2>
      <div className="text-gray-400 font-mono text-sm animate-pulse">{status}</div>
      
      {/* Fake Loading Bar */}
      <div className="w-64 h-2 bg-[#393b3d] rounded-full mt-8 overflow-hidden">
        <div className="h-full bg-blue-500 animate-progress rounded-full"></div>
      </div>

      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 100%; }
        }
        .animate-progress {
          animation: progress 2.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};