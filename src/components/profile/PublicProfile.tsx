import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, Home, Star, Clock, Lock, AlertCircle, Loader2, Building, Users, DollarSign, Flag } from 'lucide-react';
import { getPublicProfile } from "../../services/userService";
import type { PublicProfileData } from "../../services/userService";
import ReportModal from './ReportModal';

interface PublicProfileProps {
  username: string;
  onClose: () => void;
}

export default function PublicProfile({ username, onClose }: PublicProfileProps) {
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);
  
  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      setIsPrivate(false);
      
      try {
        const result = await getPublicProfile(username);
        
        if (result.success && result.profile) {
          setProfile(result.profile);
        } else {
          if (result.isPrivate) {
            setIsPrivate(true);
          } else {
            throw new Error(result.message || 'Failed to fetch profile');
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
    <>
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
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowReportModal(true)}
                className="text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
                title="Report User"
              >
                <Flag size={16} />
              </button>
              <button 
                onClick={onClose}
                className="text-white/80 hover:text-white transition-colors text-xl"
              >
                ×
              </button>
            </div>
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

                {profile.showBio && profile.extendedProfile?.bio && (
                  <div className="mb-6">
                    <h4 className="text-lg font-medium mb-3">About</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-gray-700 leading-relaxed">{profile.extendedProfile.bio}</p>
                    </div>
                  </div>
                )}

                {profile.extendedProfile && (profile.extendedProfile.location || profile.extendedProfile.website) && (
                  <div className="mb-6">
                    <h4 className="text-lg font-medium mb-3">Details</h4>
                    <div className="space-y-2">
                      {profile.extendedProfile.location && (
                        <div className="flex items-center text-gray-600">
                          <Home size={16} className="mr-2" />
                          <span>{profile.extendedProfile.location}</span>
                        </div>
                      )}
                      {profile.extendedProfile.website && (
                        <div className="flex items-center text-gray-600">
                          <span className="mr-2">🌐</span>
                          <a 
                            href={profile.extendedProfile.website} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-emerald-600 hover:underline"
                          >
                            {profile.extendedProfile.website}
                          </a>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {profile.extendedProfile?.interests && profile.extendedProfile.interests.length > 0 && (
                  <div className="mb-6">
                    <h4 className="text-lg font-medium mb-3">Interests</h4>
                    <div className="flex flex-wrap gap-2">
                      {profile.extendedProfile.interests.map((interest, index) => (
                        <span 
                          key={index}
                          className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-sm"
                        >
                          {interest}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {profile.extendedProfile?.gamePreferences && (
                  <div className="mb-6">
                    <h4 className="text-lg font-medium mb-3">Game Preferences</h4>
                    <div className="bg-blue-50 p-4 rounded-lg space-y-2">
                      {profile.extendedProfile.gamePreferences.favoriteBuilding && (
                        <div className="flex items-center">
                          <Building size={16} className="text-blue-600 mr-2" />
                          <span className="text-sm text-gray-600">Favorite Building:</span>
                          <span className="ml-2 font-medium">{profile.extendedProfile.gamePreferences.favoriteBuilding}</span>
                        </div>
                      )}
                      {profile.extendedProfile.gamePreferences.playStyle && (
                        <div className="flex items-center">
                          <Star size={16} className="text-blue-600 mr-2" />
                          <span className="text-sm text-gray-600">Play Style:</span>
                          <span className="ml-2 font-medium">{profile.extendedProfile.gamePreferences.playStyle}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
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

      {showReportModal && profile && (
        <ReportModal
          reportedUser={{
            id: profile.username,
            username: profile.username,
            displayName: profile.gameData?.playerName || profile.username
          }}
          reportableContent={{
            bio: profile.extendedProfile?.bio,
            location: profile.extendedProfile?.location,
            website: profile.extendedProfile?.website,
            interests: profile.extendedProfile?.interests,
            gamePreferences: profile.extendedProfile?.gamePreferences
          }}
          onClose={() => setShowReportModal(false)}
          onSubmit={(reportData) => {
            console.log('Report submitted:', reportData);
            setShowReportModal(false);
          }}
        />
      )}
    </>
  );
} 