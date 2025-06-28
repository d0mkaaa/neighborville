import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Home, 
  Edit3, 
  MapPin, 
  Calendar, 
  TrendingUp, 
  Users, 
  Building, 
  Award, 
  RefreshCw,
  AlertTriangle,
  Clock,
  Star
} from 'lucide-react';
import type { GameProgress, NeighborhoodMilestone } from '../../types/gameTypes';
import { useAuth } from '../../context/AuthContext';

interface NeighborhoodManagerProps {
  isOpen: boolean;
  onClose: () => void;
  gameData: GameProgress;
  onUpdateNeighborhood: (newNeighborhoodName: string) => void;
  onStartFresh: () => void;
  isAuthenticated?: boolean;
  onShowLogin?: () => void;
  addNotification?: (message: string, type: string) => void;
}

export default function NeighborhoodManager({ 
  isOpen, 
  onClose, 
  gameData,
  onUpdateNeighborhood,
  onStartFresh,
  isAuthenticated: propIsAuthenticated,
  onShowLogin,
  addNotification
}: NeighborhoodManagerProps) {
  const [neighborhoodName, setNeighborhoodName] = useState(gameData.neighborhoodName || 'Unnamed City');
  const [isEditing, setIsEditing] = useState(false);
  const [showStartFreshModal, setShowStartFreshModal] = useState(false);
  const [showNeighborhoodCreation, setShowNeighborhoodCreation] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const { user } = useAuth();
  
  const isAuthenticated = propIsAuthenticated || !!user;
  const isGuest = !!user?.isGuest;

  useEffect(() => {
    if (isOpen) {
      setNeighborhoodName(gameData.neighborhoodName || 'Unnamed City');
    }
  }, [isOpen, gameData.neighborhoodName, gameData.playerName]);

  const handleUpdateName = async () => {
    if (!neighborhoodName.trim()) {
      addNotification?.('Neighborhood name cannot be empty', 'error');
      return;
    }

    if (neighborhoodName.trim() === gameData.neighborhoodName) {
      setIsEditing(false);
      return;
    }

    setIsUpdating(true);
    
    try {
      await onUpdateNeighborhood(neighborhoodName.trim());
      setIsEditing(false);
      addNotification?.(`Neighborhood renamed to "${neighborhoodName.trim()}"`, 'success');
    } catch (error) {
      console.error('Error updating neighborhood name:', error);
      addNotification?.('Failed to update neighborhood name', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleStartFresh = () => {
    setShowStartFreshModal(false);
    setShowNeighborhoodCreation(true);
  };

  const handleCreateNeighborhood = (neighborhoodName: string) => {
    setShowNeighborhoodCreation(false);
    onStartFresh();
    onClose();
    addNotification?.(`Started "${neighborhoodName}"! Welcome to your fresh start.`, 'success');
  };

  const getCityEra = () => {
    const { day, level, grid } = gameData;
    const buildingCount = grid.filter(b => b !== null).length;
    
    if (day < 30 && level < 5) return 'Early Settlement';
    if (day < 100 && level < 10) return 'Growing Village';
    if (day < 200 && level < 15) return 'Bustling Town';
    if (day < 365 && level < 25) return 'Small City';
    if (buildingCount > 50) return 'Metropolis';
    return 'Established City';
  };

  const getNeighborhoodStats = () => {
    const { grid, neighbors, coins, day } = gameData;
    const buildingCount = grid.filter(b => b !== null).length;
    const residentCount = neighbors?.filter(n => n.hasHome).length || 0;
    const totalHappiness = neighbors?.reduce((sum, n) => sum + (n.satisfaction || 0), 0) || 0;
    const avgHappiness = residentCount > 0 ? Math.round(totalHappiness / residentCount) : 0;
    
    return {
      age: day,
      buildings: buildingCount,
      residents: residentCount,
      happiness: avgHappiness,
      treasury: coins,
      era: getCityEra()
    };
  };

  const generateMilestones = (): NeighborhoodMilestone[] => {
    const stats = getNeighborhoodStats();
    const milestones: NeighborhoodMilestone[] = [];
    const now = Date.now();

    if (stats.buildings >= 5) {
      milestones.push({
        id: 'first_5_buildings',
        title: 'Urban Pioneer',
        description: 'Built your first 5 buildings',
        achievedAt: now - (stats.age * 24 * 60 * 60 * 1000),
        day: Math.max(1, stats.age - 20),
        type: 'infrastructure',
        icon: '🏗️',
        stats: { buildings: 5 }
      });
    }

    if (stats.residents >= 3) {
      milestones.push({
        id: 'first_residents',
        title: 'Community Builder',
        description: 'Welcomed your first residents',
        achievedAt: now - (stats.age * 20 * 60 * 60 * 1000),
        day: Math.max(5, stats.age - 15),
        type: 'social',
        icon: '👥',
        stats: { population: stats.residents }
      });
    }

    if (stats.age >= 30) {
      milestones.push({
        id: 'one_month',
        title: 'Seasoned Mayor',
        description: 'Successfully managed your neighborhood for 30 days',
        achievedAt: now - ((stats.age - 30) * 24 * 60 * 60 * 1000),
        day: 30,
        type: 'social',
        icon: '🎖️'
      });
    }

    if (stats.treasury >= 1000) {
      milestones.push({
        id: 'financial_success',
        title: 'Economic Prosperity',
        description: 'Accumulated 1,000+ coins in treasury',
        achievedAt: now - (10 * 24 * 60 * 60 * 1000),
        day: Math.max(10, stats.age - 10),
        type: 'economic',
        icon: '💰',
        stats: { coins: stats.treasury }
      });
    }

    return milestones.sort((a, b) => a.day - b.day);
  };

  const stats = getNeighborhoodStats();
  const milestones = generateMilestones();
  const foundedDate = gameData.neighborhoodFoundedDate || Date.now() - (stats.age * 24 * 60 * 60 * 1000);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="bg-gradient-to-r from-emerald-500 to-teal-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-white/20 rounded-xl">
                  <Home size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">Neighborhood Manager</h2>
                  <p className="text-emerald-100">Manage your city and view its history</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-xl transition-all duration-200"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          <div className="p-6 max-h-[70vh] overflow-y-auto">
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <MapPin size={20} className="mr-2 text-emerald-600" />
                  Neighborhood Name
                </h3>
                {!isEditing && (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="flex items-center space-x-2 px-3 py-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors duration-200"
                  >
                    <Edit3 size={16} />
                    <span className="text-sm font-medium">Edit</span>
                  </button>
                )}
              </div>

              {isEditing ? (
                <div className="flex items-center space-x-3">
                  <input
                    type="text"
                    value={neighborhoodName}
                    onChange={(e) => setNeighborhoodName(e.target.value)}
                    className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-xl focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/20 outline-none transition-all duration-200"
                    placeholder="Enter neighborhood name"
                    maxLength={50}
                  />
                  <button
                    onClick={handleUpdateName}
                    disabled={isUpdating}
                    className="px-4 py-3 bg-emerald-500 text-white rounded-xl hover:bg-emerald-600 transition-colors duration-200 disabled:opacity-50"
                  >
                    {isUpdating ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setNeighborhoodName(gameData.neighborhoodName || 'Unnamed City');
                    }}
                    className="px-4 py-3 text-gray-600 hover:bg-gray-100 rounded-xl transition-colors duration-200"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-2xl p-6">
                  <h2 className="text-3xl font-bold text-gray-800 mb-2">{gameData.neighborhoodName}</h2>
                  <p className="text-emerald-700 font-medium flex items-center">
                    <Calendar size={16} className="mr-2" />
                    Founded {new Date(foundedDate).toLocaleDateString()}
                  </p>
                </div>
              )}
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <TrendingUp size={20} className="mr-2 text-emerald-600" />
                City Overview
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <Clock size={20} className="text-blue-600" />
                    <span className="text-2xl font-bold text-blue-700">{stats.age}</span>
                  </div>
                  <p className="text-blue-600 font-medium mt-1">Days Old</p>
                </div>

                <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <Building size={20} className="text-purple-600" />
                    <span className="text-2xl font-bold text-purple-700">{stats.buildings}</span>
                  </div>
                  <p className="text-purple-600 font-medium mt-1">Buildings</p>
                </div>

                <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <Users size={20} className="text-orange-600" />
                    <span className="text-2xl font-bold text-orange-700">{stats.residents}</span>
                  </div>
                  <p className="text-orange-600 font-medium mt-1">Residents</p>
                </div>

                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4">
                  <div className="flex items-center justify-between">
                    <Star size={20} className="text-green-600" />
                    <span className="text-2xl font-bold text-green-700">{stats.happiness}%</span>
                  </div>
                  <p className="text-green-600 font-medium mt-1">Happiness</p>
                </div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-semibold text-gray-800">City Era</h4>
                    <p className="text-gray-600">{stats.era}</p>
                  </div>
                  <div className="text-right">
                    <h4 className="font-semibold text-gray-800">Treasury</h4>
                    <p className="text-2xl font-bold text-yellow-600">{stats.treasury.toLocaleString()} 🪙</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mb-8">
              <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                <Award size={20} className="mr-2 text-emerald-600" />
                Neighborhood Milestones
              </h3>
              
              {milestones.length > 0 ? (
                <div className="space-y-3">
                  {milestones.map((milestone) => (
                    <div key={milestone.id} className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
                      <div className="flex items-center space-x-4">
                        <div className="text-2xl">{milestone.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-800">{milestone.title}</h4>
                          <p className="text-gray-600 text-sm">{milestone.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>Day {milestone.day}</span>
                            <span>•</span>
                            <span>{new Date(milestone.achievedAt).toLocaleDateString()}</span>
                            <span>•</span>
                            <span className="capitalize">{milestone.type}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <Award size={48} className="mx-auto mb-4 text-gray-300" />
                  <p>No milestones yet. Keep building to achieve great things!</p>
                </div>
              )}
            </div>

            <div className="border-t border-gray-200 pt-6">
              <div className="bg-gradient-to-r from-red-50 to-orange-50 rounded-xl p-6">
                <div className="flex items-start space-x-4">
                  <AlertTriangle size={24} className="text-orange-600 mt-1" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-gray-800 mb-2">Start Fresh</h4>
                    <p className="text-gray-600 text-sm mb-4">
                      Want to begin a new neighborhood from scratch? This will reset all your progress 
                      and start you with a clean slate. Your current neighborhood will be lost forever.
                    </p>
                    <button
                      onClick={() => setShowStartFreshModal(true)}
                      className="flex items-center space-x-2 px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors duration-200"
                    >
                      <RefreshCw size={16} />
                      <span>Start New Neighborhood</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <AnimatePresence>
          {showStartFreshModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/70 flex items-center justify-center p-4"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-2xl p-6 max-w-md w-full"
              >
                <div className="text-center">
                  <AlertTriangle size={48} className="mx-auto mb-4 text-red-500" />
                  <h3 className="text-xl font-bold text-gray-800 mb-2">Start Fresh?</h3>
                  <p className="text-gray-600 mb-6">
                    This action cannot be undone. Your current neighborhood "{gameData.neighborhoodName}" 
                    and all progress will be permanently lost.
                  </p>
                  <div className="flex space-x-3">
                    <button
                      onClick={() => setShowStartFreshModal(false)}
                      className="flex-1 px-4 py-2 text-gray-600 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleStartFresh}
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors duration-200"
                    >
                      Start Fresh
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </AnimatePresence>
  );
} 