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
  const [dragStart, setDragStart] = useState<{
    index: number;
    type: "power" | "water";
  } | null>(null);
  const [dragPosition, setDragPosition] = useState<{
    x: number;
    y: number;
  } | null>(null);
  const [dragEnd, setDragEnd] = useState<number | null>(null);

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
        return type === "power" ? "bg-yellow-400" : "bg-blue-400";
      case "connected":
        return "bg-green-400";
      case "disconnected":
        return "bg-red-400";
      case "not-needed":
        return "bg-gray-300";
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

  const handleMouseDown = (
    e: React.MouseEvent,
    index: number,
    type: "power" | "water"
  ) => {
    const building = grid[index];
    if (!building) return;

    if (
      (type === "power" && !building.isPowerGenerator) ||
      (type === "water" && !building.isWaterSupply)
    )
      return;

    const rect = e.currentTarget.getBoundingClientRect();
    setDragStart({ index, type });
    setDragPosition({
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragStart || !dragPosition) return;

    setDragPosition({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleMouseUp = (e: React.MouseEvent, index: number) => {
    if (!dragStart) return;

    const building = grid[index];
    if (!building) return;

    const canConnect =
      dragStart.type === "power"
        ? building.needsElectricity
        : building.needsWater;

    if (canConnect && index !== dragStart.index) {
      const distance = calculateGridDistance(dragStart.index, index, Math.sqrt(gridSize));
      const maxDistance = dragStart.type === "power" ? 3 : 3;
      
      if (distance > maxDistance) {
        console.log(`Too far! ${dragStart.type === 'power' ? 'Power' : 'Water'} can only reach ${maxDistance} tiles away`);
      } else {
        onConnectUtility(dragStart.index, index, dragStart.type);
      }
    }

    setDragStart(null);
    setDragPosition(null);
    setDragEnd(null);
  };

  const handleMouseEnter = (index: number) => {
    if (!dragStart) return;
    setDragEnd(index);
  };

  const getLineCoordinates = () => {
    if (!dragStart || !dragPosition || !dragEnd) return null;

    const gridContainer = document.querySelector("[data-utility-grid]");
    if (!gridContainer) return null;

    const containerRect = gridContainer.getBoundingClientRect();
    const gridElements = gridContainer.querySelectorAll("[data-grid-index]");
    const startElement = gridElements[dragStart.index];
    const endElement = gridElements[dragEnd];

    if (!startElement || !endElement) return null;

    const startRect = startElement.getBoundingClientRect();
    const endRect = endElement.getBoundingClientRect();

    const startCenterX = startRect.left + startRect.width / 2;
    const startCenterY = startRect.top + startRect.height / 2;
    const endCenterX = endRect.left + endRect.width / 2;
    const endCenterY = endRect.top + endRect.height / 2;

    let startX = startCenterX;
    let startY = startCenterY;

    const dx = endCenterX - startCenterX;
    const dy = endCenterY - startCenterY;

    if (Math.abs(dx) > Math.abs(dy)) {
      if (dx > 0) {
        startX = startRect.right;
      } else {
        startX = startRect.left;
      }
    } else {
      if (dy > 0) {
        startY = startRect.bottom;
      } else {
        startY = startRect.top;
      }
    }

    return {
      x1: startX - containerRect.left,
      y1: startY - containerRect.top,
      x2: endCenterX - containerRect.left,
      y2: endCenterY - containerRect.top,
    };
  };

  const lineCoords = getLineCoordinates();

  return (
    <div className="bg-white rounded-xl shadow-md">
      <div className="p-4 border-b border-gray-100">
        <div className="grid grid-cols-2 gap-3">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowPowerGrid(!showPowerGrid)}
            className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg"
          >
            <div className="flex items-center">
              <Zap size={18} className="text-yellow-600 mr-2" />
              <div>
                <div className="text-sm font-medium text-gray-800">
                  power grid
                </div>
                <div className="text-xs text-gray-600">
                  {powerGrid.totalPowerProduction}/
                  {powerGrid.totalPowerConsumption} units
                </div>
              </div>
            </div>
            {showPowerGrid ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </motion.button>

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowWaterGrid(!showWaterGrid)}
            className="flex items-center justify-between p-3 bg-blue-50 rounded-lg"
          >
            <div className="flex items-center">
              <Droplets size={18} className="text-blue-600 mr-2" />
              <div>
                <div className="text-sm font-medium text-gray-800">
                  water grid
                </div>
                <div className="text-xs text-gray-600">
                  {waterGrid.totalWaterProduction}/
                  {waterGrid.totalWaterConsumption} units
                </div>
              </div>
            </div>
            {showWaterGrid ? (
              <ChevronUp size={16} />
            ) : (
              <ChevronDown size={16} />
            )}
          </motion.button>
        </div>
      </div>

      <AnimatePresence>
        {(showPowerGrid || showWaterGrid) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="p-4 bg-gray-50 relative"
            data-utility-grid
            onMouseMove={handleMouseMove}
            onMouseLeave={() => {
              setDragStart(null);
              setDragPosition(null);
              setDragEnd(null);
            }}
          >
            {lineCoords && (
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ width: "100%", height: "100%" }}
              >
                <line
                  x1={lineCoords.x1}
                  y1={lineCoords.y1}
                  x2={lineCoords.x2}
                  y2={lineCoords.y2}
                  stroke={dragStart?.type === "power" ? "#fbbf24" : "#3b82f6"}
                  strokeWidth="3"
                  strokeDasharray="5,5"
                />
              </svg>
            )}

            <div
              className="grid gap-1"
              style={{
                gridTemplateColumns: `repeat(${gridCols}, minmax(0, 1fr))`,
              }}
            >
              {Array.from({ length: gridSize }).map((_, index) => {
                const building = grid[index];
                const powerStatus = getBuildingStatus(index, "power");
                const waterStatus = getBuildingStatus(index, "water");

                return (
                  <motion.div
                    key={index}
                    data-grid-index={index}
                    whileHover={{ scale: 1.05 }}
                    onMouseDown={(e) => {
                      if (showPowerGrid && building?.isPowerGenerator) {
                        handleMouseDown(e, index, "power");
                      } else if (showWaterGrid && building?.isWaterSupply) {
                        handleMouseDown(e, index, "water");
                      }
                    }}
                    onMouseUp={(e) => handleMouseUp(e, index)}
                    onMouseEnter={() => handleMouseEnter(index)}
                    className="aspect-square relative cursor-pointer"
                    style={{
                      cursor:
                        (showPowerGrid && building?.isPowerGenerator) ||
                        (showWaterGrid && building?.isWaterSupply)
                          ? "pointer"
                          : "auto",
                    }}
                  >
                    {building && (
                      <div className="w-full h-full rounded border border-gray-300 overflow-hidden relative">
                        <div
                          className="w-full h-full opacity-50"
                          style={{ backgroundColor: building.color }}
                        />

                        {showPowerGrid && (
                          <div
                            className={`absolute inset-0 flex items-center justify-center`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full ${getStatusColor(
                                powerStatus,
                                "power"
                              )} flex items-center justify-center`}
                            >
                              {powerStatus === "generator" && (
                                <Zap size={10} className="text-white" />
                              )}
                              {powerStatus === "connected" && (
                                <CheckCircle size={10} className="text-white" />
                              )}
                              {powerStatus === "disconnected" && (
                                <XCircle size={10} className="text-white" />
                              )}
                            </div>
                          </div>
                        )}

                        {showWaterGrid && (
                          <div
                            className={`absolute inset-0 flex items-center justify-center`}
                          >
                            <div
                              className={`w-4 h-4 rounded-full ${getStatusColor(
                                waterStatus,
                                "water"
                              )} flex items-center justify-center`}
                            >
                              {waterStatus === "supply" && (
                                <Droplets size={10} className="text-white" />
                              )}
                              {waterStatus === "connected" && (
                                <CheckCircle size={10} className="text-white" />
                              )}
                              {waterStatus === "disconnected" && (
                                <XCircle size={10} className="text-white" />
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="mt-4 text-xs text-gray-600">
              <div className="flex flex-wrap gap-4">
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-yellow-400 rounded-full mr-1" />
                  Power Generator
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-blue-400 rounded-full mr-1" />
                  Water Supply
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-green-400 rounded-full mr-1" />
                  Connected
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-red-400 rounded-full mr-1" />
                  Disconnected
                </div>
                <div className="flex items-center">
                  <div className="w-3 h-3 bg-gray-300 rounded-full mr-1" />
                  Not Needed
                </div>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                Drag from generators/supplies to buildings to connect utilities. Power: 3 tiles, Water: 3 tiles
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}