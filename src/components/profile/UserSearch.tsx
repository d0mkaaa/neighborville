import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, X, User, Users, Filter, SortAsc, MapPin, 
  Building2, Star, Award, Clock, TrendingUp, Zap
} from 'lucide-react';
import { NORMALIZED_API_URL } from '../../config/apiConfig';
import PublicProfileModal from './PublicProfileModal';

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
  { value: 'all', label: 'All Players' },
  { value: 'online', label: 'Online Now' },
  { value: 'recent', label: 'Recently Active' },
  { value: 'new', label: 'New Players' },
  { value: 'experienced', label: 'Experienced' }
];

const SORT_OPTIONS = [
  { value: 'relevance', label: 'Relevance' },
  { value: 'level', label: 'Level' },
  { value: 'buildings', label: 'Buildings' },
  { value: 'rating', label: 'Rating' },
  { value: 'activity', label: 'Last Active' },
  { value: 'name', label: 'Name' }
];

export default function UserSearch({ onClose, onViewProfile }: UserSearchProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [selectedSort, setSelectedSort] = useState('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);

  const searchUsers = async (query: string = '', filter: string = 'all', sort: string = 'relevance', page: number = 1) => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams({
        q: query,
        filter,
        sort,
        limit: '20',
        page: page.toString()
      });
      
      const response = await fetch(`${NORMALIZED_API_URL}/api/user/search?${params}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }
      
      const data: SearchResponse = await response.json();
      
      if (data.success) {
        setResults(data.results);
        setPagination(data.pagination);
      } else {
        throw new Error('Search request failed');
      }
    } catch (err) {
      console.error('Error searching users:', err);
      setError(err instanceof Error ? err.message : 'Failed to search users');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      searchUsers(searchQuery, selectedFilter, selectedSort, 1);
    }, searchQuery ? 300 : 0);
    
    return () => clearTimeout(timer);
  }, [searchQuery, selectedFilter, selectedSort]);

  useEffect(() => {
    searchUsers('', 'all', 'relevance', 1);
  }, []);

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
    
    if (days > 0) return `${days} day${days > 1 ? 's' : ''} ago`;
    if (hours > 0) return `${hours} hour${hours > 1 ? 's' : ''} ago`;
    if (minutes > 0) return `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    return 'Just now';
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
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
        >
          <div className="p-6 bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h2 className="text-2xl font-bold">Discover Players</h2>
                <p className="text-purple-100">Find and connect with other city builders</p>
              </div>
              <button 
                onClick={onClose}
                className="text-white/80 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="relative">
              <Search size={20} className="absolute left-3 top-3.5 text-white/60" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by username or player name..."
                className="w-full pl-10 pr-4 py-3 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>
          </div>

          <div className="p-4 bg-gray-50 border-b border-gray-200">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative">
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <Filter size={16} />
                  <span>{FILTER_OPTIONS.find(f => f.value === selectedFilter)?.label}</span>
                </button>
                
                {showFilters && (
                  <div className="absolute top-full left-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10 min-w-[150px]">
                    {FILTER_OPTIONS.map(option => (
                      <button
                        key={option.value}
                        onClick={() => handleFilterChange(option.value)}
                        className={`w-full text-left px-4 py-2 hover:bg-gray-50 transition-colors ${
                          selectedFilter === option.value ? 'bg-purple-50 text-purple-700' : ''
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <select
                value={selectedSort}
                onChange={(e) => handleSortChange(e.target.value)}
                className="px-4 py-2 bg-white border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
              >
                {SORT_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>
                    Sort by {option.label}
                  </option>
                ))}
              </select>

              <div className="ml-auto text-sm text-gray-600">
                {pagination.total} player{pagination.total !== 1 ? 's' : ''} found
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[50vh] p-4">
            {error ? (
              <div className="text-center py-12">
                <div className="text-red-500 mb-4">⚠️</div>
                <p className="text-red-600 mb-2">Failed to load players</p>
                <p className="text-gray-500 text-sm">{error}</p>
                <button 
                  onClick={() => searchUsers(searchQuery, selectedFilter, selectedSort, 1)}
                  className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Try Again
                </button>
              </div>
            ) : loading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500"></div>
              </div>
            ) : results.length === 0 ? (
              <div className="text-center py-12">
                <Users size={48} className="text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No players found matching your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {results.map(user => (
                  <motion.div
                    key={user.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer"
                    onClick={() => handleViewProfile(user.username)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="relative">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 flex items-center justify-center">
                          {user.avatar ? (
                            <img src={user.avatar} alt="Avatar" className="w-full h-full rounded-xl object-cover" />
                          ) : (
                            <User size={20} className="text-purple-600" />
                          )}
                        </div>
                        {user.isOnline && (
                          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-gray-900 truncate">
                            {user.displayName || user.username}
                          </h3>
                          {user.level >= 15 && (
                            <Award size={14} className="text-yellow-500" />
                          )}
                        </div>
                        <p className="text-sm text-gray-500 mb-2">@{user.username}</p>

                        {user.location && (
                          <div className="flex items-center text-gray-500 text-sm mb-2">
                            <MapPin size={12} className="mr-1" />
                            <span>{user.location}</span>
                          </div>
                        )}

                        <div className="grid grid-cols-3 gap-2 mb-3">
                          <div className="text-center">
                            <div className="text-sm font-semibold text-gray-900">{user.level}</div>
                            <div className="text-xs text-gray-500">Level</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-semibold text-gray-900">{user.buildings}</div>
                            <div className="text-xs text-gray-500">Buildings</div>
                          </div>
                          <div className="text-center">
                            <div className="text-sm font-semibold text-gray-900">{user.rating.toFixed(1)}</div>
                            <div className="text-xs text-gray-500">Rating</div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Last active: {formatTimeAgo(user.lastActive)}</span>
                          {user.isOnline && (
                            <span className="text-green-600 font-medium">Online</span>
                          )}
                        </div>

                        {user.interests.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {user.interests.slice(0, 3).map((interest, index) => (
                              <span
                                key={index}
                                className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                              >
                                {interest}
                              </span>
                            ))}
                            {user.interests.length > 3 && (
                              <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                +{user.interests.length - 3} more
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
              <div className="flex justify-center items-center gap-2">
                <button
                  onClick={() => searchUsers(searchQuery, selectedFilter, selectedSort, pagination.page - 1)}
                  disabled={pagination.page <= 1 || loading}
                  className="px-3 py-1 bg-white border border-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                
                <span className="px-4 py-1 text-sm text-gray-600">
                  Page {pagination.page} of {pagination.pages}
                </span>
                
                <button
                  onClick={() => searchUsers(searchQuery, selectedFilter, selectedSort, pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages || loading}
                  className="px-3 py-1 bg-white border border-gray-200 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </motion.div>
      </motion.div>

      {selectedProfile && (
        <PublicProfileModal
          onClose={() => setSelectedProfile(null)}
          username={selectedProfile}
        />
      )}
    </>
  );
}