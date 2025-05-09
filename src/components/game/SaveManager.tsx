import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Trash2, X, Calendar, Clock } from "lucide-react";
import type { GameProgress } from "../../types/game";

const SAVE_KEY = "neighborville_save";

type SaveManagerProps = {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name?: string) => void;
  gameData: GameProgress;
};

export default function SaveManager({ isOpen, onClose, onSave, gameData }: SaveManagerProps) {
  const [savedGames, setSavedGames] = useState<{key: string, name: string, date: string, data: GameProgress}[]>([]);
  const [saveName, setSaveName] = useState("");
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  
  useEffect(() => {
    if (isOpen) {
      loadSavedGames();
    }
  }, [isOpen]);
  
  const loadSavedGames = () => {
    try {
      const keys = Object.keys(localStorage);
      const gameKeys = keys.filter(key => key.startsWith(SAVE_KEY));
      
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
  
  const handleQuickSave = () => {
    onSave();
    onClose();
  };
  
  const handleNamedSave = () => {
    if (saveName.trim()) {
      onSave(saveName);
      setSaveName("");
      onClose();
    }
  };
  
  const handleDeleteSave = (key: string) => {
    try {
      localStorage.removeItem(key);
      setSavedGames(prev => prev.filter(game => game.key !== key));
      setShowConfirmDelete(null);
    } catch (error) {
      console.error("Error deleting save", error);
    }
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.3)" }}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 25 }}
            className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
          >
            <div className="p-4 bg-emerald-600 text-white flex justify-between items-center">
              <h2 className="text-lg font-medium lowercase flex items-center">
                <Save size={18} className="mr-2" />
                save game
              </h2>
              <button 
                onClick={onClose}
                className="text-white hover:text-emerald-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-5">
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-emerald-800 font-medium lowercase">quick save</div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleQuickSave}
                    className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-md text-sm hover:bg-emerald-200 transition-colors lowercase"
                  >
                    save now
                  </motion.button>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600 lowercase">
                  saves using your name and current date
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-emerald-800 font-medium mb-2 lowercase">custom save</div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="enter save name"
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-md text-gray-800 placeholder-gray-400 focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none lowercase"
                  />
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleNamedSave}
                    disabled={!saveName.trim()}
                    className={`px-3 py-2 rounded-md text-white text-sm ${
                      saveName.trim() ? 'bg-emerald-500 hover:bg-emerald-600' : 'bg-gray-300 cursor-not-allowed'
                    } transition-colors lowercase`}
                  >
                    save
                  </motion.button>
                </div>
              </div>
              
              <div>
                <div className="text-emerald-800 font-medium mb-2 lowercase">saved games</div>
                {savedGames.length > 0 ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {savedGames.map((save) => (
                      <div
                        key={save.key}
                        className="bg-gray-50 rounded-lg p-3 flex justify-between items-center"
                      >
                        <div>
                          <div className="text-gray-800 font-medium text-sm">{save.name}</div>
                          <div className="text-gray-500 text-xs flex items-center">
                            <Calendar size={12} className="mr-1" />
                            day {save.data.day}
                            <Clock size={12} className="ml-2 mr-1" />
                            {save.date}
                          </div>
                        </div>
                        
                        {showConfirmDelete === save.key ? (
                          <div className="flex items-center gap-1">
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => setShowConfirmDelete(null)}
                              className="px-2 py-1 bg-gray-200 text-gray-700 rounded text-xs"
                            >
                              cancel
                            </motion.button>
                            <motion.button
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                              onClick={() => handleDeleteSave(save.key)}
                              className="px-2 py-1 bg-red-500 text-white rounded text-xs"
                            >
                              delete
                            </motion.button>
                          </div>
                        ) : (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setShowConfirmDelete(save.key)}
                            className="text-red-500 hover:text-red-600 transition-colors"
                          >
                            <Trash2 size={16} />
                          </motion.button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-gray-50 p-3 rounded-lg text-center text-gray-500 lowercase">
                    no saved games yet
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}