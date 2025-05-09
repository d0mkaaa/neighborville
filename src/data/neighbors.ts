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
    dailyRent: 25
  },
  { 
    id: 2, 
    name: 'sam johnson', 
    avatar: '👨‍🦲', 
    trait: 'creative', 
    likes: 'music venues', 
    dislikes: 'traffic',
    unlocked: true,
    unlockCondition: null,
    hasHome: false,
    dailyRent: 30
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
    dailyRent: 20
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
    dailyRent: 35
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
    dailyRent: 28
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
    dailyRent: 40
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
    dailyRent: 45
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
    dailyRent: 32
  }
];