import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Trash2, X, Calendar, Clock, CloudUpload, CheckCircle, AlertCircle, Download, UploadCloud, CloudOff, LogIn, Loader2 } from "lucide-react";
import type { GameProgress } from "../../types/game";
import { cloudSave } from "../../utils/cloudsave";
import { useAuth } from "../../context/AuthContext";

const SAVE_KEY = "neighborville_save";

interface SaveManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name?: string) => void;
  onSaveToServer?: () => Promise<boolean>;
  gameData: GameProgress;
  isAuthenticated?: boolean;
  lastServerSaveTime?: Date | null;
  onShowLogin?: () => void;
}

export default function SaveManager({ 
  isOpen, 
  onClose, 
  onSave, 
  onSaveToServer, 
  gameData, 
  isAuthenticated,
  lastServerSaveTime,
  onShowLogin
}: SaveManagerProps) {
  const [savedGames, setSavedGames] = useState<{key: string, name: string, date: string}[]>([]);
  const [saveName, setSaveName] = useState<string>("");
  const [showConfirmDelete, setShowConfirmDelete] = useState<string | null>(null);
  const [isSavingToServer, setIsSavingToServer] = useState<boolean>(false);
  const [serverSaveSuccess, setServerSaveSuccess] = useState<boolean | null>(null);
  
  const { user } = useAuth();
  const isGuest = !!user?.isGuest;
  
  useEffect(() => {
    if (isOpen) {
      loadSavedGames();
      setServerSaveSuccess(null);
    }
  }, [isOpen]);
  
  const loadSavedGames = () => {
    try {
      const keys = Object.keys(localStorage);
      const gameKeys = keys.filter(key => key.startsWith(SAVE_KEY));
      
      const filteredKeys = gameKeys.filter(key => !key.includes('autosave'));
      
      const games = filteredKeys.map(key => {
        let data = {playerName: 'Unknown'};
        try {
          data = JSON.parse(localStorage.getItem(key) || '{}');
        } catch (e) {
          console.error('Error parsing saved game data', e);
        }
        
        let timestamp = Date.now();
        const nameParts = key.split('_');
        
        if (nameParts.length > 2) {
          const possibleTimestamp = parseInt(nameParts[2]);
          if (!isNaN(possibleTimestamp)) {
            timestamp = possibleTimestamp;
          }
        }
        
        const date = new Date(timestamp).toLocaleDateString();
        
        return { 
          key,
          name: data.playerName || 'Unnamed Save', 
          date 
        };
      });
      
      setSavedGames(games);
    } catch (error) {
      console.error('Error loading saved games', error);
    }
  };
  
  const handleQuickSave = () => {
    const timestamp = Date.now();
    
    localStorage.setItem(SAVE_KEY, JSON.stringify({
      ...gameData,
      saveTimestamp: timestamp
    }));
    
    onSave();
  };
  
  const handleNamedSave = () => {
    const timestamp = Date.now();
    const name = saveName.trim() ? saveName : `${gameData.playerName}'s City`;
    
    const key = `${SAVE_KEY}_${timestamp}_${name.replace(/\s/g, '_')}`;
    
    localStorage.setItem(key, JSON.stringify({
      ...gameData,
      saveTimestamp: timestamp,
      saveName: name
    }));
    
    loadSavedGames();
    
    setSaveName('');
    
    onSave(name);
  };
  
  const handleSaveToServer = async () => {
    if (onSaveToServer) {
      setIsSavingToServer(true);
      setServerSaveSuccess(null);
      
      try {
        console.log('SaveManager: Initiating save to server');
        const success = await onSaveToServer();
        console.log('SaveManager: Server save result:', success);
        setServerSaveSuccess(success);
        
        if (success) {
          loadSavedGames();
        }
      } catch (error) {
        console.error("Error saving to server:", error);
        setServerSaveSuccess(false);
      } finally {
        setIsSavingToServer(false);
      }
    }
  };
  
  const handleDeleteSave = (key: string) => {
    try {
      if (confirm('Are you sure you want to delete this save?')) {
        localStorage.removeItem(key);
        loadSavedGames();
      }
    } catch (error) {
      console.error('Error deleting save', error);
    }
  };
  
  const formatServerSaveTime = () => {
    if (!lastServerSaveTime) return 'Not saved to server yet';
    
    const now = new Date();
    const diff = now.getTime() - lastServerSaveTime.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `Last saved ${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `Last saved ${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `Last saved ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Saved just now';
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
            
            {isGuest && onShowLogin && (
              <div className="bg-blue-50 border-b border-blue-100 p-4">
                <div className="flex items-start">
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <CloudUpload className="text-blue-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-800">Playing as Guest</h3>
                    <p className="text-xs text-blue-600 mt-1">
                      Your progress is only saved on this device. Create an account to save your city to the cloud!
                    </p>
                    <div className="mt-2">
                      <button 
                        onClick={() => {
                          onShowLogin();
                          onClose();
                        }}
                        className="bg-blue-500 text-white text-xs px-3 py-1.5 rounded flex items-center gap-1.5 hover:bg-blue-600 transition-colors"
                      >
                        <LogIn size={14} />
                        Sign Up / Log In
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
            
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
                            day {gameData.day}
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