import type { EventOption, GameEvent } from "../../types/game";
import { motion } from "framer-motion";
import { AlertCircle, AlertTriangle, Gift, MessageSquare, Award } from "lucide-react";

type EventModalProps = {
  event: GameEvent;
  onOptionSelect: (option: EventOption) => void;
};

export default function EventModal({ event, onOptionSelect }: EventModalProps) {
  const getEventIcon = () => {
    switch (event.id) {
      case 'block_party':
        return <Gift className="text-emerald-500" />;
      case 'tree_planting':
        return <Gift className="text-green-500" />;
      case 'power_outage':
        return <AlertTriangle className="text-amber-500" />;
      case 'noise_complaint':
        return <AlertCircle className="text-red-500" />;
      case 'viral_challenge':
        return <Award className="text-purple-500" />;
      default:
        return <MessageSquare className="text-blue-500" />;
    }
  };

  const getBgGradient = () => {
    switch (event.id) {
      case 'block_party':
        return 'from-emerald-500 to-teal-600';
      case 'tree_planting':
        return 'from-green-500 to-emerald-600';
      case 'power_outage':
        return 'from-amber-500 to-orange-600';
      case 'noise_complaint':
        return 'from-red-500 to-pink-600';
      case 'viral_challenge':
        return 'from-purple-500 to-indigo-600';
      default:
        return 'from-blue-500 to-indigo-600';
    }
  };

  const getOptionClass = (index: number) => {
    const option = event.options[index];
    const isPositive = option.coins >= 0 && option.happiness && option.happiness >= 0;
    const isNegative = option.coins < 0 || (option.happiness && option.happiness < 0);
    
    if (isPositive) {
      return 'hover:bg-emerald-50 hover:border-emerald-200 border-emerald-100';
    } else if (isNegative) {
      return 'hover:bg-amber-50 hover:border-amber-200 border-amber-100';
    } else {
      return 'hover:bg-gray-50 hover:border-gray-200 border-gray-100';
    }
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.5)" }}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 20 }}
        className="bg-white rounded-2xl overflow-hidden max-w-lg w-full shadow-2xl"
      >
        <div className={`p-5 bg-gradient-to-r ${getBgGradient()} text-white`}>
          <div className="flex items-center gap-3">
            {getEventIcon()}
            <h2 className="text-xl font-medium lowercase">{event.title}</h2>
          </div>
        </div>
        
        <div className="p-6">
          <p className="mb-6 text-gray-700 text-lg leading-relaxed">{event.description}</p>
          
          <h3 className="text-lg font-medium mb-3 text-gray-800">What will you do?</h3>
          
          <div className="space-y-3">
            {event.options.map((option, index) => (
              <motion.button
                key={index}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onOptionSelect(option)}
                className={`w-full text-left px-6 py-4 bg-white border rounded-xl transition-colors ${getOptionClass(index)}`}
              >
                <div className="flex flex-col gap-2">
                  <span className="font-medium text-gray-800">{option.text}</span>
                  
                  <div className="flex flex-wrap gap-2 text-sm">
                    {option.coins !== 0 && (
                      <span className={`px-2 py-1 rounded-full ${option.coins > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                        {option.coins > 0 ? `+${option.coins}` : option.coins} coins
                      </span>
                    )}
                    
                    {option.happiness && option.happiness !== 0 && (
                      <span className={`px-2 py-1 rounded-full ${option.happiness > 0 ? 'bg-blue-100 text-blue-800' : 'bg-amber-100 text-amber-800'}`}>
                        {option.happiness > 0 ? `+${option.happiness}` : option.happiness} happiness
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}