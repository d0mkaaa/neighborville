import React from 'react';

export type Building = {
  id: string;
  name: string;
  type?: string;
  color: string;
  income: number;
  communitySatisfaction?: number;
  upgrades?: string[];
  level?: number;
  cost?: number;
  occupants?: string[];
  occupantIds?: any[];
  residentCapacity?: number;
  residents?: number;
  energy?: number;
  needsElectricity?: boolean;
  isConnectedToPower?: boolean;
  needsWater?: boolean;
  isConnectedToWater?: boolean;
  energyUsage?: number;
  isPowerGenerator?: boolean;
  isWaterSupply?: boolean;
  isOccupied?: boolean;
  icon?: string;
  levelRequired?: number;
  unlocked?: boolean;
  lastCollectedIncome?: number;
  currentUpgrades?: string[];
  powerOutput?: number;
  waterOutput?: number;
  connectedBuildings?: number[];
  residenceTier?: string;
  landValue?: number;
  education?: number;
  healthContribution?: number;
  trafficFlow?: number;
  pollution?: number;
  serviceCoverage?: ServiceCoverage;
  ecoFriendly?: boolean;
  wasteReduction?: number;
  jobCapacity?: number;
  description?: string;
  culturalValue?: number;
  entertainmentValue?: number;
  touristAttraction?: boolean;
  productionType?: 'extraction' | 'processing' | 'crafting' | 'manufacturing' | 'agricultural' | 'storage' | 'trading';
  produces?: { resourceId: string; quantity: number; timeMinutes: number }[];
  processesRecipes?: string[];
  lastProductionCheck?: number;
  nextProductionTime?: number;
  storageCapacity?: number;
  currentProduction?: string[];
  productionQueue?: string[];
  storedResources?: { [resourceId: string]: number };
};

export type ServiceCoverage = {
  police?: number;
  fire?: number;
  healthcare?: number;
  education?: number;
  parks?: number;
};

export type Neighbor = {
  id: string | number;
  name: string;
  type?: string;
  dailyRent: number;
  satisfaction?: number;
  preferences?: string[];
  unlocked?: boolean;
  hasHome?: boolean;
  housingPreference?: string;
  maxNeighbors?: number;
  likes?: string[] | string;
  dislikes?: string[] | string;
  houseIndex?: number;
  unlockCondition?: UnlockCondition | null;
  avatar?: string;
  trait?: string;
  education?: number;
  health?: number;
  communitySatisfaction?: number;
};

export type Neighborhood = {
  name: string;
  buildings: Building[];
  neighbors: Neighbor[];
  stats: {
    totalCommunitySatisfaction?: number;
    totalIncome: number;
    totalResidents: number;
    totalBuildings: number;
    landValue?: number;
    trafficFlow?: number;
    pollution?: number;
    education?: number;
    health?: number;
    publicTrust?: number;
    mediaReputation?: number;
    infrastructureHealth?: number;
  };
};

export interface BuildingUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  incomeBoost: number;
  satisfactionBoost?: number;
  energyEfficiency?: number;
  waterEfficiency?: number;
  level: number;
  icon: string;
  landValueBoost?: number;
  educationBoost?: number;
  healthBoost?: number;
  pollutionReduction?: number;
  trafficReduction?: number;
};

export interface UnlockCondition {
  type: 'building' | 'level' | 'happiness' | 'day' | 'achievement';
  buildingId?: string;
  count?: number;
  level?: number;
  day?: number;
  description: string;
};

export interface EventOption {
  text: string;
  outcome: string;
  coins: number;
  communitySatisfaction?: number;
  neighborEffects?: {
    neighborId?: number;
    satisfactionChange?: number;
  }[];
  landValueChange?: number;
  educationChange?: number;
  healthChange?: number;
  pollutionChange?: number;
  trafficChange?: number;
  serviceBudgetImpact?: {
    serviceId: string;
    efficiencyChange: number;
  }[];
  infraRepairCost?: number;
  publicTrustChange?: number;
  mediaAttention?: 'positive' | 'negative' | 'neutral';
};

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  options: EventOption[];
  weight?: number;
  minimumDay?: number;
  timeOfDay?: TimeOfDay;
  affectedNeighbors?: (number | string)[];
};

export interface ScheduledEvent {
  eventId: string;
  dayTrigger: number;
};

export interface NotificationType {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
};

export interface Achievement {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  xpReward: number;
};

export interface RecentEvent {
  id: string;
  name: string;
  happinessImpact?: number;
  coinImpact: number;
  day: number;
};

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dayDue: number;
  isPaid: boolean;
  icon: string;
};

export interface PowerGrid {
  totalPowerProduction: number;
  totalPowerConsumption: number;
  connectedBuildings: number[];
  powerOutages: number[];
}

export interface WaterGrid {
  totalWaterProduction: number;
  totalWaterConsumption: number;
  connectedBuildings: number[];
  waterShortages: number[];
}

export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

export type WeatherType = 'sunny' | 'rainy' | 'cloudy' | 'stormy' | 'snowy';

export type BonusType = 
  | 'happiness'
  | 'income' 
  | 'energy' 
  | 'garden' 
  | 'tourism' 
  | 'commercial' 
  | 'residential' 
  | 'education' 
  | 'reputation' 
  | 'experience'
  | 'landValue'
  | 'health'
  | 'pollution'
  | 'traffic';

