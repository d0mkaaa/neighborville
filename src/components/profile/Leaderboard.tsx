import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Medal, Trophy, Calendar, Home, User, Star, ArrowUpDown, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
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
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
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
        className="bg-white rounded-xl shadow-xl max-w-3xl w-full max-h-[80vh] overflow-hidden"
      >
        <div className="p-4 bg-amber-500 text-white flex justify-between items-center">
          <h2 className="text-lg font-medium lowercase flex items-center">
            <Trophy size={20} className="mr-2" />
            Leaderboard
          </h2>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            ×
          </button>
        </div>
        
        <div className="p-4">
          <div className="flex flex-wrap gap-2 mb-4">
            <button
              onClick={() => handleSortChange('level')}
              className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                sortBy === 'level' 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Star size={14} />
              Level
            </button>
            <button
              onClick={() => handleSortChange('buildingCount')}
              className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                sortBy === 'buildingCount' 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Home size={14} />
              Buildings
            </button>
            <button
              onClick={() => handleSortChange('day')}
              className={`px-3 py-1 rounded-full text-sm flex items-center gap-1 ${
                sortBy === 'day' 
                  ? 'bg-amber-500 text-white' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <Calendar size={14} />
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
          ) : leaderboard.length === 0 ? (
            <div className="bg-gray-50 p-6 rounded-lg text-center text-gray-500">
              No leaderboard data available yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="py-2 px-4 text-left text-gray-600 font-medium">Rank</th>
                    <th className="py-2 px-4 text-left text-gray-600 font-medium">Player</th>
                    <th className="py-2 px-4 text-left text-gray-600 font-medium">Level</th>
                    <th className="py-2 px-4 text-left text-gray-600 font-medium">Buildings</th>
                    <th className="py-2 px-4 text-left text-gray-600 font-medium">Days</th>
                    <th className="py-2 px-4 text-left text-gray-600 font-medium">Last Active</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, index) => (
                    <tr 
                      key={entry.username} 
                      className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                      onClick={() => onViewProfile(entry.username)}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          {index + 1 + (page - 1) * 10 <= 3 ? (
                            <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                              index + 1 + (page - 1) * 10 === 1 ? 'bg-amber-500 text-white' : 
                              index + 1 + (page - 1) * 10 === 2 ? 'bg-gray-300 text-gray-700' :
                              'bg-amber-700 text-white'
                            }`}>
                              {index + 1 + (page - 1) * 10}
                            </div>
                          ) : (
                            <div className="w-6 h-6 flex items-center justify-center text-gray-500">
                              {index + 1 + (page - 1) * 10}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center mr-2">
                            <User size={16} className="text-emerald-700" />
                          </div>
                          <div>
                            <div className="font-medium">{entry.playerName}</div>
                            <div className="text-xs text-gray-500">{entry.username}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center">
                          <Star size={16} className="text-amber-500 mr-1" />
                          {entry.level}
                        </div>
                      </td>
                      
                      <td className="py-3 px-4">{entry.buildingCount}</td>
                      <td className="py-3 px-4">{entry.day}</td>
                      <td className="py-3 px-4 text-gray-500 text-sm">{formatDate(entry.lastActive)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          
          {!loading && leaderboard.length > 0 && (
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