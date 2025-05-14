import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Eye, EyeOff, X, Save, Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface ProfileSettingsProps {
  onClose: () => void;
}

export default function ProfileSettings({ onClose }: ProfileSettingsProps) {
  const { user } = useAuth();
  const [profileVisibility, setProfileVisibility] = useState<'public' | 'private'>('public');
  const [showBio, setShowBio] = useState(true);
  const [showStats, setShowStats] = useState(true);
  const [showActivity, setShowActivity] = useState(true);
  const [bio, setBio] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  
  useEffect(() => {
    if (user?.profileSettings) {
      setProfileVisibility(user.profileSettings.visibility || 'public');
      setShowBio(user.profileSettings.showBio !== undefined ? user.profileSettings.showBio : true);
      setShowStats(user.profileSettings.showStats !== undefined ? user.profileSettings.showStats : true);
      setShowActivity(user.profileSettings.showActivity !== undefined ? user.profileSettings.showActivity : true);
      setBio(user.profileSettings.bio || '');
    } else {
      try {
        const savedSettings = localStorage.getItem('profile_settings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          setProfileVisibility(parsedSettings.visibility || 'public');
          setShowBio(parsedSettings.showBio !== undefined ? parsedSettings.showBio : true);
          setShowStats(parsedSettings.showStats !== undefined ? parsedSettings.showStats : true);
          setShowActivity(parsedSettings.showActivity !== undefined ? parsedSettings.showActivity : true);
        }
      } catch (error) {
        console.error('Error loading profile settings from localStorage:', error);
      }
    }
  }, [user]);
  
  const handleSaveSettings = async () => {
    setIsSaving(true);
    setErrorMessage(null);
    
    try {
      const profileSettings = {
        visibility: profileVisibility,
        showBio,
        showStats,
        showActivity,
        bio
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
      console.error('Error saving profile settings:', error);
      setIsSaving(false);
      setSaveSuccess(false);
      setErrorMessage('Failed to save settings. Please try again.');
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
        className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
      >
        <div className="p-4 bg-emerald-600 text-white flex justify-between items-center">
          <h2 className="text-lg font-medium lowercase flex items-center">
            <User size={20} className="mr-2" />
            Profile Settings
          </h2>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 space-y-6">
          <div>
            <h3 className="text-sm font-medium text-gray-700 lowercase mb-3">profile visibility</h3>
            <div className="bg-gray-50 rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  {profileVisibility === 'public' ? (
                    <Eye size={18} className="text-emerald-500 mr-2" />
                  ) : (
                    <EyeOff size={18} className="text-gray-500 mr-2" />
                  )}
                  <span className="text-gray-700">
                    {profileVisibility === 'public' ? 'Public Profile' : 'Private Profile'}
                  </span>
                </div>
                <button
                  onClick={() => setProfileVisibility(profileVisibility === 'public' ? 'private' : 'public')}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    profileVisibility === 'public' ? 'bg-emerald-500' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`${
                      profileVisibility === 'public' ? 'translate-x-6' : 'translate-x-1'
                    } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                  />
                </button>
              </div>
              
              <p className="text-sm text-gray-500">
                {profileVisibility === 'public' 
                  ? 'Your profile is visible to everyone. Other players can see your neighborhood stats and progress.'
                  : 'Your profile is private. Other players cannot see your neighborhood details.'}
              </p>
            </div>
          </div>
          
          {profileVisibility === 'public' && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 lowercase mb-3">information sharing</h3>
              <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Show Bio</span>
                  <button
                    onClick={() => setShowBio(!showBio)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showBio ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`${
                        showBio ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Show Stats</span>
                  <button
                    onClick={() => setShowStats(!showStats)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showStats ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`${
                        showStats ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                    />
                  </button>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="text-gray-700">Show Activity</span>
                  <button
                    onClick={() => setShowActivity(!showActivity)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showActivity ? 'bg-emerald-500' : 'bg-gray-300'
                    }`}
                  >
                    <span
                      className={`${
                        showActivity ? 'translate-x-6' : 'translate-x-1'
                      } inline-block h-4 w-4 transform rounded-full bg-white transition`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}
          
          <div>
            <h3 className="text-sm font-medium text-gray-700 lowercase mb-3">bio</h3>
            <div className="bg-gray-50 rounded-lg p-4">
              <textarea
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Write something about yourself..."
                className="w-full h-24 p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-emerald-500"
                maxLength={200}
              />
              <div className="text-xs text-gray-500 mt-1 text-right">
                {bio.length}/200
              </div>
            </div>
          </div>
          
          {saveSuccess === true && (
            <div className="bg-green-50 text-green-700 p-3 rounded-lg flex items-center">
              <CheckCircle size={18} className="mr-2" />
              Settings saved successfully!
            </div>
          )}
          
          {saveSuccess === false && errorMessage && (
            <div className="bg-red-50 text-red-700 p-3 rounded-lg flex items-center">
              <AlertCircle size={18} className="mr-2" />
              {errorMessage}
            </div>
          )}
          
          <div className="flex justify-end">
            <button
              onClick={handleSaveSettings}
              disabled={isSaving}
              className="bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-lg font-medium transition-colors lowercase flex items-center disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 size={16} className="mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save size={16} className="mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
} 