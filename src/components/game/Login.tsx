import { useState, useEffect } from 'react';
import { 
  Play, Plus, BookOpen, Trophy, Search, Settings, Crown, Calendar, Clock, 
  Trash2, User, Shield, Star, Home, Globe, Users, ChevronRight, Gamepad2,
  Building, Map, Coffee, Sparkles, Heart, Target, Award, Activity, MapPin,
  ArrowRight, CheckCircle, Zap, LogOut
} from 'lucide-react';
import AuthModal from '../auth/AuthModal';
import AdminPanel from '../admin/AdminPanel';
import ProfileSettings from '../profile/ProfileSettings';
import SecuritySettings from '../profile/SecuritySettings';
import Leaderboard from '../profile/Leaderboard';
import UserSearch from '../profile/UserSearch';
import PublicProfileModal from '../profile/PublicProfileModal';
import ProfilePreview from '../profile/ProfilePreview';
import BackgroundBubbles from './BackgroundBubbles';
import SettingsModal from './SettingsModal';
import { useAuth } from '../../context/AuthContext';
import { loadNeighborhoodFromServer } from '../../services/neighborhoodService';
import { getAllSavesFromServer, deleteSaveFromServer } from '../../services/gameService';
import { getUserProfile } from '../../services/userService';
import type { GameProgress } from '../../types/game';
import { motion, AnimatePresence } from 'framer-motion';
import ModalWrapper from '../ui/ModalWrapper';
import Button from '../ui/Button';
import AppLayout from '../ui/AppLayout';

interface SaveInfo {
  id: string;
  name: string;
  date: string;
  data: GameProgress;
  type: 'cloud';
  timestamp: number;
}

