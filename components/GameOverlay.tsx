import React, { useState } from 'react';
import { GameSettings, Language, GraphicsQuality, ChatMessage, Player } from '../types';
import { getTranslation } from '../translations';
import { ChatSystem } from './ChatSystem';

interface GameOverlayProps {
  username: string;
  paused: boolean;
  victory: boolean;
  onOpenMenu: () => void;
  onResume: () => void;
  onLeave: () => void;
  onRestart: () => void;
  settings: GameSettings;
  onSettingsChange: (s: GameSettings) => void;
  lang: Language;
  // Chat props
  messages: ChatMessage[];
  players: Player[]; // NEW: Added players list
  onSendMessage: (text: string) => void;
  onChatFocus: () => void;
  onChatBlur: () => void;
}

export const GameOverlay: React.FC<GameOverlayProps> = ({ 
  username, paused, victory, onOpenMenu, onResume, onLeave, onRestart, settings, onSettingsChange, lang,
  messages, players, onSendMessage, onChatFocus, onChatBlur
}) => {
  const [activeTab, setActiveTab] = useState<'players' | 'settings'>('players');

  const t = (key: any) => getTranslation(lang, key);

  const handleGraphicsChange = (quality: GraphicsQuality) => {
    onSettingsChange({
        ...settings,
        graphics: quality
    });
  };

  // VICTORY SCREEN
  if (victory) {
      return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4 animate-fade-in pointer-events-auto">
             <div className="bg-[#232527] w-full max-w-[400px] rounded-xl shadow-2xl border border-yellow-500/30 p-8 flex flex-col items-center text-center relative overflow-hidden">
                {/* Confetti effect background (simplified) */}
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-20"></div>
                
                <div className="w-24 h-24 bg-yellow-400 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(250,204,21,0.4)] animate-bounce">
                    <span className="text-5xl">🏆</span>
                </div>

                <h1 className="text-3xl font-extrabold text-white mb-2 uppercase tracking-wide">Victory!</h1>
                <p className="text-gray-300 mb-8">You reached the end of the obby!</p>

                <div className="w-full space-y-3 relative z-10">
                    <button 
                        onClick={onRestart}
                        className="w-full bg-[#00b06f] hover:bg-[#009e63] text-white py-3 rounded-lg font-bold text-lg shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M2.5 2v6h6M21.5 22v-6h-6"/><path d="M22 11.5A10 10 0 0 0 3.2 7.2M2 12.5a10 10 0 0 0 18.8 4.2"/>
                        </svg>
                        Play Again
                    </button>
                    <button 
                        onClick={onLeave}
                        className="w-full bg-[#393b3d] hover:bg-[#4a4c4e] text-white py-3 rounded-lg font-bold text-lg shadow-lg transition-transform active:scale-95"
                    >
                        {t('leave')}
                    </button>
                </div>
             </div>
        </div>
      );
  }

  if (!paused) {
    return (
      <div className="absolute inset-0 pointer-events-none">
        {/* Chat System (Left) - Adjusted position in ChatSystem component to accommodate Menu Button */}
        <ChatSystem 
            username={username}
            messages={messages}
            onSendMessage={onSendMessage}
            onFocus={onChatFocus}
            onBlur={onChatBlur}
        />

        {/* HUD: Unified Menu Button (Top Left) */}
        {/* Moved down to top-6 left-4 to avoid safe areas/status bars */}
        <div 
          className="absolute top-6 left-4 pointer-events-auto cursor-pointer z-[60] transform hover:scale-105 transition-transform"
          onClick={onOpenMenu}
        >
          {/* Roblox Logo Shape */}
          <div className="w-10 h-10 md:w-11 md:h-11 bg-[#232527]/90 backdrop-blur-md rounded-lg border border-white/20 flex items-center justify-center shadow-lg active:scale-95 transition-all">
             <div className="w-5 h-5 md:w-6 md:h-6 bg-white rounded-[2px] md:rounded-[4px] transform rotate-[12deg] border-[2px] md:border-[2.5px] border-white flex items-center justify-center">
                 <div className="w-2 h-2 md:w-2.5 md:h-2.5 bg-[#232527] rounded-[0.5px] md:rounded-[1px]"></div>
             </div>
          </div>
        </div>

        {/* Leaderboard - Top Right */}
        <div className="absolute top-6 right-4 w-32 md:w-40 bg-black/40 text-white rounded-lg p-2 md:p-3 text-[10px] md:text-xs backdrop-blur-sm z-45 pointer-events-auto">
          <div className="font-bold border-b border-white/20 pb-1 mb-1">Leaderboard</div>
          <div className="space-y-1">
             {/* Show top 3 players in HUD */}
             {players.slice(0, 3).map(p => (
                <div key={p.id} className="flex justify-between py-0.5">
                    <span className={`truncate w-20 md:w-24 ${p.isLocal ? 'text-yellow-400 font-bold' : 'text-white'}`}>{p.username}</span>
                    <span className="font-mono text-gray-300">{p.level}</span>
                </div>
             ))}
          </div>
        </div>
      </div>
    );
  }

  // PAUSED MENU (Roblox Style)
  return (
    <div className="fixed inset-0 bg-[#000000]/70 backdrop-blur-sm z-[100] flex items-center justify-center p-4 pointer-events-auto">
      <div className="bg-[#232527] w-full max-w-[600px] rounded-xl shadow-2xl flex flex-col overflow-hidden max-h-[80vh] border border-[#ffffff]/10">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[#ffffff]/10 bg-[#111213]">
            <div className="flex items-center gap-2">
                 <div className="w-8 h-8 bg-white/10 rounded-md flex items-center justify-center">
                    <div className="w-4 h-4 bg-white rounded-[3px] transform rotate-[12deg] flex items-center justify-center">
                        <div className="w-1.5 h-1.5 bg-[#232527] rounded-[0.5px]"></div>
                    </div>
                 </div>
                 <span className="font-bold text-xl tracking-wide">{t('menu')}</span>
            </div>
            <button onClick={onResume} className="text-gray-400 hover:text-white text-2xl">&times;</button>
        </div>

        {/* Tabs */}
        <div className="flex bg-[#111213] px-4 gap-1">
          <button 
            className={`py-3 px-6 font-bold text-sm rounded-t-lg transition-colors ${activeTab === 'players' ? 'bg-[#232527] text-white' : 'text-gray-400 hover:text-white hover:bg-[#232527]/50'}`}
            onClick={() => setActiveTab('players')}
          >
            {t('players')}
          </button>
          <button 
            className={`py-3 px-6 font-bold text-sm rounded-t-lg transition-colors ${activeTab === 'settings' ? 'bg-[#232527] text-white' : 'text-gray-400 hover:text-white hover:bg-[#232527]/50'}`}
            onClick={() => setActiveTab('settings')}
          >
            {t('settings')}
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-y-auto bg-[#232527]">
          {activeTab === 'players' && (
            <div className="space-y-2">
              {players.map(player => (
                  <div key={player.id} className="flex items-center gap-3 bg-[#393b3d] p-3 rounded-lg border border-white/5 hover:bg-[#4a4c4e] transition-colors">
                    {/* Dynamic Avatar Icon based on player shirt color */}
                    <div 
                        className="w-10 h-10 rounded-full flex items-center justify-center text-lg border-2 border-white/10 shadow-sm"
                        style={{ backgroundColor: player.appearance.shirt }}
                    >
                        <div className="w-6 h-6 rounded-full bg-white/20"></div>
                    </div>
                    
                    <div className="flex flex-col">
                        <span className={`font-bold text-sm ${player.isLocal ? 'text-yellow-400' : 'text-white'}`}>
                            {player.username} {player.isLocal && "(You)"}
                        </span>
                        <span className="text-xs text-gray-400">{player.displayName}</span>
                    </div>
                    
                    <div className="ml-auto bg-white/10 px-2 py-1 rounded text-xs font-mono">
                        Lvl {player.level}
                    </div>
                  </div>
              ))}
            </div>
          )}

          {activeTab === 'settings' && (
            <div className="space-y-6">
              {/* Graphics Quality */}
              <div className="bg-[#111213] p-3 rounded-lg">
                <div className="flex justify-between mb-2">
                    <span className="font-semibold text-sm">{t('graphics')}</span>
                </div>
                <div className="flex gap-2">
                    {(['low', 'medium', 'high'] as GraphicsQuality[]).map((q) => (
                        <button
                            key={q}
                            onClick={() => handleGraphicsChange(q)}
                            className={`flex-1 py-2 text-xs font-bold rounded-md border transition-all ${
                                settings.graphics === q 
                                ? 'bg-white text-black border-white' 
                                : 'bg-[#232527] text-gray-400 border-gray-700 hover:border-gray-500'
                            }`}
                        >
                            {t(`graphics_${q}` as any)}
                        </button>
                    ))}
                </div>
              </div>

              {/* FOV */}
              <div className="bg-[#111213] p-3 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-sm">{t('fov')}</span>
                  <span className="text-gray-400 text-xs">{settings.fov}</span>
                </div>
                <input 
                  type="range" 
                  min="60" max="110" 
                  value={settings.fov} 
                  onChange={(e) => onSettingsChange({...settings, fov: parseInt(e.target.value)})}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>

              {/* Volume */}
              <div className="bg-[#111213] p-3 rounded-lg">
                <div className="flex justify-between mb-2">
                  <span className="font-semibold text-sm">{t('volume')}</span>
                  <span className="text-gray-400 text-xs">{settings.volume}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" max="100" 
                  value={settings.volume} 
                  onChange={(e) => onSettingsChange({...settings, volume: parseInt(e.target.value)})}
                  className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-white"
                />
              </div>

              {/* Shadows Toggle (Secondary to Graphics) */}
               <div className="flex justify-between items-center bg-[#111213] p-3 rounded-lg">
                <span className="font-semibold text-sm text-gray-400">{t('shadows')} (Custom)</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={settings.shadows}
                    onChange={(e) => onSettingsChange({...settings, shadows: e.target.checked})}
                  />
                  <div className="w-10 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-[#00b06f]"></div>
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#111213] border-t border-[#ffffff]/10 flex gap-3">
          <button 
             className="flex-1 py-3 px-4 rounded-lg font-bold text-sm bg-[#393b3d] hover:bg-[#4a4c4e] text-white transition-colors"
             onClick={onLeave}
          >
            {t('leave')}
          </button>
          <button 
            onClick={onResume}
            className="flex-1 py-3 px-4 rounded-lg font-bold text-sm bg-white text-black hover:bg-gray-200 transition-colors"
          >
            {t('resume')}
          </button>
        </div>
      </div>
    </div>
  );
};