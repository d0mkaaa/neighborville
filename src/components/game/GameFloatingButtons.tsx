import { motion } from "framer-motion";

type GameFloatingButtonsProps = {
  onShowMarketplace: () => void;
  onShowSpecialEvents: () => void;
};

export default function GameFloatingButtons({
  onShowMarketplace,
  onShowSpecialEvents
}: GameFloatingButtonsProps) {
  return (
    <motion.div 
      initial={{ x: 100, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ delay: 0.5, duration: 0.3 }}
      className="fixed right-4 bottom-20 z-40"
    >
      <div className="flex flex-col gap-3">
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onShowMarketplace}
          className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-full shadow-lg transition-all hover:shadow-xl flex items-center justify-center text-xl"
        >
          🛍️
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onShowSpecialEvents}
          className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-full shadow-lg transition-all hover:shadow-xl flex items-center justify-center text-xl"
        >
          🎉
        </motion.button>
      </div>
    </motion.div>
  );
}