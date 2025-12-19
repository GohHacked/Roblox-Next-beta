import React, { useState, useEffect } from 'react';
import { LevelData, LevelType, Language } from '../types';
import { getTranslation } from '../translations';

interface DiscoveryPageProps {
  onPlay: (level: LevelType) => void;
  onOpenAvatar: () => void;
  onOpenProfile: () => void;
  username: string;
  lang: Language;
  avatarColor: string;
  onlineCount: number; // New prop for real stats
}

export const DiscoveryPage: React.FC<DiscoveryPageProps> = ({ onPlay, onOpenAvatar, onOpenProfile, username, lang, avatarColor, onlineCount }) => {
  const [selectedLevel, setSelectedLevel] = useState<LevelData | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showRules, setShowRules] = useState(false);
  
  // Voting State - Real start at 0
  const [likes, setLikes] = useState(0);
  const [dislikes, setDislikes] = useState(0);
  const [userVote, setUserVote] = useState<'like' | 'dislike' | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);

  // Translation helper
  const t = (key: any) => getTranslation(lang, key);

  // Only one game remaining
  const levels: LevelData[] = [
    { 
      id: 'rainbow', 
      title: 'Mega Rainbow Obby', 
      creator: 'ColorGames',
      description: 'Jump through over 50 stages of colorful platforms! Can you reach the end and claim the treasure? Easy mode included.',
      online: onlineCount.toString(), // Use strictly real data
      rating: '0%', // Real rating for new game
      visits: '0', // Real visits for new game
      image: 'https://images.unsplash.com/photo-1500462918059-b1a0cb512f1d?q=80&w=1000&auto=format&fit=crop'
    }
  ];

  // Reset/Init stats when opening a level
  useEffect(() => {
    if (selectedLevel) {
        // No fake boosting. Start fresh.
        setLikes(0);
        setDislikes(0);
        setUserVote(null);
        setIsFavorite(false);
    }
  }, [selectedLevel]);

  const handleVote = (type: 'like' | 'dislike') => {
      if (userVote === type) {
          // Remove vote
          setUserVote(null);
          if (type === 'like') setLikes(prev => prev - 1);
          else setDislikes(prev => prev - 1);
      } else {
          // Switch vote or new vote
          if (userVote === 'like') setLikes(prev => prev - 1);
          if (userVote === 'dislike') setDislikes(prev => prev - 1);
          
          setUserVote(type);
          if (type === 'like') setLikes(prev => prev + 1);
          else setDislikes(prev => prev + 1);
      }
  };

  const handleFavorite = () => {
      setIsFavorite(!isFavorite);
  };

  const calculateRatio = () => {
      const total = likes + dislikes;
      if (total === 0) return 0;
      return Math.round((likes / total) * 100);
  };

  return (
    <div className="h-screen flex flex-col bg-[#191b1d] text-white font-['Segoe_UI']">
      {/* Navbar */}
      <nav className="h-12 bg-[#232527] flex items-center justify-between px-4 border-b border-[#393b3d] shrink-0">
        <div className="flex items-center gap-6">
          <div className="text-xl font-bold border-2 border-white px-1 leading-none rounded-md cursor-default">R</div>
          <div className="flex gap-6 text-sm font-semibold">
            <span className="cursor-pointer text-white border-b-2 border-white pb-3 pt-3">{t('games')}</span>
            <span onClick={onOpenAvatar} className="cursor-pointer text-gray-400 hover:text-white pb-3 pt-3 transition-colors">{t('avatar')}</span>
          </div>
        </div>
        <div className="flex items-center gap-4">
            
            {/* INFO BUTTON */}
            <button 
                onClick={() => setShowInfo(true)}
                className="bg-[#393b3d] hover:bg-[#4a4c4e] px-3 py-1.5 rounded-full text-xs font-bold text-white transition-all flex items-center gap-2 hover:scale-105 active:scale-95 border border-white/10"
            >
                <span className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-[10px] font-serif italic">i</span>
                {t('info')}
            </button>

            <div className="bg-[#393b3d] px-2 py-1 rounded text-xs text-gray-300 font-mono">
                 13+
            </div>
            {/* Top Right User Profile Click */}
            <div className="flex items-center gap-2 cursor-pointer hover:bg-[#393b3d] p-1 rounded transition-colors" onClick={onOpenProfile}>
                {/* Visual Avatar Icon using inline style for dynamic shirt color */}
                <div className="w-6 h-6 rounded-full border border-white/20" style={{ backgroundColor: avatarColor }}></div>
                <div className="font-semibold text-sm hidden sm:block">{username}</div>
            </div>
        </div>
      </nav>

      {/* Content */}
      <div className="flex-1 p-6 overflow-y-auto">
        
        {/* Banner / CTA for Character Editor */}
        <div className="mb-8 p-4 bg-gradient-to-r from-blue-900 to-[#191b1d] rounded-xl flex items-center justify-between border border-white/10 shadow-lg">
            <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-2xl">👕</div>
                <div>
                    <h3 className="font-bold text-lg">{t('customize')}</h3>
                    <p className="text-sm text-gray-300">Change your skin tone and clothing!</p>
                </div>
            </div>
            <button 
                onClick={onOpenAvatar}
                className="bg-white text-black font-bold px-4 py-2 rounded-lg hover:bg-gray-200 transition-colors"
            >
                Edit Skin
            </button>
        </div>

        <h2 className="text-xl font-bold mb-4 text-white">{t('recommended')}</h2>
        
        {/* Grid adjusted for fewer items */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {levels.map(level => (
            <div 
              key={level.id} 
              className="group cursor-pointer flex flex-col"
              onClick={() => setSelectedLevel(level)}
            >
              <div className="aspect-square rounded-[10px] mb-2 overflow-hidden relative shadow-md group-hover:shadow-xl transition-all">
                <img 
                    src={level.image} 
                    alt={level.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
              </div>
              <div className="font-bold text-base leading-5 text-white truncate group-hover:underline">{level.title}</div>
              <div className="text-xs text-gray-400 mt-1 flex justify-between items-center">
                 <span className="flex items-center gap-1">
                    👍 {calculateRatio()}%
                 </span>
                 <span className="flex items-center gap-1">
                    👤 {level.online}
                 </span>
              </div>
            </div>
          ))}
          
          {/* Placeholder cards to fill empty space and look like a real app */}
          {[1, 2, 3].map((i) => (
             <div key={i} className="group flex flex-col opacity-30 pointer-events-none grayscale">
                <div className="aspect-square rounded-[10px] mb-2 bg-[#2b2b2b] border border-white/5"></div>
                <div className="h-4 bg-[#2b2b2b] rounded w-3/4 mb-1"></div>
                <div className="h-3 bg-[#2b2b2b] rounded w-1/2"></div>
             </div>
          ))}
        </div>
      </div>

      {/* INFO MODAL */}
      {showInfo && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-fade-in">
             <div className="bg-[#1e2022] w-full max-w-[420px] rounded-2xl shadow-2xl border border-white/10 overflow-hidden flex flex-col transform transition-all scale-100">
                
                {/* Modern Header */}
                <div className="bg-gradient-to-b from-[#2a2c2e] to-[#1e2022] p-8 text-center relative border-b border-white/5">
                    <button 
                        onClick={() => setShowInfo(false)}
                        className="absolute top-4 right-4 text-white/50 hover:text-white transition-colors p-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                    </button>
                    
                    <div className="w-20 h-20 bg-[#111] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-[0_0_25px_rgba(0,0,0,0.5)] border border-white/10 relative overflow-hidden group">
                         <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                         <div className="text-white font-extrabold text-4xl relative z-10">R</div>
                    </div>
                    
                    <h2 className="text-2xl font-bold text-white mb-1 tracking-tight">{t('about_game_title')}</h2>
                    <div className="flex items-center justify-center gap-2 text-xs font-mono text-green-400">
                        <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                        Servers Online
                    </div>
                </div>

                {/* Modal Body */}
                <div className="p-6 space-y-6 bg-[#1e2022]">
                    <p className="text-gray-400 text-center text-sm leading-relaxed font-medium">
                        {t('about_game_desc')}
                    </p>

                    {/* Telegram Button (Paper Plane) */}
                    <a 
                        href="https://t.me/RobloxNextNews" 
                        target="_blank" 
                        rel="noreferrer"
                        className="group relative block w-full bg-[#229ED9] hover:bg-[#1E96CF] text-white py-4 rounded-xl shadow-[0_4px_15px_rgba(34,158,217,0.3)] hover:shadow-[0_6px_20px_rgba(34,158,217,0.5)] transition-all active:scale-[0.98] overflow-hidden"
                    >
                         {/* Shine Effect */}
                         <div className="absolute top-0 -left-[100%] w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-[-20deg] group-hover:animate-[shimmer_1s_infinite]"></div>
                         
                         <div className="relative z-10 flex items-center justify-center gap-3">
                             {/* Paper Plane Icon */}
                             <svg 
                                className="w-6 h-6 transform transition-transform duration-500 ease-out group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:-rotate-12" 
                                viewBox="0 0 24 24" 
                                fill="none" 
                                stroke="currentColor" 
                                strokeWidth="2" 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                             >
                                <line x1="22" y1="2" x2="11" y2="13"></line>
                                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
                             </svg>
                             <span className="font-bold text-lg tracking-wide">{t('telegram_channel')}</span>
                         </div>
                    </a>

                    {/* Rules Accordion */}
                    <div className="border border-white/5 rounded-xl overflow-hidden bg-[#161819]">
                        <button 
                            onClick={() => setShowRules(!showRules)}
                            className="w-full flex justify-between items-center text-gray-300 hover:text-white font-semibold transition-colors p-4 bg-white/5 hover:bg-white/10"
                        >
                            <div className="flex items-center gap-2">
                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-yellow-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                                <span>{t('game_rules')}</span>
                            </div>
                            <span className={`transform transition-transform duration-300 ${showRules ? 'rotate-180' : ''}`}>&#9662;</span>
                        </button>
                        
                        <div 
                            className={`transition-all duration-300 ease-in-out overflow-hidden ${showRules ? 'max-h-[200px] opacity-100' : 'max-h-0 opacity-0'}`}
                        >
                            <div className="p-4 pt-0 text-xs text-gray-400 whitespace-pre-line leading-relaxed border-t border-white/5">
                                <div className="mt-3">
                                    {t('rules_content')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
             
             <style>{`
                @keyframes shimmer {
                    0% { left: -100%; }
                    100% { left: 200%; }
                }
             `}</style>
        </div>
      )}

      {/* Game Details Modal (Roblox Style) */}
      {selectedLevel && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in">
          <div className="bg-[#232527] w-full max-w-[800px] rounded-lg shadow-2xl relative overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
            
            <button 
              onClick={() => setSelectedLevel(null)}
              className="absolute top-4 right-4 text-white hover:text-gray-300 text-3xl z-20 drop-shadow-md"
            >
              &times;
            </button>

            {/* Left: Image */}
            <div className="w-full md:w-[450px] aspect-video md:aspect-auto relative group overflow-hidden bg-black">
               <img 
                    src={selectedLevel.image} 
                    alt={selectedLevel.title}
                    className="w-full h-full object-cover opacity-80"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-[#232527] to-transparent md:hidden"></div>
               
               {/* Play Button Overlay (Mobile style) */}
               <div className="absolute bottom-4 left-4 md:hidden">
                    <h1 className="text-2xl font-bold drop-shadow-md">{selectedLevel.title}</h1>
               </div>
            </div>

            {/* Right: Info */}
            <div className="flex-1 p-6 flex flex-col bg-[#232527]">
                <h1 className="text-3xl font-bold mb-1 hidden md:block">{selectedLevel.title}</h1>
                <div className="text-blue-400 text-sm mb-6 cursor-pointer hover:underline flex items-center gap-2">
                    <span>{t('by')} {selectedLevel.creator}</span>
                </div>

                {/* Like / Dislike / Favorite Bar */}
                <div className="mb-6">
                    <div className="flex items-center gap-4 mb-2">
                        {/* Like Button */}
                        <button 
                            onClick={() => handleVote('like')}
                            className={`flex items-center gap-1.5 transition-colors ${userVote === 'like' ? 'text-[#00b06f]' : 'text-gray-400 hover:text-white'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={userVote === 'like' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"></path></svg>
                            <span className="font-bold text-sm">{likes.toLocaleString()}</span>
                        </button>

                        {/* Dislike Button */}
                        <button 
                            onClick={() => handleVote('dislike')}
                            className={`flex items-center gap-1.5 transition-colors ${userVote === 'dislike' ? 'text-red-500' : 'text-gray-400 hover:text-white'}`}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill={userVote === 'dislike' ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"></path></svg>
                            <span className="font-bold text-sm">{dislikes.toLocaleString()}</span>
                        </button>

                        {/* Favorite Button */}
                        <button 
                            onClick={handleFavorite}
                            className={`ml-auto transition-colors ${isFavorite ? 'text-yellow-400' : 'text-gray-400 hover:text-white'}`}
                            title="Favorite"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        </button>
                    </div>

                    {/* Ratio Bar */}
                    <div className="w-full h-1.5 bg-gray-700 rounded-full overflow-hidden flex">
                        <div 
                            style={{ width: `${calculateRatio()}%` }} 
                            className="h-full bg-[#00b06f] transition-all duration-300"
                        ></div>
                    </div>
                </div>

                <div className="flex gap-8 border-b border-gray-700 pb-4 mb-4 text-center md:text-left">
                    <div>
                        <div className="text-gray-400 text-xs uppercase font-bold">{t('visits')}</div>
                        <div className="text-white font-semibold">{selectedLevel.visits}</div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-xs uppercase font-bold">{t('online')}</div>
                        <div className="text-white font-semibold">{selectedLevel.online}</div>
                    </div>
                    <div>
                        <div className="text-gray-400 text-xs uppercase font-bold">{t('rating')}</div>
                        <div className="text-white font-semibold">{calculateRatio()}%</div>
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto mb-6 pr-2">
                    <p className="text-gray-300 text-sm leading-relaxed whitespace-pre-line">
                        {selectedLevel.description}
                        
                        <br/><br/>
                        <span className="font-bold text-white">Latest Update:</span>
                        <br/>
                        - Added 10 new stages!
                        <br/>
                        - Fixed gravity bug
                        <br/>
                        - Performance improvements
                    </p>
                </div>

                <button 
                  onClick={() => onPlay(selectedLevel.id)}
                  className="w-full bg-[#00b06f] hover:bg-[#009e63] text-white py-3 rounded-lg font-bold text-xl flex items-center justify-center shadow-lg transition-all active:scale-95"
                >
                  <div className="w-8 h-8 bg-black/20 rounded-md flex items-center justify-center mr-3">
                    <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-white border-b-[6px] border-b-transparent ml-1"></div>
                  </div>
                  {t('play')}
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};