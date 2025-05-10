import type { Neighbor } from "../types/game";

export const neighborProfiles: Neighbor[] = [
  { 
    id: 1, 
    name: 'maya chen', 
    avatar: '👩‍🦱', 
    trait: 'friendly', 
    likes: 'parks', 
    dislikes: 'noise',
    unlocked: true,
    unlockCondition: null,
    hasHome: false,
    dailyRent: 25,
    happiness: 70,
    housingPreference: 'house',
    maxNeighbors: 1
  },
  { 
    id: 2, 
    name: 'johnny sins', 
    avatar: '👨‍🦲', 
    trait: 'creative', 
    likes: 'music venues', 
    dislikes: 'traffic',
    unlocked: true,
    unlockCondition: null,
    hasHome: false,
    dailyRent: 30,
    happiness: 75,
    housingPreference: 'any',
    maxNeighbors: 2
  },
  { 
    id: 3, 
    name: 'raj patel', 
    avatar: '👨', 
    trait: 'bookworm', 
    likes: 'libraries', 
    dislikes: 'pollution',
    unlocked: true,
    unlockCondition: null,
    hasHome: false,
    dailyRent: 20,
    happiness: 65,
    housingPreference: 'house',
    maxNeighbors: 1
  },
  { 
    id: 4, 
    name: 'alex kim', 
    avatar: '👩', 
    trait: 'eco-conscious', 
    likes: 'ev charging', 
    dislikes: 'waste',
    unlocked: false,
    unlockCondition: {
      type: 'building',
      buildingId: 'charging_station',
      count: 2,
      description: 'build 2 ev charging stations'
    },
    hasHome: false,
    dailyRent: 35,
    happiness: 80,
    housingPreference: 'apartment',
    maxNeighbors: 3
  },
  { 
    id: 5, 
    name: 'lucia gomez', 
    avatar: '👩‍🦰', 
    trait: 'social', 
    likes: 'cafés', 
    dislikes: 'isolation',
    unlocked: false,
    unlockCondition: {
      type: 'building',
      buildingId: 'cafe',
      count: 3,
      description: 'build 3 cafés'
    },
    hasHome: false,
    dailyRent: 28,
    happiness: 85,
    housingPreference: 'apartment',
    maxNeighbors: 4
  },
  { 
    id: 6, 
    name: 'noah williams', 
    avatar: '👨‍🦱', 
    trait: 'tech-savvy', 
    likes: 'innovation', 
    dislikes: 'outdated',
    unlocked: false,
    unlockCondition: {
      type: 'level',
      level: 5,
      description: 'reach level 5'
    },
    hasHome: false,
    dailyRent: 40,
    happiness: 90,
    housingPreference: 'any',
    maxNeighbors: 2
  },
  { 
    id: 7, 
    name: 'emma rodriguez', 
    avatar: '👸', 
    trait: 'artistic', 
    likes: 'galleries', 
    dislikes: 'monotony',
    unlocked: false,
    unlockCondition: {
      type: 'happiness',
      level: 90,
      description: 'reach 90% happiness'
    },
    hasHome: false,
    dailyRent: 45,
    happiness: 95,
    housingPreference: 'house',
    maxNeighbors: 1
  },
  { 
    id: 8, 
    name: 'oliver zhang', 
    avatar: '🧔', 
    trait: 'sporty', 
    likes: 'parks', 
    dislikes: 'pollution',
    unlocked: false,
    unlockCondition: {
      type: 'day',
      day: 15,
      description: 'reach day 15'
    },
    hasHome: false,
    dailyRent: 32,
    happiness: 78,
    housingPreference: 'apartment',
    maxNeighbors: 3
  },
  { 
    id: 9, 
    name: 'zara the mysterious', 
    avatar: '🎭', 
    trait: 'enigmatic', 
    likes: 'music venues', 
    dislikes: 'noise',
    unlocked: false,
    unlockCondition: {
      type: 'building',
      buildingId: 'music_venue',
      count: 3,
      description: 'build 3 music venues'
    },
    hasHome: false,
    dailyRent: 60,
    happiness: 50,
    housingPreference: 'any',
    maxNeighbors: 1
  },
  { 
    id: 10, 
    name: 'dr. solar', 
    avatar: '👨‍🔬', 
    trait: 'scientific', 
    likes: 'solar panels', 
    dislikes: 'pollution',
    unlocked: false,
    unlockCondition: {
      type: 'building',
      buildingId: 'solar_panel',
      count: 5,
      description: 'build 5 solar panels'
    },
    hasHome: false,
    dailyRent: 50,
    happiness: 85,
    housingPreference: 'house',
    maxNeighbors: 1
  },
  { 
    id: 11, 
    name: 'the silent gardener', 
    avatar: '👺', 
    trait: 'mysterious', 
    likes: 'parks', 
    dislikes: 'technology',
    unlocked: false,
    unlockCondition: {
      type: 'building',
      buildingId: 'park',
      count: 4,
      description: 'build 4 parks'
    },
    hasHome: false,
    dailyRent: 70,
    happiness: 60,
    housingPreference: 'house',
    maxNeighbors: 1
  },
  { 
    id: 12, 
    name: 'time traveler joe', 
    avatar: '🕰️', 
    trait: 'temporal', 
    likes: 'libraries', 
    dislikes: 'clocks',
    unlocked: false,
    unlockCondition: {
      type: 'day',
      day: 50,
      description: 'survive 50 days'
    },
    hasHome: false,
    dailyRent: 100,
    happiness: 100,
    housingPreference: 'any',
    maxNeighbors: 3
  }
];