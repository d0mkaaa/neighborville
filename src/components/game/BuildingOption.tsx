import type { Building } from "../../types/game";
import { Home, Smile, Coffee, Book, Music, Zap, Sun, Lock, Droplets, Waves, Utensils, Code, Film, Factory, TrendingUp, Info } from "lucide-react";
import { motion } from "framer-motion";
import { getResourceById, getRecipesByBuilding } from "../../data/resources";

type BuildingOptionProps = {
  building: Building;
  isSelected: boolean;
  onSelect: (building: Building) => void;
  playerLevel?: number;
  playerCoins?: number;
  playerResources?: { [resourceId: string]: number };
};

export default function BuildingOption({ 
  building, 
  isSelected, 
  onSelect,
  playerLevel = 1,
  playerCoins,
  playerResources
}: BuildingOptionProps) {  const getIcon = () => {
    switch(building.icon) {
      case 'Home': return <Home size={24} className="text-white" />;
      case 'Smile': return <Smile size={24} className="text-white" />;
      case 'Coffee': return <Coffee size={24} className="text-white" />;
      case 'Book': return <Book size={24} className="text-white" />;
      case 'Music': return <Music size={24} className="text-white" />;
      case 'Zap': return <Zap size={24} className="text-white" />;
      case 'Sun': return <Sun size={24} className="text-white" />;
      case 'Factory': return <Factory size={24} className="text-white" />;
      default: return <Home size={24} className="text-white" />;
    }
  };  const isLocked = building.levelRequired && playerLevel < building.levelRequired;
  const canAfford = playerCoins !== undefined ? playerCoins >= (building.cost || 0) : true;  const isDisabled = isLocked || !canAfford;

  const getResourceRequirements = () => {
    if (building.productionType && building.id) {
      const recipes = getRecipesByBuilding(building.id);      if (recipes.length > 0) {
        return recipes[0].inputs;
      }
    }
    return [];
  };

  const resourceRequirements = getResourceRequirements();
  
  return (
    <motion.div
      whileHover={{ 
        scale: isDisabled ? 1 : 1.02, 
        boxShadow: isDisabled ? undefined : "0 15px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
      }}
      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      layout
      onClick={() => !isDisabled && onSelect(building)}
      className={`relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
        isSelected ? 'ring-4 ring-emerald-400 border-emerald-300' : 'border-transparent'
      } ${isDisabled ? 'opacity-60' : ''} ${!canAfford && !isLocked ? 'ring-2 ring-red-300 border-red-200' : ''}`}
      style={{ 
        background: isDisabled 
          ? 'linear-gradient(135deg, #f3f4f6, #e5e7eb)' 
          : `linear-gradient(135deg, ${building.color}15, ${building.color}08, white)`,
        minHeight: '220px'
      }}
    >
      <div className="p-4 flex flex-col h-full">
        <div className="flex items-start justify-between mb-3">
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: isSelected ? 1.1 : 1 }}
            transition={{ duration: 0.2 }}
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg relative ${
              isDisabled ? 'bg-gray-300' : ''
            }`}
            style={{ 
              background: isDisabled 
                ? undefined 
                : `linear-gradient(135deg, ${building.color}, ${building.color}dd)`
            }}
          >
            {isLocked ? (
              <Lock size={20} className="text-gray-500" />
            ) : (
              getIcon()
            )}
          </motion.div>
          
          {building.productionType && (
            <div className="flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
              <Factory size={12} />
              <span>Production</span>
            </div>
          )}
        </div>
        
        <div className="mb-3">
          <h3 className={`text-base font-semibold lowercase mb-1 ${
            isDisabled ? 'text-gray-500' : 'text-gray-800'
          }`}>
            {building.name}
          </h3>
          {building.description && (
            <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
              {building.description}
            </p>
          )}
        </div>
        
        {isLocked ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <Lock size={18} className="text-gray-400 mx-auto mb-1" />
              <div className="text-xs text-gray-400 font-medium">
                Level {building.levelRequired} required
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div className={`text-center p-2 rounded-lg ${
                !canAfford ? 'bg-red-50 border border-red-200' : 'bg-gray-50'
              }`}>
                <div className={`text-sm font-bold ${
                  !canAfford ? 'text-red-600' : 'text-gray-700'
                }`}>
                  {building.cost}c
                </div>
                <div className="text-xs text-gray-500">Cost</div>
              </div>
              
              <div className="text-center p-2 bg-green-50 rounded-lg">
                <div className="text-sm font-bold text-green-600">
                  {building.productionType ? (
                    <div className="flex items-center justify-center gap-1">
                      <TrendingUp size={12} />
                      <span>Prod.</span>
                    </div>
                  ) : (
                    `+${building.income}c`
                  )}
                </div>
                <div className="text-xs text-gray-500">
                  {building.productionType ? 'Building' : 'Income/day'}
                </div>
              </div>
            </div>
            
            {building.productionType && building.produces && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <Info size={12} />
                  <span>Produces:</span>
                </div>
                <div className="space-y-1">
                  {building.produces.slice(0, 2).map((production, i) => {
                    const resource = getResourceById(production.resourceId);
                    return (
                      <div key={i} className="flex items-center justify-between text-xs bg-green-50 px-2 py-1 rounded">
                        <div className="flex items-center gap-1">
                          <span>{resource?.icon}</span>
                          <span className="text-green-700">+{production.quantity}</span>
                        </div>
                        <span className="text-green-600">{production.timeMinutes}m</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {resourceRequirements.length > 0 && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-gray-700 flex items-center gap-1">
                  <Info size={12} />
                  <span>Requires:</span>
                </div>
                <div className="space-y-1">
                  {resourceRequirements.slice(0, 2).map((requirement, i) => {
                    const resource = getResourceById(requirement.resourceId);
                    const playerHas = playerResources?.[requirement.resourceId] || 0;
                    const hasEnough = playerHas >= requirement.quantity;
                    
                    return (
                      <div key={i} className={`flex items-center justify-between text-xs px-2 py-1 rounded ${
                        hasEnough ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        <div className="flex items-center gap-1">
                          <span>{resource?.icon}</span>
                          <span>{requirement.quantity}</span>
                        </div>
                        <span className="font-medium">{playerHas}/{requirement.quantity}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {building.energyUsage !== undefined && (
              <div className="flex items-center justify-between text-xs bg-blue-50 px-2 py-1 rounded">
                <div className="flex items-center gap-1">
                  <Zap size={12} className="text-blue-600" />
                  <span className="text-blue-700">Energy</span>
                </div>
                <span className={`font-medium ${
                  building.energyUsage < 0 ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {building.energyUsage < 0 ? '+' : ''}{Math.abs(building.energyUsage)}
                </span>
              </div>
            )}
          </div>
        )}
      </div>      
      
      {isSelected && !isDisabled && (
        <motion.div 
          layoutId={`selected-${building.id}`}
          className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-emerald-400 to-emerald-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}
      
      {(building.ecoFriendly || building.levelRequired && building.levelRequired > 3) && (
        <div className="absolute top-2 right-2">
          {building.ecoFriendly && (
            <div className="w-6 h-6 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-xs">
              🌱
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}