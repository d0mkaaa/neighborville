import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Factory, 
  Package, 
  TrendingUp, 
  Star,
  Zap,
  Users,
  Settings,
  BarChart3,
  Clock,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Trash2
} from 'lucide-react';
import type { Building, GameProgress, ProductionQueueItem, ActiveProduction, PlayerResources } from '../../types/game';
import ProductionManager from './ProductionManager';
import ResourceInventory from './ResourceInventory';
import { RESOURCES, RECIPES, getResourceById, getRecipeById, getRecipesByBuilding } from '../../data/resources';
import { TimeService } from '../../services/timeService';
import type { ProductionStats } from '../../types/game';

type ActiveProductions = Map<number, ActiveProduction>;

interface ProductionIntegrationProps {
  onClose: () => void;
  playerLevel: number;
  onXPGain: (amount: number, source: string, description: string) => void;
  playerResources: PlayerResources;
  setPlayerResources: React.Dispatch<React.SetStateAction<PlayerResources>>;
  grid?: (Building | null)[];
  onUpdateGrid?: (grid: (Building | null)[]) => void;
  gameTime?: number;
  gameMinutes?: number;
  currentGameTimeMinutes?: number;
  timeSpeed?: 1 | 2 | 3;
  addNotification?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  activeProductions?: ActiveProductions;
  onStartProduction?: (buildingIndex: number, recipeId: string) => void;
  onStopProduction?: (buildingIndex: number) => void;
  getActiveProductionForBuilding?: (buildingIndex: number) => ActiveProduction | null;
}

