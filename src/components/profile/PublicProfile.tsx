import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Calendar,
  Home,
  Star,
  Clock,
  Lock,
  AlertCircle,
  Loader2,
  Building,
  Users,
  DollarSign,
  Flag,
  Trophy,
  TrendingUp,
  MapPin,
  Globe,
  Heart,
  Zap,
  Award,
  Target,
  Activity,
  Gift,
  Crown,
  TreePine,
  Factory,
  Coins,
  BarChart3,
  X,
  Sparkles,
  Edit3,
  Settings,
  ExternalLink,
  Mail,
  Phone,
  Camera,
  UserCheck,
  Shield,
  MessageCircle,
  Share2,
  UserPlus,
  MessageSquare,
} from "lucide-react";
import { getPublicProfile } from "../../services/userService";
import type { PublicProfileData } from "../../services/userService";
import { useAuth } from "../../context/AuthContext";
import ReportModal from "./ReportModal";
import ProfileSettings from "./ProfileSettings";
import GlassCard from "../ui/GlassCard";

interface PublicProfileProps {
  username: string;
  onClose: () => void;
}

export default function PublicProfile({ username, onClose }: PublicProfileProps) {
  const { user: currentUser, isAuthenticated } = useAuth();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPrivate, setIsPrivate] = useState(false);
  
  const [showReportModal, setShowReportModal] = useState(false);
  const [showProfileSettings, setShowProfileSettings] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "stats" | "achievements">("overview");
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  const isOwnProfile = isAuthenticated && currentUser && currentUser.username === username;

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      setIsPrivate(false);

      try {
        const result = await getPublicProfile(username);
        
        if (result.success && result.profile) {
          setProfile(result.profile);
        } else if (result.isPrivate) {
          setIsPrivate(true);
        } else {
          setError(result.message || "Failed to fetch profile");
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load profile");
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username]);

  const handleClose = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  const handleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated || !currentUser) {
      alert('Please log in to follow users');
      return;
    }

    setFollowLoading(true);
    try {
      setIsFollowing(!isFollowing);
      console.log(`${isFollowing ? 'Unfollowed' : 'Followed'} ${username}`);
    } catch (error) {
      console.error('Error following user:', error);
      alert('Failed to follow user');
    } finally {
      setFollowLoading(false);
    }
  };

  const handleReport = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated || !currentUser) {
      alert('Please log in to report users');
      return;
    }
    setShowReportModal(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTimeSince = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    if (diffDays > 0) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    } else if (diffHours > 0) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else {
      return "Just now";
    }
  };

  if (loading) {
    return (
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-2xl p-12 shadow-2xl max-w-md mx-4">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
            <p className="text-gray-700 font-medium">Loading profile...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-4">
          <div className="text-center">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Error Loading Profile</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (isPrivate) {
    return (
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-4">
          <div className="text-center">
            <Lock className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Private Profile</h3>
            <p className="text-gray-600 mb-6">This user has set their profile to private.</p>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div 
        className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-2xl p-8 shadow-2xl max-w-md mx-4">
          <div className="text-center">
            <User className="w-16 h-16 text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">Profile Not Found</h3>
            <p className="text-gray-600 mb-6">This user doesn't exist or their profile is unavailable.</p>
            <button
              onClick={handleClose}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div 
        className="fixed inset-0 z-[9999] bg-black/50 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div className="min-h-screen flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
             <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 p-6 text-white overflow-hidden">
               <div className="absolute inset-0 opacity-10" style={{
                 backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
               }} />

               <button
                 onClick={handleClose}
                 className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-lg flex items-center justify-center transition-all duration-200 group border border-white/10"
               >
                 <X size={20} className="group-hover:scale-110 transition-transform" />
               </button>

               <div className="relative flex items-start gap-6 pr-16">
                 <div className="relative group">
                   <div className="w-24 h-24 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border-2 border-white/30 shadow-xl">
                     <User size={40} className="text-white" />
                   </div>
                   {profile.gameData && profile.gameData.level >= 10 && (
                     <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center border-2 border-white shadow-lg">
                       <Crown size={14} className="text-white" />
                     </div>
                   )}
                 </div>

                 <div className="flex-1">
                   <div className="flex items-center gap-3 mb-2">
                     <h1 className="text-3xl font-bold">
                       {profile.gameData?.playerName || profile.username}
                     </h1>
                     {profile.gameData && (
                       <div className="px-3 py-1 bg-white/20 backdrop-blur-sm rounded-full text-xs font-semibold border border-white/30">
                         Level {profile.gameData.level}
                       </div>
                     )}
                   </div>
                   <p className="text-white/80 text-lg mb-4">@{profile.username}</p>
                   
                   {profile.gameData && (
                     <div className="inline-flex items-center px-4 py-2 bg-white/15 backdrop-blur-sm text-white rounded-xl text-sm font-medium border border-white/20 mb-4">
                       <Building size={16} className="mr-2" />
                       Mayor of {profile.gameData.neighborhoodName || "Unnamed City"}
                     </div>
                   )}
                   
                   <div className="flex flex-wrap items-center gap-4 text-sm text-white/70">
                     <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg">
                       <Calendar size={14} />
                       <span>Joined {formatDate(profile.createdAt)}</span>
                     </div>
                     {profile.showActivity && (
                       <div className="flex items-center gap-2 bg-white/10 px-3 py-1 rounded-lg">
                         <Clock size={14} />
                         <span>Active {formatTimeSince(profile.lastActive)}</span>
                       </div>
                     )}
                   </div>
                 </div>

                 <div className="flex flex-col gap-2">
                   {isOwnProfile ? (
                     <button
                       onClick={() => setShowProfileSettings(true)}
                       className="px-6 py-3 bg-white text-gray-900 rounded-xl hover:bg-gray-100 transition-colors font-medium flex items-center gap-2 shadow-lg"
                     >
                       <Edit3 size={16} />
                       Edit Profile
                     </button>
                   ) : (
                     <>
                       <button 
                         onClick={handleFollow}
                         disabled={followLoading}
                         className={`px-6 py-3 rounded-xl font-medium transition-all flex items-center gap-2 shadow-lg ${
                           isFollowing 
                             ? 'bg-gray-600 text-white hover:bg-gray-700' 
                             : 'bg-white text-gray-900 hover:bg-gray-100'
                         } ${followLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
                       >
                         {isFollowing ? <UserCheck size={16} /> : <UserPlus size={16} />}
                         {followLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
                       </button>
                       <button
                         onClick={handleReport}
                         className="w-12 h-12 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center transition-all border border-white/20"
                         title="Report User"
                       >
                         <Flag size={16} />
                       </button>
                     </>
                   )}
                 </div>
               </div>
             </div>

             <div className="p-6 max-h-[60vh] overflow-y-auto bg-gradient-to-br from-gray-50 to-white">
               <div className="flex gap-2 mb-6 bg-white p-2 rounded-xl shadow-sm border border-gray-200 w-fit">
                 {[
                   { id: "overview", label: "Overview", icon: User },
                   { id: "stats", label: "Stats", icon: BarChart3 },
                   { id: "achievements", label: "Achievements", icon: Trophy },
                 ].map((tab) => {
                   const Icon = tab.icon;
                   return (
                     <button
                       key={tab.id}
                       onClick={() => setActiveTab(tab.id as any)}
                       className={`flex items-center gap-2 px-5 py-3 rounded-lg font-medium transition-all ${
                         activeTab === tab.id
                           ? "bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg"
                           : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
                       }`}
                     >
                       <Icon size={16} />
                       {tab.label}
                     </button>
                   );
                 })}
               </div>

              <div className="space-y-6">
                {activeTab === "overview" && (
                  <div className="space-y-6">
                     {profile.showBio && (
                       <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
                         <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                           <div className="w-8 h-8 bg-gradient-to-r from-red-400 to-pink-500 rounded-lg flex items-center justify-center mr-3">
                             <Heart size={16} className="text-white" />
                           </div>
                           About {profile.gameData?.playerName || profile.username}
                         </h3>

                         {profile.extendedProfile?.bio && profile.extendedProfile.bio.trim() ? (
                           <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-6 shadow-inner">
                             <p className="text-gray-800 leading-relaxed whitespace-pre-wrap text-lg">
                               {profile.extendedProfile.bio}
                             </p>
                           </div>
                         ) : (
                           <div className="bg-gradient-to-br from-gray-50 to-white border border-gray-200 rounded-xl p-8 text-center shadow-inner">
                             <div className="w-16 h-16 bg-gradient-to-br from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-4">
                               <Sparkles size={24} className="text-gray-500" />
                             </div>
                             <p className="text-gray-600 text-lg mb-4">
                               {isOwnProfile ? "You haven't written a bio yet." : `${profile.username} hasn't written a bio yet.`}
                             </p>
                             {isOwnProfile && (
                               <button
                                 onClick={() => setShowProfileSettings(true)}
                                 className="px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all font-medium shadow-lg"
                               >
                                 Add Bio
                               </button>
                             )}
                           </div>
                         )}
                       </div>
                     )}

                    {(profile.extendedProfile?.location || profile.extendedProfile?.website) && (
                      <div className="bg-gray-50 rounded-xl p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                          <MapPin size={20} className="text-green-500 mr-2" />
                          Details
                        </h3>
                        <div className="space-y-3">
                          {profile.extendedProfile?.location && (
                            <div className="flex items-center text-gray-700">
                              <MapPin size={16} className="mr-3 text-blue-500" />
                              <span>{profile.extendedProfile.location}</span>
                            </div>
                          )}
                          {profile.extendedProfile?.website && (
                            <div className="flex items-center text-gray-700">
                              <Globe size={16} className="mr-3 text-green-500" />
                              <a
                                href={profile.extendedProfile.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 flex items-center gap-1"
                              >
                                {profile.extendedProfile.website}
                                <ExternalLink size={12} />
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                     {profile.gameData && (
                       <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200/50">
                         <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                           <div className="w-8 h-8 bg-gradient-to-r from-purple-400 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                             <BarChart3 size={16} className="text-white" />
                           </div>
                           Quick Stats
                         </h3>
                         <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                           <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 p-6 rounded-xl text-center shadow-sm hover:shadow-md transition-all">
                             <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                               <Crown size={18} className="text-white" />
                             </div>
                             <div className="text-2xl font-bold text-blue-700">{profile.gameData.level}</div>
                             <div className="text-sm text-blue-600 font-medium">Level</div>
                           </div>
                           <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 p-6 rounded-xl text-center shadow-sm hover:shadow-md transition-all">
                             <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                               <Calendar size={18} className="text-white" />
                             </div>
                             <div className="text-2xl font-bold text-green-700">{profile.gameData.day}</div>
                             <div className="text-sm text-green-600 font-medium">Days</div>
                           </div>
                           <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 p-6 rounded-xl text-center shadow-sm hover:shadow-md transition-all">
                             <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                               <Building size={18} className="text-white" />
                             </div>
                             <div className="text-2xl font-bold text-purple-700">{profile.gameData.stats.buildingCount}</div>
                             <div className="text-sm text-purple-600 font-medium">Buildings</div>
                           </div>
                           <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 p-6 rounded-xl text-center shadow-sm hover:shadow-md transition-all">
                             <div className="w-10 h-10 bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-3">
                               <Users size={18} className="text-white" />
                             </div>
                             <div className="text-2xl font-bold text-orange-700">{profile.gameData.stats.neighborCount}</div>
                             <div className="text-sm text-orange-600 font-medium">Population</div>
                           </div>
                         </div>
                       </div>
                     )}
                  </div>
                )}

                {activeTab === "stats" && profile.gameData && profile.showStats && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <BarChart3 size={24} className="text-blue-500 mr-3" />
                        City Statistics
                      </h3>

                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                        <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg text-center">
                          <Crown className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-blue-700">{profile.gameData.level}</div>
                          <div className="text-sm text-blue-600">Mayor Level</div>
                        </div>

                        <div className="bg-green-50 border border-green-200 p-4 rounded-lg text-center">
                          <Calendar className="w-8 h-8 text-green-500 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-green-700">{profile.gameData.day}</div>
                          <div className="text-sm text-green-600">Days Active</div>
                        </div>

                        <div className="bg-purple-50 border border-purple-200 p-4 rounded-lg text-center">
                          <Building className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-purple-700">{profile.gameData.stats.buildingCount}</div>
                          <div className="text-sm text-purple-600">Buildings</div>
                        </div>

                        <div className="bg-orange-50 border border-orange-200 p-4 rounded-lg text-center">
                          <Users className="w-8 h-8 text-orange-500 mx-auto mb-2" />
                          <div className="text-2xl font-bold text-orange-700">{profile.gameData.stats.neighborCount}</div>
                          <div className="text-sm text-orange-600">Population</div>
                        </div>
                      </div>
                  
                      <div className="bg-white border rounded-lg p-6">
                        <h4 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                          <DollarSign size={20} className="text-green-500 mr-2" />
                          Economic Overview
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-green-600">${profile.gameData.stats.totalIncome}</div>
                            <div className="text-sm text-gray-600">Daily Income</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-blue-600">{profile.gameData.stats.buildingCount}</div>
                            <div className="text-sm text-gray-600">Total Buildings</div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-purple-600">{profile.gameData.stats.neighborCount}</div>
                            <div className="text-sm text-gray-600">Population</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "achievements" && (
                  <div className="space-y-6">
                    <div className="bg-gray-50 rounded-xl p-6">
                      <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center">
                        <Trophy size={24} className="text-yellow-500 mr-3" />
                        Achievements
                      </h3>

                      <div className="bg-white border rounded-lg p-8 text-center">
                        <Award className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600 text-lg">
                          Achievement system coming soon! 🏆
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>

       {showReportModal && profile && (
         <div className="fixed inset-0 z-[10000]">
           <ReportModal
             reportedUser={{
               id: username,
               username: username,
               displayName: profile.gameData?.playerName || username,
             }}
             reportableContent={{
               bio: profile.extendedProfile?.bio,
               location: profile.extendedProfile?.location,
               website: profile.extendedProfile?.website,
               interests: profile.extendedProfile?.interests,
               gamePreferences: profile.extendedProfile?.gamePreferences,
             }}
             onClose={() => setShowReportModal(false)}
             onSubmit={(reportData) => {
               console.log("Report submitted:", reportData);
               setShowReportModal(false);
             }}
           />
         </div>
       )}

             {showProfileSettings && (
         <div className="fixed inset-0 z-[10000]">
           <ProfileSettings
             onClose={() => setShowProfileSettings(false)}
             onUpdate={() => {
               setProfile(null);
               setLoading(true);
             }}
           />
         </div>
       )}
    </>
  );
}
