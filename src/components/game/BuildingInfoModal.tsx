import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Home, User, Plus, Minus, DollarSign, Zap, TrendingUp, AlertTriangle, Move, Trash2, ArrowUp, Heart, Coins, UserPlus, Users } from "lucide-react";
import type { Building, Neighbor } from "../../types/game";
import BuildingUpgradesModal from './BuildingUpgradesModal';
import ResidentAssignment from "./ResidentAssignment";

type BuildingInfoModalProps = {
  building: Building;
  gridIndex: number;
  neighbors: Neighbor[];
  onClose: () => void;
  onAssignResident: (neighborId: number, gridIndex: number) => void;
  onRemoveResident: (neighborId: number) => void;
  onCollectIncome: () => void;
  onUpgradeBuilding: (buildingId: string, gridIndex: number, upgradeId: string) => void;
  onSellBuilding: (gridIndex: number) => void;
  onMoveBuilding: (gridIndex: number) => void;
  grid: (Building | null)[];
};

interface EnhancedBuilding extends Building {
  value?: number;
  lastIncomeCollection?: number;
  maintenanceCost?: number;
  unlockRequirement?: string;
  description?: string;
}

export default function BuildingInfoModal({ 
  building, 
  gridIndex, 
  neighbors,
  onClose, 
  onAssignResident,
  onRemoveResident,
  onCollectIncome,
  onUpgradeBuilding,
  onSellBuilding,
  onMoveBuilding,
  grid
}: BuildingInfoModalProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'management' | 'residents'>('overview');
  const [showUpgradesModal, setShowUpgradesModal] = useState(false);
  const isHouse = building.id === 'house' || building.id === 'apartment';
  const occupants = building.occupants || [];
  const hasResidents = occupants.length > 0;
  
  const enhancedBuilding = building as EnhancedBuilding;
  
  const lastCollectionTime = enhancedBuilding.lastIncomeCollection || 0;
  const timeSinceCollection = Date.now() - lastCollectionTime;
  const hoursSinceCollection = timeSinceCollection / (1000 * 60 * 60);
  const incomeReady = hoursSinceCollection >= 1;
  
  useEffect(() => {
    if (isHouse && !hasResidents) {
      setSelectedTab('residents');
    }
  }, [isHouse, hasResidents]);

  return (
    <>
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-30"
        onClick={onClose}
      ></div>
      
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl z-40 max-h-[80vh] overflow-auto w-full max-w-md"
      >
        <div className="sticky top-0 bg-white z-10 px-4 pt-4 pb-2 border-b border-gray-100 flex justify-between items-center">
          <div className="flex items-center">
            <div 
              className="w-10 h-10 rounded-lg flex items-center justify-center mr-3"
              style={{ backgroundColor: building.color }}
            >
              <Home size={18} className="text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-800 lowercase">{building.name}</h2>
              <p className="text-sm text-gray-500 lowercase">#{gridIndex}</p>
            </div>
          </div>
          
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="px-4 pt-2">
          <div className="flex border-b border-gray-200">
            <button
              className={`px-4 py-2 text-sm ${
                selectedTab === 'overview' 
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                  : 'text-gray-600'
              }`}
              onClick={() => setSelectedTab('overview')}
            >
              overview
            </button>
            <button
              className={`px-4 py-2 text-sm ${
                selectedTab === 'management' 
                  ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                  : 'text-gray-600'
              }`}
              onClick={() => setSelectedTab('management')}
            >
              management
            </button>
            {isHouse && (
              <button
                className={`px-4 py-2 text-sm flex items-center ${
                  selectedTab === 'residents' 
                    ? 'border-b-2 border-blue-500 text-blue-600 font-medium' 
                    : 'text-gray-600'
                }`}
                onClick={() => setSelectedTab('residents')}
              >
                residents
                {hasResidents && (
                  <span className="ml-1 bg-emerald-100 text-emerald-600 text-xs px-1.5 rounded-full">
                    {occupants.length}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>
        
        <div className="p-4">
          {selectedTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-xs text-gray-500 lowercase mb-1 flex items-center">
                    <Coins size={12} className="mr-1" /> Value
                  </div>
                  <div className="font-medium text-gray-800">{enhancedBuilding.value || building.cost || 100}c</div>
                </div>
                
                {building.income > 0 && (
                  <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-xs text-gray-500 lowercase mb-1 flex items-center">
                      <DollarSign size={12} className="mr-1" /> Income
                    </div>
                    <div className="font-medium text-gray-800">{building.income}c/day</div>
                  </div>
                )}
                
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div className="text-xs text-gray-500 lowercase mb-1 flex items-center">
                    <Zap size={12} className="mr-1" /> Energy
                  </div>
                  <div className="font-medium text-gray-800">{building.energyUsage}u</div>
                </div>
                

              </div>
              
              <div className="p-3 rounded-lg border border-gray-200">
                <h3 className="font-medium text-sm text-gray-700 mb-2 lowercase">Building Details</h3>
                <div className="text-sm text-gray-600 space-y-2">
                  <div className="flex items-center">
                    <span className="text-gray-500">Energy usage:</span>
                    <span className="ml-auto">{building.energyUsage} units/day</span>
                  </div>
                  

                  
                  {building.ecoFriendly && (
                    <div className="flex items-center">
                      <span className="text-gray-500">Eco-friendly:</span>
                      <span className="ml-auto text-green-600">✓ Yes</span>
                    </div>
                  )}
                  
                  {building.wasteReduction && (
                    <div className="flex items-center">
                      <span className="text-gray-500">Waste reduction:</span>
                      <span className="ml-auto text-green-600">-{building.wasteReduction}%</span>
                    </div>
                  )}
                  
                  {building.jobCapacity && (
                    <div className="flex items-center">
                      <span className="text-gray-500">Job capacity:</span>
                      <span className="ml-auto">{building.jobCapacity} jobs</span>
                    </div>
                  )}
                  
                  {building.culturalValue && (
                    <div className="flex items-center">
                      <span className="text-gray-500">Cultural value:</span>
                      <span className="ml-auto text-purple-600">+{building.culturalValue}</span>
                    </div>
                  )}
                  
                  {building.entertainmentValue && (
                    <div className="flex items-center">
                      <span className="text-gray-500">Entertainment value:</span>
                      <span className="ml-auto text-blue-600">+{building.entertainmentValue}</span>
                    </div>
                  )}
                  
                  {building.touristAttraction && (
                    <div className="flex items-center">
                      <span className="text-gray-500">Tourist attraction:</span>
                      <span className="ml-auto text-orange-600">✓ Yes</span>
                    </div>
                  )}
                  
                  {enhancedBuilding.maintenanceCost && enhancedBuilding.maintenanceCost > 0 && (
                    <div className="flex items-center">
                      <span className="text-gray-500">Maintenance:</span>
                      <span className="ml-auto">{enhancedBuilding.maintenanceCost}c/day</span>
                    </div>
                  )}
                  
                  {enhancedBuilding.unlockRequirement && (
                    <div className="flex items-center">
                      <span className="text-gray-500">Requirement:</span>
                      <span className="ml-auto">{enhancedBuilding.unlockRequirement}</span>
                    </div>
                  )}
                  
                  {isHouse && (
                    <div className="flex items-center">
                      <span className="text-gray-500">Capacity:</span>
                      <span className="ml-auto">
                        {occupants.length}/{building.residentCapacity || 1} residents
                      </span>
                    </div>
                  )}
                </div>
              </div>
              
              {enhancedBuilding.description && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100 text-sm text-blue-800">
                  {enhancedBuilding.description}
                </div>
              )}
              
              {building.income > 0 && incomeReady && (
                <button
                  onClick={onCollectIncome}
                  className="w-full p-3 bg-green-500 text-white rounded-lg font-medium flex items-center justify-center gap-2"
                >
                  <DollarSign size={16} />
                  Collect {building.income} coins
                </button>
              )}
            </div>
          )}
          
          {selectedTab === 'management' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => setShowUpgradesModal(true)}
                  className="p-3 bg-white border border-blue-200 rounded-lg text-blue-600 flex flex-col items-center justify-center gap-2"
                >
                  <ArrowUp size={18} />
                  <span className="text-sm">Upgrade</span>
                </button>
                
                <button
                  onClick={() => onMoveBuilding(gridIndex)}
                  className="p-3 bg-white border border-gray-200 rounded-lg text-gray-600 flex flex-col items-center justify-center gap-2"
                >
                  <Move size={18} />
                  <span className="text-sm">Move</span>
                </button>
                
                <button
                  onClick={() => onSellBuilding(gridIndex)}
                  className="p-3 bg-white border border-red-200 rounded-lg text-red-600 flex flex-col items-center justify-center gap-2 col-span-2"
                >
                  <Trash2 size={18} />
                  <span className="text-sm">Sell</span>
                </button>
              </div>
              
              <div className="p-4 border border-gray-200 rounded-lg bg-yellow-50">
                <div className="flex items-start">
                  <AlertTriangle size={20} className="text-yellow-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-yellow-700 mb-1">Selling this building will return {Math.floor((enhancedBuilding.value || building.cost || 100) * 0.7)} coins (70% of value).</p>
                    <p className="text-xs text-yellow-600">You'll lose any upgrades and improvements.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {selectedTab === 'residents' && isHouse && (
            <div className="space-y-4">
              {hasResidents ? (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2 text-sm flex items-center gap-1 lowercase">
                    <Users size={16} />
                    Current Residents
                  </h3>
                  
                  <div className="space-y-2">
                    {occupants.map((residentId) => {
                      const resident = neighbors.find(n => n.id === residentId);
                      if (!resident) return null;
                      
                      return (
                        <div 
                          key={residentId} 
                          className="p-3 bg-white border border-gray-200 rounded-lg flex justify-between items-center"
                        >
                          <div className="flex items-center">
                            <div className="text-2xl mr-3">{resident.avatar}</div>
                            <div>
                              <div className="text-sm font-medium text-gray-700">{resident.name}</div>
                              <div className="text-xs text-gray-500 flex items-center gap-2">
                                <span>rent: {resident.dailyRent} coins/day</span>
                                <span className="flex items-center gap-1">
                                  <Heart size={10} />
                                  happiness: {resident.happiness}%
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <button
                            onClick={() => onRemoveResident(Number(residentId))}
                            className="p-1.5 bg-red-50 text-red-500 rounded-full hover:bg-red-100"
                          >
                            <X size={16} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-lg flex items-start">
                  <UserPlus size={20} className="text-emerald-600 mr-3 mt-1 flex-shrink-0" />
                  <div>
                    <p className="text-sm text-emerald-700 mb-1">This building has no residents yet.</p>
                    <p className="text-xs text-emerald-600">Assign residents to earn daily rent income.</p>
                  </div>
                </div>
              )}
              
              <div className="mt-4">
                <ResidentAssignment 
                  neighbors={neighbors}
                  grid={grid}
                  onAssignResident={onAssignResident}
                  onRemoveResident={onRemoveResident}
                />
              </div>
            </div>
          )}
        </div>
      </motion.div>
      
      <AnimatePresence>
        {showUpgradesModal && (
          <BuildingUpgradesModal
            building={building}
            gridIndex={gridIndex}
            onClose={() => setShowUpgradesModal(false)}
            onUpgrade={onUpgradeBuilding}
          />
        )}
      </AnimatePresence>
    </>
  );
}
