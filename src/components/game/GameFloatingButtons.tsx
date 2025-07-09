import { motion } from "framer-motion";
import { MessageCircle } from "lucide-react";

type GameFloatingButtonsProps = {
  onShowMarketplace: () => void;
  onShowSpecialEvents: () => void;
  onShowChat: () => void;
  unreadMessages?: number;
};

export default function GameFloatingButtons({
  onShowMarketplace,
  onShowSpecialEvents,
  onShowChat,
  unreadMessages = 0
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
          onClick={onShowChat}
          className="relative w-14 h-14 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full shadow-lg transition-all hover:shadow-xl flex items-center justify-center"
          title="Chat"
        >
          <MessageCircle size={24} />
          {unreadMessages > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-bold"
            >
              {unreadMessages > 9 ? '9+' : unreadMessages}
            </motion.div>
          )}
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onShowMarketplace}
          className="w-14 h-14 bg-gradient-to-br from-amber-500 to-orange-600 text-white rounded-full shadow-lg transition-all hover:shadow-xl flex items-center justify-center text-xl"
          title="Marketplace"
        >
          🛍️
        </motion.button>
        
        <motion.button
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.9 }}
          onClick={onShowSpecialEvents}
          className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 text-white rounded-full shadow-lg transition-all hover:shadow-xl flex items-center justify-center text-xl"
          title="Special Events"
        >
          🎉
        </motion.button>
      </div>
    </motion.div>
  );
}