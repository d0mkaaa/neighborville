import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Users, Building2, Star, Lock, AlertCircle, Loader2 } from 'lucide-react';
import { getPublicProfile } from "../../services/userService";
import type { PublicProfileData } from "../../services/userService";

type PublicProfileModalProps = {
  onClose: () => void;
  profile?: {
    id: string;
    username: string;
    neighborhood: {
      name: string;
      buildings: any[];
      neighbors: any[];
      stats: {
        totalHappiness: number;
        totalIncome: number;
        totalResidents: number;
        totalBuildings: number;
      };
    };
  };
  userId?: string;
  username?: string;
};

interface ProfileSettings {
  visibility: 'public' | 'private';
  showBio: boolean;
  showStats: boolean;
  showActivity: boolean;
}

export default function PublicProfileModal({ onClose, profile, userId, username }: PublicProfileModalProps) {
  const profileName = profile?.username || username || 'Unknown';
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [profileData, setProfileData] = useState<PublicProfileData | null>(null);

  useEffect(() => {
    const fetchProfileData = async () => {
      if (!username) return;
      
      setLoading(true);
      setError(null);
      
      try {
        const result = await getPublicProfile(username);
        
        if (result.success && result.profile) {
          setProfileData(result.profile);
        } else if (result.isPrivate) {
          setIsPrivate(true);
        } else {
          setError(result.message || 'Failed to load profile data');
        }
      } catch (err) {
        console.error('Error fetching profile data:', err);
        setError('Failed to load profile data');
      } finally {
        setLoading(false);
      }
    };
    
    if (username) {
      fetchProfileData();
    }
  }, [username]);

  if (loading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex justify-between items-center">
            <h2 className="text-lg font-medium">Profile</h2>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 flex flex-col items-center justify-center py-12">
            <Loader2 className="animate-spin text-blue-500" size={32} />
            <p className="mt-4 text-gray-500">Loading profile...</p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (error) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex justify-between items-center">
            <h2 className="text-lg font-medium">Profile</h2>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X size={20} />
            </button>
          </div>
          <div className="p-6 flex flex-col items-center justify-center py-8">
            <AlertCircle size={32} className="text-red-500 mb-2" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Error</h3>
            <p className="text-gray-600 text-center">{error}</p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  if (isPrivate) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex justify-between items-center">
            <h2 className="text-lg font-medium">Profile</h2>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <X size={20} />
            </button>
          </div>

          <div className="p-6 flex flex-col items-center justify-center py-12">
            <div className="w-16 h-16 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
              <Lock size={32} />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mt-4">{profileName}</h3>
            <p className="text-gray-500 mt-2 text-center">
              This profile is private
            </p>
          </div>
        </motion.div>
      </motion.div>
    );
  }

  const userData = profileData?.gameData ? {
    neighborhood: profileData.gameData.playerName + "'s City",
    neighbors: profileData.gameData.stats.neighborCount,
    buildings: profileData.gameData.stats.buildingCount,
    rating: Math.min(5, profileData.gameData.happiness / 20)
  } : {
    neighborhood: 'Sunny Valley',
    neighbors: 0,
    buildings: 0,
    rating: 0
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-4 bg-gradient-to-r from-blue-500 to-indigo-600 text-white flex justify-between items-center">
          <h2 className="text-lg font-medium">Profile</h2>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 rounded-full bg-blue-500 flex items-center justify-center text-white text-2xl font-bold">
              {profileName[0].toUpperCase()}
            </div>
            <div>
              <h3 className="text-xl font-semibold text-gray-900">{profileData?.gameData?.playerName || profileName}</h3>
              <p className="text-gray-500">@{profileData?.username || profileName}</p>
              {profileData?.createdAt && (
                <p className="text-gray-500 text-sm">Member since {new Date(profileData.createdAt).toLocaleDateString()}</p>
              )}
            </div>
          </div>

          {(!profileData?.showStats) ? null : (
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <MapPin size={16} />
                  <span className="text-sm font-medium">Neighborhood</span>
                </div>
                <p className="text-gray-900 font-medium">{userData.neighborhood}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Users size={16} />
                  <span className="text-sm font-medium">Neighbors</span>
                </div>
                <p className="text-gray-900 font-medium">{userData.neighbors}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Building2 size={16} />
                  <span className="text-sm font-medium">Buildings</span>
                </div>
                <p className="text-gray-900 font-medium">{userData.buildings}</p>
              </div>

              <div className="p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 text-gray-600 mb-1">
                  <Star size={16} />
                  <span className="text-sm font-medium">Rating</span>
                </div>
                <p className="text-gray-900 font-medium">{userData.rating.toFixed(1)}/5.0</p>
              </div>
            </div>
          )}

          {(!profileData?.showActivity) ? null : (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Recent Activity</h4>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Last active {profileData?.lastActive ? new Date(profileData.lastActive).toLocaleString() : 'Unknown'}</p>
                </div>
                {profileData?.gameData && (
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">Current day: {profileData.gameData.day}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
} 