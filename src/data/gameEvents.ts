import type { GameEvent, Building, WeatherType } from "../types/game";

export interface BuildingEfficiency {
  id: string;
  buildingId: string;
  efficiency: number;
  lastMaintenance: number;
  maintenanceCost: number;
  degradationRate: number;
  repairCost: number;
}

export interface NaturalDisaster {
  id: string;
  name: string;
  description: string;
  probability: number;
  severity: 'minor' | 'moderate' | 'severe' | 'catastrophic';
  effects: {
    buildingDamage?: number;
    powerOutage?: boolean;
    waterShortage?: boolean;
    coinLoss?: number;
    affectedBuildingTypes?: string[];
    duration?: number;
  };
  weatherTriggers?: WeatherType[];
  seasonalMultiplier?: Record<string, number>;
  preventionMethods?: string[];
  recoveryTime: number;
}

export interface EnvironmentalImpact {
  pollution: number;
  greenery: number;
  sustainability: number;
  effects: {
    happinessModifier: number;
    healthModifier: number;
    tourismModifier: number;
  };
}

export interface CityService {
  id: string;
  name: string;
  type: 'police' | 'fire' | 'hospital' | 'education' | 'transport';
  coverage: number;
  effectiveness: number;
  maintenanceCost: number;
  upgradeOptions: ServiceUpgrade[];
}

export interface ServiceUpgrade {
  id: string;
  name: string;
  cost: number;
  effects: {
    coverageIncrease?: number;
    effectivenessIncrease?: number;
    maintenanceCostReduction?: number;
  };
}

export interface TradeRoute {
  id: string;
  destination: string;
  goods: TradeGood[];
  relationship: number;
  distance: number;
  travelTime: number;
  isActive: boolean;
}

export interface TradeGood {  id: string;
  name: string;
  basePrice: number;
  demand: number;
  supply: number;
  category: 'resources' | 'goods' | 'luxury' | 'technology';
}

export interface ResearchNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  researchTime: number;
  prerequisites: string[];
  effects: {
    unlocksBuildings?: string[];
    improvesEfficiency?: { buildingType: string; bonus: number }[];
    reducesDisasterRisk?: number;
    increasesIncome?: number;
  };
  category: 'technology' | 'environment' | 'social' | 'economic';
}

export const NATURAL_DISASTERS: NaturalDisaster[] = [
  {
    id: 'power_surge',
    name: 'Power Surge',
    description: 'Electrical surge damages power-dependent buildings',
    probability: 0.05,
    severity: 'minor',
    effects: {
      buildingDamage: 10,
      affectedBuildingTypes: ['tech_hub', 'charging_station', 'factory'],
      duration: 1
    },
    weatherTriggers: ['stormy'],
    recoveryTime: 1
  },
  {
    id: 'water_main_break',
    name: 'Water Main Break',
    description: 'Major water pipe failure causes shortages',
    probability: 0.03,
    severity: 'moderate',
    effects: {
      waterShortage: true,
      coinLoss: 200,
      duration: 2
    },
    recoveryTime: 3
  },
  {
    id: 'severe_storm',
    name: 'Severe Storm',
    description: 'Powerful storm damages buildings and infrastructure',
    probability: 0.02,
    severity: 'severe',
    effects: {
      buildingDamage: 25,
      powerOutage: true,
      coinLoss: 500,
      duration: 3
    },
    weatherTriggers: ['stormy'],
    seasonalMultiplier: { winter: 1.5, autumn: 1.2 },
    recoveryTime: 5
  },
  {
    id: 'earthquake',
    name: 'Earthquake',
    description: 'Ground shaking damages all buildings',
    probability: 0.008,
    severity: 'catastrophic',
    effects: {
      buildingDamage: 40,
      powerOutage: true,
      waterShortage: true,
      coinLoss: 1500,
      duration: 7
    },
    recoveryTime: 14
  },
  {
    id: 'cyber_attack',
    name: 'Cyber Attack',
    description: 'Digital attack targets tech infrastructure',
    probability: 0.015,
    severity: 'moderate',
    effects: {
      buildingDamage: 5,
      affectedBuildingTypes: ['tech_hub', 'smart_grid', 'automated_factory'],
      coinLoss: 300,
      duration: 2
    },
    recoveryTime: 3
  },
  {
    id: 'supply_shortage',
    name: 'Supply Shortage',
    description: 'Critical materials become unavailable',
    probability: 0.04,
    severity: 'minor',
    effects: {
      coinLoss: 100,
      duration: 3
    },
    recoveryTime: 2
  }
];

