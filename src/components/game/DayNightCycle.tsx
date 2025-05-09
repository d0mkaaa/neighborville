import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sun, Moon, Sunrise, Sunset } from "lucide-react";

type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

type DayNightCycleProps = {
  day: number;
  gameTime: number;
  onTimeChange?: (newTime: number, timeOfDay: TimeOfDay) => void;
};

export default function DayNightCycle({ day, gameTime, onTimeChange }: DayNightCycleProps) {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day');
  const [showTimeIndicator, setShowTimeIndicator] = useState(false);
  const [autoTimeProgress, setAutoTimeProgress] = useState(false);
  
  useEffect(() => {
    let newTimeOfDay: TimeOfDay;
    
    if (gameTime >= 5 && gameTime < 10) {
      newTimeOfDay = 'morning';
    } else if (gameTime >= 10 && gameTime < 17) {
      newTimeOfDay = 'day';
    } else if (gameTime >= 17 && gameTime < 21) {
      newTimeOfDay = 'evening';
    } else {
      newTimeOfDay = 'night';
    }
    
    if (newTimeOfDay !== timeOfDay) {
      setTimeOfDay(newTimeOfDay);
      onTimeChange && onTimeChange(gameTime, newTimeOfDay);
    }
  }, [gameTime, timeOfDay, onTimeChange]);
  
  useEffect(() => {
    if (!autoTimeProgress) return;
    
    const interval = setInterval(() => {
      const nextTime = (gameTime + 1) % 24;
      onTimeChange && onTimeChange(nextTime, timeOfDay);
    }, 60000);
    
    return () => clearInterval(interval);
  }, [autoTimeProgress, gameTime, timeOfDay, onTimeChange]);
  
  const getSkyColor = () => {
    switch (timeOfDay) {
      case 'morning':
        return 'bg-gradient-to-r from-amber-500 to-amber-600';
      case 'day':
        return 'bg-gradient-to-r from-emerald-500 to-teal-600';
      case 'evening':
        return 'bg-gradient-to-r from-orange-500 to-red-600';
      case 'night':
        return 'bg-gradient-to-r from-indigo-800 to-purple-900';
    }
  };
  
  const getIcon = () => {
    switch (timeOfDay) {
      case 'morning':
        return <Sunrise size={20} className="text-white" />;
      case 'day':
        return <Sun size={20} className="text-white" />;
      case 'evening':
        return <Sunset size={20} className="text-white" />;
      case 'night':
        return <Moon size={20} className="text-white" />;
    }
  };
  
  const getTimeString = () => {
    const hours = gameTime % 12 || 12;
    const ampm = gameTime >= 12 ? 'pm' : 'am';
    return `${hours}:00 ${ampm}`;
  };
  
  const getFormattedDay = () => {
    if (day % 10 === 1 && day % 100 !== 11) {
      return `${day}st`;
    } else if (day % 10 === 2 && day % 100 !== 12) {
      return `${day}nd`;
    } else if (day % 10 === 3 && day % 100 !== 13) {
      return `${day}rd`;
    } else {
      return `${day}th`;
    }
  };
  
  const getTimeEffects = () => {
    switch (timeOfDay) {
      case 'morning':
        return "Morning: Cafés earn more income";
      case 'day':
        return "Day: Parks increase happiness, solar panels generate more energy";
      case 'evening':
        return "Evening: Music venues earn more income, libraries boost happiness";
      case 'night':
        return "Night: Houses provide extra happiness";
    }
  };
  
  return (
    <motion.div
      layout
      className="relative"
      onHoverStart={() => setShowTimeIndicator(true)}
      onHoverEnd={() => setShowTimeIndicator(false)}
    >
      <motion.div
        className={`time-indicator cursor-pointer rounded-lg shadow-md flex items-center p-1 px-2 ${getSkyColor()}`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setAutoTimeProgress(!autoTimeProgress)}
      >
        <div className="mr-1.5">{getIcon()}</div>
        <div className="text-xs font-medium text-white">{getTimeString()}</div>
        
        <AnimatedTimeBar autoTimeProgress={autoTimeProgress} gameTime={gameTime} />
      </motion.div>
      
      <AnimatePresence>
        {showTimeIndicator && (
          <motion.div
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 5 }}
            className="absolute top-full mt-1 left-0 right-0 bg-white rounded-md p-2 shadow-lg text-xs text-gray-700 z-10 min-w-48"
          >
            <div className="font-medium text-gray-900">day {getFormattedDay()}</div>
            <div className="text-gray-600">{timeOfDay} time</div>
            
            <div className="mt-1 text-gray-700 text-xs border-t border-gray-100 pt-1">
              {getTimeEffects()}
            </div>
            
            <div className="mt-1 text-emerald-600 text-xs">
              {autoTimeProgress ? "auto time advancing" : "click to toggle auto time"}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

type AnimatedTimeBarProps = {
  autoTimeProgress: boolean;
  gameTime: number;
};

function AnimatedTimeBar({ autoTimeProgress, gameTime }: AnimatedTimeBarProps) {
  if (!autoTimeProgress) return null;
  
  return (
    <div className="ml-1.5 w-8 h-1.5 bg-white bg-opacity-20 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-white bg-opacity-50"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 60, ease: "linear", repeat: Infinity }}
      />
    </div>
  );
}