import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, Info, User, Play } from "lucide-react";
import BackgroundBubbles from "./BackgroundBubbles";
import type { GameProgress } from "../../types/game";
import GlassCard from "../ui/GlassCard";
import Button from "../ui/Button";
import SaveCard from "../ui/SaveCard";

const SAVE_KEY = "neighborville_save";

type LoginProps = {
  onStartGame: (playerName: string) => void;
  onLoadGame: (gameData: GameProgress) => void;
  onShowTutorial: () => void;
};

export default function Login({ onStartGame, onLoadGame, onShowTutorial }: LoginProps) {
  const [playerName, setPlayerName] = useState("");
  const [savedGames, setSavedGames] = useState<{key: string, name: string, date: string, data: GameProgress}[]>([]);
  const [showSaves, setShowSaves] = useState(false);
  
  useEffect(() => {
    loadSavedGames();
  }, []);
  
  const loadSavedGames = () => {
    try {
      const keys = Object.keys(localStorage);
      const gameKeys = keys.filter(key => key.startsWith(SAVE_KEY));
      
      if (gameKeys.length > 0) {
        setShowSaves(true);
      }
      
      const games = gameKeys.map(key => {
        const data = JSON.parse(localStorage.getItem(key) || "{}") as GameProgress;
        
        let timestamp = Date.now();
        const nameParts = key.split("_");
        
        if (nameParts.length > 2) {
          const possibleTimestamp = parseInt(nameParts[2]);
          if (!isNaN(possibleTimestamp)) {
            timestamp = possibleTimestamp;
          }
        }
        
        const date = new Date(timestamp).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
        
        return { 
          key,
          name: data.playerName || 'Unnamed Player', 
          date, 
          data 
        };
      });
      
      setSavedGames(games.sort((a, b) => {
        const dateA = new Date(a.data.day * 86400000);
        const dateB = new Date(b.data.day * 86400000);
        return dateB.getTime() - dateA.getTime();
      }));
    } catch (error) {
      console.error("Error loading saved games", error);
    }
  };
  
  const handleStartGame = () => {
      if (playerName.trim() === "") return;
      onStartGame(playerName);
  };

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-800 to-teal-700">
      <BackgroundBubbles />
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-6xl font-medium text-white mb-6 lowercase tracking-tight flex items-center drop-shadow-lg"
        >
          <span className="text-7xl mr-3">🏙️</span> neighborville
        </motion.div>
        
        <GlassCard 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="p-8 w-full max-w-md backdrop-blur-md bg-white/90 border-white/30"
        >
          {!showSaves ? (
            <>
              <h2 className="text-2xl font-medium text-gray-800 mb-6 lowercase">
                build your dream neighborhood
              </h2>
              
              <div className="mb-6">
                <label className="block text-gray-700 text-sm mb-2 lowercase">
                  your name
                </label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-gray-100 text-gray-900 border border-gray-300 placeholder-gray-500 outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 lowercase text-lg"
                  placeholder="enter your name"
                />
              </div>
              
              <Button
                variant="success"
                size="lg"
                fullWidth
                icon={<Play size={20} />}
                onClick={handleStartGame}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                start building
              </Button>
              
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button
                  variant="secondary"
                  icon={<Info size={16} />}
                  onClick={onShowTutorial}
                  className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  how to play
                </Button>
                
                <Button
                  variant="secondary"
                  icon={<Upload size={16} />}
                  onClick={() => setShowSaves(true)}
                  className="bg-gray-200 text-gray-800 hover:bg-gray-300"
                >
                  load game
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium text-gray-800 lowercase">
                  saved games
                </h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowSaves(false)}
                  className="text-gray-700 hover:bg-gray-100"
                >
                  back
                </Button>
              </div>
              
              {savedGames.length > 0 ? (
                <div className="space-y-4 max-h-80 overflow-y-auto pr-1 no-scrollbar">
                  {savedGames.map((save) => (
                    <SaveCard 
                      key={save.key}
                      saveData={save}
                      onClick={() => onLoadGame(save.data)}
                    />
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center bg-gray-100 rounded-lg">
                  <p className="text-gray-600">no saved games found</p>
                </div>
              )}
              
              <Button
                variant="success"
                size="lg"
                fullWidth
                icon={<Play size={20} />}
                onClick={() => setShowSaves(false)}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                start new game instead
              </Button>
            </>
          )}
        </GlassCard>
        
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          className="absolute bottom-8 text-white text-xs text-center drop-shadow"
        >
          Created for neighborhood.hackclub.com
        </motion.div>
      </div>
    </div>
  );
}