import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { X, MapPin, Users, Building2, Star, Lock, AlertCircle } from 'lucide-react';

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
  const profileId = profile?.id || userId || 'unknown';
  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
    visibility: 'public',
    showBio: true,
    showStats: true,
    showActivity: true
  });
  const [isPrivate, setIsPrivate] = useState(false);

  const userData = profile ? {
    neighborhood: profile.neighborhood.name,
    neighbors: profile.neighborhood.neighbors.length,
    buildings: profile.neighborhood.buildings.length,
    rating: profile.neighborhood.stats.totalHappiness / 20
  } : {
    neighborhood: 'Sunny Valley',
    neighbors: 12,
    buildings: 5,
    rating: 4.5
  };

  useEffect(() => {
    const savedSettings = localStorage.getItem('profile_settings');
    if (savedSettings) {
      try {
        const settings = JSON.parse(savedSettings) as ProfileSettings;
        setProfileSettings(settings);
        setIsPrivate(settings.visibility === 'private');
      } catch (error) {
        console.error('Failed to parse profile settings', error);
      }
    }
  }, []);

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
              <h3 className="text-xl font-semibold text-gray-900">{profileName}</h3>
              <p className="text-gray-500">Member since 2024</p>
            </div>
          </div>

          {profileSettings.showStats && (
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
                <p className="text-gray-900 font-medium">{userData.rating}/5.0</p>
              </div>
            </div>
          )}

          {profileSettings.showActivity && (
            <div className="space-y-4">
              <h4 className="font-medium text-gray-900">Recent Activity</h4>
              <div className="space-y-3">
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Built a new house in Sunny Valley</p>
                  <p className="text-xs text-gray-400 mt-1">2 days ago</p>
                </div>
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">Welcomed 3 new neighbors</p>
                  <p className="text-xs text-gray-400 mt-1">1 week ago</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
} 