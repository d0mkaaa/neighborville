export interface Building {
  id: string;
  name: string;
  icon: string;
  cost: number;
  happiness: number;
  income: number;
  color: string;
  energyUsage?: number;
  residentCapacity?: number;
  occupants?: number[];
  levelRequired?: number;
  unlocked?: boolean;
  isOccupied?: boolean;
  occupantId?: number;
  residenceTier?: 'basic' | 'premium';
  occupantIds?: number[];
  lastCollectedIncome?: number;
  needsElectricity?: boolean;
  needsWater?: boolean;
  isPowerGenerator?: boolean;
  isWaterSupply?: boolean;
  powerOutput?: number;
  waterOutput?: number;
  isConnectedToPower?: boolean;
  isConnectedToWater?: boolean;
  connectedBuildings?: number[];
}

export interface UnlockCondition {
  type: 'building' | 'level' | 'happiness' | 'day' | 'achievement';
  buildingId?: string;
  count?: number;
  level?: number;
  day?: number;
  description: string;
}

export interface Neighbor {
  id: number;
  name: string;
  avatar: string;
  trait: string;
  likes: string;
  dislikes: string;
  unlocked: boolean;
  unlockCondition: UnlockCondition | null;
  hasHome?: boolean;
  houseIndex?: number;
  dailyRent?: number;
  happiness?: number;
  housingPreference?: 'house' | 'apartment' | 'any';
  maxNeighbors?: number;
}

export interface EventOption {
  text: string;
  outcome: string;
  coins: number;
  happiness: number;
  neighborEffects?: {
    neighborId?: number;
    happinessChange: number;
  }[];
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  options: EventOption[];
  weight?: number;
  minimumDay?: number;
  timeOfDay?: TimeOfDay;
  affectedNeighbors?: number[];
}

export interface ScheduledEvent {
  eventId: string;
  dayTrigger: number;
}

export interface NotificationType {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  xpReward: number;
}

export interface RecentEvent {
  id: string;
  name: string;
  happinessImpact: number;
  coinImpact: number;
  day: number;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dayDue: number;
  isPaid: boolean;
  icon: string;
}

export type TimeOfDay = 'morning' | 'day' | 'evening' | 'night';

export type WeatherType = 'sunny' | 'rainy' | 'cloudy' | 'stormy' | 'snowy';

export interface TimeBasedBonus {
  buildingId: string;
  timeOfDay: TimeOfDay;
  incomeMultiplier?: number;
  happinessMultiplier?: number;
}

export interface CoinHistoryEntry {
  day: number;
  balance: number;
  income: number;
  expenses: number;
  timestamp: number;
}

export interface GameProgress {
  playerName: string;
  coins: number;
  happiness: number;
  day: number;
  level: number;
  experience: number;
  grid: (Building | null)[];
  gridSize: number;
  neighbors: Neighbor[];
  achievements: Achievement[];
  events: ScheduledEvent[];
  unlockedNeighborIds?: number[];
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
}

export interface PowerGridState {
  totalPowerProduction: number;
  totalPowerConsumption: number;
  connectedBuildings: number[];
  powerOutages: number[];
}

export interface WaterGridState {
  totalWaterProduction: number;
  totalWaterConsumption: number;
  connectedBuildings: number[];
  waterShortages: number[];
}