import type { Achievement } from "../types/game";

export const ACHIEVEMENTS: Achievement[] = [
  { 
    id: 'first_building', 
    title: 'first steps', 
    description: 'place your first building', 
    completed: false,
    xpReward: 10
  },
  { 
    id: 'three_buildings', 
    title: 'small community', 
    description: 'place 3 different building types', 
    completed: false,
    xpReward: 30
  },
  { 
    id: 'happiness_50', 
    title: 'happy place', 
    description: 'reach 50% happiness', 
    completed: false,
    xpReward: 20
  },
  { 
    id: 'happiness_100', 
    title: 'utopia', 
    description: 'reach 100% happiness', 
    completed: false,
    xpReward: 50
  },
  { 
    id: 'day_10', 
    title: 'established', 
    description: 'reach day 10', 
    completed: false,
    xpReward: 30
  },
  { 
    id: 'coins_2000', 
    title: 'investor', 
    description: 'have 2000 coins at once', 
    completed: false,
    xpReward: 25
  },
  { 
    id: 'expand_plot', 
    title: 'growth mindset', 
    description: 'expand your neighborhood plot', 
    completed: false,
    xpReward: 40
  },
  { 
    id: 'unlock_neighbor', 
    title: 'friendly face', 
    description: 'unlock a new neighbor', 
    completed: false,
    xpReward: 35
  },
  { 
    id: 'full_grid', 
    title: 'urban planner', 
    description: 'fill all available tiles with buildings', 
    completed: false,
    xpReward: 45
  },
  {
    id: 'level_5',
    title: 'experienced mayor',
    description: 'reach level 5',
    completed: false,
    xpReward: 60
  },
  {
    id: 'survive_disaster',
    title: 'crisis management',
    description: 'handle a neighborhood disaster',
    completed: false,
    xpReward: 40
  },
  {
    id: 'max_expansion',
    title: 'metropolis',
    description: 'fully expand your neighborhood to 8×8',
    completed: false,
    xpReward: 100
  }
];