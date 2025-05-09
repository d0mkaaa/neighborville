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
        const nameParts = key.split("_");
        const timestamp = nameParts.length > 2 ? parseInt(nameParts[2]) : Date.now();
        const date = new Date(timestamp).toLocaleString();
        
        return { 
          key,
          name: data.playerName, 
          date, 
          data 
        };
      });
      
      setSavedGames(games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
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
      
      <div className="absolute top-0 left-0 w-full h-12 bg-gradient-to-r from-emerald-900 to-teal-900 shadow-md z-10 flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.8 }}
          className="text-white text-lg lowercase font-medium tracking-widest"
        >
          🏙️ neighborville
        </motion.div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4 pt-16">
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="text-6xl font-medium text-white mb-6 lowercase tracking-tight flex items-center"
        >
          <span className="text-7xl mr-3">🏙️</span> neighborville
        </motion.div>
        
        <GlassCard 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="p-8 w-full max-w-md"
        >
          {!showSaves ? (
            <>
              <h2 className="text-2xl font-medium text-white mb-6 lowercase">build your dream neighborhood</h2>
              
              <div className="mb-6">
                <label className="block text-white text-sm mb-2 lowercase">your name</label>
                <input
                  type="text"
                  value={playerName}
                  onChange={(e) => setPlayerName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-20 backdrop-filter backdrop-blur-md text-white border border-white border-opacity-20 placeholder-white placeholder-opacity-60 outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 lowercase text-lg shadow-inner"
                  placeholder="enter your name"
                />
              </div>
              
              <Button
                variant="glass"
                size="lg"
                fullWidth
                icon={<Play size={20} />}
                onClick={handleStartGame}
                className="bg-gradient-to-r from-emerald-500 to-teal-500 border-0"
              >
                start building
              </Button>
              
              <div className="mt-4 grid grid-cols-2 gap-3">
                <Button
                  variant="glass"
                  icon={<Info size={16} />}
                  onClick={onShowTutorial}
                >
                  how to play
                </Button>
                
                <Button
                  variant="glass"
                  icon={<Upload size={16} />}
                  onClick={() => setShowSaves(true)}
                >
                  load game
                </Button>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium text-white lowercase">saved games</h2>
                <Button
                  variant="glass"
                  size="sm"
                  onClick={() => setShowSaves(false)}
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
                <GlassCard variant="secondary" className="p-4 text-center">
                  <p className="text-white">no saved games found</p>
                </GlassCard>
              )}
              
              <Button
                variant="glass"
                size="lg"
                fullWidth
                icon={<Play size={20} />}
                onClick={() => setShowSaves(false)}
                className="mt-4 bg-gradient-to-r from-emerald-500 to-teal-500 border-0"
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
          className="absolute bottom-2 text-white text-xs opacity-60 text-center"
        >
          Created for neighborhood.hackclub.com
        </motion.div>
      </div>
    </div>
  );
}