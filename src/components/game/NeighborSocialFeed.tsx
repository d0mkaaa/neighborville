import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, Heart, Frown, Home, Zap, Droplets, ChevronUp, ChevronDown, 
  MessageCircle, ThumbsUp, AlertTriangle, Coffee, Music, TreePine,
  Building, Users, Clock, MapPin, Star, Flame, TrendingUp, Bell,
  Wrench, Shield, Sparkles, Sun, CloudRain, Snowflake, CloudLightning,
  Cloud, Wind
} from "lucide-react";
import type { Neighbor, Building as BuildingType } from "../../types/game";

type SocialPost = {
  id: string;
  neighborId: string | number;
  message: string;
  time: string;
  type: 'complaint' | 'praise' | 'observation' | 'concern' | 'announcement' | 'event' | 'help' | 'trending';
  icon?: React.ReactNode;
  likes: number;
  replies: number;
  timestamp: number;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  tags: string[];
  location?: string;
  buildingType?: string;
  weatherRelated?: boolean;
  urgent?: boolean;
  trending?: boolean;
  reactions: {
    likes: number;
    hearts: number;
    angry: number;
    helpful: number;
  };
};

type NeighborSocialFeedProps = {
  neighbors: Neighbor[];
  grid: (BuildingType | null)[];
  onClose: () => void;
  currentDay: number;
  timeOfDay: string;
  weather?: string;
  coins?: number;
  happiness?: number;
  powerGrid?: any;
  waterGrid?: any;
  recentEvents?: any[];
  neighborhoodName: string;
};

