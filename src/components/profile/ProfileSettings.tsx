import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  X, Save, Eye, EyeOff, Globe, Lock, User, MapPin, Link, 
  Heart, Star, Trophy, Building2, Loader2, CheckCircle, 
  AlertCircle, Camera, Edit3, Plus, Trash2
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { NORMALIZED_API_URL } from '../../config/apiConfig';
import Button from '../ui/Button';

interface ProfileSettingsProps {
  onClose: () => void;
  onUpdate?: () => void;
}

interface ProfileSettings {
  visibility: 'public' | 'private';
  showBio: boolean;
  showStats: boolean;
  showActivity: boolean;
  showSocialLinks: boolean;
  showAchievements: boolean;
}

interface ExtendedProfile {
  bio: string;
  location: string;
  website: string;
  interests: string[];
}

interface ProfileData {
  profileSettings: ProfileSettings;
  extendedProfile: ExtendedProfile;
}

export default function ProfileSettings({ onClose, onUpdate }: ProfileSettingsProps) {
  const { user, isAuthenticated } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
    visibility: 'public',
    showBio: true,
    showStats: true,
    showActivity: true,
    showSocialLinks: false,
    showAchievements: true
  });
  
  const [extendedProfile, setExtendedProfile] = useState<ExtendedProfile>({
    bio: '',
    location: '',
    website: '',
    interests: []
  });
  
  const [newInterest, setNewInterest] = useState('');

  useEffect(() => {
    if (isAuthenticated && user && !user.isGuest) {
      loadProfileData();
    } else {
      setLoading(false);
    }
  }, [isAuthenticated, user]);

  const loadProfileData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/user/profile`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.user) {
          if (data.user.profileSettings) {
            setProfileSettings({
              visibility: data.user.profileSettings.visibility || 'public',
              showBio: data.user.profileSettings.showBio !== false,
              showStats: data.user.profileSettings.showStats !== false,
              showActivity: data.user.profileSettings.showActivity !== false,
              showSocialLinks: data.user.profileSettings.showSocialLinks === true,
              showAchievements: data.user.profileSettings.showAchievements !== false
            });
          }
          
          if (data.user.extendedProfile) {
            setExtendedProfile({
              bio: data.user.extendedProfile.bio || '',
              location: data.user.extendedProfile.location || '',
              website: data.user.extendedProfile.website || '',
              interests: data.user.extendedProfile.interests || []
            });
          }
        }
      } else {
        setError('Failed to load profile settings');
      }
    } catch (error) {
      console.error('Error loading profile data:', error);
      setError('Failed to load profile settings');
    } finally {
      setLoading(false);
    }
  };

  const saveProfileData = async () => {
    if (!isAuthenticated || !user || user.isGuest) return;
    
    setSaving(true);
    setError(null);
    setSuccess(null);
    
    try {
      const response = await fetch(`${NORMALIZED_API_URL}/api/user/profile`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          profileSettings,
          extendedProfile
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setSuccess('Profile settings saved successfully!');
        if (onUpdate) {
          onUpdate();
        }
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError(data.message || 'Failed to save profile settings');
      }
    } catch (error) {
      console.error('Error saving profile data:', error);
      setError('Failed to save profile settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: keyof ProfileSettings, value: boolean) => {
    setProfileSettings(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleExtendedProfileChange = (key: keyof ExtendedProfile, value: string | string[]) => {
    setExtendedProfile(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const addInterest = () => {
    if (newInterest.trim() && !extendedProfile.interests.includes(newInterest.trim())) {
      handleExtendedProfileChange('interests', [...extendedProfile.interests, newInterest.trim()]);
      setNewInterest('');
    }
  };

  const removeInterest = (interest: string) => {
    handleExtendedProfileChange('interests', extendedProfile.interests.filter(i => i !== interest));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      addInterest();
    }
  };

  if (!isAuthenticated || !user || user.isGuest) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-xl shadow-xl max-w-md w-full p-6"
        >
          <div className="text-center">
            <AlertCircle className="mx-auto text-yellow-500 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Guest Account</h3>
            <p className="text-gray-600 mb-4">
              Profile settings are only available for registered accounts.
            </p>
            <Button onClick={onClose} variant="primary" fullWidth>
              Close
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        <div className="p-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <Edit3 size={24} className="mr-3" />
              <div>
                <h2 className="text-xl font-bold">Profile Settings</h2>
                <p className="text-blue-100 text-sm">Customize your public profile</p>
              </div>
            </div>
            <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 max-h-[60vh] overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="animate-spin text-gray-400" size={32} />
              <span className="ml-3 text-gray-600">Loading profile settings...</span>
            </div>
          ) : (
            <div className="space-y-8">
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <AlertCircle className="text-red-500 mr-2" size={20} />
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center">
                    <CheckCircle className="text-green-500 mr-2" size={20} />
                    <p className="text-green-700">{success}</p>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Lock className="text-blue-500" size={20} />
                  Privacy Settings
                </h3>
                
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {profileSettings.visibility === 'public' ? (
                        <Globe className="text-green-500" size={20} />
                      ) : (
                        <Lock className="text-red-500" size={20} />
                      )}
                      <div>
                        <p className="font-medium text-gray-900">Profile Visibility</p>
                        <p className="text-sm text-gray-600">
                          {profileSettings.visibility === 'public' 
                            ? 'Your profile is visible to everyone'
                            : 'Your profile is private'
                          }
                        </p>
                      </div>
                    </div>
                                         <select
                       value={profileSettings.visibility}
                       onChange={(e) => setProfileSettings(prev => ({ ...prev, visibility: e.target.value as 'public' | 'private' }))}
                       className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                     >
                       <option value="public">Public</option>
                       <option value="private">Private</option>
                     </select>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <Eye className="text-blue-500" size={20} />
                  What to Show
                </h3>
                
                <div className="bg-gray-50 rounded-lg p-4 space-y-4">
                  {[
                    { key: 'showBio', label: 'Biography', description: 'Show your personal bio' },
                    { key: 'showStats', label: 'Game Statistics', description: 'Show your city stats and achievements' },
                    { key: 'showActivity', label: 'Recent Activity', description: 'Show your recent game activity' },
                    { key: 'showAchievements', label: 'Achievements', description: 'Display your earned achievements' },
                    { key: 'showSocialLinks', label: 'Social Links', description: 'Show your website and social media' }
                  ].map(setting => (
                    <div key={setting.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{setting.label}</p>
                        <p className="text-sm text-gray-600">{setting.description}</p>
                      </div>
                      <button
                        onClick={() => handleSettingChange(setting.key as keyof ProfileSettings, !profileSettings[setting.key as keyof ProfileSettings])}
                        className={`
                          relative inline-flex h-6 w-11 items-center rounded-full transition-colors
                          ${profileSettings[setting.key as keyof ProfileSettings] ? 'bg-blue-600' : 'bg-gray-300'}
                        `}
                      >
                        <span
                          className={`
                            inline-block h-4 w-4 transform rounded-full bg-white transition-transform
                            ${profileSettings[setting.key as keyof ProfileSettings] ? 'translate-x-6' : 'translate-x-1'}
                          `}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <User className="text-blue-500" size={20} />
                  Profile Information
                </h3>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Biography
                    </label>
                    <textarea
                      value={extendedProfile.bio}
                      onChange={(e) => handleExtendedProfileChange('bio', e.target.value)}
                      placeholder="Tell others about yourself and your city-building style..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {extendedProfile.bio.length}/500 characters
                    </p>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <MapPin size={16} />
                      Location
                    </label>
                    <input
                      type="text"
                      value={extendedProfile.location}
                      onChange={(e) => handleExtendedProfileChange('location', e.target.value)}
                      placeholder="Your city, country"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Link size={16} />
                      Website
                    </label>
                    <input
                      type="url"
                      value={extendedProfile.website}
                      onChange={(e) => handleExtendedProfileChange('website', e.target.value)}
                      placeholder="https://your-website.com"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                      <Heart size={16} />
                      Interests
                    </label>
                    
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={newInterest}
                          onChange={(e) => setNewInterest(e.target.value)}
                          onKeyPress={handleKeyPress}
                          placeholder="Add an interest..."
                          className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          maxLength={30}
                        />
                        <Button
                          onClick={addInterest}
                          variant="outline"
                          size="sm"
                          icon={<Plus size={16} />}
                          disabled={!newInterest.trim() || extendedProfile.interests.includes(newInterest.trim())}
                        >
                          Add
                        </Button>
                      </div>
                      
                      {extendedProfile.interests.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                          {extendedProfile.interests.map((interest, index) => (
                            <span
                              key={index}
                              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                            >
                              {interest}
                              <button
                                onClick={() => removeInterest(interest)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <Trash2 size={12} />
                              </button>
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-1">
                      Add interests to help other players connect with you
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 bg-gray-50 border-t border-gray-200">
          <div className="flex gap-3">
            <Button
              onClick={saveProfileData}
              variant="primary"
              fullWidth
              disabled={saving}
              loading={saving}
              icon={<Save size={20} />}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button
              onClick={onClose}
              variant="ghost"
              fullWidth
            >
              Cancel
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 