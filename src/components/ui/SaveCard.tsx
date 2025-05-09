import React from 'react';
import { motion } from 'framer-motion';
import { User, Calendar, Coins, ArrowRight, Clock } from 'lucide-react';
import type { GameProgress } from '../../types/game';

interface SaveCardProps {
  saveData: {
    key: string;
    name: string;
    date: string;
    data: GameProgress;
  };
  onClick: () => void;
}

export default function SaveCard({ saveData, onClick }: SaveCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className="relative overflow-hidden rounded-xl cursor-pointer"
      onClick={onClick}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-300 to-teal-500 opacity-20 z-0" />
      
      <div className="relative z-10 backdrop-filter backdrop-blur-md bg-white bg-opacity-80 p-4 rounded-xl border border-white border-opacity-30 shadow-lg">
        <div className="flex justify-between items-start">
          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center mr-3 shadow-md">
              <User size={22} className="text-white" />
            </div>
            <div>
              <div className="text-gray-900 font-medium text-lg">{saveData.name || "Unnamed Player"}</div>
              <div className="text-gray-700 text-sm flex items-center">
                <Clock size={14} className="mr-1 text-gray-500" />
                {saveData.date}
              </div>
            </div>
          </div>
          
          <motion.div
            whileHover={{ scale: 1.1, rotate: 10 }}
            whileTap={{ scale: 0.9 }}
            className="bg-gradient-to-br from-emerald-400 to-teal-500 rounded-full p-2 shadow-md"
          >
            <ArrowRight size={20} className="text-white" />
          </motion.div>
        </div>
        
        <div className="mt-4 grid grid-cols-3 gap-3">
          <div className="bg-white bg-opacity-60 rounded-lg p-3 flex flex-col items-center backdrop-filter backdrop-blur-sm shadow-sm border border-white border-opacity-50">
            <Calendar size={18} className="text-emerald-600 mb-1" />
            <span className="text-gray-900 font-medium">Day {saveData.data.day}</span>
          </div>
          
          <div className="bg-white bg-opacity-60 rounded-lg p-3 flex flex-col items-center backdrop-filter backdrop-blur-sm shadow-sm border border-white border-opacity-50">
            <Coins size={18} className="text-amber-600 mb-1" />
            <span className="text-gray-900 font-medium">{saveData.data.coins} coins</span>
          </div>
          
          <div className="bg-white bg-opacity-60 rounded-lg p-3 flex flex-col items-center backdrop-filter backdrop-blur-sm shadow-sm border border-white border-opacity-50">
            <span className="text-2xl mb-1">😊</span>
            <span className="text-gray-900 font-medium">{saveData.data.happiness}% happy</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
}