export default function NeighborSocialFeed({ 
  neighbors, 
  grid, 
  onClose, 
  currentDay, 
  timeOfDay,
  weather = 'sunny',
  coins = 0,
  happiness = 50,
  powerGrid,
  waterGrid,
  recentEvents = [],
  neighborhoodName
}: NeighborSocialFeedProps) {
  const [posts, setPosts] = useState<SocialPost[]>([]);
  const [filter, setFilter] = useState<string>('all');
  const [isExpanded, setIsExpanded] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [trendingTopics, setTrendingTopics] = useState<string[]>([]);
  const [showEventForm, setShowEventForm] = useState(false);
  const [newEventMessage, setNewEventMessage] = useState('');

  const hasResidents = () => {
    return neighbors.some(neighbor => neighbor.unlocked && neighbor.hasHome);
  };

  const getUtilityInfrastructure = () => {
    const powerPlants = grid.filter(building => 
      building && (building.type === 'power-plant' || building.type === 'solar-panel' || 
                   building.type === 'wind-turbine' || building.produces?.some(p => p.resourceId === 'electricity'))
    );
    
    const waterSources = grid.filter(building => 
      building && (building.type === 'water-treatment' || building.type === 'well' || 
                   building.produces?.some(p => p.resourceId === 'water'))
    );

    return {
      hasPowerInfrastructure: powerPlants.length > 0,
      hasWaterInfrastructure: waterSources.length > 0,
      powerPlants,
      waterSources,
      totalUtilityBuildings: powerPlants.length + waterSources.length
    };
  };

  useEffect(() => {
    if (hasResidents()) {
      generateInitialPosts();
    } else {
      setPosts([{
        id: 'empty-community',
        neighborId: 'system',
        message: `🏘️ Welcome to ${neighborhoodName}! Once residents move in, they'll start sharing updates here.`,
        time: formatTimeAgo(Date.now()),
        type: 'announcement',
        icon: <Bell size={16} className="text-blue-500" />,
        likes: 0,
        replies: 0,
        timestamp: Date.now(),
        priority: 'low',
        tags: ['welcome', 'community'],
        reactions: { likes: 0, hearts: 0, angry: 0, helpful: 0 }
      }]);
    }
  }, [neighbors, neighborhoodName]);

  useEffect(() => {
    if (!hasResidents()) return;

    const interval = setInterval(() => {
      const shouldGenerate = Math.random() < 0.3;
      if (shouldGenerate) {
        generateContextualPost();
      }
    }, 45000);

    return () => clearInterval(interval);
  }, [neighbors, grid, currentDay, timeOfDay, weather, happiness, powerGrid, waterGrid]);

  useEffect(() => {
    if (!hasResidents()) return;

    const eventInterval = setInterval(() => {
      if (Math.random() < 0.15) {
        generateEventPost();
      }
    }, 120000);

    return () => clearInterval(eventInterval);
  }, [grid, neighbors]);

  useEffect(() => {
    if (!hasResidents()) return;

    const announcementInterval = setInterval(() => {
      if (Math.random() < 0.1) {
        generateAnnouncementPost();
      }
    }, 180000);

    return () => clearInterval(announcementInterval);
  }, [currentDay]);

  useEffect(() => {
    updateTrendingTopics();
  }, [posts]);

  const getExistingBuildingTypes = (): Set<string> => {
    const existingBuildings = new Set<string>();
    grid.forEach(building => {
      if (building && building.type) {
        existingBuildings.add(building.type);
      }
    });
    return existingBuildings;
  };

  const updateTrendingTopics = () => {
    const tagCounts: { [key: string]: number } = {};
    posts.forEach(post => {
      post.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + post.likes + post.replies;
      });
    });
    
    const trending = Object.entries(tagCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 3)
      .map(([tag]) => tag);
    
    setTrendingTopics(trending);
  };

  const generateInitialPosts = () => {
    const initialPosts: SocialPost[] = [];
    
    if (hasResidents()) {
      const starterMessages = [
        {
          message: `Welcome to ${neighborhoodName}'s social feed! 🏘️ Share what's happening around you`,
          type: 'announcement' as const,
          tags: ['welcome', 'community'],
          priority: 'medium' as const
        },
        {
          message: `Great to have everyone here in ${neighborhoodName}! Let's build an amazing community together 🤝`,
          type: 'announcement' as const,
          tags: ['community', 'welcome'],
          priority: 'medium' as const
        }
      ];

      starterMessages.forEach((msg, index) => {
        initialPosts.push(createPost('system', msg.message, msg.type, {
          tags: msg.tags,
          priority: msg.priority,
          icon: msg.type === 'announcement' ? <Bell size={16} className="text-blue-500" /> : undefined
        }));
      });
    } else {
      initialPosts.push({
        id: 'empty-community',
        neighborId: 'system',
        message: `🏘️ Welcome to ${neighborhoodName}! Once residents move in, they'll start sharing updates here.`,
        time: formatTimeAgo(Date.now()),
        type: 'announcement',
        icon: <Bell size={16} className="text-blue-500" />,
        likes: 0,
        replies: 0,
        timestamp: Date.now(),
        priority: 'low',
        tags: ['welcome', 'community'],
        reactions: { likes: 0, hearts: 0, angry: 0, helpful: 0 }
      });
    }

    setPosts(initialPosts);
  };

  const generateContextualPost = () => {
    const activeNeighbors = neighbors.filter(n => n.unlocked && n.hasHome);
    if (activeNeighbors.length === 0) return;

    const neighbor = activeNeighbors[Math.floor(Math.random() * activeNeighbors.length)];
    const neighborHappiness = neighbor.satisfaction || 50;
    
    const utilityInfrastructure = getUtilityInfrastructure();
    const utilityStatus = getDetailedUtilityStatus(neighbor, utilityInfrastructure);
    const buildingInfo = getBuildingInfo(neighbor);
    
    let postData = generateSmartPost(neighbor, utilityStatus, buildingInfo, neighborHappiness, utilityInfrastructure);
    
    if (postData) {
      const newPost = createPost(neighbor.id, postData.message, postData.type, {
        icon: postData.icon,
        tags: postData.tags,
        priority: postData.priority,
        location: postData.location,
        buildingType: buildingInfo?.type,
        weatherRelated: postData.weatherRelated,
        urgent: postData.urgent
      });

      setPosts(prev => [newPost, ...prev].slice(0, 25));
      if (!isExpanded) setUnreadCount(prev => prev + 1);
    }
  };

  const getDetailedUtilityStatus = (neighbor: Neighbor, utilityInfrastructure: any) => {
    const house = neighbor.houseIndex !== undefined ? grid[neighbor.houseIndex] : null;
    
    const powerOutage = utilityInfrastructure.hasPowerInfrastructure && 
                       powerGrid?.powerOutages?.some((outage: any) => 
                         outage.affectedBuildings?.includes(neighbor.houseIndex));
    
    const waterShortage = utilityInfrastructure.hasWaterInfrastructure && 
                         waterGrid?.waterShortages?.some((shortage: any) => 
                           shortage.affectedBuildings?.includes(neighbor.houseIndex));

    return {
      hasPower: house?.isConnectedToPower ?? true,
      hasWater: house?.isConnectedToWater ?? true,
      needsPower: house?.needsElectricity ?? false,
      needsWater: house?.needsWater ?? false,
      powerOutage,
      waterShortage,
      overcrowded: house?.occupants && house.occupants.length > (house.residentCapacity || 2)
    };
  };

  const getBuildingInfo = (neighbor: Neighbor) => {
    const house = neighbor.houseIndex !== undefined ? grid[neighbor.houseIndex] : null;
    return house ? {
      type: house.type,
      level: house.level || 1,
      condition: 'good',
      amenities: [],
      nearbyBuildings: getNearbyBuildings(neighbor.houseIndex!)
    } : null;
  };

  const getNearbyBuildings = (index: number): string[] => {
    const nearby: string[] = [];
    const gridSize = Math.sqrt(grid.length);
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    
    for (let r = Math.max(0, row - 2); r <= Math.min(gridSize - 1, row + 2); r++) {
      for (let c = Math.max(0, col - 2); c <= Math.min(gridSize - 1, col + 2); c++) {
        if (r === row && c === col) continue;
        const nearbyIndex = r * gridSize + c;
        const building = grid[nearbyIndex];
        if (building) nearby.push(building.type);
      }
    }
    return nearby;
  };

  const generateSmartPost = (neighbor: Neighbor, utilityStatus: any, buildingInfo: any, happiness: number, utilityInfrastructure: any) => {
    const timeBasedContext = getTimeBasedContext();
    const weatherContext = getWeatherContext();
    
    if (utilityInfrastructure.hasPowerInfrastructure && utilityInfrastructure.hasWaterInfrastructure && 
        utilityStatus.powerOutage && utilityStatus.waterShortage) {
      return {
        message: `Complete blackout AND no water in ${buildingInfo?.type || 'my building'}! This is a crisis! 🚨⚡💧`,
        type: 'complaint' as const,
        icon: <AlertTriangle size={16} className="text-red-600" />,
        tags: ['utilities', 'emergency', 'power', 'water'],
        priority: 'urgent' as const,
        urgent: true,
        location: buildingInfo?.type
      };
    }

    if (utilityInfrastructure.hasPowerInfrastructure && utilityStatus.powerOutage) {
      const messages = [
        `Power's been out for hours in ${buildingInfo?.type || 'my building'}! Anyone else affected? ⚡`,
        `Can't work from home without electricity! This is really impacting my day 💻⚡`,
        `Food in my fridge is going to spoil if power doesn't come back soon! 🥶⚡`,
        `Using candles for light - feels like medieval times! When will power be restored? 🕯️⚡`
      ];
      return {
        message: messages[Math.floor(Math.random() * messages.length)],
        type: 'complaint' as const,
        icon: <Zap size={16} className="text-red-500" />,
        tags: ['power', 'utilities', 'urgent'],
        priority: 'high' as const,
        urgent: true,
        location: buildingInfo?.type
      };
    }

    if (utilityInfrastructure.hasWaterInfrastructure && utilityStatus.waterShortage) {
      const messages = [
        `No water coming from taps in ${buildingInfo?.type || 'my building'}! Anyone know what's up? 💧`,
        `Can't shower or cook without water! This needs to be fixed ASAP 🚿💧`,
        `Buying bottled water is getting expensive... when will water be restored? 💰💧`,
        `Garden is dying without water supply! Plants need attention too 🌱💧`
      ];
      return {
        message: messages[Math.floor(Math.random() * messages.length)],
        type: 'complaint' as const,
        icon: <Droplets size={16} className="text-blue-500" />,
        tags: ['water', 'utilities', 'urgent'],
        priority: 'high' as const,
        urgent: true,
        location: buildingInfo?.type
      };
    }

    if (utilityStatus.overcrowded) {
      return {
        message: `Too many people in ${buildingInfo?.type || 'my building'}! We need more housing options 👥🏠`,
        type: 'concern' as const,
        icon: <Users size={16} className="text-orange-500" />,
        tags: ['housing', 'overcrowding'],
        priority: 'medium' as const,
        location: buildingInfo?.type
      };
    }

    if (happiness < 20) {
      const complaints = [
        `Living conditions are really tough right now... hoping for improvements 😔`,
        `Quality of life could definitely be better. Let's work together to improve things! 📈`,
        `Struggling a bit with daily life here. What can we do to make things better? 🤔`,
        `Missing some amenities in our neighborhood. Any suggestions? 💡`
      ];
      return {
        message: complaints[Math.floor(Math.random() * complaints.length)],
        type: 'concern' as const,
        icon: <Frown size={16} className="text-orange-600" />,
        tags: ['quality-of-life', 'suggestions'],
        priority: 'medium' as const
      };
    }

    if (happiness > 80) {
      const praise = [
        `Absolutely loving life in this neighborhood! Everything's perfect 🌟`,
        `Woke up grateful for this amazing community we've built together! 💚`,
        `All services working great, wonderful neighbors, perfect weather - life is good! ✨`,
        `This place keeps getting better! So proud of our neighborhood 🏆`
      ];
      return {
        message: praise[Math.floor(Math.random() * praise.length)],
        type: 'praise' as const,
        icon: <Heart size={16} className="text-pink-500" />,
        tags: ['happy', 'community', 'grateful'],
        priority: 'low' as const
      };
    }

    const contextPosts = [
      ...timeBasedContext,
      ...weatherContext,
      ...getBuildingContextPosts(buildingInfo),
      ...getNeighborhoodContextPosts()
    ];

    if (contextPosts.length > 0) {
      return contextPosts[Math.floor(Math.random() * contextPosts.length)];
    }

    return null;
  };

  const getTimeBasedContext = () => {
    const posts: any[] = [];
    const existingBuildings = getExistingBuildingTypes();
    
    switch (timeOfDay) {
      case 'morning':
        if (existingBuildings.has('coffee-shop') || existingBuildings.has('cafe')) {
          posts.push({
            message: "Perfect morning for a coffee run! ☕ Anyone know if the café is open?",
            type: 'observation',
            icon: <Coffee size={16} className="text-amber-600" />,
            tags: ['morning', 'coffee', 'local-business'],
            priority: 'low'
          });
        }
        posts.push({
          message: "Early morning jog around the neighborhood - love the fresh air! 🏃‍♀️",
          type: 'observation',
          icon: <Sun size={16} className="text-yellow-500" />,
          tags: ['morning', 'exercise', 'health'],
          priority: 'low'
        });
        break;
      case 'evening':
        if (existingBuildings.has('music-venue') || existingBuildings.has('entertainment')) {
          posts.push({
            message: "Great live music at the venue tonight! 🎵 You can hear it from blocks away",
            type: 'observation',
            icon: <Music size={16} className="text-purple-500" />,
            tags: ['evening', 'music', 'entertainment'],
            priority: 'low'
          });
        }
        posts.push({
          message: "Perfect evening for a walk! The street lights look beautiful ✨",
          type: 'observation',
          icon: <Sparkles size={16} className="text-blue-400" />,
          tags: ['evening', 'walking', 'ambiance'],
          priority: 'low'
        });
        break;
      case 'night':
        if (existingBuildings.has('library')) {
          posts.push({
            message: "Late night study session at the library 📚 Love having quiet spaces available",
            type: 'praise',
            icon: <Clock size={16} className="text-indigo-500" />,
            tags: ['night', 'study', 'library'],
            priority: 'low'
          });
        } else {
          posts.push({
            message: "Quiet night in the neighborhood 🌙 Perfect for relaxing at home",
            type: 'observation',
            icon: <Clock size={16} className="text-indigo-500" />,
            tags: ['night', 'quiet', 'relaxing'],
            priority: 'low'
          });
        }
        break;
    }
    
    return posts;
  };

  const getWeatherContext = () => {
    const posts: any[] = [];
    const existingBuildings = getExistingBuildingTypes();
    
    const getSeason = (day: number): 'spring' | 'summer' | 'autumn' | 'winter' => {
      const dayInYear = day % 365;
      if (dayInYear < 90) return 'spring';
      if (dayInYear < 180) return 'summer';
      if (dayInYear < 270) return 'autumn';
      return 'winter';
    };
    
    const season = getSeason(currentDay);
    
    switch (weather) {
      case 'rainy':
        if (season === 'spring') {
          if (existingBuildings.has('garden') || existingBuildings.has('community-garden')) {
            posts.push({
              message: "Perfect spring rain for the garden! 🌧️🌱 Everything's going to bloom beautifully",
              type: 'observation',
              icon: <CloudRain size={16} className="text-blue-600" />,
              tags: ['weather', 'rain', 'spring', 'garden'],
              priority: 'low',
              weatherRelated: true
            });
          } else {
            posts.push({
              message: "Spring showers bringing fresh air! 🌧️🌸 Love this refreshing weather",
              type: 'observation',
              icon: <CloudRain size={16} className="text-blue-600" />,
              tags: ['weather', 'rain', 'spring'],
              priority: 'low',
              weatherRelated: true
            });
          }
        } else {
          posts.push({
            message: "Steady rain today ☔ Good day to stay cozy indoors",
            type: 'observation',
            icon: <CloudRain size={16} className="text-gray-600" />,
            tags: ['weather', 'rain', 'indoor'],
            priority: 'low',
            weatherRelated: true
          });
        }
        break;
      case 'sunny':
        if (season === 'summer') {
          if (existingBuildings.has('park')) {
            posts.push({
              message: "Perfect summer day! 🌞 The park is definitely the place to be right now",
              type: 'observation',
              icon: <Sun size={16} className="text-yellow-500" />,
              tags: ['weather', 'sunny', 'summer', 'park'],
              priority: 'low',
              weatherRelated: true
            });
          } else {
            posts.push({
              message: "Beautiful summer sunshine! ☀️ Great day for outdoor activities",
              type: 'observation',
              icon: <Sun size={16} className="text-yellow-500" />,
              tags: ['weather', 'sunny', 'summer'],
              priority: 'low',
              weatherRelated: true
            });
          }
        } else if (season === 'winter') {
          posts.push({
            message: "Crisp winter sunshine! ❄️☀️ Cold but bright - perfect for a winter walk",
            type: 'observation',
            icon: <Sun size={16} className="text-yellow-500" />,
            tags: ['weather', 'sunny', 'winter'],
            priority: 'low',
            weatherRelated: true
          });
        } else {
          posts.push({
            message: "Beautiful clear day! 🌞 Perfect weather for being outside",
            type: 'observation',
            icon: <Sun size={16} className="text-yellow-500" />,
            tags: ['weather', 'sunny', 'outdoor'],
            priority: 'low',
            weatherRelated: true
          });
        }
        break;
      case 'stormy':
        posts.push({
          message: "Powerful storm rolling through! ⛈️ Everyone stay safe and indoors",
          type: 'concern',
          icon: <CloudLightning size={16} className="text-purple-600" />,
          tags: ['weather', 'storm', 'safety'],
          priority: 'high',
          weatherRelated: true
        });
        if (existingBuildings.has('library') || existingBuildings.has('coffee-shop')) {
          posts.push({
            message: "Storm outside means perfect reading weather! ⛈️📚 Cozy indoor day",
            type: 'observation',
            icon: <Coffee size={16} className="text-amber-600" />,
            tags: ['weather', 'storm', 'indoor', 'cozy'],
            priority: 'low',
            weatherRelated: true
          });
        }
        break;
      case 'snowy':
        if (season === 'winter') {
          posts.push({
            message: "Winter wonderland outside! ❄️ Stay warm everyone, heating bills are going to be high",
            type: 'concern',
            icon: <Snowflake size={16} className="text-blue-300" />,
            tags: ['weather', 'snow', 'winter', 'heating'],
            priority: 'medium',
            weatherRelated: true
          });
          if (existingBuildings.has('park')) {
            posts.push({
              message: "The park looks absolutely magical in the snow! ❄️🌳 Perfect for winter fun",
              type: 'observation',
              icon: <Snowflake size={16} className="text-blue-300" />,
              tags: ['weather', 'snow', 'park', 'winter'],
              priority: 'low',
              weatherRelated: true
            });
          }
        } else {
          posts.push({
            message: "Unexpected snow! ❄️ This is quite unusual for this time of year",
            type: 'observation',
            icon: <Snowflake size={16} className="text-blue-300" />,
            tags: ['weather', 'snow', 'unusual'],
            priority: 'medium',
            weatherRelated: true
          });
        }
        break;
      case 'cloudy':
        if (season === 'autumn') {
          posts.push({
            message: "Classic autumn clouds ☁️🍂 Perfect weather for a peaceful neighborhood walk",
            type: 'observation',
            icon: <Cloud size={16} className="text-gray-500" />,
            tags: ['weather', 'cloudy', 'autumn', 'walking'],
            priority: 'low',
            weatherRelated: true
          });
        } else {
          posts.push({
            message: "Overcast but comfortable ☁️ Nice mild weather for outdoor activities",
            type: 'observation',
            icon: <Cloud size={16} className="text-gray-500" />,
            tags: ['weather', 'cloudy', 'mild'],
            priority: 'low',
            weatherRelated: true
          });
        }
        break;
    }
    
    return posts;
  };

  const getBuildingContextPosts = (buildingInfo: any) => {
    if (!buildingInfo) return [];
    
    const posts: any[] = [];
    
    if (buildingInfo.nearbyBuildings.includes('coffee-shop')) {
      posts.push({
        message: "Love living next to the coffee shop! ☕ The smell of fresh beans every morning 😍",
        type: 'praise',
        icon: <Coffee size={16} className="text-amber-600" />,
        tags: ['coffee', 'local-business', 'convenience'],
        priority: 'low'
      });
    }
    
    if (buildingInfo.nearbyBuildings.includes('park')) {
      posts.push({
        message: "So lucky to live near the park! 🌳 Great for morning walks and fresh air",
        type: 'praise',
        icon: <TreePine size={16} className="text-green-600" />,
        tags: ['park', 'nature', 'location'],
        priority: 'low'
      });
    }
    
    return posts;
  };

  const getNeighborhoodContextPosts = () => {
    const posts: any[] = [];
    
    const totalBuildings = grid.filter(b => b !== null).length;
    const population = neighbors.filter(n => n.hasHome).length;
    
    if (totalBuildings > 15) {
      posts.push({
        message: `Our neighborhood is really growing! ${totalBuildings} buildings now 🏙️`,
        type: 'observation',
        icon: <Building size={16} className="text-gray-600" />,
        tags: ['growth', 'development', 'community'],
        priority: 'low'
      });
    }
    
    if (population > 10) {
      posts.push({
        message: `${population} residents and counting! We're becoming a real community 👥`,
        type: 'observation',
        icon: <Users size={16} className="text-blue-600" />,
        tags: ['population', 'community', 'growth'],
        priority: 'low'
      });
    }
    
    return posts;
  };

  const generateEventPost = () => {
    const existingBuildings = getExistingBuildingTypes();
    const eventPosts = [];
    
    if (existingBuildings.has('park')) {
      eventPosts.push({
        message: "🎉 Community BBQ this weekend at the park! Bring your appetite!",
        type: 'event',
        icon: <Star size={16} className="text-yellow-500" />,
        tags: ['event', 'community', 'food', 'park'],
        priority: 'medium'
      });
    }
    
    if (existingBuildings.has('library')) {
      eventPosts.push({
        message: "📚 New books arrived at the library! Come check out the latest collection",
        type: 'announcement',
        icon: <Bell size={16} className="text-blue-500" />,
        tags: ['library', 'books', 'announcement'],
        priority: 'low'
      });
    }
    
    if (existingBuildings.has('music-venue') || existingBuildings.has('entertainment')) {
      eventPosts.push({
        message: "🎵 Open mic night at the music venue tomorrow! Showcase your talent",
        type: 'event',
        icon: <Music size={16} className="text-purple-500" />,
        tags: ['music', 'event', 'talent'],
        priority: 'medium'
      });
    }
    
    const residentCount = neighbors.filter(n => n.unlocked && n.hasHome).length;
    
    if (residentCount >= 3) {
      eventPosts.push({
        message: "🏃‍♀️ Morning running group forming! Join us for daily 6am runs",
        type: 'event',
        icon: <Users size={16} className="text-green-500" />,
        tags: ['fitness', 'group', 'morning'],
        priority: 'low'
      });
    }
    
    if (residentCount >= 2) {
      eventPosts.push({
        message: "🤝 Neighborhood meeting tonight at 7pm! Let's discuss community improvements",
        type: 'event',
        icon: <Users size={16} className="text-blue-500" />,
        tags: ['meeting', 'community', 'planning'],
        priority: 'medium'
      });
    }

    if (eventPosts.length === 0) return;

    const eventPost = eventPosts[Math.floor(Math.random() * eventPosts.length)];
    const newPost = createPost('community', eventPost.message, eventPost.type as any, {
      icon: eventPost.icon,
      tags: eventPost.tags,
      priority: eventPost.priority as any
    });

    setPosts(prev => [newPost, ...prev].slice(0, 25));
    if (!isExpanded) setUnreadCount(prev => prev + 1);
  };

  const generateAnnouncementPost = () => {
    const utilityInfrastructure = getUtilityInfrastructure();
    const announcements = [];

    if (utilityInfrastructure.hasPowerInfrastructure) {
      announcements.push({
        message: "🔧 Scheduled maintenance on power grid this Sunday 2-4pm. Brief outages expected.",
        type: 'announcement',
        icon: <Wrench size={16} className="text-orange-500" />,
        tags: ['maintenance', 'power', 'schedule'],
        priority: 'high'
      });
    }

    if (utilityInfrastructure.hasWaterInfrastructure) {
      announcements.push({
        message: "💧 Water quality testing completed - all systems running perfectly! ✅",
        type: 'announcement',
        icon: <Shield size={16} className="text-green-500" />,
        tags: ['water', 'quality', 'safety'],
        priority: 'medium'
      });
    }

    announcements.push(
      {
        message: "🚧 Road improvements planned for next month! Better infrastructure coming",
        type: 'announcement',
        icon: <Building size={16} className="text-blue-500" />,
        tags: ['infrastructure', 'improvement', 'roads'],
        priority: 'medium'
      },
      {
        message: "📋 Community meeting this Friday at 7pm! Your input on neighborhood improvements needed",
        type: 'announcement',
        icon: <Users size={16} className="text-blue-500" />,
        tags: ['community', 'meeting', 'participation'],
        priority: 'medium'
      },
      {
        message: "🌱 Neighborhood beautification project starting! Volunteers welcome to help with planting",
        type: 'announcement',
        icon: <TreePine size={16} className="text-green-500" />,
        tags: ['community', 'environment', 'volunteer'],
        priority: 'low'
      }
    );

    if (announcements.length === 0) return;

    const announcement = announcements[Math.floor(Math.random() * announcements.length)];
    const newPost = createPost('administration', announcement.message, announcement.type as any, {
      icon: announcement.icon,
      tags: announcement.tags,
      priority: announcement.priority as any
    });

    setPosts(prev => [newPost, ...prev].slice(0, 25));
    if (!isExpanded) setUnreadCount(prev => prev + 1);
  };

  const createPost = (neighborId: string | number, message: string, type: SocialPost['type'], options: any = {}): SocialPost => {
    return {
      id: Date.now().toString() + Math.random(),
      neighborId,
      message,
      time: formatTimeAgo(Date.now()),
      type,
      icon: options.icon,
      likes: Math.floor(Math.random() * 8) + 1,
      replies: Math.floor(Math.random() * 3),
      timestamp: Date.now(),
      priority: options.priority || 'low',
      tags: options.tags || [],
      location: options.location,
      buildingType: options.buildingType,
      weatherRelated: options.weatherRelated || false,
      urgent: options.urgent || false,
      trending: options.trending || false,
      reactions: {
        likes: Math.floor(Math.random() * 5),
        hearts: Math.floor(Math.random() * 3),
        angry: type === 'complaint' ? Math.floor(Math.random() * 4) : 0,
        helpful: type === 'help' ? Math.floor(Math.random() * 6) : Math.floor(Math.random() * 2)
      }
    };
  };

  const formatTimeAgo = (timestamp: number) => {
    const diff = Date.now() - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return 'just now';
  };

  const getNeighborAvatar = (neighborId: string | number) => {
    if (neighborId === 'system') return '🤖';
    if (neighborId === 'community') return '🏘️';
    if (neighborId === 'administration') return '🏛️';
    
    const neighbor = neighbors.find(n => n.id === neighborId);
    return neighbor?.avatar || '👤';
  };

  const getNeighborName = (neighborId: string | number) => {
    if (neighborId === 'system') return 'System';
    if (neighborId === 'community') return 'Community Board';
    if (neighborId === 'administration') return 'City Administration';
    
    const neighbor = neighbors.find(n => n.id === neighborId);
    return neighbor?.name || 'Anonymous';
  };

  const handleReaction = (postId: string, reactionType: keyof SocialPost['reactions']) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, reactions: { ...post.reactions, [reactionType]: post.reactions[reactionType] + 1 } }
        : post
    ));
  };

  const getFilteredPosts = () => {
    if (filter === 'all') return posts;
    if (filter === 'urgent') return posts.filter(p => p.urgent || p.priority === 'urgent');
    if (filter === 'trending') return posts.filter(p => trendingTopics.some(topic => p.tags.includes(topic)));
    return posts.filter(p => p.type === filter);
  };

  const getTypeColor = (type: string) => {
    const colors = {
      complaint: 'text-red-500',
      praise: 'text-green-500',
      observation: 'text-blue-500',
      concern: 'text-yellow-500',
      announcement: 'text-purple-500',
      event: 'text-pink-500',
      help: 'text-orange-500',
      trending: 'text-indigo-500'
    };
    return colors[type as keyof typeof colors] || 'text-gray-500';
  };

  const getPriorityBadge = (priority: string, urgent?: boolean) => {
    if (urgent) {
      return <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">🚨 URGENT</span>;
    }
    
    const badges = {
      high: <span className="text-xs bg-orange-100 text-orange-600 px-2 py-0.5 rounded-full">High</span>,
      medium: <span className="text-xs bg-yellow-100 text-yellow-600 px-2 py-0.5 rounded-full">Medium</span>,
      low: null
    };
    return badges[priority as keyof typeof badges];
  };

  if (!isExpanded) {
    return (
      <motion.div
        initial={{ x: -100 }}
        animate={{ x: 0 }}
        className="fixed left-4 top-1/2 transform -translate-y-1/2 z-40"
      >
        <motion.button
          onClick={() => {
            setIsExpanded(true);
            setUnreadCount(0);
          }}
          whileHover={{ scale: 1.05, x: 5 }}
          className="bg-gradient-to-r from-emerald-500 to-blue-500 text-white rounded-r-lg p-3 shadow-lg border-l-4 border-emerald-400 flex items-center gap-2 relative"
        >
          <div className="text-xl">💬</div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium">Neighborhood</span>
            <span className="text-xs opacity-90">Chat</span>
          </div>
          <ChevronUp size={16} />
          {unreadCount > 0 && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold"
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </motion.div>
          )}
          {trendingTopics.length > 0 && (
            <div className="absolute -bottom-2 -right-2">
              <TrendingUp size={12} className="text-yellow-300" />
            </div>
          )}
        </motion.button>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: -400, opacity: 0 }}
      className="fixed left-4 top-1/2 transform -translate-y-1/2 z-40 max-h-[80vh]"
    >
      <div className="bg-white/95 backdrop-blur-lg rounded-xl shadow-2xl border border-white/20 w-96 overflow-hidden">
        <div className="bg-gradient-to-r from-emerald-600 to-blue-600 text-white p-4">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-lg font-bold flex items-center gap-2">
                💬 Neighborhood Chat
          </h2>
              <p className="text-sm text-white/80">
                {posts.length} posts • {neighbors.filter(n => n.hasHome).length} residents
              </p>
            </div>
          <button 
            onClick={() => setIsExpanded(false)}
              className="text-white/80 hover:text-white transition-colors p-1"
            >
              <ChevronDown size={20} />
            </button>
          </div>
          
          {trendingTopics.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-1">
              <span className="text-xs text-white/70">Trending:</span>
              {trendingTopics.map(topic => (
                <span key={topic} className="text-xs bg-white/20 px-2 py-1 rounded-full">
                  #{topic}
                </span>
              ))}
            </div>
          )}
        </div>

        <div className="bg-gray-50 border-b flex overflow-x-auto scrollbar-hide">
          {[
            { id: 'all', label: 'All', icon: '📋' },
            { id: 'urgent', label: 'Urgent', icon: '🚨' },
            { id: 'complaint', label: 'Issues', icon: '⚠️' },
            { id: 'praise', label: 'Good News', icon: '✨' },
            { id: 'event', label: 'Events', icon: '🎉' },
            { id: 'trending', label: 'Trending', icon: '🔥' }
                    ].map(filterOption => (
            <button
              key={filterOption.id}
              onClick={() => setFilter(filterOption.id)}
              className={`px-3 py-2 text-xs font-medium whitespace-nowrap transition-colors ${
                filter === filterOption.id
                  ? 'bg-emerald-100 text-emerald-700 border-b-2 border-emerald-500'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {filterOption.icon} {filterOption.label}
            </button>
          ))}
        </div>
        
        <div className="overflow-y-auto max-h-96 scrollbar-thin scrollbar-thumb-gray-300">
          <AnimatePresence>
            {getFilteredPosts().map(post => (
            <motion.div
              key={post.id}
                initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className={`p-4 border-b border-gray-100 hover:bg-gray-50 transition-colors ${
                  post.urgent ? 'bg-red-50 border-l-4 border-red-400' : ''
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="text-2xl flex-shrink-0">
                    {getNeighborAvatar(post.neighborId)}
                  </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900">
                      {getNeighborName(post.neighborId)}
                    </span>
                        {post.location && (
                          <span className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin size={10} /> {post.location}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {getPriorityBadge(post.priority, post.urgent)}
                        <span>{post.time}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-2 mb-2">
                      {post.icon && <div className="mt-0.5">{post.icon}</div>}
                      <p className="text-sm text-gray-700 leading-relaxed">{post.message}</p>
                  </div>
                    
                    {post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mb-2">
                        {post.tags.slice(0, 3).map(tag => (
                          <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                            #{tag}
                          </span>
                        ))}
                  </div>
                    )}
                    
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <button 
                        onClick={() => handleReaction(post.id, 'likes')}
                        className="flex items-center gap-1 hover:text-red-500 transition-colors"
                      >
                        ❤️ {post.reactions.likes}
                      </button>
                      <button 
                        onClick={() => handleReaction(post.id, 'helpful')}
                        className="flex items-center gap-1 hover:text-blue-500 transition-colors"
                      >
                        👍 {post.reactions.helpful}
                    </button>
                      {post.reactions.angry > 0 && (
                        <span className="flex items-center gap-1 text-orange-500">
                          😠 {post.reactions.angry}
                        </span>
                      )}
                      {post.replies > 0 && (
                        <span className="flex items-center gap-1">
                          <MessageCircle size={12} /> {post.replies}
                        </span>
                      )}
                    </div>
                </div>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
          
          {getFilteredPosts().length === 0 && (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">🤔</div>
              <p className="text-sm">No posts match your filter.</p>
              <p className="text-xs text-gray-400 mt-1">
                Try selecting a different category or check back later!
              </p>
            </div>
          )}
        </div>
        
        <div className="bg-gray-50 p-3 text-center">
          <p className="text-xs text-gray-500">
            💡 Tip: Posts are generated based on your neighborhood's current conditions
          </p>
        </div>
      </div>
    </motion.div>
  );
}