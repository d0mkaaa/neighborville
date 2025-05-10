import { motion, AnimatePresence } from "framer-motion";
import { X, User, TrendingUp, Calendar, Home, Coins, Trophy, Zap, Droplets, Users } from "lucide-react";
import type { GameProgress, Achievement, Neighbor, Building } from "../../types/game";

type PlayerStatsModalProps = {
  gameData: GameProgress;
  achievements: Achievement[];
  neighbors: Neighbor[];
  grid: (Building | null)[];
  onClose: () => void;
};

export default function PlayerStatsModal({ gameData, achievements, neighbors, grid, onClose }: PlayerStatsModalProps) {
  const completedAchievements = achievements.filter(a => a.completed).length;
  const totalXP = achievements.filter(a => a.completed).reduce((sum, a) => sum + a.xpReward, 0);
  const housedResidents = neighbors.filter(n => n.hasHome).length;
  const totalBuildings = grid.filter(b => b !== null).length;
  const gridUtilization = (totalBuildings / gameData.gridSize) * 100;
  
  const dailyIncome = grid.reduce((sum, building) => {
    if (building && building.income > 0) {
      return sum + building.income;
    }
    return sum;
  }, 0);
  
  const connectedBuildings = grid.filter(b => 
    b && (b.isConnectedToPower || b.isConnectedToWater || b.isPowerGenerator || b.isWaterSupply)
  ).length;

  const stats = [
    { label: 'Level', value: gameData.level, icon: <TrendingUp className="text-emerald-500" size={20} /> },
    { label: 'Experience', value: `${gameData.experience}/${gameData.level * 100}`, icon: <TrendingUp className="text-blue-500" size={20} /> },
    { label: 'Days Survived', value: gameData.day, icon: <Calendar className="text-purple-500" size={20} /> },
    { label: 'Total Coins', value: gameData.coins, icon: <Coins className="text-yellow-500" size={20} /> },
    { label: 'Happiness', value: `${Math.round(gameData.happiness)}%`, icon: <Users className="text-green-500" size={20} /> },
    { label: 'Daily Income', value: `${dailyIncome} coins`, icon: <TrendingUp className="text-emerald-500" size={20} /> },
    { label: 'Buildings', value: totalBuildings, icon: <Home className="text-indigo-500" size={20} /> },
    { label: 'Residents', value: housedResidents, icon: <Users className="text-orange-500" size={20} /> },
    { label: 'Grid Size', value: `${Math.sqrt(gameData.gridSize)}×${Math.sqrt(gameData.gridSize)}`, icon: <Home className="text-gray-500" size={20} /> },
    { label: 'Achievements', value: `${completedAchievements}/${achievements.length}`, icon: <Trophy className="text-amber-500" size={20} /> },
    { label: 'Connected Buildings', value: connectedBuildings, icon: <Zap className="text-blue-500" size={20} /> },
    { label: 'Total XP Earned', value: totalXP, icon: <TrendingUp className="text-purple-500" size={20} /> },
  ];

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
        className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center mr-4">
              <User size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-medium lowercase">{gameData.playerName}</h2>
              <div className="text-sm text-white/80">Level {gameData.level} Mayor</div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(80vh-100px)]">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-gray-50 rounded-lg p-4 flex items-center"
              >
                <div className="mr-3 p-2 bg-white rounded-lg shadow-sm">
                  {stat.icon}
                </div>
                <div>
                  <div className="text-xs text-gray-500 uppercase">{stat.label}</div>
                  <div className="text-lg font-semibold text-gray-800">{stat.value}</div>
                </div>
              </motion.div>
            ))}
          </div>
          
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="text-sm font-medium text-gray-700 mb-3 lowercase">progress overview</h3>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Experience</span>
                  <span>{gameData.experience}/{gameData.level * 100} XP</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(gameData.experience / (gameData.level * 100)) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-500"
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Grid Utilization</span>
                  <span>{Math.round(gridUtilization)}%</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${gridUtilization}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-green-500 to-emerald-500"
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>Achievement Progress</span>
                  <span>{completedAchievements}/{achievements.length}</span>
                </div>
                <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${(completedAchievements / achievements.length) * 100}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-amber-500 to-orange-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}