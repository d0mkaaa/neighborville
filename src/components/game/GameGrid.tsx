import type { Building } from "../../types/game";
import { Plus, Trash2, Home, Smile, Coffee, Book, Music, Zap } from "lucide-react";

type GameGridProps = {
  grid: (Building | null)[];
  selectedBuilding: Building | null;
  selectedTile: number | null;
  onTileClick: (index: number) => void;
  onDeleteBuilding: (index: number) => void;
};

export default function GameGrid({
  grid,
  selectedBuilding,
  selectedTile,
  onTileClick,
  onDeleteBuilding
}: GameGridProps) {
  const getIcon = (iconName: string, size: number = 24) => {
    switch(iconName) {
      case 'Home': return <Home size={size} />;
      case 'Smile': return <Smile size={size} />;
      case 'Coffee': return <Coffee size={size} />;
      case 'Book': return <Book size={size} />;
      case 'Music': return <Music size={size} />;
      case 'Zap': return <Zap size={size} />;
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm p-4">
      <h2 className="font-semibold mb-4 font-game text-lg text-indigo-800">Your Neighborhood</h2>
      
      <div className="grid grid-cols-6 gap-2">
        {grid.map((tile, index) => (
          <div
            key={index}
            onClick={() => onTileClick(index)}
            className={`tile ${
              selectedTile === index ? 'ring-2 ring-indigo-500' : ''
            } ${
              !tile ? 'bg-gray-100 hover:bg-gray-200 empty-tile' : 'text-white'
            }`}
            style={{ 
              backgroundColor: tile ? tile.color : '',
            }}
          >
            {tile ? (
              <div className="flex flex-col items-center">
                {getIcon(tile.icon)}
                <span className="text-xs mt-1 font-game">{tile.name}</span>
              </div>
            ) : (
              selectedBuilding && <Plus size={20} className="text-gray-400" />
            )}
          </div>
        ))}
      </div>
      
      {selectedTile !== null && grid[selectedTile] && (
        <div className="mt-4 p-3 bg-gray-50 rounded-lg animate-in opacity-100 transform translate-y-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <div 
                className="w-8 h-8 rounded-full flex items-center justify-center mr-2 text-white"
                style={{ backgroundColor: grid[selectedTile]?.color }}
              >
                {grid[selectedTile]?.icon && getIcon(grid[selectedTile]!.icon, 16)}
              </div>
              <div>
                <div className="font-medium font-game text-indigo-800">{grid[selectedTile]?.name}</div>
                <div className="text-xs text-gray-500 font-game">
                  Value: {Math.floor((grid[selectedTile]?.cost || 0) * 0.5)} coins | 
                  Happiness: +{grid[selectedTile]?.happiness}
                </div>
              </div>
            </div>
            
            <button
              onClick={() => onDeleteBuilding(selectedTile)}
              className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}