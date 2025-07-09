import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Medal, Trophy, Calendar, Home, User, Star, ArrowUpDown, ChevronLeft, ChevronRight, Loader2, X } from 'lucide-react';
import { getLeaderboard } from '../../services/userService';
import type { LeaderboardEntry } from '../../services/userService';

interface LeaderboardProps {
  onClose: () => void;
  onViewProfile: (username: string) => void;
}

export default function Leaderboard({ onClose, onViewProfile }: LeaderboardProps) {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<'level' | 'buildingCount' | 'day'>('level');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  const handleSortChange = (newSort: 'level' | 'buildingCount' | 'day') => {
    setSortBy(newSort);
    setPage(1);
  };
  
  const handlePreviousPage = () => {
    if (page > 1) {
      setPage(page - 1);
    }
  };
  
  const handleNextPage = () => {
    if (page < totalPages) {
      setPage(page + 1);
    }
  };
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffMinutes < 5) {
      return { text: 'Active now', color: 'text-green-600', bgColor: 'bg-green-100', dotColor: 'bg-green-500' };
    } else if (diffMinutes < 30) {
      return { text: `${diffMinutes}m ago`, color: 'text-green-600', bgColor: 'bg-green-50', dotColor: 'bg-green-500' };
    } else if (diffHours < 1) {
      return { text: `${diffMinutes}m ago`, color: 'text-yellow-600', bgColor: 'bg-yellow-50', dotColor: 'bg-yellow-500' };
    } else if (diffHours < 24) {
      return { text: `${diffHours}h ago`, color: 'text-yellow-600', bgColor: 'bg-yellow-50', dotColor: 'bg-yellow-500' };
    } else if (diffDays === 1) {
      return { text: 'Yesterday', color: 'text-orange-600', bgColor: 'bg-orange-50', dotColor: 'bg-orange-500' };
    } else if (diffDays < 7) {
      return { text: `${diffDays} days ago`, color: 'text-red-600', bgColor: 'bg-red-50', dotColor: 'bg-red-500' };
    } else {
      return { text: date.toLocaleDateString(), color: 'text-gray-500', bgColor: 'bg-gray-50', dotColor: 'bg-gray-400' };
    }
  };

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await getLeaderboard(sortBy, page, 10);
      
      if (data.success) {
        setLeaderboard(data.leaderboard);
        setTotalPages(data.pagination.pages);
      } else {
        throw new Error(data.message || 'Failed to fetch leaderboard data');
      }
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(typeof err === 'string' ? err : err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchLeaderboard();
  }, [sortBy, page]);
  
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
        className="bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border border-gray-200/50 backdrop-blur-sm"
      >
        <div className="p-6 bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500 text-white flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center mr-4">
              <Trophy size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">City Leaders</h2>
              <p className="text-white/90 text-sm">Top mayors in NeighborVille</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl flex items-center justify-center transition-colors border border-white/20"
          >
            <X size={20} className="text-white" />
          </button>
        </div>
        
        <div className="p-6">
          <div className="flex flex-wrap gap-3 mb-6">
            <button
              onClick={() => handleSortChange('level')}
              className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
                sortBy === 'level' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              <Star size={16} />
              Level
            </button>
            <button
              onClick={() => handleSortChange('buildingCount')}
              className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
                sortBy === 'buildingCount' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              <Home size={16} />
              Buildings
            </button>
            <button
              onClick={() => handleSortChange('day')}
              className={`px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-2 transition-all ${
                sortBy === 'day' 
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-md'
              }`}
            >
              <Calendar size={16} />
              Days
            </button>
          </div>
          
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="animate-spin text-amber-500" size={32} />
            </div>
          ) : error ? (
            <div className="bg-red-50 text-red-600 p-4 rounded-lg text-center">
              {error}
            </div>
          ) : (!leaderboard || leaderboard.length === 0) ? (
            <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
              No leaderboard data available yet.
            </div>
          ) : (
            <div className="overflow-x-auto bg-white rounded-xl border border-gray-200 shadow-sm">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="py-4 px-6 text-left text-gray-700 font-semibold text-sm uppercase tracking-wide">Rank</th>
                    <th className="py-4 px-6 text-left text-gray-700 font-semibold text-sm uppercase tracking-wide">Player</th>
                    <th className="py-4 px-6 text-left text-gray-700 font-semibold text-sm uppercase tracking-wide">Level</th>
                    <th className="py-4 px-6 text-left text-gray-700 font-semibold text-sm uppercase tracking-wide">Buildings</th>
                    <th className="py-4 px-6 text-left text-gray-700 font-semibold text-sm uppercase tracking-wide">Days</th>
                    <th className="py-4 px-6 text-left text-gray-700 font-semibold text-sm uppercase tracking-wide">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => {
                    const rankPosition = index + 1 + (page - 1) * 10;
                    const isTopThree = rankPosition <= 3;
                    
                    return (
                    <tr 
                      key={entry.username} 
                      className="border-b border-gray-100 hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 cursor-pointer transition-all duration-200 group"
                      onClick={() => onViewProfile(entry.username)}
                    >
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          {isTopThree ? (
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-sm shadow-md ${
                              rankPosition === 1 ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white' : 
                              rankPosition === 2 ? 'bg-gradient-to-br from-gray-300 to-gray-500 text-white' :
                              'bg-gradient-to-br from-amber-600 to-amber-800 text-white'
                            }`}>
                              {rankPosition === 1 ? '👑' : rankPosition}
                            </div>
                          ) : (
                            <div className="w-8 h-8 flex items-center justify-center text-gray-500 font-semibold bg-gray-100 rounded-lg group-hover:bg-gray-200 transition-colors">
                              {rankPosition}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-xl flex items-center justify-center mr-3 shadow-sm group-hover:shadow-md transition-shadow">
                            <User size={20} className="text-emerald-700" />
                          </div>
                          <div>
                            <div className="font-semibold text-gray-900 group-hover:text-blue-700 transition-colors">{entry.playerName}</div>
                            <div className="text-sm text-gray-500">@{entry.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-amber-100 to-amber-200 rounded-lg flex items-center justify-center">
                            <Star size={16} className="text-amber-600" />
                          </div>
                          <span className="font-semibold text-gray-800">{entry.level}</span>
                        </div>
                      </td>
                      
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center">
                            <Home size={16} className="text-blue-600" />
                          </div>
                          <span className="font-semibold text-gray-800">{entry.buildingCount}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg flex items-center justify-center">
                            <Calendar size={16} className="text-purple-600" />
                          </div>
                          <span className="font-semibold text-gray-800">{entry.day}</span>
                        </div>
                                             </td>
                       <td className="py-4 px-6">
                          {(() => {
                            const status = formatDate(entry.lastActive);
                            return (
                              <div className="flex items-center gap-2">
                                <div className={`w-3 h-3 rounded-full ${status.dotColor} shadow-sm`}></div>
                                <span className={`text-xs font-semibold px-3 py-1 rounded-full ${status.bgColor} ${status.color} border border-gray-200`}>
                                  {status.text}
                                </span>
                              </div>
                            );
                          })()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
          
          {!loading && leaderboard && leaderboard.length > 0 && (
            <div className="flex justify-between items-center mt-4">
              <div className="text-sm text-gray-500">
                Page {page} of {totalPages}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handlePreviousPage}
                  disabled={page === 1}
                  className={`p-2 rounded ${
                    page === 1 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ChevronLeft size={16} />
                </button>
                <button
                  onClick={handleNextPage}
                  disabled={page === totalPages}
                  className={`p-2 rounded ${
                    page === totalPages 
                      ? 'text-gray-300 cursor-not-allowed' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
} 