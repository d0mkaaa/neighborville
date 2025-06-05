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
    description: 'place 8 different building types', 
    completed: false,
    xpReward: 25
  },
  { 
    id: 'day_5', 
    title: 'first week', 
    description: 'reach day 15', 
    completed: false,
    xpReward: 30
  },
  { 
    id: 'day_10', 
    title: 'established', 
    description: 'reach day 30', 
    completed: false,
    xpReward: 50
  },
  { 
    id: 'day_30', 
    title: 'thriving', 
    description: 'reach day 75', 
    completed: false,
    xpReward: 100
  },
  { 
    id: 'coins_3000', 
    title: 'starter investor', 
    description: 'have 8000 coins at once', 
    completed: false,
    xpReward: 50
  },
  { 
    id: 'coins_5000', 
    title: 'savvy investor', 
    description: 'have 20000 coins at once', 
    completed: false,
    xpReward: 75
  },
  { 
    id: 'coins_10000', 
    title: 'wealthy', 
    description: 'have 50000 coins at once', 
    completed: false,
    xpReward: 150
  },
  { 
    id: 'expand_plot', 
    title: 'growth mindset', 
    description: 'expand your neighborhood plot to 6x6', 
    completed: false,
    xpReward: 40
  },
  { 
    id: 'unlock_neighbor', 
    title: 'friendly face', 
    description: 'unlock 3 neighbors', 
    completed: false,
    xpReward: 35
  },
  { 
    id: 'five_neighbors', 
    title: 'growing community', 
    description: 'unlock 12 neighbors', 
    completed: false,
    xpReward: 80
  },
  
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
  
  { 
    id: 'first_upgrade', 
    title: 'home improvement', 
    description: 'upgrade 5 buildings', 
    completed: false,
    xpReward: 45
  },
  { 
    id: 'five_upgrades', 
    title: 'renovation master', 
    description: 'install 15 building upgrades', 
    completed: false,
    xpReward: 80
  },
  { 
    id: 'eco_friendly', 
    title: 'environmentalist', 
    description: 'install 10 eco-friendly upgrades', 
    completed: false,
    xpReward: 70
  },
  
  { 
    id: 'memory_master', 
    title: 'memory master', 
    description: 'complete 15 memory puzzles', 
    completed: false,
    xpReward: 60
  },
  { 
    id: 'sequence_master', 
    title: 'sequence master', 
    description: 'complete 15 sequence puzzles', 
    completed: false,
    xpReward: 60
  },
  { 
    id: 'connect_master', 
    title: 'blueprint master', 
    description: 'complete 15 connect puzzles', 
    completed: false,
    xpReward: 60
  },
  { 
    id: 'rotation_master', 
    title: 'rotation master', 
    description: 'complete 15 rotation puzzles', 
    completed: false,
    xpReward: 60
  },
  { 
    id: 'hard_mode', 
    title: 'challenge seeker', 
    description: 'complete 10 puzzles on hard difficulty', 
    completed: false,
    xpReward: 100
  },
  { 
    id: 'full_grid', 
    title: 'urban planner', 
    description: 'fill all available tiles with buildings on an 8x8 grid', 
    completed: false,
    xpReward: 120
  },
  {
    id: 'level_2',
    title: 'getting started',
    description: 'reach level 3',
    completed: false,
    xpReward: 40
  },
  {
    id: 'level_5',
    title: 'experienced mayor',
    description: 'reach level 8',
    completed: false,
    xpReward: 80
  },
  {
    id: 'level_10',
    title: 'master builder',
    description: 'reach level 15',
    completed: false,
    xpReward: 150
  },
  {
    id: 'power_system',
    title: 'power expert',
    description: 'connect 15 buildings to power',
    completed: false,
    xpReward: 60
  },
  {
    id: 'water_system',
    title: 'water expert',
    description: 'connect 15 buildings to water',
    completed: false,
    xpReward: 60
  },
  {
    id: 'energy_positive',
    title: 'green energy',
    description: 'generate 200% more power than you consume',
    completed: false,
    xpReward: 90
  },
  {
    id: 'income_500',
    title: 'profitable business',
    description: 'earn 1500 coins in a single day',
    completed: false,
    xpReward: 70
  },
  {
    id: 'income_1000',
    title: 'business mogul',
    description: 'earn 3000 coins in a single day',
    completed: false,
    xpReward: 120
  },
  {
    id: 'handle_disaster',
    title: 'crisis manager',
    description: 'survive 3 neighborhood disasters',
    completed: false,
    xpReward: 85
  },
  {
    id: 'max_expansion',
    title: 'metropolis',
    description: 'fully expand your neighborhood to maximum size (8×8)',
    completed: false,
    xpReward: 200
  },
  {
    id: 'ten_residents',
    title: 'bustling community',
    description: 'house 25 residents',
    completed: false,
    xpReward: 100
  },
  {
    id: 'pay_bills_ontime',
    title: 'responsible citizen',
    description: 'pay 25 bills on time without missing any',
    completed: false,
    xpReward: 80
  },
  {
    id: 'storm_survivor',
    title: 'storm survivor',
    description: 'survive a severe storm',
    completed: false,
    xpReward: 45
  },
  
  {
    id: 'budget_master',
    title: 'budget master',
    description: 'maintain a positive budget for 30 consecutive days',
    completed: false,
    xpReward: 120
  },
  {
    id: 'tax_collector',
    title: 'tax collector',
    description: 'enable all tax policies and maintain them for 15 days',
    completed: false,
    xpReward: 80
  },
  {
    id: 'efficient_services',
    title: 'efficient manager',
    description: 'achieve 95% efficiency in all services simultaneously',
    completed: false,
    xpReward: 150
  },
  {
    id: 'financial_guru',
    title: 'financial guru',
    description: 'earn 5000 coins in daily revenue',
    completed: false,
    xpReward: 180
  },
  {
    id: 'infrastructure_investor',
    title: 'infrastructure investor',
    description: 'spend 3000 coins on service budgets in one day',
    completed: false,
    xpReward: 120
  },
  
  {
    id: 'power_mogul',
    title: 'power mogul',
    description: 'build 10 power generation buildings',
    completed: false,
    xpReward: 90
  },
  {
    id: 'water_baron',
    title: 'water baron',
    description: 'build 8 water supply buildings',
    completed: false,
    xpReward: 85
  },
  {
    id: 'entertainment_district',
    title: 'entertainment district',
    description: 'build 12 entertainment buildings',
    completed: false,
    xpReward: 100
  },
  {
    id: 'commercial_hub',
    title: 'commercial hub',
    description: 'build 25 commercial buildings',
    completed: false,
    xpReward: 120
  },
  {
    id: 'residential_developer',
    title: 'residential developer',
    description: 'build 30 residential buildings',
    completed: false,
    xpReward: 130
  },
  
  {
    id: 'coin_millionaire',
    title: 'millionaire mayor',
    description: 'accumulate 100,000 coins at once',
    completed: false,
    xpReward: 300
  },
  {
    id: 'day_100',
    title: 'century milestone',
    description: 'reach day 100',
    completed: false,
    xpReward: 200
  },
  {
    id: 'day_365',
    title: 'full year master',
    description: 'reach day 365 (one full year)',
    completed: false,
    xpReward: 500
  },
  {
    id: 'level_20',
    title: 'legendary mayor',
    description: 'reach level 20',
    completed: false,
    xpReward: 250
  },
  {
    id: 'perfect_efficiency',
    title: 'perfectionist',
    description: 'maintain 100% efficiency in all services for 30 days',
    completed: false,
    xpReward: 400
  },
  {
    id: 'mega_community',
    title: 'mega community',
    description: 'unlock all available neighbors (20+)',
    completed: false,
    xpReward: 300
  },
  {
    id: 'master_builder',
    title: 'construction magnate',
    description: 'place 100 buildings of any type',
    completed: false,
    xpReward: 250
  },
  {
    id: 'upgrade_master',
    title: 'upgrade virtuoso',
    description: 'install 50 building upgrades',
    completed: false,
    xpReward: 200
  },
  {
    id: 'disaster_survivor',
    title: 'disaster master',
    description: 'survive 10 natural disasters without losing any buildings',
    completed: false,
    xpReward: 350
  },
  {
    id: 'revenue_king',
    title: 'revenue emperor',
    description: 'earn 10,000 coins in a single day',
    completed: false,
    xpReward: 400
  }
];