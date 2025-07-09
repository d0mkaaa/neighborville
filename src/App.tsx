import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from './components/ui/AppLayout';
import Login from './components/game/Login';
import NeighborVille from './components/game/NeighborVille';
import Button from './components/ui/Button';
import { Play, Save, Settings, Trophy, Users, Shield } from 'lucide-react';
import type { GameProgress, TimeOfDay } from './types/game';
import { useAuth } from './context/AuthContext';
import AuthModal from './components/auth/AuthModal';
import BackgroundBubbles from './components/game/BackgroundBubbles';
import ProfileSettings from './components/profile/ProfileSettings';
import { loadGameFromServer, saveGameToServer } from './services/gameService';
import Leaderboard from './components/profile/Leaderboard';
import PublicProfileModal from './components/profile/PublicProfileModal';
import SuspensionModal from './components/SuspensionModal';
import { useSuspensionCheck } from './hooks/useSuspensionCheck';
import TermsOfService from './components/legal/TermsOfService';
import PrivacyPolicy from './components/legal/PrivacyPolicy';
import GameWiki from './components/game/GameWiki';
import { ToastContainer } from './components/ui/Toast';
import './App.css';
import { NORMALIZED_API_URL } from './config/apiConfig';

const AUTO_SAVE_INTERVAL = 5 * 60 * 1000;

function App() {
  return (
    <Router>
      <div className="App">
        <AppLayout>
          <Routes>
            <Route path="/tos" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/" element={<GameApp />} />
          </Routes>
        </AppLayout>
        <ToastContainer />
      </div>
    </Router>
  );
}

