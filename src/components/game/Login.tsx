import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Upload, Info, User, Play, PlusCircle, ArrowRight, Clock, Cloud, Download, Loader2, Calendar, Coins, Home, Smile, CloudOff, Trash2, ChevronDown, ChevronUp, Settings, LogOut, Shield, Bell, Palette, Globe, HelpCircle, X, CheckCircle, Monitor, Smartphone, Tablet } from "lucide-react";
import BackgroundBubbles from "./BackgroundBubbles";
import type { GameProgress } from "../../types/game";
import GlassCard from "../ui/GlassCard";
import Button from "../ui/Button";
import { useAuth } from "../../context/AuthContext";
import { loadGameFromServer, getAllSavesFromServer, deleteSaveFromServer } from "../../services/gameService";
import { getUserSessions } from "../../services/userService";
import { NORMALIZED_API_URL } from "../../config/apiConfig";
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

interface Session {
  id: string;
  ipAddress: string;
  device: {
    type: 'mobile' | 'desktop' | 'tablet' | 'unknown';
    browser: string;
    os: string;
  };
  location?: {
    country?: string;
    city?: string;
  };
  lastActive: Date | string;
  createdAt: Date | string;
  isCurrent: boolean;
}

export default function Login({ onStartGame, onLoadGame, onShowTutorial }: LoginProps) {
  const { user, isAuthenticated, checkAuthStatus, setShowLogin, logout } = useAuth();
  const [playerName, setPlayerName] = useState("");
  const [cloudSaves, setCloudSaves] = useState<SaveInfo[]>([]);
  const [showSaves, setShowSaves] = useState(false);
  const [loadingCloudSaves, setLoadingCloudSaves] = useState(false);
  const [savesToDelete, setSavesToDelete] = useState<string[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [authVerified, setAuthVerified] = useState(false);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const [loadingServerSave, setLoadingServerSave] = useState(false);  const [latestSave, setLatestSave] = useState<SaveInfo | null>(null);
  
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);  const [loadingContinue, setLoadingContinue] = useState(false);
  
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [showRevokeAllConfirm, setShowRevokeAllConfirm] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionSuccess, setSessionSuccess] = useState<string | null>(null);
  
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
              console.log('Login: User authenticated, loading cloud saves immediately');
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
    }, 100);
    
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
  
  useEffect(() => {
    if (authVerified && isAuthenticated) {
      console.log('Login: Auth verified, loading cloud saves');
      loadCloudSaves();
    }
  }, [authVerified, isAuthenticated]);
  
  const loadCloudSaves = async () => {
    if (!authVerified) return;
    
    console.log('Login: Loading cloud saves...');
    setLoadingCloudSaves(true);
    try {
      const serverSaves = await getAllSavesFromServer();
      console.log(`Login: Received ${serverSaves.length} saves from server`);
      
      const formattedSaves = serverSaves.map(save => ({
        id: save.id,
        name: save.data.playerName || 'Cloud Save',
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
        const latest = formattedSaves[0];
        console.log(`Login: Setting latest save: ${latest.name} (ID: ${latest.id})`);
        setLatestSave(latest);
      } else {
        console.log('Login: No saves found on server');
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
    if (!latestSave) return;
    
    setLoadingContinue(true);    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      onLoadGame(latestSave.data);
    } catch (error) {
      console.error('Error loading save:', error);
    } finally {
      setLoadingContinue(false);
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
    return 'Just now';  };

  const fetchSessions = async () => {
    setLoadingSessions(true);
    setSessionError(null);
    try {
      const sessions = await getUserSessions();      if (Array.isArray(sessions)) {
        const enhancedSessions = sessions.map((session: any) => {
          const userAgent = session.clientInfo?.userAgent || '';
          let deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown' = 'unknown';
          let browser = 'Unknown';          let os = 'Unknown';

          if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
            deviceType = 'mobile';
          } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
            deviceType = 'tablet';
          } else if (userAgent.includes('Chrome') || userAgent.includes('Firefox') || userAgent.includes('Safari') || userAgent.includes('Edge')) {
            deviceType = 'desktop';
          }

          if (userAgent.includes('Chrome')) browser = 'Chrome';
          else if (userAgent.includes('Firefox')) browser = 'Firefox';
          else if (userAgent.includes('Safari')) browser = 'Safari';
          else if (userAgent.includes('Edge')) browser = 'Edge';

          if (userAgent.includes('Windows')) os = 'Windows';
          else if (userAgent.includes('Mac')) os = 'macOS';
          else if (userAgent.includes('Linux')) os = 'Linux';
          else if (userAgent.includes('Android')) os = 'Android';
          else if (userAgent.includes('iOS')) os = 'iOS';

          return {
            id: session.id,
            ipAddress: session.clientInfo?.ip || 'Unknown',
            device: {
              type: deviceType,
              browser,
              os
            },
            lastActive: new Date(session.lastActive),
            createdAt: new Date(session.createdAt),
            isCurrent: session.current === true
          };
        });
        setSessions(enhancedSessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setSessionError('Failed to load sessions. Please try again later.');
    } finally {
      setLoadingSessions(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    setRevokingSession(sessionId);
    setSessionError(null);
    setSessionSuccess(null);

    try {
      const API_BASE = NORMALIZED_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE}/api/user/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        setSessions(sessions.filter(session => session.id !== sessionId));
        setSessionSuccess('Session revoked successfully');
        setTimeout(() => setSessionSuccess(null), 3000);
      } else {
        setSessionError('Failed to revoke session. Please try again.');
      }
    } catch (error) {
      console.error('Error revoking session:', error);
      setSessionError('Error revoking session. Please try again later.');
    } finally {
      setRevokingSession(null);
    }
  };

  const revokeAllOtherSessions = async () => {
    setRevokingAll(true);
    setSessionError(null);
    setSessionSuccess(null);

    try {
      const API_BASE = NORMALIZED_API_URL || 'http://localhost:3001';
      const response = await fetch(`${API_BASE}/api/user/sessions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        setSessions(sessions.filter(session => session.isCurrent));
        setSessionSuccess('All other sessions revoked successfully');
        setShowRevokeAllConfirm(false);
        setTimeout(() => setSessionSuccess(null), 3000);
      } else {
        setSessionError('Failed to revoke all sessions. Please try again.');
      }
    } catch (error) {
      console.error('Error revoking all sessions:', error);
      setSessionError('Error revoking all sessions. Please try again later.');
    } finally {
      setRevokingAll(false);
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'mobile': return <Smartphone className="text-blue-500" size={16} />;
      case 'tablet': return <Tablet className="text-green-500" size={16} />;
      case 'desktop': return <Monitor className="text-purple-500" size={16} />;
      default: return <Monitor className="text-gray-500" size={16} />;
    }
  };

  const formatSessionDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSessionName = (session: Session) => {
    return `${session.device.browser} on ${session.device.os}`;
  };

  useEffect(() => {
    if (showSettingsModal && isAuthenticated) {
      fetchSessions();
    }
  }, [showSettingsModal, isAuthenticated]);

  return (
    <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-emerald-600 via-teal-600 to-blue-700">
      <BackgroundBubbles />

      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 left-10 w-72 h-72 bg-white rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
        <div className="absolute top-0 right-4 w-72 h-72 bg-yellow-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-8 left-20 w-72 h-72 bg-pink-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-2000"></div>
      </div>
      
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
        <motion.div 
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-8"
        >
          <div className="flex items-center justify-center mb-4">
            <span className="text-8xl mr-4 drop-shadow-lg">🏙️</span>
            <h1 className="text-7xl font-bold text-white tracking-tight drop-shadow-lg">
              neighborville
            </h1>
          </div>
          <p className="text-xl text-white/90 font-medium tracking-wide">
            Build your dream neighborhood
          </p>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="w-full max-w-lg"
        >
          <GlassCard className="p-8 backdrop-blur-lg bg-white/95 border-white/30 shadow-2xl">
            {!showSaves ? (
              <>
                {isAuthenticated && user ? (
                  <>
                    <div className="relative mb-8">
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6 border border-emerald-100 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
                        <div className="relative flex items-center justify-between">
                          <div className="flex items-center">
                            <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mr-4 shadow-lg">
                              <User size={24} className="text-white" />
                            </div>
                            <div>
                              <h3 className="text-xl font-bold text-emerald-800">Welcome back!</h3>
                              <p className="text-emerald-600 font-medium">{user.username}</p>
                              <p className="text-sm text-emerald-500">Ready to continue building?</p>
                            </div>
                          </div>
                          
                          <div className="relative">
                            <button
                              onClick={() => setShowSettingsModal(true)}
                              className="p-3 rounded-xl bg-white/60 hover:bg-white/80 transition-all duration-200 shadow-lg hover:shadow-xl"
                            >
                              <Settings size={20} className="text-emerald-700" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      {authVerified && latestSave && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl p-6 border border-blue-100 relative overflow-hidden"
                        >
                          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100 rounded-full -translate-y-16 translate-x-16 opacity-50"></div>
                          
                          <div className="relative">
                            <div className="flex items-center mb-4">
                              <Cloud size={20} className="text-blue-600 mr-3" />
                              <div>
                                <h4 className="font-semibold text-blue-800">Continue Your City</h4>
                                <p className="text-sm text-blue-600">{latestSave.name} • {latestSave.date}</p>
                              </div>
                            </div>
                            
                            <motion.div
                              animate={loadingContinue ? { scale: [1, 1.02, 1] } : {}}
                              transition={{ duration: 1.5, repeat: loadingContinue ? Infinity : 0 }}
                            >
                              <Button
                                variant="primary"
                                size="lg"
                                fullWidth
                                onClick={handleLoadLatestServerSave}
                                disabled={loadingContinue}
                                className={`transition-all duration-300 ${
                                  loadingContinue 
                                    ? 'bg-gradient-to-r from-blue-400 to-indigo-500 shadow-xl' 
                                    : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg hover:shadow-xl'
                                } text-white`}
                              >
                                {loadingContinue ? (
                                  <motion.div 
                                    className="flex items-center justify-center"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ duration: 0.3 }}
                                  >
                                    <Loader2 size={20} className="animate-spin mr-2" />
                                    <span>Loading your city...</span>
                                    <motion.div
                                      className="ml-2"
                                      animate={{ scale: [1, 1.2, 1] }}
                                      transition={{ duration: 1, repeat: Infinity }}
                                    >
                                      🏙️
                                    </motion.div>
                                  </motion.div>
                                ) : (
                                  <>
                                    <Play size={20} className="mr-2" />
                                    Continue Building
                                  </>
                                )}
                              </Button>
                            </motion.div>
                          </div>
                        </motion.div>
                      )}
                      
                      <div className="grid grid-cols-1 gap-3">
                        <Button
                          variant="success"
                          size="lg"
                          fullWidth
                          icon={<PlusCircle size={20} />}
                          onClick={() => onStartGame(user.username || playerName)}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
                        >
                          Start New City
                        </Button>
                        
                        <Button
                          variant="outline"
                          size="lg"
                          fullWidth
                          icon={<Cloud size={20} />}
                          onClick={() => setShowSaves(true)}
                          className="border-2 border-emerald-200 bg-white hover:bg-emerald-50 text-emerald-700 shadow-sm"
                        >
                          View All Saves
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="text-center mb-8">
                      <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl">
                        <User size={32} className="text-white" />
                      </div>
                      <h2 className="text-3xl font-bold text-gray-800 mb-2">Welcome Mayor!</h2>
                      <p className="text-gray-600 text-lg">Ready to build your dream neighborhood?</p>
                    </div>
                    
                    <div className="space-y-6">
                      <div>
                        <label className="block text-gray-700 text-sm font-semibold mb-3">Your Mayor Name</label>
                        <input
                          type="text"
                          value={playerName}
                          onChange={(e) => setPlayerName(e.target.value)}
                          className="w-full px-6 py-4 rounded-2xl bg-gray-50 text-gray-900 border-2 border-gray-200 placeholder-gray-500 outline-none focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all duration-200 text-lg font-medium"
                          placeholder="Enter your name"
                        />
                      </div>
                      
                      <div className="space-y-3">
                        <Button
                          variant="success"
                          size="lg"
                          fullWidth
                          icon={<Play size={20} />}
                          onClick={handleStartGame}
                          className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white shadow-lg"
                        >
                          Start Building
                        </Button>
                        
                        <div className="grid grid-cols-2 gap-3">
                          <Button
                            variant="outline"
                            icon={<Info size={16} />}
                            onClick={onShowTutorial}
                            className="border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                          >
                            Tutorial
                          </Button>
                          
                          <Button
                            variant="outline"
                            icon={<Upload size={16} />}
                            onClick={() => setShowSaves(true)}
                            className="border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-700"
                          >
                            Load Game
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-center">
                        <p className="text-sm text-gray-500 mb-3">Want to save your progress?</p>
                        <Button
                          variant="ghost"
                          onClick={() => setShowLogin(true)}
                          className="text-emerald-600 hover:bg-emerald-50 font-semibold"
                        >
                          Sign In / Register
                        </Button>
                      </div>
                    </div>
                  </>
                )}
              </>            ) : (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Your Saved Cities</h2>
                  <Button
                    variant="ghost"
                    onClick={() => setShowSaves(false)}
                    className="text-gray-600 hover:bg-gray-100"
                  >
                    Back
                  </Button>
                </div>
                
                {loadingCloudSaves ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 size={32} className="animate-spin text-emerald-500" />
                    <span className="ml-3 text-emerald-600 font-medium">Loading your saves...</span>
                  </div>
                ) : cloudSaves.length > 0 ? (
                  <div className="space-y-4">
                    {cloudSaves.map((save) => (
                      <div 
                        key={save.id} 
                        className="bg-gradient-to-r from-white to-gray-50 border border-gray-200 rounded-2xl p-4 hover:shadow-lg transition-all duration-200"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mr-4">
                              <Home size={20} className="text-white" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">{save.name}</h3>
                              <p className="text-sm text-gray-600">Saved: {save.date}</p>
                            </div>
                          </div>
                          <Button
                            variant="primary"
                            onClick={() => {
                              setShowSaves(false);
                              onLoadGame(save.data);
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                          >
                            Load
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-gray-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <CloudOff size={24} className="text-gray-400" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">No Saves Found</h3>
                    <p className="text-gray-600 mb-6">Start building your first neighborhood!</p>
                    <Button
                      variant="success"
                      onClick={() => {
                        setShowSaves(false);
                        onStartGame(user?.username || playerName || 'Mayor');
                      }}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      Start New City
                    </Button>
                  </div>
                )}
              </>
            )}
          </GlassCard>
        </motion.div>
            
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-8 text-center text-white/70"
        >
          <p className="text-sm">© 2025 NeighborVille • Build, Manage, Thrive</p>
        </motion.div>
      </div>
      
      {showSettingsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          >
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mr-4">
                    <Settings size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">Settings</h3>
                    <p className="text-gray-600">Manage your account and game preferences</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowSettingsModal(false)}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>
              
              <div className="mt-4 bg-white/60 rounded-2xl p-4">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center mr-3">
                    <User size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{user?.username}</p>
                    <p className="text-sm text-gray-600">{user?.email}</p>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <User size={20} className="mr-2 text-emerald-600" />
                    Account Information
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                      <input
                        type="text"
                        value={user?.username || ''}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50"
                        readOnly
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-50"
                        readOnly
                      />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Shield size={20} className="mr-2 text-emerald-600" />
                    Security & Privacy
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                        <div>
                          <p className="font-medium text-green-800">Email Verified</p>
                          <p className="text-sm text-green-600">Your account is secure</p>
                        </div>
                      </div>
                      <CheckCircle size={20} className="text-green-600" />
                    </div>
                    
                    <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl border border-green-100">
                      <div className="flex items-center">
                        <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                        <div>
                          <p className="font-medium text-green-800">Auto-Save Enabled</p>
                          <p className="text-sm text-green-600">Your progress is automatically backed up</p>
                        </div>
                      </div>
                      <Cloud size={20} className="text-green-600" />
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Monitor size={20} className="mr-2 text-emerald-600" />
                    Active Sessions
                  </h4>
                  
                  <div className="flex justify-between items-center mb-4">
                    <button
                      onClick={fetchSessions}
                      disabled={loadingSessions}
                      className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                    >
                      {loadingSessions ? (
                        <Loader2 size={16} className="animate-spin" />
                      ) : (
                        <Shield size={16} />
                      )}
                      {loadingSessions ? 'Loading...' : 'Refresh Sessions'}
                    </button>
                    
                    {sessions.length > 1 && (
                      <div>
                        {!showRevokeAllConfirm ? (
                          <button
                            onClick={() => setShowRevokeAllConfirm(true)}
                            className="bg-red-100 text-red-700 hover:bg-red-200 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
                          >
                            <LogOut size={16} />
                            Revoke All Others
                          </button>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-600">Are you sure?</span>
                            <button
                              onClick={() => setShowRevokeAllConfirm(false)}
                              disabled={revokingAll}
                              className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-3 py-1 rounded text-sm"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={revokeAllOtherSessions}
                              disabled={revokingAll}
                              className="bg-red-600 text-white hover:bg-red-700 px-3 py-1 rounded text-sm flex items-center gap-1"
                            >
                              {revokingAll ? (
                                <Loader2 size={14} className="animate-spin" />
                              ) : (
                                <CheckCircle size={14} />
                              )}
                              {revokingAll ? 'Revoking...' : 'Confirm'}
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  {sessionError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                      <p className="text-red-700 text-sm">{sessionError}</p>
                    </div>
                  )}
                  
                  {sessionSuccess && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
                      <p className="text-green-700 text-sm">{sessionSuccess}</p>
                    </div>
                  )}
                  
                  {loadingSessions ? (
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <Loader2 size={24} className="animate-spin mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600">Loading sessions...</p>
                    </div>
                  ) : sessions.length > 0 ? (
                    <div className="space-y-3">
                      {sessions.map(session => (
                        <div key={session.id} className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {getDeviceIcon(session.device.type)}
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="font-medium text-gray-800">{getSessionName(session)}</p>
                                  {session.isCurrent && (
                                    <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-medium">
                                      Current
                                    </span>
                                  )}
                                </div>
                                <div className="text-sm text-gray-600">
                                  <p>IP: {session.ipAddress}</p>
                                  <p>Last active: {formatSessionDate(session.lastActive)}</p>
                                </div>
                              </div>
                            </div>
                            
                            {!session.isCurrent && (
                              <button
                                onClick={() => revokeSession(session.id)}
                                disabled={revokingSession === session.id}
                                className="text-red-600 hover:text-red-800 p-2 rounded-md hover:bg-red-50 flex items-center gap-1 text-sm"
                              >
                                {revokingSession === session.id ? (
                                  <Loader2 size={14} className="animate-spin" />
                                ) : (
                                  <LogOut size={14} />
                                )}
                                {revokingSession === session.id ? 'Revoking...' : 'Revoke'}
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-gray-50 rounded-lg p-6 text-center">
                      <Monitor size={24} className="mx-auto mb-2 text-gray-400" />
                      <p className="text-gray-600">No sessions found</p>
                      <p className="text-sm text-gray-500">Click "Refresh Sessions" to load your active sessions</p>
                    </div>
                  )}
                </div>
                
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <HelpCircle size={20} className="mr-2 text-emerald-600" />
                    Help & Support
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        setShowSettingsModal(false);
                        onShowTutorial();
                      }}
                      className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-left"
                    >
                      <Info size={20} className="text-blue-600 mr-3" />
                      <div>
                        <p className="font-medium text-blue-800">Tutorial</p>
                        <p className="text-sm text-blue-600">Learn how to play</p>
                      </div>
                    </button>
                    
                    <button className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors text-left">
                      <Globe size={20} className="text-purple-600 mr-3" />
                      <div>
                        <p className="font-medium text-purple-800">Community</p>
                        <p className="text-sm text-purple-600">Join our community</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => setShowSettingsModal(false)}
                    className="border-gray-200 text-gray-700 hover:bg-gray-100"
                  >
                    Close
                  </Button>
                  <Button
                    variant="primary"
                    className="bg-emerald-600 hover:bg-emerald-700 text-white"
                  >
                    Save Changes
                  </Button>                </div>
                
                <button 
                  onClick={() => logout()}
                  className="flex items-center text-red-600 hover:bg-red-50 px-4 py-2 rounded-xl transition-colors"
                >
                  <LogOut size={18} className="mr-2" />
                  <span>Sign Out</span>
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}