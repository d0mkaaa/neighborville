import type { Building, PowerGrid, WaterGrid } from "../../types/game";
import { Plus, Trash2, Home, Smile, Coffee, Book, Music, Zap, Lock, Sun, Droplets, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

type GameGridProps = {
  grid: (Building | null)[];
  gridSize: number;
  maxSize: number;
  selectedBuilding: Building | null;
  selectedTile: number | null;
  onTileClick: (index: number) => void;
  onDeleteBuilding: (index: number) => void;
  onBuildingManage: (building: Building, index: number) => void;
  powerGrid?: PowerGrid;
  waterGrid?: WaterGrid;
  onConnectUtility?: (fromIndex: number, toIndex: number, utilityType: "power" | "water") => void;
  showUtilityMode?: boolean;
};

export default function GameGrid({
  grid,
  gridSize,
  maxSize,
  selectedBuilding,
  selectedTile,
  onTileClick,
  onDeleteBuilding,
  onBuildingManage,
  powerGrid,
  waterGrid,
  onConnectUtility,
  showUtilityMode = false
}: GameGridProps) {
  const [activeUtility, setActiveUtility] = useState<"power" | "water" | null>(null);
  const [selectedSource, setSelectedSource] = useState<number | null>(null);

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

  const handleTileClick = (index: number) => {
    if (showUtilityMode && activeUtility && onConnectUtility) {
      const building = grid[index];
      if (!building) return;
      
      if (selectedSource === null) {
        if ((activeUtility === 'power' && building.isPowerGenerator) ||
            (activeUtility === 'water' && building.isWaterSupply)) {
          setSelectedSource(index);
        }
      } else if (selectedSource !== index) {
        onConnectUtility(selectedSource, index, activeUtility);
        setSelectedSource(null);
      }
    } else {
      onTileClick(index);
    }
  };

  const handleTileDoubleClick = (index: number) => {
    const building = grid[index];
    if (building && !selectedBuilding) {
      onBuildingManage(building, index);
    }
  };

  const handleDeleteBuilding = (index: number) => {
    if (typeof index === 'number' && !isNaN(index) && index >= 0 && index < grid.length) {
      onDeleteBuilding(index);
    }
  };

  const getBuildingStatus = (index: number, type: "power" | "water") => {
    const building = grid[index];
    if (!building) return "none";

    if (type === "power") {
      if (building.isPowerGenerator) return "generator";
      if (!building.needsElectricity) return "not-needed";
      if (building.isConnectedToPower) return "connected";
      return "disconnected";
    } else {
      if (building.isWaterSupply) return "supply";
      if (!building.needsWater) return "not-needed";
      if (building.isConnectedToWater) return "connected";
      return "disconnected";
    }
  };

  const toggleUtilityMode = (type: "power" | "water") => {
    if (activeUtility === type) {
      setActiveUtility(null);
      setSelectedSource(null);
    } else {
      setActiveUtility(type);
      setSelectedSource(null);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="font-medium lowercase text-gray-800">your neighborhood</h2>
        
        {showUtilityMode && (
          <div className="flex gap-2">
            <button 
              onClick={() => toggleUtilityMode("power")}
              className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 ${activeUtility === "power" ? "bg-yellow-100 text-yellow-700" : "bg-gray-100 text-gray-600"}`}
            >
              <Zap size={14} />
              Power
            </button>
            <button 
              onClick={() => toggleUtilityMode("water")}
              className={`px-3 py-1 rounded-lg text-sm flex items-center gap-1 ${activeUtility === "water" ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-600"}`}
            >
              <Droplets size={14} />
              Water
            </button>
          </div>
        )}
      </div>
      
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
          
          const building = grid[index];
          const isOccupiedHouse = building && 
                                (building.id === 'house' || building.id === 'apartment') && 
                                building.isOccupied;
          
          let powerStatus = showUtilityMode ? getBuildingStatus(index, "power") : null;
          let waterStatus = showUtilityMode ? getBuildingStatus(index, "water") : null;
          
          return (
            <motion.div
              key={index}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              layout
              onClick={() => handleTileClick(index)}
              onDoubleClick={() => handleTileDoubleClick(index)}
              className={`aspect-ratio-1 rounded-lg flex flex-col items-center justify-center cursor-pointer ${
                selectedTile === index ? 'ring-2 ring-emerald-500' : ''
              } ${
                !building ? 'bg-emerald-50 hover:bg-emerald-100' : 'text-white'
              } ${
                selectedSource === index ? 'ring-2 ring-yellow-400' : ''
              }`}
              style={{ 
                backgroundColor: building ? building.color : '',
              }}
            >
              {building ? (
                <motion.div 
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", damping: 12 }}
                  className="flex flex-col items-center relative w-full h-full justify-center"
                >
                  {building.icon && getIcon(building.icon)}
                  <span className="text-xs mt-1 lowercase font-medium">{building.name}</span>
                  
                  {isOccupiedHouse && (
                    <motion.div 
                      className="absolute top-1 right-1 bg-white bg-opacity-90 rounded-full p-0.5"
                      whileHover={{ scale: 1.2 }}
                    >
                      <div className="text-xs">👥</div>
                    </motion.div>
                  )}
                  
                  {building.income > 0 && (
                    <motion.div 
                      className="absolute bottom-1 right-1 bg-white bg-opacity-90 rounded-full p-0.5"
                      whileHover={{ scale: 1.2 }}
                    >
                      <div className="text-xs">💰</div>
                    </motion.div>
                  )}
                  
                  {showUtilityMode && (
                    <div className="absolute top-1 right-1 flex flex-col gap-1">
                      {powerStatus === "generator" && (
                        <div className="w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center">
                          <Zap size={10} className="text-yellow-800" />
                        </div>
                      )}
                      {powerStatus === "disconnected" && building.needsElectricity && (
                        <div className="w-4 h-4 bg-red-400 rounded-full flex items-center justify-center">
                          <AlertCircle size={10} className="text-red-800" />
                        </div>
                      )}
                      {waterStatus === "supply" && (
                        <div className="w-4 h-4 bg-blue-400 rounded-full flex items-center justify-center">
                          <Droplets size={10} className="text-blue-800" />
                        </div>
                      )}
                      {waterStatus === "disconnected" && building.needsWater && (
                        <div className="w-4 h-4 bg-red-400 rounded-full flex items-center justify-center">
                          <AlertCircle size={10} className="text-red-800" />
                        </div>
                      )}
                    </div>
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
    </div>
  );
}