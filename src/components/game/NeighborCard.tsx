import type { Neighbor } from "../../types/game";
import { motion } from "framer-motion";
import { Lock } from "lucide-react";

type NeighborCardProps = {
  neighbor: Neighbor;
  onClick: (neighbor: Neighbor) => void;
};

export default function NeighborCard({ neighbor, onClick }: NeighborCardProps) {
  if (!neighbor.unlocked) {
    return (
      <motion.div
        whileHover={{ 
          scale: 1.03,
          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
        }}
        whileTap={{ scale: 0.97 }}
        layoutId={`neighbor-card-locked-${neighbor.id}`}
        className="p-3 bg-gray-100 rounded-xl border border-gray-200 flex items-center shadow-sm"
      >
        <motion.div 
          className="text-2xl mr-3 bg-gray-200 w-10 h-10 rounded-full flex items-center justify-center"
        >
          <Lock size={16} className="text-gray-500" />
        </motion.div>
        <div>
          <div className="font-medium text-sm lowercase text-gray-500">locked neighbor</div>
          <div className="text-xs text-gray-400 lowercase">
            {neighbor.unlockCondition?.description}
          </div>
        </div>
      </motion.div>
    );
  }
  
  return (
    <motion.div
      whileHover={{ 
        scale: 1.03, 
        backgroundColor: "#f0fdf4",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)"
      }}
      whileTap={{ scale: 0.97 }}
      layoutId={`neighbor-card-${neighbor.id}`}
      onClick={() => onClick(neighbor)}
      className="p-3 bg-white rounded-xl border border-gray-100 flex items-center cursor-pointer transition-colors shadow-sm"
    >
      <motion.div 
        className="text-2xl mr-3 bg-emerald-50 w-10 h-10 rounded-full flex items-center justify-center"
        whileHover={{ scale: 1.2, rotate: [0, -5, 5, 0] }}
        transition={{ duration: 0.5 }}
      >
        {neighbor.avatar}
      </motion.div>
      <div>
        <div className="font-medium text-sm lowercase text-emerald-800">{neighbor.name}</div>
        <div className="text-xs text-gray-500 lowercase">{neighbor.trait}</div>
      </div>
    </motion.div>
  );
}