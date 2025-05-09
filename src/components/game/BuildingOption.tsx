import type { Building } from "../../types/game";
import { Home, Smile, Coffee, Book, Music, Zap } from "lucide-react";
import { motion } from "framer-motion";

type BuildingOptionProps = {
  building: Building;
  isSelected: boolean;
  onSelect: (building: Building) => void;
};

export default function BuildingOption({ 
  building, 
  isSelected, 
  onSelect 
}: BuildingOptionProps) {
  const getIcon = () => {
    switch(building.icon) {
      case 'Home': return <Home size={20} className="text-white" />;
      case 'Smile': return <Smile size={20} className="text-white" />;
      case 'Coffee': return <Coffee size={20} className="text-white" />;
      case 'Book': return <Book size={20} className="text-white" />;
      case 'Music': return <Music size={20} className="text-white" />;
      case 'Zap': return <Zap size={20} className="text-white" />;
      default: return null;
    }
  };
  
  return (
    <motion.div
      whileHover={{ 
        scale: 1.05, 
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" 
      }}
      whileTap={{ scale: 0.95 }}
      layout
      onClick={() => onSelect(building)}
      className={`overflow-hidden relative rounded-xl cursor-pointer ${
        isSelected ? 'ring-2 ring-emerald-500' : ''
      }`}
      style={{ 
        background: `linear-gradient(135deg, ${building.color}22, ${building.color}11)` 
      }}
    >
      <div className="p-3">
        <motion.div 
          initial={{ scale: 0.9 }}
          animate={{ scale: isSelected ? 1.1 : 1 }}
          transition={{ duration: 0.2 }}
          className="w-10 h-10 rounded-full flex items-center justify-center mb-2 mx-auto shadow-md"
          style={{ 
            background: `linear-gradient(135deg, ${building.color}, ${building.color}dd)`
          }}
        >
          {getIcon()}
        </motion.div>
        <div className="text-center">
          <div className="text-sm font-medium lowercase text-gray-800">{building.name}</div>
          <div className="text-xs text-gray-500 lowercase">{building.cost}c</div>
        </div>
      </div>
      
      {isSelected && (
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