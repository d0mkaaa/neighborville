import React from 'react';
import type { Building } from '../../types/game';
import { Home, Smile, Coffee, Book, Music, Zap, Sun } from 'lucide-react';

interface BuildingSelectorProps {
  buildings: Building[];
  onSelect: (building: Building) => void;
}

export default function BuildingSelector({ buildings, onSelect }: BuildingSelectorProps) {
  const getIcon = (iconName: string, color: string) => {
    const iconProps = {
      size: 24,
      className: 'text-white',
      color: 'white'
    };
    
    switch(iconName) {
      case 'Home': return <Home {...iconProps} />;
      case 'Smile': return <Smile {...iconProps} />;
      case 'Coffee': return <Coffee {...iconProps} />;
      case 'Book': return <Book {...iconProps} />;
      case 'Music': return <Music {...iconProps} />;
      case 'Zap': return <Zap {...iconProps} />;
      case 'Sun': return <Sun {...iconProps} />;
      default: return <Home {...iconProps} />;
    }
  };
  
  const buildingPairs = buildings.reduce((result, item, index) => {
    const pairIndex = Math.floor(index / 2);
    
    if (!result[pairIndex]) {
      result[pairIndex] = [];
    }
    
    result[pairIndex].push(item);
    
    return result;
  }, [] as Building[][]);
  
  return (
    <div className="bg-navy-900 rounded-xl p-3">
      {buildingPairs.map((pair, pairIndex) => (
        <div key={pairIndex} className="flex gap-3 mb-3 last:mb-0">
          {pair.map((building) => (
            <div
              key={building.id}
              onClick={() => onSelect(building)}
              className="flex-1 p-4 rounded-lg cursor-pointer flex flex-col items-center justify-center"
              style={{ backgroundColor: building.color + '33' }}
            >
              <div 
                className="w-12 h-12 rounded-full flex items-center justify-center mb-2"
                style={{ backgroundColor: building.color }}
              >
                {getIcon(building.icon, building.color)}
              </div>
              <div className="text-white text-sm font-medium">{building.cost}c</div>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}