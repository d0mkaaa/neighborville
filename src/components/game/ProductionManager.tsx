import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Package, 
  Factory, 
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
  RefreshCw,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import type { Building } from '../../types/game';
import { 
  RESOURCES, 
  RECIPES, 
  type Resource, 
  type Recipe, 
  type ProductionQueue,
  getResourceById,
  getRecipeById,
  getRecipesByBuilding,
  calculateProductionCost,
  calculateProductionValue
} from '../../data/resources';
import { TimeService, type GameTime, type TimeCalculation } from '../../services/timeService';

interface ProductionManagerProps {
  grid?: (Building | null)[];
  playerResources: { [resourceId: string]: number };
  coins?: number;
  currentDay?: number;
  gameTime?: number;
  gameMinutes?: number;
  timeSpeed?: 1 | 2 | 3;
  onResourceUpdate?: (resourceId: string, quantity: number) => void;
  onUpdateResources?: (resources: { [resourceId: string]: number }) => void;
  onUpdateCoins?: (coins: number) => void;
  onUpdateGrid?: (grid: (Building | null)[]) => void;
  addNotification?: (message: string, type: 'success' | 'error' | 'warning' | 'info') => void;
  addXPAndLog?: (amount: number, source: string, description: string) => void;
  onXPGain?: (amount: number, source: string, description: string) => void;
  playerLevel?: number;
  onProductionQueuesUpdate?: (queues: Map<number, ProductionQueue[]>) => void;
}

