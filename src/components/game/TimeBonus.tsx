import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Clock, Sun, Sunset, Moon, ChevronDown, ChevronUp, TrendingUp } from "lucide-react";
import type { TimeBasedBonus, TimeOfDay } from "../../types/game";

type TimeBonusProps = {
  timeOfDay: TimeOfDay;
  activeBonuses: TimeBasedBonus[];
};

export default function TimeBonus({ timeOfDay, activeBonuses }: TimeBonusProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  const getTimeIcon = () => {
    switch (timeOfDay) {
      case 'morning':
        return <Sunset size={16} className="text-orange-400" />;
      case 'day':
        return <Sun size={16} className="text-yellow-500" />;
      case 'evening':
        return <Sunset size={16} className="text-orange-500" />;
      case 'night':
        return <Moon size={16} className="text-indigo-400" />;
    }
  };

  const getTimeName = () => {
    return timeOfDay.charAt(0).toUpperCase() + timeOfDay.slice(1);
  };

  const getTimeColor = () => {
    switch (timeOfDay) {
      case 'morning':
        return 'bg-orange-100 text-orange-600';
      case 'day':
        return 'bg-yellow-100 text-yellow-600';
      case 'evening':
        return 'bg-orange-100 text-orange-600';
      case 'night':
        return 'bg-indigo-100 text-indigo-600';
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <motion.div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-3 ${getTimeColor()}`}>
              {getTimeIcon()}
            </div>
            <div>
              <h3 className="font-medium lowercase text-gray-800">{getTimeName()} bonuses</h3>
              <div className="text-xs text-gray-500 lowercase">
                {activeBonuses.length} active building bonuses
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
            <div className="py-2">
              <h4 className="text-sm font-medium text-gray-700 my-2 lowercase">active {timeOfDay} bonuses</h4>
              
              {activeBonuses.length > 0 ? (
                <div className="space-y-2">
                  {activeBonuses.map((bonus, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-gray-200">
                      <div className="text-sm font-medium text-gray-700 lowercase mb-1">
                        {bonus.buildingId.replace('_', ' ')}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {bonus.incomeMultiplier && (
                          <div className="flex items-center bg-green-50 px-2 py-1 rounded text-xs text-green-600">
                            <TrendingUp size={12} className="mr-1" />
                            {Math.round((bonus.incomeMultiplier - 1) * 100)}% income boost
                          </div>
                        )}
                        {bonus.happinessMultiplier && (
                          <div className="flex items-center bg-blue-50 px-2 py-1 rounded text-xs text-blue-600">
                            <span className="mr-1">😊</span>
                            {Math.round((bonus.happinessMultiplier - 1) * 100)}% happiness boost
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 p-3 bg-white rounded-lg lowercase">
                  no active bonuses during {timeOfDay} time
                </div>
              )}
              
              <div className="mt-3 text-xs text-gray-500">
                <p>Different buildings perform better at certain times of day, providing bonus income or happiness.</p>
                <p className="mt-1">Try building structures that work well during {timeOfDay} time, or wait for different times of day to maximize your benefits.</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}