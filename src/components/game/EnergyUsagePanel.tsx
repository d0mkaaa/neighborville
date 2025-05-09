import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ChevronDown, ChevronUp, AlertTriangle } from "lucide-react";
import type { Building } from "../../types/game";

type EnergyUsagePanelProps = {
  grid: (Building | null)[];
  energyRate: number;
  totalEnergyUsage: number;
  daysUntilBill: number;
};

export default function EnergyUsagePanel({
  grid,
  energyRate,
  totalEnergyUsage,
  daysUntilBill
}: EnergyUsagePanelProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const energyCost = totalEnergyUsage * energyRate;
  const isEnergyUsageHigh = totalEnergyUsage > 100;

  const buildingEnergyUsage: Record<string, { count: number; usage: number; total: number }> = {};
  
  grid.forEach(building => {
    if (building && building.energyUsage !== undefined) {
      if (!buildingEnergyUsage[building.id]) {
        buildingEnergyUsage[building.id] = {
          count: 0,
          usage: building.energyUsage,
          total: 0
        };
      }
      
      buildingEnergyUsage[building.id].count += 1;
      buildingEnergyUsage[building.id].total += building.energyUsage;
    }
  });

  const sortedBuildings = Object.entries(buildingEnergyUsage)
    .sort((a, b) => Math.abs(b[1].total) - Math.abs(a[1].total));

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <motion.div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${
              isEnergyUsageHigh ? 'bg-amber-100 text-amber-600' : 'bg-blue-100 text-blue-600'
            }`}>
              <Zap size={16} />
            </div>
            <div>
              <h3 className="font-medium lowercase text-gray-800">energy usage</h3>
              <div className="text-xs text-gray-500 lowercase flex items-center">
                <span>{totalEnergyUsage} units</span>
                <span className="mx-1">•</span>
                <span>{energyCost} coins{daysUntilBill > 0 ? ` in ${daysUntilBill} day${daysUntilBill !== 1 ? 's' : ''}` : ' today'}</span>
              </div>
            </div>
          </div>
          
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            {isExpanded ? (
              <ChevronUp size={20} className="text-gray-400" />
            ) : (
              <ChevronDown size={20} className="text-gray-400" />
            )}
          </motion.div>
        </div>
      </motion.div>
      
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 pb-4 border-t border-gray-100 bg-gray-50"
          >
            {isEnergyUsageHigh && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 my-3 text-sm text-amber-700 flex items-start">
                <AlertTriangle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                <p>Energy usage is high. Consider adding solar panels or removing high-consumption buildings to reduce costs.</p>
              </div>
            )}
            
            <div className="py-2 space-y-3 max-h-60 overflow-y-auto pr-1">
              {sortedBuildings.map(([buildingId, data]) => (
                <div key={buildingId} className="flex justify-between items-center">
                  <div className="flex items-center">
                    <div className={`w-6 h-6 flex items-center justify-center rounded-full mr-2 ${
                      data.usage < 0 ? 'bg-green-100 text-green-600' : 'bg-blue-50 text-blue-600'
                    }`}>
                      <Zap size={12} />
                    </div>
                    <div>
                      <div className="text-sm text-gray-700 lowercase">{buildingId.replace('_', ' ')} × {data.count}</div>
                      <div className="text-xs text-gray-500">{data.usage} units each</div>
                    </div>
                  </div>
                  <div className={`text-sm font-medium ${data.total < 0 ? 'text-green-600' : 'text-blue-600'}`}>
                    {data.total > 0 ? '+' : ''}{data.total} units
                  </div>
                </div>
              ))}
            </div>
            
            <div className="mt-3 pt-3 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-gray-700 lowercase">total energy cost</div>
                <div className="text-sm font-medium text-gray-800">{energyCost} coins</div>
              </div>
              <div className="mt-1 text-xs text-gray-500">
                Energy rate: {energyRate} coins per unit
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}