export const DYNAMIC_EVENTS: GameEvent[] = [
  {
    id: 'efficiency_audit',
    title: 'City Efficiency Audit',
    description: 'Government inspectors evaluate city efficiency',
    options: [
      {
        text: 'Invest in upgrades (-500 coins)',
        coins: -500,
        outcome: 'All buildings receive 10% efficiency boost',
        neighborEffects: []
      },
      {
        text: 'Accept efficiency fine (-200 coins)',
        coins: -200,
        outcome: 'Small fine paid, no improvements',
        neighborEffects: []
      }
    ]
  },
  {
    id: 'green_initiative',
    title: 'Green Energy Initiative',
    description: 'Opportunity to join renewable energy program',
    options: [
      {
        text: 'Join program (-300 coins)',
        coins: -300,
        outcome: 'Solar panels produce 20% more energy',
        neighborEffects: []
      },
      {
        text: 'Decline participation',
        coins: 0,
        outcome: 'No changes made',
        neighborEffects: []
      }
    ]
  },
  {
    id: 'tourism_boom',
    title: 'Tourism Boom',
    description: 'Media attention brings visitors to your city',
    options: [
      {
        text: 'Build tourist attractions (-400 coins)',
        coins: -400,
        outcome: 'Entertainment buildings earn 50% more for 5 days',
        neighborEffects: []
      },
      {
        text: 'Ignore the opportunity',
        coins: 0,
        outcome: 'Tourism fades quickly',
        neighborEffects: []
      }
    ]
  },
  {
    id: 'innovation_grant',
    title: 'Innovation Grant',
    description: 'Tech company offers development grant',
    options: [
      {
        text: 'Accept grant (+800 coins)',
        coins: 800,
        outcome: 'Funding received, tech buildings more efficient',
        neighborEffects: []
      },
      {
        text: 'Negotiate better terms (+500 coins)',
        coins: 500,
        outcome: 'Moderate funding with flexibility',
        neighborEffects: []
      }
    ]
  }
];

export const calculateBuildingEfficiency = (
  building: Building,
  lastMaintenance: number,
  currentDay: number
): number => {
  const daysSinceMaintenance = currentDay - lastMaintenance;
  const baseDegradation = 1;
  
  let degradationRate = baseDegradation;
  
  if (building.id.includes('tech')) {
    degradationRate = 1.5;
  } else if (building.id.includes('park') || building.id.includes('garden')) {
    degradationRate = 0.5;
  }
  
  const efficiency = Math.max(20, 100 - (daysSinceMaintenance * degradationRate));
  return Math.round(efficiency);
};

export const calculateEnvironmentalImpact = (buildings: Building[]): EnvironmentalImpact => {
  let pollution = 0;
  let greenery = 0;
    buildings.forEach(building => {
    if (building.id === 'power_plant') pollution += 15;
    if (building.id === 'factory') pollution += 10;
    if (building.energyUsage && building.energyUsage > 50) pollution += 3;
    
    if (building.id === 'park') greenery += 20;
    if (building.id === 'garden') greenery += 15;
    if (building.id === 'solar_panel') greenery += 5;
    if (building.id === 'wind_turbine') greenery += 8;
  });
  
  pollution = Math.min(100, pollution);
  greenery = Math.min(100, greenery);
  
  const sustainability = Math.max(0, greenery - pollution);
  
  return {
    pollution,
    greenery,
    sustainability,
    effects: {
      happinessModifier: sustainability * 0.1,
      healthModifier: (greenery - pollution) * 0.05,
      tourismModifier: sustainability * 0.15
    }
  };
};

