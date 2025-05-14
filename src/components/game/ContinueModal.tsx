import { useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Plus, Calendar, Coins, Home, Smile } from 'lucide-react';
import type { GameProgress } from '../../types/game';

interface ContinueModalProps {
  savedGame: GameProgress;
  onContinue: () => void;
  onNewGame: () => void;
}

export default function ContinueModal({ savedGame, onContinue, onNewGame }: ContinueModalProps) {
  const buildingCount = savedGame.grid.filter(tile => tile !== null).length;
  
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50 p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-xl p-8 max-w-md w-full shadow-xl"
      >
        <h2 className="text-2xl font-medium text-emerald-800 mb-4 lowercase">
          welcome back!
        </h2>
        
        <div className="bg-emerald-50 rounded-lg p-4 mb-6">
          <p className="text-gray-700 mb-2 font-medium">
            We found a saved city for {savedGame.playerName}:
          </p>
          
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="flex items-center gap-2">
              <Calendar size={16} className="text-emerald-600" />
              <span className="text-gray-700">Day {savedGame.day}</span>
            </div>
            <div className="flex items-center gap-2">
              <Coins size={16} className="text-amber-500" />
              <span className="text-gray-700">{savedGame.coins} coins</span>
            </div>
            <div className="flex items-center gap-2">
              <Home size={16} className="text-blue-500" />
              <span className="text-gray-700">{buildingCount} buildings</span>
            </div>
            <div className="flex items-center gap-2">
              <Smile size={16} className="text-yellow-500" />
              <span className="text-gray-700">{savedGame.happiness}% happiness</span>
            </div>
          </div>
        </div>
        
        <p className="text-gray-600 mb-6">
          What would you like to do?
        </p>
        
        <div className="flex flex-col gap-3">
          <button
            onClick={onContinue}
            className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-3 px-4 rounded-lg font-medium transition-colors lowercase flex items-center justify-center gap-2"
          >
            <Play size={18} />
            continue this city
          </button>
          <button
            onClick={onNewGame}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-3 px-4 rounded-lg font-medium transition-colors lowercase flex items-center justify-center gap-2"
          >
            <Plus size={18} />
            start a fresh city
          </button>
          
          <p className="text-xs text-gray-500 text-center mt-2">
            Starting a new city won't affect your saved game
          </p>
        </div>
      </motion.div>
    </div>
  );
} 