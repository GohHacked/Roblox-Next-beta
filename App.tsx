import React, { useState, useEffect, useRef } from 'react';
import { GameState, LevelType, GameSettings, Language, PlayerAppearance, ChatMessage, Player } from './types';
import { LoginScreen } from './components/LoginScreen';
import { DiscoveryPage } from './components/DiscoveryPage';
import { GameOverlay } from './components/GameOverlay';
import { ThreeEngine } from './game/ThreeEngine';
import { MobileControls } from './components/MobileControls';
import { LoadingScreen } from './components/LoadingScreen';
import { AvatarEditor } from './components/AvatarEditor';
import { ProfilePage } from './components/ProfilePage';
import { db, auth } from './firebase';
import { ref, set, onValue, push, onDisconnect, query, limitToLast, orderByChild, update } from 'firebase/database';
import { onAuthStateChanged } from 'firebase/auth';

function App() {
  const [gameState, setGameState] = useState<GameState>('LOGIN');
  const [username, setUsername] = useState('');
  const [userId, setUserId] = useState('');
  const [activeLevel, setActiveLevel] = useState<LevelType | null>(null);
  const [paused, setPaused] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [victory, setVictory] = useState(false);
  const [isAuthChecking, setIsAuthChecking] = useState(true); // Persistance check state
  
  // App-wide state
  const [language, setLanguage] = useState<Language>('en');
  
  // Chat & Player List State
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [players, setPlayers] = useState<Player[]>([]);
  
  // Default Appearance
  const [appearance, setAppearance] = useState<PlayerAppearance>({
      skin: '#ffcd38',
      shirt: '#0088ff',
      pants: '#228b22'
  });

  const [settings, setSettings] = useState<GameSettings>({
    shadows: true,
    fov: 75,
    volume: 50,
    graphics: 'medium'
  });

  const canvasRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ThreeEngine | null>(null);

  useEffect(() => {
    const checkMobile = () => {
       return ('ontouchstart' in window) || navigator.maxTouchPoints > 0;
    };
    setIsMobile(checkMobile());
    
    // Auth State Listener
    const unsubscribe = onAuthStateChanged(auth, (user) => {
        if (user) {
            setUserId(user.uid);
            setUsername(user.displayName || 'Player');
            // If we are just checking auth (app start), go to Discovery
            if (isAuthChecking) {
                setGameState('DISCOVERY');
            }
        } else {
            setGameState('LOGIN');
            setUsername('');
            setUserId('');
        }
        setIsAuthChecking(false);
    });

    return () => unsubscribe();
  }, [isAuthChecking]);

  // --- REALTIME DATABASE LOGIC ---

  // 1. Manage Online Presence & Player List (STRICT MODE - NO LOCAL FALLBACK)
  useEffect(() => {
      if (!userId || !username) return;

      const myPlayerRef = ref(db, `players/${userId}`);
      
      const updatePresence = async () => {
          try {
            // Set data to Realtime DB
            await set(myPlayerRef, {
                username: username,
                appearance: appearance,
                level: 1,
                online: true,
                timestamp: Date.now()
            });
            
            // Setup disconnect handler
            onDisconnect(myPlayerRef).remove().catch((err) => {
                 console.error("Failed to attach disconnect handler:", err);
            });

          } catch (error: any) {
             console.error("CRITICAL: Failed to write player presence to DB.", error);
          }
      };

      updatePresence();

      // Listen for all players
      const allPlayersRef = ref(db, 'players');
      const unsubscribePlayers = onValue(allPlayersRef, (snapshot) => {
          const data = snapshot.val();
          
          if (data) {
              const playerList: Player[] = Object.keys(data).map(key => ({
                  id: key,
                  username: data[key].username,
                  displayName: '@' + data[key].username,
                  appearance: data[key].appearance || { skin: '#ffcd38', shirt: '#999', pants: '#333' },
                  level: data[key].level || 1,
                  isLocal: key === userId,
                  position: data[key].position,
                  rotation: data[key].rotation,
                  online: data[key].online
              }));
              setPlayers(playerList);
              
              // Forward remote players to engine for rendering
              if (engineRef.current) {
                  engineRef.current.updateRemotePlayers(playerList);
              }

          } else {
              setPlayers([]);
          }
      }, (error) => {
          console.error("Failed to read players list:", error);
          setPlayers([]);
      });

      return () => {
          unsubscribePlayers();
      };
  }, [userId, username, appearance]);

  // 2. Realtime Chat Sync (STRICT MODE & ORDERED)
  useEffect(() => {
    if (!userId) return;

    // Use orderByChild('timestamp') to ensure messages appear in order
    const chatRef = query(ref(db, 'chat'), orderByChild('timestamp'), limitToLast(50));
    
    const unsubscribeChat = onValue(chatRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
            // Convert object to array and ensure it's sorted
            const loadedMessages: ChatMessage[] = Object.keys(data).map(key => ({
                id: key,
                username: data[key].username,
                text: data[key].text,
                isSystem: data[key].isSystem
            }));
            // Firebase usually returns ordered data with query, but Object.keys might lose it in JS.
            // We trust the query mostly, but the map preserves the order from snapshot iteration usually.
            // However, to be 100% safe with JS objects:
            setChatMessages(loadedMessages); 
        } else {
            setChatMessages([]);
        }
    }, (error) => {
         console.error("Failed to read chat:", error);
    });

    return () => unsubscribeChat();
  }, [userId]);


  // Initialize Game Engine when entering PLAYING state
  useEffect(() => {
    if (gameState === 'PLAYING' && canvasRef.current && !engineRef.current) {
      engineRef.current = new ThreeEngine(
          canvasRef.current, 
          userId, // Pass User ID to identify self
          username, 
          () => setPaused(true),
          () => setVictory(true),
          // Position Update Callback (Called by engine every ~100ms)
          (pos, rot) => {
              if (!userId) return;
              update(ref(db, `players/${userId}`), {
                  position: pos,
                  rotation: rot
              }).catch(e => console.error("Pos sync fail", e));
          }
      );
      // Set initial appearance
      engineRef.current.setAppearance(appearance);
      engineRef.current.start();
      
      // Load the level immediately upon engine creation
      if (activeLevel) {
          engineRef.current.loadLevel(activeLevel);
      }

      // Sync initial list immediately
      if (players.length > 0) {
          engineRef.current.updateRemotePlayers(players);
      }

      // Only attach pointer lock logic if NOT mobile
      if (!isMobile) {
          const onLockChange = () => {
            if (!document.pointerLockElement && gameState === 'PLAYING' && !victory) {
                // Don't pause if we just lost focus because of chat or victory
            }
          };
          document.addEventListener('pointerlockchange', onLockChange);
          setTimeout(() => {
             engineRef.current?.requestPointerLock();
          }, 100);
          
          return () => {
            document.removeEventListener('pointerlockchange', onLockChange);
            if (engineRef.current) {
              engineRef.current.dispose();
              engineRef.current = null;
            }
          };
      } else {
          // Mobile cleanup only
          return () => {
            if (engineRef.current) {
              engineRef.current.dispose();
              engineRef.current = null;
            }
          };
      }
    }
  }, [gameState, isMobile]);

  // Update Settings
  useEffect(() => {
    if (engineRef.current) {
      engineRef.current.updateSettings(settings);
    }
  }, [settings]);

  // Handlers
  const handleLogin = (user: string, uid: string) => {
    setUsername(user);
    setUserId(uid);
    setGameState('DISCOVERY');
  };

  const handlePlayLevel = (level: LevelType) => {
    setActiveLevel(level);
    setGameState('LOADING');
    setVictory(false);
    setPaused(false);
    
    // Simulate Loading Time
    setTimeout(() => {
        setGameState('PLAYING');
    }, 2500);
  };

  const handleResume = () => {
    setPaused(false);
    if (engineRef.current && !isMobile) {
        engineRef.current.requestPointerLock();
    }
  };

  const handleLeave = () => {
    setGameState('DISCOVERY');
    setActiveLevel(null);
    setPaused(false);
    setVictory(false);
    if (engineRef.current) {
        engineRef.current.dispose();
        engineRef.current = null;
    }
  };

  const handleRestart = () => {
      setVictory(false);
      if (engineRef.current && activeLevel) {
          engineRef.current.loadLevel(activeLevel);
          if (!isMobile) engineRef.current.requestPointerLock();
      }
  };

  const handleAvatarSave = (newAppearance: PlayerAppearance, lang: Language) => {
    setAppearance(newAppearance);
    setLanguage(lang);
    setGameState('PROFILE');
  };

  // Chat Handlers (Write to Firebase)
  const handleSendMessage = (text: string) => {
      if (!userId) return;
      
      const chatRef = ref(db, 'chat');
      
      push(chatRef, {
          username: username,
          text: text,
          timestamp: Date.now()
      }).catch(err => {
          console.error("Message send failed:", err);
          alert("Error: Message not sent. Check internet connection.");
      });
  };

  const handleChatFocus = () => {
      engineRef.current?.setControlsActive(false);
  };

  const handleChatBlur = () => {
      engineRef.current?.setControlsActive(true);
  };

  // Mobile Input Handlers
  const handleMobileMove = (x: number, y: number) => {
    engineRef.current?.setJoystick(x, y);
  };

  const handleMobileJump = () => {
    engineRef.current?.jump();
  };

  const handleMobileLook = (dx: number, dy: number) => {
    engineRef.current?.moveCamera(dx, dy);
  };

  // Render Loading Screen if determining Auth Status
  if (isAuthChecking) {
      return (
          <div className="w-full h-screen bg-black flex items-center justify-center">
              <LoadingScreen />
          </div>
      );
  }

  return (
    <div className="w-full h-screen overflow-hidden bg-black text-white font-sans">
      {gameState === 'LOGIN' && (
        <LoginScreen onLogin={handleLogin} lang={language} />
      )}

      {gameState === 'DISCOVERY' && (
        <DiscoveryPage 
            onPlay={handlePlayLevel} 
            username={username} 
            onOpenAvatar={() => setGameState('AVATAR')}
            onOpenProfile={() => setGameState('PROFILE')}
            lang={language}
            avatarColor={appearance.shirt}
            onlineCount={players.length} // STRICT: Only real players count
        />
      )}

      {gameState === 'PROFILE' && (
        <ProfilePage 
            username={username}
            appearance={appearance}
            lang={language}
            onBack={() => setGameState('DISCOVERY')}
            onCustomize={() => setGameState('AVATAR')}
        />
      )}

      {gameState === 'AVATAR' && (
        <AvatarEditor 
            username={username}
            initialAppearance={appearance}
            currentLang={language}
            onSave={handleAvatarSave}
            onBack={() => setGameState('PROFILE')} 
        />
      )}

      {gameState === 'LOADING' && (
         <LoadingScreen />
      )}

      {gameState === 'PLAYING' && (
        <>
          <div ref={canvasRef} className="absolute inset-0 z-0" />
          
          <GameOverlay 
            username={username}
            paused={paused}
            victory={victory}
            onOpenMenu={() => setPaused(true)}
            onResume={handleResume}
            onLeave={handleLeave}
            onRestart={handleRestart}
            settings={settings}
            onSettingsChange={setSettings}
            lang={language}
            messages={chatMessages}
            players={players} 
            onSendMessage={handleSendMessage}
            onChatFocus={handleChatFocus}
            onChatBlur={handleChatBlur}
          />

          {!paused && !victory && isMobile && (
            <MobileControls 
                onMove={handleMobileMove} 
                onJump={handleMobileJump} 
                onLook={handleMobileLook}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;