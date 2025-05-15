import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, Home, Star, Clock, Lock, AlertCircle, Loader2, Building, Users, DollarSign } from 'lucide-react';
import { API_URL } from "../../config/apiConfig";

interface PublicProfileProps {
  username: string;
  onClose: () => void;
}

interface PublicProfileData {
  username: string;
  createdAt: string;
  lastActive: string;
  gameData: {
    playerName: string;
    day: number;
    level: number;
    happiness: number;
    stats: {
      buildingCount: number;
      neighborCount: number;
      totalIncome: number;
      happiness: number;
    };
    grid?: any[];
  } | null;
  showBio: boolean;
  showStats: boolean;
  showActivity: boolean;
}

export default function PublicProfile({ username, onClose }: PublicProfileProps) {
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      setIsPrivate(false);
      
      try {
        const response = await fetch(`${API_URL}/api/user/profile/${username}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        const data = await response.json();
        
        if (data.success) {
          setProfile(data.profile);
        } else {
          if (data.isPrivate) {
            setIsPrivate(true);
          } else {
            throw new Error(data.message || 'Failed to fetch profile');
          }
        }
      } catch (error) {
        console.error('Error fetching profile:', error);
        setError('Failed to load profile. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, [username]);
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };
  
  const formatTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.3)" }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
      >
        <div className="p-4 bg-emerald-600 text-white flex justify-between items-center">
          <h2 className="text-lg font-medium lowercase flex items-center">
            <User size={20} className="mr-2" />
            {username}'s Profile
          </h2>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-60px)]">
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-emerald-500" size={32} />
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg flex items-center">
              <AlertCircle size={20} className="mr-2" />
              {error}
            </div>
          ) : isPrivate ? (
            <div className="bg-gray-50 p-6 rounded-lg text-center">
              <div className="flex justify-center mb-4">
                <Lock size={48} className="text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-700 mb-2">Private Profile</h3>
              <p className="text-gray-500">
                This user has set their profile to private.
              </p>
            </div>
          ) : !profile ? (
            <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
              Profile not found.
            </div>
          ) : (
            <>
              <div className="flex items-center mb-6">
                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mr-4">
                  <User size={32} className="text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-xl font-medium">{profile.gameData?.playerName || profile.username}</h3>
                  <p className="text-gray-500">@{profile.username}</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Member since {formatDate(profile.createdAt)}
                  </p>
                </div>
              </div>
              
              {profile.gameData && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                    <div className="bg-emerald-50 p-4 rounded-lg">
                      <div className="flex items-center text-emerald-700 mb-1">
                        <Star size={16} className="mr-1" />
                        <span className="text-sm font-medium">Level</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-800">{profile.gameData.level}</div>
                    </div>
                    
                    <div className="bg-amber-50 p-4 rounded-lg">
                      <div className="flex items-center text-amber-700 mb-1">
                        <Calendar size={16} className="mr-1" />
                        <span className="text-sm font-medium">Day</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-800">{profile.gameData.day}</div>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <div className="flex items-center text-blue-700 mb-1">
                        <Building size={16} className="mr-1" />
                        <span className="text-sm font-medium">Buildings</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-800">{profile.gameData.stats.buildingCount}</div>
                    </div>
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
                      <div className="flex items-center text-purple-700 mb-1">
                        <Users size={16} className="mr-1" />
                        <span className="text-sm font-medium">Neighbors</span>
                      </div>
                      <div className="text-2xl font-bold text-gray-800">{profile.gameData.stats.neighborCount}</div>
                    </div>
                  </div>
                  
                  <div className="mb-6">
                    <h4 className="text-lg font-medium mb-3">Happiness</h4>
                    <div className="bg-gray-100 h-4 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-green-500" 
                        style={{ width: `${profile.gameData.happiness}%` }}
                      />
                    </div>
                    <div className="flex justify-between mt-1 text-sm text-gray-500">
                      <span>0%</span>
                      <span>{profile.gameData.happiness}%</span>
                      <span>100%</span>
                    </div>
                  </div>
                  
                  {profile.showStats && (
                    <div className="mb-6">
                      <h4 className="text-lg font-medium mb-3">Stats</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <DollarSign size={16} className="text-green-600 mr-2" />
                            <span>Daily Income</span>
                          </div>
                          <span className="font-medium">{profile.gameData.stats.totalIncome.toLocaleString()}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Building size={16} className="text-blue-600 mr-2" />
                            <span>Buildings</span>
                          </div>
                          <span className="font-medium">{profile.gameData.stats.buildingCount}</span>
                        </div>
                        
                        <div className="flex justify-between items-center">
                          <div className="flex items-center">
                            <Users size={16} className="text-purple-600 mr-2" />
                            <span>Neighbors</span>
                          </div>
                          <span className="font-medium">{profile.gameData.stats.neighborCount}</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {profile.showActivity && (
                    <div className="mb-6">
                      <h4 className="text-lg font-medium mb-3">Activity</h4>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center text-gray-600">
                          <Clock size={16} className="mr-2" />
                          <span>Last active {formatTimeSince(profile.lastActive)}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
} 