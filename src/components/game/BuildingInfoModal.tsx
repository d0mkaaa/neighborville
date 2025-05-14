import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Home, User, Plus, Minus, DollarSign, Zap, TrendingUp, AlertTriangle, Move, Trash2, RotateCw, ArrowUp, Heart, Coins } from "lucide-react";
import type { Building, Neighbor } from "../../types/game";
import BuildingUpgradesModal from './BuildingUpgradesModal';

type BuildingInfoModalProps = {
  building: Building;
  gridIndex: number;
  neighbors: Neighbor[];
  onClose: () => void;
  onAssignResident: (neighborId: number, gridIndex: number) => void;
  onRemoveResident: (neighborId: number) => void;
  onCollectIncome: (gridIndex: number, amount: number) => void;
  onMoveBuilding: (fromIndex: number) => void;
  onUpgradeBuilding: (building: Building, upgrades: string[]) => void;
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
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showResidentModal, setShowResidentModal] = useState(false);
  const currentLevel = currentBuilding.level || 1;

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
  const hasUpgrades = currentBuilding.upgrades && currentBuilding.upgrades.length > 0;
  const upgradeAvailable = true;
  
  const handleAssignResident = (neighborId: number) => {
    onAssignResident(neighborId, gridIndex);
  };

  const handleRemoveResident = (neighborId: number) => {
    onRemoveResident(neighborId);
  };

  const upgradeOptions = [
    {
      id: "eco_friendly",
      name: "Eco-Friendly Materials",
      description: "Use sustainable materials to improve happiness bonus and reduce energy usage",
      cost: Math.round(currentBuilding.cost * 0.3),
      effect: {
        happiness: 5,
        energy: -2
      },
      icon: <Heart className="text-green-500" size={16} />
    },
    {
      id: "modern_design",
      name: "Modern Design",
      description: "Update to a sleek modern design that increases income",
      cost: Math.round(currentBuilding.cost * 0.4),
      effect: {
        income: Math.round(currentBuilding.income * 0.25)
      },
      icon: <Home className="text-blue-500" size={16} />
    },
    
    ...(currentBuilding.type === 'residential' ? [
      {
        id: "extra_rooms",
        name: "Extra Rooms",
        description: "Add more living space to increase capacity",
        cost: Math.round((currentBuilding.cost || 0) * 0.5),
        effect: {
          residents: Math.max(1, Math.floor(Array.isArray(currentBuilding.residents) ? 2 : (currentBuilding.residents || 0) * 0.5))
        },
        icon: <User className="text-purple-500" size={16} />
      }
    ] : []),
    
    ...(currentBuilding.type === 'entertainment' ? [
      {
        id: "special_events",
        name: "Special Events",
        description: "Regular events that boost happiness and income",
        cost: Math.round(currentBuilding.cost * 0.6),
        effect: {
          happiness: 8,
          income: Math.round(currentBuilding.income * 0.2)
        },
        icon: <Zap className="text-yellow-500" size={16} />
      }
    ] : []),
    
    ...(currentBuilding.type === 'commercial' ? [
      {
        id: "expanded_inventory",
        name: "Expanded Inventory",
        description: "Increase product offerings to boost income significantly",
        cost: Math.round(currentBuilding.cost * 0.7),
        effect: {
          income: Math.round(currentBuilding.income * 0.35)
        },
        icon: <Coins className="text-amber-500" size={16} />
      }
    ] : [])
  ].filter(upgrade => !currentBuilding.upgrades?.includes(upgrade.id));
  
  const [selectedUpgrade, setSelectedUpgrade] = useState<string | null>(null);
  
  const handleUpgrade = () => {
    if (!selectedUpgrade) return;
    
    const upgrade = upgradeOptions.find(opt => opt.id === selectedUpgrade);
    if (!upgrade) return;
    
    const upgradedBuilding = { 
      ...currentBuilding,
      upgrades: [...(currentBuilding.upgrades || []), upgrade.id],
      happiness: currentBuilding.happiness + (upgrade.effect.happiness || 0),
      income: currentBuilding.income + (upgrade.effect.income || 0),
      energy: (currentBuilding.energy || 0) + (upgrade.effect.energy || 0),
      residents: Array.isArray(currentBuilding.residents) ? currentBuilding.residents : ((currentBuilding.residents || 0) + (upgrade.effect.residents || 0))
    };
    
    onUpgradeBuilding(upgradedBuilding, [...(currentBuilding.upgrades || []), upgrade.id]);
    setSelectedUpgrade(null);
  };
  
  const getEffectLabel = (effect: { [key: string]: number | string | undefined }) => {
    const labels = [];
    
    if (effect.happiness) labels.push(`+${effect.happiness} happiness`);
    if (effect.income) labels.push(`+${effect.income} coins/day`);
    if (effect.energy && typeof effect.energy === 'number' && effect.energy < 0) labels.push(`${effect.energy} energy usage`);
    if (effect.energy && typeof effect.energy === 'number' && effect.energy > 0) labels.push(`+${effect.energy} energy production`);
    if (effect.residents) labels.push(`+${effect.residents} residents`);
    if (effect.special) labels.push(effect.special as string);
    
    return labels.join(", ");
  };

  return (
    <>
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

                {currentBuilding.id.includes('house') || currentBuilding.id.includes('apartment') ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-800">Residents</h3>
                      {currentResidents.length < maxCapacity && (
                        <button
                          onClick={() => setShowResidentModal(true)}
                          className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 flex items-center gap-1"
                        >
                          <Plus size={14} />
                          Add Resident
                        </button>
                      )}
                    </div>

                    {currentResidents.length > 0 ? (
                      <div className="space-y-2">
                        {currentResidents.map(resident => (
                          <div
                            key={resident.id}
                            className="p-3 bg-gray-50 rounded-lg flex items-center justify-between"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                <User size={20} className="text-gray-500" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-800">{resident.name}</div>
                                <div className="text-sm text-gray-600">
                                  {resident.dailyRent} coins/day
                                </div>
                              </div>
                            </div>
                            <button
                              onClick={() => handleRemoveResident(typeof resident.id === 'string' ? parseInt(resident.id, 10) : resident.id)}
                              className="p-1.5 text-gray-400 hover:text-red-500 rounded-lg hover:bg-gray-100"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <User size={24} className="mx-auto text-gray-400 mb-2" />
                        <h4 className="text-gray-700 mb-1">No residents yet</h4>
                        <p className="text-sm text-gray-500">Add residents to start generating income</p>
                      </div>
                    )}

                    {currentResidents.length < maxCapacity && (
                      <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Available Residents</h4>
                        <div className="space-y-2">
                          {getCompatibleNeighbors().length > 0 ? (
                            getCompatibleNeighbors().map(neighbor => (
                              <div
                                key={neighbor.id}
                                className="p-3 bg-gray-50 rounded-lg flex items-center justify-between cursor-pointer hover:bg-gray-100"
                                onClick={() => handleAssignResident(typeof neighbor.id === 'string' ? parseInt(neighbor.id, 10) : neighbor.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                                    <User size={20} className="text-gray-500" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-gray-800">{neighbor.name}</div>
                                    <div className="text-sm text-gray-600">
                                      {neighbor.dailyRent} coins/day
                                    </div>
                                  </div>
                                </div>
                                <Plus size={16} className="text-gray-400" />
                              </div>
                            ))
                          ) : (
                            <div className="text-center text-gray-400 text-sm py-3 bg-gray-50 rounded-lg">
                              No compatible residents available
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-medium text-gray-800">Building Details</h3>
                      <button
                        onClick={() => setShowUpgradeModal(true)}
                        className="px-3 py-1.5 bg-blue-500 text-white text-sm rounded-lg hover:bg-blue-600 flex items-center gap-1"
                      >
                        <ArrowUp size={14} />
                        Upgrade
                      </button>
                    </div>

                    {hasUpgrades && (
                      <div className="bg-blue-50 p-3 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-700 mb-2">Current Upgrades:</h4>
                        <ul className="space-y-1">
                          {currentBuilding.upgrades?.map(upgradeId => (
                            <li key={upgradeId} className="flex items-center p-2 bg-white rounded-lg">
                              <span className="mr-2 text-blue-500">
                                {upgradeId === 'eco_friendly' ? <Heart size={16} /> :
                                 upgradeId === 'modern_design' ? <Home size={16} /> :
                                 upgradeId === 'extra_rooms' ? <User size={16} /> :
                                 upgradeId === 'special_events' ? <Zap size={16} /> :
                                 upgradeId === 'expanded_inventory' ? <Coins size={16} /> :
                                 <ArrowUp size={16} />}
                              </span>
                              <span className="text-sm text-gray-700">
                                {upgradeId.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {canCollectIncome && (
                      <button
                        onClick={() => onCollectIncome(gridIndex, totalIncome)}
                        className="w-full py-2 px-4 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex items-center justify-center gap-2"
                      >
                        <Coins size={16} />
                        Collect {totalIncome} coins
                      </button>
                    )}
                  </div>
                )}
              </>
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

      {showUpgradeModal && (
        <BuildingUpgradesModal
          building={currentBuilding}
          onClose={() => setShowUpgradeModal(false)}
          onUpgrade={onUpgradeBuilding}
          playerCoins={coins}
        />
      )}
    </>
  );
}
