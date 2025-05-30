import type { Achievement } from "../types/game";

export const ACHIEVEMENTS: Achievement[] = [
  // original achievements
  
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
  
  // season achievements
  { 
    id: 'first_season_change', 
    title: 'changing seasons', 
    description: 'experience your first season change', 
    completed: false,
    xpReward: 20
  },
  { 
    id: 'full_year', 
    title: 'full cycle', 
    description: 'complete a full year (all four seasons)', 
    completed: false,
    xpReward: 100
  },
  { 
    id: 'spring_event', 
    title: 'spring celebration', 
    description: 'participate in a spring seasonal event', 
    completed: false,
    xpReward: 25
  },
  { 
    id: 'summer_event', 
    title: 'summer fun', 
    description: 'participate in a summer seasonal event', 
    completed: false,
    xpReward: 25
  },
  { 
    id: 'autumn_event', 
    title: 'autumn festivities', 
    description: 'participate in an autumn seasonal event', 
    completed: false,
    xpReward: 25
  },
  { 
    id: 'winter_event', 
    title: 'winter wonderland', 
    description: 'participate in a winter seasonal event', 
    completed: false,
    xpReward: 25
  },
  { 
    id: 'all_season_events', 
    title: 'seasonal expert', 
    description: 'participate in events from all four seasons', 
    completed: false,
    xpReward: 75
  },
  
  // building upgrade achievements
  { 
    id: 'first_upgrade', 
    title: 'home improvement', 
    description: 'upgrade your first building', 
    completed: false,
    xpReward: 30
  },
  { 
    id: 'five_upgrades', 
    title: 'renovation master', 
    description: 'install 5 building upgrades', 
    completed: false,
    xpReward: 50
  },
  { 
    id: 'eco_friendly', 
    title: 'environmentalist', 
    description: 'install 3 eco-friendly upgrades', 
    completed: false,
    xpReward: 40
  },
  
  // puzzle achievements
  { 
    id: 'memory_master', 
    title: 'memory master', 
    description: 'complete 5 memory puzzles', 
    completed: false,
    xpReward: 30
  },
  { 
    id: 'sequence_master', 
    title: 'sequence master', 
    description: 'complete 5 sequence puzzles', 
    completed: false,
    xpReward: 30
  },
  { 
    id: 'connect_master', 
    title: 'blueprint master', 
    description: 'complete 5 connect puzzles', 
    completed: false,
    xpReward: 30
  },
  { 
    id: 'rotation_master', 
    title: 'rotation master', 
    description: 'complete 5 rotation puzzles', 
    completed: false,
    xpReward: 30
  },
  { 
    id: 'hard_mode', 
    title: 'challenge seeker', 
    description: 'complete 3 puzzles on hard difficulty', 
    completed: false,
    xpReward: 60
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
    id: 'storm_survivor',
    title: 'storm survivor',
    description: 'survive a severe storm',
    completed: false,
    xpReward: 45
  },
  
  // budget and finance achievements
  {
    id: 'budget_master',
    title: 'budget master',
    description: 'maintain a positive budget for 10 days',
    completed: false,
    xpReward: 60
  },
  {
    id: 'tax_collector',
    title: 'tax collector',
    description: 'enable all tax policies',
    completed: false,
    xpReward: 40
  },
  {
    id: 'efficient_services',
    title: 'efficient manager',
    description: 'achieve 90% efficiency in all services',
    completed: false,
    xpReward: 80
  },
  {
    id: 'financial_guru',
    title: 'financial guru',
    description: 'earn 2000 coins in daily revenue',
    completed: false,
    xpReward: 100
  },
  {
    id: 'infrastructure_investor',
    title: 'infrastructure investor',
    description: 'spend 1000 coins on service budgets in one day',
    completed: false,
    xpReward: 70
  },
  
  // building and infrastructure achievements
  {
    id: 'power_mogul',
    title: 'power mogul',
    description: 'build 5 power generation buildings',
    completed: false,
    xpReward: 50
  },
  {
    id: 'water_baron',
    title: 'water baron',
    description: 'build 3 water supply buildings',
    completed: false,
    xpReward: 45
  },
  {
    id: 'entertainment_district',
    title: 'entertainment district',
    description: 'build 5 entertainment buildings',
    completed: false,
    xpReward: 55
  },
  {
    id: 'commercial_hub',
    title: 'commercial hub',
    description: 'build 10 commercial buildings',
    completed: false,
    xpReward: 65
  },
  {
    id: 'residential_developer',
    title: 'residential developer',
    description: 'build 15 residential buildings',
    completed: false,
    xpReward: 60
  }
];