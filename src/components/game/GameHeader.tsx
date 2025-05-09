import React from 'react';
import { motion } from 'framer-motion';
import { User, Save, Award, AlertCircle } from 'lucide-react';
import DayNightCycle from './DayNightCycle';
import ProgressBar from './ProgressBar';
import Button from '../ui/Button';
import type { TimeOfDay } from '../../types/game';

interface GameHeaderProps {
  playerName: string;
  coins: number;
  happiness: number;
  day: number;
  level: number;
  experience: number;
  gameTime: number;
  timeOfDay: TimeOfDay;
  hasUnpaidBills: boolean;
  achievements: { completed: boolean }[];
  onOpenSaveManager: () => void;
  onShowTutorial: () => void;
  onShowAchievements: () => void;
  onTimeChange: (newTime: number, newTimeOfDay: TimeOfDay) => void;
}

export default function GameHeader({
  playerName,
  coins,
  happiness,
  day,
  level,
  experience,
  gameTime,
  timeOfDay,
  hasUnpaidBills,
  achievements,
  onOpenSaveManager,
  onShowTutorial,
  onShowAchievements,
  onTimeChange
}: GameHeaderProps) {
  return (
    <div className="w-full">
      <header className={`text-white p-4 shadow-md transition-colors duration-700 ${
        timeOfDay === 'morning' ? 'bg-gradient-to-r from-amber-500 to-amber-600' :
        timeOfDay === 'day' ? 'bg-gradient-to-r from-emerald-600 to-teal-700' :
        timeOfDay === 'evening' ? 'bg-gradient-to-r from-orange-500 to-red-600' :
        'bg-gradient-to-r from-indigo-800 to-purple-900'
      }`}>
        <div className="container mx-auto flex justify-between items-center">
          <motion.h1 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="text-2xl font-medium lowercase tracking-tight flex items-center"
          >
            <span className="text-2xl mr-2">🏙️</span> neighborville
          </motion.h1>
          <div className="flex items-center space-x-6">
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="flex items-center bg-black bg-opacity-20 px-3 py-1.5 rounded-full"
            >
              <div className="mr-2 text-xl">💰</div>
              <span className="font-medium lowercase text-base">{coins} coins</span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="flex items-center bg-black bg-opacity-20 px-3 py-1.5 rounded-full"
            >
              <div className="mr-2 text-xl">😊</div>
              <div className="w-24 h-4 bg-black bg-opacity-30 rounded-full overflow-hidden shadow-inner">
                <motion.div
                  initial={{ width: "0%" }}
                  animate={{ width: `${happiness}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className="h-full bg-white bg-opacity-80"
                  style={{ 
                    background: `linear-gradient(90deg, #34d399 0%, #10b981 ${happiness}%)` 
                  }}
                ></motion.div>
              </div>
              <span className="ml-2 font-medium lowercase text-base">{happiness}%</span>
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center space-x-3"
            >
              <div className="flex items-center bg-black bg-opacity-20 px-3 py-1.5 rounded-full">
                <div className="mr-2 text-xl">📅</div>
                <span className="font-medium lowercase text-base">day {day}</span>
              </div>

              <DayNightCycle 
                day={day} 
                gameTime={gameTime}
                onTimeChange={onTimeChange}
              />
            </motion.div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-3 flex items-center justify-between bg-white bg-opacity-10 backdrop-filter backdrop-blur-lg border-b border-white border-opacity-10">
        <div className="flex items-center">
          <motion.div 
            whileHover={{ scale: 1.05 }}
            className="bg-white bg-opacity-80 rounded-lg shadow-sm px-3 py-1.5 mr-2 flex items-center justify-center"
          >
            <User size={16} className="text-emerald-800 mr-1" />
            <span className="text-emerald-800 font-medium mr-2 text-sm lowercase">{playerName} • level {level}</span>
            <ProgressBar 
              value={experience} 
              maxValue={level * 100} 
              width={80}
              color="#10b981"
              bgColor="#e2e8f0"
            />
          </motion.div>
          
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="bg-white bg-opacity-80 rounded-lg shadow-sm p-1.5 mr-2 flex items-center justify-center cursor-pointer"
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
              className="bg-red-100 rounded-lg shadow-sm p-1.5 mr-2 flex items-center justify-center"
            >
              <AlertCircle size={16} className="text-red-600 mr-1" />
              <span className="text-red-600 text-sm lowercase">
                unpaid bills
              </span>
            </motion.div>
          )}
        </div>
        
        <div className="flex items-center">
          <Button
            variant="secondary"
            size="sm"
            icon={<Save size={16} />}
            onClick={onOpenSaveManager}
            className="mr-2"
          >
            save
          </Button>
          
          <Button
            variant="secondary"
            size="sm"
            icon={<Award size={16} />}
            onClick={onShowTutorial}
          >
            help
          </Button>
        </div>
      </div>
    </div>
  );
}