import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Award, Lock, Search, Star, Filter } from "lucide-react";
import { useState } from "react";
import type { Achievement } from "../../types/game";

type AchievementsModalProps = {
  achievements: Achievement[];
  onClose: () => void;
};

export default function AchievementsModal({ achievements, onClose }: AchievementsModalProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [sortBy, setSortBy] = useState<"name" | "xp" | "rarity">("name");

  const completedAchievements = achievements.filter(a => a.completed);
  const incompleteAchievements = achievements.filter(a => !a.completed);
  console.log('Completed achievements:', completedAchievements);
  console.log('Incomplete achievements:', incompleteAchievements);

  const getRarityColor = (xpReward: number) => {
    if (xpReward >= 200) return "from-purple-400 to-pink-500";
    if (xpReward >= 100) return "from-yellow-400 to-orange-500";
    if (xpReward >= 50) return "from-blue-400 to-indigo-500";
    return "from-emerald-400 to-teal-500";
  };

  const getRarityName = (xpReward: number) => {
    if (xpReward >= 200) return "legendary";
    if (xpReward >= 100) return "epic";
    if (xpReward >= 50) return "rare";
    return "common";
  };

  const getRarityBadgeColor = (xpReward: number) => {
    if (xpReward >= 200) return "bg-purple-100 text-purple-700 border-purple-200";
    if (xpReward >= 100) return "bg-yellow-100 text-yellow-700 border-yellow-200";
    if (xpReward >= 50) return "bg-blue-100 text-blue-700 border-blue-200";
    return "bg-emerald-100 text-emerald-700 border-emerald-200";
  };

  const getAchievementCategory = (achievement: Achievement) => {
    if (achievement.id.includes('coins') || achievement.id.includes('income') || achievement.id.includes('budget') || achievement.id.includes('tax')) {
      return 'financial';
    }
    if (achievement.id.includes('level') || achievement.id.includes('day')) {
      return 'progression';
    }
    if (achievement.id.includes('building') || achievement.id.includes('upgrade') || achievement.id.includes('grid')) {
      return 'building';
    }
    if (achievement.id.includes('neighbor') || achievement.id.includes('resident') || achievement.id.includes('social')) {
      return 'social';
    }
    if (achievement.id.includes('power') || achievement.id.includes('water') || achievement.id.includes('energy')) {
      return 'utility';
    }
    if (achievement.id.includes('weather') || achievement.id.includes('season') || achievement.id.includes('time')) {
      return 'special';
    }
    return 'other';
  };

  const categories = [
    { id: 'all', name: 'All', icon: '🏆' },
    { id: 'progression', name: 'Progress', icon: '📈' },
    { id: 'financial', name: 'Financial', icon: '💰' },
    { id: 'building', name: 'Building', icon: '🏗️' },
    { id: 'social', name: 'Social', icon: '👥' },
    { id: 'utility', name: 'Utility', icon: '⚡' },
    { id: 'special', name: 'Special', icon: '✨' },
    { id: 'other', name: 'Other', icon: '🎯' }
  ];

  const filteredAchievements = achievements.filter(achievement => {
    const matchesSearch = achievement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         achievement.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || getAchievementCategory(achievement) === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const sortedAchievements = [...filteredAchievements].sort((a, b) => {
    if (sortBy === "xp") return b.xpReward - a.xpReward;
    if (sortBy === "rarity") return b.xpReward - a.xpReward;
    return a.title.localeCompare(b.title);
  });

  const completedFiltered = sortedAchievements.filter(a => a.completed);
  const incompleteFiltered = sortedAchievements.filter(a => !a.completed);

  const completionPercentage = Math.round((completedAchievements.length / achievements.length) * 100);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.3)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 20 }}
        className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[85vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center">
              <Trophy size={24} className="mr-3" />
              <div>
                <h2 className="text-xl font-bold lowercase">achievements</h2>
                <p className="text-emerald-100 text-sm">
                  {completedAchievements.length} of {achievements.length} unlocked ({completionPercentage}%)
                </p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-white hover:text-emerald-100 transition-colors p-2 hover:bg-white/10 rounded-lg"
            >
              <X size={20} />
            </button>
          </div>

          <div className="w-full bg-emerald-700 rounded-full h-3 mb-4">
            <motion.div 
              className="bg-gradient-to-r from-yellow-400 to-orange-400 h-3 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${completionPercentage}%` }}
              transition={{ duration: 1, delay: 0.5 }}
            />
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-64">
              <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search achievements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/50"
              />
            </div>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as "name" | "xp" | "rarity")}
              className="px-3 py-2 bg-white/20 border border-white/30 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-white/50"
            >
              <option value="name" className="text-gray-800">Name</option>
              <option value="xp" className="text-gray-800">XP Reward</option>
              <option value="rarity" className="text-gray-800">Rarity</option>
            </select>
          </div>
        </div>

        <div className="px-6 py-4 bg-gray-50 border-b">
          <div className="flex flex-wrap gap-2">
            {categories.map(category => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                  selectedCategory === category.id
                    ? 'bg-emerald-500 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{category.icon}</span>
                <span className="lowercase">{category.name}</span>
                <span className="text-xs opacity-75">
                  ({achievements.filter(a => category.id === 'all' || getAchievementCategory(a) === category.id).length})
                </span>
              </button>
            ))}
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(85vh-280px)]">
          {completedFiltered.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center mb-4">
                <Star className="text-yellow-500 mr-2" size={20} />
                <h3 className="text-emerald-800 font-bold lowercase text-lg">completed</h3>
                <div className="ml-auto text-sm text-gray-500">
                  {completedFiltered.length} achievement{completedFiltered.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {completedFiltered.map((achievement, index) => (
                  <motion.div 
                    key={achievement.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative overflow-hidden"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${getRarityColor(achievement.xpReward)} opacity-10 group-hover:opacity-20 transition-opacity`} />
                    <div className="relative p-4 bg-white rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          <div className={`w-10 h-10 bg-gradient-to-r ${getRarityColor(achievement.xpReward)} rounded-full flex items-center justify-center mr-3 shadow-md`}>
                            <Award size={16} className="text-white" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-800 lowercase">{achievement.title}</div>
                            <div className="text-sm text-gray-600">{achievement.description}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className={`text-xs px-2 py-1 rounded-full font-medium border ${getRarityBadgeColor(achievement.xpReward)}`}>
                            {getRarityName(achievement.xpReward)}
                          </div>
                          <div className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded font-medium">
                            +{achievement.xpReward} XP
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {incompleteFiltered.length > 0 && (
            <div>
              <div className="flex items-center mb-4">
                <Lock className="text-gray-400 mr-2" size={20} />
                <h3 className="text-gray-700 font-bold lowercase text-lg">in progress</h3>
                <div className="ml-auto text-sm text-gray-500">
                  {incompleteFiltered.length} achievement{incompleteFiltered.length !== 1 ? 's' : ''}
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {incompleteFiltered.map((achievement, index) => (
                  <motion.div 
                    key={achievement.id} 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: (completedFiltered.length * 0.05) + (index * 0.05) }}
                    className="group relative overflow-hidden"
                  >
                    <div className="absolute inset-0 bg-gray-100 opacity-50" />
                    <div className="relative p-4 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                            <Lock size={16} className="text-gray-500" />
                          </div>
                          <div>
                            <div className="font-bold text-gray-500 lowercase">{achievement.title}</div>
                            <div className="text-sm text-gray-500">{achievement.description}</div>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <div className="text-xs px-2 py-1 rounded-full font-medium border bg-gray-100 text-gray-500 border-gray-200">
                            {getRarityName(achievement.xpReward)}
                          </div>
                          <div className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded font-medium">
                            +{achievement.xpReward} XP
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {filteredAchievements.length === 0 && (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <Search size={48} className="mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-600 mb-2">No achievements found</h3>
              <p className="text-gray-500">Try adjusting your search or filter criteria</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}