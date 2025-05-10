import type { Building } from "../../types/game";
import { Plus, Trash2, Home, Smile, Coffee, Book, Music, Zap, Lock, Sun } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

type GameGridProps = {
  grid: (Building | null)[];
  gridSize: number;
  maxSize: number;
  selectedBuilding: Building | null;
  selectedTile: number | null;
  onTileClick: (index: number) => void;
  onDeleteBuilding: (index: number) => void;
  onBuildingManage: (building: Building, index: number) => void;
};

export default function GameGrid({
  grid,
  gridSize,
  maxSize,
  selectedBuilding,
  selectedTile,
  onTileClick,
  onDeleteBuilding,
  onBuildingManage
}: GameGridProps) {
  const getIcon = (iconName: string, size: number = 20) => {
    switch(iconName) {
      case 'Home': return <Home size={size} />;
      case 'Smile': return <Smile size={size} />;
      case 'Coffee': return <Coffee size={size} />;
      case 'Book': return <Book size={size} />;
      case 'Music': return <Music size={size} />;
      case 'Zap': return <Zap size={size} />;
      case 'Sun': return <Sun size={size} />;
      default: return null;
    }
  };

  const getGridDimensions = (size: number) => {
    const sqrt = Math.sqrt(size);
    return {
      rows: sqrt,
      cols: sqrt
    };
  };
  
  const { rows, cols } = getGridDimensions(maxSize);
  const currentDimensions = getGridDimensions(gridSize);

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <h2 className="font-medium mb-4 lowercase text-gray-800">your neighborhood</h2>
      
      <div 
        className="grid gap-2"
        style={{ 
          gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`
        }}
      >
        {Array.from({ length: maxSize }).map((_, index) => {
          const isWithinCurrentGrid = index < gridSize;
          const isExpansionTile = !isWithinCurrentGrid;
          const currentRow = Math.floor(index / cols);
          const currentCol = index % cols;
          
          const isBorderTile = 
            (currentRow < currentDimensions.rows && currentCol >= currentDimensions.cols) ||
            (currentRow >= currentDimensions.rows && currentCol < currentDimensions.cols);
          
          if (isExpansionTile) {
            return (
              <motion.div
                key={index}
                className={`aspect-ratio-1 rounded-lg flex flex-col items-center justify-center ${
                  isBorderTile ? 'bg-gray-100 opacity-50' : 'bg-gray-50 opacity-30'
                }`}
              >
                <Lock size={16} className="text-gray-300" />
              </motion.div>
            );
          }
          
          const isOccupiedHouse = grid[index] && 
                                (grid[index]?.id === 'house' || grid[index]?.id === 'apartment') && 
                                grid[index]?.isOccupied;
          
          const handleClick = () => {
            if (grid[index] && !selectedBuilding) {
              onBuildingManage(grid[index]!, index);
            } else {
              onTileClick(index);
            }
          };
          
          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              layout
              onClick={handleClick}
              className={`aspect-ratio-1 rounded-lg flex flex-col items-center justify-center cursor-pointer ${
                selectedTile === index ? 'ring-2 ring-emerald-500' : ''
              } ${
                !grid[index] ? 'bg-emerald-50 hover:bg-emerald-100' : 'text-white'
              }`}
              style={{ 
                backgroundColor: grid[index] ? grid[index].color : '',
              }}
            >
              {grid[index] ? (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="flex flex-col items-center relative w-full h-full justify-center"
                >
                  {getIcon(grid[index].icon)}
                  <span className="text-xs mt-1 lowercase font-medium">{grid[index].name}</span>
                  
                  {isOccupiedHouse && (
                    <motion.div 
                      className="absolute top-1 right-1 bg-white bg-opacity-90 rounded-full p-0.5"
                      whileHover={{ scale: 1.2 }}
                    >
                      <div className="text-xs">👥</div>
                    </motion.div>
                  )}
                  
                  {grid[index].income > 0 && (
                    <motion.div 
                      className="absolute bottom-1 right-1 bg-white bg-opacity-90 rounded-full p-0.5"
                      whileHover={{ scale: 1.2 }}
                    >
                      <div className="text-xs">💰</div>
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                selectedBuilding && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 10 }}
                  >
                    <Plus size={16} className="text-emerald-400" />
                  </motion.div>
                )
              )}
            </motion.div>
          );
        })}
      </div>
      
      <AnimatePresence>
        {selectedTile !== null && grid[selectedTile] && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ type: "spring", damping: 20 }}
            className="mt-4 p-3 bg-emerald-50 rounded-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <motion.div 
                  whileHover={{ scale: 1.1 }}
                  className="w-8 h-8 rounded-full flex items-center justify-center mr-2 text-white"
                  style={{ backgroundColor: grid[selectedTile]?.color }}
                >
                  {grid[selectedTile]?.icon && getIcon(grid[selectedTile]!.icon, 16)}
                </motion.div>
                <div>
                  <div className="font-medium lowercase text-gray-800">{grid[selectedTile]?.name}</div>
                  <div className="text-xs text-gray-700 lowercase flex flex-wrap gap-x-2">
                    <span>value: {Math.floor((grid[selectedTile]?.cost || 0) * 0.5)} coins</span>
                    <span>happiness: +{grid[selectedTile]?.happiness}</span>
                    <span>income: {grid[selectedTile]?.income} coins/day</span>
                    {grid[selectedTile]?.energyUsage !== undefined && (
                      <span>energy: {grid[selectedTile]?.energyUsage > 0 ? '+' : ''}{grid[selectedTile]?.energyUsage} units</span>
                    )}
                    {(grid[selectedTile]?.id === 'house' || grid[selectedTile]?.id === 'apartment') && (
                      <span>
                        {grid[selectedTile]?.isOccupied ? 'occupied' : 'vacant'}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              
              <div className="flex gap-2">
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: "#f0fdf4" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onBuildingManage(grid[selectedTile]!, selectedTile)}
                  className="p-2 bg-emerald-100 text-emerald-600 rounded-lg hover:bg-emerald-200 transition-colors"
                >
                  <Home size={16} />
                </motion.button>
                
                <motion.button
                  whileHover={{ scale: 1.1, backgroundColor: "#fee2e2" }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => onDeleteBuilding(selectedTile)}
                  className="p-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
                >
                  <Trash2 size={16} />
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}