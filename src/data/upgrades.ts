import type { BuildingUpgrade } from "../types/game";

export const buildingUpgrades: Record<string, BuildingUpgrade[]> = {
  house: [
    {
      id: "insulation",
      name: "Energy Efficient Insulation",
      description: "Reduce energy costs by 15% and improve resident satisfaction",
      cost: 500,
      incomeBoost: 0,
      satisfactionBoost: 5,
      energyEfficiency: 0.15,
      level: 1,
      icon: "🌡️"
    },
    {
      id: "solar_panels",
      name: "Solar Panels",
      description: "Generate a small income and reduce energy costs by 25%",
      cost: 800,
      incomeBoost: 5,
      satisfactionBoost: 2,
      energyEfficiency: 0.25,
      level: 2,
      icon: "☀️"
    },
    {
      id: "smart_home",
      name: "Smart Home System",
      description: "Improve resident satisfaction and reduce energy costs by 10%",
      cost: 1200,
      incomeBoost: 0,
      satisfactionBoost: 10,
      energyEfficiency: 0.10,
      level: 3,
      icon: "🏠"
    }
  ],
  apartment: [
    {
      id: "lobby_renovation",
      name: "Lobby Renovation",
      description: "Increase satisfaction of all residents",
      cost: 600,
      incomeBoost: 0,
      satisfactionBoost: 7,
      level: 1,
      icon: "🛋️"
    },
    {
      id: "laundry_room",
      name: "Laundry Room",
      description: "Generate additional income and slightly increase resident satisfaction",
      cost: 900,
      incomeBoost: 10,
      satisfactionBoost: 3,
      level: 2,
      icon: "🧺"
    },
    {
      id: "rooftop_garden",
      name: "Rooftop Garden",
      description: "Significantly increase satisfaction and generate a small income",
      cost: 1400,
      incomeBoost: 5,
      satisfactionBoost: 12,
      level: 3,
      icon: "🌱"
    }
  ],
  
  cafe: [
    {
      id: "outdoor_seating",
      name: "Outdoor Seating",
      description: "Increase maximum capacity and income",
      cost: 400,
      incomeBoost: 15,
      satisfactionBoost: 2,
      level: 1,
      icon: "☕"
    },
    {
      id: "wifi_upgrade",
      name: "Free High-Speed WiFi",
      description: "Attract more customers and increase satisfaction",
      cost: 650,
      incomeBoost: 10,
      satisfactionBoost: 5,
      level: 2,
      icon: "📡"
    },
    {
      id: "gourmet_menu",
      name: "Gourmet Menu",
      description: "Significantly increase income and satisfaction",
      cost: 1100,
      incomeBoost: 25,
      satisfactionBoost: 8,
      level: 3,
      icon: "🍰"
    }
  ],
  shop: [
    {
      id: "storefront",
      name: "Storefront Renovation",
      description: "Attract more customers and increase income",
      cost: 350,
      incomeBoost: 12,
      satisfactionBoost: 3,
      level: 1,
      icon: "🏪"
    },
    {
      id: "inventory",
      name: "Expanded Inventory",
      description: "Increase income from sales",
      cost: 700,
      incomeBoost: 20,
      satisfactionBoost: 0,
      level: 2,
      icon: "📦"
    },
    {
      id: "online_shop",
      name: "Online Shop",
      description: "Generate income 24/7 with reduced energy consumption",
      cost: 1000,
      incomeBoost: 30,
      satisfactionBoost: 5,
      energyEfficiency: 0.10,
      level: 3,
      icon: "🖥️"
    }
  ],
  
  power_plant: [
    {
      id: "efficiency",
      name: "Efficiency Upgrades",
      description: "Increase power output by 20%",
      cost: 800,
      incomeBoost: 0,
      satisfactionBoost: 0,
      level: 1,
      icon: "⚡"
    },
    {
      id: "green_tech",
      name: "Green Technology",
      description: "Reduce pollution and increase satisfaction",
      cost: 1200,
      incomeBoost: 0,
      satisfactionBoost: 8,
      level: 2,
      icon: "🌿"
    },
    {
      id: "power_grid",
      name: "Smart Power Grid",
      description: "Extend connection range to 4 tiles and increase output",
      cost: 2000,
      incomeBoost: 0,
      satisfactionBoost: 5,
      level: 3,
      icon: "🔌"
    }
  ],
  water_tower: [
    {
      id: "filters",
      name: "Advanced Filtration",
      description: "Improve water quality and resident satisfaction",
      cost: 600,
      incomeBoost: 0,
      satisfactionBoost: 5,
      level: 1,
      icon: "💧"
    },
    {
      id: "pipes",
      name: "New Pipe System",
      description: "Extend connection range to 4 tiles",
      cost: 1000,
      incomeBoost: 0,
      satisfactionBoost: 0,
      level: 2,
      icon: "🔧"
    },
    {
      id: "recycling",
      name: "Water Recycling",
      description: "Significantly increase water output and satisfaction",
      cost: 1600,
      incomeBoost: 0,
      satisfactionBoost: 10,
      level: 3,
      icon: "♻️"
    }
  ],
  
  park: [
    {
      id: "playground",
      name: "Playground",
      description: "Increase satisfaction for nearby residents",
      cost: 300,
      incomeBoost: 0,
      satisfactionBoost: 10,
      level: 1,
      icon: "🛝"
    },
    {
      id: "events",
      name: "Community Events",
      description: "Host events that generate income and satisfaction",
      cost: 500,
      incomeBoost: 15,
      satisfactionBoost: 8,
      level: 2,
      icon: "🎪"
    },
    {
      id: "botanical",
      name: "Botanical Garden",
      description: "Transform into a premium attraction with entrance fees",
      cost: 1200,
      incomeBoost: 30,
      satisfactionBoost: 15,
      level: 3,
      icon: "🌺"
    }
  ],
  cinema: [
    {
      id: "seating",
      name: "Premium Seating",
      description: "Increase ticket income and visitor satisfaction",
      cost: 700,
      incomeBoost: 18,
      satisfactionBoost: 5,
      level: 1,
      icon: "🎬"
    },
    {
      id: "food_court",
      name: "Food Court",
      description: "Significantly increase income from concessions",
      cost: 1100,
      incomeBoost: 25,
      satisfactionBoost: 3,
      level: 2,
      icon: "🍿"
    },
    {
      id: "imax",
      name: "IMAX Upgrade",
      description: "Premium movie experience with major income and satisfaction boosts",
      cost: 2000,
      incomeBoost: 40,
      satisfactionBoost: 12,
      level: 3,
      icon: "🎞️"
    }
  ],
};

