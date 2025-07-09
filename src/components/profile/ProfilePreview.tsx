import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Calendar,
  MapPin,
  Globe,
  Trophy,
  Building2,
  Users,
  Heart,
  DollarSign,
  Star,
  Clock,
  Home,
  Zap,
  TreePine,
  Award,
  Target,
  TrendingUp,
  Loader2,
  AlertTriangle,
  Edit3,
  Save,
  X,
  Settings,
  Activity,
  Crown,
  Factory,
  Coins,
  BarChart3,
  Gift,
  CheckCircle,
  XCircle,
  Eye,
  EyeOff,
} from "lucide-react";
import ModalWrapper from "../ui/ModalWrapper";
import { loadNeighborhoodFromServer } from "../../services/neighborhoodService";
import { getCurrentUser } from "../../services/userService";
import type { GameProgress } from "../../types/game";
import type { Achievement } from "../../types/game";
import { ACHIEVEMENTS } from "../../data/achievements";

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
    visibility: "public" | "private";
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
  achievements?: Achievement[];
  recentActivity?: Array<{
    id: string;
    type:
      | "building_placed"
      | "neighbor_unlocked"
      | "level_up"
      | "achievement_earned";
    description: string;
    timestamp: string;
    icon: string;
  }>;
}

export default function ProfilePreview({ onClose }: ProfilePreviewProps) {
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "overview" | "stats" | "achievements" | "settings"
  >("overview");
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    bio: "",
    location: "",
    website: "",
    interests: [] as string[],
    gamePreferences: {
      favoriteBuilding: "",
      playStyle: "",
    },
  });

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [userResult, gameResult] = await Promise.all([
        getCurrentUser(),
        loadNeighborhoodFromServer(),
      ]);

      if (!userResult) {
        throw new Error("Unable to load user profile");
      }

      const profileResponse = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/user/profile`,
        {
          credentials: "include",
        },
      );

      let extendedProfile = null;
      if (profileResponse.ok) {
        const profileResult = await profileResponse.json();
        extendedProfile = profileResult;
      }

      const completedAchievements =
        gameResult.success && gameResult.gameData?.achievements
          ? ACHIEVEMENTS.map((achievement) => ({
              ...achievement,
              completed:
                gameResult.gameData?.achievements?.some(
                  (ach: any) =>
                    (typeof ach === "string" ? ach : ach.id) === achievement.id,
                ) || false,
            }))
          : ACHIEVEMENTS;

      const recentActivity = [
        {
          id: "1",
          type: "building_placed" as const,
          description: "Placed a new residential building",
          timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
          icon: "🏠",
        },
        {
          id: "2",
          type: "level_up" as const,
          description: `Reached level ${gameResult.success ? gameResult.gameData?.level || 1 : 1}`,
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
          icon: "⭐",
        },
        {
          id: "3",
          type: "neighbor_unlocked" as const,
          description: "Welcomed a new neighbor to the community",
          timestamp: new Date(Date.now() - 1000 * 60 * 60 * 6).toISOString(),
          icon: "👋",
        },
      ];

      setProfileData({
        profile: {
          id: userResult.id,
          username: userResult.username,
          email: userResult.email,
          createdAt:
            typeof userResult.createdAt === "string"
              ? userResult.createdAt
              : new Date().toISOString(),
          lastLogin:
            typeof userResult.lastLogin === "string"
              ? userResult.lastLogin
              : undefined,
          profileSettings: extendedProfile?.profileSettings,
          extendedProfile: extendedProfile?.extendedProfile,
        },
        gameData: gameResult.success ? gameResult.gameData : null,
        achievements: completedAchievements,
        recentActivity,
      });

      setEditForm({
        bio: extendedProfile?.extendedProfile?.bio || "",
        location: extendedProfile?.extendedProfile?.location || "",
        website: extendedProfile?.extendedProfile?.website || "",
        interests: extendedProfile?.extendedProfile?.interests || [],
        gamePreferences: {
          favoriteBuilding:
            extendedProfile?.extendedProfile?.gamePreferences
              ?.favoriteBuilding || "",
          playStyle:
            extendedProfile?.extendedProfile?.gamePreferences?.playStyle || "",
        },
      });
    } catch (err) {
      console.error("Error loading profile data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to load profile data",
      );
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  };

  const handleSaveProfile = async () => {
    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_URL || "http://localhost:3001"}/api/user/profile`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
          body: JSON.stringify({
            extendedProfile: editForm,
          }),
        },
      );

      if (response.ok) {
        setIsEditing(false);
        await loadProfileData();
      } else {
        console.error("Failed to save profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
    }
  };

  const renderTabButton = (
    tabId: typeof activeTab,
    icon: React.ReactNode,
    label: string,
    badge?: number,
  ) => (
    <motion.button
      key={tabId}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setActiveTab(tabId)}
      className={`relative flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
        activeTab === tabId
          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25"
          : "bg-gray-100 text-gray-700 hover:bg-gray-200 hover:text-gray-900"
      }`}
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
      {badge !== undefined && badge > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
        >
          {badge > 99 ? "99+" : badge}
        </motion.span>
      )}
    </motion.button>
  );

  const calculateTotalBuildings = () => {
    if (!profileData?.gameData?.grid) return 0;
    return profileData.gameData.grid.filter((building) => building !== null)
      .length;
  };

  const calculateTotalResidents = () => {
    if (!profileData?.gameData?.neighbors) return 0;
    return profileData.gameData.neighbors.filter(
      (neighbor) =>
        neighbor.houseIndex !== undefined && neighbor.houseIndex !== -1,
    ).length;
  };

  const getNeighborhoodAge = () => {
    if (!profileData?.gameData?.neighborhoodFoundedDate)
      return "Recently founded";
    const founded = new Date(profileData.gameData.neighborhoodFoundedDate);
    const now = new Date();
    const diffInDays = Math.floor(
      (now.getTime() - founded.getTime()) / (1000 * 60 * 60 * 24),
    );

    if (diffInDays < 1) return "Founded today";
    if (diffInDays === 1) return "Founded yesterday";
    if (diffInDays < 30) return `Founded ${diffInDays} days ago`;
    const months = Math.floor(diffInDays / 30);
    return `Founded ${months} month${months > 1 ? "s" : ""} ago`;
  };

  const getMayorRating = () => {
    if (!profileData?.gameData) return "New Mayor";
    const { level, day, coins, completedAchievements } = profileData.gameData;

    const score =
      level * 10 +
      day * 2 +
      coins / 1000 +
      (completedAchievements?.length * 5 || 0);

    if (score >= 500) return "Legendary Mayor";
    if (score >= 300) return "Master Mayor";
    if (score >= 200) return "Expert Mayor";
    if (score >= 100) return "Skilled Mayor";
    if (score >= 50) return "Experienced Mayor";
    return "Aspiring Mayor";
  };

  const getSpecialtyBuildings = () => {
    if (!profileData?.gameData?.grid) return [];

    const buildingCounts: { [key: string]: number } = {};
    profileData.gameData.grid.forEach((building) => {
      if (building && building.type) {
        buildingCounts[building.type] =
          (buildingCounts[building.type] || 0) + 1;
      }
    });

    const sortedBuildings = Object.entries(buildingCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    return sortedBuildings.map(([type, count]) => ({
      type: type.charAt(0).toUpperCase() + type.slice(1),
      count,
    }));
  };

  if (loading) {
    return (
      <ModalWrapper isOpen={true} onClose={onClose} title="My Profile">
        <div className="p-12 text-center">
          <Loader2 className="animate-spin w-12 h-12 text-blue-500 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Loading Your Profile
          </h3>
          <p className="text-gray-600">Gathering your community data...</p>
        </div>
      </ModalWrapper>
    );
  }

  if (error || !profileData) {
    return (
      <ModalWrapper isOpen={true} onClose={onClose} title="My Profile">
        <div className="p-12 text-center">
          <div className="w-20 h-20 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <AlertTriangle size={32} className="text-red-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">
            Unable to Load Profile
          </h3>
          <p className="text-gray-600 mb-6">
            {error || "Profile data is not available"}
          </p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadProfileData}
            className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all shadow-lg font-medium"
          >
            Try Again
          </motion.button>
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
    <ModalWrapper
      isOpen={true}
      onClose={onClose}
      title="My Profile"
      maxWidth="2xl"
    >
      <div className="overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-8 text-white relative">
          <div className="flex items-center gap-6">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="w-24 h-24 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm"
            >
              <User size={36} className="text-white" />
            </motion.div>
            <div>
              <motion.h1
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                className="text-3xl font-bold"
              >
                {gameData?.playerName || profile.username}
              </motion.h1>
              <motion.p
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.1 }}
                className="text-blue-100 text-lg mt-1"
              >
                Mayor of {gameData?.neighborhoodName || "Your City"} • @
                {profile.username}
              </motion.p>
              <motion.div
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="flex items-center gap-6 mt-4 text-blue-100"
              >
                <div className="flex items-center gap-2">
                  <Crown size={18} />
                  <span>Level {gameData?.level || 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={18} />
                  <span>Day {gameData?.day || 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock size={18} />
                  <span>Member since {formatDate(profile.createdAt)}</span>
                </div>
              </motion.div>
            </div>
          </div>

          <div className="mt-8 flex gap-3 overflow-x-auto">
            {renderTabButton("overview", <User size={18} />, "Overview")}
            {renderTabButton("stats", <BarChart3 size={18} />, "Statistics")}
            {renderTabButton(
              "achievements",
              <Trophy size={18} />,
              "Achievements",
              profileData.achievements?.filter((a) => a.completed).length,
            )}
            {renderTabButton("settings", <Settings size={18} />, "Settings")}
          </div>
        </div>

        <div className="p-8 max-h-[60vh] overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {gameData && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-gradient-to-br from-emerald-500 to-emerald-600 p-6 rounded-2xl text-white shadow-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Crown size={28} className="text-emerald-100" />
                        <span className="text-3xl font-bold">
                          {gameData.level}
                        </span>
                      </div>
                      <div className="text-emerald-100 text-sm font-medium">
                        Current Level
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-gradient-to-br from-blue-500 to-blue-600 p-6 rounded-2xl text-white shadow-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Building2 size={28} className="text-blue-100" />
                        <span className="text-3xl font-bold">
                          {totalBuildings}
                        </span>
                      </div>
                      <div className="text-blue-100 text-sm font-medium">
                        Buildings
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-gradient-to-br from-purple-500 to-purple-600 p-6 rounded-2xl text-white shadow-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <Users size={28} className="text-purple-100" />
                        <span className="text-3xl font-bold">
                          {totalResidents}
                        </span>
                      </div>
                      <div className="text-purple-100 text-sm font-medium">
                        Residents
                      </div>
                    </motion.div>

                    <motion.div
                      whileHover={{ scale: 1.02, y: -2 }}
                      className="bg-gradient-to-br from-yellow-500 to-yellow-600 p-6 rounded-2xl text-white shadow-lg"
                    >
                      <div className="flex items-center justify-between mb-3">
                        <DollarSign size={28} className="text-yellow-100" />
                        <span className="text-3xl font-bold">
                          {gameData.coins?.toLocaleString() || 0}
                        </span>
                      </div>
                      <div className="text-yellow-100 text-sm font-medium">
                        Coins
                      </div>
                    </motion.div>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900 flex items-center">
                        <Heart size={20} className="text-red-500 mr-2" />
                        About Me
                      </h3>
                      {isEditing && (
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={handleSaveProfile}
                          className="bg-green-500 text-white px-4 py-2 rounded-xl hover:bg-green-600 transition-colors flex items-center gap-2 shadow-sm"
                        >
                          <Save size={16} />
                          Save Changes
                        </motion.button>
                      )}
                    </div>
                    {isEditing ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Bio
                          </label>
                          <textarea
                            value={editForm.bio}
                            onChange={(e) =>
                              setEditForm((prev) => ({
                                ...prev,
                                bio: e.target.value,
                              }))
                            }
                            placeholder="Tell others about yourself..."
                            className="w-full p-4 border border-gray-300 rounded-xl resize-none h-32 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Location
                            </label>
                            <input
                              type="text"
                              value={editForm.location}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  location: e.target.value,
                                }))
                              }
                              placeholder="Where are you from?"
                              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Website
                            </label>
                            <input
                              type="url"
                              value={editForm.website}
                              onChange={(e) =>
                                setEditForm((prev) => ({
                                  ...prev,
                                  website: e.target.value,
                                }))
                              }
                              placeholder="https://your-website.com"
                              className="w-full p-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div>
                          <h4 className="text-sm font-medium text-gray-700 mb-2">
                            Bio
                          </h4>
                          <p className="text-gray-900 bg-gray-50 p-4 rounded-xl">
                            {profile.extendedProfile?.bio ||
                              "No bio added yet. Click edit to add one!"}
                          </p>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Location
                            </h4>
                            <p className="text-gray-900 bg-gray-50 p-3 rounded-xl">
                              {profile.extendedProfile?.location ||
                                "Not specified"}
                            </p>
                          </div>
                          <div>
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Website
                            </h4>
                            <div className="bg-gray-50 p-3 rounded-xl">
                              {profile.extendedProfile?.website ? (
                                <a
                                  href={profile.extendedProfile.website}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-600 hover:underline font-medium"
                                >
                                  {profile.extendedProfile.website.replace(
                                    /^https?:\/\//,
                                    "",
                                  )}
                                </a>
                              ) : (
                                <span className="text-gray-500">
                                  Not specified
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="mt-6 pt-6 border-t border-gray-200">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setIsEditing(!isEditing)}
                        className="w-full bg-gradient-to-r from-blue-500 to-purple-500 text-white py-3 rounded-xl hover:from-blue-600 hover:to-purple-600 transition-all shadow-sm font-medium flex items-center justify-center gap-2"
                      >
                        <Edit3 size={18} />
                        {isEditing ? "Cancel Editing" : "Edit Profile"}
                      </motion.button>
                    </div>
                  </div>

                  <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                      <Activity size={20} className="text-green-500 mr-2" />
                      Recent Activity
                    </h3>
                    {profileData.recentActivity &&
                    profileData.recentActivity.length > 0 ? (
                      <div className="space-y-4">
                        {profileData.recentActivity
                          .slice(0, 4)
                          .map((activity) => (
                            <motion.div
                              key={activity.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl"
                            >
                              <div className="text-2xl">{activity.icon}</div>
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">
                                  {activity.description}
                                </p>
                                <p className="text-sm text-gray-500">
                                  {formatTime(activity.timestamp)}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Clock
                          size={48}
                          className="mx-auto text-gray-300 mb-4"
                        />
                        <p className="text-gray-600 font-medium">
                          No recent activity
                        </p>
                        <p className="text-sm text-gray-500 mt-1">
                          Start playing to see your activity here!
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "stats" && (
              <motion.div
                key="stats"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-8"
              >
                {gameData && (
                  <>
                    <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <BarChart3 size={20} className="text-blue-500 mr-2" />
                        City Statistics
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
                          <div className="flex items-center gap-3 mb-3">
                            <DollarSign size={24} className="text-green-600" />
                            <span className="font-semibold text-gray-900">
                              Financial Health
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Current Balance:
                              </span>
                              <span className="font-bold text-green-600">
                                ${gameData.coins?.toLocaleString() || 0}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Daily Income:
                              </span>
                              <span className="font-medium text-gray-900">
                                $0
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
                          <div className="flex items-center gap-3 mb-3">
                            <Building2 size={24} className="text-blue-600" />
                            <span className="font-semibold text-gray-900">
                              Infrastructure
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Total Buildings:
                              </span>
                              <span className="font-bold text-blue-600">
                                {totalBuildings}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Population:</span>
                              <span className="font-medium text-gray-900">
                                {totalResidents}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
                          <div className="flex items-center gap-3 mb-3">
                            <Heart size={24} className="text-purple-600" />
                            <span className="font-semibold text-gray-900">
                              Community
                            </span>
                          </div>
                          <div className="space-y-2">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Happiness:</span>
                              <span className="font-bold text-purple-600">
                                85%
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">
                                Mayor Rating:
                              </span>
                              <span className="font-medium text-gray-900">
                                {mayorRating}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div>
                          <div className="flex justify-between text-sm font-medium text-gray-700 mb-3">
                            <span>
                              Experience Progress (Level {gameData.level})
                            </span>
                            <span>{gameData.experience || 0} XP</span>
                          </div>
                          <div className="bg-gray-200 h-4 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{
                                width: `${(gameData.experience || 0) % 100}%`,
                              }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              className="h-full bg-gradient-to-r from-blue-400 to-purple-400 rounded-full"
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-sm font-medium text-gray-700 mb-3">
                            <span>Community Happiness</span>
                            <span>85%</span>
                          </div>
                          <div className="bg-gray-200 h-4 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `85%` }}
                              transition={{ duration: 1.5, ease: "easeOut" }}
                              className="h-full bg-gradient-to-r from-pink-400 to-red-400 rounded-full"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {specialtyBuildings.length > 0 && (
                      <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                        <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                          <Building2
                            size={20}
                            className="text-orange-500 mr-2"
                          />
                          Building Portfolio
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                          {specialtyBuildings.map((building, index) => (
                            <motion.div
                              key={index}
                              whileHover={{ scale: 1.05 }}
                              className="bg-gray-50 p-4 rounded-xl text-center border border-gray-200"
                            >
                              <div className="text-2xl mb-2">🏢</div>
                              <div className="font-bold text-gray-900">
                                {building.count}
                              </div>
                              <div className="text-sm text-gray-600">
                                {building.type}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </motion.div>
            )}

            {activeTab === "achievements" && (
              <motion.div
                key="achievements"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="text-xl font-bold text-gray-900 flex items-center">
                      <Trophy size={20} className="text-yellow-500 mr-2" />
                      Achievements
                    </h3>
                    <div className="bg-yellow-100 text-yellow-800 px-4 py-2 rounded-full text-sm font-medium">
                      {profileData.achievements?.filter((a) => a.completed)
                        .length || 0}{" "}
                      / {profileData.achievements?.length || 0} Unlocked
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {profileData.achievements?.map((achievement) => (
                      <motion.div
                        key={achievement.id}
                        whileHover={{ scale: 1.02 }}
                        className={`p-6 rounded-xl border-2 transition-all ${
                          achievement.completed
                            ? "bg-gradient-to-br from-yellow-50 to-amber-50 border-yellow-300 shadow-sm"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-start gap-4">
                          <div
                            className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${
                              achievement.completed
                                ? "bg-yellow-500/20"
                                : "bg-gray-400/20"
                            }`}
                          >
                            {achievement.completed ? (
                              <CheckCircle
                                size={24}
                                className="text-yellow-600"
                              />
                            ) : (
                              <XCircle size={24} className="text-gray-400" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4
                              className={`font-bold text-lg mb-1 ${
                                achievement.completed
                                  ? "text-yellow-900"
                                  : "text-gray-600"
                              }`}
                            >
                              {achievement.title}
                            </h4>
                            <p
                              className={`text-sm mb-3 ${
                                achievement.completed
                                  ? "text-yellow-700"
                                  : "text-gray-500"
                              }`}
                            >
                              {achievement.description}
                            </p>
                            <div className="flex items-center gap-2">
                              <span
                                className={`text-xs px-3 py-1 rounded-full font-medium ${
                                  achievement.completed
                                    ? "bg-yellow-200 text-yellow-800"
                                    : "bg-gray-200 text-gray-600"
                                }`}
                              >
                                {achievement.xpReward} XP
                              </span>
                              {achievement.completed && (
                                <span className="text-xs bg-green-200 text-green-800 px-3 py-1 rounded-full font-medium">
                                  ✓ Completed
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                  <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                    <Settings size={20} className="text-gray-500 mr-2" />
                    Account & Privacy Settings
                  </h3>

                  <div className="space-y-8">
                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Account Information
                      </h4>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <Mail size={20} className="text-gray-600" />
                            <div>
                              <p className="font-medium text-gray-900">
                                Email Address
                              </p>
                              <p className="text-sm text-gray-600">
                                {profile.email}
                              </p>
                            </div>
                          </div>
                          <span className="bg-green-100 text-green-800 text-sm px-3 py-1 rounded-full font-medium">
                            Verified
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                          <div className="flex items-center gap-3">
                            <User size={20} className="text-gray-600" />
                            <div>
                              <p className="font-medium text-gray-900">
                                Username
                              </p>
                              <p className="text-sm text-gray-600">
                                @{profile.username}
                              </p>
                            </div>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="text-blue-600 text-sm font-medium hover:underline"
                          >
                            Change
                          </motion.button>
                        </div>
                      </div>
                    </div>

                    <div>
                      <h4 className="text-lg font-semibold text-gray-900 mb-4">
                        Privacy Settings
                      </h4>
                      <div className="space-y-4">
                        {[
                          {
                            id: "visibility",
                            label: "Profile Visibility",
                            description: "Control who can see your profile",
                            type: "select",
                            options: ["Public", "Private"],
                          },
                          {
                            id: "showBio",
                            label: "Show Bio",
                            description: "Display your bio on public profile",
                            type: "toggle",
                          },
                          {
                            id: "showStats",
                            label: "Show Game Statistics",
                            description: "Display game statistics publicly",
                            type: "toggle",
                          },
                          {
                            id: "showActivity",
                            label: "Show Recent Activity",
                            description: "Display recent game activity",
                            type: "toggle",
                          },
                        ].map((setting) => (
                          <div
                            key={setting.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
                          >
                            <div className="flex items-center gap-3">
                              {setting.id === "visibility" && (
                                <Eye size={20} className="text-gray-600" />
                              )}
                              {setting.id === "showBio" && (
                                <Heart size={20} className="text-gray-600" />
                              )}
                              {setting.id === "showStats" && (
                                <BarChart3
                                  size={20}
                                  className="text-gray-600"
                                />
                              )}
                              {setting.id === "showActivity" && (
                                <Activity size={20} className="text-gray-600" />
                              )}
                              <div>
                                <p className="font-medium text-gray-900">
                                  {setting.label}
                                </p>
                                <p className="text-sm text-gray-600">
                                  {setting.description}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center">
                              {setting.type === "select" ? (
                                <select className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                                  {setting.options?.map((option) => (
                                    <option
                                      key={option}
                                      value={option.toLowerCase()}
                                    >
                                      {option}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <motion.button
                                  whileTap={{ scale: 0.95 }}
                                  className="relative inline-flex h-6 w-11 items-center rounded-full bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                                >
                                  <span className="inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition-transform translate-x-6" />
                                </motion.button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </ModalWrapper>
  );
}
