import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Gift, Trophy, Star, Crown, Sparkles, Heart, Coins, PartyPopper } from "lucide-react";
import type { GameProgress, Neighbor, Building } from "../../types/game";

export type SpecialEvent = {
  id: string;
  name: string;
  type: 'seasonal' | 'holiday' | 'celebration' | 'achievement' | 'community' | 'surprise';
  description: string;
  startDay: number;
  endDay: number;
  icon: React.ReactNode;
  rewards: {
    coins?: number;
    happiness?: number;
    xp?: number;
    items?: string[];
    unlocks?: string[];
  };
  requirements?: {
    buildings?: string[];
    residents?: number;
    happiness?: number;
    level?: number;
    coins?: number;
  };
  activities: {
    id: string;
    name: string;
    description: string;
    cost: number;
    reward: string;
    duration: number;
    impact?: {
      happiness?: number;
      experience?: number;
      coins?: number;
    };
  }[];
  decorations?: {
    id: string;
    name: string;
    icon: string;
    effect: string;
    duration?: number;
  }[];
  specialOffers?: {
    id: string;
    name: string;
    description: string;
    originalPrice: number;
    salePrice: number;
    quantity: number;
  }[];
};

type ActiveEventEffect = {
  eventId: string;
  effectType: 'happiness' | 'income' | 'cost_reduction' | 'xp_multiplier';
  value: number;
  duration: number;
  startDay: number;
};

type SpecialEventsManagerProps = {
  gameData: GameProgress;
  neighbors: Neighbor[];
  grid: (Building | null)[];
  onClose: () => void;
  onParticipate: (eventId: string, activityId: string) => void;
  onClaimReward: (eventId: string) => void;
  onUpdateGameState: (updates: Partial<GameProgress>) => void;
};

