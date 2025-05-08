import type { Building } from "../types/game";

export const buildings: Building[] = [
  { 
    id: 'house', 
    name: 'House', 
    icon: 'Home', 
    cost: 200, 
    happiness: 10, 
    income: 25,
    color: '#4ade80' 
  },
  { 
    id: 'park', 
    name: 'Park', 
    icon: 'Smile', 
    cost: 150, 
    happiness: 15, 
    income: 10,
    color: '#22c55e' 
  },
  { 
    id: 'cafe', 
    name: 'Café', 
    icon: 'Coffee', 
    cost: 300, 
    happiness: 12, 
    income: 40,
    color: '#f59e0b' 
  },
  { 
    id: 'library', 
    name: 'Library', 
    icon: 'Book', 
    cost: 350, 
    happiness: 8, 
    income: 15,
    color: '#8b5cf6' 
  },
  { 
    id: 'music_venue', 
    name: 'Music Venue', 
    icon: 'Music', 
    cost: 400, 
    happiness: 20, 
    income: 50,
    color: '#ec4899' 
  },
  { 
    id: 'charging_station', 
    name: 'EV Charging', 
    icon: 'Zap', 
    cost: 250, 
    happiness: 5, 
    income: 35,
    color: '#3b82f6' 
  }
];