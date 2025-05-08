export interface Building {
  id: string;
  name: string;
  icon: string;
  cost: number;
  happiness: number;
  income: number;
  color: string;
}

export interface Neighbor {
  id: number;
  name: string;
  avatar: string;
  trait: string;
  likes: string;
  dislikes: string;
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
}

export interface ScheduledEvent {
  eventId: string;
  dayTrigger: number;
}

export interface NotificationType {
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}