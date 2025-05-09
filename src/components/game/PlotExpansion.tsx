import { useState } from "react";
import { motion } from "framer-motion";
import { LockOpen, Lock, ChevronRight, TrendingUp } from "lucide-react";

type PlotExpansionProps = {
  currentSize: number;
  maxSize: number;
  coins: number;
  onExpand: (newSize: number, cost: number) => void;
};

export default function PlotExpansion({ 
  currentSize, 
  maxSize, 
  coins, 
  onExpand 
}: PlotExpansionProps) {
  const [showDetails, setShowDetails] = useState(false);
  
  const getNextExpansion = () => {
    if (currentSize >= maxSize) return null;
    
    let nextSize = 0;
    let cost = 0;
    
    if (currentSize === 16) {
      nextSize = 25; // 5x5
      cost = 1500;
    } else if (currentSize === 25) {
      nextSize = 36; // 6x6
      cost = 3000;
    } else if (currentSize === 36) {
      nextSize = 49; // 7x7
      cost = 5000;
    } else if (currentSize === 49) {
      nextSize = 64; // 8x8
      cost = 8000;
    }
    
    return { nextSize, cost };
  };
  
  const nextExpansion = getNextExpansion();
  
  if (!nextExpansion) {
    return (
      <div className="bg-white rounded-xl shadow-md p-4 text-center">
        <div className="text-emerald-700 font-medium mb-2 lowercase">max plot size reached</div>
        <p className="text-sm text-gray-500 lowercase">you've expanded your neighborhood to its maximum size</p>
      </div>
    );
  }
  
  const canAfford = coins >= nextExpansion.cost;
  
  const getGridSizeLabel = (size: number) => {
    const dimension = Math.sqrt(size);
    return `${dimension}×${dimension}`;
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div 
        className="p-4 cursor-pointer" 
        onClick={() => setShowDetails(!showDetails)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center text-purple-600 mr-3">
              <TrendingUp size={16} />
            </div>
            <div>
              <h3 className="font-medium lowercase text-gray-800">expand your plot</h3>
              <p className="text-xs text-gray-500 lowercase">
                current size: {getGridSizeLabel(currentSize)}
              </p>
            </div>
          </div>
          <motion.div
            animate={{ rotate: showDetails ? 90 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronRight size={20} className="text-gray-400" />
          </motion.div>
        </div>
      </div>
      
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          className="bg-gray-50 p-4 border-t border-gray-100"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-gray-600 lowercase text-sm">next expansion</div>
              <div className="font-medium text-gray-800 lowercase">
                {getGridSizeLabel(currentSize)} → {getGridSizeLabel(nextExpansion.nextSize)}
              </div>
            </div>
            <div className="text-right">
              <div className="text-gray-600 lowercase text-sm">cost</div>
              <div className={`font-medium lowercase ${canAfford ? 'text-emerald-600' : 'text-red-500'}`}>
                {nextExpansion.cost} coins
              </div>
            </div>
          </div>
          
          <div className="flex items-center justify-between mb-4">
            <div className="w-full bg-gray-200 h-1 rounded-full overflow-hidden">
              <div 
                className="bg-purple-500 h-full" 
                style={{ width: `${(currentSize / maxSize) * 100}%` }}
              ></div>
            </div>
            <div className="ml-3 text-xs text-gray-500">{Math.floor((currentSize / maxSize) * 100)}%</div>
          </div>
          
          <div className="text-sm text-gray-600 mb-4 lowercase">
            expanding your plot allows you to build more structures and create a larger neighborhood
          </div>
          
          <motion.button
            whileHover={{ scale: canAfford ? 1.03 : 1 }}
            whileTap={{ scale: canAfford ? 0.97 : 1 }}
            onClick={() => canAfford && onExpand(nextExpansion.nextSize, nextExpansion.cost)}
            className={`w-full py-2 px-4 rounded-lg flex items-center justify-center ${
              canAfford 
                ? 'bg-purple-600 text-white hover:bg-purple-700' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            } transition-colors lowercase`}
            disabled={!canAfford}
          >
            {canAfford ? (
              <>
                <LockOpen size={16} className="mr-2" />
                purchase expansion
              </>
            ) : (
              <>
                <Lock size={16} className="mr-2" />
                not enough coins
              </>
            )}
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}