export default function ProductionIntegration({ 
  onClose, 
  playerLevel, 
  onXPGain,
  playerResources,
  setPlayerResources,
  grid = [],
  onUpdateGrid,
  gameTime = 8,
  gameMinutes = 0,
  currentGameTimeMinutes,
  timeSpeed = 1,
  addNotification,
  activeProductions,
  onStartProduction,
  onStopProduction,
  getActiveProductionForBuilding
}: ProductionIntegrationProps) {
  const [activeTab, setActiveTab] = useState('overview');
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<number>(0);
  const [forceUpdate, setForceUpdate] = useState<number>(0);
  
  const [productionStats, setProductionStats] = useState<ProductionStats>({
    totalProduced: {},
    totalConsumed: {},
    productionValue: 0,
    consumptionValue: 0
  });
  const productionBuildings = useMemo(() => {
    return grid
      .map((building, index) => ({ building, index }))
      .filter(({ building }) => building && (
        building.produces?.length > 0 || 
        building.productionType
      ));
  }, [grid]);
  useEffect(() => {
    const interval = setInterval(() => {
      setRefreshInterval(prev => prev + 1);
      setForceUpdate(prev => prev + 1);
    }, 1000);

    return () => clearInterval(interval);
  }, []);
  useEffect(() => {
    setForceUpdate(prev => prev + 1);
  }, [gameTime, gameMinutes, currentGameTimeMinutes]);

  const handleResourceUpdate = (resourceId: string, quantity: number) => {
    setPlayerResources(prev => ({
      ...prev,
      [resourceId]: Math.max(0, (prev[resourceId] || 0) + quantity)
    }));
  };
  const handleProductionQueuesUpdate = (queues: Map<number, any[]>) => {
  };

  const getTotalResourceCount = () => {
    return Object.values(playerResources).reduce((sum, qty) => sum + qty, 0);
  };
  const getActiveProductionCount = () => {
    if (!activeProductions) return 0;
    
    let activeCount = 0;
    activeProductions.forEach(production => {
      if (production.isActive) {
        activeCount++;
      }
    });
    
    return activeCount;
  };

  const getProductionEfficiency = () => {
    const totalBuildings = productionBuildings.length;
    const activeBuildings = productionBuildings.filter(({ building, index }) => {
      const production = activeProductions?.get(index);
      return production?.isActive || false;
    }).length;
    return totalBuildings > 0 ? Math.round((activeBuildings / totalBuildings) * 100) : 0;
  };

  const getProductionValue = () => {
    let totalValue = 0;
    if (activeProductions) {
      activeProductions.forEach(production => {
        if (production.isActive) {
          if (production.recipeId.startsWith('extract_')) {
            const resourceId = production.recipeId.replace('extract_', '');
            const building = grid[production.buildingIndex];
            if (building?.produces) {
              const productionData = building.produces.find(p => p.resourceId === resourceId);
              if (productionData) {
                const resource = getResourceById(resourceId);
                totalValue += (resource?.baseValue || 0) * productionData.quantity;
              }
            }
          } else {
            const recipe = getRecipeById(production.recipeId);
            if (recipe) {
              totalValue += recipe.outputs.reduce((sum, output) => {
                const resource = getResourceById(output.resourceId);
                return sum + (resource?.baseValue || 0) * output.quantity;
              }, 0);
            }
          }
        }
      });
    }
    return totalValue;
  };

  const renderTabButton = (tabId: string, icon: React.ReactNode, label: string, badge?: number) => (
    <motion.button
      key={tabId}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => setActiveTab(tabId)}
      className={`relative flex items-center gap-3 px-6 py-3 rounded-xl font-medium transition-all duration-300 ${
        activeTab === tabId
          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
          : 'bg-white/20 text-gray-700 hover:bg-white/30 hover:text-gray-900'
      }`}
    >
      {icon}
      <span>{label}</span>
      {badge !== undefined && badge > 0 && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold"
        >
          {badge > 99 ? '99+' : badge}
        </motion.span>
      )}
    </motion.button>
  );

  const renderOverviewTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-blue-500/10 to-blue-600/20 backdrop-blur-sm border border-blue-300/30 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500/20 rounded-xl flex items-center justify-center">
              <Package size={20} className="text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Resources</p>
              <p className="text-2xl font-bold text-gray-900">{getTotalResourceCount()}</p>
            </div>
          </div>
          <div className="text-xs text-blue-600 font-medium">Total items in inventory</div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-green-500/10 to-green-600/20 backdrop-blur-sm border border-green-300/30 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-500/20 rounded-xl flex items-center justify-center">
              <Factory size={20} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Active</p>
              <p className="text-2xl font-bold text-gray-900">{getActiveProductionCount()}</p>
            </div>
          </div>
          <div className="text-xs text-green-600 font-medium">Productions running</div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-purple-500/10 to-purple-600/20 backdrop-blur-sm border border-purple-300/30 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-500/20 rounded-xl flex items-center justify-center">
              <TrendingUp size={20} className="text-purple-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Efficiency</p>
              <p className="text-2xl font-bold text-gray-900">{getProductionEfficiency()}%</p>
            </div>
          </div>
          <div className="text-xs text-purple-600 font-medium">Overall productivity</div>
        </motion.div>

        <motion.div 
          whileHover={{ scale: 1.02 }}
          className="bg-gradient-to-br from-orange-500/10 to-orange-600/20 backdrop-blur-sm border border-orange-300/30 rounded-2xl p-6"
        >
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-orange-500/20 rounded-xl flex items-center justify-center">
              <Star size={20} className="text-orange-600" />
            </div>
            <div>
              <p className="text-sm text-gray-600">Value</p>
              <p className="text-2xl font-bold text-gray-900">${getProductionValue()}</p>
            </div>
          </div>
          <div className="text-xs text-orange-600 font-medium">Total production value</div>
        </motion.div>
      </div>

      <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Clock className="text-green-500" size={20} />
          Active Productions
        </h3>
        {(() => {
          const activeProductionsList: any[] = [];
          if (activeProductions) {
            activeProductions.forEach((production, buildingIndex) => {
              if (production.isActive) {
                const building = grid[buildingIndex];
                activeProductionsList.push({ ...production, building, buildingIndex });
              }
            });
          }

          if (activeProductionsList.length === 0) {
            return (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gray-100/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Pause size={24} className="text-gray-400" />
                </div>
                <p className="text-gray-600 font-medium">No active productions</p>
                <p className="text-sm text-gray-500 mt-1">Start production in your buildings to see progress here</p>
              </div>
            );
          }

          return (
            <div className="space-y-3">
              {activeProductionsList.slice(0, 3).map((production, index) => {
                const currentTime = TimeService.getCurrentTime(gameTime, gameMinutes);
                
                let cycleDuration = 0;
                if (production.recipeId.startsWith('extract_')) {
                  const resourceId = production.recipeId.replace('extract_', '');
                  const building = production.building;
                  if (building?.produces) {
                    const productionData = building.produces.find(p => p.resourceId === resourceId);
                    if (productionData) {
                      cycleDuration = TimeService.calculateProductionTime(productionData.timeMinutes, timeSpeed);
                    }
                  }
                } else {
                  const recipe = getRecipeById(production.recipeId);
                  if (recipe) {
                    cycleDuration = TimeService.calculateProductionTime(recipe.productionTime, timeSpeed);
                  }
                }
                
                const nextCompletionTime = production.lastCompletionTime + cycleDuration;
                const timeInCurrentCycle = currentTime.totalMinutes - production.lastCompletionTime;
                const progress = cycleDuration > 0 ? Math.min(100, Math.max(0, (timeInCurrentCycle / cycleDuration) * 100)) : 0;
                const isComplete = currentTime.totalMinutes >= nextCompletionTime;
                
                let recipeName = production.recipeId;
                let outputItems: Array<{icon: string, name: string, quantity: number}> = [];
                
                if (production.recipeId.startsWith('extract_')) {
                  const resourceId = production.recipeId.replace('extract_', '');
                  const resource = getResourceById(resourceId);
                  recipeName = `Extract ${resource?.name || resourceId}`;
                  if (resource) {
                    const building = production.building;
                    const productionData = building?.produces?.find(p => p.resourceId === resourceId);
                    outputItems = [{
                      icon: resource.icon,
                      name: resource.name,
                      quantity: productionData?.quantity || 1
                    }];
                  }
                } else {
                  const recipe = getRecipeById(production.recipeId);
                  if (recipe) {
                    recipeName = recipe.name;
                    outputItems = recipe.outputs.map(output => {
                      const resource = getResourceById(output.resourceId);
                      return {
                        icon: resource?.icon || '📦',
                        name: resource?.name || output.resourceId,
                        quantity: output.quantity
                      };
                    });
                  }
                }

                return (
                  <motion.div
                    key={production.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className={`bg-white/30 border rounded-xl p-4 ${
                      isComplete 
                        ? 'border-green-400/60 bg-green-50/30' 
                        : 'border-white/40'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isComplete 
                            ? 'bg-gradient-to-br from-green-400/30 to-green-500/30'
                            : 'bg-gradient-to-br from-blue-400/20 to-blue-500/20'
                        }`}>
                          {isComplete ? (
                            <CheckCircle size={14} className="text-green-600" />
                          ) : (
                            <Play size={14} className="text-blue-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{production.building?.name}</p>
                          <p className="text-sm text-gray-600">{recipeName}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${
                          isComplete ? 'text-green-600' : 'text-blue-600'
                        }`}>
                          {Math.round(progress)}%
                        </div>
                        <div className="text-xs text-gray-500">
                          {isComplete ? 'Complete' : 'In Progress'}
                        </div>
                      </div>
                    </div>
                    
                    {outputItems.length > 0 && (
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs text-gray-600">Produces:</span>
                        <div className="flex items-center gap-1">
                          {outputItems.slice(0, 3).map((item, idx) => (
                            <div key={idx} className="flex items-center gap-1 bg-white/40 rounded-md px-2 py-1">
                              <span className="text-sm">{item.icon}</span>
                              <span className="text-xs font-medium text-gray-700">
                                {item.quantity}
                              </span>
                            </div>
                          ))}
                          {outputItems.length > 3 && (
                            <span className="text-xs text-gray-500">+{outputItems.length - 3} more</span>
                          )}
                        </div>
                      </div>
                    )}
                    
                    <div className="w-full bg-gray-200/50 rounded-full h-2">
                      <motion.div
                        className={`h-2 rounded-full ${
                          isComplete 
                            ? 'bg-gradient-to-r from-green-400 to-green-500'
                            : 'bg-gradient-to-r from-blue-400 to-blue-500'
                        }`}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    
                    <div className="mt-2 flex justify-between text-xs text-gray-500">
                      <span>
                        {isComplete ? 'Ready to collect!' : (
                          cycleDuration > 0 
                            ? `${TimeService.formatDuration(nextCompletionTime - currentTime.totalMinutes)} remaining`
                            : 'Completing...'
                        )}
                      </span>
                      <span>
                        Cycle: {production.cycleCount + 1}
                      </span>
                    </div>
                  </motion.div>
                );
              })}
              {activeProductionsList.length > 3 && (
                <div className="text-center">
                  <p className="text-sm text-gray-600">
                    +{activeProductionsList.length - 3} more productions running
                  </p>
                </div>
              )}
            </div>
          );
        })()}
      </div>

      <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Zap className="text-blue-500" size={20} />
          Quick Actions
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('buildings')}
            className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-6 py-4 rounded-xl font-medium hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg"
          >
            <Factory size={20} className="mx-auto mb-2" />
            Manage Buildings
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('inventory')}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white px-6 py-4 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg"
          >
            <Package size={20} className="mx-auto mb-2" />
            View Inventory
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setActiveTab('analytics')}
            className="bg-gradient-to-r from-purple-500 to-purple-600 text-white px-6 py-4 rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg"
          >
            <BarChart3 size={20} className="mx-auto mb-2" />
            View Analytics
          </motion.button>
        </div>
      </div>
    </motion.div>
  );

  const renderBuildingsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <Factory className="text-blue-500" size={20} />
          Production Buildings
        </h3>
        
        <div className="space-y-4">
          {productionBuildings.map(({ building, index }) => {
            const activeProduction = getActiveProductionForBuilding?.(index);
            const isActive = activeProduction?.isActive || false;
            
            return (
              <div key={index} className="bg-white/30 border border-white/40 rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{building?.icon || '🏭'}</div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{building?.name}</h4>
                      <p className="text-sm text-gray-600">Building #{index}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {isActive ? (
                      <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => onStopProduction?.(index)}
                        className="bg-red-500 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                      >
                        Stop
                      </motion.button>
                    ) : (
                      building?.produces?.map((production, prodIndex) => (
                        <motion.button
                          key={prodIndex}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => onStartProduction?.(index, `extract_${production.resourceId}`)}
                          className="bg-green-500 text-white px-3 py-1 rounded-lg text-sm font-medium hover:bg-green-600 transition-colors"
                        >
                          Start {getResourceById(production.resourceId)?.name}
                        </motion.button>
                      ))
                    )}
                  </div>
                </div>
                
                {isActive && activeProduction && (
                  <div className="bg-blue-50/50 border border-blue-200/50 rounded-lg p-3">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-blue-700 font-medium">
                        Producing: {activeProduction.recipeId.replace('extract_', '')}
                      </span>
                      <span className="text-blue-600">
                        Cycles completed: {activeProduction.cycleCount}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
          
          {productionBuildings.length === 0 && (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-gray-100/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Factory size={24} className="text-gray-400" />
              </div>
              <p className="text-gray-600 font-medium">No production buildings</p>
              <p className="text-sm text-gray-500 mt-1">Build production buildings to start manufacturing resources</p>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );

  const renderInventoryTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-full"
    >
      <ResourceInventory
        playerResources={playerResources}
        onResourceUpdate={handleResourceUpdate}
        showTrading={true}
      />
    </motion.div>
  );

  const renderAnalyticsTab = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-2xl p-6">
        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
          <BarChart3 className="text-purple-500" size={20} />
          Production Analytics
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white/30 border border-white/40 rounded-xl p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Factory size={16} className="text-blue-600" />
              Buildings Overview
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Production Buildings:</span>
                <span className="font-medium text-gray-900">{productionBuildings.length}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Active Buildings:</span>
                <span className="font-medium text-green-600">
                  {productionBuildings.filter(({ building, index }) => {
                    const production = activeProductions?.get(index);
                    return production?.isActive || false;
                  }).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Idle Buildings:</span>
                <span className="font-medium text-orange-600">
                  {productionBuildings.filter(({ building, index }) => {
                    const production = activeProductions?.get(index);
                    return !production?.isActive;
                  }).length}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white/30 border border-white/40 rounded-xl p-4">
            <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <Package size={16} className="text-green-600" />
              Resource Summary
            </h4>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Unique Resources:</span>
                <span className="font-medium text-gray-900">
                  {Object.keys(playerResources).filter(id => playerResources[id] > 0).length}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Quantity:</span>
                <span className="font-medium text-blue-600">
                  {Object.values(playerResources).reduce((sum, qty) => sum + qty, 0)}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Total Value:</span>
                <span className="font-medium text-purple-600">
                  {Object.entries(playerResources).reduce((total, [resourceId, quantity]) => {
                    const resource = getResourceById(resourceId);
                    return total + (resource ? resource.baseValue * quantity : 0);
                  }, 0)} coins
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/30 border border-white/40 rounded-xl p-4">
          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
            <Clock size={16} className="text-indigo-600" />
            Queue Status
          </h4>
          {(() => {
            let totalActive = 0;
            let totalQueued = 0;
            if (activeProductions) {
              activeProductions.forEach(production => {
                if (production.isActive) {
                  totalActive += 1;
                }
              });
            }
            
            return (
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-xl font-bold text-green-600">{totalActive}</div>
                  <div className="text-xs text-gray-600">Active</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-yellow-600">{totalQueued}</div>
                  <div className="text-xs text-gray-600">Queued</div>
                </div>
                <div>
                  <div className="text-xl font-bold text-blue-600">{totalActive + totalQueued}</div>
                  <div className="text-xs text-gray-600">Total</div>
                </div>
              </div>
            );
          })()}
        </div>

        <div className="bg-gradient-to-r from-purple-100/50 to-indigo-100/50 border border-purple-200/50 rounded-xl p-6 text-center">
          <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-3">
            <TrendingUp size={24} className="text-purple-600" />
          </div>
          <h4 className="font-semibold text-gray-800 mb-2">Advanced Analytics Coming Soon</h4>
          <p className="text-sm text-gray-600 mb-4">
            Track production efficiency, resource flow patterns, and optimization opportunities.
          </p>
          <div className="flex justify-center gap-4 text-xs text-gray-500">
            <span>• Production Trends</span>
            <span>• Efficiency Reports</span>
            <span>• Bottleneck Analysis</span>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={(e) => e.target === e.currentTarget && onClose()}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="bg-white/90 backdrop-blur-lg border border-white/50 rounded-3xl shadow-2xl w-full max-w-7xl max-h-[90vh] overflow-hidden"
        >
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 p-6 text-white relative">
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="absolute top-4 right-4 w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center hover:bg-white/30 transition-colors backdrop-blur-sm"
            >
              <X size={20} />
            </motion.button>
            
            <div className="flex items-center gap-4">
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm"
              >
                <Factory size={28} />
              </motion.div>
              <div>
                <motion.h1 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  className="text-3xl font-bold"
                >
                  Production Center
                </motion.h1>
                <motion.p 
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="text-blue-100 mt-1"
                >
                  Manage your city's production and resources
                </motion.p>
              </div>
            </div>
          </div>

          <div className="bg-gray-50/80 backdrop-blur-sm border-b border-white/20 px-6 py-4">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {renderTabButton('overview', <BarChart3 size={18} />, 'Overview')}
              {renderTabButton('buildings', <Factory size={18} />, 'Buildings', getActiveProductionCount())}
              {renderTabButton('inventory', <Package size={18} />, 'Inventory', getTotalResourceCount())}
              {renderTabButton('analytics', <TrendingUp size={18} />, 'Analytics')}
            </div>
          </div>

          <div className="p-6 h-[calc(90vh-200px)] overflow-y-auto">
            <AnimatePresence mode="wait">
              {activeTab === 'overview' && renderOverviewTab()}
              {activeTab === 'buildings' && renderBuildingsTab()}
              {activeTab === 'inventory' && renderInventoryTab()}
              {activeTab === 'analytics' && renderAnalyticsTab()}
            </AnimatePresence>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
