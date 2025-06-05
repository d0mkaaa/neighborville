import { motion, AnimatePresence } from "framer-motion";
import { Award, X, Star, Sparkles, Crown, Trophy, Zap, Gift } from "lucide-react";
import type { Achievement } from "../../types/game";

type AchievementUnlockModalProps = {
  achievement: Achievement | Achievement[];
  onClose: () => void;
};

export default function AchievementUnlockModal({ achievement, onClose }: AchievementUnlockModalProps) {
  const achievements = Array.isArray(achievement) ? achievement : [achievement];
  const isMultiple = achievements.length > 1;

  const getTotalXP = () => {
    return achievements.reduce((sum, ach) => sum + ach.xpReward, 0);
  };

  const getRarityConfig = (xpReward: number) => {
    if (xpReward >= 200) {
      return {
        name: "legendary",
        gradient: "from-purple-500 via-pink-500 to-purple-600",
        bgGradient: "from-purple-50 via-pink-50 to-purple-50",
        borderGradient: "from-purple-400 to-pink-400",
        textColor: "text-purple-700",
        badgeColor: "bg-purple-100 text-purple-800",
        icon: Crown,
        glow: "shadow-purple-500/25"
      };
    }
    if (xpReward >= 100) {
      return {
        name: "epic",
        gradient: "from-amber-400 via-yellow-500 to-orange-500",
        bgGradient: "from-amber-50 via-yellow-50 to-orange-50",
        borderGradient: "from-amber-400 to-orange-400",
        textColor: "text-amber-700",
        badgeColor: "bg-amber-100 text-amber-800",
        icon: Trophy,
        glow: "shadow-amber-500/25"
      };
    }
    if (xpReward >= 50) {
      return {
        name: "rare",
        gradient: "from-blue-500 via-indigo-500 to-blue-600",
        bgGradient: "from-blue-50 via-indigo-50 to-blue-50",
        borderGradient: "from-blue-400 to-indigo-400",
        textColor: "text-blue-700",
        badgeColor: "bg-blue-100 text-blue-800",
        icon: Zap,
        glow: "shadow-blue-500/25"
      };
    }
    return {
      name: "common",
      gradient: "from-emerald-500 via-teal-500 to-emerald-600",
      bgGradient: "from-emerald-50 via-teal-50 to-emerald-50",
      borderGradient: "from-emerald-400 to-teal-400",
      textColor: "text-emerald-700",
      badgeColor: "bg-emerald-100 text-emerald-800",
      icon: Award,
      glow: "shadow-emerald-500/25"
    };
  };

  const primaryRarity = getRarityConfig(achievements[0].xpReward);
  const RarityIcon = primaryRarity.icon;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(16px)", backgroundColor: "rgba(0,0,0,0.4)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.7, opacity: 0, y: 50, rotateX: -15 }}
        animate={{ scale: 1, opacity: 1, y: 0, rotateX: 0 }}
        exit={{ scale: 0.8, opacity: 0, y: 30, rotateX: 10 }}
        transition={{ 
          type: "spring", 
          damping: 18,
          stiffness: 200,
          mass: 0.8
        }}
        className={`bg-gradient-to-br ${primaryRarity.bgGradient} backdrop-blur-xl rounded-3xl shadow-2xl ${primaryRarity.glow} ${isMultiple ? 'max-w-lg' : 'max-w-md'} w-full overflow-hidden relative border-2 border-white/30`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className={`absolute w-1 h-1 bg-gradient-to-r ${primaryRarity.gradient} rounded-full opacity-60`}
              initial={{ 
                x: Math.random() * 500, 
                y: Math.random() * 400,
                scale: 0,
                opacity: 0
              }}
              animate={{ 
                y: [null, -30, -60, -90],
                x: [null, Math.random() > 0.5 ? 20 : -20],
                scale: [0, 1, 0.8, 0],
                opacity: [0, 1, 0.8, 0]
              }}
              transition={{ 
                duration: 3,
                delay: i * 0.1,
                repeat: Infinity,
                repeatDelay: 2,
                ease: "easeOut"
              }}
            />
          ))}
          
          {[...Array(12)].map((_, i) => (
            <motion.div
              key={`sparkle-${i}`}
              className="absolute"
              style={{
                left: `${15 + (i * 7)}%`,
                top: `${20 + (i % 4) * 15}%`
              }}
              animate={{
                scale: [0, 1, 0],
                rotate: [0, 180, 360],
                opacity: [0, 1, 0]
              }}
              transition={{
                duration: 2.5,
                delay: i * 0.15,
                repeat: Infinity,
                repeatDelay: 1.5
              }}
            >
              <Sparkles size={12} className="text-white/70" />
            </motion.div>
          ))}

          <div className={`absolute inset-0 bg-gradient-radial from-white/10 via-transparent to-transparent`} />
        </div>

        <div className="absolute top-4 right-4 z-20">
          <motion.button 
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white/80 hover:text-white hover:bg-white/30 transition-all duration-200 shadow-lg"
          >
            <X size={18} />
          </motion.button>
        </div>
        
        <div className={`bg-gradient-to-r ${primaryRarity.gradient} relative overflow-hidden`}>
          <div className="absolute inset-0">
            <motion.div
              className="absolute inset-0 bg-white/10"
              animate={{
                backgroundPosition: ["0% 0%", "100% 100%"]
              }}
              transition={{
                duration: 8,
                repeat: Infinity,
                repeatType: "reverse"
              }}
              style={{
                backgroundImage: "linear-gradient(45deg, transparent 30%, rgba(255,255,255,0.1) 50%, transparent 70%)",
                backgroundSize: "200% 200%"
              }}
            />
          </div>

          <div className="relative px-8 py-12 flex flex-col items-center text-center">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ 
                type: "spring", 
                damping: 12,
                stiffness: 200,
                delay: 0.3
              }}
              className="relative mb-6"
            >
              <div className="w-24 h-24 bg-white/95 backdrop-blur-sm rounded-full flex items-center justify-center shadow-2xl ring-4 ring-white/30">
                {isMultiple ? (
                  <div className="relative">
                    <Gift size={48} className={primaryRarity.textColor} />
                    <motion.div
                      className="absolute -top-2 -right-2 w-8 h-8 bg-red-500 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.6, type: "spring", damping: 15 }}
                    >
                      {achievements.length}
                    </motion.div>
                  </div>
                ) : (
                  <RarityIcon size={48} className={primaryRarity.textColor} />
                )}
              </div>
              
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-white/50"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [0.8, 0, 0.8]
                }}
                transition={{
                  duration: 2,
                  repeat: Infinity,
                  delay: 0.8
                }}
              />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5, duration: 0.6 }}
              className="flex items-center gap-3 mb-2"
            >
              <Star className="text-white/90" size={20} />
              <span className="text-white font-bold text-lg tracking-wide">
                {isMultiple ? `${achievements.length} ACHIEVEMENTS UNLOCKED!` : 'ACHIEVEMENT UNLOCKED!'}
              </span>
              <Star className="text-white/90" size={20} />
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, duration: 0.4 }}
              className="px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium text-sm uppercase tracking-wider border border-white/30"
            >
              {primaryRarity.name} ACHIEVEMENT
            </motion.div>
          </div>
        </div>
        
        <div className="p-8 relative">
          {isMultiple ? (
            <div className="space-y-4 mb-6">
              {achievements.map((ach, index) => {
                const achRarity = getRarityConfig(ach.xpReward);
                const AchIcon = achRarity.icon;
                return (
                  <motion.div
                    key={ach.id}
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.6 + index * 0.1, duration: 0.5 }}
                    className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/50 shadow-lg"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 bg-gradient-to-r ${achRarity.gradient} rounded-xl flex items-center justify-center shadow-lg`}>
                        <AchIcon size={24} className="text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="font-bold text-gray-900 text-lg mb-1">
                          {ach.title}
                        </div>
                        <div className="text-gray-600 text-sm">
                          {ach.description}
                        </div>
                      </div>
                      <div className={`px-3 py-2 ${achRarity.badgeColor} rounded-xl font-bold text-sm shadow-sm`}>
                        +{ach.xpReward} XP
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center mb-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="text-3xl font-bold text-gray-900 mb-3"
              >
                {achievements[0].title}
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7, duration: 0.5 }}
                className="text-gray-600 text-lg mb-4"
              >
                {achievements[0].description}
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8, duration: 0.4 }}
                className="inline-flex items-center gap-2"
              >
                <div className={`px-4 py-2 ${primaryRarity.badgeColor} rounded-full text-sm font-bold uppercase tracking-wide shadow-lg`}>
                  {primaryRarity.name}
                </div>
              </motion.div>
            </div>
          )}
          
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: isMultiple ? 0.9 : 0.8, duration: 0.6 }}
            className={`bg-gradient-to-r ${primaryRarity.bgGradient} border-2 border-gradient-to-r ${primaryRarity.borderGradient} rounded-2xl p-6 mb-6 text-center shadow-xl`}
          >
            <div className="flex items-center justify-center gap-3 mb-2">
              <Zap className={primaryRarity.textColor} size={24} />
              <span className="text-gray-700 font-medium text-lg">Experience Gained</span>
              <Zap className={primaryRarity.textColor} size={24} />
            </div>
            <div className={`text-4xl font-bold ${primaryRarity.textColor} mb-1`}>
              +{getTotalXP()} XP
            </div>
            <div className="text-gray-600 text-sm">
              {isMultiple ? `Total from ${achievements.length} achievements` : 'Added to your progress'}
            </div>
          </motion.div>
          
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: isMultiple ? 1.0 : 0.9, duration: 0.5 }}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClose}
            className={`w-full bg-gradient-to-r ${primaryRarity.gradient} text-white py-4 px-8 rounded-2xl font-bold text-lg hover:shadow-2xl transition-all duration-300 transform ${primaryRarity.glow} border border-white/20`}
          >
            <motion.span
              animate={{
                textShadow: ["0 0 0px rgba(255,255,255,0.5)", "0 0 20px rgba(255,255,255,0.8)", "0 0 0px rgba(255,255,255,0.5)"]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                delay: 1.5
              }}
            >
              {isMultiple ? 'AMAZING!' : 'AWESOME!'}
            </motion.span>
          </motion.button>
        </div>
      </motion.div>
    </motion.div>
  );
}