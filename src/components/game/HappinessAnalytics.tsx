import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Building, Neighbor, WeatherType } from "../../types/game";
import { TrendingUp, TrendingDown, BarChart, ChevronDown, ChevronUp, CloudRain, Sun, CloudLightning, CloudSnow, Cloud } from "lucide-react";
import Tooltip from "../ui/Tooltip";

type HappinessContributor = {
  name: string;
  value: number;
  type: 'building' | 'neighbor' | 'event' | 'weather' | 'other';
  icon?: React.ReactNode;
};

type HappinessAnalyticsProps = {
  happiness: number;
  buildings: Building[];
  neighbors: Neighbor[];
  grid: (Building | null)[];
  recentEvents: {
    name: string;
    happinessImpact: number;
    day: number;
  }[];
  weather?: WeatherType;
};

export default function HappinessAnalytics({
  happiness,
  buildings,
  neighbors,
  grid,
  recentEvents,
  weather = 'sunny',
}: HappinessAnalyticsProps) {
  const [expanded, setExpanded] = useState(false);
  
  const getBuildingContributions = (): HappinessContributor[] => {
    const baseHappiness: HappinessContributor = {
      name: 'base happiness',
      value: 70,
      type: 'other'
    };
    
    const buildingCounts: Record<string, number> = {};
    
    grid.forEach(building => {
      if (building && building.happiness) {
        buildingCounts[building.id] = (buildingCounts[building.id] || 0) + 1;
      }
    });
    
    const buildingContributions = Object.keys(buildingCounts).map(buildingId => {
      const building = buildings.find(b => b.id === buildingId);
      if (!building) return null;
      
      const count = buildingCounts[buildingId];
      return {
        name: `${count} × ${building.name}`,
        value: building.happiness * count,
        type: 'building' as const,
      };
    }).filter(Boolean) as HappinessContributor[];
    
    return [baseHappiness, ...buildingContributions];
  };
  
  const getNeighborContributions = (): HappinessContributor[] => {
    const unlockedNeighbors = neighbors.filter(n => n.unlocked);
    const contributors: HappinessContributor[] = [];
    
    unlockedNeighbors.forEach(neighbor => {
      const hasPreference = buildings.some(b => {
        if (neighbor.likes && Array.isArray(neighbor.likes)) {
          return neighbor.likes.some(like => typeof like === 'string' && b.name && typeof b.name === 'string' && b.name.toLowerCase() === like.toLowerCase()) &&
            grid.some(g => g?.id === b.id);
        } else if (neighbor.likes && typeof neighbor.likes === 'string') {
          return b.name && typeof b.name === 'string' && neighbor.likes && typeof neighbor.likes === 'string' && b.name.toLowerCase() === neighbor.likes.toLowerCase() &&
            grid.some(g => g?.id === b.id);
        }
        return false;
      });
      
      const hasDislike = buildings.some(b => {
        if (neighbor.dislikes && Array.isArray(neighbor.dislikes)) {
          return neighbor.dislikes.some(dislike => typeof dislike === 'string' && b.name && typeof b.name === 'string' && b.name.toLowerCase() === dislike.toLowerCase()) &&
            grid.some(g => g?.id === b.id);
        } else if (neighbor.dislikes && typeof neighbor.dislikes === 'string') {
          return b.name && typeof b.name === 'string' && neighbor.dislikes && typeof neighbor.dislikes === 'string' && b.name.toLowerCase() === neighbor.dislikes.toLowerCase() &&
            grid.some(g => g?.id === b.id);
        }
        return false;
      });
      
      if (hasPreference) {
        const likesDisplay = Array.isArray(neighbor.likes) ? neighbor.likes.join(', ') : neighbor.likes;
        contributors.push({
          name: `${neighbor.name} (likes ${likesDisplay})`,
          value: 10,
          type: 'neighbor' as const,
        });
      }
      
      if (hasDislike) {
        contributors.push({
          name: `${neighbor.name} (dislikes ${neighbor.dislikes})`,
          value: -5,
          type: 'neighbor' as const,
        });
      }
      
      if (neighbor.hasHome && neighbor.houseIndex !== undefined) {
        const house = grid[neighbor.houseIndex];
        if (house) {
          if (neighbor.housingPreference === 'house' && house.id === 'apartment') {
            contributors.push({
              name: `${neighbor.name} (prefers house over apartment)`,
              value: -25,
              type: 'neighbor' as const,
            });
          } else if (neighbor.housingPreference === 'apartment' && house.id === 'house') {
            contributors.push({
              name: `${neighbor.name} (prefers apartment over house)`,
              value: -15,
              type: 'neighbor' as const,
            });
          }
          
          if (house.occupants && house.occupants.length > (neighbor.maxNeighbors || 1)) {
            contributors.push({
              name: `${neighbor.name} (too many roommates)`,
              value: -30,
              type: 'neighbor' as const,
            });
          }

          if (house.needsElectricity && !house.isConnectedToPower) {
            contributors.push({
              name: `${neighbor.name} (no electricity)`,
              value: -40,
              type: 'neighbor' as const,
            });
          }
          
          if (house.needsWater && !house.isConnectedToWater) {
            contributors.push({
              name: `${neighbor.name} (no water)`,
              value: -35,
              type: 'neighbor' as const,
            });
          }
        }
      }
    });
    
    return contributors;
  };
  
  const getEventContributions = (): HappinessContributor[] => {
    return recentEvents.map(event => ({
      name: event.name,
      value: event.happinessImpact,
      type: 'event' as const,
    }));
  };

  const getWeatherContribution = (): HappinessContributor[] => {
    const weatherEffects: Record<WeatherType, { value: number, icon: React.ReactNode }> = {
      sunny: { value: 2, icon: <Sun size={16} className="text-yellow-500" /> },
      cloudy: { value: -0.5, icon: <Cloud size={16} className="text-gray-500" /> },
      rainy: { value: -2, icon: <CloudRain size={16} className="text-blue-500" /> },
      stormy: { value: -4, icon: <CloudLightning size={16} className="text-purple-500" /> },
      snowy: { value: -1, icon: <CloudSnow size={16} className="text-blue-300" /> }
    };
    
    const effect = weatherEffects[weather || 'sunny'];
    
    if (effect && effect.value !== 0) {
      return [{
        name: `${weather} weather`,
        value: effect.value,
        type: 'weather',
        icon: effect.icon
      }];
    }
    
    return [];
  };
  
  const getUtilityPenalties = (): HappinessContributor[] => {
    const penalties = [];
    
    const buildingsWithoutPower = grid.filter(b => b && b.needsElectricity && !b.isConnectedToPower).length;
    if (buildingsWithoutPower > 0) {
      penalties.push({
        name: `${buildingsWithoutPower} buildings without power`,
        value: -buildingsWithoutPower * 2,
        type: 'other'
      });
    }
    
    const buildingsWithoutWater = grid.filter(b => b && b.needsWater && !b.isConnectedToWater).length;
    if (buildingsWithoutWater > 0) {
      penalties.push({
        name: `${buildingsWithoutWater} buildings without water`,
        value: -buildingsWithoutWater * 3,
        type: 'other'
      });
    }
    
    return penalties;
  };
  
  const contributors = [
    ...getBuildingContributions(),
    ...getNeighborContributions(),
    ...getEventContributions(),
    ...getWeatherContribution(),
    ...getUtilityPenalties()
  ].sort((a, b) => b.value - a.value);
  
  const positiveContributors = contributors.filter(c => c.value > 0);
  const negativeContributors = contributors.filter(c => c.value < 0);
  
  const totalPositive = positiveContributors.reduce((sum, c) => sum + c.value, 0);
  const totalNegative = negativeContributors.reduce((sum, c) => sum + c.value, 0);
  
  const calculatedHappiness = happiness;
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <motion.div
        className="p-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 mr-3">
              <BarChart size={16} />
            </div>
            <div>
              <h3 className="font-medium lowercase text-gray-800">happiness analytics</h3>
              <div className="flex items-center text-xs text-gray-500 lowercase">
                <div className="flex items-center mr-3">
                  <TrendingUp size={14} className="text-emerald-500 mr-1" />
                  +{totalPositive}
                </div>
                {totalNegative !== 0 && (
                  <div className="flex items-center">
                    <TrendingDown size={14} className="text-red-500 mr-1" />
                    {totalNegative}
                  </div>
                )}
              </div>
            </div>
          </div>
          <motion.div
            animate={{ rotate: expanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {expanded ? (
              <ChevronUp size={20} className="text-gray-400" />
            ) : (
              <ChevronDown size={20} className="text-gray-400" />
            )}
          </motion.div>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-gray-50 px-4 pb-4 border-t border-gray-100"
          >
            <div className="py-2 mb-2 border-b border-gray-200">
              <h4 className="text-sm font-medium text-gray-700 lowercase">
                what's contributing to happiness
              </h4>
            </div>
            
            <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
              {positiveContributors.length > 0 && (
                <div>
                  <h5 className="text-xs font-medium text-emerald-700 mb-2 lowercase flex items-center">
                    <TrendingUp size={14} className="mr-1" />
                    positive factors
                  </h5>
                  {positiveContributors.map((contributor, index) => (
                    <div key={index} className="flex justify-between items-center mb-1.5">
                      <div className="text-xs text-gray-700 lowercase flex items-center gap-1">
                        {contributor.icon && contributor.icon}
                        {contributor.name}
                      </div>
                      <div className="text-xs font-medium text-emerald-600">+{contributor.value}</div>
                    </div>
                  ))}
                </div>
              )}
              
              {negativeContributors.length > 0 && (
                <div className="mt-3">
                  <h5 className="text-xs font-medium text-red-600 mb-2 lowercase flex items-center">
                    <TrendingDown size={14} className="mr-1" />
                    negative factors
                  </h5>
                  {negativeContributors.map((contributor, index) => (
                    <div key={index} className="flex justify-between items-center mb-1.5">
                      <div className="text-xs text-gray-700 lowercase flex items-center gap-1">
                        {contributor.icon && contributor.icon}
                        {contributor.name}
                      </div>
                      <div className="text-xs font-medium text-red-600">{contributor.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center mb-1">
                <div className="text-xs font-medium text-gray-700 lowercase">total happiness</div>
                <Tooltip content={`Happiness: ${happiness}%`}>
                  <div className="text-xs font-medium text-gray-800 cursor-help">
                    {Math.round(calculatedHappiness)}%
                  </div>
                </Tooltip>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, calculatedHappiness)}%` }}
                  transition={{ duration: 1 }}
                  className="h-full"
                  style={{ 
                    background: `linear-gradient(to right, #f87171, #fbbf24, #34d399)` 
                  }}
                ></motion.div>
              </div>
              <div className="flex justify-between mt-1">
                <div className="text-xs text-gray-500">unhappy</div>
                <div className="text-xs text-gray-500">neutral</div>
                <div className="text-xs text-gray-500">happy</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
