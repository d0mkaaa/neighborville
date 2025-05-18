import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, Award, Coins, Calendar, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import type { SeasonalEvent, Season } from "../../types/game";
import { SEASONS } from "../../data/seasons";

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
  
  const getEventStatus = (event: SeasonalEvent) => {
    if (event.dayStarted && day >= event.dayStarted && day < event.dayStarted + event.duration) {
      return 'active';
    }
    
    const triggerDay = currentSeason.startDay + event.triggerDayInSeason - 1;
    if (day < triggerDay) {
      return 'upcoming';
    }
    
    if (day >= triggerDay && day < triggerDay + event.duration) {
      return 'active';
    }
    
    return 'ended';
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="bg-white rounded-xl shadow-xl overflow-hidden max-w-5xl w-full max-h-[80vh] flex flex-col"
    >
      <div 
        className="p-4 flex justify-between items-center" 
        style={{ 
          background: `linear-gradient(to right, ${currentSeason.colorTheme}, ${currentSeason.colorTheme}99)`,
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div className="flex items-center gap-2">
          <span className="text-3xl">{currentSeason.icon}</span>
          <div>
            <h2 className="text-white font-medium text-lg">{currentSeason.name} Season</h2>
            <p className="text-white/80 text-sm">Day {dayInSeason} of {currentSeason.durationDays}</p>
          </div>
        </div>
        <button onClick={onClose} className="text-white/80 hover:text-white transition-all p-2 hover:bg-white/10 rounded-full">
          <X size={20} />
        </button>
      </div>
      
      <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 border-b flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Clock size={18} className="text-purple-500" />
          <span className="text-purple-700">
            {daysRemaining > 0 ? (
              <>{daysRemaining} days until {nextSeason.name} Season</>
            ) : (
              <>Last day of {currentSeason.name} Season</>
            )}
          </span>
        </div>
        
        <div className="flex items-center gap-2 bg-white/50 backdrop-blur-sm px-3 py-1.5 rounded-full border border-purple-100">
          <Coins size={16} className="text-amber-500" />
          <span className="font-medium text-gray-700">{coins} coins</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Calendar size={20} className="text-blue-500" />
            <h3 className="text-lg font-medium text-gray-800">Seasonal Events</h3>
          </div>
          
          {activeEvents.length === 0 ? (
            <div className="p-5 bg-gray-50 rounded-lg text-center text-gray-500 flex flex-col items-center">
              <Calendar size={32} className="text-gray-300 mb-2" />
              <p>No active events at this time</p>
              <p className="text-sm mt-1">Check back later in the season!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activeEvents.map(event => {
                const eventStatus = getEventStatus(event);
                const isExpanded = expandedEventId === event.id;
                const triggerDay = currentSeason.startDay + event.triggerDayInSeason - 1;
                const daysUntil = triggerDay - day;
                const daysLeft = eventStatus === 'active' 
                  ? (event.dayStarted ? event.dayStarted + event.duration - day : triggerDay + event.duration - day) 
                  : 0;
                const isActive = eventStatus === 'active';
                
                return (
                  <motion.div
                    key={event.id}
                    whileHover={{ scale: 1.01 }}
                    onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                      isExpanded
                        ? 'border-emerald-500 shadow-md bg-emerald-50'
                        : isActive
                        ? 'border-blue-500 bg-blue-50'
                        : daysUntil <= 7 && daysUntil > 0
                        ? 'border-yellow-500 bg-yellow-50'
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{event.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-800">{event.name}</h3>
                        <div className="flex items-center gap-1 text-sm">
                          {eventStatus === 'active' ? (
                            <span className="flex items-center gap-1 text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">
                              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse inline-block"></span>
                              Active • {daysLeft} day{daysLeft !== 1 ? 's' : ''} left
                            </span>
                          ) : daysUntil > 0 ? (
                            <span className="flex items-center gap-1 text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                              <Clock size={12} />
                              Starts in {daysUntil} day{daysUntil !== 1 ? 's' : ''}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-gray-600 bg-gray-100 px-2 py-0.5 rounded-full">
                              <CheckCircle size={12} />
                              Ended
                            </span>
                          )}
                        </div>
                      </div>
                      <span className="text-gray-400">
                        {isExpanded ? '▼' : '▶'}
                      </span>
                    </div>
                    
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ duration: 0.2 }}
                          className="mt-3 pt-3 border-t"
                        >
                          <p className="text-gray-700 mb-3">{event.description}</p>
                          
                          {event.bonuses.length > 0 && (
                            <div className="mb-3">
                              <h4 className="text-sm font-medium text-gray-700 mb-1">Event Bonuses:</h4>
                              <div className="grid grid-cols-2 gap-2">
                                {event.bonuses.map((bonus, i) => (
                                  <div 
                                    key={i} 
                                    className={`px-3 py-2 rounded text-xs flex items-center gap-1.5 ${
                                      bonus.amount > 0 
                                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' 
                                        : 'bg-amber-50 text-amber-700 border border-amber-200'
                                    }`}
                                  >
                                    <Award size={12} />
                                    <span>
                                      {bonus.amount > 0 ? '+' : ''}{bonus.amount}% {formatBonusType(bonus.type)}
                                    </span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {!event.selectedOption && event.options.length > 0 && isActive && (
                            <div>
                              <h5 className="text-sm font-medium text-gray-700 mb-2">Available Activities:</h5>
                              <div className="space-y-2">
                                {event.options.map(option => (
                                  <button
                                    key={option.id}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onSelectEventOption(event.id, option.id);
                                    }}
                                    disabled={coins < option.cost}
                                    className={`w-full p-3 text-sm rounded-lg text-left flex justify-between items-center transition-colors ${
                                      coins < option.cost
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : 'bg-white border border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                                    }`}
                                  >
                                    <div>
                                      <div className="font-medium">{option.name}</div>
                                      <div className="text-xs flex items-center gap-1 mt-1">
                                        <Coins size={12} className="text-amber-500" />
                                        <span className={coins < option.cost ? 'text-red-500 font-medium' : 'text-gray-600'}>
                                          Cost: {option.cost} coins
                                        </span>
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
                            <div className="mt-2 p-3 bg-emerald-50 text-emerald-700 rounded-lg border border-emerald-200 text-sm flex items-center gap-2">
                              <CheckCircle size={14} />
                              <span>You've already participated in this event</span>
                            </div>
                          )}
                          
                          {!isActive && daysUntil <= 0 && (
                            <div className="mt-2 p-3 bg-gray-50 text-gray-500 rounded-lg border border-gray-200 text-sm flex items-center gap-2">
                              <AlertTriangle size={14} />
                              <span>This event has ended</span>
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>
        
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Award size={20} className="text-purple-500" />
            <h3 className="text-lg font-medium text-gray-800">Season Bonuses</h3>
          </div>
          
          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 p-5 rounded-lg border border-purple-100">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">{currentSeason.icon}</span>
              <div>
                <h4 className="font-medium text-gray-800">{currentSeason.name} Season Effects</h4>
                <p className="text-sm text-gray-600">{currentSeason.description}</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 gap-3">
              {currentSeason.bonuses.map((bonus, index) => (
                <div 
                  key={index}
                  className={`flex items-center p-3 rounded-lg border ${
                    bonus.amount > 0 
                      ? 'bg-white/70 text-emerald-700 border-emerald-200' 
                      : 'bg-white/70 text-amber-700 border-amber-200'
                  }`}
                >
                  <div className="mr-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      bonus.amount > 0 ? 'bg-emerald-100' : 'bg-amber-100'
                    }`}>
                      {bonus.type === 'happiness' && <span className="text-xl">😊</span>}
                      {bonus.type === 'income' && <Coins size={20} />}
                      {bonus.type === 'energy' && <span className="text-xl">⚡</span>}
                      {bonus.type === 'garden' && <span className="text-xl">🌱</span>}
                      {bonus.type === 'reputation' && <span className="text-xl">⭐</span>}
                      {bonus.type === 'experience' && <span className="text-xl">📈</span>}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{formatBonusType(bonus.type)}</span>
                      <span className={`font-bold ${bonus.amount > 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                        {bonus.amount > 0 ? '+' : ''}{bonus.amount}%
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mt-0.5">{bonus.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="mt-6">
            <div className="flex items-center gap-2 mb-3">
              <Calendar size={18} className="text-blue-500" />
              <h4 className="font-medium text-gray-800">Coming Next</h4>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{nextSeason.icon}</span>
                <div>
                  <div className="font-medium text-gray-800">{nextSeason.name} Season</div>
                  <div className="text-sm text-gray-600">{nextSeason.description}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 text-sm text-blue-600">
                <span>In {daysRemaining} days</span>
                <ArrowRight size={14} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function formatBonusType(type: string): string {
  switch (type) {
    case 'happiness': return 'Happiness';
    case 'income': return 'Income';
    case 'energy': return 'Energy Efficiency';
    case 'garden': return 'Garden Output';
    case 'commercial': return 'Commercial Revenue';
    case 'residential': return 'Residential Value';
    case 'tourism': return 'Tourism';
    case 'education': return 'Education';
    case 'reputation': return 'Reputation';
    case 'experience': return 'Experience Gain';
    case 'landValue': return 'Land Value';
    case 'health': return 'Health';
    case 'pollution': return 'Pollution Reduction';
    case 'traffic': return 'Traffic Flow';
    default: return type.charAt(0).toUpperCase() + type.slice(1);
  }
}
