import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, X, ChevronRight, Award, Coins } from 'lucide-react';
import type { Season, SeasonalEvent } from '../../types/game';

type SeasonalEventsPanelProps = {
  currentSeason: Season;
  activeEvents: SeasonalEvent[];
  day: number;
  coins: number;
  onSelectEventOption: (eventId: string, optionId: string) => void;
  onClose: () => void;
};

export default function SeasonalEventsPanel({
  currentSeason,
  activeEvents,
  day,
  coins,
  onSelectEventOption,
  onClose
}: SeasonalEventsPanelProps) {
  const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

  const dayInSeason = ((day - currentSeason.startDay) % currentSeason.durationDays) + 1;
  const daysRemaining = currentSeason.durationDays - dayInSeason;
  
  const nextSeasonIndex = (SEASONS.findIndex(s => s.id === currentSeason.id) + 1) % SEASONS.length;
  const nextSeason = SEASONS[nextSeasonIndex];
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white rounded-xl shadow-xl overflow-hidden max-w-md w-full max-h-[80vh] flex flex-col"
    >
      <div 
        className="p-4 flex justify-between items-center" 
        style={{ backgroundColor: currentSeason.colorTheme }}
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">{currentSeason.icon}</span>
          <h2 className="text-white font-medium text-lg">{currentSeason.name} Season</h2>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white">
          <X size={20} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4">
        <div className="mb-4">
          <p className="text-gray-600">{currentSeason.description}</p>
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-1 text-sm text-gray-500">
              <Calendar size={14} />
              <span>Day {dayInSeason} of {currentSeason.durationDays}</span>
            </div>
            <div className="text-sm text-gray-500">
              {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} until {nextSeason.name}
            </div>
          </div>
        </div>
        
        <div className="mb-4">
          <h3 className="font-medium text-gray-800 mb-2">Season Bonuses</h3>
          <div className="space-y-2">
            {currentSeason.bonuses.map((bonus, idx) => (
              <div key={idx} className="p-2 bg-gray-50 rounded-lg text-sm">
                <div className="font-medium text-gray-700">
                  {bonus.amount > 0 ? '+' : ''}{bonus.amount}% {formatBonusType(bonus.type)}
                </div>
                <div className="text-gray-500">{bonus.description}</div>
              </div>
            ))}
          </div>
        </div>
        
        {activeEvents.length > 0 && (
          <div>
            <h3 className="font-medium text-gray-800 mb-2">Active Events</h3>
            <div className="space-y-3">
              <AnimatePresence>
                {activeEvents.map(event => (
                  <motion.div
                    key={event.id}
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border border-gray-200 rounded-lg overflow-hidden"
                  >
                    <div 
                      className="p-3 flex justify-between items-center cursor-pointer"
                      onClick={() => setExpandedEventId(expandedEventId === event.id ? null : event.id)}
                      style={{ 
                        backgroundColor: expandedEventId === event.id 
                          ? `${currentSeason.colorTheme}20`
                          : 'white'
                      }}
                    >
                      <div className="flex items-center gap-2">
                        <span className="text-2xl">{event.icon}</span>
                        <div>
                          <h4 className="font-medium">{event.name}</h4>
                          <p className="text-xs text-gray-500">
                            {event.dayStarted ? `Started on day ${event.dayStarted}` : 'Just started'}
                          </p>
                        </div>
                      </div>
                      <ChevronRight 
                        size={16} 
                        className={`transition-transform ${expandedEventId === event.id ? 'rotate-90' : ''}`} 
                      />
                    </div>
                    
                    {expandedEventId === event.id && (
                      <div className="p-3 border-t border-gray-100 bg-gray-50">
                        <p className="text-sm text-gray-600 mb-3">{event.description}</p>
                        
                        <div className="mb-3">
                          <h5 className="text-xs font-medium text-gray-700 mb-1">Event Bonuses:</h5>
                          <div className="flex flex-wrap gap-2">
                            {event.bonuses.map((bonus, idx) => (
                              <span 
                                key={idx}
                                className={`text-xs px-2 py-1 rounded-full ${
                                  bonus.amount > 0 
                                    ? 'bg-green-100 text-green-700' 
                                    : 'bg-red-100 text-red-700'
                                }`}
                              >
                                {bonus.amount > 0 ? '+' : ''}{bonus.amount}% {formatBonusType(bonus.type)}
                              </span>
                            ))}
                          </div>
                        </div>
                        
                        {!event.selectedOption && event.options.length > 0 && (
                          <div>
                            <h5 className="text-xs font-medium text-gray-700 mb-1">Available Actions:</h5>
                            <div className="space-y-2">
                              {event.options.map(option => (
                                <button
                                  key={option.id}
                                  onClick={() => onSelectEventOption(event.id, option.id)}
                                  disabled={coins < option.cost}
                                  className={`w-full p-2 text-sm rounded-lg text-left flex justify-between items-center ${
                                    coins < option.cost
                                      ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                      : 'bg-white border border-gray-200 hover:border-gray-300'
                                  }`}
                                >
                                  <div>
                                    <div className="font-medium">{option.name}</div>
                                    <div className="text-xs flex items-center gap-1">
                                      <Coins size={12} className="text-amber-500" />
                                      <span>Cost: {option.cost}</span>
                                    </div>
                                  </div>
                                  <div className="bg-blue-50 px-2 py-1 rounded text-xs text-blue-600 flex items-center gap-1">
                                    <Award size={12} />
                                    <span>+{option.reward.amount} {formatBonusType(option.reward.type)}</span>
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {event.selectedOption && (
                          <div className="bg-blue-50 p-2 rounded-lg text-sm text-blue-700">
                            You selected: {event.options.find(o => o.id === event.selectedOption)?.name}
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
        
        {activeEvents.length === 0 && (
          <div className="text-center py-6">
            <div className="text-5xl mb-2">{currentSeason.icon}</div>
            <h3 className="text-gray-600 mb-1">No active events</h3>
            <p className="text-sm text-gray-500">Check back as the season progresses</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function formatBonusType(type: string): string {
  switch (type) {
    case 'happiness': return 'Happiness';
    case 'income': return 'Income';
    case 'energy': return 'Energy';
    case 'garden': return 'Garden Production';
    case 'tourism': return 'Tourism Income';
    case 'commercial': return 'Commercial Income';
    case 'residential': return 'Residential Happiness';
    case 'education': return 'Education Effect';
    case 'reputation': return 'Reputation';
    case 'experience': return 'Experience';
    default: return type.charAt(0).toUpperCase() + type.slice(1);
  }
}

const SEASONS = [
  {
    id: "spring",
    name: "Spring",
    icon: "🌸",
    colorTheme: "#a5d6a7",
    durationDays: 30,
    startDay: 1,
    description: "Flowers bloom and the town comes alive. Gardens thrive during this season.",
    bonuses: [
      {
        type: "happiness",
        amount: 5,
        description: "The pleasant weather improves everyone's mood"
      },
      {
        type: "garden",
        amount: 20,
        description: "Gardens and parks produce 20% more income"
      }
    ]
  },
  {
    id: "summer",
    name: "Summer",
    icon: "☀️",
    colorTheme: "#ffca28",
    durationDays: 30,
    startDay: 31,
    description: "The hot season brings tourists and beach activities. Entertainment venues flourish.",
    bonuses: [
      {
        type: "tourism",
        amount: 15,
        description: "Entertainment buildings earn 15% more"
      },
      {
        type: "energy",
        amount: -10,
        description: "Energy usage increases by 10% due to cooling needs"
      }
    ]
  },
  {
    id: "autumn",
    name: "Autumn",
    icon: "🍂",
    colorTheme: "#e65100",
    durationDays: 30,
    startDay: 61,
    description: "Colorful leaves and harvest festivals. Commercial buildings see increased activity.",
    bonuses: [
      {
        type: "commercial",
        amount: 10,
        description: "Commercial buildings earn 10% more income"
      },
      {
        type: "education",
        amount: 15,
        description: "Educational buildings provide 15% more happiness"
      }
    ]
  },
  {
    id: "winter",
    name: "Winter",
    icon: "❄️",
    colorTheme: "#90caf9",
    durationDays: 30,
    startDay: 91,
    description: "Snowy days and holiday celebrations. Residential buildings gain bonuses.",
    bonuses: [
      {
        type: "residential",
        amount: 10,
        description: "Residential buildings provide 10% more happiness"
      },
      {
        type: "energy",
        amount: 15,
        description: "Energy usage increases by 15% due to heating needs"
      }
    ]
  }
];
