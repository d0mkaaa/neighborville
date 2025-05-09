import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import type { Building, Neighbor } from "../../types/game";
import { TrendingUp, TrendingDown, BarChart, ChevronDown, ChevronUp } from "lucide-react";

type HappinessContributor = {
  name: string;
  value: number;
  type: 'building' | 'neighbor' | 'event' | 'other';
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
};

export default function HappinessAnalytics({
  happiness,
  buildings,
  neighbors,
  grid,
  recentEvents,
}: HappinessAnalyticsProps) {
  const [expanded, setExpanded] = useState(false);
  
  const getBuildingContributions = (): HappinessContributor[] => {
    const buildingCounts: Record<string, number> = {};
    
    grid.forEach(building => {
      if (building) {
        buildingCounts[building.id] = (buildingCounts[building.id] || 0) + 1;
      }
    });
    
    return Object.entries(buildingCounts).map(([buildingId, count]) => {
      const building = buildings.find(b => b.id === buildingId);
      if (!building) return null;
      
      return {
        name: `${count} × ${building.name}`,
        value: building.happiness * count,
        type: 'building' as const,
      };
    }).filter(Boolean) as HappinessContributor[];
  };
  
  const getNeighborContributions = (): HappinessContributor[] => {
    const unlockedNeighbors = neighbors.filter(n => n.unlocked);
    
    return unlockedNeighbors.map(neighbor => {
      const hasPreference = buildings.some(b => 
        b.name.toLowerCase() === neighbor.likes.toLowerCase() &&
        grid.some(g => g?.id === b.id)
      );
      
      const hasDislike = buildings.some(b => 
        b.name.toLowerCase() === neighbor.dislikes.toLowerCase() &&
        grid.some(g => g?.id === b.id)
      );
      
      let value = 0;
      let name = neighbor.name;
      
      if (hasPreference) {
        value += 10;
        name += ` (likes ${neighbor.likes})`;
      }
      
      if (hasDislike) {
        value -= 5;
        name += ` (dislikes ${neighbor.dislikes})`;
      }
      
      return {
        name,
        value,
        type: 'neighbor' as const,
      };
    }).filter(n => n.value !== 0);
  };
  
  const getEventContributions = (): HappinessContributor[] => {
    return recentEvents.map(event => ({
      name: event.name,
      value: event.happinessImpact,
      type: 'event' as const,
    }));
  };
  
  const contributors = [
    ...getBuildingContributions(),
    ...getNeighborContributions(),
    ...getEventContributions(),
    {
      name: 'base happiness',
      value: 50,
      type: 'other' as const,
    }
  ].sort((a, b) => b.value - a.value);
  
  const positiveContributors = contributors.filter(c => c.value > 0);
  const negativeContributors = contributors.filter(c => c.value < 0);
  
  const totalPositive = positiveContributors.reduce((sum, c) => sum + c.value, 0);
  const totalNegative = negativeContributors.reduce((sum, c) => sum + c.value, 0);
  
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
                      <div className="text-xs text-gray-700 lowercase">{contributor.name}</div>
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
                      <div className="text-xs text-gray-700 lowercase">{contributor.name}</div>
                      <div className="text-xs font-medium text-red-600">{contributor.value}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center mb-1">
                <div className="text-xs font-medium text-gray-700 lowercase">total happiness</div>
                <div className="text-xs font-medium text-gray-800">{happiness}%</div>
              </div>
              <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${happiness}%` }}
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