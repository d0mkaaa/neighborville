export interface Building {
  id: string;
  name: string;
  icon: string;
  cost: number;
  happiness: number;
  income: number;
  color: string;
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
}

export interface EventOption {
  text: string;
  outcome: string;
  coins: number;
  happiness: number;
}

export interface GameEvent {
  id: string;
  title: string;
  description: string;
  options: EventOption[];
  weight?: number;
  minimumDay?: number;
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
  timeOfDay?: 'morning' | 'day' | 'evening' | 'night';
  recentEvents?: RecentEvent[];
}