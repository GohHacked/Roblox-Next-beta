import React from 'react';
import { Language, PlayerAppearance } from '../types';
import { getTranslation } from '../translations';

interface ProfilePageProps {
  username: string;
  appearance: PlayerAppearance;
  lang: Language;
  onBack: () => void;
  onCustomize: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ username, appearance, lang, onBack, onCustomize }) => {
  const t = (key: any) => getTranslation(lang, key);

  return (
    <div className="h-screen flex flex-col bg-[#191b1d] text-white font-['Segoe_UI'] animate-fade-in overflow-y-auto">
      {/* Navbar */}
      <nav className="h-12 bg-[#232527] flex items-center px-4 border-b border-[#393b3d] shrink-0 sticky top-0 z-10">
        <button onClick={onBack} className="text-gray-400 hover:text-white mr-4 text-xl font-bold flex items-center gap-2">
           <span>&larr;</span> {t('back')}
        </button>
        <span className="font-bold text-lg">{t('profile')}</span>
      </nav>

      <div className="flex-1 p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-[800px] space-y-4">
          
          {/* Header Card */}
          <div className="bg-[#232527] rounded-xl overflow-hidden shadow-lg border border-white/10 relative">
             {/* Cover Photo */}
             <div className="h-32 bg-gray-800"></div>
             
             <div className="px-6 pb-6 pt-0 relative flex flex-col md:flex-row items-center md:items-end gap-4 -mt-12">
                {/* Avatar Bubble */}
                <div className="w-32 h-32 rounded-full bg-[#191b1d] p-1 shadow-xl relative z-10 flex items-center justify-center overflow-hidden border-4 border-[#232527]">
                    <div className="transform scale-[0.6] translate-y-2">
                        {/* CSS Character Preview */}
                        <div className="relative">
                            {/* Head */}
                            <div className="w-16 h-16 rounded-lg mx-auto mb-1 relative border-2 border-black/10" style={{ backgroundColor: appearance.skin }}>
                                <div className="absolute top-5 left-4 w-2 h-2 bg-black rounded-full opacity-70"></div>
                                <div className="absolute top-5 right-4 w-2 h-2 bg-black rounded-full opacity-70"></div>
                                <div className="absolute bottom-4 left-5 w-6 h-2 border-b-4 border-black/50 rounded-full"></div>
                            </div>
                            {/* Body */}
                            <div className="flex items-start justify-center gap-1">
                                <div className="w-5 h-16 rounded-b-md border-2 border-black/10" style={{ backgroundColor: appearance.skin }}></div>
                                <div className="w-20 h-20 rounded-md border-2 border-black/10 flex items-center justify-center" style={{ backgroundColor: appearance.shirt }}>
                                    <div className="text-white/20 font-bold">R</div>
                                </div>
                                <div className="w-5 h-16 rounded-b-md border-2 border-black/10" style={{ backgroundColor: appearance.skin }}></div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* User Info */}
                <div className="flex-1 text-center md:text-left mt-2 md:mt-12">
                    <h1 className="text-2xl font-bold text-white">{username}</h1>
                    <p className="text-gray-400 text-sm">@Player • {t('join_date')}: 2024</p>
                </div>

                {/* Actions */}
                <div className="flex gap-3 mt-4 md:mt-0 mb-2">
                     <button 
                        onClick={onCustomize}
                        className="bg-[#393b3d] hover:bg-[#4a4c4e] border border-white/10 text-white font-bold px-4 py-2 rounded-lg text-sm transition-colors"
                     >
                        {t('customize')}
                     </button>
                </div>
             </div>
          </div>

          {/* Stats & About Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Left Col: About & Stats */}
              <div className="space-y-4">
                  <div className="bg-[#232527] rounded-xl p-4 shadow-lg border border-white/10">
                      <h3 className="font-bold text-lg mb-2">{t('about')}</h3>
                      <p className="text-sm text-gray-400 leading-relaxed italic">
                          ...
                      </p>
                  </div>

                   <div className="bg-[#232527] rounded-xl p-4 shadow-lg border border-white/10">
                      <h3 className="font-bold text-lg mb-4">{t('statistics')}</h3>
                      <div className="flex justify-between items-center py-2 border-b border-gray-700">
                          <span className="text-gray-400 text-sm">{t('friends')}</span>
                          <span className="font-bold">0</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-gray-700">
                          <span className="text-gray-400 text-sm">Followers</span>
                          <span className="font-bold">0</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                          <span className="text-gray-400 text-sm">{t('place_visits')}</span>
                          <span className="font-bold">0</span>
                      </div>
                  </div>
              </div>

              {/* Right Col: Balance & Collections */}
              <div className="md:col-span-2 space-y-4">
                  
                  {/* Robux Balance Card */}
                  <div className="bg-gradient-to-r from-gray-800 to-gray-900 rounded-xl p-6 shadow-lg border border-white/10 flex items-center justify-between">
                      <div>
                          <h3 className="text-gray-400 font-bold text-sm uppercase mb-1">{t('balance')}</h3>
                          <div className="text-3xl font-extrabold text-white flex items-center gap-2">
                              0 <span className="text-sm font-normal text-gray-400">{t('robux')}</span>
                          </div>
                      </div>
                      <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center text-2xl border border-white/20">
                          💎
                      </div>
                  </div>

                  {/* Badges / Inventory (Empty for realism) */}
                  <div className="bg-[#232527] rounded-xl p-4 shadow-lg border border-white/10 min-h-[200px]">
                      <h3 className="font-bold text-lg mb-4">Badges</h3>
                      <div className="flex items-center justify-center h-32 text-gray-500 text-sm">
                          You don't have any badges yet.
                      </div>
                  </div>

              </div>
          </div>

        </div>
      </div>
    </div>
  );
};