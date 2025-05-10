import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Home, User, Plus, Minus, DollarSign, Zap, TrendingUp, AlertTriangle } from "lucide-react";
import type { Building, Neighbor } from "../../types/game";

type BuildingInfoModalProps = {
  building: Building;
  gridIndex: number;
  neighbors: Neighbor[];
  onClose: () => void;
  onAssignResident: (neighborId: number, gridIndex: number) => void;
  onRemoveResident: (neighborId: number) => void;
  onCollectIncome: (gridIndex: number, amount: number) => void;
  grid: (Building | null)[];
};

export default function BuildingInfoModal({
  building,
  gridIndex,
  neighbors,
  onClose,
  onAssignResident,
  onRemoveResident,
  onCollectIncome,
  grid
}: BuildingInfoModalProps) {
  const [currentBuilding, setCurrentBuilding] = useState(building);
  
  useEffect(() => {
    const latestBuilding = grid[gridIndex];
    if (latestBuilding) {
      setCurrentBuilding(latestBuilding);
    }
  }, [grid, gridIndex]);
  
  const availableNeighbors = neighbors.filter(n => n.unlocked && !n.hasHome);
  const currentResidents = (currentBuilding.occupants || []).map(id => 
    neighbors.find(n => n.id === id)
  ).filter(Boolean) as Neighbor[];
  
  const dailyRent = currentResidents.reduce((total, resident) => total + (resident.dailyRent || 0), 0);
  const totalIncome = currentBuilding.income + dailyRent;
  const maxCapacity = currentBuilding.residentCapacity || 1;
  
  const compatibilityIssues = currentResidents.filter(resident => {
    const otherResidents = currentResidents.filter(r => r.id !== resident.id);
    return otherResidents.length >= (resident.maxNeighbors || 1);
  });
  
  const getCompatibleNeighbors = () => {
    return availableNeighbors.filter(neighbor => {
      if (neighbor.housingPreference === 'house' && currentBuilding.id === 'apartment') return false;
      if (neighbor.housingPreference === 'apartment' && currentBuilding.id === 'house') return false;
      
      if (currentResidents.some(r => r.id !== neighbor.id && currentResidents.length >= (neighbor.maxNeighbors || 1))) {
        return false;
      }
      
      return true;
    });
  };

  const canCollectIncome = currentBuilding.id !== 'house' && currentBuilding.id !== 'apartment' && totalIncome > 0;

  const handleAssignResident = (neighborId: number) => {
    onAssignResident(neighborId, gridIndex);
  };

  const handleRemoveResident = (neighborId: number) => {
    onRemoveResident(neighborId);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.3)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 20 }}
        className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 flex justify-between items-center" style={{ backgroundColor: currentBuilding.color }}>
          <div className="flex items-center">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center mr-3">
              <Home size={20} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-medium text-white lowercase">{currentBuilding.name} #{gridIndex}</h2>
              <div className="text-sm text-white/80">capacity: {currentResidents.length}/{maxCapacity}</div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="p-5">
          <div className="grid grid-cols-3 gap-3 mb-5">
            <div className="bg-gray-50 p-3 rounded-lg text-center">
              <div className="text-xs text-gray-500 uppercase">value</div>
              <div className="text-sm font-medium">{Math.floor(currentBuilding.cost * 0.5)}c</div>
            </div>
            <div className="bg-emerald-50 p-3 rounded-lg text-center">
              <div className="text-xs text-emerald-700 uppercase">income</div>
              <div className="text-sm font-medium text-emerald-600">{totalIncome}c/day</div>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg text-center">
              <div className="text-xs text-blue-700 uppercase">energy</div>
              <div className="text-sm font-medium text-blue-600">{currentBuilding.energyUsage}u</div>
            </div>
          </div>

          {compatibilityIssues.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center text-yellow-700 text-sm">
                <AlertTriangle size={16} className="mr-2" />
                {compatibilityIssues.length > 1 ? 'Multiple residents' : 'A resident'} may be uncomfortable with the current housing situation
              </div>
            </div>
          )}

          {canCollectIncome && (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onCollectIncome(gridIndex, totalIncome)}
              className="w-full mb-4 py-2 bg-emerald-500 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors"
            >
              <DollarSign size={16} />
              Collect {totalIncome} coins
            </motion.button>
          )}

          {(currentBuilding.id === 'house' || currentBuilding.id === 'apartment') && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">current residents</h3>
              
              {currentResidents.length > 0 ? (
                <div className="space-y-2 mb-4">
                  {currentResidents.map(resident => (
                    <div key={resident.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                      <div className="flex items-center">
                        <div className="text-2xl mr-2">{resident.avatar}</div>
                        <div>
                          <div className="text-sm font-medium text-gray-700">{resident.name}</div>
                          <div className="text-xs text-gray-500 flex items-center gap-2">
                            <span>Rent: {resident.dailyRent}c/day</span>
                            <span className={`px-1.5 py-0.5 rounded text-xs ${
                              (resident.happiness || 70) >= 80 ? 'bg-green-100 text-green-600' :
                              (resident.happiness || 70) >= 60 ? 'bg-yellow-100 text-yellow-600' :
                              'bg-red-100 text-red-600'
                            }`}>
                              {resident.happiness || 70}% happy
                            </span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveResident(resident.id)}
                        className="p-1 text-red-500 hover:text-red-600 transition-colors"
                      >
                        <Minus size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-400 text-sm mb-4 py-4 bg-gray-50 rounded-lg">
                  No residents yet
                </div>
              )}

              {currentResidents.length < maxCapacity && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">add residents</h3>
                  {getCompatibleNeighbors().length > 0 ? (
                    <div className="max-h-40 overflow-y-auto space-y-2">
                      {getCompatibleNeighbors().map(neighbor => (
                        <motion.div
                          key={neighbor.id}
                          whileHover={{ backgroundColor: "#f0fdf4" }}
                          className="flex items-center justify-between p-2 border border-gray-200 rounded-lg cursor-pointer"
                          onClick={() => handleAssignResident(neighbor.id)}
                        >
                          <div className="flex items-center">
                            <div className="text-2xl mr-2">{neighbor.avatar}</div>
                            <div>
                              <div className="text-sm font-medium text-gray-700">{neighbor.name}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                <span>Rent: {neighbor.dailyRent}c/day</span>
                                <span>Prefers: {neighbor.housingPreference}</span>
                              </div>
                            </div>
                          </div>
                          <Plus size={16} className="text-emerald-500" />
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-400 text-sm py-3 bg-gray-50 rounded-lg">
                      No compatible residents available
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}