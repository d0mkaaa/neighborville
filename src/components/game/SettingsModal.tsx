import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, VolumeX, HelpCircle, Settings as SettingsIcon, Music, User, LogOut, Shield, Save, Eye, EyeOff, AlertCircle, CloudUpload, LogIn, Monitor, Smartphone, Tablet, Loader2, CheckCircle, Globe, Info } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getUserSessions } from "../../services/userService";
import { NORMALIZED_API_URL } from "../../config/apiConfig";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  musicEnabled: boolean;
  onToggleMusic: () => void;
  audioRef: React.RefObject<HTMLIFrameElement | HTMLAudioElement | null>;
  onShowTutorial: () => void;
  onShowStats: () => void;
  onShowLogin?: () => void;
  isAuthenticated?: boolean;
  user?: any;
  onLogin?: (userData: { id: string; username: string; email?: string; isGuest?: boolean }) => void;
  onLogout?: () => void;
  onShowAuthModal?: () => void;
};

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

interface ProfileSettings {
  visibility: 'public' | 'private';
  showBio: boolean;
  showStats: boolean;
  showActivity: boolean;
}

export default function SettingsModal({ 
  isOpen, 
  onClose, 
  musicEnabled, 
  onToggleMusic,
  audioRef,
  onShowTutorial,
  onShowStats,
  onShowLogin,
  isAuthenticated: propIsAuthenticated,
  user: propUser,
  onLogin,
  onLogout: propOnLogout,
  onShowAuthModal
}: SettingsModalProps) {
  const authContext = useAuth();
  const user = propUser || authContext.user;
  const isAuthenticated = propIsAuthenticated !== undefined ? propIsAuthenticated : authContext.isAuthenticated;
  const isGuest = user?.isGuest;
  const logout = authContext.logout;

  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [showRevokeAllConfirm, setShowRevokeAllConfirm] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionSuccess, setSessionSuccess] = useState<string | null>(null);

  const fetchSessions = async () => {
    setLoadingSessions(true);
    setSessionError(null);
    try {
      const sessions = await getUserSessions();
      if (Array.isArray(sessions)) {
        const enhancedSessions = sessions.map((session: any) => {
          const userAgent = session.clientInfo?.userAgent || '';
          let deviceType: 'mobile' | 'desktop' | 'tablet' | 'unknown' = 'unknown';
          let browser = 'Unknown';
          let os = 'Unknown';

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

  const handleMusicToggle = () => {
    onToggleMusic();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    
    if (audioRef.current && audioRef.current instanceof HTMLIFrameElement) {
      const widget = (window as any).SC?.Widget(audioRef.current);
      widget?.setVolume(newVolume * 100);
    }
  };

  const handleLogout = () => {
    if (propOnLogout) {
      propOnLogout();
    } else {
      logout();
    }
    onClose();
  };

  useEffect(() => {
    if (isOpen && isAuthenticated && !isGuest) {
      fetchSessions();
    }
  }, [isOpen, isAuthenticated, isGuest]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.3)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mr-4">
                    <SettingsIcon size={24} className="text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-800">Settings</h3>
                    <p className="text-gray-600">Manage your account and game preferences</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <X size={24} className="text-gray-600" />
                </button>
              </div>
              
              {isAuthenticated && user && !isGuest && (
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
              )}
              
              {isGuest && (
                <div className="mt-4 bg-blue-50 rounded-2xl p-4 border border-blue-200">
                  <div className="flex items-center">
                    <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center mr-3">
                      <CloudUpload size={20} className="text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-blue-800">Playing as Guest</p>
                      <p className="text-sm text-blue-600">Create an account to save progress</p>
                    </div>
                    <button
                      onClick={() => {
                        if (onShowAuthModal) {
                          onShowAuthModal();
                        } else {
                          onShowLogin?.();
                        }
                        onClose();
                      }}
                      className="bg-blue-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-600 transition-colors flex items-center gap-1"
                    >
                      <LogIn size={14} />
                      Sign In
                    </button>
                  </div>
                </div>
              )}
            </div>
            
            <div className="p-6 max-h-[60vh] overflow-y-auto">
              <div className="space-y-6">
                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Music size={20} className="mr-2 text-emerald-600" />
                    Game Settings
                  </h4>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center">
                        {musicEnabled ? <Music size={18} className="mr-2 text-emerald-500" /> : <VolumeX size={18} className="mr-2 text-gray-400" />}
                        <span className="font-medium">Background Music</span>
                      </div>
                      <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${musicEnabled ? 'bg-emerald-500' : 'bg-gray-200'}`}
                        onClick={handleMusicToggle}
                      >
                        <span
                          className={`${
                            musicEnabled ? 'translate-x-6' : 'translate-x-1'
                          } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                        />
                      </button>
                    </div>
                    
                    {musicEnabled && (
                      <div>
                        <label className="block text-sm text-gray-600 mb-2">Volume</label>
                        <input
                          type="range"
                          min="0"
                          max="1"
                          step="0.01"
                          defaultValue="0.5"
                          className="w-full accent-emerald-500"
                          onChange={handleVolumeChange}
                        />
                      </div>
                    )}
                  </div>
                </div>

                {isAuthenticated && !isGuest && (
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
                )}

                {isAuthenticated && !isGuest && (
                  <div>
                    <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Shield size={20} className="mr-2 text-emerald-600" />
                      Security & Sessions
                    </h4>
                    
                    <div className="space-y-3 mb-4">
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
                    </div>
                    
                    <div>
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="font-medium text-gray-800">Active Sessions</h5>
                        <div className="flex gap-2">
                          <button
                            onClick={fetchSessions}
                            disabled={loadingSessions}
                            className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 text-sm"
                          >
                            {loadingSessions ? (
                              <Loader2 size={14} className="animate-spin" />
                            ) : (
                              <Shield size={14} />
                            )}
                            {loadingSessions ? 'Loading...' : 'Refresh'}
                          </button>
                          
                          {sessions.length > 1 && (
                            <div>
                              {!showRevokeAllConfirm ? (
                                <button
                                  onClick={() => setShowRevokeAllConfirm(true)}
                                  className="bg-red-100 text-red-700 hover:bg-red-200 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1 text-sm"
                                >
                                  <LogOut size={14} />
                                  Revoke All
                                </button>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => setShowRevokeAllConfirm(false)}
                                    disabled={revokingAll}
                                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-2 py-1 rounded text-xs"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={revokeAllOtherSessions}
                                    disabled={revokingAll}
                                    className="bg-red-600 text-white hover:bg-red-700 px-2 py-1 rounded text-xs flex items-center gap-1"
                                  >
                                    {revokingAll ? (
                                      <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                      <CheckCircle size={12} />
                                    )}
                                    {revokingAll ? 'Revoking...' : 'Confirm'}
                                  </button>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
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
                        <div className="space-y-2">
                          {sessions.map(session => (
                            <div key={session.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  {getDeviceIcon(session.device.type)}
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-medium text-gray-800 text-sm">{getSessionName(session)}</p>
                                      {session.isCurrent && (
                                        <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-medium">
                                          Current
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-xs text-gray-600">
                                      <p>IP: {session.ipAddress}</p>
                                      <p>Last active: {formatSessionDate(session.lastActive)}</p>
                                    </div>
                                  </div>
                                </div>
                                
                                {!session.isCurrent && (
                                  <button
                                    onClick={() => revokeSession(session.id)}
                                    disabled={revokingSession === session.id}
                                    className="text-red-600 hover:text-red-800 p-1.5 rounded-md hover:bg-red-50 flex items-center gap-1 text-xs"
                                  >
                                    {revokingSession === session.id ? (
                                      <Loader2 size={12} className="animate-spin" />
                                    ) : (
                                      <LogOut size={12} />
                                    )}
                                    {revokingSession === session.id ? 'Revoking...' : 'Revoke'}
                                  </button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="bg-gray-50 rounded-lg p-4 text-center">
                          <Monitor size={20} className="mx-auto mb-2 text-gray-400" />
                          <p className="text-gray-600 text-sm">No sessions found</p>
                          <p className="text-xs text-gray-500">Click "Refresh" to load your active sessions</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <HelpCircle size={20} className="mr-2 text-emerald-600" />
                    Help & Support
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        onShowTutorial();
                        onClose();
                      }}
                      className="flex items-center p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors text-left"
                    >
                      <Info size={20} className="text-blue-600 mr-3" />
                      <div>
                        <p className="font-medium text-blue-800">Tutorial</p>
                        <p className="text-sm text-blue-600">Learn how to play</p>
                      </div>
                    </button>
                    
                    <button
                      onClick={() => {
                        onShowStats();
                        onClose();
                      }}
                      className="flex items-center p-4 bg-purple-50 hover:bg-purple-100 rounded-xl transition-colors text-left"
                    >
                      <User size={20} className="text-purple-600 mr-3" />
                      <div>
                        <p className="font-medium text-purple-800">Player Stats</p>
                        <p className="text-sm text-purple-600">View your progress</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 p-6 border-t border-gray-100">
              <div className="flex justify-between items-center">
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
                
                {isAuthenticated && !isGuest && (
                  <button
                    onClick={handleLogout}
                    className="flex items-center text-red-600 hover:bg-red-50 px-4 py-2 rounded-lg transition-colors"
                  >
                    <LogOut size={18} className="mr-2" />
                    <span>Sign Out</span>
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}