export const getAvailableUpgrades = (buildingId: string, currentLevel: number = 0): BuildingUpgrade[] => {
  const baseType = buildingId.split('_')[0];
  
  const allUpgrades = buildingUpgrades[baseType] || [];
  return allUpgrades.filter(upgrade => upgrade.level === currentLevel + 1);
};

export const calculateUpgradedStats = (
  building: any, 
  upgradeIds: string[]
): { 
  income: number, 
  communitySatisfaction: number, 
  energyUsage: number 
} => {
  const baseType = building.id.split('_')[0];
  const allUpgrades = buildingUpgrades[baseType] || [];
  
  let incomeBoost = 0;
  let satisfactionBoost = 0;
  let energyEfficiency = 0;
  
  upgradeIds.forEach(upgradeId => {
    const upgrade = allUpgrades.find(u => u.id === upgradeId);
    if (upgrade) {
      incomeBoost += upgrade.incomeBoost;
      satisfactionBoost += upgrade.satisfactionBoost || 0;
      energyEfficiency += upgrade.energyEfficiency || 0;
    }
  });
  
  const energyUsage = building.energyUsage || 0;
  const reducedEnergyUsage = energyEfficiency > 0 
    ? Math.max(0, energyUsage * (1 - energyEfficiency)) 
    : energyUsage;
  
  return {
    income: building.income + incomeBoost,
    communitySatisfaction: (building.communitySatisfaction || 0) + satisfactionBoost,
    energyUsage: reducedEnergyUsage
  };
};
