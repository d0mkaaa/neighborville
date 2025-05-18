import React from 'react';

export type Building = {
  id: string;
  name: string;
  type?: string;
  color: string;
  income: number;
  vitality: number;
  happiness?: number;
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
};

export type ServiceCoverage = {
  police?: number;
  fire?: number;
  healthcare?: number;
  education?: number;
  parks?: number;
  transportation?: number;
};

export type VitalityFactor = {
  id: string;
  name: string;
  value: number;
  category: VitalityCategory;
  icon?: React.ReactNode;
  description?: string;
};

export type VitalityCategory = 
  | 'services' 
  | 'landValue' 
  | 'education' 
  | 'health' 
  | 'traffic' 
  | 'pollution' 
  | 'residential'
  | 'commercial'
  | 'industrial'
  | 'water'
  | 'power'
  | 'parks'
  | 'leisure';

export type Neighbor = {
  id: string | number;
  name: string;
  type?: string;
  dailyRent: number;
  vitality: number;
  happiness?: number;
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
  satisfaction?: number;
};

export type Neighborhood = {
  name: string;
  buildings: Building[];
  neighbors: Neighbor[];
  stats: {
    totalVitality: number;
    totalHappiness?: number;
    totalIncome: number;
    totalResidents: number;
    totalBuildings: number;
    landValue?: number;
    trafficFlow?: number;
    pollution?: number;
    education?: number;
    health?: number;
  };
};

export interface BuildingUpgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  incomeBoost: number;
  vitalityBoost: number;
  happinessBoost?: number;
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
  type: 'building' | 'level' | 'vitality' | 'happiness' | 'day' | 'achievement';
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
  vitality: number;
  happiness?: number;
  neighborEffects?: {
    neighborId?: number;
    vitalityChange: number;
    happinessChange?: number;
  }[];
  landValueChange?: number;
  educationChange?: number;
  healthChange?: number;
  pollutionChange?: number;
  trafficChange?: number;
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
  affectedCategoryVitality?: VitalityCategory[];
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
  vitalityImpact: number;
  happinessImpact?: number;
  coinImpact: number;
  day: number;
  category?: VitalityCategory;
};

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dayDue: number;
  isPaid: boolean;
  icon: string;
};

export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

export type WeatherType = 'sunny' | 'rainy' | 'cloudy' | 'stormy' | 'snowy';

export type BonusType = 
  | 'vitality' 
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
  vitalityMultiplier?: number;
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

export interface VitalitySnapshot {
  day: number;
  overall: number;
  landValue: number;
  education: number;
  health: number;
  traffic: number;
  pollution: number;
  services: number;
  timestamp: number;
};

export interface GameProgress {
  playerName: string;
  coins: number;
  vitality?: number;
  happiness?: number;
  day: number;
  level: number;
  experience: number;
  grid: (Building | null)[];
  gridSize: number;
  neighbors: Neighbor[];
  achievements: Achievement[];
  events: ScheduledEvent[];
  unlockedNeighborIds?: (number | string)[];
  gameTime?: number;
  gameMinutes?: number;
  timeOfDay?: TimeOfDay;
  recentEvents?: RecentEvent[];
  bills?: Bill[];
  energyRate?: number;
  totalEnergyUsage?: number;
  lastBillDay?: number;
  coinHistory?: CoinHistoryEntry[];
  weather?: WeatherType;
  powerGrid?: PowerGridState;
  waterGrid?: WaterGridState;
  currentSeason?: Season;
  activeSeasonalEvents?: SeasonalEvent[];
  reputation?: number;
  saveName?: string;
  saveTimestamp?: number;
  saveId?: string;
  version?: string;
  vitalityFactors?: VitalityFactor[];
  vitalityHistory?: VitalitySnapshot[];
  landValue?: number;
  education?: number;
  health?: number;
  pollution?: number;
  trafficFlow?: number;
  services?: ServiceCoverage;
};

export interface PowerGridState {
  totalPowerProduction: number;
  totalPowerConsumption: number;
  connectedBuildings: number[];
  powerOutages: number[];
};

export interface WaterGridState {
  totalWaterProduction: number;
  totalWaterConsumption: number;
  connectedBuildings: number[];
  waterShortages: number[];
};