import { motion, AnimatePresence } from "framer-motion";
import { X, Trophy, Award, Lock } from "lucide-react";
import type { Achievement } from "../../types/game";

type AchievementsModalProps = {
  achievements: Achievement[];
  onClose: () => void;
};

export default function AchievementsModal({ achievements, onClose }: AchievementsModalProps) {
  const completedAchievements = achievements.filter(a => a.completed);
  const incompleteAchievements = achievements.filter(a => !a.completed);

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
        <div className="p-4 bg-emerald-600 text-white flex justify-between items-center">
          <h2 className="text-lg font-medium lowercase flex items-center">
            <Trophy size={20} className="mr-2" />
            achievements ({completedAchievements.length}/{achievements.length})
          </h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-emerald-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto max-h-[calc(80vh-100px)]">
          {completedAchievements.length > 0 && (
            <div className="mb-6">
              <h3 className="text-emerald-800 font-medium lowercase mb-3">completed</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {completedAchievements.map(achievement => (
                  <motion.div 
                    key={achievement.id} 
                    className="p-3 bg-emerald-50 rounded-lg border border-emerald-100"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center mr-3">
                          <Award size={16} className="text-white" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-700 lowercase">{achievement.title}</div>
                          <div className="text-sm text-gray-500">{achievement.description}</div>
                        </div>
                      </div>
                      <div className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded">
                        +{achievement.xpReward} XP
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
          
          {incompleteAchievements.length > 0 && (
            <div>
              <h3 className="text-gray-700 font-medium lowercase mb-3">in progress</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {incompleteAchievements.map(achievement => (
                  <motion.div 
                    key={achievement.id} 
                    className="p-3 bg-gray-50 rounded-lg border border-gray-200"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                          <Lock size={16} className="text-gray-500" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-400 lowercase">{achievement.title}</div>
                          <div className="text-sm text-gray-500">{achievement.description}</div>
                        </div>
                      </div>
                      <div className="text-xs bg-gray-100 text-gray-500 px-2 py-1 rounded">
                        +{achievement.xpReward} XP
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}