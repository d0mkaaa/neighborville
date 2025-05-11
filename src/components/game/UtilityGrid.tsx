import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Zap,
  Droplets,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import type {
  Building,
  PowerGridState,
  WaterGridState,
} from "../../types/game";

type UtilityGridProps = {
  grid: (Building | null)[];
  powerGrid: PowerGridState;
  waterGrid: WaterGridState;
  onConnectUtility: (
    fromIndex: number,
    toIndex: number,
    utilityType: "power" | "water"
  ) => void;
  gridSize: number;
};

export default function UtilityGrid({
  grid,
  powerGrid,
  waterGrid,
  onConnectUtility,
  gridSize,
}: UtilityGridProps) {
  const [showPowerGrid, setShowPowerGrid] = useState(false);
  const [showWaterGrid, setShowWaterGrid] = useState(false);
  const [activeUtility, setActiveUtility] = useState<"power" | "water" | null>(null);
  const [selectedSource, setSelectedSource] = useState<number | null>(null);
  const [hoveredTarget, setHoveredTarget] = useState<number | null>(null);

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

  const getStatusColor = (status: string, type: "power" | "water") => {
    switch (status) {
      case "generator":
      case "supply":
        return type === "power" ? "bg-yellow-400 border-yellow-500" : "bg-blue-400 border-blue-500";
      case "connected":
        return "bg-green-400 border-green-500";
      case "disconnected":
        return "bg-red-400 border-red-500";
      case "not-needed":
        return "bg-gray-300 border-gray-400";
      default:
        return "transparent";
    }
  };

  const calculateGridDistance = (index1: number, index2: number, gridCols: number): number => {
    const x1 = index1 % gridCols;
    const y1 = Math.floor(index1 / gridCols);
    const x2 = index2 % gridCols;
    const y2 = Math.floor(index2 / gridCols);
    return Math.abs(x1 - x2) + Math.abs(y1 - y2);
  };

  const gridCols = Math.sqrt(gridSize);

  const handleUtilityClick = (type: "power" | "water") => {
    if (activeUtility === type) {
      setActiveUtility(null);
      setSelectedSource(null);
    } else {
      setActiveUtility(type);
      setSelectedSource(null);
    }
  };

  const handleTileClick = (index: number) => {
    if (!activeUtility) return;
    
    const building = grid[index];
    if (!building) return;

    const isSource = activeUtility === "power" ? building.isPowerGenerator : building.isWaterSupply;
    const needsUtility = activeUtility === "power" ? building.needsElectricity : building.needsWater;
    
    if (isSource) {
      setSelectedSource(selectedSource === index ? null : index);
    } else if (needsUtility && selectedSource !== null) {
      const distance = calculateGridDistance(selectedSource, index, gridCols);
      const maxDistance = 3;
      
      if (distance <= maxDistance) {
        onConnectUtility(selectedSource, index, activeUtility);
        setSelectedSource(null);
      }
    }
  };

  const isConnectable = (index: number): boolean => {
    if (!activeUtility || selectedSource === null) return false;
    
    const building = grid[index];
    if (!building) return false;
    
    const needsUtility = activeUtility === "power" ? building.needsElectricity : building.needsWater;
    const distance = calculateGridDistance(selectedSource, index, gridCols);
    
    return needsUtility && distance <= 3;
  };

  const getConnectionLine = (from: number, to: number) => {
    const cols = Math.sqrt(gridSize);
    const fromX = (from % cols) * 40 + 20;
    const fromY = Math.floor(from / cols) * 40 + 20;
    const toX = (to % cols) * 40 + 20;
    const toY = Math.floor(to / cols) * 40 + 20;
    
    return { fromX, fromY, toX, toY };
  };

  const connections = activeUtility === "power" 
    ? powerGrid.connectedBuildings.map(index => {
        const building = grid[index];
        return building?.connectedBuildings?.map(sourceIndex => [sourceIndex, index]) || [];
      }).flat()
    : waterGrid.connectedBuildings.map(index => {
        const building = grid[index];
        return building?.connectedBuildings?.map(sourceIndex => [sourceIndex, index]) || [];
      }).flat();

  return (
    <div className="bg-white rounded-xl shadow-md">
      <div className="p-4 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleUtilityClick("power")}
            className={`flex items-center justify-between p-3 rounded-lg ${
              activeUtility === "power" ? "bg-yellow-100 border-yellow-500 border" : "bg-yellow-50"
            }`}
          >
            <div className="flex items-center">
              <Zap size={18} className="text-yellow-600 mr-2" />
              <div>
                <div className="text-sm font-medium text-gray-800">power grid</div>
                <div className="text-xs text-gray-600">
                  {powerGrid.totalPowerProduction}/{powerGrid.totalPowerConsumption} units
                </div>
              </div>
            </div>
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleUtilityClick("water")}
            className={`flex items-center justify-between p-3 rounded-lg ${
              activeUtility === "water" ? "bg-blue-100 border-blue-500 border" : "bg-blue-50"
            }`}
          >
            <div className="flex items-center">
              <Droplets size={18} className="text-blue-600 mr-2" />
              <div>
                <div className="text-sm font-medium text-gray-800">water grid</div>
                <div className="text-xs text-gray-600">
                  {waterGrid.totalWaterProduction}/{waterGrid.totalWaterConsumption} units
                </div>
              </div>
            </div>
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {activeUtility && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-gray-50 relative overflow-hidden"
          >
            <div className="relative mb-4" style={{ height: `${Math.sqrt(gridSize) * 40}px` }}>
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ width: "100%", height: "100%" }}
              >
                {connections.map(([from, to], i) => {
                  const line = getConnectionLine(from, to);
                  return (
                    <line
                      key={i}
                      x1={line.fromX}
                      y1={line.fromY}
                      x2={line.toX}
                      y2={line.toY}
                      stroke={activeUtility === "power" ? "#eab308" : "#3b82f6"}
                      strokeWidth="2"
                    />
                  );
                })}
                
                {selectedSource !== null && hoveredTarget !== null && isConnectable(hoveredTarget) && (
                  <line
                    x1={getConnectionLine(selectedSource, hoveredTarget).fromX}
                    y1={getConnectionLine(selectedSource, hoveredTarget).fromY}
                    x2={getConnectionLine(selectedSource, hoveredTarget).toX}
                    y2={getConnectionLine(selectedSource, hoveredTarget).toY}
                    stroke={activeUtility === "power" ? "#facc15" : "#60a5fa"}
                    strokeWidth="3"
                    strokeDasharray="5,5"
                  />
                )}
              </svg>

              <div
                className="grid gap-2"
                style={{
                  gridTemplateColumns: `repeat(${gridCols}, 40px)`,
                  gridTemplateRows: `repeat(${gridCols}, 40px)`
                }}
              >
                {Array.from({ length: gridSize }).map((_, index) => {
                  const building = grid[index];
                  const status = getBuildingStatus(index, activeUtility);
                  const isSelected = selectedSource === index;
                  const isTargetable = isConnectable(index);
                  
                  return (
                    <motion.div
                      key={index}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleTileClick(index)}
                      onMouseEnter={() => setHoveredTarget(index)}
                      onMouseLeave={() => setHoveredTarget(null)}
                      className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center cursor-pointer transition-all ${
                        isSelected ? "ring-4 ring-offset-2 ring-blue-400" : ""
                      } ${isTargetable ? "ring-2 ring-green-400" : ""} ${
                        status === "none" ? "bg-gray-100 border-gray-300" : getStatusColor(status, activeUtility)
                      }`}
                    >
                      {building && (
                        <div className="w-full h-full flex items-center justify-center">
                          {status === "generator" && <Zap size={16} className="text-white" />}
                          {status === "supply" && <Droplets size={16} className="text-white" />}
                          {status === "connected" && <CheckCircle size={16} className="text-white" />}
                          {status === "disconnected" && <XCircle size={16} className="text-white" />}
                          {status === "not-needed" && <div className="w-2 h-2 bg-gray-600 rounded-full" />}
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            <div className="text-xs text-gray-600">
              <div className="flex flex-wrap gap-4 mb-2">
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-yellow-400 border-yellow-500 border rounded mr-1" />
                  Power Generator
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-blue-400 border-blue-500 border rounded mr-1" />
                  Water Supply
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-green-400 border-green-500 border rounded mr-1" />
                  Connected
                </div>
                <div className="flex items-center">
                  <div className="w-4 h-4 bg-red-400 border-red-500 border rounded mr-1" />
                  Disconnected
                </div>
              </div>
              <div className="text-xs text-gray-500">
                Click a {activeUtility === "power" ? "power generator" : "water supply"} to select it, then click buildings within 3 tiles to connect them.
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}