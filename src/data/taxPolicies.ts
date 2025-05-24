import type { TaxPolicy, CityBudget, ServiceBudget, CityBudgetSystem, InfrastructureUpgrade } from '../types/game';

export const DEFAULT_TAX_POLICIES: TaxPolicy[] = [
  {
    id: 'residential_tax',
    name: 'Residential Property Tax',
    rate: 5,
    category: 'residential',
    description: 'Standard tax on residential buildings like houses and apartments',
    happinessImpact: -2,
    revenueMultiplier: 1.0,
    enabled: true
  },
  {
    id: 'commercial_tax',
    name: 'Commercial Business Tax',
    rate: 8,
    category: 'commercial',
    description: 'Tax on commercial buildings such as shops, cafes, and restaurants',
    happinessImpact: -1,
    revenueMultiplier: 1.2,
    enabled: true
  },
  {
    id: 'industrial_tax',
    name: 'Industrial Operations Tax',
    rate: 12,
    category: 'industrial',
    description: 'Tax on industrial buildings and factories',
    happinessImpact: 0,
    revenueMultiplier: 1.5,
    enabled: false
  },
  {
    id: 'luxury_tax',
    name: 'Luxury Property Tax',
    rate: 15,
    category: 'luxury',
    description: 'Additional tax on high-value properties and luxury buildings',
    happinessImpact: -5,
    revenueMultiplier: 2.0,
    enabled: false
  }
];

export const DEFAULT_SERVICE_BUDGETS: ServiceBudget[] = [
  {
    id: 'power_grid',
    name: 'Power Grid',
    category: 'utilities',
    baseCost: 50,
    currentBudget: 100,
    efficiency: 75,
    coverage: 80,
    description: 'Manage the city\'s electrical infrastructure and power distribution',
    effects: {
      energyEfficiency: 0,
      communitySatisfaction: 0
    },
    maintenanceMultiplier: 1.0,
    qualityMultiplier: 1.0
  },
  {
    id: 'water_system',
    name: 'Water & Sewage',
    category: 'utilities',
    baseCost: 40,
    currentBudget: 100,
    efficiency: 70,
    coverage: 75,
    description: 'Maintain water supply and sewage treatment facilities',
    effects: {
      waterEfficiency: 0,
      communitySatisfaction: 0
    },
    maintenanceMultiplier: 1.0,
    qualityMultiplier: 1.0
  },
  {
    id: 'public_services',
    name: 'Public Services',
    category: 'services',
    baseCost: 60,
    currentBudget: 100,
    efficiency: 65,
    coverage: 70,
    description: 'Police, fire, healthcare, and emergency services',
    effects: {
      communitySatisfaction: 0,
      landValue: 0
    },
    maintenanceMultiplier: 1.0,
    qualityMultiplier: 1.0
  },
  {
    id: 'education',
    name: 'Education System',
    category: 'services',
    baseCost: 45,
    currentBudget: 100,
    efficiency: 60,
    coverage: 65,
    description: 'Schools, libraries, and educational programs',
    effects: {
      communitySatisfaction: 0,
      landValue: 0,
      income: 0
    },
    maintenanceMultiplier: 1.0,
    qualityMultiplier: 1.0
  },
  {
    id: 'environment',
    name: 'Environmental Services',
    category: 'environment',
    baseCost: 30,
    currentBudget: 100,
    efficiency: 50,
    coverage: 50,
    description: 'Waste management, recycling, and pollution control',
    effects: {
      pollution: 0,
      communitySatisfaction: 0,
      landValue: 0
    },
    maintenanceMultiplier: 1.0,
    qualityMultiplier: 1.0
  }
];

