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
import { loadGameFromServer, saveGameToServer } from './services/gameService';
import Leaderboard from './components/profile/Leaderboard';
import PublicProfileModal from './components/profile/PublicProfileModal';

const AUTO_SAVE_INTERVAL = 5 * 60 * 1000;

function App() {
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameProgress, setGameProgress] = useState<GameProgress | null>(null);
  const [gameLoaded, setGameLoaded] = useState<boolean>(false);
  const [gameLoading, setGameLoading] = useState<boolean>(false);
  
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [showProfileSettings, setShowProfileSettings] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showPublicProfileModal, setShowPublicProfileModal] = useState<boolean>(false);
  const [profileToView, setProfileToView] = useState<string | null>(null);
  
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  
  const { user, isAuthenticated, login, isLoading } = useAuth();
  
  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        setShowAuth(true);
      } else if (user && (!user.username || user.username.includes('@'))) {
        setShowAuth(true);
      }
    }
  }, [isAuthenticated, user, isLoading]);

  useEffect(() => {
    if (gameStarted && !isAuthenticated) {
      setGameStarted(false);
      setShowAuth(true);
    }
  }, [gameStarted, isAuthenticated]);
  
  const handleLoginSuccess = (userData: { id: string; username: string; email?: string }) => {
    console.log('Login successful:', userData.username);
    
    if (!userData || !userData.id) {
      console.error('Invalid user data in login callback');
      return;
    }
    
    login({
      id: userData.id,
      username: userData.username || '',
      email: userData.email || '',
      verified: true,
    });
    
    setTimeout(() => {
      if (userData.username) {
        setShowAuth(false);
      } else {
        console.warn('No username in login data, keeping auth modal open');
      }
    }, 500);
  };
  
  const handleStartGame = (playerName: string) => {
    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }
    
    if (!user?.username || user.username.includes('@')) {
      setShowAuth(true);
      return;
    }
    
    const newGameProgress: GameProgress = {
      playerName,
      coins: 2000,
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
      weather: 'sunny',
      saveTimestamp: Date.now(),
      saveName: `${playerName}'s City`
    };
    
    setGameProgress(newGameProgress);
    setGameStarted(true);
    setGameLoaded(true);
    
    if (isAuthenticated) {
      saveGameToServer(newGameProgress).catch(error => {
        console.error('Error saving initial game state:', error);
      });
    }
  };
  
  const handleLoadGame = (savedGameProgress: GameProgress) => {
    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }
    
    setGameLoading(true);
    
    setTimeout(() => {
      setGameProgress(savedGameProgress);
      setGameStarted(true);
      setGameLoaded(true);
      setGameLoading(false);
    }, 800);
  };
  
  useEffect(() => {
    let autoSaveInterval: ReturnType<typeof setInterval>;
    
    if (gameStarted && isAuthenticated && gameProgress) {
      autoSaveInterval = setInterval(() => {
        if (gameProgress) {
          const updatedProgress = {
            ...gameProgress,
            saveTimestamp: Date.now(),
            saveName: `${gameProgress.playerName}'s City (Auto Save)`
          };
          
          saveGameToServer(updatedProgress)
            .then(success => {
              if (success) {
                console.log('Game auto-saved successfully');
              } else {
                console.warn('Failed to auto-save game');
              }
            })
            .catch(error => {
              console.error('Error during auto-save:', error);
            });
        }
      }, AUTO_SAVE_INTERVAL);
    }
    
    return () => {
      if (autoSaveInterval) clearInterval(autoSaveInterval);
    };
  }, [gameStarted, isAuthenticated, gameProgress]);
  
  useEffect(() => {
    if (isAuthenticated && user?.id && !gameStarted) {
      try {
        loadGameFromServer()
          .then(response => {
            if (response && response.gameData) {
              console.log('Found saved game for user:', user.id);
            }
            setGameLoading(false);
          })
          .catch(error => {
            console.error('Error loading saved game:', error);
            setGameLoading(false);
          });
      } catch (error) {
        console.error('Error calling loadGameFromServer:', error);
        setGameLoading(false);
      }
    }
  }, [isAuthenticated, user?.id, gameStarted]);
  
  const handleViewProfile = (userId: string) => {
    setProfileToView(userId);
    setShowPublicProfileModal(true);
  };
  
  const handleShowTutorial = () => {
    console.log('Show tutorial');
  };
  
  return (
    <main className="h-screen w-full overflow-hidden relative bg-gradient-to-b from-sky-100 to-blue-200">
      <BackgroundBubbles />
      
      <AnimatePresence mode="wait">
        {!gameStarted && (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="h-full w-full flex flex-col"
          >
            <Login 
              onStartGame={handleStartGame} 
              onLoadGame={handleLoadGame}
              onShowTutorial={handleShowTutorial}
            />
          </motion.div>
        )}
        
        {gameStarted && gameProgress && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="h-full w-full flex flex-col"
          >
            <NeighborVille 
              initialGameState={gameProgress}
              onTimeChange={setTimeOfDay}
              onLoadGame={handleLoadGame}
              showTutorialProp={false}
            />
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Floating action buttons */}
      {!gameStarted && (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2">
          {isAuthenticated ? (
            <>
              <Button
                onClick={() => setShowProfileSettings(true)}
                variant="glass"
                size="sm"
                className="w-12 h-12 rounded-full shadow-md"
              >
                <Settings size={20} />
              </Button>
              
              <Button
                onClick={() => setShowLeaderboard(true)}
                variant="glass"
                size="sm"
                className="w-12 h-12 rounded-full shadow-md"
              >
                <Trophy size={20} />
              </Button>
            </>
          ) : (
            <Button
              onClick={() => setShowAuth(true)}
              variant="glass"
              size="sm"
              className="w-12 h-12 rounded-full shadow-md"
            >
              <Users size={20} />
            </Button>
          )}
        </div>
      )}
      
      {/* Modals */}
      <AnimatePresence>
        {showAuth && (
          <AuthModal
            onClose={() => {
              if (isAuthenticated && user?.username && !user.username.includes('@')) {
                setShowAuth(false);
              }
            }}
            onLogin={handleLoginSuccess}
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
        
        {showPublicProfileModal && profileToView && (
          <PublicProfileModal
            userId={profileToView}
            onClose={() => {
              setShowPublicProfileModal(false);
              setProfileToView(null);
            }}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

export default App;