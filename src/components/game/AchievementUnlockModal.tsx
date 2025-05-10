import { motion } from "framer-motion";
import { Award, X } from "lucide-react";
import type { Achievement } from "../../types/game";

type AchievementUnlockModalProps = {
  achievement: Achievement;
  onClose: () => void;
};

export default function AchievementUnlockModal({ achievement, onClose }: AchievementUnlockModalProps) {
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
        transition={{ 
          type: "spring", 
          damping: 20,
          stiffness: 250
        }}
        className="bg-white rounded-xl shadow-xl max-w-sm w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative">
          <div className="absolute top-3 right-3">
            <button 
              onClick={onClose}
              className="bg-white bg-opacity-20 p-1 rounded-full text-gray-600 hover:text-gray-800 transition-colors"
            >
              <X size={20} />
            </button>
          </div>
          
          <div className="bg-gradient-to-r from-emerald-400 to-teal-500 h-24 flex items-center justify-center">
            <motion.div
              initial={{ scale: 0.7, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                damping: 15,
                delay: 0.2
              }}
              className="text-5xl"
            >
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center">
                <Award size={32} className="text-emerald-500" />
              </div>
            </motion.div>
          </div>
        </div>
        
        <div className="p-5 text-center">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center mb-2"
          >
            <span className="text-emerald-500 font-medium lowercase">achievement unlocked!</span>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="text-xl font-medium lowercase text-gray-800 mb-1"
          >
            {achievement.title}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="text-gray-500 mb-4 lowercase"
          >
            {achievement.description}
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="bg-emerald-50 py-2 px-4 rounded-lg inline-block"
          >
            <div className="text-emerald-600 font-medium">+{achievement.xpReward} XP</div>
          </motion.div>
          
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onClose}
            className="mt-4 bg-emerald-500 text-white py-2 px-6 rounded-lg font-medium hover:bg-emerald-600 transition-colors lowercase shadow-md"
          >
            awesome!
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}