export const INFRASTRUCTURE_UPGRADES: InfrastructureUpgrade[] = [
  {
    id: 'smart_grid',
    name: 'Smart Grid Technology',
    category: 'power',
    cost: 2000,
    maintenanceCost: 100,
    description: 'Advanced electrical grid with automated management and reduced waste',
    effects: {
      efficiency: 25,
      capacity: 20,
      communitySatisfaction: 5,
      pollution: -10
    },
    unlockLevel: 3,
    buildTime: 5
  },
  {
    id: 'water_recycling',
    name: 'Water Recycling Plant',
    category: 'water',
    cost: 1500,
    maintenanceCost: 75,
    description: 'Treat and reuse wastewater to reduce demand on fresh water sources',
    effects: {
      efficiency: 30,
      capacity: 25,
      communitySatisfaction: 3,
      pollution: -15
    },
    unlockLevel: 4,
    buildTime: 4
  },
  {
    id: 'fiber_network',
    name: 'Fiber Optic Network',
    category: 'telecom',
    cost: 1200,
    maintenanceCost: 50,
    description: 'High-speed internet infrastructure for the entire city',
    effects: {
      efficiency: 15,
      capacity: 40,
      communitySatisfaction: 8
    },
    unlockLevel: 5,
    buildTime: 3
  },
  {
    id: 'renewable_energy',
    name: 'Renewable Energy Initiative',
    category: 'power',
    cost: 3000,
    maintenanceCost: 80,
    description: 'Solar and wind power installations throughout the city',
    effects: {
      efficiency: 35,
      capacity: 30,
      communitySatisfaction: 10,
      pollution: -25
    },
    prerequisite: 'smart_grid',
    unlockLevel: 6,
    buildTime: 7
  },
  {
    id: 'waste_to_energy',
    name: 'Waste-to-Energy Plant',
    category: 'waste',
    cost: 2500,
    maintenanceCost: 120,
    description: 'Convert waste into electrical energy while reducing landfill usage',
    effects: {
      efficiency: 20,
      capacity: 15,
      communitySatisfaction: 5,
      pollution: -20
    },
    unlockLevel: 7,
    buildTime: 6
  }
];

export const calculateCityBudget = (
  buildings: any[],
  taxPolicies: TaxPolicy[],
  maintenanceCosts: number = 0
): CityBudget => {
  const buildingIncome = buildings.reduce((total, building) => total + (building.income || 0), 0);

  const buildingStats = {
    residential: 0,
    commercial: 0,
    industrial: 0,
    luxury: 0
  };
  buildings.forEach(building => {
    if (building.id === 'house' || building.id === 'apartment' || building.id === 'condo') {
      buildingStats.residential++;
      if (building.cost && building.cost > 2000) buildingStats.luxury++;
    } else if (building.id === 'cafe' || building.id === 'fancy_restaurant' || building.id === 'shopping_mall') {
      buildingStats.commercial++;
    } else if (building.id === 'tech_hub' || building.id === 'office_tower') {
      buildingStats.commercial++;
    } else if (building.type === 'factory') {
      buildingStats.industrial++;
    }
  });

  const taxRevenue = taxPolicies.reduce((total, policy) => {
    if (!policy.enabled) return total;
    const categoryBuildings = buildingStats[policy.category] || 0;
    return total + (categoryBuildings * policy.rate * policy.revenueMultiplier);
  }, 0);

  const totalRevenue = buildingIncome + taxRevenue;
  const totalExpenses = maintenanceCosts;
  const dailyBalance = totalRevenue - totalExpenses;
  const balance = dailyBalance;

  let budgetHealth: CityBudget['budgetHealth'];
  if (dailyBalance >= 100) budgetHealth = 'excellent';
  else if (dailyBalance >= 50) budgetHealth = 'good';
  else if (dailyBalance >= 0) budgetHealth = 'fair';
  else if (dailyBalance >= -50) budgetHealth = 'poor';
  else budgetHealth = 'critical';

  return {
    totalRevenue,
    totalExpenses,
    maintenanceCosts,
    taxRevenue,
    buildingIncome,
    balance,
    dailyBalance,
    emergencyFund: Math.max(0, balance * 5),
    budgetHealth
  };
};

export const updateTaxPolicy = (
  policies: TaxPolicy[],
  policyId: string,
  newRate: number
): TaxPolicy[] => {
  return policies.map(policy => 
    policy.id === policyId 
      ? { ...policy, rate: Math.max(0, Math.min(30, newRate)) }
      : policy
  );
};

export const toggleTaxPolicy = (
  policies: TaxPolicy[],
  policyId: string
): TaxPolicy[] => {
  return policies.map(policy => 
    policy.id === policyId 
      ? { ...policy, enabled: !policy.enabled }
      : policy
  );
};

