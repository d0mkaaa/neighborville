import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useAuth } from '../../context/AuthContext';
import { NORMALIZED_API_URL } from '../../config/apiConfig';

interface ExtendedProfileData {
  displayName: string;
  location: string;
  website: string;
  socialLinks: {
    twitter?: string;
    github?: string;
    instagram?: string;
    linkedin?: string;
  };
  interests: string[];
  gamePreferences: {
    favoriteBuilding: string;
    playStyle: string;
  };
  avatar: string;
}

const calculateProfileCompletion = (bio: string, extendedData: ExtendedProfileData): number => {
  let completedFields = 0;
  const totalFields = 6;
  
  if (bio && bio.trim().length > 10) completedFields++;
  if (extendedData.interests && extendedData.interests.length > 0) completedFields++;
  if (extendedData.location && extendedData.location.trim().length > 0) completedFields++;
  if (extendedData.gamePreferences.favoriteBuilding) completedFields++;
  if (extendedData.gamePreferences.playStyle) completedFields++;
  if (extendedData.avatar) completedFields++;
  
  return Math.round((completedFields / totalFields) * 100);
};

export default function ProfileCompletion() {
  const { user } = useAuth();
  const [profileCompletion, setProfileCompletion] = useState(0);
  const [bio, setBio] = useState('');
  const [extendedData, setExtendedData] = useState<ExtendedProfileData>({
    displayName: user?.username || '',
    location: '',
    website: '',
    socialLinks: {},
    interests: [],
    gamePreferences: {
      favoriteBuilding: '',
      playStyle: ''
    },
    avatar: ''
  });

  useEffect(() => {
    const loadProfileData = async () => {
      try {
        const response = await fetch(`${NORMALIZED_API_URL}/api/user/profile`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success && data.user?.profileSettings) {
            setBio(data.user.profileSettings.bio || '');
          }
        }

        const savedExtended = localStorage.getItem('extended_profile_data');
        if (savedExtended) {
          try {
            const parsed = JSON.parse(savedExtended);
            setExtendedData(prev => ({ ...prev, ...parsed }));
          } catch (error) {
            console.error('Error parsing extended profile:', error);
          }
        }
      } catch (error) {
        console.error('Error loading profile data:', error);
      }
    };

    loadProfileData();
  }, [user]);

  useEffect(() => {
    const completion = calculateProfileCompletion(bio, extendedData);
    setProfileCompletion(completion);
  }, [bio, extendedData]);

  const getCompletionMessage = () => {
    if (profileCompletion === 100) {
      return "Your profile is complete! 🎉";
    } else if (profileCompletion >= 75) {
      return "Almost done! Add a few more details.";
    } else if (profileCompletion >= 50) {
      return "Good progress! Keep filling out your profile.";
    } else if (profileCompletion >= 25) {
      return "Add a bio and interests to complete your profile!";
    } else {
      return "Complete your profile to unlock all features!";
    }
  };

  const getProgressColor = () => {
    if (profileCompletion >= 75) return 'from-green-500 to-emerald-500';
    if (profileCompletion >= 50) return 'from-yellow-500 to-orange-500';
    if (profileCompletion >= 25) return 'from-purple-500 to-pink-500';
    return 'from-gray-400 to-gray-500';
  };

  const getBackgroundColor = () => {
    if (profileCompletion >= 75) return 'from-green-50 to-emerald-50 border-green-100';
    if (profileCompletion >= 50) return 'from-yellow-50 to-orange-50 border-yellow-100';
    if (profileCompletion >= 25) return 'from-purple-50 to-pink-50 border-purple-100';
    return 'from-gray-50 to-gray-100 border-gray-200';
  };

  const getTextColor = () => {
    if (profileCompletion >= 75) return 'text-green-700';
    if (profileCompletion >= 50) return 'text-yellow-700';
    if (profileCompletion >= 25) return 'text-purple-700';
    return 'text-gray-700';
  };

  const getSubTextColor = () => {
    if (profileCompletion >= 75) return 'text-green-600';
    if (profileCompletion >= 50) return 'text-yellow-600';
    if (profileCompletion >= 25) return 'text-purple-600';
    return 'text-gray-600';
  };

  return (
    <div className={`mt-4 p-3 bg-gradient-to-r ${getBackgroundColor()} rounded-xl border`}>
      <div className="flex items-center justify-between mb-2">
        <span className={`text-sm font-medium ${getTextColor()}`}>Profile Completion</span>
        <span className={`text-xs ${getSubTextColor()}`}>{profileCompletion}%</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <motion.div 
          className={`bg-gradient-to-r ${getProgressColor()} h-2 rounded-full`}
          initial={{ width: 0 }}
          animate={{ width: `${profileCompletion}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </div>
      <p className={`text-xs ${getSubTextColor()} mt-1`}>
        {getCompletionMessage()}
      </p>
    </div>
  );
} 