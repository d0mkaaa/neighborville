import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Gift, Trophy, Star, Crown, Sparkles, Heart, Coins } from "lucide-react";
import type { GameProgress, Neighbor, Building } from "../../types/game";

type SpecialEvent = {
  id: string;
  name: string;
  type: 'seasonal' | 'holiday' | 'celebration' | 'achievement' | 'community';
  description: string;
  startDay: number;
  endDay: number;
  icon: React.ReactNode;
  rewards: {
    coins?: number;
    happiness?: number;
    xp?: number;
    items?: string[];
  };
  requirements?: {
    buildings?: string[];
    residents?: number;
    happiness?: number;
    level?: number;
  };
  activities: {
    id: string;
    name: string;
    description: string;
    cost: number;
    reward: string;
    duration: number;
  }[];
  decorations?: {
    id: string;
    name: string;
    icon: string;
    effect: string;
  }[];
};

type SpecialEventsProps = {
  gameData: GameProgress;
  neighbors: Neighbor[];
  grid: (Building | null)[];
  onClose: () => void;
  onParticipate: (eventId: string, activityId: string) => void;
  onClaimReward: (eventId: string) => void;
};

export default function SpecialEvents({ gameData, neighbors, grid, onClose, onParticipate, onClaimReward }: SpecialEventsProps) {
  const [activeEvents, setActiveEvents] = useState<SpecialEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SpecialEvent | null>(null);
  
  useEffect(() => {
    checkForActiveEvents();
  }, [gameData.day]);
  
  const specialEvents: SpecialEvent[] = [
    {
      id: 'spring_festival',
      name: 'Spring Festival',
      type: 'seasonal',
      description: 'Celebrate the arrival of spring with flowers, music, and community gatherings!',
      startDay: Math.floor(gameData.day / 90) * 90 + 15,
      endDay: Math.floor(gameData.day / 90) * 90 + 25,
      icon: <Sparkles className="text-green-500" size={24} />,
      rewards: {
        coins: 500,
        happiness: 20,
        xp: 100,
        items: ['spring_crown', 'flower_seeds']
      },
      activities: [
        {
          id: 'plant_flowers',
          name: 'Plant Community Flowers',
          description: 'Create beautiful flower gardens throughout the neighborhood',
          cost: 200,
          reward: '+10% park happiness for 7 days',
          duration: 1
        },
        {
          id: 'spring_concert',
          name: 'Spring Concert',
          description: 'Host an outdoor music festival',
          cost: 300,
          reward: '+15% music venue income for 5 days',
          duration: 1
        },
        {
          id: 'art_contest',
          name: 'Spring Art Contest',
          description: 'Let residents showcase their artistic talents',
          cost: 150,
          reward: 'Unlock special art decorations',
          duration: 3
        }
      ],
      decorations: [
        { id: 'cherry_blossom', name: 'Cherry Blossom Tree', icon: '🌸', effect: '+5% happiness nearby' },
        { id: 'flower_bed', name: 'Colorful Flower Bed', icon: '🌺', effect: '+3% income to adjacent buildings' }
      ]
    },
    {
      id: 'summer_games',
      name: 'Summer Olympics',
      type: 'celebration',
      description: 'Host your own neighborhood Olympics with sports competitions and prizes!',
      startDay: Math.floor(gameData.day / 90) * 90 + 45,
      endDay: Math.floor(gameData.day / 90) * 90 + 55,
      icon: <Trophy className="text-yellow-500" size={24} />,
      rewards: {
        coins: 800,
        happiness: 25,
        xp: 150,
        items: ['gold_medal', 'sports_trophy']
      },
      requirements: {
        residents: 10,
        happiness: 70
      },
      activities: [
        {
          id: 'track_events',
          name: 'Track & Field Events',
          description: 'Organize running, jumping, and throwing competitions',
          cost: 400,
          reward: '+25% resident happiness for winners',
          duration: 2
        },
        {
          id: 'team_sports',
          name: 'Team Sports Tournament',
          description: 'Create neighborhood teams for various sports',
          cost: 500,
          reward: 'Strengthen community bonds',
          duration: 3
        },
        {
          id: 'medal_ceremony',
          name: 'Awards Ceremony',
          description: 'Honor the champions and participants',
          cost: 200,
          reward: '+30% overall happiness boost',
          duration: 1
        }
      ]
    },
    {
      id: 'halloween_spooktacular',
      name: 'Halloween Spooktacular',
      type: 'holiday',
      description: 'Ghosts, goblins, and treats! Transform your neighborhood into a spooky wonderland!',
      startDay: Math.floor(gameData.day / 90) * 90 + 75,
      endDay: Math.floor(gameData.day / 90) * 90 + 80,
      icon: <Crown className="text-purple-500" size={24} />,
      rewards: {
        coins: 666,
        happiness: 15,
        xp: 120,
        items: ['witch_hat', 'magic_cauldron']
      },
      activities: [
        {
          id: 'costume_contest',
          name: 'Costume Contest',
          description: 'Residents compete for the best Halloween costume',
          cost: 250,
          reward: 'Winner gets special costume item',
          duration: 1
        },
        {
          id: 'haunted_maze',
          name: 'Haunted Maze',
          description: 'Create a spooky maze experience',
          cost: 350,
          reward: '+20% entertainment building income',
          duration: 5
        },
        {
          id: 'trick_or_treat',
          name: 'Trick-or-Treat Night',
          description: 'Organize a safe trick-or-treating event',
          cost: 150,
          reward: 'Unlock candy shop building',
          duration: 1
        }
      ],
      decorations: [
        { id: 'jack_o_lantern', name: 'Jack-o-Lantern', icon: '🎃', effect: 'Spooky ambiance' },
        { id: 'spider_web', name: 'Decorative Spider Web', icon: '🕸️', effect: 'Halloween mood boost' }
      ]
    },
    {
      id: 'winter_wonderland',
      name: 'Winter Wonderland',
      type: 'seasonal',
      description: 'Transform your neighborhood into a magical winter paradise with snow, lights, and holiday cheer!',
      startDay: Math.floor(gameData.day / 90) * 90 + 80,
      endDay: Math.floor(gameData.day / 90) * 90 + 90,
      icon: <Star className="text-blue-500" size={24} />,
      rewards: {
        coins: 1000,
        happiness: 30,
        xp: 200,
        items: ['santa_hat', 'snow_globe']
      },
      requirements: {
        level: 5
      },
      activities: [
        {
          id: 'ice_rink',
          name: 'Community Ice Rink',
          description: 'Build and maintain an outdoor ice skating rink',
          cost: 600,
          reward: 'Permanent winter recreation bonus',
          duration: 7
        },
        {
          id: 'light_display',
          name: 'Holiday Light Display',
          description: 'Create a spectacular light show',
          cost: 400,
          reward: '+10% energy efficiency bonus',
          duration: 10
        },
        {
          id: 'gift_exchange',
          name: 'Neighborhood Gift Exchange',
          description: 'Organize a community gift swap',
          cost: 300,
          reward: 'Random rare item for participants',
          duration: 1
        }
      ],
      decorations: [
        { id: 'snowman', name: 'Friendly Snowman', icon: '⛄', effect: 'Winter cheer' },
        { id: 'holiday_lights', name: 'Twinkling Lights', icon: '✨', effect: '+8% happiness at night' }
      ]
    },
    {
      id: 'community_day',
      name: 'Community Appreciation Day',
      type: 'community',
      description: 'A special day to celebrate the bonds that make your neighborhood great!',
      startDay: gameData.day + 14,
      endDay: gameData.day + 16,
      icon: <Heart className="text-pink-500" size={24} />,
      rewards: {
        coins: 300,
        happiness: 40,
        xp: 80,
        items: ['community_badge']
      },
      activities: [
        {
          id: 'potluck',
          name: 'Community Potluck',
          description: 'Everyone brings their favorite dish to share',
          cost: 100,
          reward: '+20% resident satisfaction',
          duration: 1
        },
        {
          id: 'talent_show',
          name: 'Neighborhood Talent Show',
          description: 'Showcase resident talents and skills',
          cost: 150,
          reward: 'Discover hidden resident abilities',
          duration: 1
        },
        {
          id: 'memory_wall',
          name: 'Community Memory Wall',
          description: 'Create a wall of neighborhood memories',
          cost: 50,
          reward: 'Permanent happiness boost',
          duration: 2
        }
      ]
    }
  ];
  
  const checkForActiveEvents = () => {
    const active = specialEvents.filter(event => 
      gameData.day >= event.startDay && gameData.day <= event.endDay
    );
    setActiveEvents(active);
    
    if (active.length > 0 && !selectedEvent) {
      setSelectedEvent(active[0]);
    }
  };
  
  const canParticipateInEvent = (event: SpecialEvent) => {
    if (!event.requirements) return true;
    
    const req = event.requirements;
    if (req.residents && neighbors.filter(n => n.hasHome).length < req.residents) return false;
    if (req.happiness && gameData.happiness < req.happiness) return false;
    if (req.level && gameData.level < req.level) return false;
    if (req.buildings) {
      for (const buildingType of req.buildings) {
        if (!grid.some(building => building?.id === buildingType)) return false;
      }
    }
    
    return true;
  };
  
  const renderEventCard = (event: SpecialEvent) => {
    const isActive = gameData.day >= event.startDay && gameData.day <= event.endDay;
    const canParticipate = canParticipateInEvent(event);
    const daysLeft = event.endDay - gameData.day;
    
    return (
      <motion.div
        key={event.id}
        whileHover={{ scale: 1.02 }}
        onClick={() => setSelectedEvent(event)}
        className={`p-4 rounded-lg border cursor-pointer ${
          selectedEvent?.id === event.id
            ? 'border-emerald-500 bg-emerald-50'
            : isActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-3 mb-2">
          {event.icon}
          <div>
            <h3 className="font-medium text-gray-800">{event.name}</h3>
            <p className="text-sm text-gray-600">
              {isActive ? `Active - ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left` : `Starts day ${event.startDay}`}
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-2">{event.description}</p>
        
        {event.requirements && !canParticipate && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            Requirements not met
          </div>
        )}
      </motion.div>
    );
  };
  
  const renderEventDetails = () => {
    if (!selectedEvent) return null;
    
    const isActive = gameData.day >= selectedEvent.startDay && gameData.day <= selectedEvent.endDay;
    const canParticipate = canParticipateInEvent(selectedEvent);
    
    return (
      <div className="flex-1 overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4">
          <div className="flex items-center gap-3">
            {selectedEvent.icon}
            <div>
              <h2 className="text-xl font-medium text-gray-800">{selectedEvent.name}</h2>
              <p className="text-sm text-gray-600">{selectedEvent.description}</p>
            </div>
          </div>
        </div>
        
        <div className="p-4 space-y-6">
          {selectedEvent.requirements && (
            <div>
              <h3 className="font-medium text-gray-800 mb-2">Requirements:</h3>
              <div className="space-y-1 text-sm">
                {selectedEvent.requirements.residents && (
                  <div className={neighbors.filter(n => n.hasHome).length >= selectedEvent.requirements.residents ? 'text-green-600' : 'text-red-600'}>
                    • At least {selectedEvent.requirements.residents} residents
                  </div>
                )}
                {selectedEvent.requirements.happiness && (
                  <div className={gameData.happiness >= selectedEvent.requirements.happiness ? 'text-green-600' : 'text-red-600'}>
                    • {selectedEvent.requirements.happiness}% neighborhood happiness
                  </div>
                )}
                {selectedEvent.requirements.level && (
                  <div className={gameData.level >= selectedEvent.requirements.level ? 'text-green-600' : 'text-red-600'}>
                    • Level {selectedEvent.requirements.level} or higher
                  </div>
                )}
              </div>
            </div>
          )}
          
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Activities:</h3>
            <div className="grid gap-3">
              {selectedEvent.activities.map(activity => (
                <div key={activity.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-medium text-gray-700">{activity.name}</h4>
                      <p className="text-sm text-gray-600">{activity.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium">{activity.cost}c</div>
                      <div className="text-xs text-gray-500">{activity.duration} day{activity.duration !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                  <div className="text-sm text-emerald-600 mb-2">Reward: {activity.reward}</div>
                  <button
                    onClick={() => onParticipate(selectedEvent.id, activity.id)}
                    disabled={!isActive || !canParticipate || gameData.coins < activity.cost}
                    className={`w-full py-1 px-3 rounded text-sm ${
                      isActive && canParticipate && gameData.coins >= activity.cost
                        ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    {!isActive ? 'Event not active' : !canParticipate ? 'Requirements not met' : gameData.coins < activity.cost ? 'Cannot afford' : 'Participate'}
                  </button>
                </div>
              ))}
            </div>
          </div>
          
          {selectedEvent.decorations && (
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Special Decorations:</h3>
              <div className="grid grid-cols-2 gap-3">
                {selectedEvent.decorations.map(decoration => (
                  <div key={decoration.id} className="bg-gray-50 p-3 rounded">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{decoration.icon}</span>
                      <span className="text-sm font-medium">{decoration.name}</span>
                    </div>
                    <div className="text-xs text-gray-600">{decoration.effect}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Event Rewards:</h3>
            <div className="bg-emerald-50 p-3 rounded-lg">
              <div className="flex flex-wrap gap-4">
                {selectedEvent.rewards.coins && (
                  <div className="flex items-center gap-1">
                    <Coins size={16} className="text-yellow-600" />
                    <span>{selectedEvent.rewards.coins} coins</span>
                  </div>
                )}
                {selectedEvent.rewards.happiness && (
                  <div className="flex items-center gap-1">
                    <Heart size={16} className="text-pink-600" />
                    <span>+{selectedEvent.rewards.happiness}% happiness</span>
                  </div>
                )}
                {selectedEvent.rewards.xp && (
                  <div className="flex items-center gap-1">
                    <Star size={16} className="text-blue-600" />
                    <span>{selectedEvent.rewards.xp} XP</span>
                  </div>
                )}
              </div>
              {selectedEvent.rewards.items && selectedEvent.rewards.items.length > 0 && (
                <div className="mt-2 text-sm text-gray-600">
                  Special items: {selectedEvent.rewards.items.join(', ')}
                </div>
              )}
            </div>
          </div>
          
          {isActive && canParticipate && (
            <button
              onClick={() => onClaimReward(selectedEvent.id)}
              className="w-full py-2 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600"
            >
              Claim Event Rewards
            </button>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backdropFilter: "blur(8px)", backgroundColor: "rgba(0,0,0,0.3)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        transition={{ type: "spring", damping: 20 }}
        className="bg-white rounded-xl shadow-xl max-w-5xl w-full max-h-[80vh] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-600 text-white flex justify-between items-center">
          <div className="flex items-center gap-3">
            <Calendar size={24} />
            <h1 className="text-lg font-medium lowercase">special events</h1>
          </div>
          <button 
            onClick={onClose}
            className="text-white/80 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        <div className="flex h-[calc(80vh-60px)]">
          <div className="w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-sm font-medium text-gray-700 mb-3">Available Events</h2>
              <div className="space-y-3">
                {activeEvents.map(event => renderEventCard(event))}
              </div>
              
              <h2 className="text-sm font-medium text-gray-700 mb-3 mt-6">Upcoming Events</h2>
              <div className="space-y-3">
                {specialEvents
                  .filter(event => event.startDay > gameData.day)
                  .slice(0, 3)
                  .map(event => renderEventCard(event))}
              </div>
            </div>
          </div>
          
          {selectedEvent ? renderEventDetails() : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Select an event to view details
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}