import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from './components/ui/AppLayout';
import Login from './components/game/Login';
import NeighborVille from './components/game/NeighborVille';
import Button from './components/ui/Button';
import { Play, Save, Settings, Trophy, Users } from 'lucide-react';
import type { GameProgress, TimeOfDay } from './types/game';
import { useAuth } from './context/AuthContext';
import AuthModal from './components/auth/AuthModal';
import BackgroundBubbles from './components/game/BackgroundBubbles';
import ProfileSettings from './components/profile/ProfileSettings';
import ContinueModal from './components/game/ContinueModal';
import { loadGameFromServer } from './services/gameService';
import Leaderboard from './components/profile/Leaderboard';
import PublicProfile from './components/profile/PublicProfile';
import SettingsModal from './components/game/SettingsModal';
import SaveManager from './components/game/SaveManager';
import { saveGameToServer } from './services/gameService';

function App() {
  const { user, isLoading: authLoading, isGuest, login, logout, refreshAuth } = useAuth();
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState<GameProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [savedGameFound, setSavedGameFound] = useState<GameProgress | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showPublicProfile, setShowPublicProfile] = useState(false);
  const [selectedUsername, setSelectedUsername] = useState<string>('');
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [showSettings, setShowSettings] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(true);
  const [audioRef, setAudioRef] = useState<React.RefObject<HTMLAudioElement> | null>(null);
  const [showPlayerStats, setShowPlayerStats] = useState(false);
  const [showSaveManager, setShowSaveManager] = useState(false);
  const [lastSaveTime, setLastSaveTime] = useState<Date | null>(null);

  useEffect(() => {
    const checkLoginStatus = async () => {
      if (authLoading) {
        return;
      }
      
      const storedName = localStorage.getItem('neighborville_playerName');
      
      if (user || storedName) {
        setShowAuthModal(false);
        
        if (storedName && !user) {
          setTimeout(async () => {
            await refreshAuth();
          }, 300);
        }
      } else {
        setShowAuthModal(true);
      }
    };
    
    checkLoginStatus();
  }, [user, authLoading]);
  
  useEffect(() => {
    const loadSavedGame = async () => {
      setLoading(true);
      
      if (user) {
        const { gameData: serverGameData } = await loadGameFromServer();
        
        if (serverGameData) {
          setSavedGameFound(serverGameData);
          setShowContinueModal(true);
          setLoading(false);
          return;
        }
        
        const savedGame = localStorage.getItem('neighborville_save');
        if (savedGame) {
          try {
            const parsed = JSON.parse(savedGame) as GameProgress;
            setSavedGameFound(parsed);
            setShowContinueModal(true);
            setLoading(false);
            return;
          } catch (error) {
          }
        }
        
        const keys = Object.keys(localStorage);
        const autosaveKey = keys.find(key => key.startsWith('neighborville_autosave'));
        if (autosaveKey) {
          try {
            const autosaveData = localStorage.getItem(autosaveKey);
            if (autosaveData) {
              const parsed = JSON.parse(autosaveData) as GameProgress;
              setSavedGameFound(parsed);
              setShowContinueModal(true);
            }
          } catch (error) {
          }
        }
      }
      
      setLoading(false);
    };
    
    if (!authLoading) {
      loadSavedGame();
    }
  }, [user, authLoading]);

  const handleStartFreshGame = (playerName: string) => {
    localStorage.removeItem('neighborville_save');
    localStorage.removeItem('neighborville_autosave');
    
    const initialState: GameProgress = {
      playerName: playerName,
      coins: 2000,
      happiness: 70,
      day: 1,
      level: 1,
      experience: 0,
      grid: Array(64).fill(null),
      gridSize: 16,
      neighbors: [],
      achievements: [],
      events: [],
      gameTime: 12,
      timeOfDay: 'day',
      recentEvents: [],
      bills: [],
      energyRate: 2,
      totalEnergyUsage: 0,
      lastBillDay: 0,
      coinHistory: [{
        id: crypto.randomUUID(),
        day: 1,
        balance: 2000,
        amount: 0,
        type: 'income',
        description: 'Initial balance',
        timestamp: Date.now()
      }],
      weather: 'sunny'
    };
    
    setGameState(initialState);
    setGameStarted(true);
    setShowContinueModal(false);
    setShowTutorial(true);
  };

  const handleContinueGame = () => {
    if (savedGameFound) {
      setGameState(savedGameFound);
      setGameStarted(true);
      setShowContinueModal(false);
      setShowTutorial(false);
      
      if (savedGameFound.timeOfDay) {
        setTimeOfDay(savedGameFound.timeOfDay);
      }
    }
  };

  const handleShowLogin = () => {
    setShowContinueModal(false);
    
    if (user) {
      if (confirm("Do you want to start a NEW game? This won't affect your saved game.")) {
        const playerName = user.username || localStorage.getItem('neighborville_playerName') || 'Mayor';
        handleStartFreshGame(playerName);
      } else {
        setShowContinueModal(true);
      }
    } else {
      setShowAuthModal(true);
    }
  };

  const handleLoadGame = (gameData: GameProgress) => {
    setGameState(gameData);
    setGameStarted(true);
    setShowContinueModal(false);
    setShowTutorial(false);
    
    if (gameData.timeOfDay) {
      setTimeOfDay(gameData.timeOfDay);
    }
  };

  const handleSaveGame = (gameData: GameProgress) => {
    localStorage.setItem('neighborville_save', JSON.stringify(gameData));
  };

  const handleExitGame = () => {
    setGameStarted(false);
    setGameState(null);
  };

  const handleViewProfile = (username: string) => {
    setSelectedUsername(username);
    setShowPublicProfile(true);
    setShowLeaderboard(false);
  };

  const handleTimeChange = (newTimeOfDay: TimeOfDay) => {
    setTimeOfDay(newTimeOfDay);
  };

  const toggleMusic = () => {
    setMusicEnabled(!musicEnabled);
  };

  const saveGameCallback = (name: string) => {
  };

  const handleLoadFromServer = async () => {
    if (isGuest) {
      alert('Cloud saves are only available for registered users. Please create an account to access your saves from any device.');
      return null;
    }

    try {
      setLoading(true);
      const { gameData, lastSave } = await loadGameFromServer();
      
      if (gameData) {
        setGameState(gameData);
        setLastSaveTime(lastSave);
        return gameData;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout 
        showFooter={false}
        showNavbar={false}
      >
        <div className="flex flex-col items-center justify-center h-screen">
          <div className="text-6xl mb-4">🏙️</div>
          <div className="text-xl text-gray-700 lowercase font-medium animate-pulse">
            loading neighborville...
          </div>
          <div className="mt-4 flex space-x-2">
            {[0, 1, 2].map((i) => (
              <div 
                key={i}
                className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 200}ms` }}
              />
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (showContinueModal && savedGameFound) {
    return (
      <AppLayout 
        showFooter={false}
        showNavbar={false}
      >
        <div className="flex items-center justify-center min-h-screen p-4">
          <ContinueModal
            savedGame={savedGameFound}
            onContinue={handleContinueGame}
            onNewGame={handleShowLogin}
          />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout
      timeOfDay={timeOfDay}
      showNavbar={!gameStarted}
      onShowLeaderboard={() => setShowLeaderboard(true)}
      onShowProfileSettings={() => setShowProfileSettings(true)}
      onShowLogin={() => setShowAuthModal(true)}
      onLogout={handleExitGame}
      isInGame={gameStarted}
      onExitGame={handleExitGame}
      onStartFreshGame={user ? () => {
        if (confirm("Do you want to start a new city? Your current save won't be affected.")) {
          handleStartFreshGame(user.username || 'Mayor');
        }
      } : undefined}
    >
      <BackgroundBubbles />
      <AnimatePresence>
        {showAuthModal && (
          <AuthModal 
            onClose={() => setShowAuthModal(false)}
            onLogin={(userData) => {
              login({
                ...userData,
                verified: true,
                email: userData.email || ''
              });
              setShowAuthModal(false);
            }}
          />
        )}

        {showProfileSettings && (
          <ProfileSettings 
            onClose={() => setShowProfileSettings(false)}
          />
        )}

        {showLeaderboard && (
          <Leaderboard
            onClose={() => setShowLeaderboard(false)}
            onViewProfile={handleViewProfile}
          />
        )}

        {showPublicProfile && (
          <PublicProfile
            username={selectedUsername}
            onClose={() => setShowPublicProfile(false)}
          />
        )}

        {showSettings && (
          <SettingsModal 
            isOpen={showSettings}
            onClose={() => setShowSettings(false)}
            musicEnabled={musicEnabled}
            onToggleMusic={toggleMusic}
            audioRef={audioRef}
            onShowTutorial={() => {
              setShowSettings(false);
              setShowTutorial(true);
            }}
            onShowStats={() => {
              setShowSettings(false);
              setShowPlayerStats(true);
            }}
            onShowLogin={() => {
              setShowSettings(false);
              setShowAuthModal(true);
            }}
          />
        )}
      </AnimatePresence>

      {loading ? (
        <div className="flex items-center justify-center h-full">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      ) : gameStarted ? (
        <NeighborVille 
          initialGameState={gameState} 
          showTutorialProp={showTutorial}
          onTimeChange={handleTimeChange}
        />
      ) : (
        <Login 
          onStartGame={handleStartFreshGame}
          onLoadGame={handleLoadGame}
          onShowTutorial={() => setShowTutorial(true)}
        />
      )}

      <SaveManager 
        isOpen={showSaveManager}
        onClose={() => setShowSaveManager(false)}
        onSave={(name) => saveGameCallback(name)}
        onSaveToServer={async () => {
          if (!gameState) {
            return false;
          }
          
          try {
            const result = await saveGameToServer(gameState);
            if (result) {
              setLastSaveTime(new Date());
              alert('Game saved to server!');
            } else {
              alert('Failed to save to server');
            }
            return result;
          } catch (error) {
            alert('Error saving to server');
            return false;
          }
        }}
        gameData={gameState || {
          playerName: '',
          coins: 0,
          happiness: 0,
          day: 1,
          level: 1,
          experience: 0,
          grid: [],
          gridSize: 16,
          neighbors: [],
          achievements: [],
          events: [],
          gameTime: 12,
          timeOfDay: 'day',
          recentEvents: [],
          bills: [],
          energyRate: 0,
          totalEnergyUsage: 0,
          lastBillDay: 0,
          coinHistory: [],
          weather: 'sunny'
        }}
        isAuthenticated={!!user && !user.isGuest}
        lastServerSaveTime={lastSaveTime}
        onShowLogin={() => setShowAuthModal(true)}
      />
    </AppLayout>
  );
}

export default App;