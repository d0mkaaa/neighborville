import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Volume2, VolumeX, HelpCircle, Settings as SettingsIcon, Music, User, LogOut, Shield, 
  Save, Eye, EyeOff, AlertCircle, Upload, LogIn, Monitor, Smartphone, Tablet, 
  Loader2, CheckCircle, Globe, Info, Camera, Edit, Star, Trophy, Building2, 
  TrendingUp, Users, Clock, Award, Activity, Heart, MapPin, ExternalLink,
  Copy, Check, Share2, UserPlus, Bookmark, Flag, Home, BarChart3, 
  Crown, Sparkles, Medal, Target, PieChart, LineChart
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { getUserSessions } from "../../services/userService";
import { NORMALIZED_API_URL } from "../../config/apiConfig";
import { loadNeighborhoodFromServer } from "../../services/neighborhoodService";
import TwoFactorSettings from "../settings/TwoFactorSettings";
import PublicProfileModal from "../profile/PublicProfileModal";
import ProfileSettings from "../profile/ProfileSettings";
import UpdateLogModal from "./UpdateLogModal";
import Button from "../ui/Button";

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

interface ProfileData {
  cityName: string;
  level: number;
  rank: string;
  mayorRating: number;
  totalBuildings: number;
  population: number;
  achievements: number;
  playTime: number;
  specialties: string[];
  joinDate: string;
  totalValue: number;
  incomePerDay: number;
  neighborhoodAge: number;
  profileSettings?: {
    visibility: 'public' | 'private';
    showBio: boolean;
    showStats: boolean;
    showActivity: boolean;
    showSocialLinks: boolean;
    showAchievements: boolean;
  };
  extendedProfile?: {
    bio: string;
    location: string;
    website: string;
    interests: string[];
  };
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

  const [activeTab, setActiveTab] = useState('profile');
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [revokingSession, setRevokingSession] = useState<string | null>(null);
  const [revokingAll, setRevokingAll] = useState(false);
  const [showRevokeAllConfirm, setShowRevokeAllConfirm] = useState(false);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [sessionSuccess, setSessionSuccess] = useState<string | null>(null);
  const [showPublicProfile, setShowPublicProfile] = useState(false);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [versionInfo, setVersionInfo] = useState<any>(null);
  const [showUpdateLog, setShowUpdateLog] = useState(false);

  useEffect(() => {
    if (isOpen && isAuthenticated && !isGuest && !profileData) {
      loadProfileData();
    }
  }, [isOpen, isAuthenticated, isGuest]);

  useEffect(() => {
    if (isOpen && activeTab === 'security' && isAuthenticated && !isGuest && sessions.length === 0 && !loadingSessions) {
      fetchSessions();
    }
  }, [isOpen, activeTab, isAuthenticated, isGuest]);

  useEffect(() => {
    if (isOpen) {
      loadVersionInfo();
    }
  }, [isOpen]);