export const calculateTotalHappinessImpact = (taxPolicies: TaxPolicy[]): number => {
  return taxPolicies.reduce((total, policy) => {
    if (!policy.enabled) return total;
    return total + policy.happinessImpact;
  }, 0);
};

export const calculateServiceEffects = (serviceBudgets: ServiceBudget[]) => {
  const effects = {
    communitySatisfaction: 0,
    income: 0,
    pollution: 0,
    landValue: 0,
    energyEfficiency: 0,
    waterEfficiency: 0
  };

  serviceBudgets.forEach(service => {
    const budgetMultiplier = service.currentBudget / 100;
    const qualityFactor = Math.pow(budgetMultiplier, 0.7);
    
    if (service.effects.communitySatisfaction) {
      effects.communitySatisfaction += service.effects.communitySatisfaction * qualityFactor;
    }
    if (service.effects.income) {
      effects.income += service.effects.income * qualityFactor;
    }
    if (service.effects.pollution) {
      effects.pollution += service.effects.pollution * qualityFactor;
    }
    if (service.effects.landValue) {
      effects.landValue += service.effects.landValue * qualityFactor;
    }
    if (service.effects.energyEfficiency) {
      effects.energyEfficiency += service.effects.energyEfficiency * qualityFactor;
    }
    if (service.effects.waterEfficiency) {
      effects.waterEfficiency += service.effects.waterEfficiency * qualityFactor;
    }
  });

  return effects;
};

export const updateServiceBudget = (
  serviceBudgets: ServiceBudget[],
  serviceId: string,
  newBudgetPercentage: number
): ServiceBudget[] => {
  return serviceBudgets.map(service => {
    if (service.id === serviceId) {
      const budgetMultiplier = newBudgetPercentage / 100;
      const newEfficiency = Math.min(100, Math.max(0, 
        50 + (budgetMultiplier - 0.5) * 80
      ));
      
      let happinessChange = 0;
      if (newBudgetPercentage < 80) {
        happinessChange = -Math.floor((80 - newBudgetPercentage) / 10) * 2;
      } else if (newBudgetPercentage > 120) {
        happinessChange = Math.floor((newBudgetPercentage - 120) / 20) * 1;
      }

      return {
        ...service,
        currentBudget: Math.max(50, Math.min(200, newBudgetPercentage)),
        efficiency: newEfficiency,
        effects: {
          ...service.effects,
          happiness: happinessChange
        },
        maintenanceMultiplier: budgetMultiplier,
        qualityMultiplier: budgetMultiplier
      };
    }
    return service;
  });
};

export const calculateCityBudgetSystem = (
  buildings: any[],
  taxPolicies: TaxPolicy[],
  serviceBudgets: ServiceBudget[],
  infrastructureUpgrades: string[] = []
): CityBudgetSystem => {
  const baseBudget = calculateCityBudget(buildings, taxPolicies);
  
  const totalServiceCosts = serviceBudgets.reduce((total, service) => {
    return total + (service.baseCost * service.currentBudget / 100);
  }, 0);
  
  const infrastructureCosts = infrastructureUpgrades.reduce((total, upgradeId) => {
    const upgrade = INFRASTRUCTURE_UPGRADES.find(u => u.id === upgradeId);
    return total + (upgrade?.maintenanceCost || 0);
  }, 0);
  
  const totalExpenses = totalServiceCosts + infrastructureCosts;
  const budgetSurplus = baseBudget.totalRevenue - totalExpenses;
  
  const avgServiceQuality = serviceBudgets.reduce((sum, service) => 
    sum + service.efficiency, 0) / serviceBudgets.length;
  const citizenSatisfaction = Math.min(100, avgServiceQuality);
  
  const infrastructureHealth = Math.min(100, 60 + (infrastructureUpgrades.length * 8));
  
  return {
    totalBudget: baseBudget.totalRevenue,
    allocatedBudget: totalExpenses,
    unallocatedBudget: Math.max(0, budgetSurplus),
    serviceBudgets,
    taxRevenue: baseBudget.taxRevenue,
    buildingIncome: baseBudget.buildingIncome,
    totalExpenses,
    budgetSurplus,
    citizenSatisfaction,
    infrastructureHealth
  };
};
