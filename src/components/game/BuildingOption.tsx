import type { Building } from "../../types/game";
import { Home, Smile, Coffee, Book, Music, Zap } from "lucide-react";

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
      case 'Home': return <Home size={24} className="text-white" />;
      case 'Smile': return <Smile size={24} className="text-white" />;
      case 'Coffee': return <Coffee size={24} className="text-white" />;
      case 'Book': return <Book size={24} className="text-white" />;
      case 'Music': return <Music size={24} className="text-white" />;
      case 'Zap': return <Zap size={24} className="text-white" />;
      default: return null;
    }
  };
  
  return (
    <button
      onClick={() => onSelect(building)}
      className={`building-option ${
        isSelected ? 'ring-2 ring-indigo-500' : ''
      }`}
      style={{ backgroundColor: `${building.color}20` }}
    >
      <div 
        className="w-10 h-10 rounded-full flex items-center justify-center mb-1"
        style={{ backgroundColor: building.color }}
      >
        {getIcon()}
      </div>
      <div className="text-xs font-medium font-game">{building.name}</div>
      <div className="text-xs text-gray-500 font-game">{building.cost}c</div>
    </button>
  );
}