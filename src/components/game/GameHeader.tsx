import React from 'react';
import { motion } from 'framer-motion';
import { User, Save, Award, AlertCircle, Calendar, Clock, Settings, Play, Pause, TrendingUp, Volume2, VolumeX, Package, Factory, Wrench } from 'lucide-react';
import ProgressBar from './ProgressBar';
import Button from '../ui/Button';
import WeatherForecast from './WeatherForecast';
import Tooltip from '../ui/Tooltip';
import type { TimeOfDay, WeatherType } from '../../types/game';
import { getResourceById } from '../../data/resources';

interface GameHeaderProps {
  playerName: string;
  coins: number;
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
  playerResources?: { [resourceId: string]: number };
  onEndDay: () => void;
  onOpenSaveManager: () => void;
  onShowSettings: () => void;
  onShowTutorial: () => void;
  onShowAchievements: () => void;
  onLogout?: () => void;
  onToggleTimePause: () => void;
  onTimeChange: (newTime: number, newTimeOfDay: TimeOfDay) => void;
  timeSpeed: 1 | 2 | 3;
  onChangeTimeSpeed: (speed: 1 | 2 | 3) => void;
  onShowCalendar: () => void;
  onToggleWeatherForecast: () => void;
  onShowBudgetModal: () => void;
  onPlayerNameClick?: () => void;
  autoSaving?: boolean;
  lastSaveTime?: Date | null;
  onProfileClick: () => void;
  isMusicPlaying: boolean;
  onToggleMusic: () => void;
  onSaveGame?: () => void;
  onShowProductionManager?: () => void;
}

export default function GameHeader({
  playerName,
  coins,
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
  playerResources = {},
  onEndDay,
  onOpenSaveManager,
  onShowSettings,
  onShowTutorial,
  onShowAchievements,
  onToggleTimePause,
  onTimeChange,
  timeSpeed,
  onChangeTimeSpeed,
  onShowCalendar,
  onToggleWeatherForecast,
  onShowBudgetModal,
  onPlayerNameClick,
  autoSaving,
  lastSaveTime,
  onProfileClick,
  isMusicPlaying,
  onToggleMusic,
  onLogout,
  onSaveGame,
  onShowProductionManager
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
                className="cursor-pointer flex items-center rounded-lg bg-white/10 backdrop-blur-sm px-3 py-1.5 border border-white/20"
                onClick={onShowBudgetModal}
              >
                <span className="mr-2 text-xl">💰</span>
                <span className="font-medium lowercase text-base">{coins} coins</span>
              </motion.div>
            </motion.div>

            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center"
            >
              <Tooltip content="Resource Inventory - Click to manage your materials">
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  onClick={onShowProductionManager}
                  className="cursor-pointer flex items-center rounded-lg bg-white/10 backdrop-blur-sm px-3 py-1.5 border border-white/20 gap-2 min-w-[180px]"
                >
                  <Package size={16} className="text-white/80" />
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1">
                      <span className="text-sm">🪵</span>
                      <span className="text-xs font-medium text-white">{playerResources['wood'] || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">🪨</span>
                      <span className="text-xs font-medium text-white">{playerResources['stone'] || 0}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-sm">⛏️</span>
                      <span className="text-xs font-medium text-white">{playerResources['iron_ore'] || 0}</span>
                    </div>
                    
                    {Object.entries(playerResources)
                      .filter(([resourceId, quantity]) => 
                        quantity > 0 && 
                        !['wood', 'stone', 'iron_ore'].includes(resourceId)
                      )
                      .slice(0, 2)
                      .map(([resourceId, quantity]) => {
                        const resource = getResourceById(resourceId);
                        if (resource) {
                          return (
                            <div key={resourceId} className="flex items-center gap-1">
                              <span className="text-sm">{resource.icon}</span>
                              <span className="text-xs font-medium text-white">{quantity}</span>
                            </div>
                          );
                        }
                        return null;
                      })}
                    
                    {Object.keys(playerResources).filter(id => 
                      playerResources[id] > 0 && 
                      !['wood', 'stone', 'iron_ore'].includes(id)
                    ).length > 2 && (
                      <span className="text-xs text-white/70">
                        +{Object.keys(playerResources).filter(id => 
                          playerResources[id] > 0 && 
                          !['wood', 'stone', 'iron_ore'].includes(id)
                        ).length - 2}
                      </span>
                    )}
                  </div>
                </motion.div>
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
                <motion.span 
                  key={gameTime + ":" + gameMinutes}
                  initial={{ opacity: 0.8, y: 3 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className="font-medium lowercase text-base"
                >
                  {getFormattedTime()}
                </motion.span>
                <div className="flex ml-2">
                  <button 
                    className="p-0.5 bg-white/10 rounded-full"
                    onClick={onToggleTimePause}
                  >
                    {timePaused ? 
                      <Play size={14} className="text-white" /> : 
                      <Pause size={14} className="text-white" />
                    }
                  </button>
                  
                  <div className="flex ml-1 bg-white/10 rounded-full">
                    <motion.button 
                      className={`px-1 text-xs rounded-l-full ${timeSpeed === 1 ? 'bg-white/20 font-medium' : ''}`}
                      onClick={() => onChangeTimeSpeed(1)}
                      whileTap={{ scale: 0.95 }}
                    >
                      1x
                    </motion.button>
                    <motion.button 
                      className={`px-1 text-xs ${timeSpeed === 2 ? 'bg-white/20 font-medium' : ''}`}
                      onClick={() => onChangeTimeSpeed(2)}
                      whileTap={{ scale: 0.95 }}
                    >
                      2x
                    </motion.button>
                    <motion.button 
                      className={`px-1 text-xs rounded-r-full ${timeSpeed === 3 ? 'bg-white/20 font-medium' : ''}`}
                      onClick={() => onChangeTimeSpeed(3)}
                      whileTap={{ scale: 0.95 }}
                    >
                      3x
                    </motion.button>
                  </div>
                </div>
              </div>

              <WeatherForecast
                currentWeather={weather}
                forecast={weatherForecast}
                isExpanded={showWeatherForecast}
                onToggle={onToggleWeatherForecast}
                currentTime={gameTime}
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
                icon={<Save size={16} className={autoSaving ? "animate-pulse text-emerald-500" : ""} />}
                onClick={onOpenSaveManager}
                disabled={autoSaving}
                className={autoSaving ? "border-emerald-500 bg-emerald-50" : ""}
              >
                {autoSaving ? 'saving...' : 'save'}
              </Button>
              {lastSaveTime && (
                <div className={`absolute -bottom-5 left-0 right-0 text-xs ${autoSaving ? "text-emerald-600 font-medium" : "text-slate-500"} text-center whitespace-nowrap`}>
                  {autoSaving ? 'Saving game...' : `Last saved: ${lastSaveTime.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit', second:'2-digit'})}`}
                </div>
              )}
              {autoSaving && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="absolute top-0 right-0 -mr-1 -mt-1 w-3 h-3 rounded-full bg-emerald-500"
                  style={{
                    boxShadow: '0 0 0 2px white'
                  }}
                />
              )}
            </div>
            
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