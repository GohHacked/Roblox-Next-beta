import React, { useState } from 'react';
import { Language, PlayerAppearance } from '../types';
import { getTranslation } from '../translations';

interface AvatarEditorProps {
  username: string;
  initialAppearance: PlayerAppearance;
  currentLang: Language;
  onSave: (appearance: PlayerAppearance, lang: Language) => void;
  onBack: () => void;
}

export const AvatarEditor: React.FC<AvatarEditorProps> = ({ username, initialAppearance, currentLang, onSave, onBack }) => {
  const [appearance, setAppearance] = useState<PlayerAppearance>(initialAppearance);
  const [tempLang, setTempLang] = useState<Language>(currentLang);

  const t = (key: any) => getTranslation(tempLang, key);

  // Hex colors for selection
  const skinColors = ['#ffcd38', '#d49e00', '#7d5a3c', '#ffdfc4', '#5e4033'];
  const clothColors = ['#0088ff', '#c41e3a', '#228b22', '#333333', '#f5f5f5', '#800080', '#ff69b4', '#ffa500'];

  const handleSave = () => {
    // This calls back to App.tsx, which updates state, which triggers the DB write via useEffect
    onSave(appearance, tempLang);
  };

  const ColorSection = ({ label, current, options, onChange }: { label: string, current: string, options: string[], onChange: (c: string) => void }) => (
    <div className="mb-4">
        <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">{label}</label>
        <div className="grid grid-cols-6 gap-2">
            {options.map(c => (
                <button
                    key={c}
                    onClick={() => onChange(c)}
                    className={`w-8 h-8 rounded-full transition-transform hover:scale-110 border-2 ${current === c ? 'border-white' : 'border-transparent'}`}
                    style={{ backgroundColor: c }}
                />
            ))}
        </div>
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#191b1d] text-white font-['Segoe_UI'] animate-fade-in">
      {/* Header */}
      <nav className="h-14 bg-[#232527] flex items-center px-4 border-b border-[#393b3d]">
        <button onClick={onBack} className="text-gray-400 hover:text-white mr-4 text-2xl">
           &larr;
        </button>
        <span className="font-bold text-xl">{t('profile_editor')}</span>
      </nav>

      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center">
        <div className="w-full max-w-[900px] flex flex-col md:flex-row gap-8">
          
          {/* Left Column: Character Preview */}
          <div className="md:w-1/3 flex flex-col items-center">
             <div className="bg-[#232527] border border-[#ffffff]/10 rounded-xl p-6 w-full flex flex-col items-center shadow-lg min-h-[400px] justify-center">
                {/* CSS Character Construction */}
                <div className="relative transform scale-150 mb-8">
                    {/* Head */}
                    <div className="w-12 h-12 rounded-lg mx-auto mb-1 relative border-2 border-black/10" style={{ backgroundColor: appearance.skin }}>
                        {/* Face */}
                        <div className="absolute top-4 left-3 w-1.5 h-1.5 bg-black rounded-full opacity-70"></div>
                        <div className="absolute top-4 right-3 w-1.5 h-1.5 bg-black rounded-full opacity-70"></div>
                        <div className="absolute bottom-3 left-4 w-4 h-1.5 border-b-2 border-black/50 rounded-full"></div>
                    </div>
                    {/* Torso & Arms */}
                    <div className="flex items-start justify-center gap-1">
                         <div className="w-4 h-12 rounded-b-md border-2 border-black/10" style={{ backgroundColor: appearance.skin }}></div>
                         <div className="w-16 h-16 rounded-md border-2 border-black/10 flex items-center justify-center" style={{ backgroundColor: appearance.shirt }}>
                            <div className="text-white/20 font-bold text-xs">R</div>
                         </div>
                         <div className="w-4 h-12 rounded-b-md border-2 border-black/10" style={{ backgroundColor: appearance.skin }}></div>
                    </div>
                    {/* Legs */}
                    <div className="flex justify-center gap-1 mt-1">
                         <div className="w-7 h-16 rounded-b-lg border-2 border-black/10" style={{ backgroundColor: appearance.pants }}></div>
                         <div className="w-7 h-16 rounded-b-lg border-2 border-black/10" style={{ backgroundColor: appearance.pants }}></div>
                    </div>
                </div>

                <h2 className="text-2xl font-bold mb-1">{username}</h2>
                <p className="text-gray-500 text-sm">@Player</p>
             </div>
          </div>

          {/* Right Column: Editor */}
          <div className="md:w-2/3 space-y-6">
            
            {/* Appearance Section */}
            <div className="bg-[#232527] border border-[#ffffff]/10 rounded-xl p-6 shadow-lg">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="text-blue-400">🎨</span> {t('appearance')}
                </h3>
                
                <ColorSection 
                    label={t('skin_tone')} 
                    current={appearance.skin} 
                    options={skinColors}
                    onChange={(c) => setAppearance({...appearance, skin: c})}
                />
                
                <ColorSection 
                    label={t('shirt_color')} 
                    current={appearance.shirt} 
                    options={clothColors}
                    onChange={(c) => setAppearance({...appearance, shirt: c})}
                />

                <ColorSection 
                    label={t('pants_color')} 
                    current={appearance.pants} 
                    options={clothColors}
                    onChange={(c) => setAppearance({...appearance, pants: c})}
                />
            </div>

            {/* Application Settings Section */}
            <div className="bg-[#232527] border border-[#ffffff]/10 rounded-xl p-6 shadow-lg">
                 <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <span className="text-gray-400">⚙️</span> {t('app_settings')}
                </h3>
                
                {/* Language Selector */}
                 <div>
                    <label className="block text-xs font-bold text-gray-400 mb-2 uppercase">{t('language')}</label>
                    <div className="flex bg-[#111213] rounded-lg p-1 w-fit border border-[#393b3d]">
                        <button 
                            onClick={() => setTempLang('en')}
                            className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${tempLang === 'en' ? 'bg-[#393b3d] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            English
                        </button>
                        <button 
                             onClick={() => setTempLang('ru')}
                             className={`px-4 py-2 rounded-md text-sm font-semibold transition-all ${tempLang === 'ru' ? 'bg-[#393b3d] text-white shadow' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            Русский
                        </button>
                    </div>
                 </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-4 pt-2">
                <button 
                    onClick={handleSave}
                    className="bg-[#00b06f] hover:bg-[#009e63] text-white px-8 py-3 rounded-lg font-bold text-lg shadow-lg transition-transform active:scale-95"
                >
                    {t('save')}
                </button>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
};