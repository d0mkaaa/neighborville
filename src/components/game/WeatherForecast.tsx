import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Cloud, CloudRain, CloudLightning, CloudSnow, Moon, X, Clock } from 'lucide-react';

type WeatherType = 'sunny' | 'rainy' | 'cloudy' | 'stormy' | 'snowy';

type WeatherForecastProps = {
  currentWeather: WeatherType;
  forecast: WeatherType[];
  isExpanded: boolean;
  onToggle: () => void;
  currentTime?: number;
};

export default function WeatherForecast({ currentWeather, forecast, isExpanded, onToggle, currentTime = 12 }: WeatherForecastProps) {
  const [prevWeather, setPrevWeather] = useState<WeatherType>(currentWeather);
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  useEffect(() => {
    if (prevWeather !== currentWeather) {
      setIsTransitioning(true);
      const timer = setTimeout(() => {
        setIsTransitioning(false);
        setPrevWeather(currentWeather);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [currentWeather, prevWeather]);

  const getWeatherIcon = (weather: WeatherType, size: number = 20, hour: number = 12) => {
    const isNight = hour >= 21 || hour < 5;
    
    switch(weather) {
      case 'sunny': 
        return isNight ? <Moon size={size} className="text-indigo-400" /> : <Sun size={size} className="text-yellow-500" />;
      case 'rainy': 
        return <CloudRain size={size} className="text-blue-500" />;
      case 'cloudy': 
        return isNight ? 
          <div className="relative">
            <Cloud size={size} className="text-gray-600" />
            <Moon size={size * 0.6} className="absolute top-0 right-0 text-indigo-300" />
          </div> :
          <Cloud size={size} className="text-gray-500" />;
      case 'stormy': 
        return <CloudLightning size={size} className="text-purple-600" />;
      case 'snowy': 
        return <CloudSnow size={size} className="text-cyan-400" />;
      default: 
        return isNight ? <Moon size={size} className="text-indigo-400" /> : <Sun size={size} className="text-yellow-500" />;
    }
  };

  const getWeatherTextColor = (weather: WeatherType, hour: number = 12) => {
    const isNight = hour >= 21 || hour < 5;
    
    switch(weather) {
      case 'sunny': 
        return isNight ? 'text-indigo-900' : 'text-yellow-900';
      case 'rainy': 
        return 'text-blue-900';
      case 'cloudy': 
        return isNight ? 'text-indigo-900' : 'text-gray-900';
      case 'stormy': 
        return 'text-purple-900';
      case 'snowy': 
        return 'text-cyan-900';
      default: 
        return isNight ? 'text-indigo-900' : 'text-gray-900';
    }
  };

  const getWeatherBg = (weather: WeatherType, hour: number = 12) => {
    const isNight = hour >= 21 || hour < 5;
    
    switch(weather) {
      case 'sunny': 
        return isNight ? 'bg-indigo-200' : 'bg-yellow-100';
      case 'rainy': 
        return 'bg-blue-100';
      case 'cloudy': 
        return isNight ? 'bg-indigo-100' : 'bg-gray-100';
      case 'stormy': 
        return 'bg-purple-100';
      case 'snowy': 
        return 'bg-cyan-100';
      default: 
        return isNight ? 'bg-indigo-200' : 'bg-yellow-100';
    }
  };

  const getDisplayWeatherName = (weather: WeatherType, hour: number = 12) => {
    const isNight = hour >= 21 || hour < 5;
    
    if (weather === 'sunny' && isNight) {
      return 'clear night';
    }
    
    if (weather === 'cloudy' && isNight) {
      return 'cloudy night';
    }
    
    return weather;
  };

  const formatHour = (hour: number) => {
    if (hour === 0) return '12 AM';
    if (hour === 12) return '12 PM';
    return hour < 12 ? `${hour} AM` : `${hour-12} PM`;
  };

  const getDisplayForecast = () => {
    if (!forecast || forecast.length === 0) return [];
    
    const result = [];
    for (let i = 0; i < 12; i++) {
      const hour = (currentTime + i) % 24;
      if (hour < forecast.length) {
        result.push({
          hour,
          weather: forecast[hour]
        });
      }
    }
    return result;
  };

  return (
    <div className="relative">
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`cursor-pointer rounded-lg p-2 shadow-sm flex items-center ${getWeatherBg(currentWeather, currentTime)} ${getWeatherTextColor(currentWeather, currentTime)} transition-colors duration-500`}
        onClick={onToggle}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentWeather + String(currentTime)}
            initial={{ opacity: 0, rotate: -20, scale: 0.7 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 20, scale: 0.7 }}
            transition={{ duration: 0.5 }}
            className="flex items-center justify-center"
          >
            {getWeatherIcon(currentWeather, 24, currentTime)}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center"
            onClick={(e) => {
              if (e.target === e.currentTarget) onToggle();
            }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ type: "spring", damping: 20, stiffness: 300 }}
              className="bg-white rounded-lg shadow-xl border border-gray-200 p-4 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-800 lowercase">weather forecast</h3>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 flex items-center">
                    <Clock size={14} className="mr-1" />
                    Current: {formatHour(currentTime)}
                  </span>
                  <button
                    onClick={onToggle}
                    className="p-1 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>
              
              <motion.div 
                className="mb-6 p-4 rounded-lg flex items-center gap-3 overflow-hidden" 
                style={{ 
                  background: `linear-gradient(to right, ${getWeatherBg(currentWeather, currentTime)}, ${getWeatherBg(currentWeather, currentTime).replace('100', '200')})` 
                }}
                animate={{ 
                  background: `linear-gradient(to right, ${getWeatherBg(currentWeather, currentTime)}, ${getWeatherBg(currentWeather, currentTime).replace('100', '200')})` 
                }}
                transition={{ duration: 1 }}
              >
                <motion.div 
                  className="p-3 rounded-full bg-white/80 flex items-center justify-center overflow-hidden"
                  key={currentWeather}
                  layoutId="currentWeatherIcon"
                >
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentWeather + String(currentTime)}
                      initial={{ opacity: 0, scale: 0.5, y: 10 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.5, y: -10 }}
                      transition={{ duration: 0.3 }}
                    >
                      {getWeatherIcon(currentWeather, 40, currentTime)}
                    </motion.div>
                  </AnimatePresence>
                </motion.div>
                <motion.div 
                  className={getWeatherTextColor(currentWeather, currentTime)}
                  key={`weather-text-${currentWeather}`}
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="text-sm font-medium">Current Weather</div>
                  <div className="text-xl font-medium capitalize">{getDisplayWeatherName(currentWeather, currentTime)}</div>
                </motion.div>
              </motion.div>
              
              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-700 mb-2 flex items-center">
                  <Clock size={14} className="mr-1" />
                  Next 12 hours
                </h4>
                <div className="h-0.5 w-full bg-gray-100 mb-3"></div>
              </div>
              
              <div className="grid grid-cols-4 gap-4 max-h-60 overflow-y-auto pr-1">
                {getDisplayForecast().map(({hour, weather}, index) => {
                  const bgClass = getWeatherBg(weather, hour);
                  const textColorClass = getWeatherTextColor(weather, hour);
                  
                  return (
                    <motion.div 
                      key={index} 
                      className={`text-center p-2 rounded-lg ${bgClass} border border-gray-100 ${textColorClass}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileHover={{ y: -2, boxShadow: "0 4px 6px rgba(0,0,0,0.05)" }}
                    >
                      <div className="text-sm font-medium">
                        {formatHour(hour)}
                      </div>
                      <div className="mt-2 flex justify-center">
                        {getWeatherIcon(weather, 24, hour)}
                      </div>
                      <div className="text-xs mt-1 capitalize font-medium">
                        {getDisplayWeatherName(weather, hour)}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}