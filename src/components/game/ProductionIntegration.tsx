import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Factory, 
  Package, 
  Clock, 
  Play, 
  Pause, 
  Trash2, 
  Plus,
  ChevronDown,
  ChevronUp,
  Settings,
  TrendingUp,
  Zap,
  CheckCircle2,
  AlertCircle,
  BarChart3,
  RefreshCw,
  Timer,
  ArrowRight,
  Target,
  ChevronRight,
  Wrench
} from 'lucide-react';
import ProductionManager from './ProductionManager';
import ResourceInventory from './ResourceInventory';
import { RESOURCES, RECIPES, getResourceById, getRecipeById, getRecipesByBuilding } from '../../data/resources';
import type { PlayerResources, ProductionStats, Building } from '../../types/game';

interface ProductionQueueItem {  id: string;
  recipeId: string;
  buildingIndex: number;
  startTime: number;
  endTime: number;
  status: 'queued' | 'active' | 'completed';
  progress: number;
}

type ProductionQueues = Map<number, ProductionQueueItem[]>;

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
  productionQueues?: ProductionQueues;
  onAddToProductionQueue?: (buildingIndex: number, recipeId: string, duration: number) => void;
  onCancelProductionItem?: (buildingIndex: number, itemId: string) => void;


  getProductionQueueForBuilding?: (buildingIndex: number) => ProductionQueueItem[];
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
  productionQueues,
  onAddToProductionQueue,
  onCancelProductionItem,
  getProductionQueueForBuilding
}: ProductionIntegrationProps) {
  const [activeTab, setActiveTab] = useState<'overview' | 'production' | 'resources'>('overview');
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
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
    let activeCount = 0;
    
    if (productionQueues) {
      productionQueues.forEach(queue => {
        activeCount += queue.filter(item => item.status === 'active').length;
      });
    }
    
    return activeCount;
  };

  const getProductionEfficiency = () => {
    const totalBuildings = productionBuildings.length;
    const activeBuildings = productionBuildings.filter(({ building, index }) => 
      (productionQueues?.get(index) || []).some(item => item.status === 'active')
    ).length;
    return totalBuildings > 0 ? Math.round((activeBuildings / totalBuildings) * 100) : 0;
  };

  const getProductionValue = () => {
    let totalValue = 0;
    if (productionQueues) {
      productionQueues.forEach(queue => {
        queue.forEach(item => {
          if (item.status === 'active') {
            const recipe = getRecipeById(item.recipeId);
            if (recipe) {
              totalValue += recipe.outputs.reduce((sum, output) => {
                const resource = getResourceById(output.resourceId);
                return sum + (resource?.baseValue || 0) * output.quantity;
              }, 0);
            }
          }
        });
      });
    }
    return totalValue;
  };

  const renderTabButton = (tabId: string, icon: React.ReactNode, label: string, badge?: number) => (
    <button
      onClick={() => setActiveTab(tabId as any)}
      className={`relative flex-1 py-3 px-4 rounded-xl font-medium transition-all duration-300 flex items-center justify-center gap-2 ${
        activeTab === tabId
          ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white shadow-lg transform scale-105'
          : 'text-gray-600 hover:bg-white/50 hover:text-blue-600'
      }`}
    >
      <div className="relative">
        {icon}
        {tabId === 'production' && getActiveProductionCount() > 0 && (
          <motion.div
            animate={{ scale: [1, 1.3, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
            className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full"
          />
        )}
      </div>
      <span className="font-semibold">{label}</span>
      {badge !== undefined && badge > 0 && (
        <motion.span 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`absolute -top-1 -right-1 min-w-[20px] h-5 rounded-full text-xs font-bold flex items-center justify-center px-1 ${
            activeTab === tabId ? 'bg-white text-blue-600' : 'bg-blue-500 text-white'
          }`}
        >
          {badge > 99 ? '99+' : badge}
        </motion.span>
      )}
    </button>
  );
const getGameTimeFromHoursAndMinutes = (hours: number, minutes: number): number => {
  return hours * 60 + minutes;
};

const getCurrentGameTimeMinutes = (directTime?: number, hours?: number, minutes?: number): number => {
  if (directTime !== undefined && !isNaN(directTime) && directTime >= 0) {
    return directTime;
  }
  
  const totalMinutes = (hours || 0) * 60 + (minutes || 0);
  return isNaN(totalMinutes) ? 0 : totalMinutes;
};

const formatGameTimeRemaining = (gameTimeUnits: number): string => {
  if (isNaN(gameTimeUnits) || gameTimeUnits < 0) {
    return '0m';
  }
  
  const totalMinutes = Math.ceil(gameTimeUnits);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return `${minutes}m`;
};

const formatCompletionTime = (endTimeMinutes: number): string => {
  if (isNaN(endTimeMinutes) || endTimeMinutes < 0) {
    return '--:--';
  }
  
  const hours = Math.floor(endTimeMinutes / 60);
  const minutes = endTimeMinutes % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
};

const formatProductionTime = (recipeMinutes: number, timeSpeed: number): string => {
  const adjustedMinutes = Math.ceil(recipeMinutes / timeSpeed);
  const hours = Math.floor(adjustedMinutes / 60);
  const minutes = adjustedMinutes % 60;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m (${timeSpeed}x speed)`;
  }
  return `${minutes}m (${timeSpeed}x speed)`;
};

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 backdrop-blur-xl rounded-3xl p-8 w-full max-w-6xl max-h-[95vh] overflow-hidden shadow-2xl border border-white/20"
      >
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
              <Factory size={24} className="text-white" />
            </div>
            <div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Production & Resources
              </h2>
              <p className="text-gray-600">Manage your city's production and resource flow</p>
            </div>
          </div>
          
          <motion.button
            whileHover={{ scale: 1.1, rotate: 90 }}
            whileTap={{ scale: 0.9 }}
            onClick={onClose}
            className="w-10 h-10 bg-gray-100 hover:bg-red-100 rounded-full flex items-center justify-center text-gray-500 hover:text-red-500 transition-colors"
          >
            ✕
          </motion.button>
        </div> 
        <div className="grid grid-cols-4 gap-4 mb-8">
          <motion.div 
            key={`stats-resources-${forceUpdate}`}
            whileHover={{ scale: 1.02 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/30 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Package size={20} className="text-blue-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{getTotalResourceCount()}</div>
                <div className="text-sm text-gray-600">Total Resources</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            key={`stats-production-${forceUpdate}`}
            whileHover={{ scale: 1.02 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/30 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center relative">
                <Play size={20} className="text-green-600" />
                {getActiveProductionCount() > 0 && (
                  <motion.div
                    className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full"
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  />
                )}
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{getActiveProductionCount()}</div>
                <div className="text-sm text-gray-600">Active Production</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            key={`stats-buildings-${forceUpdate}`}
            whileHover={{ scale: 1.02 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/30 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Factory size={20} className="text-purple-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">{productionBuildings.length}</div>
                <div className="text-sm text-gray-600">Production Buildings</div>
                <div className="text-xs text-purple-600 font-medium">{getProductionEfficiency()}% Efficiency</div>
              </div>
            </div>
          </motion.div>

          <motion.div 
            key={`stats-value-${forceUpdate}`}
            whileHover={{ scale: 1.02 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-4 border border-white/30 shadow-lg"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center">
                <TrendingUp size={20} className="text-orange-600" />
              </div>
              <div>
                <div className="text-2xl font-bold text-gray-900">
                  {getProductionValue().toFixed(0)} coins
                </div>
                <div className="text-sm text-gray-600">Production Value</div>
              </div>
            </div>
            
            {getActiveProductionCount() > 0 && (
              <div className="border-t border-gray-200 pt-4 mt-4">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Production Status:</span>
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1 text-green-600">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      <span>{getActiveProductionCount()} active</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-600">
                      <Timer size={12} />
                      <span>{getProductionEfficiency()}% efficiency</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>

        <div className="flex space-x-2 mb-8 bg-gray-100/50 backdrop-blur-sm p-2 rounded-2xl border border-white/30">          {renderTabButton('overview', <BarChart3 size={18} />, 'Overview')}
          {renderTabButton('production', <Factory size={18} />, 'Production', getActiveProductionCount())}
          {renderTabButton('resources', <Package size={18} />, 'Resources', Object.keys(playerResources).filter(id => playerResources[id] > 0).length)}
        </div>

        {getActiveProductionCount() > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-r from-green-100 to-emerald-100 border border-green-200 rounded-xl p-3 mb-6"
          >
            <div className="flex items-center gap-3">
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="w-3 h-3 bg-green-500 rounded-full"
              />
              <span className="text-green-800 font-medium">
                {getActiveProductionCount()} production{getActiveProductionCount() !== 1 ? 's' : ''} currently active
              </span>
              <span className="text-green-600 text-sm ml-auto">
                {getProductionValue().toFixed(0)} total value
              </span>
            </div>
          </motion.div>
        )}

        <div className="h-[calc(95vh-400px)] overflow-y-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              > 
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Package size={20} className="text-blue-600" />
                    Resource Inventory
                    <div className="flex items-center gap-4 ml-auto text-sm">
                      <span className="text-gray-600">
                        {Object.keys(playerResources).filter(id => playerResources[id] > 0).length} types
                      </span>
                      <span className="text-blue-600 font-medium">
                        {getTotalResourceCount()} total
                      </span>
                    </div>
                  </h3>
                  
                  <div className="grid grid-cols-6 gap-4 mb-4">
                    {Object.entries(playerResources)
                      .filter(([_, quantity]) => quantity > 0)
                      .slice(0, 12)
                      .map(([resourceId, quantity]) => {
                        const resource = getResourceById(resourceId);
                        return (
                          <motion.div
                            key={resourceId}
                            whileHover={{ scale: 1.05 }}
                            className="bg-white/80 rounded-xl p-3 text-center border border-white/50 shadow-sm relative group"
                          >
                            <div className="text-2xl mb-1">{resource?.icon}</div>
                            <div className="font-bold text-gray-900">{quantity}</div>
                            <div className="text-xs text-gray-600 truncate">{resource?.name}</div>
                            
                            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
                              Value: ${((resource?.baseValue || 0) * quantity).toFixed(0)}
                            </div>
                          </motion.div>
                        );
                      })}
                  </div>

                  {getActiveProductionCount() > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Production Status:</span>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-1 text-green-600">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                            <span>{getActiveProductionCount()} active</span>
                          </div>
                          <div className="flex items-center gap-1 text-blue-600">
                            <Timer size={12} />
                            <span>{getProductionEfficiency()}% efficiency</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="bg-white/70 backdrop-blur-sm rounded-2xl p-6 border border-white/30 shadow-lg">
                  <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Zap size={20} className="text-green-600" />
                    Active Production
                    <span className="text-sm font-normal text-gray-500 ml-auto">
                      {getActiveProductionCount()} active • {getProductionEfficiency()}% efficiency
                    </span>
                  </h3>
                  {productionBuildings.length > 0 ? (
                    <div className="space-y-4">
                      {productionBuildings.filter(({ building }) => building?.produces).map(({ building, index }) => (
                        <motion.div
                          key={`auto-${index}-${forceUpdate}`}
                          whileHover={{ scale: 1.01 }}
                          className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200 shadow-sm"
                        >
                          <div className="flex items-center gap-3">
                            <div className="text-2xl">{building?.icon}</div>
                            <div className="flex-1">
                              <div className="font-semibold text-gray-900 flex items-center gap-2">
                                {building?.name}
                                <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                  AUTO
                                </span>
                              </div>
                              <div className="text-sm text-gray-600">
                                Continuously produces: {building?.produces?.map(p => {
                                  const resource = getResourceById(p.resourceId);
                                  return `${resource?.icon} ${p.quantity} ${resource?.name}`;
                                }).join(', ')}
                              </div>                              <div className="text-xs text-green-600 mt-1">
                                Next production: {building?.produces?.[0]?.timeMinutes ? 
                                  formatProductionTime(building.produces[0].timeMinutes, timeSpeed) : 
                                  'Unknown'
                                }
                              </div>
                            </div>
                            <div className="flex flex-col items-center">
                              <motion.div
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-4 h-4 bg-green-500 rounded-full mb-1"
                              />
                              <span className="text-xs text-green-600 font-medium">ACTIVE</span>
                            </div>
                          </div>
                        </motion.div>
                        ))} 
                      {productionBuildings.filter(({ building }) => !building?.produces).slice(0, 4).map(({ building, index }) => {
                        const buildingQueue = productionQueues?.get(index) || [];
                        const activeProduction = buildingQueue.find(item => item.status === 'active');
                        const hasActiveProduction = !!activeProduction;
                        
                        console.log(`🏭 Manual Production Building ${index}:`, {
                          building: building?.name,
                          queueLength: buildingQueue.length,
                          activeProduction,
                          hasActiveProduction
                        });
                        
                        return (
                          <motion.div
                            key={`manual-${index}-${forceUpdate}`}
                            whileHover={{ scale: 1.01 }}
                            className={`rounded-xl p-4 border shadow-sm ${
                              hasActiveProduction 
                                ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200' 
                                : 'bg-white/80 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <div className="text-2xl">{building?.icon}</div>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-900 flex items-center gap-2">
                                  {building?.name}
                                  {hasActiveProduction && (
                                    <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs rounded-full font-medium">
                                      PRODUCING
                                    </span>
                                  )}
                                </div>
                                
                                {hasActiveProduction ? (
                                  <div className="space-y-2">
                                    <div className="text-sm text-gray-600">
                                      {(() => {
                                        const recipe = getRecipeById(activeProduction.recipeId);
                                        return `Creating ${recipe?.name}`;
                                      })()}
                                    </div>
                                    
                                    <div className="w-full bg-blue-200 rounded-full h-2">
                                      <motion.div
                                        key={`progress-${activeProduction.id}-${forceUpdate}`}
                                        className="bg-blue-500 h-2 rounded-full"
                                        initial={{ width: 0 }}
                                        animate={{ 
                                          width: `${(() => {
                                            const currentGameTime = getCurrentGameTimeMinutes(currentGameTimeMinutes, gameTime, gameMinutes);
                                              if (currentGameTime < activeProduction.startTime) {
                                              return 0;
                                            }
                                            
                                            const elapsed = Math.max(0, currentGameTime - activeProduction.startTime);
                                            const total = Math.max(1, activeProduction.endTime - activeProduction.startTime);
                                            const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
                                            
                                            return isNaN(progress) ? 0 : progress;
                                          })()}%` 
                                        }}
                                        transition={{ duration: 0.3 }}
                                      />
                                    </div>                                    <div className="text-xs text-blue-600">
                                      {(() => {
                                        const currentGameTime = getCurrentGameTimeMinutes(currentGameTimeMinutes, gameTime, gameMinutes);
                                          if (currentGameTime < activeProduction.startTime) {
                                          const timeToStart = activeProduction.startTime - currentGameTime;
                                          return `Starting in ${formatGameTimeRemaining(timeToStart)} (starts at ${formatCompletionTime(activeProduction.startTime)})`;
                                        }
                                        
                                        const elapsed = Math.max(0, currentGameTime - activeProduction.startTime);
                                        const total = Math.max(1, activeProduction.endTime - activeProduction.startTime);
                                        const remaining = Math.max(0, activeProduction.endTime - currentGameTime);                                        const progress = Math.min(100, Math.max(0, (elapsed / total) * 100));
                                        return `${isNaN(progress) ? 0 : Math.round(progress)}% complete • ${formatGameTimeRemaining(remaining)} (finishes at ${formatCompletionTime(activeProduction.endTime)})`;
                                      })()}
                                    </div>
                                  </div>
                                ) : (
                                  <div className="text-sm text-gray-600">
                                    Idle • {buildingQueue.filter(item => item.status === 'queued').length} queued
                                  </div>
                                )}
                              </div>
                              <div className="flex flex-col items-center">
                                {hasActiveProduction ? (
                                  <motion.div
                                    animate={{ rotate: 360 }}
                                    transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                    className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full mb-1"
                                  />
                                ) : (
                                  <div className="w-4 h-4 bg-gray-400 rounded-full mb-1" />
                                )}
                                <span className={`text-xs font-medium ${
                                  hasActiveProduction ? 'text-blue-600' : 'text-gray-500'
                                }`}>
                                  {hasActiveProduction ? 'WORKING' : 'IDLE'}
                                </span>
                              </div>
                            </div>
                          </motion.div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Factory size={48} className="mx-auto mb-4 opacity-50" />
                      <p>No production buildings found</p>
                      <p className="text-sm">Build factories and workshops to start producing resources!</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'production' && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 overflow-hidden"
                >
                  <ProductionManager
                    grid={grid}
                    playerResources={playerResources}
                    gameTime={gameTime}
                    gameMinutes={gameMinutes}
                    timeSpeed={timeSpeed}
                    onResourceUpdate={handleResourceUpdate}
                    onUpdateResources={setPlayerResources}
                    addNotification={addNotification}
                    onXPGain={onXPGain}
                    playerLevel={playerLevel}
                    onProductionQueuesUpdate={handleProductionQueuesUpdate}
                    externalProductionQueues={productionQueues}
                    onAddToProductionQueue={onAddToProductionQueue}
                    onCancelProductionItem={onCancelProductionItem}
                  />
                </motion.div>
              </>
            )}
            
            {activeTab === 'resources' && (
              <>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex-1 overflow-hidden"
                >
                  <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-6 h-full">
                    <h3 className="text-xl font-bold text-gray-800 mb-6">Resource Inventory</h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(playerResources).map(([resourceId, quantity]) => {
                        const resource = getResourceById(resourceId);
                        if (!resource || quantity === 0) return null;
                        
                        return (
                          <motion.div
                            key={resourceId}
                            whileHover={{ scale: 1.02 }}
                            className="bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-white/30 shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-blue-500 rounded-lg flex items-center justify-center text-white font-bold text-sm">
                                {resource.icon || resource.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold text-gray-800">{resource.name}</div>
                                <div className="text-sm text-gray-600">{quantity} units</div>
                              </div>
                            </div>
                            {resource.description && (
                              <div className="text-xs text-gray-500 mt-2 p-2 bg-gray-50 rounded-lg">
                                {resource.description}
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                    
                    {Object.keys(playerResources).length === 0 && (
                      <div className="text-center py-12 text-gray-500">
                        <Package size={48} className="mx-auto mb-4 text-gray-300" />
                        <div className="text-xl font-semibold mb-2">No Resources</div>
                        <div className="text-sm">Start producing to build your resource inventory!</div>
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