export default function SpecialEventsManager({ 
  gameData, 
  neighbors, 
  grid, 
  onClose, 
  onParticipate, 
  onClaimReward,
  onUpdateGameState
}: SpecialEventsManagerProps) {
  const [activeEvents, setActiveEvents] = useState<SpecialEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<SpecialEvent | null>(null);
  const [participatedActivities, setParticipatedActivities] = useState<Set<string>>(new Set());
  const [activeEffects, setActiveEffects] = useState<ActiveEventEffect[]>([]);
  const [eventNotifications, setEventNotifications] = useState<Array<{
    id: string;
    message: string;
    type: 'new' | 'ending' | 'reward';
  }>>([]);

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
        items: ['spring_crown', 'flower_seeds'],
        unlocks: ['garden_path_decoration']
      },
      activities: [
        {
          id: 'plant_flowers',
          name: 'Plant Community Flowers',
          description: 'Create beautiful flower gardens throughout the neighborhood',
          cost: 200,
          reward: '+10% park happiness for 7 days',
          duration: 1,
          impact: { happiness: 5, experience: 25 }
        },
        {
          id: 'spring_concert',
          name: 'Spring Concert',
          description: 'Host an outdoor music festival',
          cost: 300,
          reward: '+15% music venue income for 5 days',
          duration: 1,
          impact: { happiness: 8, coins: 100, experience: 30 }
        },
        {
          id: 'art_contest',
          name: 'Spring Art Contest',
          description: 'Let residents showcase their artistic talents',
          cost: 150,
          reward: 'Unlock special art decorations',
          duration: 3,
          impact: { happiness: 10, experience: 40 }
        }
      ],
      decorations: [
        { id: 'cherry_blossom', name: 'Cherry Blossom Tree', icon: '🌸', effect: '+5% happiness nearby', duration: 30 },
        { id: 'flower_bed', name: 'Colorful Flower Bed', icon: '🌺', effect: '+3% income to adjacent buildings', duration: 20 }
      ],
      specialOffers: [
        { id: 'spring_bundle', name: 'Spring Starter Pack', description: '3 flower decorations + garden path', originalPrice: 500, salePrice: 300, quantity: 1 }
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
        items: ['gold_medal', 'sports_trophy'],
        unlocks: ['olympic_podium', 'sports_field']
      },
      requirements: {
        residents: 10,
        happiness: 70,
        buildings: ['park']
      },
      activities: [
        {
          id: 'track_events',
          name: 'Track & Field Events',
          description: 'Organize running, jumping, and throwing competitions',
          cost: 400,
          reward: '+25% resident happiness for winners',
          duration: 2,
          impact: { happiness: 15, experience: 50 }
        },
        {
          id: 'team_sports',
          name: 'Team Sports Tournament',
          description: 'Create neighborhood teams for various sports',
          cost: 500,
          reward: 'Strengthen community bonds',
          duration: 3,
          impact: { happiness: 20, experience: 60, coins: 200 }
        },
        {
          id: 'medal_ceremony',
          name: 'Awards Ceremony',
          description: 'Honor the champions and participants',
          cost: 200,
          reward: '+30% overall happiness boost',
          duration: 1,
          impact: { happiness: 30, experience: 75 }
        }
      ],
      decorations: [
        { id: 'olympic_rings', name: 'Olympic Rings', icon: '🏅', effect: '+10% XP gain', duration: 15 },
        { id: 'sports_banner', name: 'Sports Banners', icon: '🚩', effect: '+5% resident satisfaction', duration: 20 }
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
        items: ['witch_hat', 'magic_cauldron'],
        unlocks: ['haunted_mansion', 'pumpkin_patch']
      },
      activities: [
        {
          id: 'costume_contest',
          name: 'Costume Contest',
          description: 'Residents compete for the best Halloween costume',
          cost: 250,
          reward: 'Winner gets special costume item',
          duration: 1,
          impact: { happiness: 12, experience: 40 }
        },
        {
          id: 'haunted_maze',
          name: 'Haunted Maze',
          description: 'Create a spooky maze experience',
          cost: 350,
          reward: '+20% entertainment building income',
          duration: 5,
          impact: { coins: 150, experience: 45 }
        },
        {
          id: 'trick_or_treat',
          name: 'Trick-or-Treat Night',
          description: 'Organize a safe trick-or-treating event',
          cost: 150,
          reward: 'Unlock candy shop building',
          duration: 1,
          impact: { happiness: 15, experience: 35 }
        }
      ],
      decorations: [
        { id: 'jack_o_lantern', name: 'Jack-o-Lantern', icon: '🎃', effect: 'Spooky ambiance +5% income', duration: 10 },
        { id: 'spider_web', name: 'Decorative Spider Web', icon: '🕸️', effect: 'Halloween mood boost +3% happiness', duration: 8 }
      ],
      specialOffers: [
        { id: 'spooky_bundle', name: 'Haunted House Bundle', description: 'Spooky decorations + haunted mansion', originalPrice: 1000, salePrice: 666, quantity: 1 }
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
        items: ['santa_hat', 'snow_globe'],
        unlocks: ['ice_rink', 'christmas_tree']
      },
      requirements: {
        level: 5,
        buildings: ['park', 'music_venue']
      },
      activities: [
        {
          id: 'ice_rink',
          name: 'Community Ice Rink',
          description: 'Build and maintain an outdoor ice skating rink',
          cost: 600,
          reward: 'Permanent winter recreation bonus',
          duration: 7,
          impact: { happiness: 20, experience: 70, coins: 300 }
        },
        {
          id: 'light_display',
          name: 'Holiday Light Display',
          description: 'Create a spectacular light show',
          cost: 400,
          reward: '+10% energy efficiency bonus',
          duration: 10,
          impact: { happiness: 15, experience: 50 }
        },
        {
          id: 'gift_exchange',
          name: 'Neighborhood Gift Exchange',
          description: 'Organize a community gift swap',
          cost: 300,
          reward: 'Random rare item for participants',
          duration: 1,
          impact: { happiness: 25, experience: 60 }
        }
      ],
      decorations: [
        { id: 'snowman', name: 'Friendly Snowman', icon: '⛄', effect: 'Winter cheer +8% happiness', duration: 20 },
        { id: 'holiday_lights', name: 'Twinkling Lights', icon: '✨', effect: '+10% night income', duration: 25 }
      ],
      specialOffers: [
        { id: 'winter_bundle', name: 'Winter Holiday Pack', description: 'All winter decorations + ice rink', originalPrice: 1500, salePrice: 1000, quantity: 1 }
      ]
    },
    {
      id: 'community_day',
      name: 'Community Appreciation Day',
      type: 'community',
      description: 'A special day to celebrate the bonds that make your neighborhood great!',
      startDay: gameData.day + Math.floor(Math.random() * 10) + 5,
      endDay: gameData.day + Math.floor(Math.random() * 10) + 7,
      icon: <Heart className="text-pink-500" size={24} />,
      rewards: {
        coins: 300,
        happiness: 40,
        xp: 80,
        items: ['community_badge', 'thank_you_card']
      },
      activities: [
        {
          id: 'potluck',
          name: 'Community Potluck',
          description: 'Everyone brings their favorite dish to share',
          cost: 100,
          reward: '+20% resident satisfaction',
          duration: 1,
          impact: { happiness: 15, experience: 30 }
        },
        {
          id: 'talent_show',
          name: 'Neighborhood Talent Show',
          description: 'Showcase resident talents and skills',
          cost: 150,
          reward: 'Discover hidden resident abilities',
          duration: 1,
          impact: { happiness: 18, experience: 35 }
        },
        {
          id: 'memory_wall',
          name: 'Community Memory Wall',
          description: 'Create a wall of neighborhood memories',
          cost: 50,
          reward: 'Permanent happiness boost',
          duration: 2,
          impact: { happiness: 25, experience: 40 }
        }
      ]
    },
    {
      id: 'builders_festival',
      name: 'Builders\' Festival',
      type: 'surprise',
      description: 'A surprise event for master builders! All construction costs reduced and special buildings available.',
      startDay: gameData.day + Math.floor(Math.random() * 20) + 10,
      endDay: gameData.day + Math.floor(Math.random() * 20) + 15,
      icon: <PartyPopper className="text-orange-500" size={24} />,
      rewards: {
        coins: 400,
        happiness: 15,
        xp: 120,
        unlocks: ['ancient_pyramid', 'modern_skyscraper']
      },
      requirements: {
        buildings: ['house', 'apartment', 'cafe', 'library'],
        level: 8
      },
      activities: [
        {
          id: 'blueprint_contest',
          name: 'Blueprint Design Contest',
          description: 'Design the next iconic neighborhood building',
          cost: 200,
          reward: 'Win custom building design',
          duration: 3,
          impact: { experience: 80, coins: 150 }
        },
        {
          id: 'speed_build',
          name: 'Speed Building Challenge',
          description: 'Build structures in record time',
          cost: 300,
          reward: '24h 50% construction discount',
          duration: 1,
          impact: { experience: 60 }
        }
      ],
      specialOffers: [
        { id: 'builder_bundle', name: 'Master Builder Tools', description: 'Premium tools for faster building', originalPrice: 800, salePrice: 400, quantity: 1 }
      ]
    }
  ];

  useEffect(() => {
    checkForActiveEvents();
    updateEventEffects();
  }, [gameData.day]);

  useEffect(() => {
    checkForEventNotifications();
  }, [activeEvents]);

  const checkForActiveEvents = () => {
    const active = specialEvents.filter(event => 
      gameData.day >= event.startDay && gameData.day <= event.endDay
    );
    
    const future = specialEvents.filter(event =>
      gameData.day < event.startDay && gameData.day >= event.startDay - 7
    );
    
    setActiveEvents([...active, ...future]);
    
    if (active.length > 0 && !selectedEvent) {
      setSelectedEvent(active[0]);
    }
  };

  const checkForEventNotifications = () => {
    const newNotifications: Array<{
      id: string;
      message: string;
      type: 'new' | 'ending' | 'reward';
    }> = [];

    activeEvents.forEach(event => {
      if (gameData.day === event.startDay) {
        newNotifications.push({
          id: `${event.id}_start`,
          message: `${event.name} has begun! 🎉`,
          type: 'new'
        });
      }
      
      if (gameData.day === event.endDay - 1) {
        newNotifications.push({
          id: `${event.id}_ending`,
          message: `${event.name} ends tomorrow! Don't miss out!`,
          type: 'ending'
        });
      }
    });

    setEventNotifications(newNotifications);
  };

  const updateEventEffects = () => {
    const updatedEffects = activeEffects.filter(effect => 
      gameData.day < effect.startDay + effect.duration
    );
    setActiveEffects(updatedEffects);
  };

  const canParticipateInEvent = (event: SpecialEvent) => {
    if (!event.requirements) return true;
      const req = event.requirements;
    if (req.residents && neighbors.filter(n => n.hasHome).length < req.residents) return false;
    if (req.level && gameData.level < req.level) return false;
    if (req.coins && gameData.coins < req.coins) return false;
    if (req.buildings) {
      for (const buildingType of req.buildings) {
        if (!grid.some(building => building?.id === buildingType)) return false;
      }
    }
    
    return true;
  };

  const handleParticipateInActivity = (eventId: string, activityId: string) => {
    const event = activeEvents.find(e => e.id === eventId);
    const activity = event?.activities.find(a => a.id === activityId);
    
    if (!event || !activity || gameData.coins < activity.cost) return;
    
    onParticipate(eventId, activityId);
    
    const updates: Partial<GameProgress> = {
      coins: gameData.coins - activity.cost
    };      if (activity.impact) {
        if (activity.impact.experience) {
          updates.experience = gameData.experience + activity.impact.experience;
        }
        if (activity.impact.coins) {
          updates.coins = (updates.coins || gameData.coins) + activity.impact.coins;
        }
    }
    
    onUpdateGameState(updates);
    
    setParticipatedActivities(prev => new Set([...prev, `${eventId}_${activityId}`]));
    
    if (activity.reward.includes('happiness') || activity.reward.includes('income') || activity.reward.includes('discount')) {
      const effect: ActiveEventEffect = {
        eventId,
        effectType: activity.reward.includes('happiness') ? 'happiness' :
                   activity.reward.includes('income') ? 'income' :
                   activity.reward.includes('discount') ? 'cost_reduction' : 'xp_multiplier',
        value: parseInt(activity.reward.match(/\d+/)?.[0] || '10'),
        duration: activity.duration || 7,
        startDay: gameData.day
      };
      
      setActiveEffects(prev => [...prev, effect]);
    }
  };

  const renderEventCard = (event: SpecialEvent) => {
    const isActive = gameData.day >= event.startDay && gameData.day <= event.endDay;
    const canParticipate = canParticipateInEvent(event);
    const daysLeft = event.endDay - gameData.day;
    const daysUntil = event.startDay - gameData.day;
    
    return (
      <motion.div
        key={event.id}
        whileHover={{ scale: 1.02 }}
        onClick={() => setSelectedEvent(event)}
        className={`p-4 rounded-lg border cursor-pointer shadow-md ${
          selectedEvent?.id === event.id
            ? 'border-emerald-500 bg-emerald-50'
            : isActive
            ? 'border-blue-500 bg-blue-50'
            : daysUntil <= 7
            ? 'border-yellow-500 bg-yellow-50'
            : 'border-gray-300 bg-gray-50'
        }`}
      >
        <div className="flex items-center gap-3 mb-2">
          {event.icon}
          <div>
            <h3 className="font-medium text-gray-800">{event.name}</h3>
            <p className="text-sm text-gray-600">
              {isActive 
                ? `Active - ${daysLeft} day${daysLeft !== 1 ? 's' : ''} left` 
                : daysUntil > 0
                ? `Starts in ${daysUntil} day${daysUntil !== 1 ? 's' : ''}`
                : `Starts on day ${event.startDay}`
              }
            </p>
          </div>
        </div>
        <p className="text-sm text-gray-700 mb-2">{event.description}</p>
        
        {event.requirements && !canParticipate && (
          <div className="text-xs text-red-600 bg-red-50 p-2 rounded">
            Requirements not met
          </div>
        )}
        
        {isActive && canParticipate && (
          <div className="text-xs text-emerald-600 bg-emerald-50 p-2 rounded">
            Participate now!
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
        <div className="sticky top-0 bg-white border-b border-gray-200 p-4 z-10">
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
                  </div>                )}
                {selectedEvent.requirements.level && (
                  <div className={gameData.level >= selectedEvent.requirements.level ? 'text-green-600' : 'text-red-600'}>
                    • Level {selectedEvent.requirements.level} or higher
                  </div>
                )}
                {selectedEvent.requirements.buildings && (
                  <div>
                    • Required buildings: {selectedEvent.requirements.buildings.map(b => 
                      <span key={b} className={grid.some(building => building?.id === b) ? 'text-green-600' : 'text-red-600'}>
                        {b}
                      </span>
                    ).reduce((prev, curr, i) => i === 0 ? [curr] : [...prev, ', ', curr], [])}
                  </div>
                )}
              </div>
            </div>
          )}
          
          {selectedEvent.specialOffers && selectedEvent.specialOffers.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Special Offers:</h3>
              <div className="space-y-2">
                {selectedEvent.specialOffers.map(offer => (
                  <div key={offer.id} className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <h4 className="font-medium text-gray-700">{offer.name}</h4>
                        <p className="text-sm text-gray-600">{offer.description}</p>
                      </div>
                      <div className="text-right">
                        <div className="text-sm line-through text-gray-400">{offer.originalPrice} coins</div>
                        <div className="text-lg font-bold text-orange-600">{offer.salePrice} coins</div>
                      </div>
                    </div>
                    <button
                      onClick={() => handlePurchaseSpecialOffer(offer)}
                      disabled={gameData.coins < offer.salePrice}
                      className={`mt-2 w-full py-1 px-3 rounded text-sm ${
                        gameData.coins >= offer.salePrice
                          ? 'bg-orange-500 text-white hover:bg-orange-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      Buy Now - Save {offer.originalPrice - offer.salePrice} coins!
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Activities:</h3>
            <div className="space-y-3">
              {selectedEvent.activities.map(activity => {
                const hasParticipated = participatedActivities.has(`${selectedEvent.id}_${activity.id}`);
                
                return (
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
                      onClick={() => handleParticipateInActivity(selectedEvent.id, activity.id)}
                      disabled={!isActive || !canParticipate || gameData.coins < activity.cost || hasParticipated}
                      className={`w-full py-1 px-3 rounded text-sm ${
                        hasParticipated ? 'bg-green-100 text-green-700' :
                        isActive && canParticipate && gameData.coins >= activity.cost
                          ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                          : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      }`}
                    >
                      {hasParticipated ? 'Completed ✓' :
                       !isActive ? 'Event not active' : 
                       !canParticipate ? 'Requirements not met' : 
                       gameData.coins < activity.cost ? 'Cannot afford' : 'Participate'}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
          
          {selectedEvent.decorations && (
            <div>
              <h3 className="font-medium text-gray-800 mb-3">Event Decorations:</h3>
              <div className="grid grid-cols-2 gap-3">
                {selectedEvent.decorations.map(decoration => (
                  <div key={decoration.id} className="bg-gradient-to-br from-purple-50 to-pink-50 p-3 rounded border border-purple-200">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">{decoration.icon}</span>
                      <span className="text-sm font-medium">{decoration.name}</span>
                    </div>
                    <div className="text-xs text-gray-600">{decoration.effect}</div>
                    {decoration.duration && (
                      <div className="text-xs text-purple-600 mt-1">Lasts {decoration.duration} days</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div>
            <h3 className="font-medium text-gray-800 mb-3">Event Rewards:</h3>
            <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-4 rounded-lg border border-emerald-200">
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
              {selectedEvent.rewards.unlocks && selectedEvent.rewards.unlocks.length > 0 && (
                <div className="mt-2 text-sm text-purple-600">
                  Unlocks: {selectedEvent.rewards.unlocks.join(', ')}
                </div>
              )}
            </div>
          </div>
          
          {isActive && canParticipate && (
            <div className="sticky bottom-0 bg-white p-4 border-t border-gray-200">
              <button
                onClick={() => onClaimReward(selectedEvent.id)}
                className="w-full py-2 bg-gradient-to-r from-emerald-500 to-teal-600 text-white rounded-lg hover:from-emerald-600 hover:to-teal-700 font-medium shadow-md"
              >
                Participate in {selectedEvent.name}
              </button>
            </div>
          )}
        </div>
      </div>
    );
  };

  const handlePurchaseSpecialOffer = (offer: {
    id: string;
    name: string;
    description: string;
    originalPrice: number;
    salePrice: number;
    quantity: number;
  }) => {
    if (gameData.coins >= offer.salePrice) {
      onUpdateGameState({ 
        coins: gameData.coins - offer.salePrice
      });
      
      setEventNotifications(prev => [...prev, {
        id: `purchase_${offer.id}`,
        message: `Purchased ${offer.name}!`,
        type: 'reward'
      }]);
    }
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
        className="bg-white rounded-xl shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden"
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
        
        <div className="flex h-[calc(90vh-60px)]">
          <div className="w-80 border-r border-gray-200 bg-gray-50 overflow-y-auto">
            <div className="p-4">
              <h2 className="text-sm font-medium text-gray-700 mb-3">Available Events</h2>
              <div className="space-y-3">
                {activeEvents.map(event => renderEventCard(event))}
              </div>
              
              {activeEffects.length > 0 && (
                <div className="mt-6">
                  <h2 className="text-sm font-medium text-gray-700 mb-3">Active Event Effects</h2>
                  <div className="space-y-2">
                    {activeEffects.map((effect, index) => (
                      <div key={index} className="bg-white p-2 rounded border border-gray-200">
                        <div className="text-xs font-medium text-gray-700">
                          {effect.effectType === 'happiness' ? '😊' :
                           effect.effectType === 'income' ? '💰' :
                           effect.effectType === 'cost_reduction' ? '🏷️' : '⭐'} 
                          {' '}
                          {effect.value}% {effect.effectType.replace('_', ' ')}
                        </div>
                        <div className="text-xs text-gray-500">
                          {effect.startDay + effect.duration - gameData.day} days remaining
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
          
          {selectedEvent ? renderEventDetails() : (
            <div className="flex-1 flex items-center justify-center text-gray-400">
              Select an event to view details
            </div>
          )}
        </div>
      </motion.div>
      
      {eventNotifications.length > 0 && (
        <div className="fixed top-24 right-6 space-y-2 z-50">
          {eventNotifications.map(notification => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              className={`p-3 rounded-lg shadow-lg text-white ${
                notification.type === 'new' ? 'bg-green-500' :
                notification.type === 'ending' ? 'bg-orange-500' :
                'bg-blue-500'
              }`}
            >
              {notification.message}
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  );
}