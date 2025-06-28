import React from 'react';
import type { Building } from "../../types/game";
import { Home, Smile, Coffee, Book, Music, Zap, Sun, Droplets, Utensils, Code, Film, Factory, Store, TreePine, Lock, Coins, Package, Star, Sparkles, Users, AlertTriangle, CheckCircle, Heart, Leaf } from "lucide-react";
import { motion } from "framer-motion";
import { getResourceById, getRecipesByBuilding } from "../../data/resources";

type BuildingOptionProps = {
  building: Building;
  isSelected: boolean;
  onSelect: (building: Building) => void;
  playerLevel?: number;
  playerCoins?: number;
  playerResources?: { [resourceId: string]: number };
  showDetailed?: boolean;
};

export default function BuildingOption({ 
  building, 
  isSelected, 
  onSelect,
  playerLevel = 1,
  playerCoins = 0,
  playerResources = {},
  showDetailed = false
}: BuildingOptionProps) {
  const getIcon = () => {
    const iconSize = 20;
    switch(building.icon) {
      case 'Home': return <Home size={iconSize} />;
      case 'Smile': return <Smile size={iconSize} />;
      case 'Coffee': return <Coffee size={iconSize} />;
      case 'Book': return <Book size={iconSize} />;
      case 'Music': return <Music size={iconSize} />;
      case 'Zap': return <Zap size={iconSize} />;
      case 'Sun': return <Sun size={iconSize} />;
      case 'Droplets': return <Droplets size={iconSize} />;
      case 'Utensils': return <Utensils size={iconSize} />;
      case 'Code': return <Code size={iconSize} />;
      case 'Film': return <Film size={iconSize} />;
      case 'Factory': return <Factory size={iconSize} />;
      case 'Store': return <Store size={iconSize} />;
      case 'TreePine': return <TreePine size={iconSize} />;
      default: return <Home size={iconSize} />;
    }
  };

  const getResourceRequirements = () => {
    if (building.productionType && building.id) {
      const recipes = getRecipesByBuilding(building.id);      if (recipes.length > 0) {
        return recipes[0].inputs;
      }
    }
    return [];
  };

  const resourceRequirements = getResourceRequirements();
  
  const isLocked = building.unlocked === false || 
                   (building.levelRequired && building.levelRequired > playerLevel);
  
  const canAfford = playerCoins >= building.cost;
  const isDisabled = isLocked || !canAfford;

  const getBuildingTier = () => {
    if (building.cost < 300) return 'basic';
    if (building.cost < 800) return 'advanced';
    return 'premium';
  };

  const getTierColor = () => {
    const tier = getBuildingTier();
    switch (tier) {
      case 'basic': return '#10b981';
      case 'advanced': return '#3b82f6';
      case 'premium': return '#8b5cf6';
      default: return '#6b7280';
    }
  };

  const getSpecialBadges = () => {
    const badges = [];
    
    if (building.ecoFriendly) {
      badges.push({
        icon: <Leaf size={12} />,
        text: 'Eco-Friendly',
        color: 'bg-green-100 text-green-700'
      });
    }
    
    if (building.isPowerGenerator) {
      badges.push({
        icon: <Zap size={12} />,
        text: 'Power Source',
        color: 'bg-yellow-100 text-yellow-700'
      });
    }
    
    if (building.isWaterSupply) {
      badges.push({
        icon: <Droplets size={12} />,
        text: 'Water Source',
        color: 'bg-blue-100 text-blue-700'
      });
    }

    if (building.productionType) {
      badges.push({
        icon: <Factory size={12} />,
        text: 'Production',
        color: 'bg-purple-100 text-purple-700'
      });
    }

    if (building.touristAttraction) {
      badges.push({
        icon: <Star size={12} />,
        text: 'Tourist Spot',
        color: 'bg-pink-100 text-pink-700'
      });
    }

    return badges;
  };

  const getEfficiencyRating = () => {
    const incomePerCost = building.income / building.cost;
    if (incomePerCost > 0.2) return 'high';
    if (incomePerCost > 0.1) return 'medium';
    return 'low';
  };

  const getEfficiencyColor = () => {
    const rating = getEfficiencyRating();
    switch (rating) {
      case 'high': return 'text-green-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <motion.div
      whileHover={{ 
        scale: isDisabled ? 1 : 1.02, 
        boxShadow: isDisabled ? undefined : "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)" 
      }}
      whileTap={{ scale: isDisabled ? 1 : 0.98 }}
      layout
      onClick={() => !isDisabled && onSelect(building)}
      className={`relative overflow-hidden rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
        isSelected ? 'ring-4 ring-blue-400 border-blue-300' : 'border-transparent'
      } ${isDisabled ? 'opacity-60' : ''} ${!canAfford && !isLocked ? 'ring-2 ring-red-300 border-red-200' : ''}`}
      style={{ 
        background: isDisabled 
          ? 'linear-gradient(135deg, #f3f4f6, #e5e7eb)' 
          : `linear-gradient(135deg, ${building.color}15, ${building.color}08, white)`,
        minHeight: showDetailed ? '280px' : '220px'
      }}
    >
      {getBuildingTier() === 'premium' && (
        <div className="absolute top-0 right-0">
          <div 
            className="w-0 h-0 border-l-16 border-b-16 border-l-transparent"
            style={{ borderBottomColor: getTierColor() }}
          />
          <Sparkles size={12} className="absolute top-1 right-1 text-white" />
        </div>
      )}

      <div className="p-4">
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
            
            <div 
              className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white"
              style={{ backgroundColor: getTierColor() }}
            />
          </motion.div>
          
          <div className="flex flex-col items-end gap-1">
            {isLocked && (
              <div className="flex items-center gap-1 px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                <Lock size={10} />
                <span>Lv.{building.levelRequired}</span>
              </div>
            )}
            
            {!isLocked && !canAfford && (
              <div className="flex items-center gap-1 px-2 py-1 bg-red-100 text-red-600 rounded-full text-xs">
                <AlertTriangle size={10} />
                <span>Need {building.cost - playerCoins}💰</span>
              </div>
            )}

            {!isLocked && canAfford && (
              <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-600 rounded-full text-xs">
                <CheckCircle size={10} />
                <span>Ready</span>
              </div>
            )}
          </div>
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

        {getSpecialBadges().length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {getSpecialBadges().slice(0, 2).map((badge, index) => (
              <div key={index} className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${badge.color}`}>
                {badge.icon}
                <span className="hidden sm:inline">{badge.text}</span>
              </div>
            ))}
          </div>
        )}
        
        <div className="space-y-2 mb-3">
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <Coins size={12} className="text-yellow-600" />
              <span className="text-gray-700">Cost</span>
            </div>
            <span className={`font-bold ${canAfford ? 'text-gray-800' : 'text-red-600'}`}>
              {building.cost}💰
            </span>
          </div>
          
          <div className="flex items-center justify-between text-xs">
            <div className="flex items-center gap-1">
              <span className="text-green-600">💰</span>
              <span className="text-gray-700">Income</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="font-bold text-green-600">{building.income}/day</span>
              <span className={`text-xs ${getEfficiencyColor()}`}>
                {getEfficiencyRating() === 'high' && '★'}
                {getEfficiencyRating() === 'medium' && '☆'}
              </span>
            </div>
          </div>

          {building.communitySatisfaction && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Heart size={12} className="text-pink-600" />
                <span className="text-gray-700">Happiness</span>
              </div>
              <span className="font-bold text-pink-600">+{building.communitySatisfaction}</span>
            </div>
          )}

          {building.residentCapacity && (
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1">
                <Users size={12} className="text-purple-600" />
                <span className="text-gray-700">Capacity</span>
              </div>
              <span className="font-bold text-purple-600">{building.residentCapacity}</span>
            </div>
          )}
        </div>

        {showDetailed && (
          <div className="space-y-2 mb-3 pt-2 border-t border-gray-100">
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

            {(building.needsElectricity || building.needsWater) && (
              <div className="text-xs text-gray-600">
                <span>Requires: </span>
                {building.needsElectricity && <span className="text-yellow-600">⚡ Power </span>}
                {building.needsWater && <span className="text-blue-600">💧 Water</span>}
              </div>
            )}
          </div>
        )}

        {(building.needsElectricity || building.needsWater) && !showDetailed && (
          <div className="flex gap-1 mt-2">
            {building.needsElectricity && (
              <div className="w-5 h-5 bg-yellow-100 text-yellow-600 rounded flex items-center justify-center">
                <Zap size={10} />
              </div>
            )}
            {building.needsWater && (
              <div className="w-5 h-5 bg-blue-100 text-blue-600 rounded flex items-center justify-center">
                <Droplets size={10} />
              </div>
            )}
          </div>
        )}
      </div>      
      
      {isSelected && !isDisabled && (
        <motion.div 
          layoutId={`selected-${building.id}`}
          className="absolute bottom-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-400 to-blue-500"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        />
      )}

      {!isDisabled && (
        <motion.div
          className="absolute inset-0 rounded-2xl opacity-0 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, ${building.color}20, transparent)`,
          }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        />
      )}
    </motion.div>
  );
}