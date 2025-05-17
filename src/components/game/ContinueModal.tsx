import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Play, Plus, Calendar, Coins, Home, Smile, ChevronDown, ChevronUp, Cloud, Download, Trash, MoreHorizontal, Loader2, Save } from 'lucide-react';
import type { GameProgress } from '../../types/game';
import { loadGameFromServer, getAllSavesFromServer, deleteSaveFromServer } from '../../services/gameService';
import { useAuth } from '../../context/AuthContext';

interface SaveInfo {
  id: string;
  name: string;
  date: string;
  data: GameProgress;
  type: 'cloud';
  timestamp: number;
}

interface ContinueModalProps {
  savedGame: GameProgress;
  onContinue: () => void;
  onNewGame: () => void;
  onLoadGame?: (gameData: GameProgress) => void;
}

export default function ContinueModal({ 
  savedGame, 
  onContinue, 
  onNewGame,
  onLoadGame
}: ContinueModalProps) {
  const { user, isAuthenticated, checkAuthStatus } = useAuth();
  const buildingCount = savedGame.grid.filter(tile => tile !== null).length;
  
  const [showMoreSaves, setShowMoreSaves] = useState(false);
  const [allSaves, setAllSaves] = useState<SaveInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'all' | 'cloud'>('all');
  const [savesToDelete, setSavesToDelete] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [authVerified, setAuthVerified] = useState(false);

  useEffect(() => {
    async function verifyAuth() {
      if (isAuthenticated) {
        try {
          const status = await checkAuthStatus();
          setAuthVerified(status);
        } catch (error) {
          console.error("Auth verification failed:", error);
          setAuthVerified(false);
        }
      } else {
        setAuthVerified(false);
      }
    }
    
    verifyAuth();
    
    const handleUnauthorized = () => {
      console.log("Unauthorized event detected in ContinueModal");
      setAuthVerified(false);
    };
    
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [isAuthenticated, checkAuthStatus]);

  useEffect(() => {
    if (showMoreSaves) {
      loadAllSaves();
    }
  }, [showMoreSaves, authVerified]);

  const loadAllSaves = async () => {
    setLoading(true);
    
    let cloudSaves: SaveInfo[] = [];
    if (authVerified) {
      try {
        const serverSaves = await getAllSavesFromServer();
        
        cloudSaves = serverSaves.map(save => ({
          id: save.id,
          name: save.data.saveName || save.data.playerName || 'Cloud Save',
          date: new Date(save.timestamp).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          data: save.data,
          type: 'cloud' as const,
          timestamp: save.timestamp
        })).sort((a, b) => b.timestamp - a.timestamp);
        
        setAllSaves(cloudSaves);
      } catch (err) {
        console.error("Error loading cloud saves:", err);
      }
    }
    
    setLoading(false);
  };

  const handleDeleteSaves = async () => {
    if (!savesToDelete.length) return;
    
    setIsDeleting(true);
    
    for (const id of savesToDelete) {
      try {
        await deleteSaveFromServer(id);
      } catch (error) {
        console.error(`Error deleting save ${id}:`, error);
      }
    }
    
    loadAllSaves();
    setSavesToDelete([]);
    setIsDeleting(false);
  };

  const handleToggleDelete = (id: string) => {
    if (savesToDelete.includes(id)) {
      setSavesToDelete(savesToDelete.filter(saveId => saveId !== id));
    } else {
      setSavesToDelete([...savesToDelete, id]);
    }
  };

  const handleLoadSave = (save: SaveInfo) => {
    if (!authVerified) {
      console.warn('Cannot load cloud save: not authenticated');
      return;
    }
    
    if (onLoadGame) {
      onLoadGame(save.data);
    }
  };

  const availableTabs = authVerified ? ['all', 'cloud'] : ['all'];
  const filteredSaves = allSaves;

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl p-6 max-w-md w-full shadow-xl"
      >
        <h2 className="text-2xl font-medium text-emerald-800 mb-4 lowercase">
          welcome back!
        </h2>
        
        <div className="bg-emerald-50 rounded-lg p-4 mb-6">
          <p className="text-gray-700 mb-2 font-medium">
            We found a saved city for {savedGame.playerName}:
          </p>
          
          <div className="flex justify-between mb-2">
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center">
              {savedGame.saveTimestamp ? (
                <span>
                  <Calendar size={12} className="inline mr-1" />
                  Last played: {new Date(savedGame.saveTimestamp).toLocaleString()}
                </span>
              ) : (
                <span>
                  <Calendar size={12} className="inline mr-1" />
                  Last played: Recently
                </span>
              )}
            </span>
            
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center">
              <Cloud size={12} className="inline mr-1" />
              Cloud save
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-emerald-600" />
              <span className="text-gray-700">Day {savedGame.day}</span>
            </div>
            <div className="flex items-center gap-2">
              <Coins size={16} className="text-amber-500" />
              <span className="text-gray-700">{savedGame.coins} coins</span>
            </div>
            <div className="flex items-center gap-2">
              <Home size={16} className="text-blue-500" />
              <span className="text-gray-700">{buildingCount} buildings</span>
            </div>
            <div className="flex items-center gap-2">
              <Smile size={16} className="text-yellow-500" />
              <span className="text-gray-700">{savedGame.happiness}% happiness</span>
            </div>
          </div>
        </div>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={onContinue}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium transition-colors lowercase flex items-center justify-center gap-2"
          >
            <Play size={18} />
            continue this city
          </button>
          
          <button
            onClick={() => {
              if (onLoadGame) {
                onLoadGame(savedGame);
              }
            }}
            className="w-full bg-blue-500 hover:bg-blue-600 text-white py-3 px-4 rounded-lg font-medium transition-colors lowercase flex items-center justify-center gap-2"
          >
            <Save size={18} />
            save & continue
          </button>
          
          <button
            onClick={() => setShowMoreSaves(!showMoreSaves)}
            className="w-full bg-blue-100 hover:bg-blue-200 text-blue-800 py-3 px-4 rounded-lg font-medium transition-colors lowercase flex items-center justify-center gap-2"
          >
            {showMoreSaves ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
            {showMoreSaves ? 'hide other saves' : 'show other saves'}
          </button>
          
          <AnimatePresence>
            {showMoreSaves && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                {loading ? (
                  <div className="py-8 flex justify-center">
                    <Loader2 size={24} className="animate-spin text-emerald-500" />
                  </div>
                ) : (
                  <div className="pt-2">
                    <div className="flex rounded-md bg-gray-100 p-1 text-gray-600 mb-3">
                      {availableTabs.map(tab => (
                        <button
                          key={tab}
                          onClick={() => setActiveTab(tab as 'all' | 'cloud')}
                          className={`flex-1 py-1.5 text-center text-xs rounded-md ${activeTab === tab ? 'bg-white shadow' : 'hover:bg-white/50'}`}
                        >
                          {tab === 'all' ? 'All Saves' : 'Cloud'}
                        </button>
                      ))}
                      {!authVerified && isAuthenticated && (
                        <div className="text-xs text-amber-600 text-center mt-1">
                          Authentication required
                        </div>
                      )}
                    </div>
                    
                    <div className="max-h-64 overflow-y-auto pr-2 space-y-2">
                      {filteredSaves.length > 0 ? (
                        filteredSaves.map(save => (
                          <div 
                            key={save.id} 
                            className={`bg-gray-50 border ${savesToDelete.includes(save.id) ? 'border-red-300' : 'border-gray-200'} rounded-lg p-3 relative`}
                          >
                            <div className="flex justify-between">
                              <div className="flex-1">
                                <div className="flex items-center">
                                  <h3 className="font-medium text-gray-800">{save.name}</h3>
                                  <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                                    <Cloud size={10} className="inline mr-1" />
                                    Cloud
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500">{save.date}</div>
                                
                                <div className="grid grid-cols-3 gap-2 mt-2">
                                  <div className="text-xs text-gray-600">
                                    Day {save.data.day}
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {save.data.coins} coins
                                  </div>
                                  <div className="text-xs text-gray-600">
                                    {save.data.happiness}% happy
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex gap-1">
                                <button
                                  onClick={() => handleLoadSave(save)}
                                  className={`p-1.5 ${
                                    !authVerified 
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
                                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                                  } rounded`}
                                  disabled={!authVerified}
                                >
                                  <Download size={14} />
                                </button>
                                <button
                                  onClick={() => handleToggleDelete(save.id)}
                                  disabled={!authVerified}
                                  className={`p-1.5 rounded ${
                                    savesToDelete.includes(save.id)
                                      ? 'bg-red-500 text-white'
                                      : !authVerified
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                                  }`}
                                >
                                  <Trash size={14} />
                                </button>
                              </div>
                            </div>
                            {!authVerified && (
                              <div className="mt-1 px-1 py-0.5 bg-amber-50 text-amber-700 text-xs rounded">
                                Login required to access cloud save
                              </div>
                            )}
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6 text-gray-500">
                          {authVerified 
                            ? "No cloud saves found" 
                            : "Login required to view cloud saves"}
                        </div>
                      )}
                    </div>
                    
                    {savesToDelete.length > 0 && (
                      <div className="mt-3 flex justify-between items-center bg-red-50 p-2 rounded">
                        <span className="text-sm text-red-700">
                          {savesToDelete.length} {savesToDelete.length === 1 ? 'save' : 'saves'} selected
                        </span>
                        <button
                          onClick={handleDeleteSaves}
                          disabled={isDeleting || !authVerified}
                          className="bg-red-500 text-white text-xs py-1 px-2 rounded hover:bg-red-600 disabled:opacity-50"
                        >
                          {isDeleting ? (
                            <span className="flex items-center gap-1">
                              <Loader2 size={12} className="animate-spin" />
                              Deleting...
                            </span>
                          ) : (
                            'Delete Selected'
                          )}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
          
          <button
            onClick={onNewGame}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors lowercase flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            start a fresh city
          </button>
          
          <p className="text-xs text-gray-500 text-center mt-2">
            Starting a new city won't affect your saved games
          </p>
        </div>
      </motion.div>
    </div>
  );
} 