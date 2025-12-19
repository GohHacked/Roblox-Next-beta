import React, { useState } from 'react';
import { Language } from '../types';
import { getTranslation } from '../translations';
import { auth } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';

interface LoginScreenProps {
  onLogin: (username: string, uid: string) => void;
  lang: Language;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin, lang }) => {
  const [mode, setMode] = useState<'login' | 'signup'>('signup');
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const t = (key: any) => getTranslation(lang, key);

  const handleAuth = async () => {
      setError('');
      setLoading(true);

      const cleanEmail = email.trim();
      const cleanPass = password.trim();
      const cleanUser = username.trim();

      if (!cleanEmail || !cleanPass) {
        setError("Email and Password are required.");
        setLoading(false);
        return;
      }

      if (mode === 'signup' && (!cleanUser || cleanUser.length < 3)) {
        setError("Username must be at least 3 characters.");
        setLoading(false);
        return;
      }

      try {
        if (mode === 'signup') {
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPass);
                // Save display name (username) to profile
                await updateProfile(userCredential.user, {
                    displayName: cleanUser
                });
                onLogin(cleanUser, userCredential.user.uid);
            } catch (err: any) {
                // If email exists, try to log in automatically
                if (err.code === 'auth/email-already-in-use') {
                    try {
                        const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
                        const display = userCredential.user.displayName || cleanUser;
                        onLogin(display, userCredential.user.uid);
                        return;
                    } catch (loginErr) {
                        // If password was wrong during auto-login attempt
                        setMode('login');
                        setError("Account already exists. Please enter correct password.");
                        setLoading(false);
                        return;
                    }
                }
                throw err; // Re-throw other errors
            }
        } else {
            const userCredential = await signInWithEmailAndPassword(auth, cleanEmail, cleanPass);
            const display = userCredential.user.displayName || cleanEmail.split('@')[0];
            onLogin(display, userCredential.user.uid);
        }
      } catch (err: any) {
        console.error(err);
        if (err.code === 'auth/invalid-credential') {
            setError("Invalid email or password.");
        } else if (err.code === 'auth/weak-password') {
            setError("Password should be at least 6 characters.");
        } else {
            setError(err.message || "Authentication failed.");
        }
      } finally {
        if (!error) setLoading(false);
      }
  };

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#1b1d1e] font-sans animate-fade-in">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden">
         <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-600/20 rounded-full blur-[120px]"></div>
         <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-600/20 rounded-full blur-[120px]"></div>
         <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550745165-9bc0b252726f?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 bg-[#232527]/90 p-8 rounded-xl shadow-2xl w-[420px] backdrop-blur-md border border-[#ffffff]/10">
        <div className="mb-6 flex flex-col items-center">
           {/* Tab Switcher */}
           <div className="flex bg-[#111213] rounded-lg p-1 w-full mb-4">
              <button 
                onClick={() => { setMode('signup'); setError(''); }}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'signup' ? 'bg-[#393b3d] text-white shadow' : 'text-gray-500 hover:text-white'}`}
              >
                  {t('signup_btn')}
              </button>
              <button 
                onClick={() => { setMode('login'); setError(''); }}
                className={`flex-1 py-2 text-sm font-bold rounded-md transition-all ${mode === 'login' ? 'bg-[#393b3d] text-white shadow' : 'text-gray-500 hover:text-white'}`}
              >
                  {t('login_link')}
              </button>
           </div>
          
          <h2 className="text-2xl font-extrabold text-white mb-2 tracking-tight">
            {mode === 'signup' ? t('login_title') : 'Welcome Back'}
          </h2>
          <p className="text-gray-400 text-sm">{t('login_subtitle')}</p>
        </div>

        <div className="space-y-4">
          
          {/* Email Field (Required for both) */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => { setEmail(e.target.value); setError(''); }}
              className={`w-full bg-[#111213] border rounded-md px-3 py-2.5 text-white text-sm focus:ring-1 focus:ring-white outline-none placeholder-gray-600 transition-all ${error ? 'border-red-500' : 'border-gray-700 focus:border-white'}`}
              placeholder="name@example.com"
            />
          </div>

          {/* Username (Signup Only) */}
          {mode === 'signup' && (
              <div className="animate-fade-in">
                <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">{t('username')}</label>
                <input 
                  type="text" 
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setError(''); }}
                  className={`w-full bg-[#111213] border rounded-md px-3 py-2.5 text-white text-sm focus:ring-1 focus:ring-white outline-none placeholder-gray-600 transition-all ${error ? 'border-red-500' : 'border-gray-700 focus:border-white'}`}
                  placeholder={t('placeholder_user')}
                />
              </div>
          )}

          {/* Password Section */}
          <div>
            <label className="block text-xs font-bold text-gray-400 mb-1.5 uppercase tracking-wide">{t('password')}</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => { setPassword(e.target.value); setError(''); }}
              className={`w-full bg-[#111213] border rounded-md px-3 py-2.5 text-white text-sm focus:ring-1 focus:ring-white outline-none placeholder-gray-600 transition-all ${error ? 'border-red-500' : 'border-gray-700 focus:border-white'}`}
              placeholder={t('placeholder_pass')}
            />
          </div>
          
          {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-200 text-xs font-semibold animate-pulse">
                  {error}
              </div>
          )}

          {/* Submit Button */}
          <button 
            onClick={handleAuth}
            disabled={loading}
            className={`w-full bg-white hover:bg-gray-100 active:scale-[0.98] text-black font-bold text-lg py-3 rounded-md transition-all shadow-[0_0_15px_rgba(255,255,255,0.1)] mt-4 ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {loading ? "Please wait..." : (mode === 'signup' ? t('signup_btn') : "Log In")}
          </button>
        </div>

        <div className="mt-6 text-center text-xs text-gray-400">
          {mode === 'signup' ? t('already_account') : "Don't have an account?"} 
          <span 
             className="text-white font-bold cursor-pointer hover:underline ml-1"
             onClick={() => {
                 setMode(mode === 'signup' ? 'login' : 'signup');
                 setError('');
             }}
          >
             {mode === 'signup' ? t('login_link') : t('signup_btn')}
          </span>
        </div>
      </div>
    </div>
  );
};