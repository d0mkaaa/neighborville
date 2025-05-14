import React from 'react';
import { motion } from 'framer-motion';
import { User, Save, Award, AlertCircle, Calendar, Clock, Settings, Play, Pause, TrendingUp, Volume2, VolumeX } from 'lucide-react';
import ProgressBar from './ProgressBar';
import Button from '../ui/Button';
import WeatherForecast from './WeatherForecast';
import Tooltip from '../ui/Tooltip';
import type { TimeOfDay, WeatherType } from '../../types/game';

interface GameHeaderProps {
  playerName: string;
  coins: number;
  happiness: number;
  energy: number;
  day: number;
  level: number;
  experience: number;
  gameTime: number;
  gameMinutes: number;
  timePaused: boolean;
  timeOfDay: TimeOfDay;
  weather: WeatherType;
  hasUnpaidBills: boolean;
  achievements: { completed: boolean }[];
  weatherForecast: WeatherType[];
  showWeatherForecast: boolean;
  onEndDay: () => void;
  onOpenSaveManager: () => void;
  onShowSettings: () => void;
  onShowTutorial: () => void;
  onShowAchievements: () => void;
  onLogout?: () => void;
  onToggleTimePause: () => void;
  onTimeChange: (newTime: number, newTimeOfDay: TimeOfDay) => void;
  onShowHappinessAnalytics: () => void;
  onShowCalendar: () => void;
  onToggleWeatherForecast: () => void;
  onShowCoinHistory: () => void;
  onPlayerNameClick?: () => void;
  autoSaving?: boolean;
  lastSaveTime?: Date | null;
  onProfileClick: () => void;
  isMusicPlaying: boolean;
  onToggleMusic: () => void;
  onSaveGame?: () => void;
}

