import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, Info, User, Play, PlusCircle, ArrowRight, Clock, Cloud, Download, Loader2, Calendar, Coins, Home, Smile, CloudOff, Trash2, ChevronDown, ChevronUp } from "lucide-react";
import BackgroundBubbles from "./BackgroundBubbles";
import type { GameProgress } from "../../types/game";
import GlassCard from "../ui/GlassCard";
import Button from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { loadGameFromServer, getAllSavesFromServer, deleteSaveFromServer } from "../../services/gameService";
import SaveItem from "../ui/SaveItem";

type LoginProps = {
  onStartGame: (playerName: string) => void;
  onLoadGame: (gameData: GameProgress) => void;
  onShowTutorial: () => void;
};

interface SaveInfo {
  id: string;
  name: string;
  date: string;
  data: GameProgress;
  type: 'cloud';
  timestamp: number;
}

export default function Login({ onStartGame, onLoadGame, onShowTutorial }: LoginProps) {
  const { user, isAuthenticated, checkAuthStatus, setShowLogin } = useAuth();
  const [playerName, setPlayerName] = useState("");
  const [cloudSaves, setCloudSaves] = useState<SaveInfo[]>([]);
  const [showSaves, setShowSaves] = useState(false);
  const [loadingCloudSaves, setLoadingCloudSaves] = useState(false);
  const [savesToDelete, setSavesToDelete] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [authVerified, setAuthVerified] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [loadingServerSave, setLoadingServerSave] = useState(false);
  const [latestSave, setLatestSave] = useState<SaveInfo | null>(null);
  
  useEffect(() => {
    const authCheckTimer = setTimeout(() => {
      if (!isAuthenticated) {
        console.log('Login: User not authenticated, showing login modal');
        setShowLogin(true);
        return;
      }
      
      if (user && (!user.username || user.username.includes('@'))) {
        console.log('Login: User has no username, showing login modal');
        setShowLogin(true);
        return;
      }
      
      if (user?.username) {
        setPlayerName(user.username);
      }

      async function verifyAuth() {
        if (isAuthenticated) {
          try {
            const status = await checkAuthStatus();
            setAuthVerified(status);
            if (status) {
              await loadCloudSaves();
            }
          } catch (error) {
            console.error("Auth verification failed:", error);
            setAuthVerified(false);
          }
        } else {
          setAuthVerified(false);
        }
      }
      
      verifyAuth();
    }, 300);
    
    const handleUnauthorized = () => {
      console.log("Unauthorized event detected in Login page");
      setAuthVerified(false);
    };
    
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    
    return () => {
      clearTimeout(authCheckTimer);
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [user, isAuthenticated, checkAuthStatus, setShowLogin]);
  
  const loadCloudSaves = async () => {
    if (!authVerified) return;
    
    setLoadingCloudSaves(true);
    try {
      const serverSaves = await getAllSavesFromServer();
      
      const formattedSaves = serverSaves.map(save => ({
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
      
      setCloudSaves(formattedSaves);
      
      if (formattedSaves.length > 0) {
        setLatestSave(formattedSaves[0]);
      }
    } catch (err) {
      console.error("Error loading cloud saves:", err);
    } finally {
      setLoadingCloudSaves(false);
    }
  };
  
  const handleStartGame = () => {
    if (!isAuthenticated) {
      setShowLogin(true);
      return;
    }
    
    if (!user?.username || user.username.includes('@')) {
      setShowLogin(true);
      return;
    }
    
    if (playerName.trim() === "") {
      setPlayerName(user.username);
    }
    
    onStartGame(playerName || user.username);
  };

  const handleDeleteCloudSave = async (id: string) => {
    if (!authVerified) {
      console.warn('Cannot delete cloud save: not authenticated');
      setShowLogin(true);
      return;
    }
    
    try {
      setIsDeleting(true);
      const success = await deleteSaveFromServer(id);
      
      if (success) {
        setCloudSaves(prev => prev.filter(save => save.id !== id));
        
        if (latestSave && latestSave.id === id) {
          const newSaves = cloudSaves.filter(save => save.id !== id);
          setLatestSave(newSaves.length > 0 ? newSaves[0] : null);
        }
      }
    } catch (error) {
      console.error('Error deleting cloud save:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteSelected = async () => {
    if (!savesToDelete.length) return;
    
    if (!authVerified) {
      setShowLogin(true);
      return;
    }
    
    setIsDeleting(true);
    
    for (const id of savesToDelete) {
      try {
        await deleteSaveFromServer(id);
      } catch (error) {
        console.error(`Error deleting save ${id}:`, error);
      }
    }
    
    loadCloudSaves();
    setSavesToDelete([]);
    setIsDeleting(false);
  };

  const handleToggleDelete = (id: string) => {
    if (savesToDelete.includes(id)) {
      setSavesToDelete(prev => prev.filter(saveId => saveId !== id));
    } else {
      setSavesToDelete(prev => [...prev, id]);
    }
  };

  const handleLoadLatestServerSave = async () => {
    if (!authVerified) {
      console.warn('Cannot load cloud save: not authenticated');
      setShowLogin(true);
      return;
    }
    
    setLoadingServerSave(true);
    try {
      if (latestSave) {
        onLoadGame(latestSave.data);
      } else {
        const { gameData } = await loadGameFromServer();
        
        if (gameData) {
          onLoadGame(gameData);
        } else {
          alert('No cloud save found. Create a new city and it will be saved automatically.');
        }
      }
    } catch (error) {
      console.error('Error loading cloud save:', error);
    } finally {
      setLoadingServerSave(false);
    }
  };
  
  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
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
              {isAuthenticated && user ? (
                <>
                  <div className="bg-emerald-50 rounded-lg p-4 mb-6 border border-emerald-100">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                        <User size={18} className="text-emerald-700" />
                      </div>
                      <div>
                        <p className="text-emerald-800 font-medium">Welcome back, {user.username}!</p>
                        <p className="text-sm text-emerald-600">Ready to build a new city?</p>
                      </div>
                    </div>
                  </div>
                  
                  {latestSave && (
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex justify-between mb-2">
                        <h3 className="text-blue-800 font-medium">Last Played</h3>
                        <span className="text-xs text-blue-600">{formatTimeAgo(latestSave.timestamp)}</span>
                      </div>
                      <div className="flex items-center">
                        <div className="flex-1">
                          <div className="font-medium text-blue-700">{latestSave.name}</div>
                          <div className="grid grid-cols-3 gap-1 mt-1 text-xs text-blue-600">
                            <div className="flex items-center">
                              <Calendar size={10} className="mr-1" />
                              Day {latestSave.data.day}
                            </div>
                            <div className="flex items-center">
                              <Coins size={10} className="mr-1" />
                              {latestSave.data.coins} coins
                            </div>
                            <div className="flex items-center">
                              <Smile size={10} className="mr-1" />
                              {latestSave.data.happiness}% happy
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-1 gap-4">
                    {authVerified && (
                      <Button
                        variant="primary"
                        size="lg"
                        fullWidth
                        icon={<Cloud size={20} />}
                        onClick={handleLoadLatestServerSave}
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                        disabled={loadingServerSave}
                      >
                        {loadingServerSave ? (
                          <>
                            <Loader2 size={20} className="animate-spin mr-2" />
                            loading cloud save...
                          </>
                        ) : (
                          <>continue from cloud</>
                        )}
                      </Button>
                    )}
                    
                    <Button
                      variant="success"
                      size="lg"
                      fullWidth
                      icon={<PlusCircle size={20} />}
                      onClick={() => onStartGame(user.username || playerName)}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      start new city
                    </Button>
                  
                    <Button
                      variant="secondary"
                      size="lg"
                      fullWidth
                      icon={<ArrowRight size={20} />}
                      onClick={() => setShowSaves(true)}
                      className="border border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700"
                    >
                      view all saved cities
                    </Button>
                    
                    <Button
                      variant="ghost"
                      icon={<Info size={16} />}
                      onClick={onShowTutorial}
                      className="text-gray-700 hover:bg-gray-100"
                    >
                      how to play
                    </Button>
                  </div>
                </>
              ) : (
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
              )}
            </>
          ) : (
            <>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-medium text-gray-800 lowercase">
                  saved cities
                </h2>
                <div className="flex gap-2">
                  {isAuthenticated && authVerified && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => loadCloudSaves()}
                      className="text-blue-600 hover:bg-blue-50"
                    >
                      <Cloud size={16} className="mr-1" />
                      refresh
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSaves(false)}
                    className="text-gray-700 hover:bg-gray-100"
                  >
                    back
                  </Button>
                </div>
              </div>
              
              {loadingCloudSaves ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 size={24} className="animate-spin text-blue-500" />
                  <span className="ml-2 text-blue-600">Loading cloud saves...</span>
                </div>
              ) : cloudSaves.length > 0 ? (
                <div>
                  <div className="space-y-3 max-h-80 overflow-y-auto pr-1 no-scrollbar">
                    {cloudSaves.map((save) => (
                      <div 
                        key={save.id} 
                        className={`bg-white border ${savesToDelete.includes(save.id) ? 'border-red-300' : 'border-gray-200'} rounded-lg p-3 relative transition-all hover:shadow-md`}
                      >
                        <div className="flex justify-between">
                          <div className="flex-1">
                            <div className="flex items-center">
                              <h3 className="font-medium text-gray-800">{save.name}</h3>
                              <span className="ml-2 bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full flex items-center">
                                <Cloud size={10} className="mr-1" />
                                Cloud
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <div className="text-xs text-gray-500">{save.date}</div>
                              <div className="text-xs text-gray-500">{formatTimeAgo(save.timestamp)}</div>
                            </div>
                            
                            <div className="grid grid-cols-3 gap-2 mt-2">
                              <div className="flex items-center text-xs text-gray-600">
                                <Calendar size={10} className="mr-1" />
                                Day {save.data.day}
                              </div>
                              <div className="flex items-center text-xs text-gray-600">
                                <Coins size={10} className="mr-1" />
                                {save.data.coins} coins
                              </div>
                              <div className="flex items-center text-xs text-gray-600">
                                <Smile size={10} className="mr-1" />
                                {save.data.happiness}% happy
                              </div>
                            </div>
                            
                            <div className="mt-2 text-xs text-gray-500 flex gap-2 flex-wrap">
                              <span className="px-1.5 py-0.5 bg-gray-100 rounded-full">
                                <Home size={10} className="inline mr-1" />
                                {save.data.grid?.filter(item => item !== null).length || 0} buildings
                              </span>
                              {save.data.level && (
                                <span className="px-1.5 py-0.5 bg-purple-50 text-purple-600 rounded-full">
                                  Level {save.data.level}
                                </span>
                              )}
                              {save.data.weather && (
                                <span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded-full">
                                  {save.data.weather}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex mt-2 justify-between">
                          <div className="flex">
                            <button
                              onClick={() => handleToggleDelete(save.id)}
                              className={`p-1.5 rounded-full mr-1 ${savesToDelete.includes(save.id) ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'} hover:bg-red-100 hover:text-red-600`}
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                          <button
                            onClick={() => onLoadGame(save.data)}
                            className="bg-blue-500 text-white text-xs font-medium py-1.5 px-3 rounded hover:bg-blue-600 transition-colors flex items-center"
                          >
                            <Play size={12} className="mr-1" />
                            Load Game
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {savesToDelete.length > 0 && (
                    <div className="mt-3 flex justify-between items-center bg-red-50 p-2 rounded">
                      <span className="text-sm text-red-700">
                        {savesToDelete.length} {savesToDelete.length === 1 ? 'save' : 'saves'} selected
                      </span>
                      <button
                        onClick={handleDeleteSelected}
                        disabled={isDeleting}
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
              ) : (
                <div className="p-10 text-center bg-gray-50 rounded-lg flex flex-col items-center">
                  <CloudOff size={28} className="text-gray-400 mb-2" />
                  <p className="text-gray-600">No cloud saves found</p>
                  <p className="text-xs text-gray-500 mt-1">Your games will be saved to the cloud automatically</p>
                </div>
              )}
              
              <div className="mt-4 flex flex-col gap-3">
                {cloudSaves.length === 0 && authVerified && (
                  <p className="text-xs text-center text-gray-600 mb-1">
                    Start a new game and your progress will be automatically saved to the cloud
                  </p>
                )}
                
                <Button
                  variant="success"
                  size="lg"
                  fullWidth
                  icon={<Play size={20} />}
                  onClick={() => {
                    setShowSaves(false);
                    const name = user?.username || playerName || 'Mayor';
                    if (name) onStartGame(name);
                  }}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  start new city
                </Button>
                
                <Button
                  variant={showMoreOptions ? "secondary" : "ghost"}
                  size="sm"
                  fullWidth
                  onClick={() => setShowMoreOptions(!showMoreOptions)}
                  className="text-gray-600"
                >
                  {showMoreOptions ? (
                    <span className="flex items-center justify-center">
                      <ChevronUp size={16} className="mr-1" />
                      Hide options
                    </span>
                  ) : (
                    <span className="flex items-center justify-center">
                      <ChevronDown size={16} className="mr-1" />
                      More options
                    </span>
                  )}
                </Button>
                
                {showMoreOptions && (
                  <div className="text-xs text-center text-gray-500 bg-gray-50 rounded-lg p-3">
                    <p>Cloud saves are automatically synced across devices when you log in.</p>
                    <p className="mt-1">You need to be logged in to save and load games.</p>
                  </div>
                )}
              </div>
            </>
          )}
        </GlassCard>
      </div>
    </div>
  );
}