import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sun, Moon, Sunset } from "lucide-react";

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
        return 'linear-gradient(to bottom, #88c8ff, #b8e1fc)';
      case 'day':
        return 'linear-gradient(to bottom, #4a9ff5, #7cc0ff)';
      case 'evening':
        return 'linear-gradient(to bottom, #ff7e5f, #feb47b)';
      case 'night':
        return 'linear-gradient(to bottom, #0f2027, #203a43)';
    }
  };
  
  const getIcon = () => {
    switch (timeOfDay) {
      case 'morning':
        return <Sunset size={20} className="text-yellow-400" />;
      case 'day':
        return <Sun size={20} className="text-yellow-500" />;
      case 'evening':
        return <Sunset size={20} className="text-orange-500" />;
      case 'night':
        return <Moon size={20} className="text-indigo-200" />;
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
  
  return (
    <motion.div
      layout
      className="relative"
      onHoverStart={() => setShowTimeIndicator(true)}
      onHoverEnd={() => setShowTimeIndicator(false)}
    >
      <motion.div
        className="time-indicator cursor-pointer rounded-lg shadow-md flex items-center p-1 px-2"
        style={{ background: getSkyColor() }}
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
            className="absolute top-full mt-1 left-0 right-0 bg-white rounded-md p-2 shadow-lg text-xs text-gray-700 z-10"
          >
            <div className="font-medium">day {getFormattedDay()}</div>
            <div className="text-gray-500">{timeOfDay} time</div>
            <div className="mt-1 text-gray-500 text-xs">
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
    <div className="ml-1.5 w-8 h-1.5 bg-black bg-opacity-20 rounded-full overflow-hidden">
      <motion.div
        className="h-full bg-white bg-opacity-50"
        initial={{ width: "0%" }}
        animate={{ width: "100%" }}
        transition={{ duration: 60, ease: "linear", repeat: Infinity }}
      />
    </div>
  );
}