interface ProfileStats {
  username: string;
  email: string;
  role: 'user' | 'moderator' | 'admin';
  verified: boolean;
  memberSince: string;
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

type LoginProps = {
  onStartGame: (playerName: string, neighborhoodName?: string) => void;
  onLoadGame: (gameData: GameProgress) => void;
  onShowTutorial: () => void;
  onShowWiki: () => void;
};

function NeighborhoodCreationModal({ 
  isOpen, 
  onClose, 
  onCreateNeighborhood, 
  playerName 
}: {
  isOpen: boolean;
  onClose: () => void;
  onCreateNeighborhood: (neighborhoodName: string) => void;
  playerName: string;
}) {
  const [step, setStep] = useState<'naming' | 'creating' | 'complete'>('naming');
  const [neighborhoodName, setNeighborhoodName] = useState('');
  const [stamps, setStamps] = useState<string[]>([]);

  const suggestions = [
    'Sunset Valley', 'Maple Heights', 'Cedar Grove', 'Riverside', 'Oakwood',
    'Pine Hills', 'Golden Gate', 'Crystal Lake', 'Emerald Bay', 'Silver Springs'
  ];

  const handleCreate = async () => {
    if (!neighborhoodName.trim()) return;
    
    setStep('creating');
    
    const creationStamps = ['🏡 Cozy Homes', '🌳 Green Spaces', '🏪 Local Shops', '👥 Happy Neighbors', '🎯 Bright Future'];
    
    for (let i = 0; i < creationStamps.length; i++) {
      await new Promise(resolve => setTimeout(resolve, 800));
      setStamps(prev => [...prev, creationStamps[i]]);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    setStep('complete');
    
    setTimeout(() => {
      onCreateNeighborhood(neighborhoodName.trim());
      onClose();
    }, 2000);
  };

  const selectSuggestion = (suggestion: string) => {
    setNeighborhoodName(suggestion);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-3xl p-8 max-w-2xl w-full shadow-2xl">
          {step === 'naming' && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="w-24 h-24 bg-gradient-to-br from-emerald-400 via-blue-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xl">
                  <MapPin className="text-white" size={36} />
                </div>
                
                <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
                  Create Your Neighborhood
                </h2>
                
                <p className="text-gray-600 text-lg">
                  Welcome, {playerName}! Let's give your new neighborhood a special name.
                </p>
              </div>

              <div className="space-y-4">
                <div className="relative">
                  <input
                    type="text"
                    value={neighborhoodName}
                    onChange={(e) => setNeighborhoodName(e.target.value)}
                    placeholder="Enter neighborhood name..."
                    className="w-full p-4 text-xl border-2 border-gray-200 rounded-2xl focus:border-emerald-500 focus:outline-none transition-colors bg-gray-50 focus:bg-white"
                    maxLength={30}
                  />
                  <div className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    {neighborhoodName.length}/30
                  </div>
                </div>
              </div>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={onClose}
                  className="px-6 py-3 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={!neighborhoodName.trim()}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-blue-600 text-white rounded-2xl font-semibold shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  Create Neighborhood
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          )}

          {step === 'creating' && (
            <div className="text-center space-y-8">
              <div className="w-32 h-32 bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                <div className="animate-spin">
                  <Zap className="text-white" size={48} />
                </div>
              </div>
              
              <div>
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                  Creating "{neighborhoodName}"
                </h2>
                <p className="text-gray-600 text-lg">
                  Preparing your perfect neighborhood...
                </p>
              </div>

              <div className="grid grid-cols-5 gap-4 max-w-md mx-auto">
                {stamps.map((stamp, index) => (
                  <div
                    key={stamp}
                    className="bg-white rounded-2xl p-4 shadow-lg border-2 border-emerald-200 text-center"
                  >
                    <div className="text-3xl mb-2">{stamp.split(' ')[0]}</div>
                    <div className="text-xs font-medium text-gray-600">{stamp.split(' ')[1]}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === 'complete' && (
            <div className="text-center space-y-6">
              <div className="w-32 h-32 bg-gradient-to-br from-green-400 via-emerald-500 to-teal-600 rounded-full flex items-center justify-center mx-auto shadow-2xl">
                <CheckCircle className="text-white" size={48} />
              </div>
              
              <div>
                <h2 className="text-3xl font-bold mb-3 bg-gradient-to-r from-green-600 to-teal-600 bg-clip-text text-transparent">
                  Welcome to {neighborhoodName}!
                </h2>
                <p className="text-gray-600 text-lg">
                  Your neighborhood has been created successfully. Let's start building!
                </p>
              </div>

              <div className="bg-gradient-to-r from-green-50 to-teal-50 p-6 rounded-2xl border-2 border-green-200">
                <div className="grid grid-cols-2 gap-4 text-center">
                  <div>
                    <div className="text-2xl mb-2">🏗️</div>
                    <div className="text-sm font-medium text-gray-700">Ready to Build</div>
                  </div>
                  <div>
                    <div className="text-2xl mb-2">💰</div>
                    <div className="text-sm font-medium text-gray-700">2,000 Starting Coins</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </AnimatePresence>
  );
}

function FreshCityWarningModal({
  isOpen,
  onClose,
  onConfirm,
  currentNeighborhoodName
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  currentNeighborhoodName: string;
}) {
  return (
    <ModalWrapper isOpen={isOpen} onClose={onClose} title="⚠️ Start Fresh City" headerColor="glass">
      <div className="p-6 text-center">
        <div className="mb-6">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 rounded-full flex items-center justify-center">
            <span className="text-2xl">⚠️</span>
          </div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            This will delete your current city!
          </h3>
          <p className="text-gray-600 mb-4">
            You currently have a city called <span className="font-semibold text-purple-600">"{currentNeighborhoodName}"</span>
          </p>
          <p className="text-red-600 font-medium">
            Starting fresh will permanently delete all your progress, buildings, and achievements.
          </p>
        </div>

        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <span className="text-yellow-600 mr-2">💡</span>
            <div className="text-left">
              <p className="text-sm text-yellow-800 font-medium mb-1">Tip:</p>
              <p className="text-sm text-yellow-700">
                Consider saving your current progress first, or rename your existing city instead of starting over.
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3 justify-center">
          <Button 
            variant="outline" 
            onClick={onClose}
            className="px-6"
          >
            Cancel
          </Button>
          <Button 
            variant="danger" 
            onClick={onConfirm}
            className="px-6"
          >
            Delete & Start Fresh
          </Button>
        </div>
      </div>
    </ModalWrapper>
  );
}

export default function Login({ onStartGame, onLoadGame, onShowTutorial, onShowWiki }: LoginProps) {
  const { user, isAuthenticated, logout } = useAuth();
  const [cloudSaves, setCloudSaves] = useState<SaveInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [profileStats, setProfileStats] = useState<ProfileStats | null>(null);
  const [showAdminPanel, setShowAdminPanel] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [showSecuritySettings, setShowSecuritySettings] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [showPublicProfile, setShowPublicProfile] = useState(false);
  const [showProfilePreview, setShowProfilePreview] = useState(false);
  const [selectedProfileUser, setSelectedProfileUser] = useState<string>('');
  const [selectedSaves, setSelectedSaves] = useState<string[]>([]);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showNeighborhoodCreation, setShowNeighborhoodCreation] = useState(false);
  const [showFreshWarning, setShowFreshWarning] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedSaveIds, setSelectedSaveIds] = useState<Set<string>>(new Set());
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [profileUsername, setProfileUsername] = useState('');
  const [showingProfileMenu, setShowingProfileMenu] = useState(false);
  
  useEffect(() => {
    if (isAuthenticated) {
      loadCloudSaves();
      loadProfileStats();
      }
  }, [isAuthenticated]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showingProfileMenu) {
        const target = event.target as HTMLElement;
        if (!target.closest('[data-profile-menu]')) {
          setShowingProfileMenu(false);
        }
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && showingProfileMenu) {
        setShowingProfileMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [showingProfileMenu]);
    
    const handleUnauthorized = () => {
    logout();
    setIsAuthModalOpen(true);
  };

  const loadProfileStats = async () => {
    try {
      const profile = await getUserProfile();
      if (profile) {
          setProfileStats({
          username: profile.username,
          email: profile.email,
          role: profile.role || 'user',
          verified: profile.verified,
          memberSince: profile.createdAt?.toString() || ''
          });
      }
    } catch (error) {
      console.error('Error loading profile stats:', error);
    }
  };
  
  const loadCloudSaves = async () => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      
      const gameSaves = await getAllSavesFromServer();
      let allSaves: SaveInfo[] = [];
      
      const saveInfos: SaveInfo[] = gameSaves
        .filter(save => {
          const data = save.data;
          if (!data) return false;
          
          const isValidSave = 
            data.neighborhoodName ||
            data.playerName ||
            (data.day !== undefined && data.day >= 1) ||
            (data.coins !== undefined) ||
            (data.level !== undefined);
            
          return isValidSave;
        })
        .map((save, index) => {
          const baseName = save.data?.neighborhoodName || 'Unnamed City';
          
          return {
            id: save.id,
            name: baseName,
            date: formatTimeAgo(save.timestamp),
            data: save.data,
            type: 'cloud' as const,
            timestamp: save.timestamp
          };
        });

      allSaves = saveInfos;
      
      allSaves.sort((a, b) => b.timestamp - a.timestamp);
      
      const uniqueSaves = allSaves.filter((save, index, arr) => 
        index === arr.findIndex(s => s.name === save.name && Math.abs(s.timestamp - save.timestamp) < 1000)
      ).slice(0, 10);
      
      setCloudSaves(uniqueSaves);
    } catch (error) {
      console.error('Error loading cloud saves:', error);
      handleUnauthorized();
    } finally {
      setLoading(false);
    }
  };
  
  const handleStartGame = () => {
    if (isAuthenticated && profileStats) {
      if (cloudSaves.length > 0) {
        setShowFreshWarning(true);
      } else {
        setShowNeighborhoodCreation(true);
      }
    } else {
      setShowNeighborhoodCreation(true);
    }
  };

  const handleCreateNeighborhood = (neighborhoodName: string) => {
    setShowNeighborhoodCreation(false);
    onStartGame(user?.username || 'Player', neighborhoodName);
  };

  const handleConfirmFresh = () => {
    setShowFreshWarning(false);
    setShowNeighborhoodCreation(true);
  };

  const handleDeleteCloudSave = async (id: string) => {
    try {
      const success = await deleteSaveFromServer(id);
      if (success) {
        setCloudSaves(prev => prev.filter(save => save.id !== id));
      }
    } catch (error) {
      console.error('Error deleting save:', error);
    }
  };

  const handleLoadLatestServerSave = async () => {
    if (cloudSaves.length > 0) {
      onLoadGame(cloudSaves[0].data);
    }
  };
  
  const formatTimeAgo = (timestamp: number) => {
    const now = Date.now();
    const diffInHours = Math.floor((now - timestamp) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}d ago`;
    return `${Math.floor(diffInDays / 7)}w ago`;
  };

  const handleViewProfile = (username: string) => {
    setSelectedProfileUser(username);
    setShowPublicProfile(true);
    setShowLeaderboard(false);
    setShowUserSearch(false);
  };

  if (!isAuthenticated) {
    return (
      <AppLayout showNavbar={false} showFooter={false}>
        <div className="fixed inset-0 w-full h-full overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-800 to-blue-900">
          <BackgroundBubbles />
          
          <div className="absolute inset-0 bg-gradient-to-br from-black/20 via-transparent to-black/30 pointer-events-none" />
          
          <div className="absolute top-20 left-20 w-32 h-32 bg-purple-500/20 rounded-full blur-xl animate-pulse" />
          <div className="absolute bottom-32 right-32 w-48 h-48 bg-blue-500/20 rounded-full blur-2xl animate-pulse delay-1000" />
          <div className="absolute top-1/2 left-1/4 w-24 h-24 bg-indigo-400/20 rounded-full blur-lg animate-pulse delay-500" />
          
          <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
            <div className="max-w-lg w-full animate-fade-in">
              <div className="text-center mb-12">
                <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-2xl flex items-center justify-center shadow-2xl hover:scale-110 hover:rotate-6 transition-all duration-300">
                  <Building className="w-10 h-10 text-white" />
                </div>
                
                <h1 className="text-5xl font-bold text-white mb-4 animate-slide-down">
                  NeighborVille
                </h1>
                
                <p className="text-xl text-purple-100 mb-2 animate-slide-down delay-200">
                  Build Your Dream City
                </p>
                
                <p className="text-purple-200/80 animate-slide-down delay-300">
                  Create, manage, and grow your virtual neighborhood
                </p>
              </div>
              
              <div className="backdrop-blur-xl bg-white/10 rounded-3xl shadow-2xl p-8 border border-white/20 animate-scale-in delay-500">
                <button
                  onClick={() => setIsAuthModalOpen(true)}
                  className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white py-4 px-6 rounded-2xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-300 transform hover:scale-[1.02] shadow-xl mb-6 flex items-center justify-center space-x-3"
                >
                  <User className="w-5 h-5" />
                  <span>Enter Your City</span>
                  <ChevronRight className="w-5 h-5" />
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/20"></div>
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-transparent text-purple-200">or explore first</span>
                  </div>
                </div>
                
                <button
                  onClick={onShowTutorial}
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-6 rounded-xl font-medium transition-all duration-300 border border-white/20 hover:border-white/40 flex items-center justify-center space-x-2 hover:scale-[1.02]"
                >
                  <BookOpen className="w-4 h-4" />
                  <span>Take the City Tour</span>
                </button>

                <div className="mt-8 grid grid-cols-3 gap-4">
                  <div className="text-center animate-fade-in delay-700">
                    <div className="w-10 h-10 mx-auto mb-2 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <Home className="w-5 h-5 text-green-400" />
                    </div>
                    <p className="text-xs text-purple-200">Build Homes</p>
                  </div>

                  <div className="text-center animate-fade-in delay-800">
                    <div className="w-10 h-10 mx-auto mb-2 bg-blue-500/20 rounded-lg flex items-center justify-center">
                      <Users className="w-5 h-5 text-blue-400" />
                    </div>
                    <p className="text-xs text-purple-200">Meet Neighbors</p>
                  </div>
                
                  <div className="text-center animate-fade-in delay-900">
                    <div className="w-10 h-10 mx-auto mb-2 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                      <Trophy className="w-5 h-5 text-yellow-400" />
                    </div>
                    <p className="text-xs text-purple-200">Earn Rewards</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {isAuthModalOpen && (
            <AuthModal
              onClose={() => setIsAuthModalOpen(false)}
              onLogin={(userData) => {
                setIsAuthModalOpen(false);
              }}
            />
          )}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout showNavbar={false} showFooter={false}>
      <div className="min-h-screen relative overflow-hidden bg-gradient-to-br from-indigo-900 via-purple-800 to-blue-900">
        <BackgroundBubbles />
        
        <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/20 pointer-events-none" />
        
        <div className="absolute top-32 left-32 w-32 h-32 bg-purple-400/40 rounded-full blur-xl animate-pulse" />
        <div className="absolute bottom-40 right-40 w-48 h-48 bg-blue-400/40 rounded-full blur-2xl animate-pulse delay-1000" />
        <div className="absolute top-1/3 left-1/5 w-24 h-24 bg-indigo-400/40 rounded-full blur-lg animate-pulse delay-500" />
        
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/20 via-transparent to-transparent" />
          <div className="absolute bottom-0 right-0 w-96 h-96 bg-gradient-to-tl from-blue-500/20 to-transparent rounded-full blur-3xl" />
          <div className="absolute top-20 left-20 w-64 h-64 bg-gradient-to-br from-indigo-500/20 to-transparent rounded-full blur-2xl" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto p-6 pb-24">
          <div className="bg-white/20 backdrop-blur-xl rounded-3xl shadow-lg p-6 mb-8 border border-white/30 animate-slide-down delay-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg hover:scale-110 hover:rotate-6 transition-all duration-300">
                  <Crown className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white drop-shadow-lg">
                    Welcome back, {user?.username}!
                  </h1>
                  <p className="text-purple-100 flex items-center space-x-2">
                    <Sparkles className="w-4 h-4 text-purple-300" />
                    <span>Ready to continue building your city?</span>
                  </p>
                </div>
              </div>

              <div className="relative" data-profile-menu>
                <button
                  onClick={() => setShowingProfileMenu(!showingProfileMenu)}
                  className="group relative p-3 bg-white/10 backdrop-blur-sm rounded-2xl hover:bg-white/20 transition-all duration-300 border border-white/20 text-white hover:scale-105 hover:shadow-xl"
                >
                  <div className="relative">
                    <User size={22} />
                    {profileStats?.verified && (
                      <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
                    )}
                  </div>
                </button>

                {showingProfileMenu && (
                  <div 
                    className="absolute top-0 left-full ml-2 w-80 bg-white rounded-2xl shadow-xl border border-gray-200 z-50 animate-fade-in"
                  >
                      <div className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10"></div>
                        <div className="relative px-6 py-5 border-b border-gray-200">
                          <div className="flex items-center space-x-4">
                            <div className="relative">
                              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg">
                                <User size={24} className="text-white" />
                              </div>
                              {profileStats?.verified && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white flex items-center justify-center">
                                  <svg className="w-2 h-2 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-gray-800 text-lg truncate">{user?.username}</h3>
                              <div className="flex items-center space-x-2 mt-1">
                                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                  profileStats?.role === 'admin' ? 'bg-red-100 text-red-700' :
                                  profileStats?.role === 'moderator' ? 'bg-blue-100 text-blue-700' :
                                  'bg-gray-100 text-gray-700'
                                }`}>
                                  {profileStats?.role?.charAt(0).toUpperCase() + profileStats?.role?.slice(1) || 'User'}
                                </span>
                                {profileStats?.verified && (
                                  <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs font-semibold">
                                    Verified
                                  </span>
                                )}
                              </div>
                              {profileStats?.memberSince && (
                                <p className="text-xs text-gray-500 mt-1">
                                  Member since {new Date(profileStats.memberSince).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="px-2 py-3 space-y-1">
                        <div className="px-3 py-1">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Profile</p>
                        </div>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowingProfileMenu(false);
                          }}
                          className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-purple-50 hover:to-indigo-50 rounded-xl transition-all duration-200 flex items-center space-x-3 group opacity-50 cursor-not-allowed"
                        >
                          <div className="w-8 h-8 bg-purple-100 group-hover:bg-purple-200 rounded-lg flex items-center justify-center transition-colors">
                            <Settings size={16} className="text-purple-600" />
                          </div>
                          <div>
                            <span className="font-medium">Settings</span>
                            <p className="text-xs text-gray-500">Available in-game</p>
                          </div>
                        </button>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowProfilePreview(true);
                            setShowingProfileMenu(false);
                          }}
                          className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-blue-50 hover:to-cyan-50 rounded-xl transition-all duration-200 flex items-center space-x-3 group"
                        >
                          <div className="w-8 h-8 bg-blue-100 group-hover:bg-blue-200 rounded-lg flex items-center justify-center transition-colors">
                            <User size={16} className="text-blue-600" />
                          </div>
                          <div>
                            <span className="font-medium">My Profile</span>
                            <p className="text-xs text-gray-500">View profile details</p>
                          </div>
                        </button>

                        <div className="px-3 py-1 mt-4">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Community</p>
                        </div>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowLeaderboard(true);
                            setShowingProfileMenu(false);
                          }}
                          className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-yellow-50 hover:to-orange-50 rounded-xl transition-all duration-200 flex items-center space-x-3 group"
                        >
                          <div className="w-8 h-8 bg-yellow-100 group-hover:bg-yellow-200 rounded-lg flex items-center justify-center transition-colors">
                            <Trophy size={16} className="text-yellow-600" />
                          </div>
                          <div>
                            <span className="font-medium">Leaderboard</span>
                            <p className="text-xs text-gray-500">See top mayors</p>
                          </div>
                        </button>

                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowUserSearch(true);
                            setShowingProfileMenu(false);
                          }}
                          className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-green-50 hover:to-emerald-50 rounded-xl transition-all duration-200 flex items-center space-x-3 group"
                        >
                          <div className="w-8 h-8 bg-green-100 group-hover:bg-green-200 rounded-lg flex items-center justify-center transition-colors">
                            <Search size={16} className="text-green-600" />
                          </div>
                          <div>
                            <span className="font-medium">Find Players</span>
                            <p className="text-xs text-gray-500">Search community</p>
                          </div>
                        </button>

                        {(profileStats?.role === 'admin' || profileStats?.role === 'moderator') && (
                          <>
                            <div className="px-3 py-1 mt-4">
                              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Administration</p>
                            </div>
                            
                            <button 
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowAdminPanel(true);
                                setShowingProfileMenu(false);
                              }}
                              className="w-full text-left px-4 py-3 text-gray-700 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 rounded-xl transition-all duration-200 flex items-center space-x-3 group"
                            >
                              <div className="w-8 h-8 bg-red-100 group-hover:bg-red-200 rounded-lg flex items-center justify-center transition-colors">
                                <Shield size={16} className="text-red-600" />
                              </div>
                              <div>
                                <span className="font-medium">Admin Panel</span>
                                <p className="text-xs text-gray-500">Manage platform</p>
                              </div>
                            </button>
                          </>
                        )}
                        
                        <div className="mx-4 my-3 border-t border-gray-200"></div>
                        
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            logout();
                            setShowingProfileMenu(false);
                          }}
                          className="w-full text-left px-4 py-3 text-red-600 hover:bg-gradient-to-r hover:from-red-50 hover:to-pink-50 rounded-xl transition-all duration-200 flex items-center space-x-3 group"
                        >
                          <div className="w-8 h-8 bg-red-100 group-hover:bg-red-200 rounded-lg flex items-center justify-center transition-colors">
                            <LogOut size={16} className="text-red-600" />
                          </div>
                          <div>
                            <span className="font-medium">Sign Out</span>
                            <p className="text-xs text-gray-500">End your session</p>
                          </div>
                        </button>
                      </div>
                  </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex justify-center animate-fade-in">
          <div className="w-full max-w-4xl space-y-8">
            <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 animate-slide-down delay-200">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center">
                  <Play className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                  Continue Your Journey
                </h2>
              </div>
            
              {loading ? (
                <div className="text-center py-12">
                  <div className="w-12 h-12 mx-auto mb-4 border-4 border-white/30 border-t-white rounded-full animate-spin"></div>
                  <p className="text-white/80 text-lg">Loading your cities...</p>
                </div>
              ) : cloudSaves.length > 0 ? (
                <div className="space-y-6">
                  <div className="relative overflow-hidden bg-white/15 backdrop-blur-xl rounded-2xl p-6 border border-white/30 hover:border-white/50 transition-all duration-300 hover:scale-[1.02] hover:bg-white/20 animate-scale-in delay-300">
                    <div className="absolute top-4 right-4">
                      <span className="px-3 py-1 bg-emerald-500 text-white text-xs font-bold rounded-full animate-pulse">
                        LATEST
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-white mb-1 drop-shadow-lg">{cloudSaves[0].name}</h3>
                        <div className="flex items-center space-x-4 text-sm text-white/80">
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1 text-emerald-500" />
                            {cloudSaves[0].date}
                          </span>
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1 text-emerald-500" />
                            {formatTimeAgo(cloudSaves[0].timestamp)}
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={handleLoadLatestServerSave}
                        className="bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-emerald-600 hover:to-green-700 transition-all duration-200 shadow-lg flex items-center space-x-2 hover:scale-105"
                      >
                        <Play className="w-4 h-4" />
                        <span>Continue</span>
                      </button>
                    </div>
                    
                    {cloudSaves[0].data && (
                      <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="text-center">
                          <div className="text-lg font-bold text-emerald-300">Day {cloudSaves[0].data.day || 1}</div>
                          <div className="text-xs text-white/60">Progress</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-emerald-300">Lv.{cloudSaves[0].data.level || 1}</div>
                          <div className="text-xs text-white/60">Mayor Level</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold text-emerald-300">{cloudSaves[0].data.coins?.toLocaleString() || '0'}</div>
                          <div className="text-xs text-white/60">Coins</div>
                        </div>
                      </div>
                    )}
                  </div>
                
                  <div className="mt-6 animate-fade-in delay-500">
                    <div className="text-center">
                      <button
                        onClick={handleStartGame}
                        className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white px-8 py-3 rounded-xl font-semibold hover:from-purple-600 hover:to-indigo-700 transition-all duration-200 shadow-lg flex items-center space-x-2 mx-auto hover:scale-105"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Start Fresh City</span>
                      </button>
                      <p className="text-sm text-white/70 mt-2">Begin a new mayor journey</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12 animate-fade-in delay-300">
                  <div className="w-20 h-20 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mx-auto mb-6 hover:scale-110 hover:rotate-6 transition-all duration-300 border border-white/30">
                    <Plus className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-lg">Start Your First City</h3>
                  <p className="text-white/80 mb-6 text-lg">Begin your mayor journey and build the city of your dreams!</p>
                  <button
                    onClick={handleStartGame}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-purple-700 hover:to-indigo-700 transition-all duration-200 shadow-lg flex items-center space-x-3 mx-auto hover:scale-105"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>Create New City</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
            
            <div className="bg-white/10 backdrop-blur-2xl rounded-3xl shadow-2xl p-8 border border-white/20 hover:bg-white/15 transition-all duration-300 animate-slide-up delay-500">
              <div className="flex items-center space-x-3 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-500 rounded-xl flex items-center justify-center">
                  <Target className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-3xl font-bold text-white drop-shadow-lg">
                  Quick Actions
                </h2>
              </div>
            
              <div className="grid grid-cols-2 gap-6">
                {[
                  { icon: Plus, label: 'New City', color: 'from-green-500 to-emerald-600', action: handleStartGame },
                  { icon: BookOpen, label: 'Wiki', color: 'from-blue-500 to-indigo-600', action: onShowWiki }
                ].map((item, index) => (
                <button
                    key={item.label}
                    onClick={item.action}
                    className={`flex flex-col items-center p-8 bg-white/10 backdrop-blur-xl hover:bg-white/20 transition-all duration-300 group border border-white/20 hover:border-white/40 rounded-2xl hover:scale-105 hover:-translate-y-1 shadow-xl animate-scale-in ${index === 0 ? 'delay-700' : 'delay-800'}`}
                  >
                    <div className={`w-12 h-12 bg-gradient-to-br ${item.color} rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-200 shadow-lg`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <span className="font-semibold text-white drop-shadow-lg group-hover:text-white/90 transition-colors text-lg">
                      {item.label}
                    </span>
                </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {showAdminPanel && (
          <AdminPanel onClose={() => setShowAdminPanel(false)} />
        )}

        {showSettingsModal && (
          <SettingsModal 
            isOpen={showSettingsModal}
            onClose={() => setShowSettingsModal(false)}
            musicEnabled={false}
            onToggleMusic={() => {}}
            audioRef={{ current: null }}
            onShowTutorial={onShowTutorial}
            onShowStats={() => {}}
            isAuthenticated={isAuthenticated}
            user={user}
            onLogout={logout}
          />
        )}

        {showLeaderboard && (
          <Leaderboard 
            onClose={() => setShowLeaderboard(false)}
            onViewProfile={handleViewProfile}
          />
        )}

        {showUserSearch && (
          <UserSearch
            onClose={() => setShowUserSearch(false)}
            onViewProfile={handleViewProfile}
          />
        )}

        {showPublicProfile && (
          <PublicProfileModal 
            onClose={() => setShowPublicProfile(false)}
            username={selectedProfileUser}
          />
        )}

        {showProfilePreview && (
          <ProfilePreview 
            onClose={() => setShowProfilePreview(false)}
          />
        )}

        {showNeighborhoodCreation && (
          <NeighborhoodCreationModal
            isOpen={showNeighborhoodCreation}
            onClose={() => setShowNeighborhoodCreation(false)}
            onCreateNeighborhood={handleCreateNeighborhood}
            playerName={profileStats?.username || 'Player'}
          />
        )}

        <FreshCityWarningModal
          isOpen={showFreshWarning}
          onClose={() => setShowFreshWarning(false)}
          onConfirm={handleConfirmFresh}
          currentNeighborhoodName={cloudSaves[0]?.data?.neighborhoodName || 'Your City'}
        />

      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-black/50 backdrop-blur-md border-t border-white/20 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="text-center">
            <div className="text-sm text-white font-medium mb-1">
              © 2025 NeighborVille • Made with <span className="text-red-400 animate-pulse">❤️</span> by{' '}
              <span className="font-bold text-blue-200">d0mkaaa</span>
            </div>
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-200">
              <span>Version 0.9.1-beta</span>
              <span>•</span>
              <span>Build 070e1aa</span>
              <span>•</span>
              <span>React + TypeScript + Node.js + MongoDB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </AppLayout>
);
}