function GameApp() {
  const [gameStarted, setGameStarted] = useState<boolean>(false);
  const [gameProgress, setGameProgress] = useState<GameProgress | null>(null);
  const [gameLoaded, setGameLoaded] = useState<boolean>(false);
  const [gameLoading, setGameLoading] = useState<boolean>(false);
  
  const [showAuth, setShowAuth] = useState<boolean>(false);
  const [showProfileSettings, setShowProfileSettings] = useState<boolean>(false);
  const [showLeaderboard, setShowLeaderboard] = useState<boolean>(false);
  const [showPublicProfileModal, setShowPublicProfileModal] = useState<boolean>(false);
  const [profileToView, setProfileToView] = useState<string | null>(null);
  const [showWiki, setShowWiki] = useState<boolean>(false);
  
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  
  const { user, isAuthenticated, login, logout, isLoading } = useAuth();
  const { isSuspended, suspensionData, isLoading: suspensionLoading, checkStatus } = useSuspensionCheck();
  const [forcedSuspensionData, setForcedSuspensionData] = useState<any>(null);
  
  useEffect(() => {
    const handleSuspension = (event: CustomEvent) => {
      console.log('Suspension event detected:', event.detail);
      setForcedSuspensionData(event.detail.suspensionData);
    };
    
    window.addEventListener('user:suspended', handleSuspension as EventListener);
    
    return () => {
      window.removeEventListener('user:suspended', handleSuspension as EventListener);
    };
  }, []);
  
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
  
  const handleStartGame = async (playerName: string, neighborhoodName?: string) => {
    if (isSuspended) {
      console.warn('Attempted to start game while suspended');
      return;
    }
    
    if (!isAuthenticated) {
      console.warn('Cannot start game: user not authenticated');
      setShowAuth(true);
      return;
    }
    
    try {
      setGameLoading(true);
      
      const response = await fetch(`${NORMALIZED_API_URL}/api/user/game/initialize`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeaders())
        },
        credentials: 'include',
        body: JSON.stringify({
          playerName: playerName.trim(),
          neighborhoodName: neighborhoodName?.trim() || 'My City'
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.gameData) {
        console.log('New game initialized successfully:', result.saveId);
        setGameProgress(result.gameData);
        setGameStarted(true);
        setGameLoaded(false);
      } else {
        console.error('Failed to initialize game:', result.message);
        
        if (response.status === 409) {
          console.log('User has existing game data, loading instead...');
          await handleLoadExistingGame();
        } else {
          throw new Error(result.message || 'Failed to initialize game');
        }
      }
    } catch (error) {
      console.error('Error starting new game:', error);
      setGameLoading(false);
    } finally {
      setGameLoading(false);
    }
  };
  
  const handleLoadExistingGame = async () => {
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/user/game/start`, {
        method: 'GET',
        headers: await getAuthHeaders(),
        credentials: 'include'
      });
      
      const result = await response.json();
      
      if (result.success && result.gameData) {
        console.log('Loaded existing game data:', result.saveId);
        setGameProgress(result.gameData);
        setGameStarted(true);
        setGameLoaded(true);
      } else {
        throw new Error('No game data available');
      }
    } catch (error) {
      console.error('Error loading existing game:', error);
      throw error;
    }
  };

  const getAuthHeaders = async () => {
    const token = document.cookie
      .split('; ')
      .find(row => row.startsWith('neighborville_auth='))
      ?.split('=')[1];
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  };
  
  const handleLoadGame = (savedGameProgress: GameProgress) => {
    if (!isAuthenticated) {
      setShowAuth(true);
      return;
    }
    
    if (isSuspended) {
      console.warn('Attempted to load game while suspended');
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
          saveGameToServer(gameProgress)
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
    console.log('Tutorial function called - redirecting to Wiki');
    handleShowWiki();
  };

  const handleShowWiki = () => {
    console.log('Opening Wiki from quick actions');
    setShowWiki(true);
  };

  const handleReturnToMenu = async () => {
    console.log('Returning to main menu from game');
    setGameStarted(false);
    setGameProgress(null);
  };
  
  const handleDeleteAccount = async () => {
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/user/delete-account`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        logout();
      } else {
        const data = await response.json();
        console.error('Failed to delete account:', data.message);
        alert(`Failed to delete account: ${data.message || 'Unknown error'}`);
      }
    } catch (error) {
      console.error('Error deleting account:', error);
      alert('Network error occurred while trying to delete account');
    }
  };
  
  return (
    <main className="h-screen w-full overflow-hidden relative bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100">
      <BackgroundBubbles />
      
      <AnimatePresence mode="wait">
        {!isSuspended && !gameStarted && (
          <motion.div
            key="login"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}
          >
            <Login 
              onStartGame={handleStartGame} 
              onLoadGame={handleLoadGame}
              onShowTutorial={handleShowTutorial}
              onShowWiki={handleShowWiki}
            />
          </motion.div>
        )}
        
        {!isSuspended && gameStarted && gameProgress && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}
          >
            <NeighborVille 
              initialGameState={gameProgress}
              onTimeChange={setTimeOfDay}
              onLoadGame={handleLoadGame}
              onReturnToMenu={handleReturnToMenu}
              showTutorialProp={!gameLoaded}
            />
          </motion.div>
        )}
        
        {isSuspended && suspensionLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              height: '100%', 
              width: '100%',
              background: 'linear-gradient(to bottom right, #fef2f2, #fef3e2)'
            }}
          >
            <div className="text-center">
              <Shield size={64} className="mx-auto mb-4 text-red-500 animate-pulse" />
              <h2 className="text-2xl font-bold mb-2 text-gray-800">Checking Account Status...</h2>
              <p className="text-gray-600">Please wait while we verify your account</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      

      
      <AnimatePresence>
        {!isSuspended && showAuth && (
          <AuthModal
            onClose={() => {
              if (isAuthenticated && user?.username && !user.username.includes('@')) {
                setShowAuth(false);
              }
            }}
            onLogin={handleLoginSuccess}
          />
        )}
        
        {!isSuspended && showProfileSettings && (
          <ProfileSettings
            onClose={() => setShowProfileSettings(false)}
          />
        )}
        
        {!isSuspended && showLeaderboard && (
          <Leaderboard
            onClose={() => setShowLeaderboard(false)}
            onViewProfile={handleViewProfile}
          />
        )}
        
        {!isSuspended && showPublicProfileModal && profileToView && (
          <PublicProfileModal
            userId={profileToView}
            onClose={() => {
              setShowPublicProfileModal(false);
              setProfileToView(null);
            }}
          />
        )}
        
        {(isSuspended || forcedSuspensionData) && (suspensionData || forcedSuspensionData) && !suspensionLoading && (
          <SuspensionModal
            suspensionData={forcedSuspensionData || suspensionData}
            onLogout={logout}
            onDeleteAccount={handleDeleteAccount}
            onRefreshStatus={() => {
              if (forcedSuspensionData) {
                setForcedSuspensionData(null);
              }
              checkStatus();
            }}
          />
        )}
        
        {!isSuspended && showWiki && (
          <GameWiki
            isOpen={showWiki}
            onClose={() => setShowWiki(false)}
          />
        )}
      </AnimatePresence>
    </main>
  );
}

export default App;