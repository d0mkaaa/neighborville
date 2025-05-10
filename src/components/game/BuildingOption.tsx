import type { Building } from "../../types/game";
import { Home, Smile, Coffee, Book, Music, Zap, Sun, Lock, Droplets, Waves, Utensils, Code, Film } from "lucide-react";
import { motion } from "framer-motion";

type BuildingOptionProps = {
  building: Building;
  isSelected: boolean;
  onSelect: (building: Building) => void;
  playerLevel?: number;
};

export default function BuildingOption({ 
  building, 
  isSelected, 
  onSelect,
  playerLevel = 1
}: BuildingOptionProps) {
  const getIcon = () => {
    switch(building.icon) {
      case 'Home': return <Home size={20} className="text-white" />;
      case 'Smile': return <Smile size={20} className="text-white" />;
      case 'Coffee': return <Coffee size={20} className="text-white" />;
      case 'Book': return <Book size={20} className="text-white" />;
      case 'Music': return <Music size={20} className="text-white" />;
      case 'Zap': return <Zap size={20} className="text-white" />;
      case 'Sun': return <Sun size={20} className="text-white" />;
      default: return <Home size={20} className="text-white" />;
    }
  };

  const isLocked = building.levelRequired && playerLevel < building.levelRequired;
  
  return (
    <motion.div
      whileHover={{ 
        scale: isLocked ? 1 : 1.05, 
        boxShadow: isLocked ? undefined : "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
      }}
      whileTap={{ scale: isLocked ? 1 : 0.95 }}
      layout
      onClick={() => !isLocked && onSelect(building)}
      className={`relative overflow-hidden rounded-xl cursor-pointer ${
        isSelected ? 'ring-2 ring-emerald-500' : ''
      } ${isLocked ? 'opacity-60' : ''}`}
      style={{ 
        background: isLocked ? '#f3f4f6' : `linear-gradient(135deg, ${building.color}22, ${building.color}11)` 
      }}
    >
      <div className="p-3">
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: isSelected ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
          className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 mx-auto shadow-md relative ${
            isLocked ? 'bg-gray-300' : ''
          }`}
          style={{ 
            background: isLocked ? undefined : `linear-gradient(135deg, ${building.color}, ${building.color}dd)`
          }}
        >
          {isLocked ? (
            <Lock size={16} className="text-gray-500" />
          ) : (
            getIcon()
          )}
        </motion.div>
        <div className="text-center">
          <div className={`text-sm font-medium lowercase ${isLocked ? 'text-gray-500' : 'text-gray-800'}`}>
            {building.name}
          </div>
          <div className={`text-xs lowercase ${isLocked ? 'text-gray-400' : 'text-gray-500'}`}>
            {isLocked ? `Level ${building.levelRequired} required` : `${building.cost}c`}
          </div>
        </div>
      </div>
      
      {isSelected && !isLocked && (
        <motion.div 
          layoutId={`selected-${building.id}`}
          className="absolute bottom-0 left-0 right-0 h-1 bg-emerald-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
    </motion.div>
  );
}