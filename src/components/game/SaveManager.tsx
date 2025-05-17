import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Save, Trash2, X, Calendar, Clock, CloudUpload, CheckCircle, AlertCircle, Download, UploadCloud, CloudOff, LogIn, Loader2, CloudLightning, Cloud, Zap, CheckSquare } from "lucide-react";
import type { GameProgress } from "../../types/game";
import { useAuth } from "../../context/AuthContext";
import { getAllSavesFromServer, deleteSaveFromServer, saveGameToServer } from "../../services/gameService";

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
  isAuthenticated,
  lastServerSaveTime,
  onShowLogin,
  addNotification
}: SaveManagerProps) {
  const [cloudSaves, setCloudSaves] = useState<SaveItem[]>([]);
  const [saveName, setSaveName] = useState<string>("");
  const [showConfirmDelete, setShowConfirmDelete] = useState<boolean>(false);
  const [isSavingToServer, setIsSavingToServer] = useState<boolean>(false);
  const [isLoadingCloudSaves, setIsLoadingCloudSaves] = useState<boolean>(false);
  const [serverSaveSuccess, setServerSaveSuccess] = useState<boolean | null>(null);
  const [loadingSave, setLoadingSave] = useState<string | null>(null);
  const [selectedSaves, setSelectedSaves] = useState<string[]>([]);
  const [isSelectMode, setIsSelectMode] = useState<boolean>(false);
  
  const { user } = useAuth();
  const isGuest = !!user?.isGuest;
  
  useEffect(() => {
    if (isOpen) {
      if (isAuthenticated && !isGuest) {
        loadCloudSaves();
      }
      setServerSaveSuccess(null);
      setSelectedSaves([]);
      setIsSelectMode(false);
    }
  }, [isOpen, isAuthenticated, isGuest]);
  
  const loadCloudSaves = async () => {
    if (!isAuthenticated || isGuest) return;
    
    setIsLoadingCloudSaves(true);
    try {
      const allSaves = await getAllSavesFromServer();
      
      const formattedSaves = allSaves.map(save => {
        const timestamp = save.timestamp;
        const date = new Date(timestamp).toLocaleDateString();
        const time = new Date(timestamp).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
        
        return {
          id: save.id,
          key: save.id,
          name: save.data.saveName || save.data.playerName || 'Unnamed Save',
          date: `${date} ${time}`,
          timestamp,
          data: save.data
        };
      }).sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);
      
      setCloudSaves(formattedSaves);
    } catch (error) {
      console.error('Error loading cloud saves', error);
      addNotification?.('Could not load saved games. Please try again.', 'error');
    } finally {
      setIsLoadingCloudSaves(false);
    }
  };
  
  const handleQuickSave = () => {
    if (!isAuthenticated || isGuest) {
      addNotification?.('Please log in to save your game', 'warning');
      if (onShowLogin) onShowLogin();
      return;
    }
    
    handleSaveToServer();
  };
  
  const handleNamedSave = () => {
    if (!isAuthenticated || isGuest) {
      addNotification?.('Please log in to save your game', 'warning');
      if (onShowLogin) onShowLogin();
      return;
    }
    
    const timestamp = Date.now();
    const name = saveName.trim() ? saveName : `${gameData.playerName}'s City`;
    
    setIsSavingToServer(true);
    setServerSaveSuccess(null);
    
    const saveData = {
      ...gameData,
      saveTimestamp: timestamp,
      saveName: name
    };
    
    saveGameToServer(saveData)
      .then(success => {
        setServerSaveSuccess(success);
        if (success) {
          addNotification?.(`Game saved as "${name}"`, 'success');
          loadCloudSaves();
          setSaveName('');
          onSave(name);
        } else {
          addNotification?.('Failed to save game. Please try again.', 'error');
        }
      })
      .catch(error => {
        console.error('Error saving game:', error);
        setServerSaveSuccess(false);
        addNotification?.('Error saving game: ' + error.message, 'error');
      })
      .finally(() => {
        setIsSavingToServer(false);
      });
  };
  
  const handleSaveToServer = async () => {
    if (!isAuthenticated || isGuest) {
      addNotification?.('Please log in to save your game', 'warning');
      if (onShowLogin) onShowLogin();
      return;
    }
    
    if (onSaveToServer) {
      setIsSavingToServer(true);
      setServerSaveSuccess(null);
      
      try {
        const customName = `${gameData.playerName}'s City - ${new Date().toLocaleString()}`;
        const success = await onSaveToServer();
        
        if (success) {
          await saveGameToServer({
            ...gameData,
            saveName: customName,
            saveTimestamp: Date.now()
          });
        }
        
        setServerSaveSuccess(success);
        
        if (success) {
          loadCloudSaves();
          addNotification?.('Game saved to cloud successfully', 'success');
        } else {
          addNotification?.('Failed to save game. Please try again.', 'error');
        }
      } catch (error) {
        console.error("Error saving to server:", error);
        setServerSaveSuccess(false);
        addNotification?.('Error saving game: ' + (error as Error).message, 'error');
      } finally {
        setIsSavingToServer(false);
      }
    }
  };
  
  const handleDeleteCloudSave = async (id: string) => {
    if (!isAuthenticated || isGuest) return;
    
    try {
      setLoadingSave(id);
      
      console.log(`Requesting deletion of cloud save: ${id}`);
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
      const allSaves = await getAllSavesFromServer();
      const save = allSaves.find(s => s.id === id);
      
      if (save) {
        onLoadGame(save.data);
        onClose();
        addNotification?.('Game loaded successfully', 'success');
      } else {
        addNotification?.('Failed to load save. Save not found.', 'error');
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
                        placeholder={`${gameData.playerName}'s City`}
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
                          <CloudUpload size={16} />
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
                        {cloudSaves.map((save) => (
                          <div 
                            key={save.key} 
                            className={`p-3 flex items-center hover:bg-gray-50 transition-colors ${
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
                                <Cloud size={18} />
                              </div>
                            )}
                            
                            <div className="flex-1" onClick={() => !isSelectMode && loadingSave !== save.key && handleLoadCloudSave(save.key)}>
                              <div className="font-medium text-sm text-gray-800 flex items-center cursor-pointer">
                                {save.name}
                              </div>
                              <div className="text-xs text-gray-500 flex items-center gap-1">
                                <Calendar size={12} />
                                {save.date}
                              </div>
                            </div>
                            
                            <div className="flex gap-1">
                              <button
                                onClick={() => !isSelectMode && loadingSave !== save.key && handleLoadCloudSave(save.key)}
                                disabled={loadingSave === save.key || isSelectMode}
                                className={`p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors ${
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
                                  onClick={() => handleDeleteCloudSave(save.key)}
                                  className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                  title="Delete save"
                                >
                                  <Trash2 size={16} />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
              
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
          
          <AnimatePresence>
            {showConfirmDelete && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 backdrop-blur-sm"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="bg-white p-6 rounded-xl shadow-2xl max-w-md w-full mx-4">
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Delete Selected Saves</h3>
                  <p className="text-gray-600 mb-4">
                    Are you sure you want to delete {selectedSaves.length} selected save{selectedSaves.length !== 1 && 's'}?
                    This action cannot be undone.
                  </p>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setShowConfirmDelete(false)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={confirmBatchDelete}
                      className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-1"
                    >
                      <Trash2 size={16} />
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}
    </AnimatePresence>
  );
}