import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Home, User, Plus, Minus, DollarSign, Zap, TrendingUp, AlertTriangle, Move, Trash2, RotateCw, ArrowUp } from "lucide-react";
import type { Building, Neighbor, BuildingUpgrade } from "../../types/game";
import { getAvailableUpgrades, calculateUpgradedStats } from "../../data/upgrades";

type BuildingInfoModalProps = {
  building: Building;
  gridIndex: number;
  neighbors: Neighbor[];
  onClose: () => void;
  onAssignResident: (neighborId: number, gridIndex: number) => void;
  onRemoveResident: (neighborId: number) => void;
  onCollectIncome: (gridIndex: number, amount: number) => void;
  onMoveBuilding: (fromIndex: number) => void;
  onUpgradeBuilding: (gridIndex: number, upgradeId: string) => void;
  onDemolishBuilding: (gridIndex: number) => void;
  grid: (Building | null)[];
  coins: number;
};

export default function BuildingInfoModal({
  building,
  gridIndex,
  neighbors,
  onClose,
  onAssignResident,
  onRemoveResident,
  onCollectIncome,
  onMoveBuilding,
  onUpgradeBuilding,
  onDemolishBuilding,
  grid,
  coins
}: BuildingInfoModalProps) {
  const [currentBuilding, setCurrentBuilding] = useState(building);
  const [activeTab, setActiveTab] = useState('info');
  const [selectedUpgrade, setSelectedUpgrade] = useState<string | null>(null);

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
      if (neighbor.housingPreference === 'house' && currentBuilding.id.includes('apartment')) return false;
      if (neighbor.housingPreference === 'apartment' && currentBuilding.id.includes('house')) return false;
      
      if (currentResidents.some(r => r.id !== neighbor.id && currentResidents.length >= (neighbor.maxNeighbors || 1))) {
        return false;
      }
      
      return true;
    });
  };

  const canCollectIncome = currentBuilding.id !== 'house' && currentBuilding.id !== 'apartment' && totalIncome > 0;
  const demolishValue = Math.floor(currentBuilding.cost * 0.5);
  const currentLevel = currentBuilding.level || 0;
  const availableUpgrades = getAvailableUpgrades(currentBuilding.id, currentLevel);
  const upgradeAvailable = availableUpgrades.length > 0;
  
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
              <div className="text-sm text-white/80">
                {currentBuilding.id.includes('house') || currentBuilding.id.includes('apartment') ? 
                  `Capacity: ${currentResidents.length}/${maxCapacity}` :
                  `${currentBuilding.needsElectricity && !currentBuilding.isConnectedToPower ? 'No Power' :
                    currentBuilding.needsWater && !currentBuilding.isConnectedToWater ? 'No Water' : 'Active'}`
                }
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-3 pt-3">
          <div className="flex border-b border-gray-200">
            <button
              onClick={() => setActiveTab('info')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'info' ? 'text-emerald-600 border-b-2 border-emerald-500' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Overview
            </button>
            {upgradeAvailable && (
              <button
                onClick={() => setActiveTab('upgrades')}
                className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'upgrades' ? 'text-purple-600 border-b-2 border-purple-500' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Upgrades
              </button>
            )}
            <button
              onClick={() => setActiveTab('management')}
              className={`px-4 py-2 text-sm font-medium transition-colors ${activeTab === 'management' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
            >
              Management
            </button>
          </div>
        </div>
        
        <div className="p-5">
          {activeTab === 'info' && (
            <>
              <div className="grid grid-cols-3 gap-3 mb-5">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <div className="text-xs text-gray-500 uppercase">Value</div>
                  <div className="text-sm font-medium">{demolishValue}c</div>
                </div>
                <div className="bg-emerald-50 p-3 rounded-lg text-center">
                  <div className="text-xs text-emerald-700 uppercase">Income</div>
                  <div className="text-sm font-medium text-emerald-600">{totalIncome}c/day</div>
                </div>
                <div className="bg-blue-50 p-3 rounded-lg text-center">
                  <div className="text-xs text-blue-700 uppercase">Energy</div>
                  <div className="text-sm font-medium text-blue-600">{currentBuilding.energyUsage || 0}u</div>
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
                  className="w-full py-2 mb-4 bg-emerald-500 text-white rounded-lg flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors"
                >
                  <DollarSign size={16} />
                  Collect {totalIncome}c
                </motion.button>
              )}

              {(currentBuilding.id.includes('house') || currentBuilding.id.includes('apartment')) && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-3">Current Residents</h3>
                  
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
                                  (resident.happiness !== undefined ? resident.happiness : 70) >= 80 ? 'bg-green-100 text-green-600' :
                                  (resident.happiness !== undefined ? resident.happiness : 70) >= 60 ? 'bg-yellow-100 text-yellow-600' :
                                  'bg-red-100 text-red-600'
                                }`}>
                                  {resident.happiness !== undefined ? resident.happiness : 70}% happy
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
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Add Residents</h3>
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
            </>
          )}

          {activeTab === 'upgrades' && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Building Upgrades</h3>
              <p className="text-sm text-gray-600 mb-4">
                Current Level: {currentLevel} {currentLevel >= (currentBuilding.maxLevel || 3) ? '(Max)' : ''}
              </p>
              
              {availableUpgrades.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No upgrades available for this building
                </div>
              ) : (
                <div className="space-y-3">
                  {availableUpgrades.map((upgrade) => {
                    const isSelected = selectedUpgrade === upgrade.id;
                    const canAfford = coins >= upgrade.cost;
                    
                    return (
                      <motion.div 
                        key={upgrade.id}
                        onClick={() => setSelectedUpgrade(isSelected ? null : upgrade.id)}
                        className={`p-3 rounded-lg border cursor-pointer transition-all ${
                          isSelected ? 'border-purple-500 bg-purple-50' : 'border-gray-200 hover:border-purple-300'
                        }`}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div className="flex justify-between items-center mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">{upgrade.icon}</span>
                            <h4 className="font-medium text-gray-800">{upgrade.name}</h4>
                          </div>
                          <div className="text-amber-600 font-medium flex items-center gap-1">
                            <span>{upgrade.cost}</span>
                            <span className="text-sm">💰</span>
                          </div>
                        </div>
                        
                        <p className="text-sm text-gray-600 mb-2">{upgrade.description}</p>
                        
                        <div className="flex flex-wrap gap-2 text-xs">
                          {upgrade.incomeBoost > 0 && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full">+{upgrade.incomeBoost} Income</span>
                          )}
                          {upgrade.happinessBoost > 0 && (
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full">+{upgrade.happinessBoost} Happiness</span>
                          )}
                          {upgrade.energyEfficiency > 0 && (
                            <span className="px-2 py-1 bg-amber-100 text-amber-700 rounded-full">-{upgrade.energyEfficiency * 100}% Energy Use</span>
                          )}
                        </div>
                      </motion.div>
                    );
                  })}
                  
                  {selectedUpgrade && (
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => {
                        if (selectedUpgrade) {
                          onUpgradeBuilding(gridIndex, selectedUpgrade);
                          setActiveTab('info'); 
                        }
                      }}
                      className={`w-full py-3 rounded-lg font-medium mt-4 flex items-center justify-center gap-2 ${
                        coins >= (availableUpgrades.find(u => u.id === selectedUpgrade)?.cost || 0) 
                          ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                      disabled={coins < (availableUpgrades.find(u => u.id === selectedUpgrade)?.cost || 0)}
                    >
                      <ArrowUp size={16} />
                      Purchase Upgrade
                    </motion.button>
                  )}
                </div>
              )}
            </div>
          )}
          
          {activeTab === 'management' && (
            <div>
              <h3 className="text-lg font-medium text-gray-800 mb-4">Building Management</h3>
              
              <div className="space-y-4">
                <button
                  onClick={() => onMoveBuilding(gridIndex)}
                  className="w-full py-2 px-4 bg-blue-100 text-blue-700 rounded-lg flex items-center gap-2"
                >
                  <Move size={16} />
                  Move Building
                </button>
                
                <button
                  onClick={() => onDemolishBuilding(gridIndex)}
                  className="w-full py-2 px-4 bg-red-100 text-red-700 rounded-lg flex items-center gap-2"
                >
                  <Trash2 size={16} />
                  Demolish Building
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