export default function GameHeader({
  playerName,
  coins,
  happiness,
  energy,
  day,
  level,
  experience,
  gameTime,
  gameMinutes,
  timePaused,
  timeOfDay,
  weather,
  hasUnpaidBills,
  achievements,
  weatherForecast,
  showWeatherForecast,
  onEndDay,
  onOpenSaveManager,
  onShowSettings,
  onShowTutorial,
  onShowAchievements,
  onToggleTimePause,
  onTimeChange,
  onShowHappinessAnalytics,
  onShowCalendar,
  onToggleWeatherForecast,
  onShowCoinHistory,
  onPlayerNameClick,
  autoSaving,
  lastSaveTime,
  onProfileClick,
  isMusicPlaying,
  onToggleMusic,
  onLogout,
  onSaveGame
}: GameHeaderProps) {
  const getTimeOfDayColor = () => {
    switch(timeOfDay) {
      case 'morning': return 'from-amber-500 to-amber-600';
      case 'day': return 'from-emerald-600 to-teal-700';
      case 'evening': return 'from-orange-500 to-red-600';
      case 'night': return 'from-indigo-800 to-purple-900';
    }
  };

  const getFormattedTime = () => {
    const hours = gameTime % 12 || 12;
    const minutes = gameMinutes.toString().padStart(2, '0');
    const ampm = gameTime >= 12 ? 'pm' : 'am';
    return `${hours}:${minutes} ${ampm}`;
  };

  return (
    <div className="w-full z-30">
      <header className={`text-white p-4 shadow-lg transition-colors duration-700 bg-gradient-to-r ${getTimeOfDayColor()}`}>
        <div className="container mx-auto flex justify-between items-center">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-medium lowercase tracking-tight flex items-center"
          >
            <span className="text-2xl mr-2">🏙️</span> neighborville
          </motion.h1>
          
          <div className="flex items-center gap-3">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center"
            >
              <motion.div 
                whileHover={{ scale: 1.05 }}
                onClick={onShowCoinHistory}
                className="cursor-pointer flex items-center rounded-lg bg-white/10 backdrop-blur-sm px-3 py-1.5 border border-white/20"
              >
                <span className="mr-2 text-xl">💰</span>
                <span className="font-medium lowercase text-base">{coins} coins</span>
                <TrendingUp size={14} className="ml-1 text-white/80" />
              </motion.div>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-lg cursor-pointer"
              onClick={() => onShowHappinessAnalytics()}
            >
              <span className="mr-2 text-xl">😊</span>
              <div className="w-24 h-4 bg-black/20 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: `${happiness !== undefined ? happiness : 0}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-white bg-opacity-80"
                  style={{ 
                    background: `linear-gradient(90deg, #34d399 0%, #10b981 ${happiness !== undefined ? happiness : 0}%)` 
                  }}
                ></motion.div>
              </div>
              <Tooltip content={`Exact happiness: ${happiness.toFixed(2)}%`}>
                <span className="ml-2 font-medium lowercase text-base cursor-help">{Math.round(happiness !== undefined ? happiness : 0)}%</span>
              </Tooltip>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center gap-3"
            >
              <motion.div 
                className="flex items-center bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-lg cursor-pointer"
                whileHover={{ scale: 1.05 }}
                onClick={onShowCalendar}
              >
                <Calendar size={18} className="mr-2" />
                <span className="font-medium lowercase text-base">day {day}</span>
              </motion.div>

              <div className="flex items-center bg-white/10 backdrop-blur-sm border border-white/20 px-3 py-1.5 rounded-lg">
                <Clock size={18} className="mr-2" />
                <span className="font-medium lowercase text-base">{getFormattedTime()}</span>
                <button 
                  className="ml-2 p-0.5 bg-white/10 rounded-full"
                  onClick={onToggleTimePause}
                >
                  {timePaused ? 
                    <Play size={14} className="text-white" /> : 
                    <Pause size={14} className="text-white" />
                  }
                </button>
              </div>

              <WeatherForecast
                currentWeather={weather}
                forecast={weatherForecast}
                isExpanded={showWeatherForecast}
                onToggle={onToggleWeatherForecast}
              />
            </motion.div>
          </div>
        </div>
      </header>
      
      <div className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200 sticky top-0 z-20">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div 
              whileHover={{ scale: 1.05 }}
              onClick={onPlayerNameClick}
              className="bg-emerald-50 rounded-lg shadow-sm px-3 py-1.5 flex items-center cursor-pointer"
            >
              <User size={16} className="text-emerald-700 mr-2" />
              <span className="text-emerald-800 font-medium mr-2 text-sm lowercase">{playerName} • level {level}</span>
              <ProgressBar 
                value={experience} 
                maxValue={level * 100} 
                width={80}
                color="#10b981"
                bgColor="#e2e8f0"
                showText
                textPosition="inside"
              />
            </motion.div>
            
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="bg-emerald-50 rounded-lg shadow-sm p-1.5 flex items-center justify-center cursor-pointer"
              onClick={onShowAchievements}
            >
              <Award size={16} className="text-emerald-700 mr-1" />
              <span className="text-emerald-800 text-sm lowercase">
                {achievements.filter(a => a.completed).length}/{achievements.length}
              </span>
            </motion.div>
            
            {hasUnpaidBills && (
              <motion.div
                initial={{ scale: 0.9 }}
                animate={{ scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="bg-red-100 rounded-lg shadow-sm p-1.5 flex items-center justify-center"
              >
                <AlertCircle size={16} className="text-red-600 mr-1" />
                <span className="text-red-600 text-sm lowercase">
                  unpaid bills
                </span>
              </motion.div>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                icon={<Save size={16} />}
                onClick={onOpenSaveManager}
                disabled={autoSaving}
              >
                {autoSaving ? 'saving...' : 'save'}
              </Button>
              
              {lastSaveTime && !autoSaving && (
                <div className="absolute -bottom-5 left-0 right-0 text-xs text-slate-500 text-center">
                  {`Last saved: ${lastSaveTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                </div>
              )}
              
              {autoSaving && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="absolute top-0 right-0 -mr-1 -mt-1 w-2 h-2 rounded-full bg-emerald-500"
                  style={{
                    boxShadow: '0 0 0 2px white',
                    animation: 'pulse 1.5s cubic-bezier(0.4, 0, 0.6, 1) infinite'
                  }}
                />
              )}
            </div>
            
            {onSaveGame && (
              <button 
                onClick={onSaveGame}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100"
                title="Save Game"
              >
                <Save size={18} className="text-emerald-600" />
              </button>
            )}
            
            <Button
              variant="secondary"
              size="sm"
              icon={<Settings size={16} />}
              onClick={onShowSettings}
            >
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}