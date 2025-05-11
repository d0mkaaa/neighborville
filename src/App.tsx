import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AppLayout from './components/ui/AppLayout';
import Login from './components/game/Login';
import NeighborVille from './components/game/NeighborVille';
import Button from './components/ui/Button';
import { Play, Save } from 'lucide-react';
import type { GameProgress, TimeOfDay } from './types/game';

function App() {
  const [gameStarted, setGameStarted] = useState(false);
  const [gameState, setGameState] = useState<GameProgress | null>(null);
  const [loading, setLoading] = useState(true);
  const [showContinueModal, setShowContinueModal] = useState(false);
  const [savedGameFound, setSavedGameFound] = useState<GameProgress | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false);
      
      const savedGame = localStorage.getItem('neighborville_save');
      if (savedGame) {
        try {
          const parsed = JSON.parse(savedGame) as GameProgress;
          setSavedGameFound(parsed);
          setShowContinueModal(true);
          return;
        } catch (error) {
          console.error('Failed to parse saved game', error);
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
          console.error('Failed to parse autosave', error);
        }
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleStartNewGame = (playerName: string) => {
    localStorage.removeItem('neighborville_save');
    
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
    }
  };

  const handleShowLogin = () => {
    setShowContinueModal(false);
  };

  const handleLoadGame = (gameData: GameProgress) => {
    setGameState(gameData);
    setGameStarted(true);
    setShowContinueModal(false);
    setShowTutorial(false);
  };

  if (loading) {
    return (
      <AppLayout showFooter={false}>
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
      <AppLayout showFooter={false}>
        <div className="flex items-center justify-center min-h-screen p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-xl p-8 max-w-md w-full shadow-xl"
          >
            <h2 className="text-2xl font-medium text-emerald-800 mb-4 lowercase">
              welcome back!
            </h2>
            <p className="text-gray-600 mb-6">
              We found a saved game for {savedGameFound.playerName} on day {savedGameFound.day}.
              Would you like to continue playing?
            </p>
            <div className="flex gap-3">
              <Button
                variant="success"
                fullWidth
                icon={<Play size={16} />}
                onClick={handleContinueGame}
              >
                continue game
              </Button>
              <Button
                variant="outline"
                fullWidth
                onClick={handleShowLogin}
              >
                new game
              </Button>
            </div>
          </motion.div>
        </div>
      </AppLayout>
    );
  }

  if (!gameStarted) {
    return (
      <AppLayout showFooter={true}>
        <Login 
          onStartGame={handleStartNewGame}
          onLoadGame={handleLoadGame}
          onShowTutorial={() => {}}
        />
      </AppLayout>
    );
  }

  return (
    <NeighborVille 
      initialGameState={gameState} 
      showTutorialProp={showTutorial}
    />
  );
}

export default App;