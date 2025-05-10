import { motion, AnimatePresence } from "framer-motion";
import { X, Lock } from "lucide-react";
import type { Neighbor } from "../../types/game";

type NeighborListModalProps = {
  neighbors: Neighbor[];
  onClose: () => void;
};

export default function NeighborListModal({ neighbors, onClose }: NeighborListModalProps) {
  const unlockedNeighbors = neighbors.filter(n => n.unlocked);
  const lockedNeighbors = neighbors.filter(n => !n.unlocked);

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
            <span className="mr-2">👥</span>
            all neighbors
          </h2>
          <button 
            onClick={onClose}
            className="text-white hover:text-emerald-100 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5 overflow-y-auto max-h-[calc(80vh-100px)]">
          {unlockedNeighbors.length > 0 && (
            <div className="mb-6">
              <h3 className="text-emerald-800 font-medium lowercase mb-3">unlocked neighbors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {unlockedNeighbors.map(neighbor => (
                  <div key={neighbor.id} className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
                    <div className="flex items-center">
                      <div className="text-2xl mr-3">{neighbor.avatar}</div>
                      <div>
                        <div className="font-medium text-gray-700 lowercase">{neighbor.name}</div>
                        <div className="text-sm text-gray-500">{neighbor.trait}</div>
                        <div className="text-xs text-emerald-600 mt-1">
                          likes: {neighbor.likes} • dislikes: {neighbor.dislikes}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {lockedNeighbors.length > 0 && (
            <div>
              <h3 className="text-gray-700 font-medium lowercase mb-3">locked neighbors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {lockedNeighbors.map(neighbor => (
                  <div key={neighbor.id} className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center mr-3">
                        <Lock size={16} className="text-gray-500" />
                      </div>
                      <div>
                        <div className="font-medium text-gray-400 lowercase">locked neighbor</div>
                        <div className="text-sm text-gray-500">
                          {neighbor.unlockCondition?.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}