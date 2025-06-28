import { useState } from "react";
import { motion } from "framer-motion";
import { X, TrendingUp, Calendar, Coins, Trophy, Users, Building, Award, Activity, Star, History, Target, Crown, MapPin, Clock, BarChart3, Sparkles, CheckCircle, Zap } from "lucide-react";
import type { GameProgress, Achievement, Neighbor, Building as BuildingType, XPLogEntry } from "../../types/game";
import { useAuth } from "../../context/AuthContext";
import XPHistory from "./XPHistory";

type PlayerStatsModalProps = {
  gameData: GameProgress;
  achievements: Achievement[];
  neighbors: Neighbor[];
  grid: (BuildingType | null)[];
  xpHistory: XPLogEntry[];
  onClose: () => void;
};

export default function PlayerStatsModal({ gameData, achievements, neighbors, grid, xpHistory, onClose }: PlayerStatsModalProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'overview' | 'achievements' | 'analytics'>('overview');
  const [showXPHistory, setShowXPHistory] = useState(false);
  
  const isGuest = !!user?.isGuest;

  const completedAchievements = achievements.filter(a => a.completed).length;
  const totalXP = achievements.filter(a => a.completed).reduce((sum, a) => sum + a.xpReward, 0);
  const housedResidents = neighbors.filter(n => n.hasHome).length;
  const totalBuildings = grid.filter(b => b !== null).length;
  const gridUtilization = (totalBuildings / gameData.gridSize) * 100;
  
  const buildingTypes = grid.filter(b => b !== null).reduce((acc, building) => {
    if (building) {
      acc[building.type || 'Unknown'] = (acc[building.type || 'Unknown'] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const cityValue = grid.filter(b => b !== null).reduce((sum, building) => {
    return sum + (building?.cost || 0);
  }, 0);

  const experienceProgress = (gameData.experience / (gameData.level * 100)) * 100;
  const achievementProgress = (completedAchievements / achievements.length) * 100;
  
  const mayorRating = Math.min(100, Math.round(
    (gameData.level * 10) + 
    (completedAchievements * 5) + 
    (gridUtilization * 0.5) + 
    (housedResidents * 3)
  ));

  const getPlayerTitle = () => {
    if (gameData.level >= 20) return "Legendary Mayor";
    if (gameData.level >= 15) return "Master Planner";
    if (gameData.level >= 10) return "City Architect";
    if (gameData.level >= 5) return "Town Manager";
    return "Neighborhood Mayor";
  };

  const getCitySize = () => {
    if (totalBuildings >= 40) return "Metropolis";
    if (totalBuildings >= 25) return "City";
    if (totalBuildings >= 15) return "Town";
    if (totalBuildings >= 8) return "Village";
    return "Settlement";
  };

  const nextLevel = gameData.level + 1;
  const unlocksAtNextLevel = [
    { level: 2, unlock: 'More building options', icon: '🏗️' },
    { level: 3, unlock: 'Fancy Restaurant', icon: '🍽️' },
    { level: 4, unlock: 'Tech Hub', icon: '💻' },
    { level: 5, unlock: 'Movie Theater & Special Neighbors', icon: '🎬' },
    { level: 6, unlock: 'Luxury Condos', icon: '🏙️' },
    { level: 8, unlock: 'Expanded grid (5×5)', icon: '📐' },
    { level: 12, unlock: 'Large grid (6×6)', icon: '🗺️' },
    { level: 16, unlock: 'Huge grid (7×7)', icon: '🌍' },
    { level: 20, unlock: 'Maximum grid (8×8)', icon: '🏛️' },
  ].find(item => item.level === nextLevel);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(12px)", backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white p-6">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
                <Crown size={32} className="text-yellow-300" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{gameData.playerName}</h1>
                <div className="flex items-center space-x-3 text-white/90">
                  <span className="text-lg">{getPlayerTitle()}</span>
                  {isGuest && (
                    <span className="bg-blue-500/80 backdrop-blur-sm text-white text-xs py-1 px-2 rounded-full border border-white/30">
                      Guest
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4 mt-2 text-sm text-white/80">
                  <span className="flex items-center">
                    <MapPin size={14} className="mr-1" />
                    {gameData.neighborhoodName || 'Unnamed City'}
                  </span>
                  <span className="flex items-center">
                    <Building size={14} className="mr-1" />
                    {getCitySize()}
                  </span>
                </div>
              </div>
            </div>
            
            <div className="text-right">
              <div className="text-3xl font-bold text-yellow-300">#{mayorRating}</div>
              <div className="text-sm text-white/80">Mayor Rating</div>
            </div>
            
            <button 
              onClick={onClose}
              className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>
        </div>

        <div className="border-b border-gray-200 bg-gray-50">
          <div className="flex">
            {[
              { id: 'overview', label: 'Overview', icon: <BarChart3 size={16} /> },
              { id: 'achievements', label: 'Achievements', icon: <Trophy size={16} /> },
              { id: 'analytics', label: 'Analytics', icon: <Activity size={16} /> }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex-1 py-4 px-6 text-sm font-medium flex items-center justify-center space-x-2 transition-all ${
                  activeTab === tab.id
                    ? 'text-indigo-600 border-b-2 border-indigo-500 bg-white'
                    : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-200px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Level', value: gameData.level, icon: <TrendingUp className="text-emerald-500" size={20} /> },
                  { label: 'Days', value: gameData.day, icon: <Calendar className="text-purple-500" size={20} /> },
                  { label: 'Coins', value: gameData.coins.toLocaleString(), icon: <Coins className="text-yellow-500" size={20} /> },
                  { label: 'Buildings', value: totalBuildings, icon: <Building className="text-blue-500" size={20} /> },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="text-2xl font-bold text-gray-800">{stat.value}</div>
                        <div className="text-sm text-gray-600">{stat.label}</div>
                      </div>
                      <div className="p-3 bg-white rounded-lg shadow-sm">
                        {stat.icon}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Zap className="mr-2 text-blue-500" size={20} />
                      Experience Progress
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Level {gameData.level} → {gameData.level + 1}</span>
                        <span>{gameData.experience}/{gameData.level * 100} XP</span>
                      </div>
                      <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full transition-all duration-1000"
                          style={{ width: `${experienceProgress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        {(gameData.level * 100) - gameData.experience} XP needed for next level
                      </div>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                      <Trophy className="mr-2 text-amber-500" size={20} />
                      Achievements
                    </h3>
                    <div className="space-y-3">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Completed</span>
                        <span>{completedAchievements}/{achievements.length}</span>
                      </div>
                      <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-orange-500 rounded-full transition-all duration-1000"
                          style={{ width: `${achievementProgress}%` }}
                        />
                      </div>
                      <div className="text-xs text-gray-500">
                        {achievements.length - completedAchievements} achievements remaining
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Target className="mr-2 text-green-500" size={20} />
                    City Overview
                  </h3>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Total Value</span>
                      <span className="font-semibold text-green-600">{cityValue.toLocaleString()} coins</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Residents</span>
                      <span className="font-semibold">{housedResidents} housed</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Grid Usage</span>
                      <span className="font-semibold">{Math.round(gridUtilization)}%</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-green-500 to-emerald-500 rounded-full transition-all duration-1000"
                        style={{ width: `${gridUtilization}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {unlocksAtNextLevel && (
                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Sparkles className="mr-2 text-indigo-500" size={20} />
                    Next Level Unlock
                  </h3>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="text-4xl">{unlocksAtNextLevel.icon}</div>
                      <div>
                        <div className="text-lg font-semibold text-indigo-800">Level {unlocksAtNextLevel.level}</div>
                        <div className="text-indigo-600">{unlocksAtNextLevel.unlock}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-indigo-600">
                        {(gameData.level * 100) - gameData.experience} XP to go
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'achievements' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold text-gray-800">Achievement Progress</h3>
                <div className="text-sm text-gray-600">
                  {completedAchievements}/{achievements.length} completed
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {achievements.map((achievement) => (
                  <div
                    key={achievement.id}
                    className={`p-4 rounded-xl border ${
                      achievement.completed
                        ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                        : 'bg-gray-50 border-gray-200'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`text-2xl ${achievement.completed ? 'grayscale-0' : 'grayscale'}`}>
                        🏆
                      </div>
                      <div className="flex-1">
                        <h4 className={`font-semibold ${achievement.completed ? 'text-green-800' : 'text-gray-600'}`}>
                          {achievement.title}
                        </h4>
                        <p className={`text-sm ${achievement.completed ? 'text-green-600' : 'text-gray-500'}`}>
                          {achievement.description}
                        </p>
                        <div className="flex items-center justify-between mt-2">
                          <span className={`text-xs font-medium ${achievement.completed ? 'text-green-600' : 'text-gray-500'}`}>
                            {achievement.xpReward} XP
                          </span>
                          {achievement.completed && (
                            <div className="flex items-center text-green-600">
                              <CheckCircle size={16} />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
                    <Building className="mr-2 text-blue-500" size={20} />
                    Building Distribution
                  </h3>
                  <div className="space-y-3">
                    {Object.entries(buildingTypes).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <span className="text-gray-600 capitalize">{type.replace(/([A-Z])/g, ' $1').trim()}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500 rounded-full transition-all duration-500"
                              style={{ width: `${(count / totalBuildings) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-semibold w-8 text-right">{count}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                      <Star className="mr-2 text-purple-500" size={20} />
                      Experience Tracking
                    </h3>
                    <button
                      onClick={() => setShowXPHistory(true)}
                      className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center space-x-1 hover:bg-indigo-50 px-2 py-1 rounded"
                    >
                      <History size={14} />
                      <span>View History</span>
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="text-center">
                      <div className="text-3xl font-bold text-purple-600">{totalXP}</div>
                      <div className="text-sm text-gray-600">Total XP Earned</div>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Sources</span>
                      <span className="font-semibold">{xpHistory.length} activities</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Average per day</span>
                      <span className="font-semibold">{Math.round(totalXP / gameData.day)} XP</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Play Time', value: `${gameData.day} days`, icon: <Clock className="text-blue-500" size={16} /> },
                  { label: 'Efficiency', value: `${Math.round(gridUtilization)}%`, icon: <Target className="text-green-500" size={16} /> },
                  { label: 'Population', value: housedResidents, icon: <Users className="text-orange-500" size={16} /> },
                  { label: 'City Rank', value: getCitySize(), icon: <Award className="text-purple-500" size={16} /> },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-gray-50 rounded-lg p-4 text-center hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex justify-center mb-2">
                      {stat.icon}
                    </div>
                    <div className="text-lg font-bold text-gray-800">{stat.value}</div>
                    <div className="text-xs text-gray-600">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
        
        {showXPHistory && (
          <XPHistory 
            history={xpHistory} 
            onClose={() => setShowXPHistory(false)} 
          />
        )}
      </div>
    </div>
  );
}