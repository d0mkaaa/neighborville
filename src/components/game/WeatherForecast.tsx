import { motion, AnimatePresence } from "framer-motion";
import { CloudSun, CloudRain, CloudSnow, CloudLightning, Sun, Cloud, Moon } from "lucide-react";

type WeatherType = 'sunny' | 'rainy' | 'cloudy' | 'stormy' | 'snowy';

type WeatherForecastProps = {
  currentWeather: WeatherType;
  forecast: WeatherType[];
  isExpanded: boolean;
  onToggle: () => void;
  currentTime?: number;
};

export default function WeatherForecast({ currentWeather, forecast, isExpanded, onToggle, currentTime = 12 }: WeatherForecastProps) {
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

  const getWeatherBg = (weather: WeatherType, hour: number = 12) => {
    const isNight = hour >= 21 || hour < 5;
    
    switch(weather) {
      case 'sunny': 
        return isNight ? 'bg-indigo-200 text-indigo-800' : 'bg-yellow-100 text-yellow-700';
      case 'rainy': 
        return 'bg-blue-100 text-blue-700';
      case 'cloudy': 
        return isNight ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-700';
      case 'stormy': 
        return 'bg-purple-100 text-purple-700';
      case 'snowy': 
        return 'bg-cyan-100 text-cyan-700';
      default: 
        return isNight ? 'bg-indigo-200 text-indigo-800' : 'bg-yellow-100 text-yellow-700';
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

  return (
    <motion.div 
      className="relative"
      onMouseEnter={() => onToggle()}
      onMouseLeave={() => onToggle()}
    >
      <motion.div
        whileHover={{ scale: 1.05 }}
        className={`cursor-pointer rounded-lg p-2 shadow-sm ${getWeatherBg(currentWeather, currentTime)}`}
      >
        {getWeatherIcon(currentWeather, 24, currentTime)}
      </motion.div>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 5, scale: 0.95 }}
            className="absolute top-full mt-2 right-0 bg-white rounded-lg shadow-xl border border-gray-200 p-3 z-50"
            style={{ width: "200px" }}
          >
            <h3 className="text-sm font-medium text-gray-700 mb-2 lowercase">24h forecast</h3>
            <div className="text-xs text-gray-500 mb-2">
              current: {getDisplayWeatherName(currentWeather, currentTime)}
            </div>
            <div className="grid grid-cols-6 gap-2">
              {forecast.map((weather, index) => {
                const forecastHour = (currentTime + (index * 4)) % 24;
                return (
                  <div key={index} className="text-center">
                    <div className="text-xs text-gray-500">
                      {forecastHour}:00
                    </div>
                    <div className="mt-1 flex justify-center">
                      {getWeatherIcon(weather, 16, forecastHour)}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {getDisplayWeatherName(weather, forecastHour)}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}