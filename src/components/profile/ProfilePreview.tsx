import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  User, Mail, Calendar, MapPin, Globe, Trophy, 
  Building2, Users, Heart, DollarSign, Star, Clock,
  Home, Zap, TreePine, Award, Target, TrendingUp,
  Loader2, AlertTriangle
} from 'lucide-react';
import ModalWrapper from '../ui/ModalWrapper';
import { loadNeighborhoodFromServer } from '../../services/neighborhoodService';
import { getCurrentUser } from '../../services/userService';
import type { GameProgress } from '../../types/game';

interface ProfilePreviewProps {
  onClose: () => void;
}

interface UserProfile {
  id: string;
  username: string;
  email: string;
  createdAt: string;
  lastLogin?: string;
  profileSettings?: {
    visibility: 'public' | 'private';
    showBio: boolean;
    showStats: boolean;
    showActivity: boolean;
    showSocialLinks: boolean;
    showAchievements: boolean;
  };
  extendedProfile?: {
    bio?: string;
    location?: string;
    website?: string;
    interests?: string[];
  };
}

interface ProfileData {
  profile: UserProfile;
  gameData: GameProgress | null;
}

export default function ProfilePreview({ onClose }: ProfilePreviewProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [userResult, gameResult] = await Promise.all([
        getCurrentUser(),
        loadNeighborhoodFromServer()
      ]);

      if (!userResult) {
        throw new Error('Unable to load user profile');
      }

      const profileResponse = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001'}/api/user/profile`, {
        credentials: 'include'
      });

      let extendedProfile = null;
      if (profileResponse.ok) {
        const profileResult = await profileResponse.json();
        extendedProfile = profileResult;
      }

      setProfileData({
        profile: {
          id: userResult.id,
          username: userResult.username,
          email: userResult.email,
          createdAt: typeof userResult.createdAt === 'string' ? userResult.createdAt : new Date().toISOString(),
          lastLogin: typeof userResult.lastLogin === 'string' ? userResult.lastLogin : undefined,
          profileSettings: extendedProfile?.profileSettings,
          extendedProfile: extendedProfile?.extendedProfile
        },
        gameData: gameResult.success ? gameResult.gameData : null
      });
    } catch (err) {
      console.error('Error loading profile data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return 'Just now';
    if (diffInHours < 24) return `${diffInHours}h ago`;
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays}d ago`;
    const diffInMonths = Math.floor(diffInDays / 30);
    return `${diffInMonths}mo ago`;
  };

  const calculateTotalBuildings = () => {
    if (!profileData?.gameData?.grid) return 0;
    return profileData.gameData.grid.filter(building => building !== null).length;
  };

  const calculateTotalResidents = () => {
    if (!profileData?.gameData?.neighbors) return 0;
    return profileData.gameData.neighbors.filter(neighbor => 
      neighbor.houseIndex !== undefined && neighbor.houseIndex !== -1
    ).length;
  };

  const getNeighborhoodAge = () => {
    if (!profileData?.gameData?.neighborhoodFoundedDate) return 'Recently founded';
    const founded = new Date(profileData.gameData.neighborhoodFoundedDate);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - founded.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffInDays < 1) return 'Founded today';
    if (diffInDays === 1) return 'Founded yesterday';
    if (diffInDays < 30) return `Founded ${diffInDays} days ago`;
    const months = Math.floor(diffInDays / 30);
    return `Founded ${months} month${months > 1 ? 's' : ''} ago`;
  };

  const getMayorRating = () => {
    if (!profileData?.gameData) return 'New Mayor';
    const { level, day, coins, completedAchievements } = profileData.gameData;
    
    const score = (level * 10) + (day * 2) + (coins / 1000) + (completedAchievements?.length * 5 || 0);
    
    if (score >= 500) return 'Legendary Mayor';
    if (score >= 300) return 'Master Mayor';
    if (score >= 200) return 'Expert Mayor';
    if (score >= 100) return 'Skilled Mayor';
    if (score >= 50) return 'Experienced Mayor';
    return 'Aspiring Mayor';
  };

  const getSpecialtyBuildings = () => {
    if (!profileData?.gameData?.grid) return [];
    
    const buildingCounts: { [key: string]: number } = {};
    profileData.gameData.grid.forEach(building => {
      if (building && building.type) {
        buildingCounts[building.type] = (buildingCounts[building.type] || 0) + 1;
      }
    });

    const sortedBuildings = Object.entries(buildingCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3);

    return sortedBuildings.map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count
    }));
  };

  if (loading) {
    return (
      <ModalWrapper isOpen={true} onClose={onClose} title="Profile Preview">
        <div className="p-8 text-center">
          <Loader2 className="animate-spin w-8 h-8 text-blue-500 mx-auto mb-4" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </ModalWrapper>
    );
  }

  if (error || !profileData) {
    return (
      <ModalWrapper isOpen={true} onClose={onClose} title="Profile Preview">
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertTriangle size={24} className="text-red-600" />
          </div>
          <p className="text-gray-600">{error || 'Profile not found'}</p>
          <button
            onClick={loadProfileData}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        </div>
      </ModalWrapper>
    );
  }

  const { profile, gameData } = profileData;
  const totalBuildings = calculateTotalBuildings();
  const totalResidents = calculateTotalResidents();
  const mayorRating = getMayorRating();
  const specialtyBuildings = getSpecialtyBuildings();

  return (
    <ModalWrapper isOpen={true} onClose={onClose} title="Your Profile" maxWidth="2xl">
      <div className="p-6 max-h-[600px] overflow-y-auto">
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center">
                <User size={32} className="text-white" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{profile.username}</h2>
                <p className="text-blue-100">{mayorRating}</p>
                <div className="flex items-center gap-4 mt-2 text-sm">
                  <div className="flex items-center gap-1">
                    <Star size={14} />
                    <span>Level {gameData?.level || 1}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Calendar size={14} />
                    <span>Member since {formatDate(profile.createdAt)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            {gameData && (
              <div className="text-right">
                <div className="text-2xl font-bold">{gameData.neighborhoodName}</div>
                <div className="text-blue-100 text-sm">{getNeighborhoodAge()}</div>
              </div>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {gameData && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Building2 size={20} className="text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-800">City Overview</h3>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{totalBuildings}</div>
                  <div className="text-sm text-gray-600">Buildings</div>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{totalResidents}</div>
                  <div className="text-sm text-gray-600">Residents</div>
                </div>
                <div className="text-center p-3 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{gameData.coins?.toLocaleString() || 0}</div>
                  <div className="text-sm text-gray-600">Coins</div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{gameData.day || 1}</div>
                  <div className="text-sm text-gray-600">Days Played</div>
                </div>
              </div>

              {specialtyBuildings.length > 0 && (
                <div className="mt-4">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Building Specialties</h4>
                  <div className="flex gap-2">
                    {specialtyBuildings.map((building, index) => (
                      <div key={index} className="px-2 py-1 bg-gray-100 rounded-full text-xs text-gray-600">
                        {building.count}x {building.type}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <Trophy size={20} className="text-yellow-600" />
              <h3 className="text-lg font-semibold text-gray-800">Achievements</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-600">Unlocked</span>
                <span className="font-semibold text-yellow-600">
                  {gameData?.completedAchievements?.length || 0}
                </span>
              </div>
              
              {gameData?.completedAchievements && gameData.completedAchievements.length > 0 ? (
                <div className="space-y-2">
                  {gameData.completedAchievements.slice(0, 3).map((achievement, index) => (
                    <div key={index} className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                      <Award size={16} className="text-yellow-600" />
                      <span className="text-sm text-gray-700 capitalize">
                        {achievement.replace(/-/g, ' ')}
                      </span>
                    </div>
                  ))}
                  {gameData.completedAchievements.length > 3 && (
                    <div className="text-center text-sm text-gray-500">
                      +{gameData.completedAchievements.length - 3} more achievements
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-4 text-gray-500">
                  <Trophy size={32} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">No achievements yet</p>
                  <p className="text-xs">Start building to unlock achievements!</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-xl p-6">
            <div className="flex items-center gap-2 mb-4">
              <User size={20} className="text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-800">Profile Information</h3>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Mail size={16} className="text-gray-400" />
                <span className="text-gray-600">{profile.email}</span>
              </div>
              
              {profile.extendedProfile?.location && (
                <div className="flex items-center gap-2">
                  <MapPin size={16} className="text-gray-400" />
                  <span className="text-gray-600">{profile.extendedProfile.location}</span>
                </div>
              )}
              
              {profile.extendedProfile?.website && (
                <div className="flex items-center gap-2">
                  <Globe size={16} className="text-gray-400" />
                  <a 
                    href={profile.extendedProfile.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline"
                  >
                    {profile.extendedProfile.website}
                  </a>
                </div>
              )}
              
              {profile.lastLogin && (
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-gray-400" />
                  <span className="text-gray-600">Last active {getTimeAgo(profile.lastLogin)}</span>
                </div>
              )}
            </div>

            {profile.extendedProfile?.bio && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Bio</h4>
                <p className="text-gray-600 text-sm">{profile.extendedProfile.bio}</p>
              </div>
            )}
          </div>

          {profile.extendedProfile?.interests && profile.extendedProfile.interests.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-xl p-6">
              <div className="flex items-center gap-2 mb-4">
                <Target size={20} className="text-green-600" />
                <h3 className="text-lg font-semibold text-gray-800">Interests</h3>
              </div>
              
              <div className="flex flex-wrap gap-2">
                {profile.extendedProfile.interests.map((interest, index) => (
                  <span 
                    key={index}
                    className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </ModalWrapper>
  );
} 