export const calculateDisasterProbability = (
  disaster: NaturalDisaster,
  weather: WeatherType,
  season: string,
  cityInfrastructure: number
): number => {
  let probability = disaster.probability;
  
  if (disaster.weatherTriggers?.includes(weather)) {
    probability *= 2;
  }
  
  if (disaster.seasonalMultiplier?.[season]) {
    probability *= disaster.seasonalMultiplier[season];
  }
  
  const infrastructureReduction = cityInfrastructure * 0.001;
  probability = Math.max(0.001, probability - infrastructureReduction);
  
  return probability;
};

export const calculateServiceEffectiveness = (
  services: CityService[],
  buildings: Building[]
): Record<string, number> => {
  const effectiveness: Record<string, number> = {
    safety: 0,
    health: 0,
    education: 0,
    transport: 0
  };
  
  services.forEach(service => {
    const coverage = Math.min(1, service.coverage / buildings.length);
    const serviceEffect = (service.effectiveness / 100) * coverage;
    
    switch (service.type) {
      case 'police':
        effectiveness.safety += serviceEffect * 20;
        break;
      case 'fire':
        effectiveness.safety += serviceEffect * 15;
        break;
      case 'hospital':
        effectiveness.health += serviceEffect * 25;
        break;
      case 'education':
        effectiveness.education += serviceEffect * 30;
        break;
      case 'transport':
        effectiveness.transport += serviceEffect * 20;
        break;
    }
  });
  
  return effectiveness;
};

export const RESEARCH_TREE: ResearchNode[] = [
  {
    id: 'renewable_energy',
    name: 'Renewable Energy',
    description: 'Improves solar and wind power efficiency',
    cost: 1000,
    researchTime: 5,
    prerequisites: [],
    effects: {
      improvesEfficiency: [
        { buildingType: 'solar_panel', bonus: 25 },
        { buildingType: 'wind_turbine', bonus: 25 }
      ]
    },
    category: 'environment'
  },
  {
    id: 'smart_grid',
    name: 'Smart Grid Technology',
    description: 'Optimizes power distribution citywide',
    cost: 1500,
    researchTime: 7,
    prerequisites: ['renewable_energy'],
    effects: {
      unlocksBuildings: ['smart_grid_controller'],
      increasesIncome: 10
    },
    category: 'technology'
  },
  {
    id: 'disaster_preparedness',
    name: 'Disaster Preparedness',
    description: 'Reduces impact of natural disasters',
    cost: 800,
    researchTime: 4,
    prerequisites: [],
    effects: {
      reducesDisasterRisk: 30
    },
    category: 'social'
  },
  {
    id: 'urban_planning',
    name: 'Advanced Urban Planning',
    description: 'Improves building placement efficiency',
    cost: 1200,
    researchTime: 6,
    prerequisites: [],
    effects: {
      improvesEfficiency: [
        { buildingType: 'all', bonus: 10 }
      ]
    },
    category: 'social'
  }
];

export const TRADE_ROUTES: TradeRoute[] = [
  {
    id: 'metropolis',
    destination: 'Big City',
    goods: [
      { id: 'energy', name: 'Energy Credits', basePrice: 50, demand: 1.2, supply: 100, category: 'resources' },
      { id: 'technology', name: 'Tech Components', basePrice: 200, demand: 0.8, supply: 50, category: 'technology' }
    ],
    relationship: 75,
    distance: 100,
    travelTime: 2,
    isActive: true
  },
  {
    id: 'rural_town',
    destination: 'Countryside',
    goods: [
      { id: 'food', name: 'Fresh Produce', basePrice: 30, demand: 1.5, supply: 200, category: 'goods' },
      { id: 'materials', name: 'Building Materials', basePrice: 80, demand: 1.1, supply: 150, category: 'resources' }
    ],
    relationship: 60,
    distance: 50,
    travelTime: 1,
    isActive: true
  }
]; 