import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Shield, Wrench, Leaf, X } from 'lucide-react';
import type { Building, WeatherType } from '../../types/game';
import { 
  NATURAL_DISASTERS,
  calculateBuildingEfficiency,
  calculateEnvironmentalImpact,
  calculateDisasterProbability
} from '../../data/gameEvents';
import type { 
  NaturalDisaster, 
  BuildingEfficiency,
  EnvironmentalImpact
} from '../../data/gameEvents';

interface NaturalDisasterManagerProps {
  grid: (Building | null)[];
  weather: WeatherType;
  season: string;
  currentDay: number;
  coins: number;
  cityInfrastructure: number;
  onDisasterOccur: (disaster: NaturalDisaster) => void;
  onBuildingRepair: (buildingIndex: number, cost: number) => void;
  onMaintenancePerformed: (buildingIndex: number, cost: number) => void;
  addNotification: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
}

export default function NaturalDisasterManager({
  grid,
  weather,
  season,
  currentDay,
  coins,
  cityInfrastructure,
  onDisasterOccur,
  onBuildingRepair,
  onMaintenancePerformed,
  addNotification
}: NaturalDisasterManagerProps) {
  const [showDisasterPanel, setShowDisasterPanel] = useState(false);
  const [buildingEfficiencies, setBuildingEfficiencies] = useState<Map<number, BuildingEfficiency>>(new Map());
  const [environmentalImpact, setEnvironmentalImpact] = useState<EnvironmentalImpact>({
    pollution: 0,
    greenery: 0,
    sustainability: 0,
    effects: { happinessModifier: 0, healthModifier: 0, tourismModifier: 0 }
  });
  const [activeDisasters, setActiveDisasters] = useState<(NaturalDisaster & { dayOccurred: number })[]>([]);  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);

  useEffect(() => {
    const buildings = grid.filter(Boolean) as Building[];
    const impact = calculateEnvironmentalImpact(buildings);
    setEnvironmentalImpact(impact);  }, [grid]);

  useEffect(() => {
    const newEfficiencies = new Map<number, BuildingEfficiency>();
    
    grid.forEach((building, index) => {
      if (building) {
        const existing = buildingEfficiencies.get(index);
        const lastMaintenance = existing?.lastMaintenance || 1;
        
        const efficiency = calculateBuildingEfficiency(building, lastMaintenance, currentDay);
        
        newEfficiencies.set(index, {
          id: `${building.id}_${index}`,
          buildingId: building.id,
          efficiency,
          lastMaintenance,
          maintenanceCost: Math.round(building.cost! * 0.1),
          degradationRate: building.id.includes('tech') ? 1.5 : 1,
          repairCost: Math.round(building.cost! * 0.3)
        });
      }
    });
      setBuildingEfficiencies(newEfficiencies);
  }, [grid, currentDay]);

  useEffect(() => {
    const checkForDisasters = () => {
      const buildings = grid.filter(Boolean) as Building[];
      
      if (buildings.length < 3) {        return;
      }
      
      if (currentDay <= 5) {
        return;
      }
      
      NATURAL_DISASTERS.forEach(disaster => {        let probability = calculateDisasterProbability(disaster, weather, season, cityInfrastructure);
        
        if (disaster.effects.affectedBuildingTypes) {          const relevantBuildings = buildings.filter(building =>
            disaster.effects.affectedBuildingTypes!.includes(building.id)
          );
          if (relevantBuildings.length === 0) {
            return;
          }
          
          if (disaster.id === 'cyber_attack') {
            const techBuildings = buildings.filter(building => 
              building.id.includes('tech') || building.id.includes('smart') || building.id.includes('automated')
            );
            if (techBuildings.length === 0) {
              return;
            }          }
          
          const buildingRatio = relevantBuildings.length / buildings.length;
          if (buildingRatio < 0.3) {
            probability *= 0.5;
          }
        }
        
        if (Math.random() < probability) {
          const disasterWithDay = { ...disaster, dayOccurred: currentDay };
          setActiveDisasters(prev => [...prev, disasterWithDay]);
          onDisasterOccur(disaster);
          
          addNotification(
            `🚨 ${disaster.name}: ${disaster.description}`,
            disaster.severity === 'minor' ? 'warning' : 'error'
          );
        }
      });
    };

    checkForDisasters();  }, [currentDay, weather, season, cityInfrastructure, onDisasterOccur, addNotification, grid]);

  useEffect(() => {
    setActiveDisasters(prev => 
      prev.filter(disaster => currentDay - disaster.dayOccurred < disaster.recoveryTime)
    );
  }, [currentDay]);

  const handleMaintenanceUpgrade = (buildingIndex: number) => {
    const building = grid[buildingIndex];
    const efficiency = buildingEfficiencies.get(buildingIndex);
    
    if (!building || !efficiency) return;
    
    if (coins < efficiency.maintenanceCost) {
      addNotification('Not enough coins for maintenance!', 'error');
      return;
    }
    
    onMaintenancePerformed(buildingIndex, efficiency.maintenanceCost);
    
    setBuildingEfficiencies(prev => {
      const newMap = new Map(prev);
      newMap.set(buildingIndex, {
        ...efficiency,
        efficiency: Math.min(100, efficiency.efficiency + 20),
        lastMaintenance: currentDay
      });
      return newMap;
    });
    
    addNotification(`Maintained ${building.name} - efficiency increased!`, 'success');
  };

  const handleBuildingRepair = (buildingIndex: number) => {
    const building = grid[buildingIndex];
    const efficiency = buildingEfficiencies.get(buildingIndex);
    
    if (!building || !efficiency) return;
    
    if (coins < efficiency.repairCost) {
      addNotification('Not enough coins for repairs!', 'error');
      return;
    }
    
    onBuildingRepair(buildingIndex, efficiency.repairCost);
    
    setBuildingEfficiencies(prev => {
      const newMap = new Map(prev);
      newMap.set(buildingIndex, {
        ...efficiency,
        efficiency: 100,
        lastMaintenance: currentDay
      });
      return newMap;
    });
    
    addNotification(`Repaired ${building.name} - full efficiency restored!`, 'success');
  };

  const getDisasterRiskLevel = () => {
    let totalRisk = 0;
    NATURAL_DISASTERS.forEach(disaster => {
      totalRisk += calculateDisasterProbability(disaster, weather, season, cityInfrastructure);
    });
    
    if (totalRisk > 0.3) return { level: 'high', color: 'text-red-600' };
    if (totalRisk > 0.15) return { level: 'medium', color: 'text-amber-600' };
    return { level: 'low', color: 'text-emerald-600' };
  };

  const getBuildingsNeedingMaintenance = () => {
    return Array.from(buildingEfficiencies.entries())
      .filter(([_, efficiency]) => efficiency.efficiency < 80)
      .sort(([_, a], [__, b]) => a.efficiency - b.efficiency);
  };

  const disasterRisk = getDisasterRiskLevel();
  const maintenanceNeeded = getBuildingsNeedingMaintenance();

  return (
    <>
      <motion.button
        whileHover={{ scale: 1.1 }} 
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowDisasterPanel(!showDisasterPanel)}
        className="fixed bottom-4 right-20 w-12 h-12 bg-gradient-to-br from-orange-500 to-red-600 text-white rounded-full shadow-lg flex items-center justify-center z-40"
        title="City Management"
      >
        <AlertTriangle size={20} />
        {maintenanceNeeded.length > 0 && (
          <div className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-xs font-bold">
            {maintenanceNeeded.length}
          </div>
        )}
      </motion.button>

      <AnimatePresence>
        {showDisasterPanel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setShowDisasterPanel(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6 bg-gradient-to-r from-orange-500 to-red-600 text-white">
                <div className="flex justify-between items-center">
                  <div className="flex items-center">
                    <Shield size={24} className="mr-3" />
                    <div>
                      <h2 className="text-xl font-bold">City Management Center</h2>
                      <p className="text-orange-100 text-sm">
                        Disaster Risk: <span className={disasterRisk.color}>{disasterRisk.level}</span>
                      </p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowDisasterPanel(false)}
                    className="text-white hover:text-orange-100 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <Leaf className="text-emerald-600 mr-2" size={20} />
                      <h3 className="font-bold text-emerald-800">Environmental Impact</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Pollution</span>
                          <span className="font-medium">{environmentalImpact.pollution}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-red-500 h-2 rounded-full transition-all"
                            style={{ width: `${environmentalImpact.pollution}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Greenery</span>
                          <span className="font-medium">{environmentalImpact.greenery}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-emerald-500 h-2 rounded-full transition-all"
                            style={{ width: `${environmentalImpact.greenery}%` }}
                          />
                        </div>
                      </div>
                      
                      <div>
                        <div className="flex justify-between text-sm">
                          <span>Sustainability</span>
                          <span className="font-medium">{environmentalImpact.sustainability}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.max(0, environmentalImpact.sustainability)}%` }}
                          />
                        </div>
                      </div>
                    </div>
                    
                    <div className="mt-4 text-xs text-gray-600">
                      <p>Effects: +{environmentalImpact.effects.happinessModifier.toFixed(1)} happiness, +{environmentalImpact.effects.tourismModifier.toFixed(1)} tourism</p>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-yellow-50 rounded-lg p-4">
                    <div className="flex items-center mb-4">
                      <Wrench className="text-amber-600 mr-2" size={20} />
                      <h3 className="font-bold text-amber-800">Building Maintenance</h3>
                    </div>
                    
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {maintenanceNeeded.length === 0 ? (
                        <p className="text-gray-500 text-sm">All buildings in good condition!</p>
                      ) : (
                        maintenanceNeeded.map(([index, efficiency]) => {
                          const building = grid[index];
                          if (!building) return null;
                          
                          return (
                            <div key={index} className="bg-white rounded-lg p-3 border">
                              <div className="flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-sm">{building.name}</div>
                                  <div className="text-xs text-gray-500">
                                    Efficiency: {efficiency.efficiency}%
                                  </div>
                                </div>
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleMaintenanceUpgrade(index)}
                                    className="bg-amber-500 text-white px-3 py-1 rounded text-xs hover:bg-amber-600 transition-colors"
                                    disabled={coins < efficiency.maintenanceCost}
                                  >
                                    Maintain ({efficiency.maintenanceCost}💰)
                                  </button>
                                  {efficiency.efficiency < 50 && (
                                    <button
                                      onClick={() => handleBuildingRepair(index)}
                                      className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600 transition-colors"
                                      disabled={coins < efficiency.repairCost}
                                    >
                                      Repair ({efficiency.repairCost}💰)
                                    </button>
                                  )}
                                </div>
                              </div>
                              
                              <div className="mt-2">
                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                  <div 
                                    className={`h-1.5 rounded-full transition-all ${
                                      efficiency.efficiency >= 80 ? 'bg-emerald-500' :
                                      efficiency.efficiency >= 50 ? 'bg-amber-500' : 'bg-red-500'
                                    }`}
                                    style={{ width: `${efficiency.efficiency}%` }}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>

                  {activeDisasters.length > 0 && (
                    <div className="bg-gradient-to-br from-red-50 to-pink-50 rounded-lg p-4 lg:col-span-2">
                      <div className="flex items-center mb-4">
                        <AlertTriangle className="text-red-600 mr-2" size={20} />
                        <h3 className="font-bold text-red-800">Active Disasters</h3>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {activeDisasters.map((disaster, index) => (
                          <div key={index} className="bg-white rounded-lg p-3 border border-red-200">
                            <div className="font-medium text-red-800">{disaster.name}</div>
                            <div className="text-sm text-gray-600 mb-2">{disaster.description}</div>
                            <div className="text-xs text-red-600">
                              Recovery in {disaster.recoveryTime - (currentDay - disaster.dayOccurred)} days
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-4 lg:col-span-2">
                    <h3 className="font-bold text-blue-800 mb-3">💡 Disaster Prevention Tips</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div className="bg-white rounded-lg p-3">
                        <div className="font-medium text-blue-700">Build Smart Grid Systems</div>
                        <div className="text-gray-600">Reduce power surge damage by 50%</div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="font-medium text-blue-700">Increase Green Spaces</div>
                        <div className="text-gray-600">Parks and gardens reduce environmental disasters</div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="font-medium text-blue-700">Regular Maintenance</div>
                        <div className="text-gray-600">Well-maintained buildings resist damage better</div>
                      </div>
                      <div className="bg-white rounded-lg p-3">
                        <div className="font-medium text-blue-700">Diversify Infrastructure</div>
                        <div className="text-gray-600">Multiple power/water sources prevent outages</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
} 