export default function ProductionManager({
  grid = [],
  playerResources,
  coins = 0,
  currentDay = 1,
  gameTime = 8,
  gameMinutes = 0,
  timeSpeed = 1,
  onResourceUpdate,
  onUpdateResources,
  onUpdateCoins,
  onUpdateGrid,
  addNotification,
  addXPAndLog,
  onXPGain,
  playerLevel = 1,
  onProductionQueuesUpdate,
  externalProductionQueues,
  onAddToProductionQueue,
  onCancelProductionItem,
}: ProductionManagerProps & {
  externalProductionQueues?: Map<number, any[]>;
  onAddToProductionQueue?: (buildingIndex: number, recipeId: string, duration: number) => void;
  onCancelProductionItem?: (buildingIndex: number, itemId: string) => void;
}) {


  const [showProductionPanel, setShowProductionPanel] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<number | null>(null);
  const [internalProductionQueues, setInternalProductionQueues] = useState<Map<number, ProductionQueue[]>>(new Map());
  const productionQueues = externalProductionQueues || internalProductionQueues;
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null);  const [autoProductionEnabled, setAutoProductionEnabled] = useState<Map<number, boolean>>(new Map());

  const productionBuildings = grid
    .map((building, index) => ({ building, index }))
    .filter(({ building }) => building?.productionType);
  useEffect(() => {
    if (externalProductionQueues) return;
    
    const interval = setInterval(() => {
      const updatedQueues = new Map(internalProductionQueues);
      let resourcesChanged = false;
      const newResources = { ...playerResources };
      const currentTime = TimeService.getCurrentTime(gameTime, gameMinutes);

      updatedQueues.forEach((queue, buildingIndex) => {
        const completedItems: string[] = [];
        
        queue.forEach((item, itemIndex) => {
          if (item.status === 'active' && currentTime.totalMinutes >= item.completionTime) {
            const recipe = getRecipeById(item.recipeId);            if (recipe) {
              recipe.outputs.forEach(output => {
                newResources[output.resourceId] = (newResources[output.resourceId] || 0) + output.quantity;
                resourcesChanged = true;
              });
              
              if (addXPAndLog) {
                addXPAndLog(recipe.xpReward, 'crafting', `Completed ${recipe.name}`);
              }
              
              const building = grid[buildingIndex];
              addNotification?.(
                `${building?.name} completed ${recipe.name}!`,
                'success'
              );
              
              completedItems.push(item.id);
            }
          }
        });
          if (completedItems.length > 0) {
          const updatedQueue = queue.filter(item => !completedItems.includes(item.id));
          
          const nextItem = updatedQueue.find(item => item.status === 'queued');
          if (nextItem) {
            nextItem.status = 'active';
            nextItem.startTime = currentTime.totalMinutes;
            const recipe = getRecipeById(nextItem.recipeId);
            if (recipe) {
              const productionDuration = TimeService.calculateProductionTime(recipe.productionTime, timeSpeed);
              nextItem.completionTime = currentTime.totalMinutes + productionDuration;
            }
          }
          
          updatedQueues.set(buildingIndex, updatedQueue);
        }
      });
      
      if (resourcesChanged) {
        onUpdateResources?.(newResources);
      }
      
      setInternalProductionQueues(updatedQueues);      onProductionQueuesUpdate?.(updatedQueues);
    }, 1000);

    return () => clearInterval(interval);
  }, [gameTime, gameMinutes, internalProductionQueues, playerResources, grid, onUpdateResources, addNotification, addXPAndLog, timeSpeed, externalProductionQueues]);
  const startProduction = useCallback((buildingIndex: number, recipeId: string) => {
    if (onAddToProductionQueue) {
      if (recipeId.startsWith('extract_')) {
        const resourceId = recipeId.replace('extract_', '');
        const building = grid[buildingIndex];
        if (building?.produces) {
          const production = building.produces.find(p => p.resourceId === resourceId);
          if (production) {
            onAddToProductionQueue(buildingIndex, recipeId, production.timeMinutes);
            return;
          }
        }
        addNotification?.(`Auto-production not found for ${resourceId}`, 'error');
        return;      }
      
      const recipe = getRecipeById(recipeId);
      if (recipe) {
        onAddToProductionQueue(buildingIndex, recipeId, recipe.productionTime);
        return;
      } else {
        addNotification?.(`Recipe not found: ${recipeId}`, 'error');
        return;
      }    }

    const building = grid[buildingIndex];
    
    if (!building) {
      addNotification?.('Invalid building', 'error');
      return;
    }    let recipe: Recipe | undefined;
    
    if (building.produces && building.produces.length > 0) {
      const production = building.produces[0];      const resource = getResourceById(production.resourceId);
      
      recipe = {
        id: `extract_${production.resourceId}`,
        name: `Extract ${resource?.name || 'Resource'}`,
        description: `Extract ${production.quantity} ${resource?.name} from ${building.name}`,        icon: resource?.icon || '⚡',
        category: 'production' as const,
        inputs: [],
        outputs: [{ resourceId: production.resourceId, quantity: production.quantity }],
        productionTime: production.timeMinutes,
        xpReward: Math.ceil(production.quantity / 2),
        unlockLevel: 1,
        requiredBuilding: building.id      };
    } else {
      recipe = getRecipeById(recipeId);
    }
    
    if (!recipe) {
      addNotification?.('Invalid recipe', 'error');
      return;    }

    const hasResources = recipe.inputs.every(input =>
      (playerResources[input.resourceId] || 0) >= input.quantity
    );

    if (!hasResources) {
      addNotification?.('Not enough resources to start production', 'error');
      return;    }

    const newResources = { ...playerResources };
    recipe.inputs.forEach(input => {
      newResources[input.resourceId] -= input.quantity;
    });    onUpdateResources?.(newResources);

    const currentQueue = internalProductionQueues.get(buildingIndex) || [];
    const currentTime = TimeService.getCurrentTime(gameTime, gameMinutes);
    const productionDuration = TimeService.calculateProductionTime(recipe.productionTime, timeSpeed);
    
    const newItem: ProductionQueue = {
      id: `${buildingIndex}-${Date.now()}`,
      recipeId: recipe.id,
      startTime: currentQueue.length === 0 ? currentTime.totalMinutes : 0,
      completionTime: currentQueue.length === 0 ? currentTime.totalMinutes + productionDuration : 0,
      buildingIndex,
      status: currentQueue.length === 0 ? 'active' : 'queued'
    };

    const updatedQueues = new Map(internalProductionQueues);
    updatedQueues.set(buildingIndex, [...currentQueue, newItem]);
    setInternalProductionQueues(updatedQueues);
    onProductionQueuesUpdate?.(updatedQueues);

    addNotification?.(`Started production of ${recipe.name}`, 'success');
  }, [grid, playerResources, gameTime, gameMinutes, internalProductionQueues, onUpdateResources, addNotification, timeSpeed, onAddToProductionQueue]);
  const cancelProduction = useCallback((buildingIndex: number, itemId: string) => {
    if (onCancelProductionItem) {
      console.log(`🗑️ Using external cancelProductionItem: Building ${buildingIndex}, Item ${itemId}`);
      onCancelProductionItem(buildingIndex, itemId);      return;
    }

    const currentQueue = internalProductionQueues.get(buildingIndex) || [];
    const updatedQueue = currentQueue.filter(item => item.id !== itemId);
    const updatedQueues = new Map(internalProductionQueues);
    updatedQueues.set(buildingIndex, updatedQueue);
    setInternalProductionQueues(updatedQueues);
    onProductionQueuesUpdate?.(updatedQueues);
    
    addNotification?.('Production cancelled', 'warning');
  }, [internalProductionQueues, addNotification, onCancelProductionItem]);

  const getProductionProgress = (item: ProductionQueue): number => {
    if (item.status !== 'active') return 0;
    const currentTime = TimeService.getCurrentTime(gameTime, gameMinutes);
    const calculation = TimeService.calculateProgress(item.startTime, item.completionTime, currentTime.totalMinutes);
    return calculation.progress;
  };

  const getAvailableProductions = (building: Building): { id: string; name: string; time: number; outputs: any[] }[] => {    const productions = [];
    
    if (building.produces && building.produces.length > 0) {
      building.produces.forEach(production => {
        const resource = getResourceById(production.resourceId);
        productions.push({
          id: `extract_${production.resourceId}`,
          name: `Extract ${resource?.name || 'Resource'}`,
          time: production.timeMinutes,
          outputs: [{ resourceId: production.resourceId, quantity: production.quantity }]
        });
      });    }
    
    const availableRecipes = getRecipesByBuilding(building.id) || [];
    availableRecipes.forEach(recipe => {
      productions.push({
        id: recipe.id,
        name: recipe.name,
        time: recipe.productionTime,
        outputs: recipe.outputs
      });
    });
    
    return productions;
  };

  const canAffordRecipe = (recipe: Recipe): boolean => {
    return recipe.inputs.every(input => 
      (playerResources[input.resourceId] || 0) >= input.quantity
    );
  };

  const ResourceDisplay = ({ resourceId, quantity }: { resourceId: string; quantity: number }) => {
    const resource = getResourceById(resourceId);
    const playerQuantity = playerResources[resourceId] || 0;
    const hasEnough = playerQuantity >= quantity;
    
    return (
      <div className={`flex items-center gap-1 text-xs ${hasEnough ? 'text-green-600' : 'text-red-500'}`}>
        <span>{resource?.icon}</span>
        <span>{quantity}</span>
        <span className="text-gray-500">({playerQuantity})</span>
      </div>
    );  };

  const renderModalProductionView = () => {
    if (productionBuildings.length === 0) {
      return (
        <div className="text-center py-12">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white/70 backdrop-blur-sm rounded-2xl p-8 border border-white/30 shadow-lg mx-auto max-w-md"
          >
            <Factory size={64} className="mx-auto mb-4 text-gray-400" />
            <h3 className="text-xl font-bold text-gray-700 mb-2">No Production Buildings</h3>
            <p className="text-gray-600 mb-4">Build factories and workshops to start producing resources!</p>
            <div className="text-sm text-gray-500">
              Available production buildings: Sawmill, Stone Quarry, Iron Mine, Workshop
            </div>
          </motion.div>
        </div>
      );
    }

    return (
      <div className="space-y-6">
        {productionBuildings.map(({ building, index }) => {
          if (!building) return null;
          
          const queue = productionQueues.get(index) || [];
          const availableRecipes = getRecipesByBuilding(building.id) || [];
          const activeItems = queue.filter(item => item.status === 'active');
          const queuedItems = queue.filter(item => item.status === 'queued');
          
          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/80 backdrop-blur-sm rounded-2xl border border-white/40 shadow-lg overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">{building.icon}</div>
                    <div>
                      <h3 className="font-bold text-lg">{building.name}</h3>
                      <div className="text-blue-100 text-sm flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Play size={14} />
                          {activeItems.length} Active
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {queuedItems.length} Queued
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    {activeItems.length > 0 ? (
                      <motion.div
                        animate={{ scale: [1, 1.2, 1] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="w-3 h-3 bg-green-400 rounded-full"
                      />
                    ) : (
                      <div className="w-3 h-3 bg-gray-400 rounded-full" />
                    )}
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {activeItems.length > 0 && (
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                      <Zap size={16} className="text-green-600" />
                      Currently Producing
                    </h4>
                    <div className="space-y-3">
                      {activeItems.map((item) => {
                        const recipe = getRecipeById(item.recipeId);
                        const progress = getProductionProgress(item);
                        
                        return (
                          <motion.div
                            key={item.id}
                            className="bg-green-50 border border-green-200 rounded-xl p-4"
                          >
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                  <RefreshCw size={16} className="text-green-600 animate-spin" />
                                </div>                                <div>
                                  <div className="font-semibold text-gray-900">{recipe?.name}</div>                                  <div className="text-sm text-gray-600">
                                    {Math.round(progress)}% complete • {(() => {
                                      const currentTime = TimeService.getCurrentTime(gameTime, gameMinutes);
                                      const remaining = Math.max(0, item.completionTime - currentTime.totalMinutes);
                                      
                                      if (remaining > 60) {
                                        console.log(`🐛 ProductionManager: Long remaining time detected!`);
                                        console.log(`  Current time: ${currentTime.totalMinutes} minutes (${gameTime}:${gameMinutes})`);
                                        console.log(`  Completion time: ${item.completionTime} minutes`);
                                        console.log(`  Calculated remaining: ${remaining} minutes`);
                                        console.log(`  Recipe ID: ${item.recipeId}`);
                                        console.log(`  Item:`, item);
                                      }
                                      
                                      const remainingText = remaining <= 0 ? 'Ready now!' : TimeService.formatDuration(remaining);
                                      const completionTime = remaining > 0 ? TimeService.formatCompletionTime(gameTime, gameMinutes, remaining) : '';
                                      return remaining <= 0 ? remainingText : `${remainingText} (finishes at ${completionTime})`;
                                    })()}
                                  </div>
                                </div>
                              </div>
                              
                              <button
                                onClick={() => cancelProduction(index, item.id)}
                                className="w-8 h-8 bg-red-100 hover:bg-red-200 rounded-lg flex items-center justify-center text-red-600 transition-colors"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                            
                            <div className="w-full bg-green-200 rounded-full h-2 mb-3">
                              <motion.div
                                className="bg-green-500 h-2 rounded-full"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{ duration: 0.5 }}
                              />
                            </div>
                            
                            {recipe && (
                              <div className="flex justify-between text-sm">
                                <div>
                                  <span className="text-gray-600">Inputs: </span>
                                  {recipe.inputs.map(input => (
                                    <span key={input.resourceId} className="inline-flex items-center gap-1 mr-2">
                                      {getResourceById(input.resourceId)?.icon} {input.quantity}
                                    </span>
                                  ))}
                                </div>
                                <div>
                                  <span className="text-gray-600">Outputs: </span>
                                  {recipe.outputs.map(output => (
                                    <span key={output.resourceId} className="inline-flex items-center gap-1 mr-2">
                                      {getResourceById(output.resourceId)?.icon} {output.quantity}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {queue.length > 0 && (
                  <div className="mb-3">
                    <h5 className="text-xs font-medium text-gray-700 mb-2">Production Queue</h5>
                    {queue.map((item) => {
                      const recipe = getRecipeById(item.recipeId);
                      const progress = getProductionProgress(item);
                      
                      return (
                        <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded mb-1">
                          <div className="flex-1">
                            <div className="text-xs font-medium">{recipe?.name}</div>
                            {item.status === 'active' && (
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                <div
                                  className="bg-blue-500 h-1 rounded-full transition-all"
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => cancelProduction(index, item.id)}
                            className="text-red-500 hover:text-red-700 ml-2"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {(() => {
                  const availableProductions = getAvailableProductions(building);
                  return availableProductions.length > 0 && (
                    <div className="mb-3">
                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                        <Plus size={16} className="text-blue-600" />
                        Available Productions
                      </h4>
                      <div className="space-y-2">
                        {availableProductions.map(production => (
                          <div key={production.id} className="bg-white border border-gray-200 rounded-xl p-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-gray-900">{production.name}</span>
                              <span className="text-sm text-gray-500">
                                {TimeService.formatDuration(TimeService.calculateProductionTime(production.time, timeSpeed))} ({timeSpeed}x speed)
                              </span>
                            </div>
                            
                            <div className="flex justify-between items-center mb-3">
                              <div className="text-sm text-gray-600">Produces:</div>
                              <div className="flex items-center gap-2">
                                {production.outputs.map(output => (
                                  <div key={output.resourceId} className="flex items-center gap-1 text-sm text-green-600">
                                    <span>{getResourceById(output.resourceId)?.icon}</span>
                                    <span>{output.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            
                            <button
                              onClick={() => startProduction(index, production.id)}
                              className="w-full py-2 px-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                            >
                              Start Production
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })()}
              </div>
            </motion.div>
          );
        })}
      </div>
    );  };

  const isModalContext = !showProductionPanel;

  if (isModalContext) {
    return renderModalProductionView();
  }

  return (
    <>
          <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => setShowProductionPanel(!showProductionPanel)}
        className="fixed bottom-32 right-4 w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 text-white rounded-full shadow-lg transition-all flex items-center justify-center"
        title="Production Manager"
      >
        <Factory size={20} />
      </motion.button>

      <AnimatePresence>
        {showProductionPanel && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            className="fixed right-4 top-20 bottom-20 w-80 bg-white/95 backdrop-blur-sm rounded-xl shadow-xl overflow-hidden z-40"
          >
            <div className="h-full flex flex-col">
              <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Factory size={20} />
                    <h3 className="font-medium">Production Manager</h3>
                  </div>
                  <button
                    onClick={() => setShowProductionPanel(false)}
                    className="text-white/80 hover:text-white"
                  >
                    ×
                  </button>
                </div>
              </div>

              <div className="p-4 border-b">
                <h4 className="font-medium text-gray-800 mb-2 flex items-center gap-2">
                  <Package size={16} />
                  Resources
                </h4>
                <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
                  {RESOURCES.slice(0, 10).map(resource => (
                    <div key={resource.id} className="flex items-center gap-2 text-xs">
                      <span>{resource.icon}</span>
                      <span className="truncate">{resource.name}</span>
                      <span className="text-blue-600 ml-auto">
                        {playerResources[resource.id] || 0}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <h4 className="font-medium text-gray-800 mb-3 flex items-center gap-2">
                  <TrendingUp size={16} />
                  Production Buildings ({productionBuildings.length})
                </h4>
                
                <div className="space-y-3">
                  {productionBuildings.map(({ building, index }) => {
                    if (!building) return null;
                    
                    const queue = productionQueues.get(index) || [];
                    const availableRecipes = getRecipesByBuilding(building.id);
                    const isSelected = selectedBuilding === index;
                    
                    return (
                      <div key={index} className="border rounded-lg overflow-hidden">
                        <button
                          onClick={() => setSelectedBuilding(isSelected ? null : index)}
                          className="w-full p-3 text-left hover:bg-gray-50 flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{building.icon}</span>
                            <div>
                              <div className="font-medium text-sm">{building.name}</div>
                              <div className="text-xs text-gray-500">
                                Queue: {queue.length} | Recipes: {availableRecipes.length}
                              </div>
                            </div>
                          </div>
                          {isSelected ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                        
                        <AnimatePresence>
                          {isSelected && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: 'auto' }}
                              exit={{ height: 0 }}
                              className="overflow-hidden"
                            >
                              <div className="p-3 border-t bg-gray-50">
                                {queue.length > 0 && (
                                  <div>
                                    <h5 className="text-xs font-medium text-gray-700 mb-2">Active Production</h5>
                                    {queue.map((item) => {
                                      const recipe = getRecipeById(item.recipeId);
                                      const progress = getProductionProgress(item);
                                      
                                      return (
                                        <div key={item.id} className="bg-white p-2 rounded mb-2">
                                          <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-3">
                                              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                                                <RefreshCw size={16} className="text-green-600 animate-spin" />
                                              </div>
                                              <div>
                                                <div className="font-semibold text-gray-900">{recipe?.name}</div>                                                <div className="text-sm text-gray-600">
                                                  {Math.round(progress)}% complete • {(() => {
                                                    const currentTime = TimeService.getCurrentTime(gameTime, gameMinutes);
                                                    const remaining = Math.max(0, item.completionTime - currentTime.totalMinutes);
                                                    
                                                    if (remaining > 60) {
                                                      console.log(`🐛 ProductionManager: Long remaining time detected!`);
                                                      console.log(`  Current time: ${currentTime.totalMinutes} minutes (${gameTime}:${gameMinutes})`);
                                                      console.log(`  Completion time: ${item.completionTime} minutes`);
                                                      console.log(`  Calculated remaining: ${remaining} minutes`);
                                                      console.log(`  Recipe ID: ${item.recipeId}`);
                                                      console.log(`  Item:`, item);
                                                    }
                                                    
                                                    const remainingText = remaining <= 0 ? 'Ready now!' : TimeService.formatDuration(remaining);
                                                    const completionTime = remaining > 0 ? TimeService.formatCompletionTime(gameTime, gameMinutes, remaining) : '';
                                                    return remaining <= 0 ? remainingText : `${remainingText} (finishes at ${completionTime})`;
                                                  })()}
                                                </div>
                                              </div>
                                            </div>
                                            
                                            <button
                                              onClick={(e) => {
                                                e.stopPropagation();
                                                cancelProduction(index, item.id);
                                              }}
                                              className="text-red-500 hover:text-red-700 ml-2"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                          </div>
                                          
                                          <div className="w-full bg-green-200 rounded-full h-2 mb-3">
                                            <motion.div
                                              className="bg-green-500 h-2 rounded-full"
                                              initial={{ width: 0 }}
                                              animate={{ width: `${progress}%` }}
                                              transition={{ duration: 0.5 }}
                                            />
                                          </div>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                
                                {queue.length > 0 && (
                                  <div className="mb-3">
                                    <h5 className="text-xs font-medium text-gray-700 mb-2">Production Queue</h5>
                                    {queue.map((item) => {
                                      const recipe = getRecipeById(item.recipeId);
                                      const progress = getProductionProgress(item);
                                      
                                      return (
                                        <div key={item.id} className="flex items-center justify-between bg-white p-2 rounded mb-1">
                                          <div className="flex-1">
                                            <div className="text-xs font-medium">{recipe?.name}</div>
                                            {item.status === 'active' && (
                                              <div className="w-full bg-gray-200 rounded-full h-1 mt-1">
                                                <div
                                                  className="bg-blue-500 h-1 rounded-full transition-all"
                                                  style={{ width: `${progress}%` }}
                                                />
                                              </div>
                                            )}
                                          </div>
                                          <button
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              cancelProduction(index, item.id);
                                            }}
                                            className="text-red-500 hover:text-red-700 ml-2"
                                          >
                                            <Trash2 size={12} />
                                          </button>
                                        </div>
                                      );
                                    })}
                                  </div>
                                )}
                                
                                {(() => {
                                  const availableProductions = getAvailableProductions(building);
                                  return availableProductions.length > 0 && (
                                    <div className="mb-3">
                                      <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                                        <Plus size={16} className="text-blue-600" />
                                        Available Productions
                                      </h4>
                                      <div className="space-y-2">
                                        {availableProductions.map(production => (
                                          <div key={production.id} className="bg-white border border-gray-200 rounded-xl p-4">
                                            <div className="flex items-center justify-between mb-2">
                                              <span className="font-medium text-gray-900">{production.name}</span>
                                              <span className="text-sm text-gray-500">
                                                {TimeService.formatDuration(TimeService.calculateProductionTime(production.time, timeSpeed))} ({timeSpeed}x speed)
                                              </span>
                                            </div>
                                            
                                            <div className="flex justify-between items-center mb-3">
                                              <div className="text-sm text-gray-600">Produces:</div>
                                              <div className="flex items-center gap-2">
                                                {production.outputs.map(output => (
                                                  <div key={output.resourceId} className="flex items-center gap-1 text-sm text-green-600">
                                                    <span>{getResourceById(output.resourceId)?.icon}</span>
                                                    <span>{output.quantity}</span>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                            
                                            <button
                                              onClick={() => startProduction(index, production.id)}
                                              className="w-full py-2 px-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors font-medium"
                                            >
                                              Start Production
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })()}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    );
                  })}
                </div>
                
                {productionBuildings.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    <Factory size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No production buildings found</p>
                    <p className="text-xs">Build factories and workshops to start producing resources!</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
