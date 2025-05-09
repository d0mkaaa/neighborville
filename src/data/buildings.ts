import type { Building } from "../types/game";

export const buildings: Building[] = [
  { 
    id: 'house', 
    name: 'house', 
    icon: 'Home', 
    cost: 200, 
    happiness: 10, 
    income: 25,
    color: '#10b981',
    energyUsage: 10,
    residentCapacity: 1,
    isOccupied: false
  },
  { 
    id: 'apartment', 
    name: 'apartment', 
    icon: 'Home', 
    cost: 500, 
    happiness: 15, 
    income: 60,
    color: '#3b82f6',
    energyUsage: 25,
    residentCapacity: 3,
    isOccupied: false
  },
  { 
    id: 'park', 
    name: 'park', 
    icon: 'Smile', 
    cost: 150, 
    happiness: 15, 
    income: 10,
    color: '#059669',
    energyUsage: 5
  },
  { 
    id: 'cafe', 
    name: 'café', 
    icon: 'Coffee', 
    cost: 300, 
    happiness: 12, 
    income: 40,
    color: '#d97706',
    energyUsage: 20
  },
  { 
    id: 'library', 
    name: 'library', 
    icon: 'Book', 
    cost: 350, 
    happiness: 8, 
    income: 15,
    color: '#7c3aed',
    energyUsage: 15
  },
  { 
    id: 'music_venue', 
    name: 'music venue', 
    icon: 'Music', 
    cost: 400, 
    happiness: 20, 
    income: 50,
    color: '#db2777',
    energyUsage: 30
  },
  { 
    id: 'charging_station', 
    name: 'ev charging', 
    icon: 'Zap', 
    cost: 250, 
    happiness: 5, 
    income: 35,
    color: '#3b82f6',
    energyUsage: 50
  },
  { 
    id: 'solar_panel', 
    name: 'solar panel', 
    icon: 'Sun', 
    cost: 300, 
    happiness: 10, 
    income: 15,
    color: '#eab308',
    energyUsage: -30
  }
];