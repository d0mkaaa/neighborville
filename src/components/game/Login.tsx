import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, Info, User } from "lucide-react";
import BackgroundBubbles from "./BackgroundBubbles";
import type { GameProgress } from "../../types/game";

const SAVE_KEY = "neighborville_save";

type LoginProps = {
  onStartGame: (playerName: string) => void;
  onLoadGame: (gameData: GameProgress) => void;
  onShowTutorial: () => void;
};

export default function Login({ onStartGame, onLoadGame, onShowTutorial }: LoginProps) {
  const [playerName, setPlayerName] = useState("");
  const [savedGames, setSavedGames] = useState<{name: string, date: string, data: GameProgress}[]>([]);
  const [showSaves, setShowSaves] = useState(false);
  
  useEffect(() => {
    try {
      const keys = Object.keys(localStorage);
      const gameKeys = keys.filter(key => key.startsWith(SAVE_KEY));
      
      const games = gameKeys.map(key => {
        const data = JSON.parse(localStorage.getItem(key) || "{}") as GameProgress;
        const nameParts = key.split("_");
        const timestamp = nameParts.length > 2 ? parseInt(nameParts[2]) : Date.now();
        const date = new Date(timestamp).toLocaleString();
        
        return { 
          name: data.playerName, 
          date, 
          data 
        };
      });
      
      setSavedGames(games.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
    } catch (error) {
      console.error("Error loading saved games", error);
    }
  }, []);
  
  const handleStartGame = () => {
    if (playerName.trim() === "") return;
    onStartGame(playerName);
  };
  
  return (
    <div className="h-screen bg-gradient-to-br from-emerald-800 to-teal-700 overflow-hidden">
      <BackgroundBubbles />
      
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-6xl font-medium text-white mb-6 lowercase tracking-tight"
        >
          neighborville
        </motion.div>
        
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg rounded-xl p-8 w-full max-w-md"
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
                  className="w-full px-4 py-3 rounded-lg bg-white bg-opacity-95 text-gray-800 border border-white border-opacity-30 placeholder-gray-500 outline-none focus:ring-2 focus:ring-emerald-500 transition-all duration-200 lowercase text-lg shadow-inner"
                  placeholder="enter your name"
                />
              </div>
              
              <motion.button
                whileHover={{ scale: 1.03, backgroundColor: "#10b981" }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartGame}
                className="w-full bg-emerald-500 text-white py-3 rounded-lg font-medium hover:bg-emerald-600 transition-colors lowercase text-lg shadow-lg"
              >
                start building
              </motion.button>
              
              <div className="mt-3 grid grid-cols-2 gap-3">
                <motion.button
                  whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.2)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={onShowTutorial}
                  className="w-full bg-transparent border border-white text-white py-2 rounded-lg font-medium hover:bg-white hover:bg-opacity-10 transition-colors lowercase flex items-center justify-center"
                >
                  <Info size={16} className="mr-2" />
                  how to play
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.03, backgroundColor: "rgba(255,255,255,0.2)" }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setShowSaves(true)}
                  className="w-full bg-transparent border border-white text-white py-2 rounded-lg font-medium hover:bg-white hover:bg-opacity-10 transition-colors lowercase flex items-center justify-center"
                >
                  <Upload size={16} className="mr-2" />
                  load game
                </motion.button>
              </div>
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium text-white lowercase">saved games</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setShowSaves(false)}
                  className="text-white text-sm underline"
                >
                  back
                </motion.button>
              </div>
              
              {savedGames.length > 0 ? (
                <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                  {savedGames.map((save, index) => (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.02, backgroundColor: "rgba(255,255,255,0.15)" }}
                      whileTap={{ scale: 0.98 }}
                      className="bg-white bg-opacity-10 rounded-lg p-3 cursor-pointer"
                      onClick={() => onLoadGame(save.data)}
                    >
                      <div className="flex items-center">
                        <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center mr-3">
                          <User size={16} className="text-white" />
                        </div>
                        <div>
                          <div className="text-white font-medium text-sm">{save.name}</div>
                          <div className="text-white text-opacity-70 text-xs">
                            day {save.data.day} • {save.date}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="bg-white bg-opacity-10 rounded-lg p-4 text-center text-white">
                  <p>no saved games found</p>
                </div>
              )}
              
              <motion.button
                whileHover={{ scale: 1.03, backgroundColor: "#10b981" }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setShowSaves(false)}
                className="w-full bg-emerald-500 text-white py-2 rounded-lg font-medium hover:bg-emerald-600 transition-colors lowercase mt-4 shadow-md"
              >
                start new game
              </motion.button>
            </>
          )}
        </motion.div>
      </div>
    </div>
  );
}