  const loadProfileData = async () => {
    if (!isAuthenticated || isGuest) return;
    
    setLoadingProfile(true);
    try {
      const gameDataResult = await loadNeighborhoodFromServer();
      
      const profileResponse = await fetch(`${NORMALIZED_API_URL}/api/user/profile`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      let profileInfo = null;
      if (profileResponse.ok) {
        const profileData = await profileResponse.json();
        if (profileData.success) {
          profileInfo = profileData.user;
        }
      }

      if (gameDataResult.success && gameDataResult.gameData) {
        const gameData = gameDataResult.gameData;

        const totalBuildings = gameData.grid?.filter(cell => cell !== null).length || 0;
        const totalResidents = gameData.neighbors?.filter(n => n.hasHome).length || 0;
        const completedAchievements = gameData.completedAchievements?.length || 0;
        
        const foundedDate = gameData.neighborhoodFoundedDate || Date.now();
        const ageInDays = Math.floor((Date.now() - foundedDate) / (1000 * 60 * 60 * 24));
        
        const baseRating = Math.min(5, (gameData.level || 1) / 10 + completedAchievements * 0.1);
        
        let rank = 'Novice Mayor';
        if (gameData.level >= 50) rank = 'Legendary Mayor';
        else if (gameData.level >= 30) rank = 'Master Mayor';
        else if (gameData.level >= 20) rank = 'Expert Mayor';
        else if (gameData.level >= 10) rank = 'Experienced Mayor';
        else if (gameData.level >= 5) rank = 'Junior Mayor';

        const buildingTypes: { [key: string]: number } = {};
        gameData.grid?.forEach(cell => {
          if (cell && cell.type) {
            buildingTypes[cell.type] = (buildingTypes[cell.type] || 0) + 1;
          }
        });

        const specialties = Object.entries(buildingTypes)
          .sort(([,a], [,b]) => b - a)
          .slice(0, 3)
          .map(([type]) => {
            switch(type) {
              case 'house': return 'Residential Development';
              case 'apartment': return 'Urban Housing';
              case 'shop': return 'Commercial Growth';
              case 'park': return 'Green Development';
              case 'school': return 'Education Focus';
              case 'hospital': return 'Healthcare Priority';
              default: return 'Mixed Development';
            }
          });

        setProfileData({
          cityName: gameData.neighborhoodName || 'Unnamed City',
          level: gameData.level || 1,
          rank,
          mayorRating: Math.round(baseRating * 10) / 10,
          totalBuildings,
          population: totalResidents,
          achievements: completedAchievements,
          playTime: gameData.day || 1,
          specialties,
          joinDate: new Date(foundedDate).toLocaleDateString(),
          totalValue: gameData.coins || 0,
          incomePerDay: Math.floor((gameData.coins || 0) / Math.max(gameData.day || 1, 1)),
          neighborhoodAge: ageInDays,
          profileSettings: profileInfo?.profileSettings || {
            visibility: 'public',
            showBio: true,
            showStats: true,
            showActivity: true,
            showSocialLinks: false,
            showAchievements: true
          },
          extendedProfile: profileInfo?.extendedProfile || {
            bio: '',
            location: '',
            website: '',
            interests: []
          }
        });
      } else {
        setProfileData({
          cityName: 'New City',
          level: 1,
          rank: 'Novice Mayor',
          mayorRating: 1.0,
          totalBuildings: 0,
          population: 0,
          achievements: 0,
          playTime: 0,
          specialties: [],
          joinDate: new Date().toLocaleDateString(),
          totalValue: 0,
          incomePerDay: 0,
          neighborhoodAge: 0,
          profileSettings: profileInfo?.profileSettings,
          extendedProfile: profileInfo?.extendedProfile
        });
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchSessions = async () => {
    if (!isAuthenticated || isGuest) return;
    
    setLoadingSessions(true);
    setSessionError(null);
    
    try {
      const sessionsData = await getUserSessions();
      if (sessionsData.success && sessionsData.sessions) {
        const transformedSessions = sessionsData.sessions.map(session => {
          const deviceInfo = session.device || session.clientInfo || {};
          const userAgent = deviceInfo.userAgent || session.clientInfo?.userAgent || '';
          
          const parseUserAgent = (ua: string) => {
            const isMobile = /Mobile|Android|iPhone|iPad/i.test(ua);
            const isTablet = /iPad|Tablet/i.test(ua);
            let browser = 'Unknown';
            let os = 'Unknown';
            
            if (ua.includes('Chrome')) browser = 'Chrome';
            else if (ua.includes('Firefox')) browser = 'Firefox';
            else if (ua.includes('Safari')) browser = 'Safari';
            else if (ua.includes('Edge')) browser = 'Edge';
            
            if (ua.includes('Windows')) os = 'Windows';
            else if (ua.includes('Mac')) os = 'macOS';
            else if (ua.includes('Linux')) os = 'Linux';
            else if (ua.includes('Android')) os = 'Android';
            else if (ua.includes('iOS')) os = 'iOS';
            
            return {
              type: isTablet ? 'tablet' : isMobile ? 'mobile' : 'desktop',
              browser,
              os
            };
          };
          
          const parsedDevice = parseUserAgent(userAgent);
          
          return {
            id: session.id,
            ipAddress: session.clientInfo?.ip || deviceInfo.ip || 'Unknown',
            device: {
              type: deviceInfo.type || parsedDevice.type,
              browser: deviceInfo.browser || parsedDevice.browser,
              os: deviceInfo.os || parsedDevice.os
            },
            location: session.clientInfo?.location || deviceInfo.location || {},
            lastActive: session.lastActive,
            createdAt: session.createdAt,
            isCurrent: session.current || session.isCurrent || false
          };
        });
        
        setSessions(transformedSessions);
      } else {
        setSessionError('Failed to load session data');
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setSessionError('Failed to load session data');
    } finally {
      setLoadingSessions(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    if (!isAuthenticated || isGuest) return;
    
    setRevokingSession(sessionId);
    setSessionError(null);
    setSessionSuccess(null);

    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/user/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        setSessions(prev => prev.filter(session => session.id !== sessionId));
        setSessionSuccess('Session revoked successfully');
      } else {
        setSessionError(data.message || 'Failed to revoke session');
      }
    } catch (error) {
      console.error('Error revoking session:', error);
      setSessionError('Failed to revoke session');
    } finally {
      setRevokingSession(null);
    }
  };

  const revokeAllOtherSessions = async () => {
    if (!isAuthenticated || isGuest) return;
    
    setRevokingAll(true);
    setSessionError(null);
    setSessionSuccess(null);

    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/user/sessions/revoke-all`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      const data = await response.json();
      if (data.success) {
        setSessions(prev => prev.filter(session => session.isCurrent));
        setSessionSuccess('All other sessions revoked successfully');
        setShowRevokeAllConfirm(false);
      } else {
        setSessionError(data.message || 'Failed to revoke sessions');
      }
    } catch (error) {
      console.error('Error revoking sessions:', error);
      setSessionError('Failed to revoke sessions');
    } finally {
      setRevokingAll(false);
    }
  };

  const getDeviceIcon = (type: string) => {
    if (!type) return <Monitor size={16} />;
    switch (type.toLowerCase()) {
      case 'mobile': return <Smartphone size={16} />;
      case 'tablet': return <Tablet size={16} />;
      default: return <Monitor size={16} />;
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
    if (!session.device) return 'Unknown Device';
    return `${session.device.browser || 'Unknown Browser'} on ${session.device.os || 'Unknown OS'}`;
  };

  const handleMusicToggle = () => {
    onToggleMusic();
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseInt(e.target.value) / 100;
    if (audioRef.current) {
      if ('volume' in audioRef.current) {
        audioRef.current.volume = volume;
      }
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

  const handleCopyProfile = async () => {
    try {
      const profileUrl = `${window.location.origin}/profile/${user?.username || user?.id}`;
      await navigator.clipboard.writeText(profileUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy profile URL:', error);
    }
  };

  const loadVersionInfo = async () => {
    try {
      const { fetchVersionFromAPI } = await import('../../services/versionService');
      const version = await fetchVersionFromAPI();
      setVersionInfo(version);
    } catch (error) {
      console.warn('Failed to load version info:', error);
    }
  };

  const renderProfileTab = () => (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
              <User className="text-white" size={24} />
            </div>
            <div>
              <h3 className="text-xl font-bold">{profileData?.cityName || "Your City"}</h3>
              <p className="text-blue-100">Level {profileData?.level || 1} • {profileData?.rank || "Novice Mayor"}</p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1 mb-1">
              <Star className="text-yellow-300" size={16} />
              <span className="font-semibold">{profileData?.mayorRating || 0}</span>
            </div>
            <p className="text-blue-100 text-sm">Mayor Rating</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-blue-100 text-sm">Population</p>
            <p className="text-xl font-bold">{profileData?.population?.toLocaleString() || "0"}</p>
          </div>
          <div>
            <p className="text-blue-100 text-sm">Buildings</p>
            <p className="text-xl font-bold">{profileData?.totalBuildings || 0}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-green-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="text-green-600" size={20} />
            <span className="font-semibold text-green-800">City Value</span>
          </div>
          <p className="text-2xl font-bold text-green-900">
            ${profileData?.totalValue?.toLocaleString() || "0"}
          </p>
        </div>
        
        <div className="bg-blue-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Building2 className="text-blue-600" size={20} />
            <span className="font-semibold text-blue-800">Buildings</span>
          </div>
          <p className="text-2xl font-bold text-blue-900">{profileData?.totalBuildings || 0}</p>
        </div>
        
        <div className="bg-yellow-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="text-yellow-600" size={20} />
            <span className="font-semibold text-yellow-800">Daily Income</span>
          </div>
          <p className="text-2xl font-bold text-yellow-900">
            ${profileData?.incomePerDay?.toLocaleString() || "0"}
          </p>
        </div>
        
        <div className="bg-purple-50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="text-purple-600" size={20} />
            <span className="font-semibold text-purple-800">Play Time</span>
          </div>
          <p className="text-2xl font-bold text-purple-900">{profileData?.playTime || 0}h</p>
        </div>
      </div>

      {profileData?.specialties && profileData.specialties.length > 0 && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Crown className="text-yellow-500" size={18} />
            Mayor Specialties
          </h4>
          <div className="flex flex-wrap gap-2">
            {profileData.specialties.map((specialty, index) => (
              <span
                key={index}
                className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium"
              >
                {specialty}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="space-y-3">
        <button
          onClick={() => setShowPublicProfile(true)}
          className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Eye className="text-blue-500" size={20} />
            <span className="font-medium">View as Others See It</span>
          </div>
          <ExternalLink className="text-gray-400" size={16} />
        </button>
        
        <button
          onClick={handleCopyProfile}
          className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            {copied ? (
              <Check className="text-green-500" size={20} />
            ) : (
              <Copy className="text-blue-500" size={20} />
            )}
            <span className="font-medium">
              {copied ? "Profile URL Copied!" : "Copy Profile URL"}
            </span>
          </div>
        </button>
        
        <button
          onClick={() => setShowProfileSettings(true)}
          className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <Edit className="text-blue-500" size={20} />
            <span className="font-medium">Edit Profile</span>
          </div>
        </button>
      </div>
    </div>
  );

  const renderAudioTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Music className="text-blue-500" size={20} />
          Audio Settings
        </h3>
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Background Music</label>
            <button
              onClick={handleMusicToggle}
              className={`
                relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                ${musicEnabled ? 'bg-blue-600' : 'bg-gray-300'}
              `}
            >
              <span
                className={`
                  inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                  ${musicEnabled ? 'translate-x-6' : 'translate-x-1'}
                `}
              />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Volume2 size={16} />
              Volume
            </label>
            <input
              type="range"
              min="0"
              max="100"
              defaultValue="50"
              onChange={handleVolumeChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium text-gray-800 mb-2">Audio Information</h4>
            <p className="text-sm text-gray-600">
              Adjust your audio settings to enhance your gaming experience. 
              Music will loop continuously while playing.
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderAccountTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <User className="text-blue-500" size={20} />
          Account Information
        </h3>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="flex items-center justify-between mb-3">
              <span className="font-medium text-gray-700">Username</span>
              <span className="text-gray-900">{user?.username || 'Guest'}</span>
            </div>
            {user?.email && (
              <div className="flex items-center justify-between mb-3">
                <span className="font-medium text-gray-700">Email</span>
                <span className="text-gray-900">{user.email}</span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="font-medium text-gray-700">Account Type</span>
              <span className={`px-2 py-1 rounded text-sm ${
                isGuest ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'
              }`}>
                {isGuest ? 'Guest' : 'Registered'}
              </span>
            </div>
          </div>

          {isGuest && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="text-yellow-600" size={20} />
                <span className="font-medium text-yellow-800">Guest Account</span>
              </div>
              <p className="text-sm text-yellow-700 mb-3">
                You're playing as a guest. Create an account to save your progress and access all features.
              </p>
              <button 
                onClick={onShowAuthModal}
                className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
              >
                <Upload size={16} />
                Create Account
              </button>
            </div>
          )}

          {!isGuest && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Check className="text-green-600" size={20} />
                <span className="font-medium text-green-800">Registered Account</span>
              </div>
              <p className="text-sm text-green-700">
                Your account is active and your progress is automatically saved. Profile settings and export options are available in the Profile tab.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );

  const renderSecurityTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <Shield className="text-blue-500" size={20} />
          Security & Sessions
        </h3>
        
        {!isGuest ? (
          <div className="space-y-6">
            <TwoFactorSettings />
            
            <div>
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-gray-800">Active Sessions</h4>
                <button
                  onClick={fetchSessions}
                  disabled={loadingSessions}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium disabled:opacity-50"
                >
                  {loadingSessions ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {sessionError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
                  {sessionError}
                </div>
              )}

              {sessionSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-4">
                  {sessionSuccess}
                </div>
              )}

              <div className="space-y-2">
                {loadingSessions ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="animate-spin text-blue-500" size={24} />
                  </div>
                ) : sessions.length > 0 ? (
                  sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        {getDeviceIcon(session.device.type)}
                        <div>
                          <p className="font-medium text-gray-900">
                            {getSessionName(session)}
                            {session.isCurrent && (
                              <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-800 text-xs rounded">
                                Current
                              </span>
                            )}
                          </p>
                          <p className="text-sm text-gray-600">
                            {session.ipAddress} • {formatSessionDate(session.lastActive)}
                          </p>
                        </div>
                      </div>
                      {!session.isCurrent && (
                        <button
                          onClick={() => revokeSession(session.id)}
                          disabled={revokingSession === session.id}
                          className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                        >
                          {revokingSession === session.id ? 'Revoking...' : 'Revoke'}
                        </button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-600 text-center py-4">Click refresh to load sessions</p>
                )}
              </div>

              {sessions.filter(s => !s.isCurrent).length > 1 && (
                <div className="mt-4">
                  {showRevokeAllConfirm ? (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                      <p className="text-red-800 mb-3">
                        Are you sure you want to revoke all other sessions? This will log you out of all other devices.
                      </p>
                      <div className="flex gap-2">
                        <button
                          onClick={revokeAllOtherSessions}
                          disabled={revokingAll}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm"
                        >
                          {revokingAll ? 'Revoking...' : 'Yes, Revoke All'}
                        </button>
                        <button
                          onClick={() => setShowRevokeAllConfirm(false)}
                          className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 text-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setShowRevokeAllConfirm(true)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Revoke All Other Sessions
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="text-yellow-600" size={20} />
              <span className="font-medium text-yellow-800">Guest Account</span>
            </div>
            <p className="text-sm text-yellow-700 mb-3">
              Security features are only available for registered accounts.
            </p>
            <button 
              onClick={onShowAuthModal}
              className="flex items-center gap-2 px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors"
            >
              <LogIn size={16} />
              Create Account
            </button>
          </div>
        )}
      </div>
    </div>
  );

  const renderHelpTab = () => (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <HelpCircle className="text-blue-500" size={20} />
          Help & Support
        </h3>
        
        <div className="space-y-3">
          <button 
            onClick={onShowTutorial}
            className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <Info className="text-blue-500" size={20} />
              <span className="font-medium">Show Tutorial</span>
            </div>
          </button>
          
          <button 
            onClick={onShowStats}
            className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <BarChart3 className="text-green-500" size={20} />
              <span className="font-medium">Game Statistics</span>
            </div>
          </button>
          
          <button className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <Globe className="text-purple-500" size={20} />
              <span className="font-medium">Online Documentation</span>
            </div>
            <ExternalLink className="text-gray-400" size={16} />
          </button>
          
          <button className="w-full flex items-center justify-between p-3 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center gap-3">
              <AlertCircle className="text-orange-500" size={20} />
              <span className="font-medium">Report Bug</span>
            </div>
            <ExternalLink className="text-gray-400" size={16} />
          </button>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-6 rounded-xl border border-indigo-200 mt-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
                <Info className="w-4 h-4 text-white" />
              </div>
              <h4 className="font-bold text-gray-800">Game Version</h4>
            </div>
            <button
              onClick={() => setShowUpdateLog(true)}
              className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              View Updates
            </button>
          </div>
          {versionInfo ? (
            <>
              <div className="mb-3">
                <p className="text-lg font-bold text-indigo-700 mb-1">
                  NeighborVille v{versionInfo.version}
                  {versionInfo.commit !== 'unknown' && (
                    <span className="ml-2 font-mono text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded-md">
                      {versionInfo.commit.substring(0, 7)}
                    </span>
                  )}
                </p>
                <p className="text-sm text-gray-600">
                  Built on {new Date(versionInfo.buildDate).toLocaleDateString()} • {versionInfo.environment}
                </p>
              </div>
            </>
          ) : (
            <>
              <div className="mb-3">
                <p className="text-lg font-bold text-indigo-700 mb-1">NeighborVille v0.9.1-beta</p>
                <p className="text-sm text-gray-600">Latest beta release</p>
              </div>
            </>
          )}
          
          <div className="border-t border-indigo-200 pt-3 mt-3">
            <p className="text-sm text-gray-700 font-medium mb-2">Built with modern technologies:</p>
            <div className="flex flex-wrap gap-2">
              {[
                { name: 'React 18', color: 'bg-blue-100 text-blue-800' },
                { name: 'TypeScript', color: 'bg-blue-100 text-blue-800' },
                { name: 'Framer Motion', color: 'bg-purple-100 text-purple-800' },
                { name: 'Tailwind CSS', color: 'bg-cyan-100 text-cyan-800' },
                { name: 'Node.js', color: 'bg-green-100 text-green-800' },
                { name: 'MongoDB', color: 'bg-green-100 text-green-800' }
              ].map((tech) => (
                <span key={tech.name} className={`px-2 py-1 rounded-md text-xs font-medium ${tech.color}`}>
                  {tech.name}
                </span>
              ))}
            </div>
            <div className="mt-3 text-center">
              <p className="text-sm text-gray-600">
                Made with <span className="text-red-500">❤️</span> by{' '}
                <span className="font-semibold text-indigo-600">d0mkaaa</span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTabContent = () => {
    switch (activeTab) {
      case 'profile': return renderProfileTab();
      case 'audio': return renderAudioTab();
      case 'account': return renderAccountTab();
      case 'security': return renderSecurityTab();
      case 'help': return renderHelpTab();
      default: return renderProfileTab();
    }
  };

  if (!isOpen) return null;

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <SettingsIcon className="text-blue-500" size={28} />
                  Settings
                </h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="flex">
                <div className="w-48 bg-gray-50 border-r border-gray-200">
                  <nav className="p-4 space-y-1">
                    {[
                      { id: 'profile', label: 'Profile', icon: User },
                      { id: 'audio', label: 'Audio', icon: Volume2 },
                      { id: 'account', label: 'Account', icon: User },
                      { id: 'security', label: 'Security', icon: Shield },
                      { id: 'help', label: 'Help', icon: HelpCircle }
                    ].map((tab) => (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as typeof activeTab)}
                        className={`
                          w-full flex items-center gap-3 px-3 py-2 rounded-lg text-left transition-colors
                          ${activeTab === tab.id 
                            ? 'bg-blue-100 text-blue-700 font-medium' 
                            : 'text-gray-700 hover:bg-gray-100'
                          }
                        `}
                      >
                        <tab.icon size={16} />
                        {tab.label}
                      </button>
                    ))}
                  </nav>
                  
                  <div className="p-4 border-t border-gray-200">
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <LogOut size={16} />
                      Logout
                    </button>
                  </div>
                </div>

                <div className="flex-1 p-6 overflow-y-auto max-h-[calc(90vh-80px)]">
                  {renderTabContent()}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {showPublicProfile && profileData && (
        <PublicProfileModal
          onClose={() => setShowPublicProfile(false)}
          profile={{
            id: user?.id || 'guest',
            username: user?.username || 'Guest User',
            neighborhood: {
              name: profileData.cityName,
              buildings: [],
              neighbors: [],
              stats: {
                totalIncome: profileData.incomePerDay,
                totalResidents: profileData.population,
                totalBuildings: profileData.totalBuildings
              }
            }
          }}
        />
      )}

      {showProfileSettings && (
        <ProfileSettings 
          onClose={() => setShowProfileSettings(false)}
          onUpdate={() => {}}
        />
      )}

      {showUpdateLog && (
        <UpdateLogModal 
          isOpen={showUpdateLog}
          onClose={() => setShowUpdateLog(false)}
        />
      )}
    </>
  );
}