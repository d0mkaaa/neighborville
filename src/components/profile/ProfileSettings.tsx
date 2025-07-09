import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useAuth } from "../../context/AuthContext";
import { NORMALIZED_API_URL } from "../../config/apiConfig";
import Button from "../ui/Button";
import GlassCard from "../ui/GlassCard";
import {
  X,
  User,
  Edit3,
  MapPin,
  Link,
  Heart,
  Eye,
  Lock,
  Globe,
  Plus,
  Trash2,
  Save,
  AlertCircle,
  CheckCircle,
  Loader2,
  Camera,
  Mail,
  Calendar,
  Star,
  Sparkles,
} from "lucide-react";

interface ProfileSettingsProps {
  onClose: () => void;
  onUpdate?: () => void;
}

interface ProfileSettings {
  visibility: "public" | "private";
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
  socialLinks: {
    twitter?: string;
    discord?: string;
    youtube?: string;
    instagram?: string;
  };
  gamePreferences: {
    favoriteBuilding?: string;
    playStyle?: string;
    preferredDifficulty?: string;
  };
}

interface ProfileData {
  profileSettings: ProfileSettings;
  extendedProfile: ExtendedProfile;
}

export default function ProfileSettings({
  onClose,
  onUpdate,
}: ProfileSettingsProps) {
  const { user, isAuthenticated } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"profile" | "privacy" | "display">(
    "profile",
  );

  const [profileSettings, setProfileSettings] = useState<ProfileSettings>({
    visibility: "public",
    showBio: true,
    showStats: true,
    showActivity: true,
    showSocialLinks: false,
    showAchievements: true,
  });

  const [extendedProfile, setExtendedProfile] = useState<ExtendedProfile>({
    bio: "",
    location: "",
    website: "",
    interests: [],
    socialLinks: {},
    gamePreferences: {},
  });

  const [newInterest, setNewInterest] = useState("");

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
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Loaded profile data:", data);
        if (data.success && data.user) {
          if (data.user.profileSettings) {
            setProfileSettings({
              visibility: data.user.profileSettings.visibility || "public",
              showBio: data.user.profileSettings.showBio !== false,
              showStats: data.user.profileSettings.showStats !== false,
              showActivity: data.user.profileSettings.showActivity !== false,
              showSocialLinks:
                data.user.profileSettings.showSocialLinks === true,
              showAchievements:
                data.user.profileSettings.showAchievements !== false,
            });
          }

          if (data.user.extendedProfile) {
            setExtendedProfile({
              bio: data.user.extendedProfile.bio || "",
              location: data.user.extendedProfile.location || "",
              website: data.user.extendedProfile.website || "",
              interests: data.user.extendedProfile.interests || [],
              socialLinks: data.user.extendedProfile.socialLinks || {},
              gamePreferences: data.user.extendedProfile.gamePreferences || {},
            });
          }
        }
      } else {
        setError("Failed to load profile settings");
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
      setError("Failed to load profile settings");
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
      const requestData = {
        profileSettings,
        extendedProfile,
      };
      console.log("Saving profile data:", requestData);

      const response = await fetch(`${NORMALIZED_API_URL}/api/user/profile/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(requestData),
      });

      const data = await response.json();
      console.log("Save response:", data);

      if (data.success) {
        setSuccess("Profile settings saved successfully!");
        if (onUpdate) {
          onUpdate();
        }
        setTimeout(() => {
          setSuccess(null);
        }, 3000);
      } else {
        setError(data.message || "Failed to save profile settings");
      }
    } catch (error) {
      console.error("Error saving profile data:", error);
      setError("Failed to save profile settings");
    } finally {
      setSaving(false);
    }
  };

  const handleSettingChange = (key: keyof ProfileSettings, value: boolean) => {
    setProfileSettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleExtendedProfileChange = (
    key: keyof ExtendedProfile,
    value: string | string[],
  ) => {
    setExtendedProfile((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const addInterest = () => {
    if (
      newInterest.trim() &&
      !extendedProfile.interests.includes(newInterest.trim())
    ) {
      handleExtendedProfileChange("interests", [
        ...extendedProfile.interests,
        newInterest.trim(),
      ]);
      setNewInterest("");
    }
  };

  const removeInterest = (interest: string) => {
    handleExtendedProfileChange(
      "interests",
      extendedProfile.interests.filter((i) => i !== interest),
    );
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      addInterest();
    }
  };

  if (!isAuthenticated || !user || user.isGuest) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-gray-200"
        >
          <div className="text-center">
            <AlertCircle className="mx-auto text-amber-500 mb-4" size={48} />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Guest Account
            </h3>
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

  const tabs = [
    {
      id: "profile",
      label: "Profile Info",
      icon: User,
      description: "Personal information",
    },
    {
      id: "privacy",
      label: "Privacy",
      icon: Lock,
      description: "Who can see what",
    },
    {
      id: "display",
      label: "Display",
      icon: Eye,
      description: "Profile visibility options",
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        className="w-full max-w-5xl max-h-[90vh] overflow-hidden"
      >
        <div className="h-full bg-white rounded-xl shadow-xl">
          <div className="p-6 bg-gradient-to-r from-blue-50 to-purple-50 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <Sparkles size={28} className="mr-3 text-blue-600" />
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">
                    Profile Settings
                  </h2>
                  <p className="text-gray-600 text-sm">
                    Customize your public profile and privacy settings
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-gray-600 hover:text-gray-900 transition-colors p-2 hover:bg-gray-100 rounded-lg"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="flex h-full">
            <div className="w-80 border-r border-gray-200 p-6 space-y-2">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() =>
                      setActiveTab(tab.id as "profile" | "privacy" | "display")
                    }
                    className={`w-full text-left p-4 rounded-xl transition-all ${
                      activeTab === tab.id
                        ? "bg-blue-50 border border-blue-200 text-blue-900"
                        : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    <div className="flex items-center">
                      <Icon size={20} className="mr-3" />
                      <div>
                        <div className="font-medium">{tab.label}</div>
                        <div className="text-xs opacity-70">
                          {tab.description}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}

              <div className="mt-8">
                <h4 className="text-gray-900 font-medium mb-3 flex items-center">
                  <Star size={16} className="mr-2" />
                  Preview
                </h4>
                <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                  <div className="flex items-center mb-3">
                    <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-purple-500 rounded-xl flex items-center justify-center mr-3">
                      <User size={20} className="text-white" />
                    </div>
                    <div>
                      <div className="text-gray-900 font-medium">
                        {user?.username}
                      </div>
                      <div className="text-gray-600 text-sm">
                        {profileSettings.visibility === "public"
                          ? "🌐 Public"
                          : "🔒 Private"}
                      </div>
                    </div>
                  </div>
                  {extendedProfile.bio && (
                    <div className="text-gray-700 text-sm bg-gray-100 rounded-lg p-3 mb-2">
                      {extendedProfile.bio.slice(0, 80)}
                      {extendedProfile.bio.length > 80 ? "..." : ""}
                    </div>
                  )}
                  {extendedProfile.location && (
                    <div className="text-gray-600 text-xs flex items-center">
                      <MapPin size={12} className="mr-1" />
                      {extendedProfile.location}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex-1 p-6 overflow-y-auto">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="animate-spin text-gray-500" size={32} />
                  <span className="ml-3 text-gray-600">
                    Loading profile settings...
                  </span>
                </div>
              ) : (
                <div className="space-y-6">
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-red-50 border border-red-200 rounded-xl p-4"
                    >
                      <div className="flex items-center">
                        <AlertCircle className="text-red-600 mr-2" size={20} />
                        <p className="text-red-700">{error}</p>
                      </div>
                    </motion.div>
                  )}

                  {success && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-green-50 border border-green-200 rounded-xl p-4"
                    >
                      <div className="flex items-center">
                        <CheckCircle
                          className="text-green-600 mr-2"
                          size={20}
                        />
                        <p className="text-green-700">{success}</p>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "profile" && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                          <User className="text-blue-500 mr-3" size={24} />
                          Personal Information
                        </h3>

                        <div className="space-y-4">
                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                            <label className="block text-gray-900 font-medium mb-3 flex items-center">
                              <Edit3 size={18} className="mr-2 text-blue-500" />
                              Biography
                            </label>
                            <textarea
                              value={extendedProfile.bio}
                              onChange={(e) =>
                                handleExtendedProfileChange(
                                  "bio",
                                  e.target.value,
                                )
                              }
                              placeholder="Tell others about yourself and your city-building style... What kind of mayor are you? What's your building philosophy?"
                              className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                              rows={4}
                              maxLength={500}
                            />
                            <div className="flex justify-between items-center mt-2">
                              <p className="text-gray-600 text-xs">
                                Share your story with other players
                              </p>
                              <p className="text-gray-600 text-xs">
                                {extendedProfile.bio.length}/500 characters
                              </p>
                            </div>
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                              <label className="block text-gray-900 font-medium mb-3 flex items-center">
                                <MapPin
                                  size={18}
                                  className="mr-2 text-green-500"
                                />
                                Location
                              </label>
                              <input
                                type="text"
                                value={extendedProfile.location}
                                onChange={(e) =>
                                  handleExtendedProfileChange(
                                    "location",
                                    e.target.value,
                                  )
                                }
                                placeholder="Your city, country"
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                maxLength={100}
                              />
                            </div>

                            <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                              <label className="block text-gray-900 font-medium mb-3 flex items-center">
                                <Link
                                  size={18}
                                  className="mr-2 text-purple-500"
                                />
                                Website
                              </label>
                              <input
                                type="url"
                                value={extendedProfile.website}
                                onChange={(e) =>
                                  handleExtendedProfileChange(
                                    "website",
                                    e.target.value,
                                  )
                                }
                                placeholder="https://your-website.com"
                                className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                              />
                            </div>
                          </div>

                          <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                            <label className="block text-gray-900 font-medium mb-3 flex items-center">
                              <Heart size={18} className="mr-2 text-pink-500" />
                              Interests & Hobbies
                            </label>

                            <div className="space-y-4">
                              <div className="flex gap-3">
                                <input
                                  type="text"
                                  value={newInterest}
                                  onChange={(e) =>
                                    setNewInterest(e.target.value)
                                  }
                                  onKeyPress={handleKeyPress}
                                  placeholder="Add an interest..."
                                  className="flex-1 px-4 py-3 bg-white border border-gray-200 rounded-xl text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
                                  maxLength={30}
                                />
                                <button
                                  onClick={addInterest}
                                  disabled={
                                    !newInterest.trim() ||
                                    extendedProfile.interests.includes(
                                      newInterest.trim(),
                                    )
                                  }
                                  className="px-6 py-3 bg-gradient-to-r from-pink-500 to-rose-500 text-white rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:from-pink-600 hover:to-rose-600 transition-all flex items-center"
                                >
                                  <Plus size={18} className="mr-2" />
                                  Add
                                </button>
                              </div>

                              {extendedProfile.interests.length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {extendedProfile.interests.map(
                                    (interest, index) => (
                                      <motion.span
                                        key={index}
                                        initial={{ scale: 0 }}
                                        animate={{ scale: 1 }}
                                        className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-100 to-purple-100 border border-gray-200 text-gray-800 rounded-full text-sm font-medium"
                                      >
                                        {interest}
                                        <button
                                          onClick={() =>
                                            removeInterest(interest)
                                          }
                                          className="text-gray-600 hover:text-gray-800 transition-colors"
                                        >
                                          <Trash2 size={14} />
                                        </button>
                                      </motion.span>
                                    ),
                                  )}
                                </div>
                              )}
                            </div>

                            <p className="text-gray-600 text-xs mt-3">
                              Add interests to help other players connect with
                              you
                            </p>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "privacy" && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                          <Lock className="text-amber-500 mr-3" size={24} />
                          Privacy Settings
                        </h3>

                        <div className="bg-gray-50 border border-gray-200 rounded-xl p-6">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              {profileSettings.visibility === "public" ? (
                                <Globe className="text-green-500" size={24} />
                              ) : (
                                <Lock className="text-red-500" size={24} />
                              )}
                              <div>
                                <p className="font-medium text-gray-900 text-lg">
                                  Profile Visibility
                                </p>
                                <p className="text-gray-600">
                                  {profileSettings.visibility === "public"
                                    ? "Your profile is visible to everyone in the community"
                                    : "Your profile is private and only visible to you"}
                                </p>
                              </div>
                            </div>
                            <select
                              value={profileSettings.visibility}
                              onChange={(e) =>
                                setProfileSettings((prev) => ({
                                  ...prev,
                                  visibility: e.target.value as
                                    | "public"
                                    | "private",
                                }))
                              }
                              className="px-4 py-2 bg-white border border-gray-200 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            >
                              <option value="public" className="bg-white">
                                Public
                              </option>
                              <option value="private" className="bg-white">
                                Private
                              </option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {activeTab === "display" && (
                    <motion.div
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className="space-y-6"
                    >
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                          <Eye className="text-blue-500 mr-3" size={24} />
                          What to Display
                        </h3>

                        <div className="space-y-4">
                          {[
                            {
                              key: "showBio",
                              label: "Biography",
                              description: "Show your personal bio and story",
                              icon: Edit3,
                              color: "blue",
                            },
                            {
                              key: "showStats",
                              label: "Game Statistics",
                              description:
                                "Display your city stats and progress",
                              icon: Star,
                              color: "yellow",
                            },
                            {
                              key: "showActivity",
                              label: "Recent Activity",
                              description: "Show when you were last active",
                              icon: Calendar,
                              color: "green",
                            },
                            {
                              key: "showAchievements",
                              label: "Achievements",
                              description:
                                "Display your earned achievements and badges",
                              icon: Sparkles,
                              color: "purple",
                            },
                            {
                              key: "showSocialLinks",
                              label: "Social Links",
                              description:
                                "Show your website and social media links",
                              icon: Link,
                              color: "pink",
                            },
                          ].map((setting) => {
                            const Icon = setting.icon;
                            const colorClasses = {
                              blue: "text-blue-500",
                              yellow: "text-yellow-500",
                              green: "text-green-500",
                              purple: "text-purple-500",
                              pink: "text-pink-500",
                            };

                            return (
                              <div
                                key={setting.key}
                                className="bg-gray-50 border border-gray-200 rounded-xl p-6"
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-4">
                                    <Icon
                                      className={
                                        colorClasses[
                                          setting.color as keyof typeof colorClasses
                                        ]
                                      }
                                      size={24}
                                    />
                                    <div>
                                      <p className="font-medium text-gray-900 text-lg">
                                        {setting.label}
                                      </p>
                                      <p className="text-gray-600">
                                        {setting.description}
                                      </p>
                                    </div>
                                  </div>
                                  <button
                                    onClick={() =>
                                      handleSettingChange(
                                        setting.key as keyof ProfileSettings,
                                        !profileSettings[
                                          setting.key as keyof ProfileSettings
                                        ],
                                      )
                                    }
                                    className={`
                                      relative inline-flex h-8 w-14 items-center rounded-full transition-colors
                                      ${
                                        profileSettings[
                                          setting.key as keyof ProfileSettings
                                        ]
                                          ? "bg-gradient-to-r from-blue-500 to-purple-500"
                                          : "bg-gray-200"
                                      }
                                    `}
                                  >
                                    <span
                                      className={`
                                        inline-block h-6 w-6 transform rounded-full bg-white transition-transform shadow-lg
                                        ${profileSettings[setting.key as keyof ProfileSettings] ? "translate-x-7" : "translate-x-1"}
                                      `}
                                    />
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-6 bg-gray-50 border-t border-gray-200">
            <div className="flex gap-4">
              <button
                onClick={saveProfileData}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl font-medium disabled:opacity-50 hover:from-blue-600 hover:to-purple-600 transition-all"
              >
                {saving ? (
                  <Loader2 className="animate-spin" size={20} />
                ) : (
                  <Save size={20} />
                )}
                {saving ? "Saving Changes..." : "Save Changes"}
              </button>
              <button
                onClick={onClose}
                className="px-6 py-3 bg-gray-100 text-gray-700 rounded-xl font-medium hover:bg-gray-200 transition-all"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
