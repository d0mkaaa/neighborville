import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, VolumeX, HelpCircle, Settings as SettingsIcon, Music, User, LogOut, Shield, Save, Eye, EyeOff, AlertCircle, CloudUpload, LogIn } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

type SettingsModalProps = {
  isOpen: boolean;
  onClose: () => void;
  musicEnabled: boolean;
  onToggleMusic: () => void;
  audioRef: React.RefObject<HTMLIFrameElement | HTMLAudioElement | null>;
  onShowTutorial: () => void;
  onShowStats: () => void;
  onShowLogin?: () => void;
};

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
  onShowLogin
}: SettingsModalProps) {
  const { user, logout, isGuest } = useAuth();
  const [activeTab, setActiveTab] = useState<'game' | 'account' | 'profile'>('game');
  const [username, setUsername] = useState(user?.username || '');
  const [activeSessions, setActiveSessions] = useState<number>(0);
  const [settings, setSettings] = useState(user?.settings || {
    notifications: true,
    sound: true,
    music: true,
    darkMode: false,
    language: 'en'
  });
  const [lastLoginDate, setLastLoginDate] = useState<Date | null>(null);
  const [lastSaveDate, setLastSaveDate] = useState<Date | null>(null);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);

  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private'>('public');
  const [showBio, setShowBio] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isGuest) {
      setActiveTab('game');
    }
  }, [isGuest]);

  useEffect(() => {
    if (user && isOpen) {
      setUsername(user.username);
      setSettings(user.settings || {});
      
      if (user.profileSettings) {
        setProfileVisibility(user.profileSettings.visibility || 'public');
        setShowBio(user.profileSettings.showBio !== undefined ? user.profileSettings.showBio : true);
        setShowStats(user.profileSettings.showStats !== undefined ? user.profileSettings.showStats : true);
        setShowActivity(user.profileSettings.showActivity !== undefined ? user.profileSettings.showActivity : true);
      }
      
      if (isGuest) {
        setActiveSessions(1);
        setLastLoginDate(new Date());
        setLastSaveDate(null);
        return;
      }
      
      const fetchUserData = async () => {
        setIsLoadingUserData(true);
        try {
          const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });
          
          if (response.ok) {
            const data = await response.json();
            if (data.success && data.user) {
              setLastLoginDate(data.user.lastLogin ? new Date(data.user.lastLogin) : null);
              setLastSaveDate(data.user.lastSave ? new Date(data.user.lastSave) : null);
              
              if (data.user.profileSettings) {
                setProfileVisibility(data.user.profileSettings.visibility || 'public');
                setShowBio(data.user.profileSettings.showBio !== undefined ? data.user.profileSettings.showBio : true);
                setShowStats(data.user.profileSettings.showStats !== undefined ? data.user.profileSettings.showStats : true);
                setShowActivity(data.user.profileSettings.showActivity !== undefined ? data.user.profileSettings.showActivity : true);
              }
            }
          }
          
          const sessionsResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/user/sessions`, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json'
            },
            credentials: 'include'
          });
          
          if (sessionsResponse.ok) {
            const sessionsData = await sessionsResponse.json();
            if (sessionsData.success && sessionsData.sessions) {
              setActiveSessions(sessionsData.sessions.length);
            }
          }
        } catch (error) {
        } finally {
          setIsLoadingUserData(false);
        }
      };
      
      fetchUserData();
    }
  }, [user, isOpen, isGuest]);

  useEffect(() => {
    const savedSettings = localStorage.getItem('profile_settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings);
        setProfileVisibility(settings.visibility || 'public');
        setShowBio(settings.showBio !== undefined ? settings.showBio : true);
        setShowStats(settings.showStats !== undefined ? settings.showStats : true);
        setShowActivity(settings.showActivity !== undefined ? settings.showActivity : true);
      } catch (error) {
        console.error('Failed to parse profile settings', error);
      }
    }
  }, [isOpen]);

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

  const handleUpdateUsername = async () => {
    if (!user || !username.trim()) return;
    
    if (user.isGuest) {
      alert('Please create an account to change your username');
      return;
    }
    
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ username })
      });
      
      alert('Username updated successfully!');
    } catch (error) {
      alert('Failed to update username');
    }
  };

  const handleSaveSettings = async () => {
    if (!user) return;
    
    if (user.isGuest) {
      alert('Please create an account to save settings');
      return;
    }
    
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/user/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ settings })
      });
      
      alert('Settings saved successfully!');
    } catch (error) {
      alert('Failed to save settings');
    }
  };

  const handleEndOtherSessions = async () => {
    if (!user) return;
    
    if (user.isGuest) {
      alert('Please create an account to manage sessions');
      return;
    }
    
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/user/sessions`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      setActiveSessions(1);
      
      alert('All other sessions have been logged out.');
    } catch (error) {
      alert('Failed to end other sessions');
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
  };

  const handleSaveProfileSettings = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    
    if (user?.isGuest) {
      setIsSaving(false);
      setSaveSuccess(false);
      setErrorMessage('Please create an account to save profile settings');
      return;
    }
    
    try {
      const profileSettings = {
        visibility: profileVisibility,
        showBio,
        showStats,
        showActivity
      };
      
      localStorage.setItem('profile_settings', JSON.stringify(profileSettings));
      
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/user/profile/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ profileSettings })
      });
      
      if (!response.ok) {
        throw new Error('Failed to save profile settings');
      }
      
      setIsSaving(false);
      setSaveSuccess(true);
      
      setTimeout(() => {
        setSaveSuccess(null);
      }, 3000);
    } catch (error) {
      setIsSaving(false);
      setSaveSuccess(false);
      setErrorMessage('Failed to save settings. Please try again.');
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
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="bg-white max-w-md w-full rounded-xl shadow-xl overflow-hidden"
          >
            <div className="bg-emerald-500 text-white p-4 flex justify-between items-center">
              <h2 className="text-lg font-medium lowercase flex items-center gap-2">
                <SettingsIcon size={18} />
                settings
              </h2>
              <button
                onClick={onClose}
                className="text-white/80 hover:text-white"
              >
                <X size={20} />
              </button>
            </div>
            
            {isGuest && (
              <div className="bg-blue-50 border-b border-blue-100 p-4">
                <div className="flex items-start">
                  <div className="bg-blue-100 rounded-full p-2 mr-3">
                    <CloudUpload className="text-blue-600" size={20} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-medium text-blue-800">Playing as Guest</h3>
                    <p className="text-xs text-blue-600 mt-1">
                      Create an account to save your progress to the cloud and access your city from any device.
                    </p>
                    <div className="mt-2">
                      <button 
                        onClick={() => {
                          onShowLogin?.();
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
            
            <div className="border-b border-gray-200">
              <nav className="flex">
                <button
                  onClick={() => setActiveTab('game')}
                  className={`px-4 py-3 font-medium text-sm ${
                    activeTab === 'game'
                      ? 'text-emerald-600 border-b-2 border-emerald-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  Game
                </button>
                
                {!isGuest && (
                  <>
                    <button
                      onClick={() => setActiveTab('profile')}
                      className={`px-4 py-3 font-medium text-sm ${
                        activeTab === 'profile'
                          ? 'text-emerald-600 border-b-2 border-emerald-500'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Profile
                    </button>
                    <button
                      onClick={() => setActiveTab('account')}
                      className={`px-4 py-3 font-medium text-sm ${
                        activeTab === 'account'
                          ? 'text-emerald-600 border-b-2 border-emerald-500'
                          : 'text-gray-500 hover:text-gray-700'
                      }`}
                    >
                      Account
                    </button>
                  </>
                )}
              </nav>
            </div>
            
            <div className="p-4">
              {activeTab === 'game' && (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">sound & music</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center">
                          {musicEnabled ? <Music size={18} className="mr-2 text-emerald-500" /> : <Music size={18} className="mr-2 text-gray-400" />}
                          <span>Background Music</span>
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
                        <div className="pt-2">
                          <label className="block text-sm text-gray-600 mb-1">Volume</label>
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
                  
                  <div className="space-y-2">
                    <h3 className="text-sm font-medium text-gray-700">help & tutorial</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      <div className="flex items-center justify-between">
                        <button
                          onClick={() => {
                            onShowTutorial();
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-emerald-100 text-emerald-700 rounded flex items-center hover:bg-emerald-200 transition-colors"
                        >
                          <HelpCircle size={16} className="mr-2" />
                          Show Tutorial
                        </button>
                        
                        <button
                          onClick={() => {
                            onShowStats();
                            onClose();
                          }}
                          className="px-3 py-1.5 bg-amber-100 text-amber-700 rounded flex items-center hover:bg-amber-200 transition-colors"
                        >
                          <User size={16} className="mr-2" />
                          Player Stats
                        </button>
                      </div>
                    </div>
                  </div>
                  
                  {isGuest && (
                    <div className="border-t border-gray-200 pt-4 mt-4">
                      <div className="bg-blue-50 rounded-lg p-4">
                        <h3 className="text-sm font-medium text-blue-800 mb-2">
                          Unlock all features
                        </h3>
                        <p className="text-xs text-blue-600 mb-3">
                          Create an account to unlock cloud saves, access the leaderboard, and customize your profile.
                        </p>
                        <button
                          onClick={() => {
                            onShowLogin?.();
                            onClose();
                          }}
                          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
                        >
                          <LogIn size={16} />
                          Sign Up / Log In
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {activeTab === 'profile' && !isGuest && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
                      {user?.username ? user.username[0].toUpperCase() : 'U'}
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">{user?.username || 'User'}</h3>
                      <p className="text-gray-500">Username cannot be changed</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="font-medium text-gray-900 flex items-center gap-2">
                      <Shield size={18} />
                      Privacy Settings
                    </h4>
                    
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {profileVisibility === 'public' ? (
                            <Eye size={18} className="text-green-600" />
                          ) : (
                            <EyeOff size={18} className="text-gray-600" />
                          )}
                          <span>Profile Visibility</span>
                        </div>
                        <div>
                          <select
                            value={profileVisibility}
                            onChange={(e) => setProfileVisibility(e.target.value as 'public' | 'private')}
                            className="p-2 border border-gray-300 rounded-md"
                          >
                            <option value="public">Public</option>
                            <option value="private">Private</option>
                          </select>
                        </div>
                      </div>
                      
                      {profileVisibility === 'public' && (
                        <div className="pl-6 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Show Bio</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={showBio}
                                onChange={() => setShowBio(!showBio)}
                                className="sr-only peer" 
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Show Stats</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={showStats}
                                onChange={() => setShowStats(!showStats)}
                                className="sr-only peer" 
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Show Activity</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                              <input 
                                type="checkbox" 
                                checked={showActivity}
                                onChange={() => setShowActivity(!showActivity)}
                                className="sr-only peer" 
                              />
                              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {saveSuccess === true && (
                    <div className="p-3 bg-green-50 rounded-lg text-green-700 text-sm">
                      Settings saved successfully!
                    </div>
                  )}
                  
                  {saveSuccess === false && errorMessage && (
                    <div className="p-3 bg-red-50 rounded-lg flex items-center gap-2 text-red-700 text-sm">
                      <AlertCircle size={16} />
                      {errorMessage}
                    </div>
                  )}

                  <button
                    onClick={handleSaveProfileSettings}
                    disabled={isSaving}
                    className={`w-full py-2 px-4 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center justify-center gap-2 ${
                      isSaving ? 'opacity-70 cursor-not-allowed' : ''
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Saving...
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        Save Settings
                      </>
                    )}
                  </button>
                </div>
              )}
              
              {activeTab === 'account' && !isGuest && (
                <div className="space-y-4">
                  {user ? (
                    <>
                      <div>
                        <h3 className="text-sm font-medium text-gray-700 lowercase mb-3">account info</h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center mb-4">
                            <div className="w-12 h-12 bg-emerald-200 rounded-full flex items-center justify-center">
                              <User size={24} className="text-emerald-800" />
                            </div>
                            <div className="ml-3">
                              <p className="text-gray-900 font-medium">{user.username}</p>
                              <p className="text-sm text-gray-500">
                                {user.isGuest ? 'Guest Account' : user.email}
                              </p>
                            </div>
                          </div>

                          <div className="border-t border-gray-200 pt-4">
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Account created</span>
                              <span className="text-gray-800">
                                {user.createdAt 
                                  ? new Date(user.createdAt).toLocaleDateString() 
                                  : isLoadingUserData ? 'Loading...' : 'Unknown'}
                              </span>
                            </div>
                            <div className="flex justify-between text-sm mb-1">
                              <span className="text-gray-600">Last login</span>
                              <span className="text-gray-800">
                                {isLoadingUserData 
                                  ? 'Loading...' 
                                  : lastLoginDate 
                                    ? lastLoginDate.toLocaleString() 
                                    : 'Never'}
                              </span>
                            </div>
                            {(lastSaveDate || isLoadingUserData) && (
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Last game save</span>
                                <span className="text-gray-800">
                                  {isLoadingUserData 
                                    ? 'Loading...' 
                                    : lastSaveDate 
                                      ? lastSaveDate.toLocaleString() 
                                      : 'Never'}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-gray-700 lowercase mb-3">
                          <div className="flex items-center">
                            <Shield size={16} className="text-gray-500 mr-2" />
                            security
                          </div>
                        </h3>
                        <div className="bg-gray-50 rounded-lg p-4">
                          <p className="text-sm text-gray-700 mb-3">
                            You currently have {activeSessions} active session(s).
                          </p>
                          
                          {activeSessions > 1 && (
                            <button
                              onClick={handleEndOtherSessions}
                              className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 text-sm"
                            >
                              Log out other sessions
                            </button>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={handleLogout}
                        className="w-full py-2 flex items-center justify-center bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                      >
                        <LogOut size={16} className="mr-2" />
                        Log Out
                      </button>
                    </>
                  ) : (
                    <div className="text-center py-6">
                      <p className="text-gray-700 mb-3">Please log in to view your account.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}