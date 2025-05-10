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
    xpReward: 15
  },
  { 
    id: 'happiness_50', 
    title: 'happy place', 
    description: 'reach 50% happiness', 
    completed: false,
    xpReward: 20
  },
  { 
    id: 'happiness_75', 
    title: 'very happy place', 
    description: 'reach 75% happiness', 
    completed: false,
    xpReward: 35
  },
  { 
    id: 'happiness_100', 
    title: 'utopia', 
    description: 'reach 100% happiness', 
    completed: false,
    xpReward: 50
  },
  { 
    id: 'day_5', 
    title: 'first week', 
    description: 'reach day 5', 
    completed: false,
    xpReward: 15
  },
  { 
    id: 'day_10', 
    title: 'established', 
    description: 'reach day 10', 
    completed: false,
    xpReward: 30
  },
  { 
    id: 'day_30', 
    title: 'thriving', 
    description: 'reach day 30', 
    completed: false,
    xpReward: 60
  },
  { 
    id: 'coins_1000', 
    title: 'starter investor', 
    description: 'have 1000 coins at once', 
    completed: false,
    xpReward: 15
  },
  { 
    id: 'coins_5000', 
    title: 'savvy investor', 
    description: 'have 5000 coins at once', 
    completed: false,
    xpReward: 40
  },
  { 
    id: 'coins_10000', 
    title: 'wealthy', 
    description: 'have 10000 coins at once', 
    completed: false,
    xpReward: 80
  },
  { 
    id: 'expand_plot', 
    title: 'growth mindset', 
    description: 'expand your neighborhood plot', 
    completed: false,
    xpReward: 25
  },
  { 
    id: 'unlock_neighbor', 
    title: 'friendly face', 
    description: 'unlock a new neighbor', 
    completed: false,
    xpReward: 20
  },
  { 
    id: 'five_neighbors', 
    title: 'growing community', 
    description: 'unlock 5 neighbors', 
    completed: false,
    xpReward: 45
  },
  { 
    id: 'full_grid', 
    title: 'urban planner', 
    description: 'fill all available tiles with buildings', 
    completed: false,
    xpReward: 45
  },
  {
    id: 'level_2',
    title: 'getting started',
    description: 'reach level 2',
    completed: false,
    xpReward: 30
  },
  {
    id: 'level_5',
    title: 'experienced mayor',
    description: 'reach level 5',
    completed: false,
    xpReward: 60
  },
  {
    id: 'level_10',
    title: 'master builder',
    description: 'reach level 10',
    completed: false,
    xpReward: 100
  },
  {
    id: 'power_system',
    title: 'power expert',
    description: 'connect 5 buildings to power',
    completed: false,
    xpReward: 35
  },
  {
    id: 'water_system',
    title: 'water expert',
    description: 'connect 5 buildings to water',
    completed: false,
    xpReward: 35
  },
  {
    id: 'energy_positive',
    title: 'green energy',
    description: 'generate more power than you consume',
    completed: false,
    xpReward: 50
  },
  {
    id: 'income_500',
    title: 'profitable business',
    description: 'earn 500 coins in a single day',
    completed: false,
    xpReward: 40
  },
  {
    id: 'income_1000',
    title: 'business mogul',
    description: 'earn 1000 coins in a single day',
    completed: false,
    xpReward: 75
  },
  {
    id: 'handle_disaster',
    title: 'crisis manager',
    description: 'handle a neighborhood disaster',
    completed: false,
    xpReward: 55
  },
  {
    id: 'max_expansion',
    title: 'metropolis',
    description: 'fully expand your neighborhood to 8×8',
    completed: false,
    xpReward: 100
  },
  {
    id: 'ten_residents',
    title: 'bustling community',
    description: 'house 10 residents',
    completed: false,
    xpReward: 50
  },
  {
    id: 'pay_bills_ontime',
    title: 'responsible citizen',
    description: 'pay 10 bills on time',
    completed: false,
    xpReward: 40
  },
  {
    id: 'weather_master',
    title: 'storm survivor',
    description: 'maintain 80% happiness during a storm',
    completed: false,
    xpReward: 45
  }
];