export interface TimeBasedBonus {
  buildingId: string;
  timeOfDay: TimeOfDay;
  incomeMultiplier?: number;
  happinessMultiplier?: number;
};

export interface SeasonalBonus {
  type: BonusType;
  amount: number;
  description: string;
};

export interface Season {
  id: string;
  name: string;
  description: string;
  icon: string;
  colorTheme: string;
  durationDays: number;
  startDay: number;
  bonuses: SeasonalBonus[];
};

export interface SeasonalEventOption {
  id: string;
  name: string;
  cost: number;
  reward: {
    type: BonusType;
    amount: number;
  };
};

export interface SeasonalEvent {
  id: string;
  name: string;
  description: string;
  season: string;
  icon: string;
  duration: number;
  triggerDayInSeason: number;
  bonuses: SeasonalBonus[];
  options: SeasonalEventOption[];
  selectedOption?: string;
  active?: boolean;
  dayStarted?: number;
};

export interface CoinHistoryEntry {
  id: string;
  day: number;
  balance: number;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  timestamp: number;
};

export interface XPLogEntry {
  id: string;
  day: number;
  amount: number;
  source: 'achievement' | 'building' | 'event' | 'bonus' | 'other';
  description: string;
  timestamp: number;
  achievementId?: string;
  buildingId?: string;
  eventId?: string;
};

export interface PlayerResources {
  [resourceId: string]: number;
}

export interface ProductionStats {
  totalProduced: { [resourceId: string]: number };
  totalConsumed: { [resourceId: string]: number };
  productionValue: number;
  consumptionValue: number;
}

export interface ProductionQueueItem {
  id: string;
  recipeId: string;
  buildingIndex: number;
  startTime: number;
  completionTime: number;
  status: 'queued' | 'active' | 'completed';
  progress: number;
}

export interface ActiveProduction {
  id: string;
  recipeId: string;
  buildingIndex: number;
  startTime: number;
  lastCompletionTime: number;
  isActive: boolean;
  cycleCount: number;
}

export interface GameProgress {
  playerName: string;
  coins: number;
  day: number;
  level: number;
  experience: number;
  grid: (Building | null)[];
  gridSize: number;
  neighborProgress: {
    [neighborId: string]: {
      unlocked: boolean;
      hasHome: boolean;
      houseIndex?: number;
      satisfaction?: number;
    };
  };
  completedAchievements: string[];
  seenAchievements?: string[];
  gameTime: number;
  gameMinutes?: number;
  timeOfDay: TimeOfDay;
  recentEvents?: any[];
  bills?: any[];
  energyRate?: number;
  totalEnergyUsage?: number;
  lastBillDay?: number;
  coinHistory?: any[];
  weather?: WeatherType;
  powerGrid?: PowerGrid;
  waterGrid?: WaterGrid;
  xpHistory?: XPLogEntry[];
  taxPolicies?: TaxPolicy[];
  cityBudget?: CityBudget;
  playerResources?: PlayerResources;
  productionStats?: ProductionStats;
  productionQueues?: { [buildingIndex: string]: ProductionQueueItem[] };
  activeProductions?: { [buildingIndex: string]: ActiveProduction };
  
  saveName?: string;
  saveId?: string;
  saveTimestamp?: number;
  
  neighbors?: Neighbor[];
  achievements?: Achievement[];
  events?: any[];
}

export interface TaxPolicy {
  id: string;
  name: string;
  rate: number;
  category: 'residential' | 'commercial' | 'industrial' | 'luxury';
  description: string;
  happinessImpact: number;
  revenueMultiplier: number;
  enabled: boolean;
  unlockLevel: number;
}

export interface ServiceBudget {
  id: string;
  name: string;
  category: 'utilities' | 'services' | 'environment';
  baseCost: number;
  currentBudget: number;
  efficiency: number;
  coverage: number;
  description: string;
  effects: {
    energyEfficiency?: number;
    waterEfficiency?: number;
    communitySatisfaction?: number;
    landValue?: number;
    income?: number;
    pollution?: number;
    happiness?: number;
  };
  maintenanceMultiplier: number;
  qualityMultiplier: number;
  unlockLevel: number;
}

export interface CityBudget {
  totalRevenue: number;
  totalExpenses: number;
  maintenanceCosts: number;
  taxRevenue: number;
  buildingIncome: number;
  balance: number;
  dailyBalance: number;
  emergencyFund: number;
  budgetHealth: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
}

export interface CityBudgetSystem {
  totalBudget: number;
  allocatedBudget: number;
  unallocatedBudget: number;
  serviceBudgets: ServiceBudget[];
  taxRevenue: number;
  buildingIncome: number;
  totalExpenses: number;
  budgetSurplus: number;
  citizenSatisfaction: number;
  infrastructureHealth: number;
}

export interface InfrastructureUpgrade {
  id: string;
  name: string;
  category: 'power' | 'water' | 'transport' | 'telecom' | 'waste';
  cost: number;
  maintenanceCost: number;
  description: string;
  effects: {
    efficiency?: number;
    capacity?: number;
    communitySatisfaction?: number;
    pollution?: number;
  };
  prerequisite?: string;
  unlockLevel: number;
  buildTime: number;
}