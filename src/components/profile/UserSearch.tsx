import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  X,
  User,
  Users,
  Filter,
  MapPin,
  Building2,
  Star,
  Clock,
  Crown,
  Activity,
  Eye,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Sparkles,
  AlertCircle,
  TrendingUp,
  Award,
  Globe,
  Zap
} from "lucide-react";
import { NORMALIZED_API_URL } from "../../config/apiConfig";
import PublicProfileModal from "./PublicProfileModal";

interface UserSearchProps {
  onClose: () => void;
  onViewProfile: (username: string) => void;
}

interface UserSearchResult {
  id: string;
  username: string;
  displayName?: string;
  avatar?: string;
  location?: string;
  level: number;
  buildings: number;
  neighbors: number;
  rating: number;
  lastActive: string;
  isOnline: boolean;
  interests: string[];
  gamePreferences?: {
    favoriteBuilding?: string;
    playStyle?: string;
  };
}

interface SearchResponse {
  success: boolean;
  results: UserSearchResult[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

const FILTER_OPTIONS = [
  { value: "all", label: "All Players", icon: Users },
  { value: "online", label: "Online Now", icon: Activity },
  { value: "recent", label: "Recently Active", icon: Clock },
  { value: "new", label: "New Players", icon: UserPlus },
  { value: "experienced", label: "Experienced Players", icon: Crown },
  { value: "top_builders", label: "Top Builders", icon: Building2 },
];

const SORT_OPTIONS = [
  { value: "relevance", label: "Relevance" },
  { value: "level", label: "Level" },
  { value: "buildings", label: "Buildings" },
  { value: "rating", label: "Rating" },
  { value: "activity", label: "Last Active" },
  { value: "name", label: "Name" },
];

export default function UserSearch({ onClose, onViewProfile }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedSort, setSelectedSort] = useState("relevance");
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0,
  });
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  const searchUsers = async (
    query: string = "",
    filter: string = "all",
    sort: string = "relevance",
    page: number = 1,
  ) => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        q: query,
        filter,
        sort,
        limit: "20",
        page: page.toString(),
      });

      const response = await fetch(
        `${NORMALIZED_API_URL}/api/user/search?${params}`,
        {
          method: "GET",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
        },
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data: SearchResponse = await response.json();

      if (data.success) {
        setResults(data.results);
        setPagination(data.pagination);
      } else {
        throw new Error("Search request failed");
      }
    } catch (err) {
      console.error("Error searching users:", err);
      setError(err instanceof Error ? err.message : "Failed to search users");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(
      () => {
        searchUsers(searchQuery, selectedFilter, selectedSort, 1);
      },
      searchQuery ? 300 : 0,
    );

    return () => clearTimeout(timer);
  }, [searchQuery, selectedFilter, selectedSort]);

  useEffect(() => {
    searchUsers("", "all", "relevance", 1);
  }, []);

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

  const handleFilterChange = (filter: string) => {
    setSelectedFilter(filter);
    setShowFilters(false);
  };

  const handleSortChange = (sort: string) => {
    setSelectedSort(sort);
  };

  const handleViewProfile = (username: string) => {
    setSelectedProfile(username);
    onViewProfile(username);
  };

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} day${days > 1 ? "s" : ""} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
    return "Just now";
  };

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
            className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-600 p-6 text-white">
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-lg flex items-center justify-center transition-colors z-10"
              >
                <X size={20} />
              </button>

              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center">
                  <Users size={32} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold mb-1">Discover Players</h2>
                  <p className="text-white/80">Find and connect with other city builders</p>
                </div>
              </div>

              <div className="relative">
                <Search size={20} className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by username or player name..."
                  className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/90 backdrop-blur-sm border border-white/20 text-gray-900 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-white/30 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-b border-gray-200">
              <div className="flex flex-wrap gap-3 items-center">
                <div className="relative">
                  <button
                    onClick={() => setShowFilters(!showFilters)}
                    className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-lg transition-colors text-gray-700 font-medium"
                  >
                    <Filter size={16} />
                    <span>{FILTER_OPTIONS.find((f) => f.value === selectedFilter)?.label}</span>
                  </button>

                  {showFilters && (
                    <div className="absolute top-full left-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl z-20 min-w-[200px] overflow-hidden">
                      {FILTER_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        return (
                          <button
                            key={option.value}
                            onClick={() => handleFilterChange(option.value)}
                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors flex items-center gap-3 ${
                              selectedFilter === option.value
                                ? "bg-blue-50 text-blue-700"
                                : "text-gray-700"
                            }`}
                          >
                            <Icon size={16} />
                            <span>{option.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <select
                  value={selectedSort}
                  onChange={(e) => handleSortChange(e.target.value)}
                  className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-700"
                >
                  {SORT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      Sort by {option.label}
                    </option>
                  ))}
                </select>

                <div className="ml-auto flex items-center gap-2 text-gray-600 bg-white px-3 py-2 rounded-lg border border-gray-200">
                  <Sparkles size={16} className="text-blue-500" />
                  <span className="font-medium">
                    {pagination.total} player{pagination.total !== 1 ? "s" : ""} found
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto max-h-[50vh] p-6">
              {error ? (
                <div className="text-center py-16">
                  <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Failed to load players</h3>
                  <p className="text-gray-600 mb-6">{error}</p>
                  <button
                    onClick={() => searchUsers(searchQuery, selectedFilter, selectedSort, 1)}
                    className="px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-medium"
                  >
                    Try Again
                  </button>
                </div>
              ) : loading ? (
                <div className="flex flex-col justify-center items-center py-16">
                  <Loader2 className="w-12 h-12 text-blue-500 animate-spin mb-4" />
                  <p className="text-gray-600 font-medium">Searching players...</p>
                </div>
              ) : results.length === 0 ? (
                <div className="text-center py-16">
                  <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-gray-900 mb-2">No players found</h3>
                  <p className="text-gray-600">Try adjusting your search criteria or filters.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {results.map((user) => (
                    <motion.div
                      key={user.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      whileHover={{ scale: 1.02 }}
                      className="bg-white border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer"
                      onClick={() => handleViewProfile(user.username)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                            {user.avatar ? (
                              <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-xl object-cover" />
                            ) : (
                              <User size={24} />
                            )}
                          </div>
                          {user.isOnline && (
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white" />
                          )}
                          {user.level >= 15 && (
                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-yellow-400 rounded-full border-2 border-white flex items-center justify-center">
                              <Crown size={10} className="text-yellow-800" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h3 className="font-bold text-gray-900 truncate">
                                {user.displayName || user.username}
                              </h3>
                              <p className="text-sm text-gray-500">@{user.username}</p>
                            </div>
                            <div className="w-6 h-6 bg-blue-100 rounded-lg flex items-center justify-center">
                              <Eye size={14} className="text-blue-600" />
                            </div>
                          </div>

                          {user.location && (
                            <div className="flex items-center text-gray-500 text-sm mb-3">
                              <MapPin size={12} className="mr-1 text-blue-500" />
                              <span>{user.location}</span>
                            </div>
                          )}

                          <div className="grid grid-cols-3 gap-2 mb-3">
                            <div className="text-center p-2 bg-blue-50 rounded-lg">
                              <div className="text-sm font-bold text-blue-700">{user.level}</div>
                              <div className="text-xs text-blue-600">Level</div>
                            </div>
                            <div className="text-center p-2 bg-green-50 rounded-lg">
                              <div className="text-sm font-bold text-green-700">{user.buildings}</div>
                              <div className="text-xs text-green-600">Buildings</div>
                            </div>
                            <div className="text-center p-2 bg-purple-50 rounded-lg">
                              <div className="text-sm font-bold text-purple-700">{user.rating.toFixed(1)}</div>
                              <div className="text-xs text-purple-600">Rating</div>
                            </div>
                          </div>

                          <div className="flex items-center justify-between text-xs">
                            <span className="text-gray-500">Last active: {formatTimeAgo(user.lastActive)}</span>
                            {user.isOnline && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                Online
                              </span>
                            )}
                          </div>

                          {user.interests.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {user.interests.slice(0, 2).map((interest, idx) => (
                                <span
                                  key={idx}
                                  className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-lg"
                                >
                                  {interest}
                                </span>
                              ))}
                              {user.interests.length > 2 && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-lg">
                                  +{user.interests.length - 2} more
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
              
            {pagination.pages > 1 && (
              <div className="p-4 bg-gray-50 border-t border-gray-200">
                <div className="flex justify-center items-center gap-4">
                  <button
                    onClick={() => searchUsers(searchQuery, selectedFilter, selectedSort, pagination.page - 1)}
                    disabled={pagination.page <= 1 || loading}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700 font-medium transition-colors flex items-center gap-2"
                  >
                    <ChevronLeft size={16} />
                    Previous
                  </button>

                  <div className="px-4 py-2 bg-blue-500 text-white rounded-lg font-medium">
                    Page {pagination.page} of {pagination.pages}
                  </div>

                  <button
                    onClick={() => searchUsers(searchQuery, selectedFilter, selectedSort, pagination.page + 1)}
                    disabled={pagination.page >= pagination.pages || loading}
                    className="px-4 py-2 bg-white border border-gray-200 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 text-gray-700 font-medium transition-colors flex items-center gap-2"
                  >
                    Next
                    <ChevronRight size={16} />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      </div>

      {selectedProfile && (
        <PublicProfileModal
          onClose={() => setSelectedProfile(null)}
          username={selectedProfile}
        />
      )}
    </>
  );
}
