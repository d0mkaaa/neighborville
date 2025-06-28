import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Save, 
  Download, 
  Trash2, 
  X, 
  Cloud, 
  Upload, 
  CloudOff, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  Calendar, 
  LogIn,
  Clock,
  User,
  Home,
  Coins,
  TrendingUp,
  MapPin,
  CheckSquare,
  CloudLightning
} from 'lucide-react';
import { saveGameToServer, getAllSavesFromServer, deleteSaveFromServer, loadSpecificSaveFromServer } from '../../services/gameService';
import { checkAuthenticationStatus } from '../../services/userService';
import type { GameProgress } from '../../types/game';

interface SaveItem {
  key: string;
  name: string;
  date: string;
  timestamp: number;
  data?: GameProgress;
}

interface SaveManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name?: string) => void;
  onSaveToServer?: () => Promise<boolean>;
  onLoadGame: (gameData: GameProgress) => void;
  gameData: GameProgress;
  isAuthenticated?: boolean;
  lastServerSaveTime?: Date | null;
  onShowLogin?: () => void;
  addNotification?: (message: string, type: string) => void;
}

export default function SaveManager({ 
  isOpen, 
  onClose, 
  onSave, 
  onSaveToServer, 
  onLoadGame,
  gameData, 
  isAuthenticated: propIsAuthenticated,
  lastServerSaveTime,
  onShowLogin,
  addNotification
}: SaveManagerProps) {
  const [saveName, setSaveName] = useState('');
  const [cloudSaves, setCloudSaves] = useState<SaveItem[]>([]);
  const [isLoadingCloudSaves, setIsLoadingCloudSaves] = useState(false);
  const [isSavingToServer, setIsSavingToServer] = useState(false);
  const [serverSaveSuccess, setServerSaveSuccess] = useState<boolean | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(propIsAuthenticated || false);
  const [isGuest, setIsGuest] = useState(false);
  const [loadingSave, setLoadingSave] = useState<string | null>(null);
  const [selectedSaves, setSelectedSaves] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadCloudSaves();
    }
  }, [isOpen]);

  useEffect(() => {
    async function verifyAuth() {
      try {
        const { success, authenticated } = await checkAuthenticationStatus();
        if (success) {
          setIsAuthenticated(authenticated);
          setIsGuest(!authenticated);
        }
      } catch (error) {
        console.error('Error checking auth status:', error);
        setIsAuthenticated(false);
        setIsGuest(true);
      }
    }
    
    verifyAuth();
  }, []);

  const loadCloudSaves = async () => {
    if (!isAuthenticated || isGuest) return;
    
    setIsLoadingCloudSaves(true);
    try {
      const saves = await getAllSavesFromServer();
      console.log('Loaded cloud saves:', saves);
      
      const formattedSaves: SaveItem[] = saves.map(save => ({
        key: save.id,
        name: save.data?.playerName || `Save ${save.id.slice(0, 8)}`,
        date: new Date(save.timestamp).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        timestamp: save.timestamp,
        data: save.data
      }));
      
      formattedSaves.sort((a, b) => b.timestamp - a.timestamp);
      
      setCloudSaves(formattedSaves);
    } catch (error) {
      console.error('Error loading cloud saves:', error);
      addNotification?.('Failed to load cloud saves', 'error');
    } finally {
      setIsLoadingCloudSaves(false);
    }
  };

  const handleQuickSave = () => {
    if (!saveName.trim()) {
      const defaultName = 'Unnamed City';
      setSaveName(defaultName);
      onSave(defaultName);
    } else {
      onSave(saveName);
    }
    
    addNotification?.('Game saved locally', 'success');
  };

  const handleNamedSave = () => {
          const name = saveName.trim() || 'Unnamed City';
    onSave(name);
    setSaveName('');
    addNotification?.('Game saved locally', 'success');
  };

  const handleSaveToServer = async () => {
    if (!isAuthenticated || isGuest) {
      addNotification?.('Please log in to save to cloud', 'warning');
      if (onShowLogin) onShowLogin();
      return;
    }
    
    setIsSavingToServer(true);
    setServerSaveSuccess(null);
    
    try {
      let success = false;
      
      if (onSaveToServer) {
        success = await onSaveToServer();
      } else {
        const saveData = {
          ...gameData,
          saveName: saveName.trim() || 'Unnamed City',
          saveTimestamp: Date.now()
        };
        success = await saveGameToServer(saveData);
      }
      
      setServerSaveSuccess(success);
      
      if (success) {
        addNotification?.('Game saved to cloud successfully!', 'success');
        setTimeout(() => {
          loadCloudSaves();
        }, 1000);
      } else {
        addNotification?.('Failed to save to cloud', 'error');
      }
    } catch (error) {
      console.error('Error saving to server:', error);
      setServerSaveSuccess(false);
      addNotification?.('Error saving to cloud', 'error');
    } finally {
      setIsSavingToServer(false);
    }
  };

  const handleDeleteCloudSave = async (id: string) => {
    if (!isAuthenticated || isGuest) {
      addNotification?.('Please log in to manage your saved games', 'warning');
      if (onShowLogin) onShowLogin();
      return;
    }
    
    setLoadingSave(id);
    try {
      const startTime = performance.now();
      const success = await deleteSaveFromServer(id);
      const endTime = performance.now();
      console.log(`Cloud save deletion took ${Math.round(endTime - startTime)}ms`);
      
      if (success) {
        addNotification?.('Cloud save deleted successfully', 'success');
        const elapsedTime = endTime - startTime;
        if (elapsedTime < 500) {
          await new Promise(resolve => setTimeout(resolve, 500 - elapsedTime));
        }
        loadCloudSaves();
      } else {
        addNotification?.('Failed to delete cloud save', 'error');
      }
    } catch (error) {
      console.error('Error deleting cloud save', error);
      addNotification?.('Error deleting cloud save: ' + (error as Error).message, 'error');
    } finally {
      setLoadingSave(null);
    }
  };
  
  const handleLoadCloudSave = async (id: string) => {
    if (!isAuthenticated || isGuest) {
      addNotification?.('Please log in to load your saved games', 'warning');
      if (onShowLogin) onShowLogin();
      return;
    }
    
    setLoadingSave(id);
    try {
      console.log(`Loading specific save with ID: ${id}`);
      const { gameData: loadedGameData } = await loadSpecificSaveFromServer(id);
      
      if (loadedGameData) {
        onLoadGame(loadedGameData);
        onClose();
        addNotification?.('Game loaded successfully!', 'success');
      } else {
        addNotification?.('Failed to load save. Save data not found.', 'error');
      }
    } catch (error) {
      console.error('Error loading cloud save', error);
      addNotification?.('Failed to load save from cloud.', 'error');
    } finally {
      setLoadingSave(null);
    }
  };

  const toggleSelectSave = (key: string) => {
    if (selectedSaves.includes(key)) {
      setSelectedSaves(selectedSaves.filter(id => id !== key));
    } else {
      setSelectedSaves([...selectedSaves, key]);
    }
  };

  const handleBatchDelete = async () => {
    setShowConfirmDelete(true);
  };

  const confirmBatchDelete = async () => {
    if (!isAuthenticated || isGuest) {
      addNotification?.('Please log in to manage your saved games', 'warning');
      if (onShowLogin) onShowLogin();
      return;
    }
    
    setIsSavingToServer(true);
    
    try {
      const cloudToDelete = selectedSaves.filter(key => 
        cloudSaves.some(save => save.key === key)
      );
      
      let successCount = 0;
      let failCount = 0;
      
      if (cloudToDelete.length > 0) {
        addNotification?.(`Deleting ${cloudToDelete.length} cloud saves...`, 'info');
        
        const batchSize = 3;
        for (let i = 0; i < cloudToDelete.length; i += batchSize) {
          const batch = cloudToDelete.slice(i, i + batchSize);
          
          const results = await Promise.allSettled(
            batch.map(id => deleteSaveFromServer(id))
          );
          
          results.forEach((result, index) => {
            const id = batch[index];
            if (result.status === 'fulfilled' && result.value) {
              successCount++;
            } else {
              console.error(`Failed to delete save ${id}:`, 
                result.status === 'rejected' ? result.reason : 'Unknown error');
              failCount++;
            }
          });
          
          if (i + batchSize < cloudToDelete.length) {
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
        
        if (failCount === 0) {
          addNotification?.(`Successfully deleted ${successCount} cloud saves`, 'success');
        } else {
          addNotification?.(`Deleted ${successCount} saves, but failed to delete ${failCount} saves`, 'warning');
        }
      }
    } catch (error) {
      console.error('Error during batch delete operation:', error);
      addNotification?.('Error during batch delete operation', 'error');
    } finally {
      setIsSavingToServer(false);
      
      setSelectedSaves([]);
      setIsSelectMode(false);
      setShowConfirmDelete(false);
      
      loadCloudSaves();
    }
  };

  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
  };

  const getSaveStats = (saveData?: GameProgress) => {
    if (!saveData) return null;
    
    return {
      day: saveData.day || 1,
      level: saveData.level || 1,
      coins: saveData.coins || 0,
      buildings: saveData.grid?.filter(Boolean).length || 0,
      neighbors: saveData.neighborProgress ? Object.keys(saveData.neighborProgress).length : 0
    };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white w-full max-w-xl rounded-xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-blue-600 text-white px-6 py-4 flex justify-between items-center">
              <h2 className="text-xl font-medium flex items-center gap-2">
                <Cloud size={20} />
                Cloud Saves
              </h2>
              <button 
                onClick={onClose}
                className="rounded-full p-1 hover:bg-blue-500 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {!isAuthenticated || isGuest ? (
                <div className="bg-blue-50 text-blue-700 p-4 rounded-lg mb-4 flex items-start gap-3">
                  <CloudOff className="mt-0.5 flex-shrink-0" size={20} />
                  <div>
                    <p className="font-medium">Sign in to use cloud saves</p>
                    <p className="text-sm mt-1">Your game progress will be saved to the cloud and accessible across devices.</p>
                    <button
                      onClick={onShowLogin}
                      className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-1 transition-colors"
                    >
                      <LogIn size={16} />
                      Sign in
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                  <div className="flex">
                    <div className="relative flex-1">
                      <input
                        type="text"
                        value={saveName}
                        onChange={e => setSaveName(e.target.value)}
                        className="w-full py-2 px-4 border border-gray-300 rounded-l-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Enter city name"
                      />
                    </div>
                    <button 
                      onClick={handleNamedSave}
                      disabled={isSavingToServer}
                      className={`bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-r-lg transition-colors flex items-center gap-2 ${
                        isSavingToServer ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSavingToServer ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save size={16} />
                          Save
                        </>
                      )}
                    </button>
                  </div>
                  
                  <div className="flex gap-2">
                    <button
                      onClick={handleQuickSave}
                      disabled={isSavingToServer}
                      className={`flex-1 bg-gray-100 hover:bg-gray-200 py-2 px-4 rounded-lg transition-colors text-gray-700 font-medium flex items-center justify-center gap-1 ${
                        isSavingToServer ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <CloudLightning size={16} />
                      Quick Save
                    </button>
                    
                    <button
                      onClick={handleSaveToServer}
                      disabled={isSavingToServer}
                      className={`flex-1 bg-blue-100 hover:bg-blue-200 py-2 px-4 rounded-lg transition-colors text-blue-700 font-medium flex items-center justify-center gap-1 ${
                        isSavingToServer ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      {isSavingToServer ? (
                        <>
                          <Loader2 size={16} className="animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Upload size={16} />
                          Save to Cloud
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
              
              {serverSaveSuccess !== null && (
                <div className={`mt-4 p-3 rounded-lg flex items-center gap-2 ${
                  serverSaveSuccess ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                }`}>
                  {serverSaveSuccess ? (
                    <>
                      <CheckCircle size={16} />
                      <span>Saved to cloud successfully!</span>
                    </>
                  ) : (
                    <>
                      <AlertCircle size={16} />
                      <span>Failed to save to cloud. Please try again.</span>
                    </>
                  )}
                </div>
              )}
              
              <div className="border-b border-gray-200 mt-6">
                <div className="flex">
                  <div className="px-4 py-2 border-b-2 border-blue-500 text-blue-600 font-medium text-sm">
                    <div className="flex items-center gap-1">
                      <Cloud size={16} />
                      <span>Cloud Saves</span>
                      <span className="ml-1 bg-gray-100 text-gray-700 px-1.5 py-0.5 text-xs rounded-full">
                        {cloudSaves.length}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-between mt-2 mb-2">
                <div>
                  {isSelectMode && (
                    <button 
                      onClick={handleBatchDelete}
                      disabled={selectedSaves.length === 0}
                      className={`px-3 py-1 text-xs bg-red-100 hover:bg-red-200 text-red-600 rounded-lg flex items-center gap-1 ${
                        selectedSaves.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
                      }`}
                    >
                      <Trash2 size={14} />
                      Delete Selected ({selectedSaves.length})
                    </button>
                  )}
                </div>
                <button 
                  onClick={() => setIsSelectMode(!isSelectMode)}
                  className="px-3 py-1 text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg flex items-center gap-1"
                >
                  {isSelectMode ? (
                    <>
                      <X size={14} />
                      Cancel
                    </>
                  ) : (
                    <>
                      <CheckSquare size={14} />
                      Select Multiple
                    </>
                  )}
                </button>
              </div>
              
              <div className="mt-2 border border-gray-200 rounded-lg overflow-hidden max-h-[300px] overflow-y-auto scrollbar-thin">
                {isLoadingCloudSaves ? (
                  <div className="p-8 flex flex-col items-center justify-center">
                    <Loader2 size={24} className="animate-spin text-blue-500 mb-2" />
                    <p className="text-gray-500">Loading cloud saves...</p>
                  </div>
                ) : (
                  <div>
                    {!isAuthenticated || isGuest ? (
                      <div className="p-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <CloudOff size={32} className="text-gray-400 mb-2" />
                          <p>Sign in to access your cloud saves</p>
                        </div>
                      </div>
                    ) : cloudSaves.length === 0 ? (
                      <div className="p-8 text-center text-gray-500">
                        <div className="flex flex-col items-center">
                          <Cloud size={32} className="text-gray-400 mb-2" />
                          <p>No cloud saves found</p>
                        </div>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {cloudSaves.map((save) => {
                          const stats = getSaveStats(save.data);
                          return (
                            <div 
                              key={save.key} 
                              className={`p-4 flex items-center hover:bg-gray-50 transition-colors ${
                                isSelectMode && selectedSaves.includes(save.key) ? 'bg-blue-50' : ''
                              }`}
                            >
                              {isSelectMode ? (
                                <div 
                                  onClick={() => toggleSelectSave(save.key)}
                                  className={`w-5 h-5 border rounded mr-3 flex items-center justify-center cursor-pointer ${
                                    selectedSaves.includes(save.key) 
                                      ? 'bg-blue-500 border-blue-500 text-white' 
                                      : 'border-gray-300'
                                  }`}
                                >
                                  {selectedSaves.includes(save.key) && <CheckCircle size={14} />}
                                </div>
                              ) : (
                                <div className="mr-3 text-blue-500">
                                  <Cloud size={20} />
                                </div>
                              )}
                              
                              <div 
                                className="flex-1 cursor-pointer" 
                                onClick={() => !isSelectMode && loadingSave !== save.key && handleLoadCloudSave(save.key)}
                              >
                                <div className="flex items-center justify-between mb-2">
                                  <div className="font-semibold text-gray-800 text-sm">
                                    {save.name}
                                  </div>
                                  <div className="text-xs text-gray-500 flex items-center gap-1">
                                    <Clock size={12} />
                                    {formatTimeAgo(save.timestamp)}
                                  </div>
                                </div>
                                
                                <div className="text-xs text-gray-500 flex items-center gap-1 mb-2">
                                  <Calendar size={12} />
                                  {save.date}
                                </div>
                                
                                {stats && (
                                  <div className="flex flex-wrap gap-3 text-xs">
                                    <div className="flex items-center gap-1 text-blue-600">
                                      <MapPin size={12} />
                                      <span>Day {stats.day}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-green-600">
                                      <TrendingUp size={12} />
                                      <span>Level {stats.level}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-yellow-600">
                                      <Coins size={12} />
                                      <span>{stats.coins.toLocaleString()}</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-purple-600">
                                      <Home size={12} />
                                      <span>{stats.buildings} buildings</span>
                                    </div>
                                    <div className="flex items-center gap-1 text-indigo-600">
                                      <User size={12} />
                                      <span>{stats.neighbors} neighbors</span>
                                    </div>
                                  </div>
                                )}
                              </div>
                              
                              <div className="flex gap-1 ml-3">
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    if (!isSelectMode && loadingSave !== save.key) {
                                      handleLoadCloudSave(save.key);
                                    }
                                  }}
                                  disabled={loadingSave === save.key || isSelectMode}
                                  className={`p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors ${
                                    (loadingSave === save.key || isSelectMode) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
                                  }`}
                                  title="Load save"
                                >
                                  {loadingSave === save.key ? (
                                    <Loader2 size={16} className="animate-spin" />
                                  ) : (
                                    <Download size={16} />
                                  )}
                                </button>
                                
                                {!isSelectMode && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleDeleteCloudSave(save.key);
                                    }}
                                    disabled={loadingSave === save.key}
                                    className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                                    title="Delete save"
                                  >
                                    <Trash2 size={16} />
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {showConfirmDelete && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-lg p-6 max-w-md mx-4">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Confirm Delete</h3>
                    <p className="text-gray-600 mb-4">
                      Are you sure you want to delete {selectedSaves.length} selected save{selectedSaves.length > 1 ? 's' : ''}?
                      This action cannot be undone.
                    </p>
                    <div className="flex gap-3 justify-end">
                      <button
                        onClick={() => setShowConfirmDelete(false)}
                        className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={confirmBatchDelete}
                        disabled={isSavingToServer}
                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                      >
                        {isSavingToServer ? (
                          <>
                            <Loader2 size={16} className="animate-spin" />
                            Deleting...
                          </>
                        ) : (
                          <>
                            <Trash2 size={16} />
                            Delete
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="flex justify-end mt-4">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}